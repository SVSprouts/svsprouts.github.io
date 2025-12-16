(function () {
  const form = document.getElementById("feedback-form");
  if (!form || !window.firebase) return;

  const statusEl = document.getElementById("feedback-status");
  const submitBtn = document.getElementById("feedback-submit");

  const fields = {
    name: document.getElementById("feedback-name"),
    email: document.getElementById("feedback-email"),
    role: document.getElementById("feedback-role"),
    experience: document.getElementById("feedback-experience"),
    message: document.getElementById("feedback-message"),
  };

  function ensureFirebase() {
    if (firebase.apps && firebase.apps.length) return firebase.app();
    if (window.APP_CONFIG?.firebaseConfig) {
      return firebase.initializeApp(window.APP_CONFIG.firebaseConfig);
    }
    throw new Error("Firebase config missing");
  }

  function setStatus(message, type = "success") {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove("hidden", "error", "success");
    statusEl.classList.add(type === "success" ? "success" : "error");
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Sending..." : "Send feedback";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl?.classList.add("hidden");

    try {
      ensureFirebase();
      const db = firebase.firestore();

      setLoading(true);

      await db.collection("feedback").add({
        name: fields.name?.value.trim() || "",
        email: fields.email?.value.trim() || "",
        role: fields.role?.value || "",
        experience: fields.experience?.value.trim() || "",
        message: fields.message?.value.trim() || "",
        page: window.location.href,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      form.reset();
      setStatus("Thanks! Your feedback is on its way to our team.", "success");
    } catch (err) {
      console.error("Feedback submit failed", err);
      setStatus("We could not send this right now. Please try again in a moment.", "error");
    } finally {
      setLoading(false);
    }
  });
})();
