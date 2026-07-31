import { applyPageMeta, buildPhotoStrip, escapeHtml, fetchJson, renderShell, setupRevealAnimations } from "./main.js?v=20260726-seo2";

function renderEvents(page) {
  const main = document.getElementById("page-content");

  main.innerHTML = `
    <section class="section stack">
      <div class="stack">
        <p class="section__eyebrow">Events</p>
        <h1>${escapeHtml(page.intro.heading)}</h1>
        <p class="lede">${escapeHtml(page.intro.text)}</p>
      </div>
      <div class="content-grid events-layout">
        <article class="panel stack">
          <h2>Weekly fixtures</h2>
          <div class="timeline">
            ${(page.fixtures || []).map((item) => `
              <div class="timeline__item">
                <div class="timeline__time">${escapeHtml(item.day)} · ${escapeHtml(item.time)}</div>
                <h3>${escapeHtml(item.title)}</h3>
                <p class="card__text">${escapeHtml(item.details)}</p>
              </div>
            `).join("")}
          </div>
        </article>
        <article class="panel stack">
          <h2>Regular nights</h2>
          ${(page.events || []).map((item) => `
            <div class="card stack ${item.highlight ? "event-highlight" : ""}">
              <div class="card-meta">
                <span class="badge">${escapeHtml(item.time)}</span>
              </div>
              <h3>${escapeHtml(item.title)}</h3>
              <p class="card__text">${escapeHtml(item.details)}</p>
            </div>
          `).join("")}
        </article>
          <article class="panel stack events-atmosphere">
            <p class="section__eyebrow">Late nights</p>
            <h2>Music, DJs, and match day atmosphere</h2>
            ${buildPhotoStrip(page.images || [], "photo-strip photo-strip--three")}
          </article>
      </div>
    </section>
  `;
}

async function init() {
  const [site, page] = await Promise.all([
    fetchJson("data/site.json"),
    fetchJson("data/events.json")
  ]);

  applyPageMeta(page.seo);
  renderShell(site);
  renderEvents(page);
  setupRevealAnimations(document.getElementById("page-content"));
}

document.addEventListener("DOMContentLoaded", init);
