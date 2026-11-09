"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpayPayment = exports.createRazorpayOrder = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const razorpay_1 = __importDefault(require("razorpay"));
const crypto = __importStar(require("crypto"));
const cors_1 = __importDefault(require("cors"));
admin.initializeApp();
const db = admin.firestore();
// Define secrets stored securely in Google Cloud Secret Manager / Firebase Functions Secrets
const razorpayKeyId = (0, params_1.defineSecret)('RAZORPAY_KEY_ID');
const razorpayKeySecret = (0, params_1.defineSecret)('RAZORPAY_KEY_SECRET');
// CORS handler for cross-origin calls from GitHub Pages and localhost
const corsHandler = (0, cors_1.default)({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
});
function getRazorpayClient(keyIdVal, keySecretVal) {
    const key_id = keyIdVal || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const key_secret = keySecretVal || process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    return new razorpay_1.default({ key_id, key_secret });
}
/**
 * Extracts and verifies Firebase Auth token from Authorization header.
 * Returns decoded token or null.
 */
async function verifyAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token)
        return null;
    try {
        return await admin.auth().verifyIdToken(token);
    }
    catch (err) {
        console.warn('Firebase token verification warning:', err);
        return null;
    }
}
/**
 * Cloud Function: createRazorpayOrder
 * Creates an authorized Razorpay order for wallet recharge with minimum ₹50 requirement.
 */
