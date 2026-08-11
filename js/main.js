const STORAGE_KEYS = {
  consent: "bar7-cookie-consent",
  mapConsent: "bar7-map-consent"
};

function getHeadMeta(selector) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    const nameMatch = selector.match(/meta\[(name|property)=\"([^\"]+)\"\]/);
    if (nameMatch) {
      element.setAttribute(nameMatch[1], nameMatch[2]);
    }
    document.head.appendChild(element);
  }
  return element;
}

export async function fetchJson(path) {
  const separator = path.includes("?") ? "&" : "?";
  const versionedPath = `${path}${separator}v=20260726-seo2`;
  const response = await fetch(versionedPath, { cache: "default" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

export function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatAddress(address = {}) {
  return [address.streetAddress, address.addressLocality, address.addressRegion, address.postalCode]
    .filter(Boolean)
    .join(", ");
}

export function formatPhone(phone = "") {
  return phone;
}

export function timeToMinutes(time = "00:00") {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60) + minutes;
}

export function getOpeningStatus(hours = [], date = new Date()) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = hours.find((entry) => entry.day === dayNames[date.getDay()]);

  if (!today || today.closed) {
    const nextOpening = Array.from({ length: 7 }, (_, offset) => {
      const dayIndex = (date.getDay() + offset + 1) % 7;
      const entry = hours.find((item) => item.day === dayNames[dayIndex]);
      return entry && !entry.closed ? entry : null;
    }).find(Boolean);

    return {
      label: "Closed today",
      detail: nextOpening ? `Opens ${nextOpening.day} ${nextOpening.opens}` : "Check opening hours",
      isOpen: false
    };
  }

  const currentMinutes = (date.getHours() * 60) + date.getMinutes();
  const openMinutes = timeToMinutes(today.opens);
  const closeMinutes = timeToMinutes(today.closes);
  const crossesMidnight = closeMinutes <= openMinutes;

  const isOpen = crossesMidnight
    ? currentMinutes >= openMinutes || currentMinutes < closeMinutes
    : currentMinutes >= openMinutes && currentMinutes < closeMinutes;

  const minutesUntilOpen = openMinutes - currentMinutes;
  const openingSoon = !isOpen && minutesUntilOpen > 0 && minutesUntilOpen <= 90;

  return {
    label: isOpen ? "Open now" : openingSoon ? "Opening soon" : "Closed now",
    detail: isOpen ? `Closes ${today.closes}` : `Opens ${today.opens}`,
    isOpen,
    day: today.day
  };
}

export function buildOpeningHoursSpecification(hours = []) {
  return hours.filter((entry) => !entry.closed).map((entry) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: `https://schema.org/${entry.day}`,
    opens: entry.opens,
    closes: entry.closes
  }));
}

export function applyPageMeta(seo = {}) {
  if (seo.title) {
    document.title = seo.title;
  }

  const updateMeta = (selector, key, value) => {
    if (typeof value === "undefined" || value === null || value === "") {
      return;
    }
    const meta = getHeadMeta(selector);
    meta.setAttribute(key, value);
  };

  updateMeta('meta[name="description"]', "content", seo.description);
  updateMeta('meta[name="robots"]', "content", seo.robots || "index,follow,max-image-preview:large");
  updateMeta('meta[name="theme-color"]', "content", "#17120f");
  updateMeta('meta[property="og:title"]', "content", seo.title);
  updateMeta('meta[property="og:description"]', "content", seo.description);
  updateMeta('meta[property="og:type"]', "content", seo.ogType || "website");
  updateMeta('meta[property="og:image"]', "content", seo.ogImage || seo.image || "");
  updateMeta('meta[property="og:site_name"]', "content", seo.siteName || "Bar 7 Sports Bar");
  updateMeta('meta[property="og:url"]', "content", seo.canonical || location.href);
  updateMeta('meta[name="twitter:card"]', "content", "summary_large_image");
  updateMeta('meta[name="twitter:title"]', "content", seo.title);
  updateMeta('meta[name="twitter:description"]', "content", seo.description);
  updateMeta('meta[name="twitter:image"]', "content", seo.ogImage || seo.image || "");
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = seo.canonical || `${location.pathname.split("/").pop() || "index.html"}`;
}

function getConsent() {
  return localStorage.getItem(STORAGE_KEYS.consent);
}

function setConsent(value) {
  localStorage.setItem(STORAGE_KEYS.consent, value);
}

