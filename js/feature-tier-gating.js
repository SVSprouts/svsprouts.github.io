// FEATURE: Tier Gating
(function () {
  const PAGE = (location.pathname.split("/").pop() || "").toLowerCase();
  const isWatchPage = PAGE === "watch-challenge.html";
  const isCurriculumPage = PAGE === "curriculum.html" || PAGE.startsWith("course-month");
  if (!isWatchPage && !isCurriculumPage) return;

  const TIER = {
    STARTER: "starter",
    BASIC: "basic",
    SPROUTS: "sprouts",
  };

  let tierCache = TIER.STARTER;

  function getFirebase() {
    if (!window.firebase || !window.firebase.firestore) return null;
    if (!window.firebase.apps.length && window.APP_CONFIG?.firebaseConfig) {
      window.firebase.initializeApp(window.APP_CONFIG.firebaseConfig);
    }
    return { auth: window.firebase.auth(), db: window.firebase.firestore() };
  }

  function ensureModal() {
    if (document.getElementById("feature-tier-modal")) return;
    const modal = document.createElement("div");
    modal.id = "feature-tier-modal";
    modal.style.position = "fixed";
    modal.style.inset = "0";
    modal.style.display = "none";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.background = "rgba(15,23,42,0.55)";
    modal.style.zIndex = "9999";

    const dialog = document.createElement("div");
    dialog.style.background = "#fff";
    dialog.style.borderRadius = "16px";
    dialog.style.padding = "18px";
    dialog.style.maxWidth = "360px";
    dialog.style.width = "90%";
    dialog.style.boxShadow = "0 20px 45px rgba(15,23,42,0.22)";

    const title = document.createElement("h3");
    title.textContent = "Upgrade to Unlock";
    title.style.margin = "0 0 8px";
    title.style.fontSize = "1.1rem";
    title.style.fontWeight = "800";

    const body = document.createElement("p");
    body.id = "feature-tier-modal-body";
    body.style.margin = "0 0 12px";
    body.style.color = "#475569";

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "10px";
    actions.style.flexWrap = "wrap";

    const btnPlans = document.createElement("a");
    btnPlans.href = "pricing.html";
    btnPlans.textContent = "View Plans";
    btnPlans.style.background = "#f58234";
    btnPlans.style.color = "#fff";
    btnPlans.style.border = "1px solid #ea580c";
    btnPlans.style.padding = "10px 14px";
    btnPlans.style.borderRadius = "999px";
    btnPlans.style.textDecoration = "none";
    btnPlans.style.fontWeight = "800";

    const btnClose = document.createElement("button");
    btnClose.type = "button";
    btnClose.textContent = "Not now";
    btnClose.style.padding = "10px 14px";
    btnClose.style.borderRadius = "999px";
    btnClose.style.border = "1px solid #cbd5e1";
    btnClose.style.background = "#fff";
    btnClose.style.cursor = "pointer";
    btnClose.addEventListener("click", hideModal);

    actions.append(btnPlans, btnClose);
    dialog.append(title, body, actions);
    modal.append(dialog);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) hideModal();
    });
    document.body.appendChild(modal);
  }

  function showModal(reason) {
    ensureModal();
    const body = document.getElementById("feature-tier-modal-body");
    if (body) body.textContent = reason || "Subscribe to Sprouts plan to keep watching Day 6+ videos.";
    const modal = document.getElementById("feature-tier-modal");
    if (modal) modal.style.display = "flex";
  }

  function hideModal() {
    const modal = document.getElementById("feature-tier-modal");
    if (modal) modal.style.display = "none";
  }

  function gateMonths() {
    if (!isCurriculumPage) return;
    const cards = Array.from(document.querySelectorAll(".month-card"));
    cards.forEach((card) => {
      const label = card.querySelector(".month-label") || card;
      const text = (label.textContent || "").toLowerCase();
      const match = text.match(/month\\s+(\\d+)/);
      const num = match ? Number(match[1]) : null;
      if (!num) return;
      if (tierCache === TIER.STARTER && num >= 2) {
        lockElement(card, "Month 2+ is available in Sprouts Basic and Sprouts.");
        return;
      }
      if (tierCache === TIER.BASIC && num >= 7) {
        lockElement(card, "Month 7+ is available in Sprouts.");
      }
    });
    if (PAGE.startsWith("course-month")) {
      const match = PAGE.match(/course-month(\\d+)/);
      const num = match ? Number(match[1]) : null;
      if (!num) return;
      if (tierCache === TIER.STARTER && num >= 2) {
        showModal("Month 2+ is available in Sprouts Basic and Sprouts.");
      } else if (tierCache === TIER.BASIC && num >= 7) {
        showModal("Month 7+ is available in Sprouts.");
      }
    }
  }

  function gateAdvanced() {
    if (!isCurriculumPage) return;
    if (tierCache === TIER.SPROUTS) return;
    const selectors = ['[data-lesson-type="advanced"]', ".advanced", ".advanced-lesson"];
    let targets = Array.from(document.querySelectorAll(selectors.join(",")));
    const headings = Array.from(document.querySelectorAll("h2,h3,h4")).filter((h) =>
      (h.textContent || "").toLowerCase().includes("advanced")
    );
    targets = targets.concat(headings.map((h) => h.parentElement).filter(Boolean));
    targets.forEach((el) => lockElement(el, "Advanced lessons are available in Sprouts."));
  }

  function gateWatch() {
    if (tierCache !== TIER.SPROUTS) {
      const overlay = document.getElementById("feature-tier-watch-overlay");
      if (overlay && overlay.parentElement) overlay.parentElement.removeChild(overlay);
      return;
    }
    const limit = 5;
    if (limit === Infinity) return;

    const list = document.getElementById("video-list");
    const lockMessage = "Subscribe to Sprouts plan to keep watching Day 6+ videos.";
    let currentWatchDay = 1;
    let lockModalShown = false;

    const dayLabel = document.getElementById("day-count");
    const initialDay = parseInt(dayLabel?.textContent || "1", 10) || 1;
    currentWatchDay = Math.min(initialDay, limit);

    function lockList() {
      const buttons = Array.from(document.querySelectorAll(".video-day-link, .video-day"));
      buttons.forEach((btn) => {
        const day =
          parseInt(btn.dataset.day || (btn.textContent || "").replace(/\D+/g, ""), 10) || 1;
        if (day > limit) {
          btn.dataset.locked = "true";
          btn.style.opacity = "0.6";
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            showModal(lockMessage);
          });
        } else {
          btn.addEventListener("click", () => {
            currentWatchDay = day;
            lockPlayer();
          });
        }
      });
    }

    function lockPlayer() {
      const embed = document.querySelector(".video-embed");
      if (!embed) return;
      let overlay = document.getElementById("feature-tier-watch-overlay");
      if (currentWatchDay > limit) {
        if (!overlay) {
          overlay = document.createElement("div");
          overlay.id = "feature-tier-watch-overlay";
          overlay.style.position = "absolute";
          overlay.style.inset = "0";
          overlay.style.background = "rgba(15,23,42,0.7)";
          overlay.style.color = "#fff";
          overlay.style.display = "flex";
          overlay.style.flexDirection = "column";
          overlay.style.alignItems = "center";
          overlay.style.justifyContent = "center";
          overlay.style.textAlign = "center";
          overlay.style.padding = "16px";
          overlay.style.zIndex = "20";

          const title = document.createElement("div");
          title.textContent = lockMessage;
          title.style.fontWeight = "800";
          title.style.marginBottom = "10px";

          const btn = document.createElement("a");
          btn.href = "pricing.html";
          btn.textContent = "View Plans";
          btn.style.background = "#f58234";
          btn.style.color = "#fff";
          btn.style.padding = "10px 16px";
          btn.style.borderRadius = "999px";
          btn.style.textDecoration = "none";
          btn.style.border = "1px solid #ea580c";

          overlay.append(title, btn);
          embed.style.position = "relative";
          embed.appendChild(overlay);
          if (!lockModalShown) {
            lockModalShown = true;
            showModal(lockMessage);
          }
        }
      } else if (overlay) {
        overlay.remove();
        lockModalShown = false;
      }
    }

    function attachMarkBlocker() {
      const markBtn = document.getElementById("mark-watched");
      if (!markBtn) return;
      markBtn.addEventListener(
        "click",
        (e) => {
          const dayVal = parseInt(dayLabel?.textContent || "1", 10) || 1;
          if (dayVal > limit) {
            e.preventDefault();
            e.stopPropagation();
            showModal(lockMessage);
          }
        },
        true
      );
    }

    lockList();
    lockPlayer();
    attachMarkBlocker();

    if (list) {
      const mo = new MutationObserver(() => lockList());
      mo.observe(list, { childList: true, subtree: true });
    }
  }

  async function initTier() {
    const services = getFirebase();
    if (!services) return;
    const { auth, db } = services;
    await new Promise((resolve) => {
      auth.onAuthStateChanged(async (user) => {
        if (!user) {
          tierCache = TIER.STARTER;
          resolve();
          return;
        }
        try {
          const snap = await db.collection("users").doc(user.uid).get();
          const plan = (snap.data()?.planTier || TIER.STARTER).toLowerCase();
          tierCache = [TIER.STARTER, TIER.BASIC, TIER.SPROUTS].includes(plan)
            ? plan
            : TIER.STARTER;
        } catch (err) {
          tierCache = TIER.STARTER;
        }
        resolve();
      });
    });
  }

  async function run() {
    await initTier();
    gateMonths();
    gateAdvanced();
    gateWatch();
    window.getUserTier = function () {
      return tierCache;
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
