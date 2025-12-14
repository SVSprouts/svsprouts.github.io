// FEATURE: Firestore-backed course progress & notes sync
(function () {
  const CONFIG =
    (window.APP_CONFIG && window.APP_CONFIG.firebaseConfig) || {
      apiKey: "AIzaSyAOWfR3KGG-ouX6Whl27lApxHMukZ2G9UE",
      authDomain: "svsprouts-a1350.firebaseapp.com",
      projectId: "svsprouts-a1350",
      storageBucket: "svsprouts-a1350.firebasestorage.app",
      messagingSenderId: "575688818236",
      appId: "1:575688818236:web:648234b064245b9bf10d39",
      measurementId: "G-6PTY3QCH6H",
    };

  const FIREBASE_SCRIPTS = [
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js",
  ];

  let db = null;
  let auth = null;
  let syncTimer = null;
  let currentUser = null;
  let currentMonth = null;
  let visitLogged = false;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function ensureFirebase() {
    if (window.firebase?.firestore) return window.firebase;
    for (const src of FIREBASE_SCRIPTS) {
      await loadScript(src);
    }
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(CONFIG);
    }
    return window.firebase;
  }

  function formatDateUTC(date) {
    return date.toISOString().slice(0, 10);
  }

  function daysBetween(d1, d2) {
    const msPerDay = 86400000;
    const diff = Math.floor((d1.getTime() - d2.getTime()) / msPerDay);
    return diff;
  }

  function waitForWeeks() {
    return new Promise((resolve) => {
      const attempt = () => {
        const weeks = getWeekEntries();
        if (weeks.length) {
          resolve(weeks);
          return true;
        }
        return false;
      };
      if (attempt()) return;
      const observer = new MutationObserver(() => {
        if (attempt()) {
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(getWeekEntries());
      }, 2000);
    });
  }

  function getWeekEntries() {
    const buttons = Array.from(document.querySelectorAll(".week-complete-button"));
    return buttons.map((button, index) => {
      const match = (button.textContent || "").match(/Week\s+(\d+)/i);
      const weekNumber = match ? Number(match[1]) : index + 1;
      const noteArea = button.parentElement?.querySelector(".week-note-textarea");
      return { button, weekNumber, noteArea };
    });
  }

  function isWeekComplete(button) {
    const text = button.textContent || "";
    return /not complete/i.test(text);
  }

  function setWeekComplete(button, weekNumber, complete) {
    button.textContent = complete
      ? `Mark Week ${weekNumber} as not complete`
      : `Mark Week ${weekNumber} as complete`;
    const key = `youngpreneur-month-${currentMonth}-week-${weekNumber}`;
    if (complete) {
      localStorage.setItem(key, "complete");
    } else {
      localStorage.removeItem(key);
    }
  }

  function updateNotesStorage(weekNumber, text) {
    const key = `youngpreneur-month-${currentMonth}-week-${weekNumber}-note`;
    if (text && text.trim()) {
      localStorage.setItem(key, text);
    } else {
      localStorage.removeItem(key);
    }
  }

  function updateProgressUI(entries) {
    const total = entries.length || 1;
    const completed = entries.filter(({ button }) => isWeekComplete(button)).length;
    const percent = Math.round((completed / total) * 100);
    const bar = document.querySelector(".course-progress-bar");
    const label = document.querySelector(".course-progress-label");
    const container = document.querySelector(".course-progress");
    if (bar) bar.style.width = `${percent}%`;
    if (label) label.textContent = `${percent}% complete (${completed}/${total} weeks)`;
    if (container) container.setAttribute("aria-valuenow", String(percent));

    const monthBtn = document.getElementById("mark-complete");
    if (monthBtn) {
      monthBtn.textContent =
        completed === total ? "Mark as not complete" : "Mark this month as complete";
    }
    return { percent, completed, total };
  }

  function applyRemoteState(entries, remote) {
    if (!remote) return;
    const weeksData = remote.weeks || {};
    entries.forEach(({ button, weekNumber, noteArea }) => {
      const week = weeksData[weekNumber] || {};
      setWeekComplete(button, weekNumber, !!week.complete);
      if (noteArea) {
        noteArea.value = week.note || "";
        updateNotesStorage(weekNumber, noteArea.value);
      }
    });
    updateProgressUI(entries);
  }

  function collectState(entries) {
    const weeks = {};
    entries.forEach(({ button, weekNumber, noteArea }) => {
      const note = noteArea?.value?.trim();
      weeks[weekNumber] = {
        complete: isWeekComplete(button),
        ...(note ? { note } : {}),
      };
    });
    const { percent } = updateProgressUI(entries);
    return {
      progress: percent,
      weeks,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    };
  }

  function scheduleSync(entries) {
    if (!currentUser) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => persistState(entries), 400);
  }

  async function persistState(entries) {
    if (!currentUser || !db) return;
    const monthData = collectState(entries);
    try {
      await db
        .collection("users")
        .doc(currentUser.uid)
        .set(
          {
            email: currentUser.email || "",
            lastActive: window.firebase.firestore.FieldValue.serverTimestamp(),
            months: {
              [currentMonth]: monthData,
            },
          },
          { merge: true }
        );
    } catch (err) {
      console.error("FEATURE course firestore sync failed", err);
    }
  }

  function attachListeners(entries) {
    entries.forEach(({ button, noteArea }) => {
      button.addEventListener("click", () => scheduleSync(entries));
      if (noteArea) {
        let noteTimer = null;
        noteArea.addEventListener("input", () => {
          const text = noteArea.value || "";
          updateNotesStorage(
            getWeekNumberFromButton(button),
            text
          );
          clearTimeout(noteTimer);
          noteTimer = setTimeout(() => scheduleSync(entries), 500);
        });
      }
    });
    const monthBtn = document.getElementById("mark-complete");
    if (monthBtn) {
      monthBtn.addEventListener("click", () => scheduleSync(entries));
    }
  }

  function getWeekNumberFromButton(button) {
    const match = (button.textContent || "").match(/Week\s+(\d+)/i);
    return match ? Number(match[1]) : null;
  }

  async function updateCourseVisit(user) {
    if (!db || !user || visitLogged) return;
    visitLogged = true;
    const today = new Date();
    const todayStr = formatDateUTC(today);
    const ref = db.collection("users").doc(user.uid);

    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.exists ? snap.data() : {};
        const courseVisits = data?.courseVisits || {};
        const lastStr = courseVisits.lastVisitDate;
        let streak = courseVisits.streak || 0;
        let highest = courseVisits.highest || 0;

        if (lastStr === todayStr) {
          // Already counted today
        } else if (lastStr) {
          const lastDate = new Date(lastStr + "T00:00:00Z");
          const diff = daysBetween(today, lastDate);
          if (diff === 1) {
            streak = streak ? streak + 1 : 1;
          } else {
            streak = 1;
          }
        } else {
          streak = 1;
        }

        highest = Math.max(highest, streak);

        tx.set(
          ref,
          {
            courseVisits: {
              lastVisitDate: todayStr,
              streak,
              highest,
            },
            lastActive: window.firebase.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });
    } catch (err) {
      console.error("FEATURE course visit streak update failed", err);
    }
  }

  async function ensureUserDoc(user) {
    const ref = db.collection("users").doc(user.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        email: user.email || "",
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        subscriptionStatus: "free",
        months: {
          1: { progress: 0 },
          2: { progress: 0 },
          3: { progress: 0 },
          4: { progress: 0 },
          5: { progress: 0 },
          6: { progress: 0 },
        },
      });
    }
  }

  async function init() {
    currentMonth = Number(document.body.dataset.month || "0");
    if (!currentMonth) return;
    const firebase = await ensureFirebase();
    auth = firebase.auth();
    db = firebase.firestore();

    const entries = await waitForWeeks();
    if (!entries.length) return;

    auth.onAuthStateChanged(async (user) => {
      currentUser = user;
      if (!user) return;
      await ensureUserDoc(user);
      const snap = await db.collection("users").doc(user.uid).get();
      const remoteMonths = snap.data()?.months || {};
      applyRemoteState(entries, remoteMonths[currentMonth]);
      attachListeners(entries);
      scheduleSync(entries);
      updateCourseVisit(user);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
