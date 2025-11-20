// ===== DOM references =====
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const mainContent = document.getElementById("main-content");
const welcomeText = document.getElementById("welcome-text");
const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const loadingOverlay = document.getElementById("loading-overlay");
const progressListEl = document.getElementById("progress-list");
const nextWeekBtn = document.getElementById("next-week-btn");

const quickChips = document.querySelectorAll(".quick-chip");
const lessonChips = document.querySelectorAll(".lesson-chip");

// CHANGE THIS to your deployed Worker URL
const WORKER_CHAT_URL = "https://your-worker-subdomain.workers.dev/chat";

// ===== App state =====
let currentUser = null;
let localMessages = []; // { role: "user"|"assistant", content }
let currentLessonMode = null;
let userProgress = {
  ideaLabComplete: false,
  businessModelComplete: false,
  marketingComplete: false,
  money101Complete: false,
  currentWeek: 1
};

// Mapping from mode → progress field name
const MODE_FIELD_MAP = {
  "idea-lab": "ideaLabComplete",
  "business-model": "businessModelComplete",
  "marketing": "marketingComplete",
  "money-101": "money101Complete"
};

// ===== Helpers =====
function showLoading(show) {
  if (show) loadingOverlay.classList.remove("hidden");
  else loadingOverlay.classList.add("hidden");
}

function renderMessages() {
  messagesEl.innerHTML = "";
  localMessages.forEach(m => {
    const row = document.createElement("div");
    row.className = "message-row";

    const bubble = document.createElement("div");
    bubble.className = `message ${m.role}`;
    bubble.textContent = m.content;

    row.appendChild(bubble);
    messagesEl.appendChild(row);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function updateProgressUI() {
  progressListEl.innerHTML = `
    <li>Idea Lab: ${userProgress.ideaLabComplete ? "✅ Done" : "⬜ Not yet"}</li>
    <li>Business Model: ${
      userProgress.businessModelComplete ? "✅ Done" : "⬜ Not yet"
    }</li>
    <li>Marketing: ${userProgress.marketingComplete ? "✅ Done" : "⬜ Not yet"}</li>
    <li>Money 101: ${userProgress.money101Complete ? "✅ Done" : "⬜ Not yet"}</li>
    <li>Current Week: Week ${userProgress.currentWeek || 1}</li>
  `;
}

async function loadMessagesForUser(uid) {
  const snapshot = await db
    .collection("users")
    .doc(uid)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .limit(80)
    .get();

  localMessages = snapshot.docs.map(doc => doc.data());
  renderMessages();
}

async function saveMessage(uid, role, content) {
  const message = {
    role,
    content,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  await db
    .collection("users")
    .doc(uid)
    .collection("messages")
    .add(message);
}

async function loadUserMeta(uid) {
  const doc = await db.collection("users").doc(uid).get();
  if (doc.exists) {
    const data = doc.data();
    currentLessonMode = data.lessonMode || null;
    const p = data.progress || {};
    userProgress = {
      ideaLabComplete: !!p.ideaLabComplete,
      businessModelComplete: !!p.businessModelComplete,
      marketingComplete: !!p.marketingComplete,
      money101Complete: !!p.money101Complete,
      currentWeek: p.currentWeek || 1
    };
  } else {
    currentLessonMode = null;
    userProgress = {
      ideaLabComplete: false,
      businessModelComplete: false,
      marketingComplete: false,
      money101Complete: false,
      currentWeek: 1
    };
  }
  updateProgressUI();
}

async function saveUserMeta(uid) {
  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        lessonMode: currentLessonMode,
        progress: {
          ideaLabComplete: userProgress.ideaLabComplete,
          businessModelComplete: userProgress.businessModelComplete,
          marketingComplete: userProgress.marketingComplete,
          money101Complete: userProgress.money101Complete,
          currentWeek: userProgress.currentWeek
        }
      },
      { merge: true }
    );
}

// Send to Worker
async function sendToWorker(uid, messageText) {
  // Build short context from last ~10 messages
  const recent = localMessages.slice(-10).map(m => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content
  }));

  const payload = {
    uid,
    messages: [...recent, { role: "user", content: messageText }],
    lessonMode: currentLessonMode,
    currentWeek: userProgress.currentWeek
  };

  const res = await fetch(WORKER_CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.error("Worker error", await res.text());
    throw new Error("Chat API error");
  }

  const data = await res.json();
  return data.reply;
}

