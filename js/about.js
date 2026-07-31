import { applyPageMeta, buildPhotoStrip, escapeHtml, fetchJson, renderShell, setupRevealAnimations } from "./main.js?v=20260726-seo2";

function renderAbout(page) {
  const main = document.getElementById("page-content");

  main.innerHTML = `
    <section class="section stack about-page">
      <div class="stack">
        <p class="section__eyebrow">${escapeHtml(page.hero.eyebrow)}</p>
        <h1>${escapeHtml(page.hero.title)}</h1>
        <p class="lede">${escapeHtml(page.hero.lead)}</p>
      </div>
      <div class="content-grid">
        <article class="panel stack story-panel">
          <h2>Our story</h2>
          ${(page.story || []).map((paragraph) => `<p class="section__text">${escapeHtml(paragraph)}</p>`).join("")}
        </article>
        <article class="panel stack expectations-panel">
          <h2>What to expect</h2>
          <ul class="policy__list">
            ${(page.whatToExpect || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
      </div>
      <article class="panel outdoor-panel">
        <div class="outdoor-panel__media">
          <img src="${escapeHtml(page.outdoor.image.src)}" alt="${escapeHtml(page.outdoor.image.alt)}" loading="lazy" decoding="async">
        </div>
        <div class="outdoor-panel__content stack">
          <p class="section__eyebrow">${escapeHtml(page.outdoor.eyebrow)}</p>
          <h2>${escapeHtml(page.outdoor.title)}</h2>
          <p class="section__text">${escapeHtml(page.outdoor.text)}</p>
        </div>
      </article>
      <article class="panel stack values-panel">
        <p class="section__eyebrow">Values</p>
        <h2>How we approach the room</h2>
        <div class="values-grid">
          ${(page.values || []).map((item) => `
            <div class="card stack">
              <h3>${escapeHtml(item.title)}</h3>
              <p class="card__text">${escapeHtml(item.text)}</p>
            </div>
          `).join("")}
        </div>
      </article>
        <article class="panel stack">
          <p class="section__eyebrow">More photos</p>
          <h2>Faces, games, and drinks</h2>
          ${buildPhotoStrip(page.images || [], "photo-strip photo-strip--three")}
        </article>
    </section>
  `;
}

async function init() {
  const [site, page] = await Promise.all([
    fetchJson("data/site.json"),
    fetchJson("data/about.json?v=outdoor")
  ]);

  applyPageMeta(page.seo);
  renderShell(site);
  renderAbout(page);
  setupRevealAnimations(document.getElementById("page-content"));
}

document.addEventListener("DOMContentLoaded", init);
