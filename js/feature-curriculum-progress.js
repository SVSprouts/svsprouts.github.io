// FEATURE: Sync curriculum month progress from Firestore
(function () {
  const DEFAULT_PROGRESS = 0;
  const XP_PER_WEEK = 200;
  const DEFAULT_WEEKS_PER_MONTH = 4;

  function initFirebase() {
    const cfg = (window.APP_CONFIG && window.APP_CONFIG.firebaseConfig) || null;
    if (!cfg) return null;
    if (!window.firebase?.apps?.length) {
      window.firebase.initializeApp(cfg);
    }
    return {
      auth: window.firebase.auth(),
      db: window.firebase.firestore(),
    };
  }

  function getMonthRows() {
    const rows = Array.from(document.querySelectorAll(".curriculum-list .month-row"));
    return rows
      .map((row) => {
        const label = row.querySelector(".month-label");
        const match = label?.textContent?.match(/Month\s+(\d+)/i);
        if (!match) return null;
        const monthId = Number(match[1]);
        const fill = row.querySelector(".progress-bar-fill");
        const percentText = row.querySelector(".progress-percent");
        return monthId && fill && percentText ? { monthId, fill, percentText } : null;
      })
      .filter(Boolean);
  }

  function renderProgress(rows, monthsData) {
    rows.forEach(({ monthId, fill, percentText }) => {
      const progress = Math.max(
        0,
        Math.min(100, monthsData?.[monthId]?.progress ?? DEFAULT_PROGRESS)
      );
      fill.style.width = `${progress}%`;
      percentText.textContent = `${progress}%`;
    });
  }

  function computeMonthXp(monthData) {
    const weeks = monthData?.weeks || {};
    const weekCount = Object.keys(weeks).length || DEFAULT_WEEKS_PER_MONTH;
    const completedWeeks =
      Object.values(weeks).filter((w) => w && w.complete).length ||
      Math.round(((monthData?.progress ?? 0) / 100) * weekCount);
    return completedWeeks * XP_PER_WEEK;
  }

  function computeTotals(userData) {
    const months = userData?.months || {};
    let xp = 0;
    Object.values(months).forEach((month) => {
      xp += computeMonthXp(month);
    });
    const visits = userData?.courseVisits || {};
    return {
      xp,
      streak: visits.streak || 0,
      highest: visits.highest || 0,
    };
  }

  function renderXpAndStreak(userData) {
    const totals = computeTotals(userData || {});
    const xpEl = document.querySelector(".xp-text");
    const streakEl = document.querySelector(".streak-label");
    const highestEl = document.querySelector(".highest-streak");
    if (xpEl) xpEl.textContent = totals.xp.toString();
    if (streakEl) streakEl.textContent = totals.streak.toString();
    if (highestEl) highestEl.textContent = totals.highest.toString();
  }

  async function fetchUserMonths(db, uid) {
    const snap = await db.collection("users").doc(uid).get();
    return snap.exists ? snap.data() || {} : {};
  }

  function init() {
    if (!window.firebase) return;
    const rows = getMonthRows();
    if (!rows.length) return;

    const services = initFirebase();
    if (!services) return;
    const { auth, db } = services;

    // Render defaults
    renderProgress(rows, {});

    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        renderProgress(rows, {});
        renderXpAndStreak(null);
        return;
      }
      try {
        const userData = await fetchUserMonths(db, user.uid);
        const monthsData = userData.months || {};
        renderProgress(rows, monthsData);
        renderXpAndStreak(userData);
      } catch (err) {
        console.error("FEATURE curriculum progress sync failed", err);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
