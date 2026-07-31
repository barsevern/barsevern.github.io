import { applyPageMeta, escapeHtml, fetchJson, renderShell } from "./main.js?v=20260726-seo2";

function renderStars(rating, label, className = "") {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const percentage = (safeRating / 5) * 100;
  return `
    <span class="stars-graphic ${className}" aria-label="${escapeHtml(label)}">
      <span class="stars-graphic__base" aria-hidden="true">★★★★★</span>
      <span class="stars-graphic__fill" aria-hidden="true" style="width:${percentage}%">★★★★★</span>
    </span>
  `;
}

function renderReviewCards(reviews = [], fallbackRating = 0) {
  return reviews.map((review) => {
    const hasIndividualRating = Number(review.rating) > 0;
    const displayedRating = hasIndividualRating ? Number(review.rating) : fallbackRating;
    const ratingLabel = hasIndividualRating
      ? `${displayedRating} out of 5 stars`
      : `Bar 7 overall rating: ${displayedRating} out of 5 stars; individual rating not supplied`;
    return `
    <article class="card review-card">
      <div class="review-card__header">
        <h2>${escapeHtml(review.author || "Guest")}</h2>
      </div>
      ${renderStars(displayedRating, ratingLabel, "review-card__rating")}
      ${review.text ? `<p class="card__text">${escapeHtml(review.text)}</p>` : ""}
      ${review.dateLabel ? `<span class="review-card__date">${escapeHtml(review.dateLabel)}</span>` : ""}
    </article>
  `;}).join("");
}

function renderSavedReviews(reviews = [], fallbackRating = 0) {
  if (!reviews.length) {
    return `<div class="panel reviews-empty">Saved reviews will appear here after <code>data/reviews.json</code> has been populated.</div>`;
  }

  return `
    <div class="reviews-grid" data-reviews-grid>
      ${renderReviewCards(reviews, fallbackRating)}
    </div>
  `;
}

function ageInDays(label = "") {
  const value = Number.parseInt(label, 10) || 0;
  if (label.includes("week")) return value * 7;
  if (label.includes("month")) return value * 30;
  if (label.includes("year")) return value * 365;
  return value;
}

function setupReviewSort(reviews = [], fallbackRating = 0) {
  const select = document.querySelector("[data-review-sort]");
  const grid = document.querySelector("[data-reviews-grid]");
  if (!select || !grid) return;

  select.addEventListener("change", () => {
    const sorted = reviews.map((review, index) => ({ ...review, sourceIndex: index }));
    const stable = (difference, a, b) => difference || a.sourceIndex - b.sourceIndex;

    if (select.value === "newest") {
      sorted.sort((a, b) => stable(ageInDays(a.dateLabel) - ageInDays(b.dateLabel), a, b));
    } else if (select.value === "oldest") {
      sorted.sort((a, b) => stable(ageInDays(b.dateLabel) - ageInDays(a.dateLabel), a, b));
    } else if (select.value === "highest") {
      sorted.sort((a, b) => stable((Number(b.rating) || 0) - (Number(a.rating) || 0), a, b));
    } else if (select.value === "lowest") {
      sorted.sort((a, b) => stable((Number(a.rating) || 0) - (Number(b.rating) || 0), a, b));
    }

    grid.innerHTML = renderReviewCards(sorted, fallbackRating);
  });

  select.dispatchEvent(new Event("change"));
}

function renderReviews(page) {
  const main = document.getElementById("page-content");
  main.innerHTML = `
    <section class="section stack">
      <div class="stack">
        <p class="section__eyebrow">Reviews</p>
        <h1>${escapeHtml(page.intro.heading)}</h1>
        <p class="lede">${escapeHtml(page.intro.text)}</p>
      </div>
      <div class="reviews-summary panel">
        ${renderStars(page.summary.rating, `${page.summary.rating} out of 5 stars`, "reviews-summary__stars")}
        <strong>${escapeHtml(page.summary.rating)} out of 5</strong>
        <span>${escapeHtml(page.summary.reviewCount)} Google reviews</span>
      </div>
      <div class="reviews-toolbar">
        <label for="review-sort">Sort reviews</label>
        <select id="review-sort" data-review-sort>
          <option value="newest">Newest</option>
          <option value="highest">Highest rating</option>
          <option value="oldest">Oldest</option>
          <option value="lowest">Lowest rating</option>
        </select>
      </div>
      ${renderSavedReviews(page.reviews || [], page.summary.rating)}
    </section>
  `;
}

async function init() {
  const [site, page] = await Promise.all([
    fetchJson("data/site.json"),
    fetchJson("data/reviews.json")
  ]);

  applyPageMeta(page.seo);
  renderShell(site);
  renderReviews(page);
  setupReviewSort(page.reviews || [], page.summary.rating);
}

document.addEventListener("DOMContentLoaded", init);
