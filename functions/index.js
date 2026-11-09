const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();

const CASHFREE_APP_ID = defineSecret("CASHFREE_APP_ID");
const CASHFREE_SECRET_KEY = defineSecret("CASHFREE_SECRET_KEY");
const db = admin.firestore();
const API_VERSION = "2023-08-01";

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

function cleanPhone(value) {
  return String(value || "").replace(/[^0-9]/g, "").slice(-15);
}

function cashfreeConfig() {
  const appId = CASHFREE_APP_ID.value();
  const secretKey = CASHFREE_SECRET_KEY.value();
  if (!appId || !secretKey) throw new Error("Cashfree credentials are not configured.");
  const environment = String(process.env.CASHFREE_ENVIRONMENT || "sandbox").toLowerCase();
  const baseUrl = environment === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
  return { appId, secretKey, baseUrl };
}

async function cashfreeRequest(path, options = {}) {
  const { appId, secretKey, baseUrl } = cashfreeConfig();
  const response = await fetch(baseUrl + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-version": API_VERSION,
      "x-client-id": appId,
      "x-client-secret": secretKey,
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Cashfree API error:", response.status, body?.message || body?.type || "Unknown error");
    throw new Error(body?.message || "Cashfree payment request failed.");
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

exports.createCashfreeOrder = onRequest(
  { region: "asia-south1", secrets: [CASHFREE_APP_ID, CASHFREE_SECRET_KEY], maxInstances: 10, memory: "256MiB" },
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
      if (phone.length < 7) return res.status(400).json({ error: "Please add a valid phone number to your profile before recharging." });
      const orderId = "gk_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
      const order = await cashfreeRequest("/orders", {
        method: "POST",
        body: JSON.stringify({
          order_id: orderId,
          order_amount: amountRupees,
          order_currency: "INR",
          customer_details: {
            customer_id: ("gk_" + phone).slice(0, 50),
            customer_name: customerName.replace(/[^a-zA-Z0-9 .'-]/g, "").slice(0, 100) || "Devotee",
            customer_email: email || "support@gaukripa.site",
            customer_phone: phone.slice(-10)
          },
          order_meta: {
            return_url: "https://gaukripa.site/?cashfree_order_id={order_id}"
          },
          order_note: "GauKripa wallet recharge"
        })
      });
      await db.collection("cashfree_wallet_orders").doc(orderId).set({
        orderId,
        phone,
        name: customerName,
        amount: amountRupees,
        currency: "INR",
        status: "CREATED",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.json({
        order_id: order.order_id,
        payment_session_id: order.payment_session_id,
        environment: String(process.env.CASHFREE_ENVIRONMENT || "sandbox").toLowerCase() === "production" ? "production" : "sandbox"
      });
    } catch (error) {
      console.error("Cashfree order creation failed:", error);
      return res.status(500).json({ error: error.message || "Unable to create Cashfree payment order." });
    }
  }
);

exports.verifyCashfreePayment = onRequest(
  { region: "asia-south1", secrets: [CASHFREE_APP_ID, CASHFREE_SECRET_KEY], maxInstances: 10, memory: "256MiB" },
  async (req, res) => {
    if (cors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const orderId = String(req.body?.order_id || "").trim();
    const requestedPhone = cleanPhone(req.body?.phone);
    if (!orderId || requestedPhone.length < 7) {
      return res.status(400).json({ success: false, error: "Missing order or account details." });
    }
    try {
      const orderRef = db.collection("cashfree_wallet_orders").doc(orderId);
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists) return res.status(404).json({ success: false, error: "Wallet payment order was not found." });
      const savedOrder = orderSnap.data();
      if (cleanPhone(savedOrder.phone) !== requestedPhone) {
        return res.status(403).json({ success: false, error: "This payment order does not belong to this wallet." });
      }

      const [cashfreeOrder, payments] = await Promise.all([
        cashfreeRequest("/orders/" + encodeURIComponent(orderId), { method: "GET" }),
        cashfreeRequest("/orders/" + encodeURIComponent(orderId) + "/payments", { method: "GET" })
      ]);
      const successfulPayment = Array.isArray(payments)
        ? payments.find((payment) => payment.payment_status === "SUCCESS")
        : null;
      if (cashfreeOrder.order_status !== "PAID" || !successfulPayment ||
          Number(cashfreeOrder.order_amount) !== Number(savedOrder.amount) ||
          Number(successfulPayment.payment_amount) !== Number(savedOrder.amount) ||
          cashfreeOrder.order_currency !== "INR") {
        return res.status(400).json({ success: false, error: "Cashfree has not confirmed a successful payment for this order yet." });
      }

      const paymentRef = db.collection("cashfree_wallet_payments").doc(orderId);
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
          id: String(successfulPayment.cf_payment_id || orderId),
          type: "credit",
          amount,
          description: "Wallet recharge via Cashfree",
          date: new Date().toISOString(),
          paymentId: String(successfulPayment.cf_payment_id || orderId)
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
          paymentId: String(successfulPayment.cf_payment_id || ""),
          phone: requestedPhone,
          amount,
          currency: "INR",
          verified: true,
          walletCredited: true,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        tx.update(orderRef, { status: "PAID", paidAt: admin.firestore.FieldValue.serverTimestamp() });
        return { credited: true, balance: nextBalance };
      });
      return res.json({ success: true, verified: true, credited: result.credited, balance: result.balance });
    } catch (error) {
      console.error("Cashfree payment verification failed:", error);
      return res.status(500).json({ success: false, error: "Unable to verify and credit this Cashfree payment. Please contact support." });
    }
  }
);