// ===== Event handlers =====
async function handleSend() {
  const text = inputEl.value.trim();
  if (!text || !currentUser) return;

  inputEl.value = "";
  const uid = currentUser.uid;

  const userMsg = { role: "user", content: text };
  localMessages.push(userMsg);
  renderMessages();
  showLoading(true);

  try {
    await saveMessage(uid, "user", text);
    const reply = await sendToWorker(uid, text);

    const botMsg = { role: "assistant", content: reply };
    localMessages.push(botMsg);
    renderMessages();
    await saveMessage(uid, "assistant", reply);
  } catch (err) {
    console.error(err);
    const errorMsg = {
      role: "assistant",
      content:
        "Oops, something went wrong talking to your coach. Please try again in a moment."
    };
    localMessages.push(errorMsg);
    renderMessages();
  } finally {
    showLoading(false);
  }
}

// ===== Auth wiring =====
loginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
});

logoutBtn.addEventListener("click", () => auth.signOut());

sendBtn.addEventListener("click", handleSend);

inputEl.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// Quick prompt chips
quickChips.forEach(chip => {
  chip.addEventListener("click", () => {
    inputEl.value = chip.dataset.prompt;
    inputEl.focus();
  });
});

// Lesson mode chips
lessonChips.forEach(chip => {
  chip.addEventListener("click", async () => {
    if (!currentUser) return;

    currentLessonMode = chip.dataset.mode;
    // Mark module as "started/completed" optimistically
    const field = MODE_FIELD_MAP[currentLessonMode];
    if (field && !userProgress[field]) {
      userProgress[field] = true;
    }

    await saveUserMeta(currentUser.uid);
    updateProgressUI();

    // Friendly mode-specific introduction
    const modeMessages = {
      "idea-lab":
        "Awesome! You're in 💡 Idea Lab.\nTell me what you're interested in (hobbies, skills, or problems you see in daily life), and I'll help turn those into business ideas.",
      "business-model":
        "Great choice! You're in 📊 Business Model mode.\nTell me your idea, and I'll help you think through how it can make money (revenue), what it might cost, and what profit could look like.",
      "marketing":
        "Nice! You're in 📣 Marketing mode.\nTell me what you're offering and who it's for, and I'll help you reach people in simple, school-friendly ways.",
      "money-101":
        "Cool, you're in 💰 Money 101.\nAsk me anything about pricing, profit, costs, or simple money math with examples."
    };

    const intro = modeMessages[currentLessonMode] || "Mode updated!";
    const botMsg = { role: "assistant", content: intro };
    localMessages.push(botMsg);
    renderMessages();
    await saveMessage(currentUser.uid, "assistant", intro);
  });
});

// Next week button
nextWeekBtn.addEventListener("click", async () => {
  if (!currentUser) return;
  userProgress.currentWeek = Math.min((userProgress.currentWeek || 1) + 1, 8);
  await saveUserMeta(currentUser.uid);
  updateProgressUI();

  const msg =
    "Nice! You've moved to the next week in your entrepreneurship journey. Ask me what you should focus on for Week " +
    userProgress.currentWeek +
    ".";
  const botMsg = { role: "assistant", content: msg };
  localMessages.push(botMsg);
  renderMessages();
  await saveMessage(currentUser.uid, "assistant", msg);
});

// Auth state listener
auth.onAuthStateChanged(async user => {
  currentUser = user;
  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    mainContent.classList.remove("hidden");

    welcomeText.textContent = `Hi ${
      user.displayName || "there"
    }! I'm your Entrepreneurship Coach.`;

    await loadUserMeta(user.uid);
    await loadMessagesForUser(user.uid);

    // First-time welcome
    if (localMessages.length === 0) {
      const welcome = {
        role: "assistant",
        content:
          "Hey! I'm your Entrepreneurship Coach 🤝\n\n" +
          "We can work through an 8-week journey where you:\n" +
          "• Find problems and turn them into ideas\n" +
          "• Learn how simple businesses make money\n" +
          "• Practice basic marketing\n" +
          "• Understand money, pricing and profit\n\n" +
          "You can start by picking a Lesson Mode above, or ask me:\n" +
          "“What should I do in Week 1?”"
      };
      localMessages.push(welcome);
      renderMessages();
      await saveMessage(user.uid, "assistant", welcome.content);
    }
  } else {
    currentUser = null;
    localMessages = [];
    currentLessonMode = null;
    userProgress = {
      ideaLabComplete: false,
      businessModelComplete: false,
      marketingComplete: false,
      money101Complete: false,
      currentWeek: 1
    };
    renderMessages();
    updateProgressUI();
    mainContent.classList.add("hidden");
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
  }
});
