// FEATURE: Stripe pricing table embed
(function () {
  const PRICING_TABLE_SCRIPT = "https://js.stripe.com/v3/pricing-table.js";
  const PRICING_TABLE_ID = "prctbl_1SdnA1DonUqpdkqNkjWZILgi";
  const PUBLISHABLE_KEY = "pk_test_CK9PVsKzFmSEbegYq3YY71DR";
  const EXTENSION_CONTAINER_ID = "feature-stripe-pricing-container";

  function ensurePricingTableScript() {
    const existing = document.querySelector(`script[src="${PRICING_TABLE_SCRIPT}"]`);
    if (existing) return existing;
    const script = document.createElement("script");
    script.src = PRICING_TABLE_SCRIPT;
    script.async = true;
    document.head.appendChild(script);
    return script;
  }

  function injectPricingTable() {
    const pricingSection = document.querySelector(".pricing-hero");
    if (!pricingSection) return;

    let container = document.getElementById(EXTENSION_CONTAINER_ID);
    if (!container) {
      container = document.createElement("div");
      container.id = EXTENSION_CONTAINER_ID;
      pricingSection.appendChild(container);
    }

    if (container.querySelector("stripe-pricing-table")) return;

    const pricingTable = document.createElement("stripe-pricing-table");
    pricingTable.setAttribute("pricing-table-id", PRICING_TABLE_ID);
    pricingTable.setAttribute("publishable-key", PUBLISHABLE_KEY);
    container.appendChild(pricingTable);
  }

  function init() {
    const script = ensurePricingTableScript();
    if (!script) return;
    script.addEventListener("load", injectPricingTable);
    if (script.readyState === "complete") {
      injectPricingTable();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
