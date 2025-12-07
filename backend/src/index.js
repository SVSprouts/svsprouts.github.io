// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripeLib = require("stripe");

admin.initializeApp();
const db = admin.firestore();

// Use functions:config:set stripe.secret_key="sk_live_..." stripe.webhook_secret="whsec_..."
const stripe = stripeLib(functions.config().stripe.secret_key);

// Callable to create a Checkout Session
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const priceId = data.priceId;
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
    success_url: "https://YOUR_GITHUB_PAGES_URL/#/success",
    cancel_url: "https://YOUR_GITHUB_PAGES_URL/#/cancel",
    metadata: {
      firebaseUid: uid,
    },
  });

  return { id: session.id };
});

// Stripe webhook to mark user as paid
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
      if (uid) {
        await db.collection("users").doc(uid).set(
          {
            subscriptionStatus: "paid",
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
