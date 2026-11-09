const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");

admin.initializeApp();

const RAZORPAY_KEY_ID = defineString("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const db = admin.firestore();

function cors(req, res) {
  const origin = req.headers.origin || "";
  const allowed = ["https://gaukripa.site", "https://www.gaukripa.site"];
  if (allowed.includes(origin)) res.set("Access-Control-Allow-Origin", origin);
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.status(204).send(""); return true; }
  return false;
}

function getRazorpay(secret) {
  if (!RAZORPAY_KEY_ID.value() || !secret) throw new Error("Razorpay is not configured.");
  return new Razorpay({ key_id: RAZORPAY_KEY_ID.value(), key_secret: secret });
}

function cleanPhone(value) {
  return String(value || "").replace(/[^0-9]/g, "").slice(-15);
}

exports.getWallet = onRequest(
  { region: "asia-south1", maxInstances: 20, memory: "256MiB" },
  async (req, res) => {
    if (cors(req, res)) return;
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const phone = cleanPhone(req.query.phone);
    if (phone.length < 7) return res.status(400).json({ error: "A valid account phone number is required." });
    try {
      const snap = await db.collection("wallets").doc(phone).get();
      const data = snap.exists ? snap.data() : {};
      return res.json({
        phone,
        name: data.name || "Devotee",
        balance: Number(data.balance || 0),
        transactions: Array.isArray(data.transactions) ? data.transactions.slice(0, 50) : []
      });
    } catch (error) {
      console.error("Wallet read failed:", error);
      return res.status(500).json({ error: "Unable to load wallet." });
    }
  }
);

exports.createRazorpayOrder = onRequest(
  { region: "asia-south1", secrets: [RAZORPAY_KEY_SECRET], maxInstances: 10, memory: "256MiB" },
  async (req, res) => {
    if (cors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
      const amountRupees = Number(req.body?.amount);
      const phone = cleanPhone(req.body?.phone);
      const customerName = String(req.body?.name || "Devotee").trim().slice(0, 80);
      if (!Number.isInteger(amountRupees) || amountRupees < 50 || amountRupees > 100000) {
        return res.status(400).json({ error: "Wallet recharge must be a whole-rupee amount of at least ₹50 (maximum ₹1,00,000)." });
      }
      if (phone.length < 7) return res.status(400).json({ error: "Please add a valid phone number to your profile before recharging." });
      const amount = amountRupees * 100;
      const order = await getRazorpay(RAZORPAY_KEY_SECRET.value()).orders.create({
        amount,
        currency: "INR",
        receipt: `gk_wallet_${Date.now()}`,
        notes: { purpose: "gaukripa_wallet_topup", phone, customerName, amountRupees: String(amountRupees) }
      });
      return res.json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: RAZORPAY_KEY_ID.value(),
        name: customerName,
        phone
      });
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      return res.status(500).json({ error: "Unable to create payment order. Please try again." });
    }
  }
);

exports.verifyRazorpayPayment = onRequest(
  { region: "asia-south1", secrets: [RAZORPAY_KEY_SECRET], maxInstances: 10, memory: "256MiB" },
  async (req, res) => {
    if (cors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, phone: requestedPhone } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Missing payment verification fields." });
    }
    try {
      const secret = RAZORPAY_KEY_SECRET.value();
      const expected = crypto.createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
      const supplied = Buffer.from(String(razorpay_signature), "hex");
      const generated = Buffer.from(expected, "hex");
      if (supplied.length !== generated.length || !crypto.timingSafeEqual(supplied, generated)) {
        return res.status(400).json({ success: false, error: "Payment signature verification failed." });
      }

      const razorpay = getRazorpay(secret);
      const [order, payment] = await Promise.all([
        razorpay.orders.fetch(razorpay_order_id),
        razorpay.payments.fetch(razorpay_payment_id)
      ]);
      const phone = cleanPhone(requestedPhone);
      const orderPhone = cleanPhone(order.notes?.phone);
      if (order.id !== payment.order_id || order.id !== razorpay_order_id ||
          order.notes?.purpose !== "gaukripa_wallet_topup" ||
          !phone || phone !== orderPhone ||
          payment.status !== "captured" || payment.currency !== "INR" ||
          Number(payment.amount) !== Number(order.amount) || Number(order.amount) < 5000 ||
          Number(order.amount) !== Number(order.notes?.amountRupees) * 100) {
        return res.status(400).json({ success: false, error: "Payment details do not match this wallet recharge." });
      }

      const paymentRef = db.collection("razorpay_payments").doc(razorpay_payment_id);
      const walletRef = db.collection("wallets").doc(phone);
      const result = await db.runTransaction(async (tx) => {
        const paymentSnap = await tx.get(paymentRef);
        const walletSnap = await tx.get(walletRef);
        if (paymentSnap.exists && paymentSnap.data()?.walletCredited === true) {
          const existing = walletSnap.exists ? walletSnap.data() : {};
          return { alreadyCredited: true, balance: Number(existing.balance || 0) };
        }
        const wallet = walletSnap.exists ? walletSnap.data() : {};
        const amountRupees = Number(order.amount) / 100;
        const nextBalance = Number((Number(wallet.balance || 0) + amountRupees).toFixed(2));
        const transaction = {
          id: razorpay_payment_id,
          type: "credit",
          amount: amountRupees,
          description: "Wallet recharge via Razorpay",
          date: new Date().toISOString(),
          paymentId: razorpay_payment_id
        };
        const transactions = Array.isArray(wallet.transactions) ? wallet.transactions : [];
        tx.set(walletRef, {
          phone,
          name: String(order.notes?.customerName || wallet.name || "Devotee"),
          balance: nextBalance,
          transactions: [transaction, ...transactions].slice(0, 100),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        tx.set(paymentRef, {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          phone,
          amount: amountRupees,
          currency: "INR",
          verified: true,
          walletCredited: true,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return { alreadyCredited: false, balance: nextBalance };
      });

      return res.json({ success: true, verified: true, credited: !result.alreadyCredited, balance: result.balance });
    } catch (error) {
      console.error("Razorpay verification/credit failed:", error);
      return res.status(500).json({ success: false, error: "Unable to verify and credit this payment. Contact support with your Razorpay payment ID." });
    }
  }
);
