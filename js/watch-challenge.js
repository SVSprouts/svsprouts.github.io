const state = {
  day: 100,
  totalDays: 100,
  streak: 0,
  highest: 0,
  xp: 0,
  xpTarget: 1000,
  level: 3,
  heatmap: Array.from({ length: 100 }, (_, i) => (i % 7 === 0 ? 0 : Math.floor(Math.random() * 3))),
  videos: [
    { day: 1, title: "How to Succeed with a Startup", tags: ["Mindset"], duration: "4 min", watched: true },
    { day: 2, title: "How to Succeed with a Startup", tags: ["Creativity"], duration: "6 min", watched: true },
    { day: 3, title: "How to talk to your first 5 users", tags: ["GTM"], duration: "5 min", watched: true },
    { day: 4, title: "Pricing like a lemonade stand pro", tags: ["Pricing"], duration: "5 min", watched: true },
    { day: 5, title: "AI tools teens actually use", tags: ["AI"], duration: "7 min", watched: true },
    { day: 6, title: "Tiny MVPs you can build in a weekend", tags: ["MVP"], duration: "6 min", watched: true },
    { day: 7, title: "Storytelling that sells", tags: ["Branding"], duration: "6 min", watched: true },
    { day: 8, title: "Monday motivation: ship something small", tags: ["Mindset"], duration: "4 min", watched: true },
    { day: 9, title: "How to make your first pitch", tags: ["GTM"], duration: "6 min", watched: true },
    { day: 10, title: "Building a simple pricing page", tags: ["Pricing"], duration: "5 min", watched: false },
    { day: 11, title: "Testing ideas with friends", tags: ["Creativity"], duration: "4 min", watched: false },
    { day: 12, title: "AI brainstorms: use ChatGPT smartly", tags: ["AI"], duration: "7 min", watched: false },
    { day: 13, title: "Finding your hook", tags: ["Branding"], duration: "5 min", watched: false },
    { day: 14, title: "Launch checklists", tags: ["MVP"], duration: "6 min", watched: false },
  ],
};

const elements = {
  dayCount: document.getElementById("day-count"),
  currentStreak: document.getElementById("current-streak"),
  highestStreak: document.getElementById("highest-streak"),
  ringProgress: document.querySelector(".ring-progress"),
  levelLabel: document.getElementById("level-label"),
  xpLabel: document.getElementById("xp-label"),
  heatmapGrid: document.getElementById("heatmap-grid"),
  markWatched: document.getElementById("mark-watched"),
  sparkle: document.getElementById("sparkle-burst"),
  videoList: document.getElementById("video-list"),
  watchNotes: document.getElementById("watch-notes"),
  watchNoteError: document.getElementById("watch-note-error"),
};

const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function renderRing() {
  const progress = state.day / state.totalDays;
  const offset = CIRCUMFERENCE - progress * CIRCUMFERENCE;
  elements.ringProgress.style.strokeDasharray = `${CIRCUMFERENCE}`;
  elements.ringProgress.style.strokeDashoffset = `${offset}`;
}

function renderXP() {
  const pct = Math.min(100, Math.round((state.xp / state.xpTarget) * 100));
  if (elements.levelLabel) {
    elements.levelLabel.textContent = `Level ${state.level} · Young Marketer`;
  }
  if (elements.xpLabel) {
    elements.xpLabel.textContent = `${state.xp} / ${state.xpTarget}`;
  }

  if (elements.xpFill) {
    elements.xpFill.style.width = `${pct}%`;
  }
  if (elements.xpProgress) {
    elements.xpProgress.textContent = `${state.xp} XP`;
  }
  if (elements.xpTarget) {
    elements.xpTarget.textContent = `${state.xpTarget - state.xp} XP to next level`;
  }
  if (elements.xpLevel) {
    elements.xpLevel.textContent = state.level;
  }
}

function renderHeatmap() {
  elements.heatmapGrid.innerHTML = "";
  state.heatmap.forEach((value, idx) => {
    const cell = document.createElement("div");
    cell.className = "heat-cell";
    if (value === 1) cell.classList.add("light");
    if (value === 2) cell.classList.add("medium");
    if (value >= 3) cell.classList.add("dark");
    cell.title = `Day ${idx + 1} ${value === 0 ? "— Missed" : `${value} watch${value > 1 ? "es" : ""}`}`;
    const dayLabel = document.createElement("span");
    dayLabel.textContent = idx + 1;
    cell.appendChild(dayLabel);
    elements.heatmapGrid.appendChild(cell);
  });
}

