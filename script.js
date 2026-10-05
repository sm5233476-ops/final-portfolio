/* ==========================================================================
   script.js — Portfolio ✦ Shivam Mishra
   Master Configuration, Procedural Web Audio Synth, Contact Engine, Sound State
   ========================================================================== */

// 1. GLOBAL SYSTEM CONFIGURATION
window.SITE = {
  INTRO: true,               // Cinematic cyber reveal enabled
  SOUND_ENABLED: false,      // Procedural audio synthesizer state (toggled via UI)
  STAR_CURSOR: true,         // Interactive magnetic cursor
  IMAGE_MOTION: "full",      // 3D perspective tilt & frame scrub
  introReady: null,          // Overlap promise for hero reveal
  _resolveIntro: null
};

window.SITE.introReady = new Promise((resolve) => {
  window.SITE._resolveIntro = resolve;
});

// 2. CONTACT DETAILS & POSITIONING (Single Source of Truth)
const CONTACT = {
  name: "Shivam Mishra",
  role: "Creative Developer & Full-Stack Engineer",
  email: "8hivammishra8@gmail.com",
  whatsappNumber: "919899452192",
  phone: "91+ 9899452192",
  phoneClean: "+919899452192",
  instagram: "shivam.0nyx",
  location: "New Delhi, India (UTC +5:30)",
  whatsappMessage: "Hi Shivam, I saw your portfolio and would like to discuss building a high-end project.",
  emailSubject: "Inquiry: Custom Web / SaaS Development"
};

// 3. UTILITY DETECTORS
window.SITE.isReducedMotion = function () {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

window.SITE.isFinePointer = function () {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
};

/* ==========================================================================
   4. Procedural Web Audio API Synthesizer (Aashish Thakuri / Studio Sound)
   Zero external MP3s — 100% mathematical zero-latency audio synthesis
   ========================================================================== */
const SoundEngine = (function () {
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  return {
    // Subtle high-tech click blip on button presses
    playClick() {
      if (!window.SITE.SOUND_ENABLED) return;
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(820, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    },

    // Subtle micro-tick on element hover
    playHover() {
      if (!window.SITE.SOUND_ENABLED) return;
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.025);
    },

    // Low-frequency atmospheric whoosh on transitions / cards
    playSwoosh() {
      if (!window.SITE.SOUND_ENABLED) return;
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  };
})();

window.SoundEngine = SoundEngine;

/* ==========================================================================
   5. DOM Initialization & Hydration
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  hydrateContactDetails();
  initSoundToggle();
  initLiveClock();
  initBackToTop();
  setupImagePreloading();
  setupFailSafeWatchdog();
});

/**
 * Hydrates all dynamic links, texts and accessibility tags
 */
function hydrateContactDetails() {
  const waUrl = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(CONTACT.whatsappMessage)}`;
  const mailUrl = `mailto:${CONTACT.email}?subject=${encodeURIComponent(CONTACT.emailSubject)}`;
  const telUrl = `tel:${CONTACT.phoneClean}`;
  const igUrl = `https://instagram.com/${CONTACT.instagram}`;

  // URLs
  document.querySelectorAll('[data-contact="whatsapp"]').forEach((el) => {
    el.setAttribute("href", waUrl);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  });

  document.querySelectorAll('[data-contact="email"]').forEach((el) => {
    el.setAttribute("href", mailUrl);
  });

  document.querySelectorAll('[data-contact="phone"]').forEach((el) => {
    el.setAttribute("href", telUrl);
  });

  document.querySelectorAll('[data-contact="instagram"]').forEach((el) => {
    el.setAttribute("href", igUrl);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  });

  // Text Hydrations
  document.querySelectorAll('[data-contact-text="name"]').forEach((el) => {
    el.textContent = CONTACT.name;
  });

  document.querySelectorAll('[data-contact-text="role"]').forEach((el) => {
    el.textContent = CONTACT.role;
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

  document.querySelectorAll('[data-contact-text="location"]').forEach((el) => {
    el.textContent = CONTACT.location;
  });
}

/**
 * Audio Toggle Button (Sound [OFF / ON])
 */
function initSoundToggle() {
  const soundBtns = document.querySelectorAll(".sound-toggle-btn");
  if (!soundBtns.length) return;

  const updateButtons = () => {
    soundBtns.forEach((btn) => {
      const stateSpan = btn.querySelector(".sound-state");
      if (stateSpan) {
        stateSpan.textContent = window.SITE.SOUND_ENABLED ? "ON" : "OFF";
      }
      btn.setAttribute("aria-pressed", window.SITE.SOUND_ENABLED ? "true" : "false");
      btn.classList.toggle("is-active", window.SITE.SOUND_ENABLED);
    });
  };

  soundBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      window.SITE.SOUND_ENABLED = !window.SITE.SOUND_ENABLED;
      updateButtons();
      if (window.SITE.SOUND_ENABLED) {
        SoundEngine.playClick();
      }
    });
  });

  // Attach sound triggers to all buttons & interactive links
  document.querySelectorAll("a, button, .interactive-card").forEach((el) => {
    el.addEventListener("mouseenter", () => SoundEngine.playHover());
    el.addEventListener("click", () => SoundEngine.playClick());
  });
}

/**
 * Real-time Indian Standard Time (IST) Clock
 */
function initLiveClock() {
  const clockEl = document.getElementById("live-ist-time");
  if (!clockEl) return;

  function updateTime() {
    const options = {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    };
    clockEl.textContent = new Intl.DateTimeFormat("en-US", options).format(new Date());
  }

  updateTime();
  setInterval(updateTime, 1000);
}

/**
 * Smooth Back to top handler
 */
function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    SoundEngine.playClick();
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

/**
 * Preload and decode images safely in background idle time
 */
function setupImagePreloading() {
  const images = Array.from(document.querySelectorAll("img"));

  const decodeImages = () => {
    images.forEach((img) => {
      if ("decode" in img) {
        img.decode().catch(() => {});
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
 * Fail-Safe Watchdog Timer: 8s fallback guarantee
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
