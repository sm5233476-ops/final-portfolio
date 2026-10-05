/* ==========================================================================
   intro.js — Portfolio ✦ Shivam Mishra
   Cinematic Opening, Hand-Drawn Write-On, Star Bloom, 3x Fail-Safes
   ========================================================================== */

(function () {
  "use strict";

  let introTimeline = null;
  let failSafeTimer = null;
  let isCleanedUp = false;

  /**
   * Determine if the opening animation should execute
   */
  function shouldPlayIntro() {
    if (!window.SITE || window.SITE.INTRO === false) return false;
    if (window.SITE.isReducedMotion && window.SITE.isReducedMotion()) return false;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("intro") === "1") return true;

    try {
      if (sessionStorage.getItem("introSeen")) return false;
    } catch (e) {
      // Storage blocked (private browsing mode/iframe) -> skip safely
      return false;
    }

    return true;
  }

  /**
   * Wait for cursive font to load within 1.5 seconds, or fallback
   */
  function waitForFont() {
    return new Promise((resolve) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }, 1500);

      if (document.fonts && document.fonts.load) {
        document.fonts
          .load('1em "Pinyon Script"')
          .then((fonts) => {
            if (!settled) {
              settled = true;
              clearTimeout(timeout);
              resolve(fonts && fonts.length > 0);
            }
          })
          .catch(() => {
            if (!settled) {
              settled = true;
              clearTimeout(timeout);
              resolve(false);
            }
          });
      } else {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  /**
   * Cleanup and reveal page: idempotent and safe
   */
  function cleanupIntro() {
    if (isCleanedUp) return;
    isCleanedUp = true;

    if (failSafeTimer) {
      clearTimeout(failSafeTimer);
      failSafeTimer = null;
    }

    if (introTimeline) {
      introTimeline.kill();
      introTimeline = null;
    }

    // Resolve hero promise immediately so content fans in
    if (window.SITE && typeof window.SITE._resolveIntro === "function") {
      window.SITE._resolveIntro();
    }

    // Remove intro elements from DOM
    const introEl = document.getElementById("intro");
    const bloomEl = document.getElementById("bloom");
    if (introEl && introEl.parentNode) introEl.parentNode.removeChild(introEl);
    if (bloomEl && bloomEl.parentNode) bloomEl.parentNode.removeChild(bloomEl);

    // Restore page scroll
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";

    // Start Lenis smooth scroll if initialized
    if (window.__lenis) {
      window.__lenis.start();
    }

    // Mark intro seen in session storage
    try {
      sessionStorage.setItem("introSeen", "true");
    } catch (e) {}

    // Refresh GSAP ScrollTrigger layout calculations
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  }

  /**
   * Primary Intro Animation Sequence
   */
  async function runIntroSequence() {
    // FAIL-SAFE 1: Global 7-second hard safety watchdog
    failSafeTimer = setTimeout(() => {
      cleanupIntro();
    }, 7000);

    // FAIL-SAFE 2: Comprehensive try...catch wrapper
    try {
      // Lock scroll while intro plays
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      if (window.__lenis) {
        window.__lenis.stop();
      }

      // Wait for Pinyon Script with 1.5s timeout
      const fontLoaded = await waitForFont();
      const introWord = document.getElementById("intro-word");
      const introDot = document.getElementById("intro-dot");
      const introStar = document.getElementById("intro-star");
      const introBloom = document.getElementById("bloom");
      const introStage = document.querySelector(".intro-stage");
      const skipBtn = document.getElementById("intro-skip");

      if (!introWord || !introDot || !introStar || !introBloom || !introStage) {
        cleanupIntro();
        return;
      }

      if (!fontLoaded) {
        introWord.style.fontFamily = 'var(--font-serif)';
        introWord.style.fontStyle = 'italic';
      }

      // Hook up skip button & Escape key
      if (skipBtn) {
        skipBtn.addEventListener("click", () => cleanupIntro(), { once: true });
      }

      const handleEscape = (e) => {
        if (e.key === "Escape") {
          window.removeEventListener("keydown", handleEscape);
          cleanupIntro();
        }
      };
      window.addEventListener("keydown", handleEscape);

      // Measure dimensions for precision pen dot tracking
      const stageRect = introStage.getBoundingClientRect();
      const wordRect = introWord.getBoundingClientRect();
      const wordWidth = wordRect.width || 320;
      const wordLeft = wordRect.left - stageRect.left;
      const wordTop = wordRect.top - stageRect.top;
      const baselineY = wordTop + wordRect.height * 0.72;

      // Initial element state
      gsap.set(introWord, { clipPath: "inset(0 100% 0 0)", opacity: 1 });
      gsap.set(introDot, {
        x: wordLeft,
        y: baselineY,
        opacity: 1,
        scale: 1
      });
      gsap.set(introStar, {
        x: wordLeft + wordWidth,
        y: baselineY,
        scale: 0,
        rotation: 0
      });
      gsap.set(".star-glow-layer", { opacity: 0 });

      // Build GSAP Timeline
      introTimeline = gsap.timeline({
        onComplete: () => {
          cleanupIntro();
        }
      });

      const penProxy = { progress: 0 };

      // 1. Cursive Write-On with Sine-Wave Pen Motion (~2.0s)
      introTimeline.to(penProxy, {
        progress: 1,
        duration: 2.0,
        ease: "power2.inOut",
        onUpdate: () => {
          const p = penProxy.progress;
          // Animate clip-path reveal from left to right
          introWord.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;

          // Dot follows leading edge with natural sine oscillation around baseline
          const currentX = wordLeft + wordWidth * p;
          const sineY = Math.sin(p * Math.PI * 7) * 9;
          gsap.set(introDot, {
            x: currentX,
            y: baselineY + sineY
          });
        }
      });

      // 2. Transition: Dot vanishes & Star scales up with 90° rotation
      introTimeline.to(introDot, {
        opacity: 0,
        scale: 0,
        duration: 0.15,
        ease: "power1.out"
      }, "+=0.05");

      introTimeline.to(introStar, {
        scale: 1,
        rotation: 90,
        duration: 0.45,
        ease: "back.out(2)"
      }, "-=0.1");

      // 3. Pulse twice (1 to 1.15 to 1) with violet glow layer
      introTimeline.to(introStar, {
        scale: 1.15,
        duration: 0.22,
        ease: "sine.inOut"
      });
      introTimeline.to(".star-glow-layer", {
        opacity: 1,
        duration: 0.22,
        ease: "sine.inOut"
      }, "<");

      introTimeline.to(introStar, {
        scale: 1,
        duration: 0.22,
        ease: "sine.inOut"
      });
      introTimeline.to(".star-glow-layer", {
        opacity: 0,
        duration: 0.22,
        ease: "sine.inOut"
      }, "<");

      // 4. Center bloom on star's exact viewport coordinates
      introTimeline.add(() => {
        const starBounds = introStar.getBoundingClientRect();
        const starCenterX = starBounds.left + starBounds.width / 2;
        const starCenterY = starBounds.top + starBounds.height / 2;

        gsap.set(introBloom, {
          left: `${starCenterX}px`,
          top: `${starCenterY}px`,
          xPercent: -50,
          yPercent: -50,
          scale: 0,
          opacity: 1
        });
      });

      // 5. Bloom expansion (scale 0 to 1 over ~1.0s, expo.inOut)
      //    Star scales to 6x and rotates another 180° while cursive word fades
      introTimeline.to(introBloom, {
        scale: 1,
        duration: 1.0,
        ease: "expo.inOut"
      });

      introTimeline.to(introStar, {
        scale: 6,
        rotation: 270,
        opacity: 0,
        duration: 0.9,
        ease: "expo.in"
      }, "<");

      introTimeline.to(introWord, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.out"
      }, "<0.1");

      // 6. Overlap: When bloom reaches ~70% (0.3s before bloom ends), trigger hero reveal
      introTimeline.add(() => {
        if (window.SITE && typeof window.SITE._resolveIntro === "function") {
          window.SITE._resolveIntro();
        }
      }, ">-0.3");

    } catch (err) {
      // Fail-Safe Catch: Immediately cleanup if any error arises
      cleanupIntro();
    }
  }

  /**
   * Replay intro handler for footer button
   */
  window.SITE.playIntro = function () {
    // Scroll instantly to top
    window.scrollTo({ top: 0, behavior: "instant" });

    // Clear session storage flag
    try {
      sessionStorage.removeItem("introSeen");
    } catch (e) {}

    // Reload with query param to ensure fresh sequence
    const url = new URL(window.location.href);
    url.searchParams.set("intro", "1");
    window.location.href = url.toString();
  };

  /**
   * Initialize on DOM Content Loaded
   */
  document.addEventListener("DOMContentLoaded", () => {
    // Setup footer replay button listener
    const replayBtn = document.getElementById("replay-intro");
    if (replayBtn) {
      replayBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.SITE.playIntro();
      });
    }

    if (shouldPlayIntro()) {
      runIntroSequence();
    } else {
      cleanupIntro();
    }
  });

})();
