// FEATURE: Parent Corner article link mapping
(function () {
  const TARGET_TITLE = "How to Be a Co-Founder, Not a Boss";
  const TARGET_HREF = "articles/cofounder.html";
  const PM_TITLE = "Explaining “Profit Margin” to a 12-Year-Old";
  const PM_HREF = "articles/profit-margin.html";

  function updateLinks() {
    const cards = document.querySelectorAll(".parent-card");
    cards.forEach((card) => {
      const title = card.querySelector("h3")?.textContent?.trim();
      const link = card.querySelector(".parent-article-link");
      if (!title || !link) return;
      if (title === TARGET_TITLE) link.setAttribute("href", TARGET_HREF);
      if (title === PM_TITLE) link.setAttribute("href", PM_HREF);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateLinks);
  } else {
    updateLinks();
  }
})();
