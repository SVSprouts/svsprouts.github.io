// app.js
(function () {
  const { firebaseConfig, stripePublishableKey } = window.APP_CONFIG || {};

  // FEATURE: SEO enhancements (meta, canonical, JSON-LD)
  (function enhanceSEO() {
    const head = document.head;
    if (!head) return;

    const PAGE_META = {
      "index.html": {
        title: "Silicon Valley Sprouts | Entrepreneurship for Kids & Parents",
        description:
          "6-month entrepreneurship curriculum for families—daily challenges, pricing lessons, and real projects to build together.",
      },
      "curriculum.html": {
        title: "Curriculum | Silicon Valley Sprouts",
        description:
          "Explore the 6-month entrepreneurship roadmap: idea validation, prototyping, branding, pricing, launch, and more.",
      },
      "pricing.html": {
        title: "Pricing | Silicon Valley Sprouts",
        description:
          "Choose the best plan for your family to access the full 6-month entrepreneurship curriculum, challenges, and resources.",
      },
      "watch-challenge.html": {
        title: "Daily Watch Challenge | Silicon Valley Sprouts",
        description:
          "100-day video challenge to build entrepreneurial mindset—track streaks, XP, and progress with daily content.",
      },
      "parent-corner.html": {
        title: "Parent Corner | Silicon Valley Sprouts",
        description:
          "Guides and articles to support parents mentoring young entrepreneurs through the Sprouts curriculum.",
      },
    };

    const pageKey = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const pageMeta = PAGE_META[pageKey] || {
      title: document.title || "Silicon Valley Sprouts",
      description:
        "Entrepreneurship lessons, challenges, and resources for kids and parents to build together.",
    };

    function upsertMeta(name, content) {
      if (!content) return;
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = name;
        head.appendChild(tag);
      }
      tag.content = content;
    }

    function ensureCanonical() {
      const href = `${location.origin}${location.pathname}`;
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        head.appendChild(link);
      }
      link.href = href;
    }

    function injectJsonLd() {
      const existing = document.getElementById("feature-seo-jsonld");
      if (existing) return;
      const baseUrl = `${location.origin}`;
      const pageUrl = `${location.origin}${location.pathname}`;

      const org = {
        "@type": "Organization",
        "@id": `${baseUrl}#organization`,
        name: "Silicon Valley Sprouts",
        url: baseUrl,
        logo: `${baseUrl}/image/sprouts_orange.png`,
      };

      const website = {
        "@type": "WebSite",
        "@id": `${baseUrl}#website`,
        url: baseUrl,
        name: "Silicon Valley Sprouts",
      };

      const breadcrumb = {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${baseUrl}/index.html`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: pageMeta.title,
            item: pageUrl,
          },
        ],
      };

      const webpage = {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageMeta.title,
        description: pageMeta.description,
        isPartOf: { "@id": `${baseUrl}#website` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      };

      const ld = {
        "@context": "https://schema.org",
        "@graph": [org, website, breadcrumb, webpage],
      };

      const script = document.createElement("script");
      script.id = "feature-seo-jsonld";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(ld);
      head.appendChild(script);
    }

    // Apply SEO tags
    upsertMeta("description", pageMeta.description);
    ensureCanonical();
    injectJsonLd();
  })();

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

  // FEATURE: Mobile nav toggle upgraded to slide-in sidebar
  (function initMobileNavToggle() {
    const nav = document.querySelector(".nav");
    const navLeft = document.querySelector(".nav-left");
    const navLinks = document.querySelector(".nav-links");
    const navLogo = navLeft ? navLeft.querySelector(".logo") : null;
    const navAuthEl = document.getElementById("nav-auth");
    const navUserEl = document.getElementById("nav-user");
    if (!nav || !navLeft || !navLinks || !navAuthEl || !navUserEl) return;

    const STYLE_ID = "feature-nav-toggle-style";
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        /* FEATURE: mobile nav sidebar */
        .feature-nav-toggle { display: none; }
        .feature-nav-drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
          z-index: 1000;
        }
        .feature-nav-drawer {
          position: absolute;
          top: 0;
          right: 0;
          height: 100%;
          width: 320px;
          max-width: 82vw;
          background: #fff;
          box-shadow: -6px 0 24px rgba(15, 23, 42, 0.12);
          padding: 18px 18px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transform: translateX(100%);
          transition: transform 0.3s ease;
        }
        .feature-nav-drawer header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .feature-nav-drawer .feature-nav-close {
          background: transparent;
          border: none;
          font-size: 24px;
          padding: 8px;
          cursor: pointer;
          color: #0f172a;
        }
        .feature-nav-drawer .nav-links {
          display: flex !important;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }
        .feature-nav-drawer .nav-right {
          display: flex !important;
          gap: 10px;
          width: 100%;
        }
        .feature-nav-drawer .pill-btn {
          width: 100%;
          justify-content: center;
        }
        body.feature-nav-drawer-open {
          overflow: hidden;
        }
        body.feature-nav-drawer-open .feature-nav-drawer-backdrop {
          opacity: 1;
          pointer-events: auto;
        }
        body.feature-nav-drawer-open .feature-nav-drawer {
          transform: translateX(0);
        }
        @media (max-width: 860px) {
          .feature-nav-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #0f172a;
            color: #fff;
            border: none;
            border-radius: 12px;
            padding: 9px 11px;
            font-size: 20px;
            line-height: 1;
            box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
          }
          .nav .nav-links {
            display: none;
          }
          .nav #nav-auth,
          .nav #nav-user {
            display: none;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "feature-nav-toggle";
    toggle.setAttribute("aria-label", "Toggle navigation");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = "☰";
    if (navLeft && navLogo) {
      navLeft.insertBefore(toggle, navLinks);
    } else {
      nav.insertBefore(toggle, navAuthEl);
    }

    const backdrop = document.createElement("div");
    backdrop.className = "feature-nav-drawer-backdrop";

    const drawer = document.createElement("div");
    drawer.className = "feature-nav-drawer";

    const drawerHeader = document.createElement("header");
    const drawerTitle = document.createElement("div");
    drawerTitle.textContent = "Menu";
    drawerTitle.style.fontWeight = "700";
    drawerTitle.style.fontSize = "1rem";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "feature-nav-close";
    closeBtn.setAttribute("aria-label", "Close navigation");
    closeBtn.textContent = "✕";

    drawerHeader.appendChild(drawerTitle);
    drawerHeader.appendChild(closeBtn);
    drawer.appendChild(drawerHeader);
    backdrop.appendChild(drawer);
    document.body.appendChild(backdrop);

    function setNavOpen(isOpen) {
      if (isOpen) {
        drawer.appendChild(navLinks);
        drawer.appendChild(navAuthEl);
        drawer.appendChild(navUserEl);
        document.body.classList.add("feature-nav-drawer-open");
      } else {
        if (!navLinks.parentElement || navLinks.parentElement !== navLeft) {
          navLeft.appendChild(navLinks);
        }
        if (!navAuthEl.parentElement || navAuthEl.parentElement !== nav) {
          nav.appendChild(navAuthEl);
        }
        if (!navUserEl.parentElement || navUserEl.parentElement !== nav) {
          nav.appendChild(navUserEl);
        }
        document.body.classList.remove("feature-nav-drawer-open");
      }
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }

    toggle.addEventListener("click", () => {
      const nowOpen = !document.body.classList.contains("feature-nav-drawer-open");
      setNavOpen(nowOpen);
    });

    closeBtn.addEventListener("click", () => setNavOpen(false));
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) setNavOpen(false);
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setNavOpen(false));
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) {
        setNavOpen(false);
      }
    });
  })();

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
