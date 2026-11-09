const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");

admin.initializeApp();

const RAZORPAY_KEY_ID = defineString("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");

function cors(req, res) {
  const origin = req.headers.origin || "";
  const allowed = ["https://gaukripa.site", "https://www.gaukripa.site"];
  if (allowed.includes(origin)) res.set("Access-Control-Allow-Origin", origin);
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.status(204).send(""); return true; }
  return false;
}

function getRazorpay(secret) {
  if (!RAZORPAY_KEY_ID.value() || !secret) throw new Error("Razorpay is not configured.");
  return new Razorpay({ key_id: RAZORPAY_KEY_ID.value(), key_secret: secret });
}

exports.createRazorpayOrder = onRequest(
  { region: "asia-south1", secrets: [RAZORPAY_KEY_SECRET], maxInstances: 10, memory: "256MiB" },
  async (req, res) => {
    if (cors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    try {
      const amountRupees = Number(req.body?.amount);
      if (!Number.isFinite(amountRupees) || amountRupees < 1 || !Number.isInteger(amountRupees)) {
        return res.status(400).json({ error: "Amount must be a whole number of at least ₹1." });
      }
      const amount = amountRupees * 100;
      const order = await getRazorpay(RAZORPAY_KEY_SECRET.value()).orders.create({
        amount,
        currency: "INR",
        receipt: `gk_${Date.now()}`,
      });
      return res.json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: RAZORPAY_KEY_ID.value() });
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      return res.status(500).json({ error: "Unable to create payment order. Please try again." });
    }
  }
);

exports.verifyRazorpayPayment = onRequest(
  { region: "asia-south1", secrets: [RAZORPAY_KEY_SECRET], maxInstances: 10 },
  async (req, res) => {
    if (cors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Missing payment verification fields." });
    }
    try {
      const expected = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET.value())
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      const supplied = Buffer.from(String(razorpay_signature), "hex");
      const generated = Buffer.from(expected, "hex");
      if (supplied.length !== generated.length || !crypto.timingSafeEqual(supplied, generated)) {
        return res.status(400).json({ success: false, error: "Payment signature verification failed." });
      }
      await admin.firestore().collection("razorpay_payments").doc(razorpay_payment_id).set({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        verified: true,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.json({ success: true, verified: true });
    } catch (error) {
      console.error("Razorpay verification failed:", error);
      return res.status(500).json({ success: false, error: "Unable to verify payment." });
    }
  }
);
