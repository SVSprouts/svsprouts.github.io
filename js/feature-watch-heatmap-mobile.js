// FEATURE: Watch heatmap mobile optimization (scrollable/tighter grid + vertical wrap on small screens)
(function () {
  const STYLE_ID = "feature-heatmap-mobile-style";
  const WRAPPER_ID = "feature-heatmap-scroll";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* FEATURE: heatmap mobile adjustments */
      #${WRAPPER_ID} {
        width: 100%;
        overflow-x: auto;
        padding-bottom: 8px;
      }
      #${WRAPPER_ID} .heatmap-grid {
        min-width: 520px;
        grid-auto-columns: 22px;
        column-gap: 6px;
        row-gap: 6px;
      }
      @media (max-width: 720px) {
        #${WRAPPER_ID} .heatmap-grid {
          min-width: 0;
          grid-auto-columns: 20px;
          column-gap: 6px;
          row-gap: 5px;
        }
      }
      @media (max-width: 540px) {
        .heatmap-card .heatmap-head {
          align-items: flex-start;
        }
        .heatmap-card .legend {
          flex-wrap: wrap;
          line-height: 1.4;
        }
        #${WRAPPER_ID} .heatmap-grid {
          min-width: 0;
          grid-auto-columns: 18px;
          grid-auto-flow: row dense;
          grid-template-columns: repeat(auto-fit, minmax(18px, 1fr));
          column-gap: 4px;
          row-gap: 4px;
          max-height: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function wrapGrid() {
    const grid = document.getElementById("heatmap-grid");
    const card = grid?.closest(".heatmap-card");
    if (!grid || !card) return;
    if (grid.parentElement && grid.parentElement.id === WRAPPER_ID) return;

    const wrapper = document.createElement("div");
    wrapper.id = WRAPPER_ID;
    wrapper.className = "feature-heatmap-scroll";
    grid.parentElement?.insertBefore(wrapper, grid);
    wrapper.appendChild(grid);
  }

  function init() {
    injectStyle();
    wrapGrid();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