function getMapConsent() {
  return localStorage.getItem(STORAGE_KEYS.mapConsent);
}

function setMapConsent(value) {
  localStorage.setItem(STORAGE_KEYS.mapConsent, value);
}

function renderCookieBanner(site) {
  let banner = document.querySelector("[data-cookie-banner]");

  if (!banner) {
    banner = document.createElement("aside");
    banner.className = "cookie-banner";
    banner.setAttribute("data-cookie-banner", "true");
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", site.cookieBanner?.title || "Cookie choices");
    banner.hidden = true;
    banner.innerHTML = `
      <div class="cookie-banner__inner">
        <div class="stack">
          <h2 class="section__title" style="font-size:1.45rem;">${escapeHtml(site.cookieBanner?.title || "Cookie choices")}</h2>
          <p class="cookie-banner__text">${escapeHtml(site.cookieBanner?.copy || "")}</p>
        </div>
        <div class="cookie-banner__actions">
          <button type="button" class="button button--accent" data-cookie-accept>${escapeHtml(site.cookieBanner?.accept || "Accept")}</button>
          <button type="button" class="button button--ghost" data-cookie-reject>${escapeHtml(site.cookieBanner?.reject || "Reject")}</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
  }

  const acceptButton = banner.querySelector("[data-cookie-accept]");
  const rejectButton = banner.querySelector("[data-cookie-reject]");

  if (acceptButton && !acceptButton.dataset.bound) {
    acceptButton.dataset.bound = "true";
    acceptButton.addEventListener("click", () => {
      setConsent("accepted");
      banner.hidden = true;
    });
  }

  if (rejectButton && !rejectButton.dataset.bound) {
    rejectButton.dataset.bound = "true";
    rejectButton.addEventListener("click", () => {
      setConsent("rejected");
      banner.hidden = true;
    });
  }

  banner.hidden = Boolean(getConsent());
  return banner;
}

function bindCookieSettingsLinks(banner) {
  document.querySelectorAll("[data-cookie-settings]").forEach((link) => {
    if (link.dataset.bound === "true") {
      return;
    }
    link.dataset.bound = "true";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      banner.hidden = false;
      banner.querySelector("[data-cookie-accept]")?.focus();
    });
  });
}

function bindNavigation() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-site-nav]");

  if (!toggle || !nav || toggle.dataset.bound === "true") {
    return;
  }

  toggle.dataset.bound = "true";
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  if (header && !header.dataset.scrollBound) {
    header.dataset.scrollBound = "true";
    let ticking = false;

    const updateHeader = () => {
      const shouldCollapse = window.scrollY > 120;
      const changed = header.classList.contains("is-collapsed") !== shouldCollapse;
      header.classList.toggle("is-collapsed", shouldCollapse);

      if (changed) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });

    updateHeader();
  }
}

function markActiveNavLinks() {
  const currentPage = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  document.querySelectorAll("[data-site-nav] a").forEach((link) => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    const active = href === currentPage || (currentPage === "" && href === "index.html") || (currentPage === "index.html" && href === "./index.html");
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function setFooterYear() {
  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}

export function renderShell(site) {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  const openState = getOpeningStatus(site.hours || []);
  const logoPath = site.logoPath || "data/image/Logo.webp";

  if (!document.querySelector("[data-seven-background]")) {
    const canvas = document.createElement("canvas");
    canvas.className = "site-backdrop__canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.setAttribute("data-seven-background", "true");
    document.body.insertAdjacentElement("afterbegin", canvas);
    setupSevenCanvas(canvas, {
      density: site.backdrop?.density || 28,
      drift: site.backdrop?.drift || 0.13
    });
  }

  let favicon = document.head.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }
  favicon.href = site.faviconPath || logoPath;

  const socialImage = new URL(site.socialImage || logoPath, site.websiteUrl || location.href).href;
  const pageUrl = location.href.split("#")[0].split("?")[0];
  const pageName = location.pathname.split("/").pop() || "index.html";
  const canonicalUrl = site.websiteUrl
    ? new URL(pageName === "index.html" ? "./" : pageName, site.websiteUrl).href
    : pageUrl;
  const updateSocialMeta = (selector, attribute, value) => {
    const element = getHeadMeta(selector);
    element.setAttribute(attribute, value);
  };
  updateSocialMeta('meta[property="og:image"]', "content", socialImage);
  updateSocialMeta('meta[property="og:image:alt"]', "content", "Inside Bar 7 Sports Bar in Upton upon Severn");
  updateSocialMeta('meta[property="og:url"]', "content", canonicalUrl);
  updateSocialMeta('meta[name="twitter:card"]', "content", "summary_large_image");
  updateSocialMeta('meta[name="twitter:image"]', "content", socialImage);
  const canonical = document.head.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.href = canonicalUrl;
  }

  if (!document.getElementById("structured-data")) {
    const schema = document.createElement("script");
    schema.type = "application/ld+json";
    schema.id = "structured-data";
    document.head.appendChild(schema);
  }
  renderStructuredData(site, canonicalUrl);

  if (header) {
    header.innerHTML = `
      <div class="site-header__bar">
        <a class="brand" href="index.html" aria-label="${escapeHtml(site.brand)} home">
          <span class="brand__logo" aria-hidden="true"><img src="${escapeHtml(logoPath)}" alt=""></span>
          <span class="brand__text">
            <span class="brand__name">${escapeHtml(site.brand)}</span>
            <span class="brand__tagline">${escapeHtml(site.tagline || "")}</span>
          </span>
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle>
          <span class="nav-toggle__icon" aria-hidden="true"></span>
          <span>Menu</span>
        </button>
        <nav class="site-nav" id="site-nav" aria-label="Primary navigation" data-site-nav>
          <ul class="nav-list">
            ${(site.nav || []).map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`).join("")}
          </ul>
        </nav>
      </div>
    `;
  }

  if (footer) {
    footer.innerHTML = `
      <div class="site-footer">
        <div class="footer-minimal">
          <div class="footer-minimal__brand">
            <span class="footer-minimal__logo" aria-hidden="true"><img src="${escapeHtml(logoPath)}" alt=""></span>
            <p class="footer-minimal__name">${escapeHtml(site.brand)}</p>
            <p class="footer-minimal__meta">${escapeHtml(formatAddress(site.address || {}))}</p>
          </div>
          <div class="footer-minimal__actions">
            <div class="footer-minimal__status ${openState.isOpen ? "is-open" : "is-closed"}">${escapeHtml(openState.label)} · ${escapeHtml(openState.detail)}</div>
            <div class="footer-minimal__links">
              <a href="privacy-policy.html">Privacy</a>
              <a href="cookie-policy.html">Cookies</a>
              <a href="#" data-cookie-settings>${escapeHtml(site.cookieBanner?.settings || "Cookie settings")}</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© <span data-current-year></span> ${escapeHtml(site.brand)}. All rights reserved.</span>
          <span class="footer-bottom__location">
            <a class="footer-facebook" href="${escapeHtml(site.facebookUrl || "#")}" target="_blank" rel="noopener noreferrer" aria-label="Bar 7 Sports Bar on Facebook">
              <img class="footer-facebook__icon" src="data/image/facebook.svg?v=2" alt="" aria-hidden="true" width="20" height="20" style="width:20px;min-width:20px;max-width:20px;height:20px;min-height:20px;max-height:20px;flex:0 0 20px;">
              <span>Facebook</span>
            </a>
            <span>${escapeHtml(site.address?.addressLocality || "Upton upon Severn")}</span>
          </span>
        </div>
        <div class="footer-reviews-link">
          <a href="reviews.html">Check out our reviews</a>
        </div>
        <p class="footer-credit">This Site was developed by <a href="mailto:bailie@byrnebusiness.com">Bailie Byrne</a> and remains his IP</p>
      </div>
    `;
  }

  const banner = renderCookieBanner(site);
  bindNavigation();
  bindCookieSettingsLinks(banner);
  markActiveNavLinks();
  setFooterYear();

  window.Bar7Consent = {
    openSettings() {
      banner.hidden = false;
      banner.querySelector("[data-cookie-accept]")?.focus();
    },
    getConsent,
    hasAccepted() {
      return getConsent() === "accepted";
    },
    getMapConsent,
    hasMapConsent() {
      return getMapConsent() === "accepted";
    },
    setMapConsent(value) {
      setMapConsent(value);
    },
    acceptMap() {
      setMapConsent("accepted");
    }
  };

  return { header, footer, banner };
}

export function renderStructuredData(site, pageUrl) {
  const existing = document.getElementById("structured-data");
  if (!existing) {
    return;
  }

  const absoluteUrl = site.websiteUrl || pageUrl || location.href;
  const businessUrl = site.websiteUrl || new URL("index.html", absoluteUrl).href;
  const absoluteImage = new URL(site.socialImage || site.logoPath || "data/image/Logo.webp", absoluteUrl).href;
  const payload = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    "@id": `${businessUrl.split("#")[0].split("?")[0]}#bar7`,
    name: site.brand,
    description: site.description,
    image: absoluteImage,
    logo: new URL(site.logoPath || "data/image/Logo.webp", absoluteUrl).href,
    telephone: site.phoneTel || site.phone,
    priceRange: "£",
    currenciesAccepted: "GBP",
    paymentAccepted: "Cash, Credit Card, Debit Card",
    sameAs: [site.facebookUrl].filter(Boolean),
    hasMap: site.googleMapsUrl,
    geo: site.geo ? {
      "@type": "GeoCoordinates",
      latitude: site.geo.latitude,
      longitude: site.geo.longitude
    } : undefined,
    areaServed: (site.areaServed || []).map((name) => ({
      "@type": "Place",
      name
    })),
    address: {
      "@type": "PostalAddress",
      ...site.address
    },
    openingHoursSpecification: buildOpeningHoursSpecification(site.hours || []),
    url: businessUrl
  };

  existing.textContent = JSON.stringify(payload);
}

