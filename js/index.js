import { applyPageMeta, buildPhotoStrip, escapeHtml, fetchJson, formatAddress, getOpeningStatus, renderShell, renderStructuredData, setupRevealAnimations } from "./main.js?v=20260726-seo2";

function renderHome(page, site) {
  const main = document.getElementById("page-content");
  const openState = getOpeningStatus(site.hours || []);
  const address = formatAddress(site.address || {});

  main.innerHTML = `
    <section class="section hero-section">
      <div class="hero-grid">
        <div class="stack hero-kicker">
          <p class="section__eyebrow">${escapeHtml(page.hero.eyebrow)}</p>
          <h1>${escapeHtml(page.hero.title)}</h1>
          <p class="lede">${escapeHtml(page.hero.lead)}</p>
          <div class="button-row">
            <a class="button button--accent" href="${escapeHtml(page.hero.primaryCta.href)}">${escapeHtml(page.hero.primaryCta.label)}</a>
            <a class="button button--ghost" href="${escapeHtml(page.hero.secondaryCta.href)}">${escapeHtml(page.hero.secondaryCta.label)}</a>
          </div>
        </div>
        <figure class="hero-media">
          <img src="${escapeHtml(page.hero.image.src)}" alt="${escapeHtml(page.hero.image.alt)}" loading="eager" decoding="async" fetchpriority="high">
        </figure>
      </div>
      <div class="hero-badges hero-details">
        <a class="badge contact-phone" href="tel:${escapeHtml(site.phoneTel || site.phone)}">Call ${escapeHtml(site.phone)}</a>
        <a class="badge location-link" href="${escapeHtml(site.googleMapsUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(address)}</a>
        <span class="status-pill ${openState.isOpen ? "is-open" : "is-closed"}">${escapeHtml(openState.label)} · ${escapeHtml(openState.detail)}</span>
      </div>
    </section>

    <section class="section stack">
      <div class="stack">
        <p class="section__eyebrow">Highlights</p>
        <h2>${escapeHtml(page.intro.heading)}</h2>
        <p class="section__text">${escapeHtml(page.intro.text)}</p>
      </div>
      <div class="card-grid">
        ${(page.highlights || []).map((item) => {
          const href = item.href || item.image?.href;
          const tag = href ? "a" : "article";
          return `
          <${tag} class="card highlight-card ${href ? "highlight-card--link" : ""}" ${href ? `href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(item.title)} website"` : ""}>
            <div class="highlight-card__image">
              <img src="${escapeHtml(item.image.src)}" alt="${escapeHtml(item.image.alt)}" loading="lazy" decoding="async">
            </div>
            <div class="stack highlight-card__body">
              <h3 class="card__title">${escapeHtml(item.title)}</h3>
              <p class="card__text">${escapeHtml(item.text)}</p>
              ${href ? `<span class="highlight-card__link-label">Visit Mojitos <span aria-hidden="true">↗</span></span>` : ""}
            </div>
          </${tag}>
        `;}).join("")}
      </div>
    </section>

    <section class="section stack">
      <div class="stack">
        <p class="section__eyebrow">Live music</p>
        <h2>What the room looks like when the music starts</h2>
        <p class="section__text">A few shots from live music nights, loaded locally and kept lazy so the page stays quick.</p>
      </div>
      ${buildPhotoStrip(page.liveMusic || [], "photo-strip photo-strip--three")}
    </section>

    <section class="section content-grid">
      <article class="panel image-carousel" data-carousel>
        <div class="image-carousel__viewport">
          <img class="image-carousel__image" src="${escapeHtml(page.carousel[0].src)}" alt="${escapeHtml(page.carousel[0].alt)}" loading="lazy" decoding="async" fetchpriority="low" data-carousel-image>
          <button class="image-carousel__control image-carousel__control--previous" type="button" aria-label="Previous photo" data-carousel-previous>&lt;</button>
          <button class="image-carousel__control image-carousel__control--next" type="button" aria-label="Next photo" data-carousel-next>&gt;</button>
          <div class="image-carousel__counter" aria-live="polite" data-carousel-counter>1 / ${page.carousel.length}</div>
        </div>
      </article>
      <div class="stack home-features">
        ${(page.features || []).map((item) => `
          <article class="card stack">
            <h3 class="card__title">${escapeHtml(item.title)}</h3>
            <p class="card__text">${escapeHtml(item.text)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function setupCarousel(images = []) {
  const carousel = document.querySelector("[data-carousel]");
  const image = carousel?.querySelector("[data-carousel-image]");
  const counter = carousel?.querySelector("[data-carousel-counter]");
  if (!carousel || !image || images.length < 2) return;

  let currentIndex = 0;
  let timer = null;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const saveData = navigator.connection?.saveData === true;

  const showImage = (index) => {
    currentIndex = (index + images.length) % images.length;
    image.src = images[currentIndex].src;
    image.alt = images[currentIndex].alt;
    if (counter) counter.textContent = `${currentIndex + 1} / ${images.length}`;
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  const start = () => {
    if (reducedMotion || saveData || document.hidden || timer) return;
    timer = window.setInterval(() => showImage(currentIndex + 1), 5500);
  };

  carousel.querySelector("[data-carousel-previous]")?.addEventListener("click", () => {
    showImage(currentIndex - 1);
    stop();
    start();
  });
  carousel.querySelector("[data-carousel-next]")?.addEventListener("click", () => {
    showImage(currentIndex + 1);
    stop();
    start();
  });
  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", start);
  document.addEventListener("visibilitychange", () => {
    stop();
    start();
  });
  start();
}

async function init() {
  const [site, page] = await Promise.all([
    fetchJson("data/site.json"),
    fetchJson("data/index.json")
  ]);

  applyPageMeta(page.seo);
  renderShell(site);
  renderStructuredData(site, page.seo.canonical);
  renderHome(page, site);
  setupCarousel(page.carousel || []);
  setupRevealAnimations(document.getElementById("page-content"));
}

document.addEventListener("DOMContentLoaded", init);
