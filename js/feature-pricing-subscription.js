// FEATURE: Mark user as Basic after successful payment
(function () {
  const PLAN_PARAM = "plan";
  const BASIC_VALUE = "basic";

  function ensureFirebase() {
    if (!window.firebase || !window.APP_CONFIG?.firebaseConfig) return null;
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(window.APP_CONFIG.firebaseConfig);
    }
    return {
      auth: window.firebase.auth(),
      db: window.firebase.firestore(),
    };
  }

  function hasBasicParam() {
    const params = new URLSearchParams(window.location.search);
    const plan = (params.get(PLAN_PARAM) || "").toLowerCase();
    return plan === BASIC_VALUE;
  }

  async function setBasicStatus(db, uid) {
    if (!db || !uid) return;
    try {
      await db
        .collection("users")
        .doc(uid)
        .set(
          {
            subscriptionStatus: "basic",
            subscriptionPlan: "sprouts-basic",
            lastActive: window.firebase.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      console.log("FEATURE: subscriptionStatus set to basic for user", uid);
    } catch (err) {
      console.error("FEATURE: failed to set subscriptionStatus basic", err);
    }
  }

  function init() {
    if (!hasBasicParam()) return;
    const services = ensureFirebase();
    if (!services) return;
    const { auth, db } = services;
    auth.onAuthStateChanged((user) => {
      if (!user) return;
      setBasicStatus(db, user.uid);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
