// FEATURE: Mobile layout fix for curriculum month actions
(function () {
  const MOBILE_QUERY = window.matchMedia("(max-width: 720px)");

  function applyLayout(matches) {
    const rows = document.querySelectorAll(".curriculum-list .month-row");
    rows.forEach((row) => {
      const actions = row.querySelector(".month-actions");
      const progressLine = row.querySelector(".progress-line");

      if (matches) {
        row.style.flexDirection = "column";
        row.style.alignItems = "stretch";
        row.style.gap = "12px";

        if (actions) {
          actions.style.flexDirection = "column";
          actions.style.alignItems = "flex-start";
          actions.style.justifyContent = "flex-start";
          actions.style.width = "100%";
          actions.style.minWidth = "0";
          actions.style.gap = "8px";
        }

        if (progressLine) {
          progressLine.style.width = "100%";
          progressLine.style.justifyContent = "space-between";
        }
      } else {
        row.style.flexDirection = "";
        row.style.alignItems = "";
        row.style.gap = "";

        if (actions) {
          actions.style.flexDirection = "";
          actions.style.alignItems = "";
          actions.style.justifyContent = "";
          actions.style.width = "";
          actions.style.minWidth = "";
          actions.style.gap = "";
        }

        if (progressLine) {
          progressLine.style.width = "";
          progressLine.style.justifyContent = "";
        }
      }
    });
  }

  function init() {
    applyLayout(MOBILE_QUERY.matches);
    MOBILE_QUERY.addEventListener("change", (event) => applyLayout(event.matches));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