export function createMapIframe(addressText, title) {
  const iframe = document.createElement("iframe");
  iframe.className = "map-frame";
  iframe.title = title;
  iframe.loading = "lazy";
  iframe.referrerPolicy = "no-referrer-when-downgrade";
  iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(addressText)}&output=embed`;
  return iframe;
}

export function loadMapInto(container, addressText, title) {
  if (!container) {
    return;
  }
  container.innerHTML = "";
  container.appendChild(createMapIframe(addressText, title));
}

export function setupRevealAnimations(root = document) {
  const scope = root instanceof Document ? root : root || document;
  const desktopLayout = window.matchMedia?.("(min-width: 900px)").matches;
  if (desktopLayout) {
    return null;
  }

  const targets = Array.from(scope.querySelectorAll(".gallery-item, .timeline__item"));

  if (!targets.length) {
    return null;
  }

  targets.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index * 45, 180)}ms`);
  });

  if (!("IntersectionObserver" in window)) {
    targets.forEach((element) => element.classList.add("is-visible"));
    return null;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: "0px 0px -8% 0px"
  });

  targets.forEach((element) => observer.observe(element));
  return observer;
}

export function buildPhotoStrip(images = [], stripClassName = "photo-strip", figureClassName = "photo-strip__item") {
  if (!images.length) {
    return "";
  }

  return `
    <div class="${stripClassName}">
      ${images.map((image, index) => `
        <figure class="${figureClassName}" style="--strip-delay:${Math.min(index * 80, 320)}ms">
          <div class="gallery-item__image">
            <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async">
          </div>
          <figcaption class="gallery-item__caption">${escapeHtml(image.caption || "")}</figcaption>
        </figure>
      `).join("")}
    </div>
  `;
}

