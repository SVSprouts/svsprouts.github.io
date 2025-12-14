// FEATURE: Pricing waitlist form with Firestore capture
(function () {
  const CONTAINER_ID = "feature-stripe-pricing-container";
  const STYLE_ID = "feature-pricing-waitlist-style";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* FEATURE: pricing waitlist block */
      .feature-waitlist {
        margin-top: 20px;
        padding: 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
      }
      .feature-waitlist h4 {
        margin: 0 0 8px;
        font-size: 1.1rem;
      }
      .feature-waitlist p {
        margin: 0 0 12px;
        color: #475569;
      }
      .feature-waitlist form {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .feature-waitlist input[type="email"] {
        flex: 1 1 240px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid #cbd5e1;
        font-size: 1rem;
      }
      .feature-waitlist .feature-status {
        margin-top: 8px;
        font-size: 0.95rem;
      }
      .feature-waitlist .success {
        color: #0f9d58;
      }
      .feature-waitlist .error {
        color: #b91c1c;
      }
    `;
    document.head.appendChild(style);
  }

  function getContainer() {
    const pricingSection = document.querySelector(".pricing-hero");
    if (!pricingSection) return null;
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
      container = document.createElement("div");
      container.id = CONTAINER_ID;
      pricingSection.appendChild(container);
    }
    return container;
  }

  function buildForm(container) {
    const block = document.createElement("div");
    block.className = "feature-waitlist";

    const title = document.createElement("h4");
    title.textContent = "Join the Sprouts launch list below.";

    const copy = document.createElement("p");
    copy.textContent = "While we prepare the full experience, families can begin with Sprouts Basic.";

    const copy2 = document.createElement("p");
    copy2.textContent = "Initial 100 Sprouts Basic subscribers will get free upgrades to Sprouts Plan when it launches!";

    const form = document.createElement("form");
    form.noValidate = true;

    const input = document.createElement("input");
    input.type = "email";
    input.required = true;
    input.placeholder = "you@example.com";
    input.autocomplete = "email";

    const btn = document.createElement("button");
    btn.type = "submit";
    btn.className = "pill-btn filled";
    btn.textContent = "Join waitlist";

    const status = document.createElement("div");
    status.className = "feature-status";
    status.style.minHeight = "20px";

    form.appendChild(input);
    form.appendChild(btn);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!input.value.trim()) {
        status.textContent = "Please enter an email.";
        status.className = "feature-status error";
        return;
      }
      if (!window.firebase?.firestore) {
        status.textContent = "Unable to save right now. Please try again.";
        status.className = "feature-status error";
        return;
      }

      btn.disabled = true;
      status.textContent = "Saving...";
      status.className = "feature-status";

      try {
        await window.firebase.firestore().collection("waitingList").add({
          email: input.value.trim(),
          source: "pricing",
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        });
        status.textContent = "You're on the list! We'll keep you posted.";
        status.className = "feature-status success";
        form.reset();
      } catch (err) {
        console.error("FEATURE waitlist save failed", err);
        status.textContent = "Could not save. Please try again.";
        status.className = "feature-status error";
      } finally {
        btn.disabled = false;
      }
    });

    block.appendChild(title);
    block.appendChild(copy);
    block.appendChild(copy2);
    block.appendChild(form);
    block.appendChild(status);

    container.appendChild(block);
  }

  function init() {
    ensureStyles();
    const container = getContainer();
    if (!container) return;
    if (container.querySelector(".feature-waitlist")) return;
    buildForm(container);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
