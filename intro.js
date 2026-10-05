/* ==========================================================================
   intro.js — Portfolio ✦ Shivam Mishra
   Cyber-Studio Cinematic Opening, Matrix Text Decode, Star Bloom & Sound Sync
   ========================================================================== */

(function () {
  "use strict";

  let introTimeline = null;
  let failSafeTimer = null;
  let isCleanedUp = false;

  /**
   * Check if opening sequence should execute
   */
  function shouldPlayIntro() {
    if (!window.SITE || window.SITE.INTRO === false) return false;
    if (window.SITE.isReducedMotion && window.SITE.isReducedMotion()) return false;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("intro") === "1") return true;

    try {
      if (sessionStorage.getItem("introSeen")) return false;
    } catch (e) {
      return false; // Storage restricted (private window/iframe)
    }

    return true;
  }

  /**
   * Procedural Text Scramble / Character Decode Helper
   */
  function scrambleDecode(element, targetText, duration = 1.0) {
    return new Promise((resolve) => {
      const chars = "!<>-_\\/[]{}—=+*^?#01";
      const startTime = performance.now();
      const length = targetText.length;

      function update(currentTime) {
        const elapsed = (currentTime - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);

        let result = "";
        for (let i = 0; i < length; i++) {
          if (progress >= (i + 1) / length) {
            result += targetText[i];
          } else {
            result += chars[Math.floor(Math.random() * chars.length)];
          }
        }
        element.textContent = result;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          element.textContent = targetText;
          resolve();
        }
      }
      requestAnimationFrame(update);
    });
  }

  /**
   * Idempotent cleanup function
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

    // Resolve overlap promise so hero elements fan in
    if (window.SITE && typeof window.SITE._resolveIntro === "function") {
      window.SITE._resolveIntro();
    }

    // Remove intro DOM nodes cleanly
    const introEl = document.getElementById("intro");
    const bloomEl = document.getElementById("bloom");
    if (introEl && introEl.parentNode) introEl.parentNode.removeChild(introEl);
    if (bloomEl && bloomEl.parentNode) bloomEl.parentNode.removeChild(bloomEl);

    // Restore scroll
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";

    // Start smooth scrolling
    if (window.__lenis) {
      window.__lenis.start();
    }

    // Mark intro seen
    try {
      sessionStorage.setItem("introSeen", "true");
    } catch (e) {}

    // Refresh ScrollTrigger
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  }

  /**
   * Primary Intro Sequence
   */
  async function runIntroSequence() {
    // FAIL-SAFE 1: 7-Second Safety Watchdog
    failSafeTimer = setTimeout(() => {
      cleanupIntro();
    }, 7000);

    // FAIL-SAFE 2: Comprehensive Try...Catch
    try {
      // Lock scroll while intro executes
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      if (window.__lenis) {
        window.__lenis.stop();
      }

      const introEl = document.getElementById("intro");
      const introStar = document.getElementById("intro-star");
      const introGlow = document.querySelector(".intro-star-glow");
      const introStatus = document.getElementById("intro-status");
      const introTitle = document.getElementById("intro-title");
      const introBloom = document.getElementById("bloom");
      const skipBtn = document.getElementById("intro-skip");

      if (!introEl || !introStar || !introStatus || !introTitle || !introBloom) {
        cleanupIntro();
        return;
      }

      // Hook up Skip button and Escape key
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

      // Initial visual setup
      gsap.set(introStar, { scale: 0, rotation: -90 });
      gsap.set(introGlow, { opacity: 0 });
      gsap.set(introStatus, { opacity: 0 });
      gsap.set(introTitle, { opacity: 0 });

      // Start sequence timeline
      introTimeline = gsap.timeline({
        onComplete: () => {
          cleanupIntro();
        }
      });

      // 1. Star spins and scales in
      introTimeline.to(introStar, {
        scale: 1,
        rotation: 0,
        duration: 0.6,
        ease: "back.out(2)",
        onStart: () => {
          if (window.SoundEngine) window.SoundEngine.playHover();
        }
      });

      // 2. Status text reveals with cyber decode
      introTimeline.to(introStatus, {
        opacity: 1,
        duration: 0.2,
        onStart: () => {
          scrambleDecode(introStatus, "INITIALIZING SYSTEM // v2.6", 0.55);
        }
      }, "-=0.2");

      // 3. Name reveals with matrix decode & star double-pulse
      introTimeline.to(introTitle, {
        opacity: 1,
        duration: 0.3,
        onStart: () => {
          scrambleDecode(introTitle, "SHIVAM MISHRA", 0.7);
          if (window.SoundEngine) window.SoundEngine.playClick();
        }
      }, "+=0.2");

      introTimeline.to(introStar, {
        scale: 1.25,
        duration: 0.2,
        ease: "sine.inOut"
      });
      introTimeline.to(introGlow, {
        opacity: 1,
        duration: 0.2,
        ease: "sine.inOut"
      }, "<");

      introTimeline.to(introStar, {
        scale: 1,
        duration: 0.2,
        ease: "sine.inOut"
      });
      introTimeline.to(introGlow, {
        opacity: 0,
        duration: 0.2,
        ease: "sine.inOut"
      }, "<");

      // 4. Calculate star's exact screen center for the shockwave bloom
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

        if (window.SoundEngine) window.SoundEngine.playSwoosh();
      }, "+=0.35");

      // 5. Bloom explosion into the page
      introTimeline.to(introBloom, {
        scale: 1,
        duration: 0.85,
        ease: "expo.inOut"
      });

      introTimeline.to(".intro-stage", {
        scale: 1.1,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out"
      }, "<0.1");

      // 6. Overlap: At 70% of bloom expansion, trigger hero content reveal
      introTimeline.add(() => {
        if (window.SITE && typeof window.SITE._resolveIntro === "function") {
          window.SITE._resolveIntro();
        }
      }, ">-0.3");

    } catch (err) {
      cleanupIntro();
    }
  }

  /**
   * Replay Intro trigger for footer button
   */
  window.SITE.playIntro = function () {
    window.scrollTo({ top: 0, behavior: "instant" });
    try {
      sessionStorage.removeItem("introSeen");
    } catch (e) {}

    const url = new URL(window.location.href);
    url.searchParams.set("intro", "1");
    window.location.href = url.toString();
  };

  /**
   * Initialize on DOM Content Loaded
   */
  document.addEventListener("DOMContentLoaded", () => {
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