export function setupSevenCanvas(canvas, { density = 28, drift = 0.13 } = {}) {
  if (!canvas) {
    return null;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = navigator.connection?.saveData === true;
  const lowMemoryDevice = Number(navigator.deviceMemory) > 0 && Number(navigator.deviceMemory) <= 2;
  const staticBackdrop = prefersReducedMotion || saveData || lowMemoryDevice;
  const narrowScreen = window.matchMedia?.("(max-width: 639px)").matches;
  const frameInterval = 1000 / (narrowScreen ? 15 : 24);
  const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), narrowScreen ? 1 : 1.5);
  const fonts = [
    '"Oswald", sans-serif',
    'Georgia, serif',
    '"Times New Roman", serif',
    'Impact, sans-serif',
    '"Trebuchet MS", sans-serif',
    '"Arial Black", sans-serif',
    '"Brush Script MT", "Segoe Script", cursive',
    '"Lucida Calligraphy", "Apple Chancery", cursive',
    '"Monotype Corsiva", "URW Chancery L", cursive',
    '"Edwardian Script ITC", "Snell Roundhand", cursive'
  ];
  const colours = ["#1d6fff", "#3b82f6", "#55b9ff", "#55e7ff", "#2563eb", "#7dd3fc"];

  let width = 0;
  let height = 0;
  let animationFrame = 0;
  let lastFrameTime = 0;
  let running = false;
  let scrollResumeTimer = 0;
  const glyphs = [];

  const makeSprite = (size, font, colour, weight) => {
    const pad = size * 0.35;
    const spriteSize = Math.ceil(size + pad * 2);
    const sprite = document.createElement("canvas");
    sprite.width = Math.ceil(spriteSize * dpr);
    sprite.height = Math.ceil(spriteSize * dpr);
    const spriteCtx = sprite.getContext("2d");
    spriteCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spriteCtx.translate(spriteSize / 2, spriteSize / 2);
    spriteCtx.textAlign = "center";
    spriteCtx.textBaseline = "middle";
    spriteCtx.font = `${weight} ${size}px ${font}`;
    spriteCtx.fillStyle = colour;
    spriteCtx.fillText("7", 0, 0);
    spriteCtx.strokeStyle = "rgba(125, 211, 252, 0.55)";
    spriteCtx.lineWidth = Math.max(size * 0.025, 0.75);
    spriteCtx.strokeText("7", 0, 0);
    return { sprite, spriteSize };
  };

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(Math.floor(bounds.width), 1);
    height = Math.max(Math.floor(bounds.height), 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const createGlyph = () => {
    const size = 20 + Math.random() * (narrowScreen ? 42 : 68);
    const font = fonts[Math.floor(Math.random() * fonts.length)];
    const colour = colours[Math.floor(Math.random() * colours.length)];
    const weight = Math.random() > 0.28 ? "700" : "600";
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size,
      ...makeSprite(size, font, colour, weight),
      speed: drift + Math.random() * 0.25,
      sway: (Math.random() - 0.5) * 0.22,
      rotation: (Math.random() - 0.5) * 0.45,
      opacity: 0.14 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2
    };
  };

  const seedGlyphs = () => {
    // Fewer glyphs on narrow viewports - mobile devices feel the per-frame cost most.
    const maxGlyphs = width < 640 ? Math.min(density, 12) : density;
    glyphs.length = 0;
    for (let index = 0; index < maxGlyphs; index += 1) {
      glyphs.push(createGlyph());
    }
  };

  const drawGlyph = (glyph, time) => {
    const floatOffset = Math.sin(time * 0.00018 + glyph.phase) * 10;
    const y = glyph.y + floatOffset;
    const x = glyph.x + Math.cos(time * 0.00014 + glyph.phase) * 7;

    context.save();
    context.globalAlpha = glyph.opacity;
    context.translate(x, y);
    context.rotate(glyph.rotation + Math.sin(time * 0.00025 + glyph.phase) * 0.05);
    context.drawImage(glyph.sprite, -glyph.spriteSize / 2, -glyph.spriteSize / 2, glyph.spriteSize, glyph.spriteSize);
    context.restore();
  };

  const renderFrame = (time) => {
    context.clearRect(0, 0, width, height);
    glyphs.forEach((glyph, index) => {
      drawGlyph(glyph, time + index * 120);
      glyph.y -= glyph.speed;
      glyph.x += Math.sin(time * 0.00012 + glyph.phase) * glyph.sway;

      if (glyph.y < -80) {
        glyph.y = height + 80;
        glyph.x = Math.random() * width;
      }

      if (glyph.x < -80) {
        glyph.x = width + 80;
      } else if (glyph.x > width + 80) {
        glyph.x = -80;
      }
    });
  };

  const animate = (time) => {
    if (!running) {
      return;
    }
    if (time - lastFrameTime >= frameInterval) {
      lastFrameTime = time;
      renderFrame(time);
    }
    animationFrame = window.requestAnimationFrame(animate);
  };

  const start = () => {
    if (running) {
      return;
    }
    running = true;
    lastFrameTime = 0;
    animationFrame = window.requestAnimationFrame(animate);
  };

  const stop = () => {
    running = false;
    window.cancelAnimationFrame(animationFrame);
  };

  resize();
  seedGlyphs();

  if (staticBackdrop) {
    // Keep the visual but avoid continuous work for reduced motion, data saver, or low-memory devices.
    renderFrame(0);
  } else {
    start();
  }

  const handleResize = () => {
    resize();
    seedGlyphs();
  };

  const handleVisibility = () => {
    if (staticBackdrop) {
      return;
    }
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  };

  const handleScroll = () => {
    if (staticBackdrop) {
      return;
    }
    stop();
    window.clearTimeout(scrollResumeTimer);
    scrollResumeTimer = window.setTimeout(() => {
      if (!document.hidden) {
        start();
      }
    }, 160);
  };

  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);

  return {
    destroy() {
      stop();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    }
  };
}
