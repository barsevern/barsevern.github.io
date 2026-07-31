import { applyPageMeta, escapeHtml, fetchJson, renderShell, setupRevealAnimations } from "./main.js?v=20260726-seo2";

function renderGallery(page) {
  const main = document.getElementById("page-content");

  main.innerHTML = `
    <section class="section stack">
      <div class="stack">
        <p class="section__eyebrow">Gallery</p>
        <h1>${escapeHtml(page.intro.heading)}</h1>
        <p class="lede">${escapeHtml(page.intro.text)}</p>
      </div>
      <div class="gallery-grid">
        ${(page.images || []).map((image, index) => `
          <article class="gallery-item">
            <figure>
              <button class="gallery-item__image gallery-item__button" type="button" data-gallery-open="${index}" aria-label="Open larger photo: ${escapeHtml(image.alt)}">
                <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async">
              </button>
              <figcaption class="gallery-item__caption">${escapeHtml(image.caption)}</figcaption>
            </figure>
          </article>
        `).join("")}
      </div>
    </section>
    <dialog class="gallery-lightbox" data-gallery-lightbox aria-label="Expanded gallery photo">
      <button class="gallery-lightbox__close" type="button" data-gallery-close aria-label="Close photo">&times;</button>
      <img class="gallery-lightbox__image" src="" alt="" data-gallery-lightbox-image>
      <p class="gallery-lightbox__caption" data-gallery-lightbox-caption></p>
    </dialog>
  `;
}

function setupGalleryLightbox(images = []) {
  const dialog = document.querySelector("[data-gallery-lightbox]");
  const dialogImage = dialog?.querySelector("[data-gallery-lightbox-image]");
  const caption = dialog?.querySelector("[data-gallery-lightbox-caption]");
  const closeButton = dialog?.querySelector("[data-gallery-close]");
  if (!dialog || !dialogImage || !caption || !closeButton) return;

  document.querySelectorAll("[data-gallery-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = images[Number(button.dataset.galleryOpen)];
      if (!selected) return;
      dialogImage.src = selected.src;
      dialogImage.alt = selected.alt;
      caption.textContent = selected.caption || "";
      dialog.showModal();
      document.body.classList.add("lightbox-open");
    });
  });

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("lightbox-open");
    dialogImage.src = "";
  });
}

async function init() {
  const [site, page] = await Promise.all([
    fetchJson("data/site.json"),
    fetchJson("data/gallery.json")
  ]);

  applyPageMeta(page.seo);
  renderShell(site);
  renderGallery(page);
  setupGalleryLightbox(page.images || []);
  setupRevealAnimations(document.getElementById("page-content"));
}

document.addEventListener("DOMContentLoaded", init);
