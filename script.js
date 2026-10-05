/* ==========================================================================
   script.js — Portfolio ✦ Shivam Mishra
   Flags, Contact Data, Hydration, Safe Image Loader, Mobile Dialog
   ========================================================================== */

// 1. CONFIGURATION FLAGS (Line 7 to 13)
window.SITE = {
  INTRO: true,               // true = cinematic opening play karega; false = seedhe page dikhayega
  STAR_CURSOR: true,         // true = custom four-point star cursor enable hoga
  IMAGE_MOTION: "full",      // "full" | "lite" | "none" (screenshot scrub aur card parallax control)
  introReady: null,          // Promise: intro bloom ke 70% par resolve hoga
  _resolveIntro: null        // Internal resolver function
};

// Promise initialization taaki motion.js intro ka wait kar sake
window.SITE.introReady = new Promise((resolve) => {
  window.SITE._resolveIntro = resolve;
});

// 2. CONTACT DETAILS (Line 21 to 29) — Sirf yahin par Shivam Mishra ke details exist karte hain
const CONTACT = {
  name: "Shivam Mishra",
  email: "8hivammishra8@gmail.com",
  whatsappNumber: "919899452192",
  phone: "91+ 9899452192",
  phoneClean: "+919899452192",
  instagram: "shivam.0nyx",
  whatsappMessage: "Hi Shivam, I saw your portfolio and would like to discuss a website.",
  emailSubject: "Website project"
};

// Utility: Prefers reduced motion detection
window.SITE.isReducedMotion = function () {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

// Utility: Fine pointer check (mouse vs touch)
window.SITE.isFinePointer = function () {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
};

/* ==========================================================================
   DOM Ready: Contact Hydration & Core Interactivity
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  hydrateContactDetails();
  initMobileMenu();
  initBackToTop();
  setupImagePreloading();
  setupFailSafeWatchdog();
});

/**
 * Hydrates all contact elements marked with data-contact or data-contact-text
 */
function hydrateContactDetails() {
  const waUrl = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(CONTACT.whatsappMessage)}`;
  const mailUrl = `mailto:${CONTACT.email}?subject=${encodeURIComponent(CONTACT.emailSubject)}`;
  const telUrl = `tel:${CONTACT.phoneClean}`;
  const igUrl = `https://instagram.com/${CONTACT.instagram}`;

  // Link URLs
  document.querySelectorAll('[data-contact="whatsapp"]').forEach((el) => {
    el.setAttribute("href", waUrl);
    if (!el.getAttribute("aria-label")) {
      el.setAttribute("aria-label", `Chat with ${CONTACT.name} on WhatsApp`);
    }
  });

  document.querySelectorAll('[data-contact="email"]').forEach((el) => {
    el.setAttribute("href", mailUrl);
    if (!el.getAttribute("aria-label")) {
      el.setAttribute("aria-label", `Send an email to ${CONTACT.email}`);
    }
  });

  document.querySelectorAll('[data-contact="phone"]').forEach((el) => {
    el.setAttribute("href", telUrl);
    if (!el.getAttribute("aria-label")) {
      el.setAttribute("aria-label", `Call ${CONTACT.name} at ${CONTACT.phone}`);
    }
  });

  document.querySelectorAll('[data-contact="instagram"]').forEach((el) => {
    el.setAttribute("href", igUrl);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
    if (!el.getAttribute("aria-label")) {
      el.setAttribute("aria-label", `Visit ${CONTACT.name}'s Instagram profile`);
    }
  });

  // Text values
  document.querySelectorAll('[data-contact-text="name"]').forEach((el) => {
    el.textContent = CONTACT.name;
  });

  document.querySelectorAll('[data-contact-text="email"]').forEach((el) => {
    el.textContent = CONTACT.email;
  });

  document.querySelectorAll('[data-contact-text="phone"]').forEach((el) => {
    el.textContent = CONTACT.phone;
  });

  document.querySelectorAll('[data-contact-text="instagram"]').forEach((el) => {
    el.textContent = `@${CONTACT.instagram}`;
  });
}

/**
 * Mobile Navigation: 100dvh dialog, safe-area padding, focus trap & Escape handling
 */
function initMobileMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const closeBtn = document.getElementById("mobile-nav-close");

  if (!menuToggle || !mobileNav) return;

  const focusableSelectors = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let firstFocusable = null;
  let lastFocusable = null;

  function updateFocusables() {
    const focusables = Array.from(mobileNav.querySelectorAll(focusableSelectors));
    firstFocusable = focusables[0] || null;
    lastFocusable = focusables[focusables.length - 1] || null;
  }

  function openMenu() {
    mobileNav.classList.add("is-active");
    mobileNav.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("nav-open");
    document.body.classList.add("nav-open");

    updateFocusables();
    if (closeBtn) closeBtn.focus();
    document.addEventListener("keydown", handleKeydown);
  }

  function closeMenu() {
    mobileNav.classList.remove("is-active");
    mobileNav.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("nav-open");
    document.body.classList.remove("nav-open");

    document.removeEventListener("keydown", handleKeydown);
    menuToggle.focus();
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      return;
    }

    if (e.key === "Tab") {
      updateFocusables();
      if (!firstFocusable || !lastFocusable) return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.contains("is-active");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closeMenu);
  }

  // Close menu on link click
  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  // Auto-close when resized to desktop viewport
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024 && mobileNav.classList.contains("is-active")) {
      closeMenu();
    }
  });
}

/**
 * Back to top button smooth scroll
 */
function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

/**
 * Preload and decode images safely in idle time to prevent layout shift during animation
 */
function setupImagePreloading() {
  const images = Array.from(document.querySelectorAll("img"));

  const decodeImages = () => {
    images.forEach((img) => {
      if ("decode" in img) {
        img.decode().catch(() => {
          // Fallback handled via HTML onerror attribute
        });
      }
    });
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(decodeImages, { timeout: 2500 });
  } else {
    setTimeout(decodeImages, 300);
  }
}

/**
 * Watchdog timer: If motion engine fails to signal readiness in 8s, remove .has-js
 */
function setupFailSafeWatchdog() {
  setTimeout(() => {
    if (!window.__motionReady) {
      document.documentElement.classList.remove("has-js");
      document.documentElement.classList.add("motion-fallback");
      if (typeof window.SITE._resolveIntro === "function") {
        window.SITE._resolveIntro();
      }
    }
  }, 8000);
}