exports.createRazorpayOrder = (0, https_1.onRequest)({ secrets: [razorpayKeyId, razorpayKeySecret], cors: true }, async (req, res) => {
    return corsHandler(req, res, async () => {
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed. Use POST.' });
            return;
        }
        try {
            const { amount, phone, name } = req.body;
            const numAmount = Number(amount);
            // Security Validation: Minimum recharge must be at least ₹50
            if (isNaN(numAmount) || numAmount < 50) {
                res.status(400).json({
                    error: 'Minimum wallet recharge amount is ₹50. Please enter ₹50 or more.'
                });
                return;
            }
            const cleanPhone = String(phone || '').trim() || 'default_devotee';
            const keyId = razorpayKeyId.value() || process.env.RAZORPAY_KEY_ID || '';
            const keySecret = razorpayKeySecret.value() || process.env.RAZORPAY_KEY_SECRET || '';
            if (!keyId || !keySecret) {
                res.status(500).json({
                    error: 'Razorpay credentials not configured. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
                });
                return;
            }
            const razorpay = getRazorpayClient(keyId, keySecret);
            const amountInPaise = Math.round(numAmount * 100);
            const receipt = `gk_rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const order = await razorpay.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt,
                notes: {
                    phone: cleanPhone,
                    devoteeName: name || 'Devotee',
                    purpose: 'GauKripa Sacred Wallet Recharge'
                }
            });
            // Store pending order in Firestore
            await db.collection('orders').doc(order.id).set({
                orderId: order.id,
                amount: numAmount,
                amountInPaise,
                currency: 'INR',
                phone: cleanPhone,
                name: name || 'Devotee',
                status: 'created',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            res.json({
                success: true,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId
            });
        }
        catch (err) {
            console.error('createRazorpayOrder error:', err);
            res.status(500).json({
                error: err?.message || 'Failed to create Razorpay payment order.'
            });
        }
    });
});
/**
 * Cloud Function: verifyRazorpayPayment
 * Verifies Razorpay payment signature and updates Firestore wallet using an atomic transaction.
 * Strictly prevents duplicate wallet credits.
 */
exports.verifyRazorpayPayment = (0, https_1.onRequest)({ secrets: [razorpayKeyId, razorpayKeySecret], cors: true }, async (req, res) => {
    return corsHandler(req, res, async () => {
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed. Use POST.' });
            return;
        }
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, phone, name } = req.body;
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                res.status(400).json({
                    error: 'Missing required payment verification parameters.'
                });
                return;
            }
            const keyId = razorpayKeyId.value() || process.env.RAZORPAY_KEY_ID || '';
            const keySecret = razorpayKeySecret.value() || process.env.RAZORPAY_KEY_SECRET || '';
            if (!keySecret) {
                res.status(500).json({ error: 'Razorpay secret key not configured.' });
                return;
            }
            // 1. Server-side signature verification
            const textToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
            const expectedSignature = crypto
                .createHmac('sha256', keySecret)
                .update(textToSign)
                .digest('hex');
            const isSignatureValid = crypto.timingSafeEqual(Buffer.from(expectedSignature, 'utf8'), Buffer.from(razorpay_signature, 'utf8'));
            if (!isSignatureValid) {
                console.error('Invalid signature for payment:', razorpay_payment_id);
                res.status(400).json({
                    error: 'Invalid payment signature verification failed.'
                });
                return;
            }
            // 2. Direct verification with Razorpay API
            const razorpay = getRazorpayClient(keyId, keySecret);
            let paymentDetails = null;
            try {
                paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
            }
            catch (fetchErr) {
                console.error('Razorpay fetch error:', fetchErr?.message);
                res.status(400).json({ error: `Could not verify payment with Razorpay: ${fetchErr?.message || 'Invalid payment ID'}` });
                return;
            }
            if (paymentDetails.status === 'failed') {
                res.status(400).json({
                    error: 'Payment failed on Razorpay. Wallet was not credited.'
                });
                return;
            }
            // Auto-capture if authorized
            if (paymentDetails.status === 'authorized') {
                try {
                    paymentDetails = await razorpay.payments.capture(razorpay_payment_id, paymentDetails.amount, paymentDetails.currency || 'INR');
                }
                catch (capErr) {
                    console.warn('Razorpay capture attempt note:', capErr?.message);
                }
            }
            if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
                res.status(400).json({
                    error: `Payment is in ${paymentDetails.status} state. Only confirmed payments are credited.`
                });
                return;
            }
            const paidAmount = Number(paymentDetails.amount) / 100;
            if (paidAmount < 50) {
                res.status(400).json({ error: 'Recharge amount is below the ₹50 minimum threshold.' });
                return;
            }
            const cleanPhone = String(phone || paymentDetails.notes?.phone || '').trim() || 'default_devotee';
            const devoteeName = String(name || paymentDetails.notes?.devoteeName || 'Devotee');
            // 3. Atomic Firestore transaction to prevent duplicate wallet credits
            const paymentRef = db.collection('payments').doc(razorpay_payment_id);
            const walletRef = db.collection('wallets').doc(cleanPhone);
            const orderRef = db.collection('orders').doc(razorpay_order_id);
            let finalBalance = 0;
            await db.runTransaction(async (transaction) => {
                const paymentDoc = await transaction.get(paymentRef);
                if (paymentDoc.exists && paymentDoc.data()?.status === 'success') {
                    // Duplicate callback: already credited!
                    console.log('Payment already processed previously:', razorpay_payment_id);
                    const existingWallet = await transaction.get(walletRef);
                    finalBalance = existingWallet.exists ? (existingWallet.data()?.balance || 0) : paidAmount;
                    return;
                }
                const walletDoc = await transaction.get(walletRef);
                let currentBalance = 0;
                let currentTransactions = [];
                if (walletDoc.exists) {
                    const data = walletDoc.data() || {};
                    currentBalance = Number(data.balance || 0);
                    currentTransactions = Array.isArray(data.transactions) ? data.transactions : [];
                }
                else {
                    currentBalance = 0;
                    currentTransactions = [];
                }
                finalBalance = Number((currentBalance + paidAmount).toFixed(2));
                const newTransaction = {
                    id: `tx-${razorpay_payment_id}`,
                    paymentId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                    type: 'credit',
                    amount: paidAmount,
                    description: `Razorpay Wallet Recharge (+₹${paidAmount})`,
                    date: new Date().toISOString(),
                    status: 'success'
                };
                const updatedTransactions = [newTransaction, ...currentTransactions.slice(0, 49)];
                // Update wallet
                transaction.set(walletRef, {
                    phone: cleanPhone,
                    name: devoteeName,
                    balance: finalBalance,
                    transactions: updatedTransactions,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                // Record verified payment
                transaction.set(paymentRef, {
                    paymentId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                    amount: paidAmount,
                    currency: 'INR',
                    phone: cleanPhone,
                    name: devoteeName,
                    status: 'success',
                    verifiedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                // Mark order as paid
                transaction.set(orderRef, {
                    status: 'paid',
                    paymentId: razorpay_payment_id,
                    paidAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            res.json({
                success: true,
                message: `Successfully recharged ₹${paidAmount} to your GauKripa wallet!`,
                balance: finalBalance,
                paymentId: razorpay_payment_id,
                amount: paidAmount
            });
        }
        catch (err) {
            console.error('verifyRazorpayPayment error:', err);
            res.status(500).json({
                error: err?.message || 'Failed to verify payment and update wallet.'
            });
        }
    });
});
//# sourceMappingURL=index.js.map