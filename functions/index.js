const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();

const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const db = admin.firestore();

function cors(req, res) {
  const origin = req.headers.origin || "";
  const allowed = [
    "https://gaukripa.site",
    "https://www.gaukripa.site",
    "https://lumsiconline.github.io",
    "https://gau-kripa.lumsic-online.workers.dev"
  ];
  const isAllowed = !origin || allowed.includes(origin) || origin.startsWith("http://localhost:") || origin.includes(".run.app");
  if (isAllowed) {
    res.set("Access-Control-Allow-Origin", origin || "*");
  }
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.status(204).send(""); return true; }
  return false;
}

function cleanPhone(value) {
  return String(value || "").replace(/[^0-9]/g, "").slice(-15);
}

function razorpayCredentials() {
  const keyId = RAZORPAY_KEY_ID.value();
  const keySecret = RAZORPAY_KEY_SECRET.value();
  if (!keyId || !keySecret) throw new Error("Razorpay credentials are not configured in Firebase Secret Manager.");
  return { keyId, keySecret };
}

async function razorpayRequest(path, options = {}) {
  const { keyId, keySecret } = razorpayCredentials();
  const auth = Buffer.from(keyId + ":" + keySecret).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1" + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + auth,
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Razorpay API error:", response.status, body?.error?.description || "Unknown error");
    throw new Error(body?.error?.description || "Razorpay payment request failed.");
  }
  return body;
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
  { region: "asia-south1", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], maxInstances: 10, memory: "256MiB" },
  async (req, res) => {
    if (cors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
      const amountRupees = Number(req.body?.amount);
      const phone = cleanPhone(req.body?.phone);
      const customerName = String(req.body?.name || "Devotee").trim().slice(0, 80);
      const email = String(req.body?.email || "").trim().slice(0, 120);
      if (!Number.isInteger(amountRupees) || amountRupees < 50 || amountRupees > 100000) {
        return res.status(400).json({ error: "Wallet recharge must be a whole-rupee amount of at least ₹50 (maximum ₹1,00,000)." });
      }
      if (phone.length < 10) return res.status(400).json({ error: "Please add a valid 10-digit mobile number to your profile before recharging." });

      const order = await razorpayRequest("/orders", {
        method: "POST",
        body: JSON.stringify({
          amount: amountRupees * 100,
          currency: "INR",
          receipt: ("gk_" + Date.now()).slice(0, 40),
          notes: {
            purpose: "GauKripa wallet recharge",
            wallet_phone: phone,
            customer_name: customerName,
            customer_email: email
          }
        })
      });

      await db.collection("razorpay_wallet_orders").doc(order.id).set({
        orderId: order.id,
        phone,
        name: customerName,
        email,
        amount: amountRupees,
        amountPaise: amountRupees * 100,
        currency: "INR",
        status: "created",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const { keyId } = razorpayCredentials();
      return res.json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: keyId });
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      return res.status(500).json({ error: error.message || "Unable to create Razorpay payment order." });
    }
  }
);

exports.verifyRazorpayPayment = onRequest(
  { region: "asia-south1", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], maxInstances: 10, memory: "256MiB" },
  async (req, res) => {
    if (cors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const orderId = String(req.body?.order_id || "").trim();
    const paymentId = String(req.body?.payment_id || "").trim();
    const signature = String(req.body?.signature || "").trim();
    const requestedPhone = cleanPhone(req.body?.phone);
    if (!orderId || !paymentId || !signature || requestedPhone.length < 10) {
      return res.status(400).json({ success: false, error: "Missing payment or wallet account details." });
    }

    try {
      const orderRef = db.collection("razorpay_wallet_orders").doc(orderId);
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists) return res.status(404).json({ success: false, error: "Wallet payment order was not found." });
      const savedOrder = orderSnap.data();
      if (cleanPhone(savedOrder.phone) !== requestedPhone) {
        return res.status(403).json({ success: false, error: "This payment order does not belong to this wallet." });
      }

      const { keySecret } = razorpayCredentials();
      const expected = crypto.createHmac("sha256", keySecret).update(orderId + "|" + paymentId).digest("hex");
      const expectedBuffer = Buffer.from(expected, "utf8");
      const receivedBuffer = Buffer.from(signature, "utf8");
      if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
        return res.status(400).json({ success: false, error: "Razorpay payment signature is invalid." });
      }

      const payment = await razorpayRequest("/payments/" + encodeURIComponent(paymentId), { method: "GET" });
      if (payment.order_id !== orderId || Number(payment.amount) !== Number(savedOrder.amountPaise) ||
          payment.currency !== "INR" || payment.status !== "captured" || payment.captured !== true) {
        return res.status(400).json({ success: false, error: "Razorpay has not confirmed a captured payment for this exact order and amount. Ensure auto-capture is enabled in Razorpay." });
      }

      const paymentRef = db.collection("razorpay_wallet_payments").doc(paymentId);
      const walletRef = db.collection("wallets").doc(requestedPhone);
      const result = await db.runTransaction(async (tx) => {
        const paymentSnap = await tx.get(paymentRef);
        const walletSnap = await tx.get(walletRef);
        if (paymentSnap.exists && paymentSnap.data()?.walletCredited === true) {
          const existingWallet = walletSnap.exists ? walletSnap.data() : {};
          return { credited: false, balance: Number(existingWallet.balance || 0) };
        }
        const wallet = walletSnap.exists ? walletSnap.data() : {};
        const amount = Number(savedOrder.amount);
        const nextBalance = Number((Number(wallet.balance || 0) + amount).toFixed(2));
        const transaction = {
          id: paymentId,
          type: "credit",
          amount,
          description: "Wallet recharge via Razorpay",
          date: new Date().toISOString(),
          paymentId
        };
        const transactions = Array.isArray(wallet.transactions) ? wallet.transactions : [];
        tx.set(walletRef, {
          phone: requestedPhone,
          name: String(savedOrder.name || wallet.name || "Devotee"),
          balance: nextBalance,
          transactions: [transaction, ...transactions].slice(0, 100),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        tx.set(paymentRef, {
          orderId,
          paymentId,
          phone: requestedPhone,
          amount,
          currency: "INR",
          verified: true,
          walletCredited: true,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        tx.update(orderRef, { status: "captured", paymentId, paidAt: admin.firestore.FieldValue.serverTimestamp() });
        return { credited: true, balance: nextBalance };
      });
      return res.json({ success: true, verified: true, credited: result.credited, balance: result.balance });
    } catch (error) {
      console.error("Razorpay payment verification failed:", error);
      return res.status(500).json({ success: false, error: "Unable to verify and credit this Razorpay payment. Please contact support." });
    }
  }
);
