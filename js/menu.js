import { applyPageMeta, buildPhotoStrip, escapeHtml, fetchJson, renderShell, setupRevealAnimations } from "./main.js?v=20260726-seo2";

function renderMenu(page) {
  const main = document.getElementById("page-content");
  const renderPrice = (price, isFood) => {
    if (!isFood) return `<span class="menu-item__price">${escapeHtml(price)}</span>`;

    const prices = String(price || "").split("·").map((part) => part.trim()).filter(Boolean);
    return `
      <span class="menu-item__prices">
        ${prices.map((part) => `<span class="menu-price">${escapeHtml(part)}</span>`).join("")}
      </span>
    `;
  };
  const renderCategories = (categories, extraClass = "") => (categories || []).map((category) => {
    const isFood = extraClass.includes("menu-category--food");
    const categoryClass = String(category.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `
    <article class="menu-category menu-category--${categoryClass} stack ${extraClass}">
      <div class="menu-category__header">
        <h2>${escapeHtml(category.title)}</h2>
      </div>
      <ul class="menu-list">
        ${(category.items || []).map((item) => `
          <li class="menu-item stack">
            <div class="menu-item__meta">
              <span class="menu-item__name">${escapeHtml(item.name)}</span>
              ${isFood ? "" : renderPrice(item.price, false)}
            </div>
            ${item.description ? `<p class="card__text">${escapeHtml(item.description)}</p>` : ""}
            ${isFood ? renderPrice(item.price, true) : ""}
          </li>
        `).join("")}
      </ul>
    </article>
  `;
  }).join("");

  main.innerHTML = `
    <section class="section stack">
      <div class="stack">
        <p class="section__eyebrow">Menu</p>
        <h1>${escapeHtml(page.intro.heading)}</h1>
        <p class="lede">${escapeHtml(page.intro.text)}</p>
        <a class="button button--secondary menu-food-link" href="#food">${escapeHtml(page.intro.foodLink || "Food")} <span aria-hidden="true">↓</span></a>
      </div>
      <div class="stack">
        ${renderCategories(page.categories)}
      </div>
      <article class="panel stack">
        <p class="section__eyebrow">Bar details</p>
        <h2>Drinks, bottles, and the late-night shelf</h2>
        ${buildPhotoStrip(page.images || [], "photo-strip photo-strip--three")}
      </article>
      <section class="food-menu stack" id="food" tabindex="-1">
        <div class="food-menu__intro stack">
          <p class="section__eyebrow">Food from down the road</p>
          <h2>${escapeHtml(page.food.heading)}</h2>
          <p class="lede">${escapeHtml(page.food.intro)}</p>
          <p class="food-menu__payment"><strong>${escapeHtml(page.food.payment)}</strong></p>
          <p class="menu-disclaimer"><strong>Please note:</strong> ${escapeHtml(page.food.disclaimer)}</p>
        </div>
        <div class="food-menu__grid">
          ${renderCategories(page.food.categories, "menu-category--food")}
        </div>
        <p class="food-menu__note">${escapeHtml(page.food.note)}</p>
      </section>
    </section>
  `;
}

async function init() {
  const [site, page] = await Promise.all([
    fetchJson("data/site.json"),
    fetchJson("data/menu.json")
  ]);

  applyPageMeta(page.seo);
  renderShell(site);
  renderMenu(page);
  setupRevealAnimations(document.getElementById("page-content"));
}

document.addEventListener("DOMContentLoaded", init);