function renderAll() {
  elements.dayCount.textContent = state.day;
  elements.currentStreak.textContent = state.streak;
  elements.highestStreak.textContent = state.highest;
  renderRing();
  renderXP();
  renderHeatmap();
  renderVideos();
}

function levelUpIfNeeded() {
  while (state.xp >= state.xpTarget) {
    state.xp -= state.xpTarget;
    state.level += 1;
    state.xpTarget = Math.round(state.xpTarget * 1.15);
  }
}

function addSparkle(x, y) {
  if (!elements.sparkle) return;
  elements.sparkle.style.left = `${x - 10}px`;
  elements.sparkle.style.top = `${y - 10}px`;
  elements.sparkle.classList.add("active");
  setTimeout(() => elements.sparkle.classList.remove("active"), 500);
}

function handleWatchedClick(event) {
  const noteText = elements.watchNotes ? elements.watchNotes.value.trim() : "";
  if (!noteText && elements.watchNotes) {
    setNoteError("Please enter a quick learning note before marking watched.");
    elements.watchNotes.focus();
    return;
  }
  const today = state.day;
  markVideoWatched(today, noteText);
  state.day = Math.min(state.totalDays, state.day + 1);
  state.streak += 1;
  state.highest = Math.max(state.highest, state.streak);
  state.xp += 5;

  state.heatmap.shift();
  state.heatmap.push(1);

  levelUpIfNeeded();
  ensureVideo(state.day);
  renderAll();
  addSparkle(event.clientX, event.clientY);

  elements.markWatched.classList.add("success");
  setTimeout(() => elements.markWatched.classList.remove("success"), 300);

  if (elements.watchNotes) {
    elements.watchNotes.value = "";
  }
  setNoteError("");
}

function ensureVideo(day) {
  if (state.videos.find((v) => v.day === day)) return;
  state.videos.push({
    day,
    title: "Daily drop placeholder",
    tags: ["Mindset"],
    duration: "5 min",
    watched: false,
  });
}

function markVideoWatched(day, noteText) {
  ensureVideo(day);
  const target = state.videos.find((v) => v.day === day);
  if (target) {
    target.watched = true;
    if (noteText) target.note = noteText;
  }
}

function tagClass(tag) {
  const map = {
    GTM: "tag-blue",
    Pricing: "tag-green",
    AI: "tag-purple",
    Mindset: "tag-blue",
    Creativity: "tag-green",
    MVP: "tag-purple",
    Branding: "tag-blue",
  };
  return map[tag] || "";
}

function renderVideos() {
  if (!elements.videoList) return;
  elements.videoList.innerHTML = "";
  ensureVideo(state.day);
  const items = state.videos
    .filter((v) => v.day <= state.day)
    .sort((a, b) => a.day - b.day);

  items.forEach((video) => {
    const card = document.createElement("div");
    card.className = "video-card";

    const meta = document.createElement("div");
    meta.className = "video-meta";

    const dayEl = document.createElement("span");
    dayEl.className = "video-day";
    dayEl.textContent = `Day ${video.day}`;

    const status = document.createElement("span");
    status.className = `status-pill ${video.watched ? "watched" : "due"}`;
    status.textContent = video.watched ? "Watched" : "Due";

    meta.append(dayEl, status);

    const title = document.createElement("p");
    title.className = "video-title";
    title.textContent = video.title;

    const tags = document.createElement("div");
    tags.className = "video-tags";
    video.tags.forEach((tag) => {
      const pill = document.createElement("span");
      pill.className = `tag ${tagClass(tag)}`;
      pill.textContent = tag;
      tags.appendChild(pill);
    });

    const duration = document.createElement("span");
    duration.className = "video-duration";
    duration.textContent = video.duration;

    card.append(meta, title, tags, duration);
    elements.videoList.appendChild(card);
  });
}

function init() {
  renderAll();
  if (elements.markWatched) {
    elements.markWatched.addEventListener("click", handleWatchedClick);
  }
  if (elements.watchNotes) {
    elements.watchNotes.addEventListener("input", () => {
      setNoteError("");
    });
  }
}

document.addEventListener("DOMContentLoaded", init);

function setNoteError(msg) {
  if (!elements.watchNoteError) return;
  elements.watchNoteError.textContent = msg || "";
  if (msg) {
    elements.watchNoteError.classList.remove("hidden");
  } else {
    elements.watchNoteError.classList.add("hidden");
  }
}
