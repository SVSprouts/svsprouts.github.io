// FEATURE: Firestore-backed watch challenge videos and progress
(function () {
  const VIDEO_COLLECTION = "watchContent";
  const VIDEO_DOC = "dailyVideos";
  const MAX_REWATCHES = 2;
  const XP_FIRST_WATCH = 200;
  const XP_REWATCH = 100;

  let db = null;
  let auth = null;
  let userState = null;
  let videos = [];
  const TOTAL_DAYS = 100;

  const els = {
    iframe: document.querySelector(".video-embed iframe"),
    dayLabel: document.getElementById("day-count"),
    streak: document.getElementById("current-streak"),
    highest: document.getElementById("highest-streak"),
    xp: document.getElementById("xp-label"),
    ring: document.querySelector(".ring-progress"),
    heatmap: document.getElementById("heatmap-grid"),
    videoList: document.getElementById("video-list"),
    markBtn: document.getElementById("mark-watched"),
  };

  const fallbackVideos = [
    {
      day: 1,
      title: "How to Succeed with a Startup",
      url: "https://www.youtube.com/embed/0lJKucu6HJc?rel=0",
      tags: ["Mindset"],
      duration: "5 min",
    },
    {
      day: 2,
      title: "How to Succeed with a Startup",
      url: "https://www.youtube.com/embed/0lJKucu6HJc?rel=0",
      tags: ["Creativity"],
      duration: "6 min",
    },
  ];

  function ensureFirebase() {
    if (!window.firebase || !window.firebase.firestore) return null;
    if (!window.firebase.apps.length && window.APP_CONFIG?.firebaseConfig) {
      window.firebase.initializeApp(window.APP_CONFIG.firebaseConfig);
    }
    return {
      db: window.firebase.firestore(),
      auth: window.firebase.auth(),
    };
  }

  async function loadVideos() {
    try {
      const snap = await db.collection(VIDEO_COLLECTION).doc(VIDEO_DOC).get();
      const data = snap.exists ? snap.data() : null;
      const arr = Array.isArray(data?.videos) ? data.videos : [];
      return arr
        .filter((v) => v && v.url)
        .map((v, idx) => ({
          day: v.day || idx + 1,
          title: v.title || `Day ${idx + 1}`,
          url: v.url,
          tags: Array.isArray(v.tags) ? v.tags : [],
          duration: v.duration || "5 min",
        }))
        .slice(0, 100);
    } catch (err) {
      console.error("FEATURE watch videos fetch failed", err);
      return [];
    }
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function defaultState() {
    return {
      currentDay: 1,
      totalDays: TOTAL_DAYS,
      streak: 0,
      highest: 0,
      xp: 0,
      lastWatchDate: null,
      watchCounts: {},
    };
  }

  function normalizeUserData(raw, totalDays) {
    const watchCounts = raw?.watchCounts || {};
    const day = Math.min(Math.max(raw?.currentDay || 1, 1), totalDays);
    return {
      currentDay: day,
      totalDays,
      streak: raw?.streak || 0,
      highest: raw?.highest || 0,
      xp: raw?.xp || 0,
      lastWatchDate: raw?.lastWatchDate || null,
      watchCounts,
    };
  }

  function selectCurrentDay(state, totalDays) {
    const counts = state.watchCounts || {};
    const current = state.currentDay || 1;
    if (state.lastWatchDate && state.lastWatchDate !== todayKey() && counts[current]) {
      return Math.min(totalDays, current + 1);
    }
    return current;
  }

  function renderRing(day, total) {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.max(0, Math.min(1, day / total));
    const offset = circumference - progress * circumference;
    if (els.ring) {
      els.ring.style.strokeDasharray = `${circumference}`;
      els.ring.style.strokeDashoffset = `${offset}`;
    }
  }

  function renderHeatmap(state) {
    if (!els.heatmap) return;
    els.heatmap.innerHTML = "";
    const total = state.totalDays;
    for (let i = 1; i <= total; i++) {
      const count = state.watchCounts?.[i] || 0;
      const cell = document.createElement("div");
      cell.className = "heat-cell";
      if (count === 1) cell.classList.add("light");
      if (count === 2) cell.classList.add("medium");
      if (count >= 3) cell.classList.add("dark");
      const label = document.createElement("span");
      label.textContent = i;
      cell.appendChild(label);
      cell.title =
        count === 0 ? `Day ${i}: Missed` : `Day ${i}: ${count} watch${count > 1 ? "es" : ""}`;
      els.heatmap.appendChild(cell);
    }
  }

  function renderVideoList(state) {
    if (!els.videoList) return;
    els.videoList.innerHTML = "";
    const current = state.currentDay;
    const items = videos.slice(0, current);
    items.forEach((video) => {
      const card = document.createElement("div");
      card.className = "video-card";

      const meta = document.createElement("div");
      meta.className = "video-meta";

      const dayEl = document.createElement("span");
      dayEl.className = "video-day";
      dayEl.textContent = `Day ${video.day}`;

      const count = state.watchCounts?.[video.day] || 0;
      const status = document.createElement("span");
      status.className = `status-pill ${count ? "watched" : "due"}`;
      status.textContent = count ? "Watched" : "Due";

      meta.append(dayEl, status);

      const title = document.createElement("p");
      title.className = "video-title";
      title.textContent = video.title || `Day ${video.day} Video`;

      const tags = document.createElement("div");
      tags.className = "video-tags";
      (video.tags || []).forEach((tag) => {
        const pill = document.createElement("span");
        pill.className = "tag tag-blue";
        pill.textContent = tag;
        tags.appendChild(pill);
      });

      const duration = document.createElement("span");
      duration.className = "video-duration";
      duration.textContent = video.duration || "5 min";

      card.append(meta, title, tags, duration);
      els.videoList.appendChild(card);
    });
  }

  function renderVideo(video) {
    if (els.iframe && video?.url) {
      els.iframe.src = video.url.includes("embed")
        ? video.url
        : video.url.replace("watch?v=", "embed/") + "?rel=0";
    }
    const titleEl = document.querySelector(".challenge-title");
    if (titleEl && video?.title) {
      titleEl.textContent = video.title;
    }
  }

  function render(state) {
    const current = state.currentDay;
    const total = state.totalDays;
    const video = videos.find((v) => v.day === current) || videos[0];
    renderVideo(video);
    if (els.dayLabel) els.dayLabel.textContent = current;
    if (els.streak) els.streak.textContent = state.streak || 0;
    if (els.highest) els.highest.textContent = state.highest || 0;
    if (els.xp) els.xp.textContent = `${state.xp} XP`;
    renderRing(current, total);
    renderHeatmap(state);
    renderVideoList(state);
  }

  function computeStreaks(state) {
    const last = state.lastWatchDate;
    const today = todayKey();
    if (last === today) return { streak: state.streak, highest: state.highest, lastWatchDate: today };
    if (!last) return { streak: 1, highest: Math.max(state.highest, 1), lastWatchDate: today };

    const lastDate = new Date(last + "T00:00:00Z");
    const diff = Math.floor((new Date().getTime() - lastDate.getTime()) / 86400000);
    if (diff === 1) {
      const streak = (state.streak || 0) + 1;
      return { streak, highest: Math.max(state.highest || 0, streak), lastWatchDate: today };
    }
    return { streak: 1, highest: Math.max(state.highest || 0, 1), lastWatchDate: today };
  }

  async function saveState(uid) {
    try {
      await db
        .collection("users")
        .doc(uid)
        .set(
          {
            watchChallenge: {
              currentDay: userState.currentDay,
              totalDays: userState.totalDays,
              streak: userState.streak,
              highest: userState.highest,
              xp: userState.xp,
              lastWatchDate: userState.lastWatchDate,
              watchCounts: userState.watchCounts,
              updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            },
            lastActive: window.firebase.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    } catch (err) {
      console.error("FEATURE watch save failed", err);
    }
  }

  function handleMark(uid) {
    const day = userState.currentDay;
    const key = day;
    const currentCount = userState.watchCounts[key] || 0;
    const newCount = Math.min(currentCount + 1, 1 + MAX_REWATCHES);
    userState.watchCounts[key] = newCount;

    const xpGain =
      newCount === 1 ? XP_FIRST_WATCH : newCount <= 1 + MAX_REWATCHES ? XP_REWATCH : 0;
    userState.xp += xpGain;

    const streakInfo = computeStreaks(userState);
    userState.streak = streakInfo.streak;
    userState.highest = streakInfo.highest;
    userState.lastWatchDate = streakInfo.lastWatchDate;

    if (newCount === 1 && day < userState.totalDays) {
      userState.currentDay = day + 1;
    }

    render(userState);
    saveState(uid);
  }

  function rebindMarkButton(uid) {
    if (!els.markBtn) return;
    const clone = els.markBtn.cloneNode(true);
    els.markBtn.replaceWith(clone);
    clone.addEventListener("click", () => handleMark(uid));
    els.markBtn = clone;
  }

  async function init() {
    const services = ensureFirebase();
    if (!services) return;
    db = services.db;
    auth = services.auth;

    videos = (await loadVideos()) || fallbackVideos;
    if (!videos.length) videos = fallbackVideos;

    userState = defaultState();
    render(userState);

    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        userState = defaultState();
        render(userState);
        return;
      }
      rebindMarkButton(user.uid);
      const snap = await db.collection("users").doc(user.uid).get();
      const remote = snap.data()?.watchChallenge || {};
      userState = normalizeUserData(remote, TOTAL_DAYS);
      userState.currentDay = selectCurrentDay(userState, TOTAL_DAYS);
      userState.totalDays = TOTAL_DAYS;
      render(userState);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
