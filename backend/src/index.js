// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripeLib = require("stripe");

admin.initializeApp();
const db = admin.firestore();

// Use functions:config:set stripe.secret_key="sk_live_..." stripe.webhook_secret="whsec_..." stripe.basic_price_id="price_basic" stripe.sprouts_price_id="price_sprouts"
const stripe = stripeLib(functions.config().stripe.secret_key);
const BASIC_PRICE_ID = functions.config().stripe.basic_price_id;
const SPROUTS_PRICE_ID = functions.config().stripe.sprouts_price_id;

// Callable to create a Checkout Session
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const priceId = data.priceId;
  const planTier = (data.planTier || "").toLowerCase();
  const normalizedTier = planTier === "basic" ? "basic" : planTier === "sprouts" ? "sprouts" : "";
  if (!priceId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing priceId");
  }

  // Get or create Stripe customer for this user
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data() || {};

  let customerId = userData.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userData.email || "",
      metadata: { firebaseUid: uid },
    });
    customerId = customer.id;
    await userRef.set({ stripeCustomerId: customerId }, { merge: true });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment", // or "subscription"
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: "https://siliconvalleysprouts.com",
    cancel_url: "https://siliconvalleysprouts.com",
    metadata: {
      firebaseUid: uid,
      priceId,
      ...(normalizedTier ? { planTier: normalizedTier } : {}),
    },
  });

  return { id: session.id };
});

function resolveTier(session) {
  const metaTier = (session.metadata?.planTier || session.metadata?.plan || "").toLowerCase();
  if (metaTier === "sprouts") return "sprouts";
  if (metaTier === "basic") return "basic";

  const metaPrice = session.metadata?.priceId;
  const priceId = metaPrice || "";

  if (SPROUTS_PRICE_ID && priceId === SPROUTS_PRICE_ID) return "sprouts";
  if (BASIC_PRICE_ID && priceId === BASIC_PRICE_ID) return "basic";

  // Default to Sprouts if unknown price/tier
  return "sprouts";
}

// Stripe webhook to mark user tier
exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = functions.config().stripe.webhook_secret;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const uid = session.metadata?.firebaseUid;
      const planTier = resolveTier(session);
      if (uid) {
        await db.collection("users").doc(uid).set(
          {
            subscriptionStatus: planTier,
            planTier,
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Error handling webhook:", err);
    res.status(500).send("Internal Server Error");
  }
});
