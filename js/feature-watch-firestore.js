// FEATURE: Firestore sync for Watch Challenge progress
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
  let unsubAuth = null;

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

  function mergeRemoteState(remote) {
    if (!window.state || !remote) return;
    window.state.day = remote.day || window.state.day;
    window.state.totalDays = remote.totalDays || window.state.totalDays;
    window.state.streak = remote.streak ?? window.state.streak;
    window.state.highest = remote.highest ?? window.state.highest;
    window.state.xp = remote.xp ?? window.state.xp;
    window.state.xpTarget = remote.xpTarget ?? window.state.xpTarget;
    window.state.level = remote.level ?? window.state.level;

    if (Array.isArray(remote.heatmap) && remote.heatmap.length) {
      window.state.heatmap = remote.heatmap.slice(0, window.state.totalDays);
    }

    if (Array.isArray(remote.videos) && remote.videos.length) {
      const watchedMap = new Map(remote.videos.map((v) => [v.day, !!v.watched]));
      window.state.videos = window.state.videos.map((v) => ({
        ...v,
        watched: watchedMap.has(v.day) ? watchedMap.get(v.day) : v.watched,
      }));
    }

    if (typeof window.renderAll === "function") {
      window.renderAll();
    }
  }

  function collectState() {
    if (!window.state) return null;
    return {
      day: window.state.day,
      totalDays: window.state.totalDays,
      streak: window.state.streak,
      highest: window.state.highest,
      xp: window.state.xp,
      xpTarget: window.state.xpTarget,
      level: window.state.level,
      heatmap: window.state.heatmap,
      videos: (window.state.videos || []).map((v) => ({
        day: v.day,
        watched: !!v.watched,
      })),
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    };
  }

  function scheduleSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(persistState, 350);
  }

  async function persistState() {
    if (!auth?.currentUser || !db) return;
    const payload = collectState();
    if (!payload) return;
    try {
      await db
        .collection("users")
        .doc(auth.currentUser.uid)
        .set(
          {
            email: auth.currentUser.email || "",
            lastActive: window.firebase.firestore.FieldValue.serverTimestamp(),
            watchChallenge: payload,
          },
          { merge: true }
        );
    } catch (err) {
      console.error("FEATURE watch challenge firestore sync failed", err);
    }
  }

  function attachHandlers() {
    const markWatched = document.getElementById("mark-watched");
    if (markWatched) {
      markWatched.addEventListener("click", () => {
        setTimeout(scheduleSync, 100);
      });
    }
  }

  async function init() {
    const firebase = await ensureFirebase();
    auth = firebase.auth();
    db = firebase.firestore();

    attachHandlers();

    unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      const snap = await db.collection("users").doc(user.uid).get();
      const remote = snap.data()?.watchChallenge;
      mergeRemoteState(remote);
      scheduleSync();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("unload", () => {
    if (unsubAuth) unsubAuth();
  });
})();
