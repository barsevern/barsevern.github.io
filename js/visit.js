import { applyPageMeta, buildPhotoStrip, escapeHtml, fetchJson, formatAddress, getOpeningStatus, loadMapInto, renderShell, renderStructuredData, setupRevealAnimations } from "./main.js?v=20260726-seo2";

function renderVisit(page, site) {
  const main = document.getElementById("page-content");
  const addressText = formatAddress(site.address || {});
  const openState = getOpeningStatus(site.hours || []);

  main.innerHTML = `
    <section class="section stack">
      <div class="stack">
        <p class="section__eyebrow">Visit</p>
        <h1>${escapeHtml(page.intro.heading)}</h1>
        <p class="lede">${escapeHtml(page.intro.text)}</p>
      </div>
      <div class="visit-grid">
        <article class="card stack visit-contact">
          <h2>Contact</h2>
          <ul class="policy__list">
            ${(page.contactCards || []).map((item) => `
              <li>
                <strong>${escapeHtml(item.title)}:</strong>
                ${item.title.toLowerCase() === "phone"
                  ? `<a class="contact-phone" href="tel:${escapeHtml(site.phoneTel || item.text)}">${escapeHtml(item.text)}</a>`
                  : escapeHtml(item.text)}
              </li>
            `).join("")}
          </ul>
          <div class="hero-badges">
            <span class="status-pill ${openState.isOpen ? "is-open" : "is-closed"}">${escapeHtml(openState.label)} · ${escapeHtml(openState.detail)}</span>
          </div>
        </article>
        <article class="panel stack">
          <h2>Opening hours</h2>
          <ul class="hours-list">
            ${(site.hours || []).map((item) => `<li><span>${escapeHtml(item.day)}</span><span>${item.closed ? "Closed" : `${escapeHtml(item.opens)} - ${escapeHtml(item.closes)}`}</span></li>`).join("")}
          </ul>
        </article>
      </div>
      <div class="content-grid visit-info-grid">
        <article class="panel stack">
          <h2>Getting here</h2>
          <ul class="policy__list">
            ${(page.travel || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
        <article class="panel stack">
          <h2>Accessibility</h2>
          <ul class="policy__list">
            ${(page.accessibility || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
      </div>
      <div class="visit-location-grid">
        <article class="panel stack visit-surroundings">
          <p class="section__eyebrow">Nearby</p>
          <h2>Find us and the space around us</h2>
          ${buildPhotoStrip(page.images || [], "photo-strip visit-photo-strip")}
          <p class="section__text visit-teaser">Bar 7 is easy to spot on Old Street, with outdoor space at the back and the centre of Upton just a short walk away.</p>
        </article>
        <section class="map-placeholder visit-map" data-map-container>
          <div class="map-placeholder__panel">
            <div class="stack">
              <p class="section__eyebrow">${escapeHtml(page.map.title)}</p>
              <h2 class="map-placeholder__title">${escapeHtml(page.map.placeholder)}</h2>
              <p class="map-placeholder__text">The map only loads after you accept it, which keeps third-party content out until you choose to show it.</p>
            </div>
            <button type="button" class="button button--accent" data-map-accept>${escapeHtml(page.map.button)}</button>
          </div>
        </section>
      </div>
    </section>
  `;

  const mapContainer = document.querySelector("[data-map-container]");
  const acceptButton = document.querySelector("[data-map-accept]");
  const mapConsent = window.Bar7Consent?.hasMapConsent();
  const mapUrl = site.mapEmbedUrl || `https://www.google.com/maps?q=${encodeURIComponent(addressText)}&output=embed`;

  const showMap = () => {
    if (mapContainer) {
      mapContainer.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.className = "map-frame";
      iframe.title = page.map.frameTitle;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.src = mapUrl;
      mapContainer.appendChild(iframe);
    }
    if (acceptButton) {
      acceptButton.remove();
    }
    window.Bar7Consent?.acceptMap();
  };

  if (mapConsent) {
    showMap();
  } else if (acceptButton) {
    acceptButton.addEventListener("click", showMap);
  }
}

async function init() {
  const [site, page] = await Promise.all([
    fetchJson("data/site.json"),
    fetchJson("data/visit.json")
  ]);

  applyPageMeta(page.seo);
  renderShell(site);
  renderStructuredData(site, page.seo.canonical);
  renderVisit(page, site);
  setupRevealAnimations(document.getElementById("page-content"));
}

document.addEventListener("DOMContentLoaded", init);
