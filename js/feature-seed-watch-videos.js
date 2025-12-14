// FEATURE: Seed watch videos into Firestore (loads list from watchchallengevideos.md)
(function () {
  const DEFAULT_LIST = 
  [
  { day: 1, title: "Paul Graham on how to get startup ideas", url: "https://www.youtube.com/embed/FlCWg-KkUN4?rel=0", tags: ["The Spark", "Ideas"], duration: "~14 min" },
  { day: 2, title: "How to Evaluate Startup Ideas (Kevin Hale)", url: "https://www.youtube.com/embed/DOtCl5PU8F0?rel=0", tags: ["The Spark", "Ideas"], duration: "~20 min" },
  { day: 3, title: "How to Start a Startup — Lecture 1 (Sam Altman)", url: "https://www.youtube.com/embed/CBYhVcO4WgI?rel=0", tags: ["The Spark", "Mindset"], duration: "~50 min" },
  { day: 4, title: "Before the Startup (Paul Graham) — How to Start a Startup", url: "https://www.youtube.com/embed/f4_14pZlJBs?rel=0", tags: ["The Spark", "Mindset"], duration: "~50 min" },
  { day: 5, title: "How to Build Products Users Love (Kevin Hale)", url: "https://www.youtube.com/embed/12D8zEdOPYo?rel=0", tags: ["The Spark", "Product Thinking"], duration: "~45 min" },

  { day: 6, title: "How To Talk To Users (Gustaf Alströmer)", url: "https://www.youtube.com/embed/z1iF1c8w5Lg?rel=0", tags: ["Validation", "Customer Discovery"], duration: "~43 min" },
  { day: 7, title: "How to Talk to Users (Eric Migicovsky)", url: "https://www.youtube.com/embed/MT4Ig2uqjTc?rel=0", tags: ["Validation", "Customer Discovery"], duration: "~35 min" },
  { day: 8, title: "How To Find Product Market Fit (David Rusenko)", url: "https://www.youtube.com/embed/0LNQxT9LvM0?rel=0", tags: ["Validation", "PMF"], duration: "~35 min" },
  { day: 9, title: "B2B Startup Metrics (Tom Blomfield)", url: "https://www.youtube.com/embed/_mKeVGSqQac?rel=0", tags: ["Validation", "Metrics"], duration: "~25 min" },
  { day: 10, title: "Growth for Startups (Gustaf Alströmer)", url: "https://www.youtube.com/embed/6lY9CYIY4pQ?rel=0", tags: ["Validation", "Growth"], duration: "~35 min" },

  { day: 11, title: "How to Plan an MVP (Michael Seibel)", url: "https://www.youtube.com/embed/1hHMwLxN6EM?rel=0", tags: ["The Build", "MVP"], duration: "~25 min" },
  { day: 12, title: "How to Build a Product I (Seibel + Huffman + Shear)", url: "https://www.youtube.com/embed/6IFR3WYSBFM?rel=0", tags: ["The Build", "MVP"], duration: "~45 min" },
  { day: 13, title: "Building Product (Michael Seibel)", url: "https://www.youtube.com/embed/C27RVio2rOs?rel=0", tags: ["The Build", "Execution"], duration: "~30 min" },
  { day: 14, title: "Lecture 4 — Building Product, Talking to Users, and Growing", url: "https://www.youtube.com/embed/yP176MBG9Tk?rel=0", tags: ["The Build", "Iteration"], duration: "~60 min" },
  { day: 15, title: "How To Get Your First Customers (Gustaf Alströmer)", url: "https://www.youtube.com/embed/hyYCn_kAngI?rel=0", tags: ["The Build", "First Customers"], duration: "~25 min" },

  { day: 16, title: "How to name your startup (WSGR Startup Basics)", url: "https://www.youtube.com/embed/FNbQYisK5Wc?rel=0", tags: ["The Brand", "Naming"], duration: "~8–12 min" },
  { day: 17, title: "Your Startup Needs The .COM Domain (YC Advice)", url: "https://www.youtube.com/embed/jwPYDlRboU8?rel=0", tags: ["The Brand", "Naming"], duration: "~5 min" },
  { day: 18, title: "How To Build Products Users Love — Lecture 7 (Kevin Hale)", url: "https://www.youtube.com/embed/sz_LgBAGYyo?rel=0", tags: ["The Brand", "Story"], duration: "~45 min" },

  { day: 19, title: "Startup Pricing 101 (Kevin Hale)", url: "https://www.youtube.com/embed/jwXlo9gy_k4?rel=0", tags: ["Money Matters", "Pricing"], duration: "~35 min" },
  { day: 20, title: "Startup Business Models and Pricing", url: "https://www.youtube.com/embed/oWZbWzAyHAE?rel=0", tags: ["Money Matters", "Pricing"], duration: "~25 min" },
  { day: 21, title: "How To Price For B2B (Startup School)", url: "https://www.youtube.com/embed/4hjiRmgmHiU?rel=0", tags: ["Money Matters", "Pricing"], duration: "~15–25 min" },

  { day: 22, title: "The Best Way To Launch Your Startup", url: "https://www.youtube.com/embed/u36A-YTxiOw?rel=0", tags: ["Launch", "GTM"], duration: "~25 min" },
  { day: 23, title: "How to Pitch Your Startup (Kevin Hale)", url: "https://www.youtube.com/embed/17XZGUX_9iM?rel=0", tags: ["Launch", "Pitch"], duration: "~35 min" },
  { day: 24, title: "How to Sell (Tyler Bosmeny)", url: "https://www.youtube.com/embed/xZi4kTJG-LE?rel=0", tags: ["Launch", "Sales"], duration: "~30 min" },

  { day: 25, title: "Growth for Startups (Channel + PMF signals)", url: "https://www.youtube.com/embed/6lY9CYIY4pQ?rel=0", tags: ["Go to Market Strategy", "Growth"], duration: "~35 min" },
  { day: 26, title: "How To Get Your First Customers", url: "https://www.youtube.com/embed/hyYCn_kAngI?rel=0", tags: ["Go to Market Strategy", "Acquisition"], duration: "~25 min" },

  { day: 27, title: "Startup Pricing 101 (Kevin Hale)", url: "https://www.youtube.com/embed/jwXlo9gy_k4?rel=0", tags: ["Pricing Strategy", "Pricing"], duration: "~35 min" },
  { day: 28, title: "Startup Business Models and Pricing", url: "https://www.youtube.com/embed/oWZbWzAyHAE?rel=0", tags: ["Pricing Strategy", "Monetization"], duration: "~25 min" },

  { day: 29, title: "The Sales Playbook For Founders", url: "https://www.youtube.com/embed/DH7REvnQ1y4?rel=0", tags: ["Sales Strategy", "Sales"], duration: "~40 min" },

  { day: 30, title: "How To Keep Your Users (Retention)", url: "https://www.youtube.com/embed/VNxBZ7ka5J0?rel=0", tags: ["Post Sales Strategy", "Retention"], duration: "~25–35 min" },

  { day: 31, title: "Growth Mindset for Entrepreneurs", url: "https://www.youtube.com/embed/4O2JK_94g3Y?rel=0", tags: ["Mindset"], duration: "8 min" },
  { day: 32, title: "Why Most Startups Fail", url: "https://www.youtube.com/embed/FBOLk9s9Ci4?rel=0", tags: ["Mindset"], duration: "10 min" },
  { day: 33, title: "How to Think Like an Entrepreneur", url: "https://www.youtube.com/embed/qp0HIF3SfI4?rel=0", tags: ["Mindset"], duration: "6 min" },

  { day: 34, title: "Creative Thinking for Business", url: "https://www.youtube.com/embed/0af00UcTO-c?rel=0", tags: ["Creativity"], duration: "7 min" },
  { day: 35, title: "How to Find Problems Worth Solving", url: "https://www.youtube.com/embed/xXrYv3R0p7g?rel=0", tags: ["Creativity"], duration: "9 min" },
  { day: 36, title: "Design Thinking Explained Simply", url: "https://www.youtube.com/embed/_r0VX-aU_T8?rel=0", tags: ["Creativity", "Design"], duration: "10 min" },

  { day: 37, title: "Customer Interviews 101", url: "https://www.youtube.com/embed/tp0nL8Vv0yA?rel=0", tags: ["Validation"], duration: "12 min" },
  { day: 38, title: "What Customers Actually Want", url: "https://www.youtube.com/embed/HB9z5QhGg5U?rel=0", tags: ["Validation"], duration: "8 min" },
  { day: 39, title: "How to Run Surveys for Startups", url: "https://www.youtube.com/embed/Qk1x6ty7FqM?rel=0", tags: ["Validation"], duration: "6 min" },

  { day: 40, title: "What Is an MVP?", url: "https://www.youtube.com/embed/joNKkWPafZk?rel=0", tags: ["The Build"], duration: "6 min" },
  { day: 41, title: "Build Fast, Learn Faster", url: "https://www.youtube.com/embed/l9z1yK2Y8bA?rel=0", tags: ["The Build"], duration: "7 min" },
  { day: 42, title: "No-Code Tools for Beginners", url: "https://www.youtube.com/embed/2YF6y9PqE_w?rel=0", tags: ["The Build"], duration: "12 min" },

  { day: 43, title: "What Makes a Brand Memorable", url: "https://www.youtube.com/embed/7l1Z8ZsFj6I?rel=0", tags: ["The Brand"], duration: "8 min" },
  { day: 44, title: "Storytelling for Startups", url: "https://www.youtube.com/embed/9QRn6y-wHcY?rel=0", tags: ["The Brand"], duration: "10 min" },
  { day: 45, title: "How to Explain Your Idea Clearly", url: "https://www.youtube.com/embed/9g7r3F6LkFc?rel=0", tags: ["The Brand"], duration: "6 min" },

  { day: 46, title: "Business Models Explained for Kids", url: "https://www.youtube.com/embed/4qK2Xc1p9Ew?rel=0", tags: ["Money Matters"], duration: "7 min" },
  { day: 47, title: "Revenue vs Profit", url: "https://www.youtube.com/embed/sN7ZyM0gU8Q?rel=0", tags: ["Money Matters"], duration: "5 min" },
  { day: 48, title: "Costs Every Startup Should Know", url: "https://www.youtube.com/embed/3xHc7ZzJHcI?rel=0", tags: ["Money Matters"], duration: "6 min" },

  { day: 49, title: "How to Price Your Product", url: "https://www.youtube.com/embed/zx1lJ5m9fAk?rel=0", tags: ["Pricing Strategy"], duration: "8 min" },
  { day: 50, title: "Free vs Paid Products", url: "https://www.youtube.com/embed/5Y7kMZp9Yx8?rel=0", tags: ["Pricing Strategy"], duration: "7 min" },

  { day: 51, title: "What Is Go-To-Market?", url: "https://www.youtube.com/embed/Qm4X1J8R7yE?rel=0", tags: ["Go to Market Strategy"], duration: "6 min" },
  { day: 52, title: "Marketing Channels Explained", url: "https://www.youtube.com/embed/W7K6M9gY9pE?rel=0", tags: ["Go to Market Strategy"], duration: "8 min" },
  { day: 53, title: "How Startups Get Early Users", url: "https://www.youtube.com/embed/9mJ6f1bX8Zc?rel=0", tags: ["Go to Market Strategy"], duration: "9 min" },

  { day: 54, title: "Sales for Founders (Beginner)", url: "https://www.youtube.com/embed/8Z5kY5Jc7Gk?rel=0", tags: ["Sales Strategy"], duration: "10 min" },
  { day: 55, title: "How to Pitch Without Being Salesy", url: "https://www.youtube.com/embed/6rF6k2R9p9I?rel=0", tags: ["Sales Strategy"], duration: "7 min" },
  { day: 56, title: "Handling Rejection in Sales", url: "https://www.youtube.com/embed/1H6jN5vY0nQ?rel=0", tags: ["Sales Strategy"], duration: "6 min" },

  { day: 57, title: "Preparing for Product Launch", url: "https://www.youtube.com/embed/j4M9P1yZk8A?rel=0", tags: ["Launch"], duration: "8 min" },
  { day: 58, title: "Launch Checklist for Startups", url: "https://www.youtube.com/embed/Yk4M1Qx9P8A?rel=0", tags: ["Launch"], duration: "6 min" },

  { day: 59, title: "What to Do After You Launch", url: "https://www.youtube.com/embed/7PpYJzZK3kM?rel=0", tags: ["Post Sales Strategy"], duration: "9 min" },
  { day: 60, title: "Keeping Users Happy", url: "https://www.youtube.com/embed/F2Yx8sZ4Q4A?rel=0", tags: ["Post Sales Strategy"], duration: "7 min" },

  { day: 61, title: "Using AI to Brainstorm Ideas", url: "https://www.youtube.com/embed/2QXH8hZpYpI?rel=0", tags: ["AI Learning"], duration: "8 min" },
  { day: 62, title: "AI Tools for Students", url: "https://www.youtube.com/embed/B9J0JzM4H9Y?rel=0", tags: ["AI Learning"], duration: "6 min" },
  { day: 63, title: "Ethics of AI for Beginners", url: "https://www.youtube.com/embed/7oH2p5Zp8mA?rel=0", tags: ["AI Learning"], duration: "7 min" },

  { day: 64, title: "Working as a Startup Team", url: "https://www.youtube.com/embed/X7Z9k6FJp7I?rel=0", tags: ["Leadership"], duration: "6 min" },
  { day: 65, title: "Leadership Skills for Students", url: "https://www.youtube.com/embed/4MZK1B7p0xA?rel=0", tags: ["Leadership"], duration: "8 min" },

  { day: 66, title: "Learning From Failure", url: "https://www.youtube.com/embed/5Y9QkJp2S3Y?rel=0", tags: ["Mindset"], duration: "6 min" },
  { day: 67, title: "How to Improve with Feedback", url: "https://www.youtube.com/embed/9A8R1ZpY6yI?rel=0", tags: ["Mindset"], duration: "7 min" },

  { day: 68, title: "Kid Entrepreneur Story", url: "https://www.youtube.com/embed/0lJKucu6HJc?rel=0", tags: ["Inspiration"], duration: "5 min" },
  { day: 69, title: "Teen Startup Success Story", url: "https://www.youtube.com/embed/8XK4PpY9G3A?rel=0", tags: ["Inspiration"], duration: "6 min" },

  { day: 70, title: "From Idea to Launch Recap", url: "https://www.youtube.com/embed/JZp9kX0H7A8?rel=0", tags: ["Capstone"], duration: "10 min" },
  { day: 71, title: "How to Present Your Project", url: "https://www.youtube.com/embed/3H8kPZJx9YI?rel=0", tags: ["Capstone"], duration: "7 min" },

  { day: 72, title: "Staying Motivated as a Founder", url: "https://www.youtube.com/embed/1pY2ZkH9Q8A?rel=0", tags: ["Mindset"], duration: "6 min" },
  { day: 73, title: "Time Management for Students", url: "https://www.youtube.com/embed/9kZ7X8JpQ1I?rel=0", tags: ["Productivity"], duration: "7 min" },
  { day: 74, title: "Balancing School and Startups", url: "https://www.youtube.com/embed/Z9X7kJH8p0A?rel=0", tags: ["Productivity"], duration: "6 min" },

  { day: 75, title: "Entrepreneurship Q&A", url: "https://www.youtube.com/embed/CBYhVcO4WgI?rel=0", tags: ["Q&A"], duration: "12 min" },
  { day: 76, title: "What Makes a Great Founder", url: "https://www.youtube.com/embed/f4_14pZlJBs?rel=0", tags: ["Mindset"], duration: "10 min" },

  { day: 77, title: "Reflect on Your Startup Journey", url: "https://www.youtube.com/embed/9g7r3F6LkFc?rel=0", tags: ["Reflection"], duration: "5 min" },
  { day: 78, title: "What Would You Build Next?", url: "https://www.youtube.com/embed/qp0HIF3SfI4?rel=0", tags: ["Reflection"], duration: "5 min" },

  { day: 79, title: "Why Curiosity Matters", url: "https://www.youtube.com/embed/4O2JK_94g3Y?rel=0", tags: ["Mindset"], duration: "6 min" },
  { day: 80, title: "Never Stop Learning", url: "https://www.youtube.com/embed/5Y9QkJp2S3Y?rel=0", tags: ["Mindset"], duration: "6 min" },
  { day: 81, title: "What Entrepreneurs Really Do", url: "https://www.youtube.com/embed/qp0HIF3SfI4?rel=0", tags: ["Mindset"], duration: "6 min" },
  { day: 82, title: "Why Curiosity Is a Superpower", url: "https://www.youtube.com/embed/4O2JK_94g3Y?rel=0", tags: ["Mindset"], duration: "6 min" },
  { day: 83, title: "How Big Ideas Start Small", url: "https://www.youtube.com/embed/0af00UcTO-c?rel=0", tags: ["Creativity"], duration: "7 min" },
  { day: 84, title: "Thinking in Systems (Simple Explanation)", url: "https://www.youtube.com/embed/6ZrO90AI0c8?rel=0", tags: ["Thinking"], duration: "8 min" },

  { day: 85, title: "How Startups Use AI Today", url: "https://www.youtube.com/embed/2QXH8hZpYpI?rel=0", tags: ["AI Learning"], duration: "8 min" },
  { day: 86, title: "AI as a Co-Pilot (Not a Cheat Code)", url: "https://www.youtube.com/embed/B9J0JzM4H9Y?rel=0", tags: ["AI Learning"], duration: "7 min" },

  { day: 87, title: "How to Explain Your Startup in 30 Seconds", url: "https://www.youtube.com/embed/9g7r3F6LkFc?rel=0", tags: ["Communication"], duration: "5 min" },
  { day: 88, title: "Public Speaking Tips for Students", url: "https://www.youtube.com/embed/8S0FDjFBj8o?rel=0", tags: ["Communication"], duration: "6 min" },

  { day: 89, title: "Learning From Mistakes", url: "https://www.youtube.com/embed/5Y9QkJp2S3Y?rel=0", tags: ["Mindset"], duration: "6 min" },
  { day: 90, title: "How to Handle Failure Positively", url: "https://www.youtube.com/embed/FBOLk9s9Ci4?rel=0", tags: ["Mindset"], duration: "8 min" },

  { day: 91, title: "How Teams Work Best", url: "https://www.youtube.com/embed/X7Z9k6FJp7I?rel=0", tags: ["Leadership"], duration: "6 min" },
  { day: 92, title: "Leadership Skills for Young Founders", url: "https://www.youtube.com/embed/4MZK1B7p0xA?rel=0", tags: ["Leadership"], duration: "8 min" },

  { day: 93, title: "Time Management for Builders", url: "https://www.youtube.com/embed/9kZ7X8JpQ1I?rel=0", tags: ["Productivity"], duration: "7 min" },
  { day: 94, title: "Balancing School and Side Projects", url: "https://www.youtube.com/embed/Z9X7kJH8p0A?rel=0", tags: ["Productivity"], duration: "6 min" },

  { day: 95, title: "How to Reflect on Your Startup Journey", url: "https://www.youtube.com/embed/9A8R1ZpY6yI?rel=0", tags: ["Reflection"], duration: "6 min" },
  { day: 96, title: "What Would You Build Next?", url: "https://www.youtube.com/embed/3H8kPZJx9YI?rel=0", tags: ["Reflection"], duration: "7 min" },

  { day: 97, title: "Young Entrepreneur Success Story", url: "https://www.youtube.com/embed/0lJKucu6HJc?rel=0", tags: ["Inspiration"], duration: "5 min" },
  { day: 98, title: "Teen Founders Who Started Early", url: "https://www.youtube.com/embed/8XK4PpY9G3A?rel=0", tags: ["Inspiration"], duration: "6 min" },

  { day: 99, title: "Why Building Matters More Than Winning", url: "https://www.youtube.com/embed/f4_14pZlJBs?rel=0", tags: ["Capstone"], duration: "8 min" },
  { day: 100, title: "From Idea to Builder — Your Sprouts Journey", url: "https://www.youtube.com/embed/JZp9kX0H7A8?rel=0", tags: ["Capstone"], duration: "10 min" }

];

  async function loadWatchVideosList() {
    try {
      const res = await fetch("watchchallengevideos.md");
      if (!res.ok) throw new Error("fetch failed");
      const text = await res.text();
      const parsed = parseListFromMarkdown(text);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (err) {
      console.warn("FEATURE seed: falling back to default list", err);
    }
    return DEFAULT_LIST;
  }

  function parseListFromMarkdown(text) {
    if (!text) return null;
    // Try to extract the first JSON-like array block
    const blockMatch = text.match(/```(?:json|js)?\\s*([\\s\\S]*?)```/i);
    const candidate = blockMatch ? blockMatch[1] : text;
    const arrayMatch = candidate.match(/\\[[\\s\\S]*\\]/);
    const jsonString = arrayMatch ? arrayMatch[0] : null;
    if (!jsonString) return null;
    return JSON.parse(jsonString);
  }

  function ensureFirebase() {
    if (!window.firebase || !window.APP_CONFIG?.firebaseConfig) {
      console.warn("Firebase not available; cannot seed videos.");
      return null;
    }
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(window.APP_CONFIG.firebaseConfig);
    }
    return window.firebase.firestore();
  }

  async function seedWatchVideos() {
    const db = ensureFirebase();
    if (!db) return;
    try {
      const watchvideoslist = await loadWatchVideosList();
      await db.collection("watchContent").doc("dailyVideos").set(
        {
          videos: watchvideoslist,
          updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log("FEATURE seed: watch videos written to watchContent/dailyVideos");
    } catch (err) {
      console.error("FEATURE seed failed", err);
    }
  }

  // Expose for manual invocation
  window.seedWatchVideos = seedWatchVideos;
  // console.log("FEATURE seed: call window.seedWatchVideos() to pull watchchallengevideos.md and push to Firestore.");
})();
