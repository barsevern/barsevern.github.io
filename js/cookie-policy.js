import { applyPageMeta, buildPhotoStrip, escapeHtml, fetchJson, renderShell, setupRevealAnimations } from "./main.js?v=20260726-seo2";

function renderPolicy(page, policy) {
  const main = document.getElementById("page-content");

  main.innerHTML = `
    <section class="section stack policy-page policy-shell">
      <div class="stack">
        <p class="section__eyebrow">${escapeHtml(page)}</p>
        <h1>${escapeHtml(policy.title)}</h1>
        <p class="lede">Last updated ${escapeHtml(policy.updated)}.</p>
        <p class="policy__intro">${escapeHtml(policy.intro)}</p>
      </div>
      <div class="policy-grid">
        ${(policy.sections || []).map((section) => `
          <article class="policy__section">
            <h2 class="policy__heading">${escapeHtml(section.heading)}</h2>
            ${section.body ? `<p class="section__text">${escapeHtml(section.body)}</p>` : ""}
            ${section.items ? `<ul class="policy__list">${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
          </article>
        `).join("")}
      </div>
      <article class="panel stack">
        <p class="section__eyebrow">Photo context</p>
        ${buildPhotoStrip(page.images || [], "photo-strip photo-strip--three")}
      </article>
    </section>
  `;
}

async function init() {
  const [site, policies] = await Promise.all([
    fetchJson("data/site.json"),
    fetchJson("data/policies.json")
  ]);

  applyPageMeta(policies.seo.cookies);
  renderShell(site);
  renderPolicy("Cookie policy", policies.cookies);
  setupRevealAnimations(document.getElementById("page-content"));
}

document.addEventListener("DOMContentLoaded", init);
