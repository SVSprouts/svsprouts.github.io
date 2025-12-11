// app.js
(function () {
  const { firebaseConfig, stripePublishableKey } = window.APP_CONFIG || {};

  // Init Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const functions = firebase.functions();

  // Init Stripe
  const stripe = Stripe(stripePublishableKey);

  // DOM Elements
  const footerYear = document.getElementById("footer-year");
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  const heroSection = document.getElementById("hero-section");
  const dashboardSection = document.getElementById("dashboard");
  const welcomeBanner = document.getElementById("welcome-banner");
  const welcomeName = document.getElementById("welcome-name");
  const signedInDashboard = document.getElementById("signedin-dashboard");

  const navAuth = document.getElementById("nav-auth");
  const navUser = document.getElementById("nav-user");
  const navUserEmail = document.getElementById("nav-user-email");
  const roadmapSection = document.getElementById("curriculum");

  const btnHeroStart = document.getElementById("btn-hero-start");
  const btnHeroCurriculum = document.getElementById("btn-hero-curriculum");
  const btnRoadmapStart = document.getElementById("btn-roadmap-start");
  const btnCtaStart = document.getElementById("btn-cta-start");
  const btnPricingMonthly = document.getElementById("btn-pricing-monthly");
  const btnPricingOnetime = document.getElementById("btn-pricing-onetime");
  const parentLinks = document.querySelectorAll('a[href="parent-corner.html"]');
  const monthLinks = document.querySelectorAll(".month-link");
  const parentArticleLinks = document.querySelectorAll(".parent-article-link");
  const btnOpenLogin = document.getElementById("btn-open-login");
  const btnOpenSignup = document.getElementById("btn-open-signup");
  const btnLogout = document.getElementById("btn-logout");
  const btnGoDashboard = document.getElementById("btn-go-dashboard");
  const btnUpgrade = document.getElementById("btn-upgrade");
  const btnContinueLearning = document.getElementById("btn-continue-learning");

  const authModalBackdrop = document.getElementById("auth-modal-backdrop");
  const authModalClose = document.getElementById("auth-modal-close");
  const tabSignup = document.getElementById("tab-signup");
  const tabLogin = document.getElementById("tab-login");
  const formSignup = document.getElementById("form-signup");
  const formLogin = document.getElementById("form-login");
  const authError = document.getElementById("auth-error");
  const switchToLogin = document.getElementById("switch-to-login");
  const switchToSignup = document.getElementById("switch-to-signup");

  const monthList = document.getElementById("month-list");
  const badgesGrid = document.getElementById("badges-grid");
  const overallProgressFill = document.getElementById("overall-progress-fill");
  const overallProgressLabel = document.getElementById("overall-progress-label");
  let subscriptionStatus = "free";
  let checkoutInProgress = false;

  // Month data
  const MONTHS = [
    { id: 1, title: "The Spark", desc: "Discover ideas based on your passions." },
    { id: 2, title: "Validation", desc: "Talk to potential customers and test your idea." },
    { id: 3, title: "Prototyping", desc: "Sketch, build simple demos, or basic websites." },
    { id: 4, title: "Brand & Story", desc: "Create a name, logo, and story with AI." },
    { id: 5, title: "Money & Marketing", desc: "Learn pricing, budgeting and spreading the word." },
    { id: 6, title: "Launch & Pitch", desc: "Showcase what you built to friends and family." },
  ];

  // ---------- UI helpers ----------
  function showElement(el) {
    if (!el) return;
    el.classList.remove("hidden");
  }
  function hideElement(el) {
    if (!el) return;
    el.classList.add("hidden");
  }

  function openAuthModal(mode = "signup") {
    if (!authModalBackdrop) return;
    if (mode === "signup") {
      tabSignup?.classList.add("active");
      tabLogin?.classList.remove("active");
      showElement(formSignup);
      hideElement(formLogin);
    } else {
      tabLogin?.classList.add("active");
      tabSignup?.classList.remove("active");
      showElement(formLogin);
      hideElement(formSignup);
    }
    if (authError) {
      authError.textContent = "";
      hideElement(authError);
    }
    showElement(authModalBackdrop);
  }

  function closeAuthModal() {
    hideElement(authModalBackdrop);
  }

  // ---------- Auth modal events ----------
  if (btnOpenLogin) btnOpenLogin.addEventListener("click", () => openAuthModal("login"));
  if (btnOpenSignup) btnOpenSignup.addEventListener("click", () => openAuthModal("signup"));
  if (btnHeroStart) btnHeroStart.addEventListener("click", () => openAuthModal("signup"));
  if (btnRoadmapStart) btnRoadmapStart.addEventListener("click", () => openAuthModal("signup"));
  if (btnCtaStart) btnCtaStart.addEventListener("click", () => openAuthModal("signup"));
  if (btnPricingMonthly) btnPricingMonthly.addEventListener("click", () => openAuthModal("signup"));
  if (btnPricingOnetime) btnPricingOnetime.addEventListener("click", () => openAuthModal("signup"));

  if (btnHeroCurriculum)
    btnHeroCurriculum.addEventListener("click", () => {
      document.getElementById("curriculum")?.scrollIntoView({ behavior: "smooth" });
    });
  if (btnContinueLearning) {
    btnContinueLearning.addEventListener("click", () => {
      window.location.href = "curriculum.html";
    });
  }
  if (parentLinks.length) {
    parentLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        // allow navigation; no modal hook
        return;
      });
    });
  }
  function attachMonthLinkGuards() {
    const links = document.querySelectorAll(".month-link");
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        const month = Number(link.getAttribute("data-month") || "1");
        const user = auth.currentUser;
        if (!user) {
          e.preventDefault();
          openAuthModal("signup");
          return;
        }
        if (month > 1 && subscriptionStatus !== "paid") {
          e.preventDefault();
          startCheckout();
        }
      });
    });
  }

  attachMonthLinkGuards();
  updateMonthLinkTargets(false);

  function updateMonthLinkTargets(isSignedIn) {
    const links = document.querySelectorAll(".month-link");
    links.forEach((link) => {
      const month = link.getAttribute("data-month") || "1";
      const target = isSignedIn ? `course-month${month}.html` : "#";
      link.setAttribute("href", target);
    });
  }

  function attachParentArticleGuards() {
    const links = document.querySelectorAll(".parent-article-link");
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        const access = link.getAttribute("data-access") || "paid";
        const user = auth.currentUser;
        if (!user) {
          e.preventDefault();
          openAuthModal("signup");
          return;
        }
        if (access === "paid" && subscriptionStatus !== "paid") {
          e.preventDefault();
          startCheckout();
        }
      });
    });
  }
  attachParentArticleGuards();

  if (authModalClose) authModalClose.addEventListener("click", closeAuthModal);
  authModalBackdrop?.addEventListener("click", (e) => {
    if (e.target === authModalBackdrop) closeAuthModal();
  });

  if (tabSignup)
    tabSignup.addEventListener("click", () => {
      openAuthModal("signup");
    });
  if (tabLogin)
    tabLogin.addEventListener("click", () => {
      openAuthModal("login");
    });
  if (switchToLogin)
    switchToLogin.addEventListener("click", () => {
      openAuthModal("login");
    });
  if (switchToSignup)
    switchToSignup.addEventListener("click", () => {
      openAuthModal("signup");
    });

  async function startCheckout() {
    if (checkoutInProgress) return;
    if (!functions || !stripe) {
      window.location.href = "pricing.html";
      return;
    }
    try {
      checkoutInProgress = true;
      const createCheckoutSession = functions.httpsCallable("createCheckoutSession");
      const result = await createCheckoutSession({
        priceId: "YOUR_STRIPE_PRICE_ID", // TODO: replace with real price ID
      });
      const sessionId = result.data.id;
      await stripe.redirectToCheckout({ sessionId });
    } catch (err) {
      console.error(err);
      window.location.href = "pricing.html";
    } finally {
      checkoutInProgress = false;
    }
  }

  // ---------- Auth forms ----------
  if (formSignup) {
    formSignup.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;

      if (authError) {
        authError.textContent = "";
        hideElement(authError);
      }

      try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await createUserDocIfNeeded(cred.user);
        closeAuthModal();
      } catch (err) {
        console.error(err);
        if (authError) {
          authError.textContent = normalizeAuthError(err);
          showElement(authError);
        }
      }
    });
  }

  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      if (authError) {
        authError.textContent = "";
        hideElement(authError);
      }

      try {
        await auth.signInWithEmailAndPassword(email, password);
        closeAuthModal();
      } catch (err) {
        console.error(err);
        if (authError) {
          authError.textContent = normalizeAuthError(err);
          showElement(authError);
        }
      }
    });
  }

  function normalizeAuthError(err) {
    if (!err || !err.code) return "Something went wrong. Please try again.";
    switch (err.code) {
      case "auth/email-already-in-use":
        return "That email is already in use. Try signing in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email.";
      case "auth/weak-password":
        return "Password is too weak. Try at least 6 characters.";
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password.";
      default:
        return "Error: " + err.message;
    }
  }

  function setWelcome(user) {
    if (!welcomeBanner) return;
    const name = user?.displayName || user?.email || "there";
    if (welcomeName) welcomeName.textContent = name;
    showElement(welcomeBanner);
  }

  function clearWelcome() {
    hideElement(welcomeBanner);
    if (welcomeName) welcomeName.textContent = "";
  }

  // ---------- Auth state ----------
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Logged in

      // If on the index/landing page, redirect to curriculum
      const path = window.location.pathname;
      const page = path.split("/").pop();
      if (!page || page === "index.html") {
        window.location.href = "curriculum.html";
        return;
      }

      if (navUserEmail) navUserEmail.textContent = user.email || "Family Account";
      hideElement(navAuth);
      showElement(navUser);
      updateMonthLinkTargets(true);

      // Show dashboard if present (now handled by redirection, but for other pages)
      hideElement(heroSection);
      hideElement(roadmapSection);
      // showElement(signedInDashboard); // Section removed from HTML
      setWelcome(user);

      await createUserDocIfNeeded(user);
      await loadUserState(user.uid);
    } else {
      // Logged out
      clearWelcome();
      showElement(heroSection);
      showElement(roadmapSection);
      // hideElement(signedInDashboard); // Section removed from HTML
      hideElement(navUser);
      showElement(navAuth);
      updateMonthLinkTargets(false);
    }
  });

  // ---------- User doc ----------
  async function createUserDocIfNeeded(user) {
    const uid = user.uid;
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        email: user.email || "",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        subscriptionStatus: "free", // "free" or "paid"
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

  async function loadUserState(uid) {
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return;
    const data = snap.data();
    subscriptionStatus = data.subscriptionStatus || "free";

    renderDashboard(data);
    attachMonthLinkGuards();
    attachParentArticleGuards();
  }

  function renderDashboard(userData) {
    if (!badgesGrid || !monthList || !overallProgressFill || !overallProgressLabel) {
      return;
    }

    // Badges (simple demo)
    badgesGrid.innerHTML = "";
    const badges = ["First Login", "Month 1 Explorer", "Idea Machine", "Future Founder"];
    badges.forEach((b) => {
      const span = document.createElement("span");
      span.className = "badge-pill";
      span.textContent = b;
      badgesGrid.appendChild(span);
    });

    // Month progress
    monthList.innerHTML = "";
    const monthsProgress = userData.months || {};
    let totalProgress = 0;
    let monthsCount = 0;

    MONTHS.forEach((m) => {
      const progress = monthsProgress[m.id]?.progress ?? 0;
      totalProgress += progress;
      monthsCount += 1;

      const card = document.createElement("div");
      card.className = "month-card";

      const left = document.createElement("div");
      const label = document.createElement("div");
      label.className = "month-label";
      label.textContent = `Month ${m.id}`;
      const title = document.createElement("h4");
      title.textContent = m.title;
      const desc = document.createElement("p");
      desc.textContent = m.desc;

      left.appendChild(label);
      left.appendChild(title);
      left.appendChild(desc);

      const right = document.createElement("div");
      right.className = "month-right";

      const pb = document.createElement("div");
      pb.className = "progress-bar tiny";
      const fill = document.createElement("div");
      fill.className = "progress-bar-fill";
      fill.style.width = `${progress}%`;
      pb.appendChild(fill);

      const btn = document.createElement("a");
      btn.className = "pill-btn outline";
      btn.href = "course-month1.html";
      if (m.id > 1 && subscriptionStatus !== "paid") {
        btn.textContent = "Upgrade";
        btn.href = "pricing.html";
      } else {
        btn.textContent = progress >= 100 ? "Review" : "Continue";
        btn.href = "course-month1.html";
      }

      right.appendChild(pb);
      right.appendChild(btn);

      card.appendChild(left);
      card.appendChild(right);

      monthList.appendChild(card);
    });

    const overall = monthsCount ? Math.round(totalProgress / monthsCount) : 0;
    if (overallProgressFill) overallProgressFill.style.width = `${overall}%`;
    if (overallProgressLabel) overallProgressLabel.textContent = `${overall}%`;
  }

  async function updateMonthProgress(monthId, newProgress) {
    const user = auth.currentUser;
    if (!user) return;
    const ref = db.collection("users").doc(user.uid);
    await ref.set(
      {
        months: {
          [monthId]: { progress: newProgress },
        },
      },
      { merge: true }
    );
    await loadUserState(user.uid);
  }

  // ---------- Logout ----------
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      await auth.signOut();
    });
  }

  if (btnGoDashboard) {
    btnGoDashboard.addEventListener("click", () => {
      dashboardSection?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // ---------- Stripe Upgrade ----------
  if (btnUpgrade) {
    btnUpgrade.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) {
        openAuthModal("signup");
        return;
      }

      try {
        btnUpgrade.disabled = true;
        btnUpgrade.textContent = "Redirecting to checkout…";

        await startCheckout();
      } catch (err) {
        console.error(err);
        alert("Could not start checkout. Please try again.");
      } finally {
        btnUpgrade.disabled = false;
        btnUpgrade.textContent = "Unlock Full Access";
      }
    });
  }
})();
