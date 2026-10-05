/* ==========================================================================
   motion.js — Portfolio ✦ Shivam Mishra
   Lenis + GSAP Loop, Word Splitter, Hero Fan, Marquee, Frame Scrub, Cursor
   ========================================================================== */

(function () {
  "use strict";

  // Prevent multiple executions
  if (window.__motionInitialized) return;
  window.__motionInitialized = true;

  const isReduced = () => window.SITE && window.SITE.isReducedMotion ? window.SITE.isReducedMotion() : false;
  const isFinePointer = () => window.SITE && window.SITE.isFinePointer ? window.SITE.isFinePointer() : false;

  let lenisInstance = null;

  /* ==========================================================================
     1. Unified Smooth Scroll Loop (Lenis + GSAP Ticker)
     ========================================================================== */
  function initSmoothScroll() {
    if (isReduced() || !window.Lenis) {
      // Reduced motion or library absent -> use native scrolling
      if (window.ScrollTrigger) ScrollTrigger.update();
      return;
    }

    try {
      lenisInstance = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.5,
        autoRaf: false // Controlled strictly by GSAP ticker
      });

      window.__lenis = lenisInstance;

      // Single ticker loop
      gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);

      // ScrollTrigger synchronization
      lenisInstance.on("scroll", () => {
        if (window.ScrollTrigger) ScrollTrigger.update();
      });

    } catch (err) {
      // Graceful fallback to native scroll
      lenisInstance = null;
    }
  }

  /* ==========================================================================
     2. Custom Word Splitter (Zero Paid Plugins, Preserves Real Space Nodes)
     ========================================================================== */
  function splitWordsIntoMasks(element) {
    if (!element) return [];

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];

    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.trim().length > 0) {
        textNodes.push(walker.currentNode);
      }
    }

    const wordElements = [];

    textNodes.forEach((node) => {
      const parent = node.parentNode;
      const isItalic = parent && parent.classList.contains("italic-serif");
      const text = node.nodeValue;
      const tokens = text.split(/\s+/).filter(Boolean);
      const fragment = document.createDocumentFragment();

      tokens.forEach((token) => {
        const mask = document.createElement("span");
        mask.className = "word-mask";
        if (isItalic) mask.classList.add("italic-serif");

        const word = document.createElement("span");
        word.className = "word";
        word.textContent = token;

        mask.appendChild(word);
        fragment.appendChild(mask);
        wordElements.push(word);

        // Crucial: Always retain real text space node so browser word-wrapping remains natural
        fragment.appendChild(document.createTextNode(" "));
      });

      if (parent) {
        parent.replaceChild(fragment, node);
      }
    });

    return wordElements;
  }

  /* ==========================================================================
     3. Scroll Progress Indicator
     ========================================================================== */
  function initScrollProgress() {
    const progressBar = document.getElementById("scroll-progress");
    if (!progressBar || !window.ScrollTrigger) return;

    ScrollTrigger.create({
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        gsap.set(progressBar, { scaleX: self.progress });
      }
    });
  }

  /* ==========================================================================
     4. Sticky Header Directional Hide/Show
     ========================================================================== */
  function initHeaderMotion() {
    const header = document.getElementById("site-header");
    if (!header || isReduced()) return;

    let lastScrollY = 0;
    const headerAnim = gsap.to(header, {
      yPercent: -100,
      duration: 0.35,
      ease: "power2.out",
      paused: true
    });

    const onScroll = (currentY) => {
      if (currentY > 120 && currentY > lastScrollY) {
        headerAnim.play();
      } else {
        headerAnim.reverse();
      }
      lastScrollY = currentY;
    };

    if (lenisInstance) {
      lenisInstance.on("scroll", ({ scroll }) => onScroll(scroll));
    } else {
      window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
    }
  }

  /* ==========================================================================
     5. Hero Section Reveal & Card Fan Deal
     ========================================================================== */
  function initHeroMotion() {
    const heroTitle = document.getElementById("hero-headline");
    const heroBadge = document.querySelector(".hero-badge");
    const heroSubtext = document.querySelector(".hero-subtext");
    const heroActions = document.querySelector(".hero-actions");
    const heroCards = Array.from(document.querySelectorAll(".hero-card"));

    if (!heroTitle) return;

    // Split words in headline
    const headlineWords = splitWordsIntoMasks(heroTitle);

    // Initial setup
    if (!isReduced()) {
      gsap.set(headlineWords, { yPercent: 110, opacity: 0 });
      gsap.set([heroBadge, heroSubtext, heroActions], { y: 24, opacity: 0 });
      gsap.set(heroCards, {
        scale: 0.6,
        y: 80,
        opacity: 0,
        rotation: 0
      });
    }

    // Trigger hero reveal when intro signals readiness (or immediately)
    const playHeroEntrance = () => {
      if (isReduced()) {
        gsap.set([headlineWords, heroBadge, heroSubtext, heroActions, heroCards], {
          opacity: 1,
          yPercent: 0,
          y: 0,
          scale: 1,
          clearProps: "all"
        });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      // Headline masked word rise
      tl.to(headlineWords, {
        yPercent: 0,
        opacity: 1,
        duration: 1.0,
        stagger: 0.045
      }, 0.1);

      // Badge, subtext, CTAs
      tl.to([heroBadge, heroSubtext, heroActions], {
        y: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.08
      }, 0.35);

      // Three cards deal out from the star bloom position
      tl.to(heroCards[0], {
        scale: 1,
        y: 0,
        rotation: -8,
        opacity: 1,
        duration: 1.1
      }, 0.45);

      tl.to(heroCards[1], {
        scale: 1,
        y: 0,
        rotation: 0,
        opacity: 1,
        duration: 1.1
      }, 0.55);

      tl.to(heroCards[2], {
        scale: 1,
        y: 0,
        rotation: 8,
        opacity: 1,
        duration: 1.1
      }, 0.65);
    };

    if (window.SITE && window.SITE.introReady) {
      window.SITE.introReady.then(playHeroEntrance);
    } else {
      playHeroEntrance();
    }

    // Fine Pointer Mouse Parallax for Cards
    if (isFinePointer() && !isReduced() && window.SITE.IMAGE_MOTION !== "none") {
      const heroWrap = document.getElementById("hero");
      if (!heroWrap) return;

      const card1 = heroCards[0];
      const card2 = heroCards[1];
      const card3 = heroCards[2];

      const q1X = card1 ? gsap.quickTo(card1, "x", { duration: 0.6, ease: "power2.out" }) : null;
      const q1Y = card1 ? gsap.quickTo(card1, "y", { duration: 0.6, ease: "power2.out" }) : null;
      const q2X = card2 ? gsap.quickTo(card2, "x", { duration: 0.6, ease: "power2.out" }) : null;
      const q2Y = card2 ? gsap.quickTo(card2, "y", { duration: 0.6, ease: "power2.out" }) : null;
      const q3X = card3 ? gsap.quickTo(card3, "x", { duration: 0.6, ease: "power2.out" }) : null;
      const q3Y = card3 ? gsap.quickTo(card3, "y", { duration: 0.6, ease: "power2.out" }) : null;

      heroWrap.addEventListener("mousemove", (e) => {
        const bounds = heroWrap.getBoundingClientRect();
        const normX = ((e.clientX - bounds.left) / bounds.width - 0.5) * 2;
        const normY = ((e.clientY - bounds.top) / bounds.height - 0.5) * 2;

        if (q1X) q1X(normX * -10);
        if (q1Y) q1Y(normY * -8);
        if (q2X) q2X(normX * 8);
        if (q2Y) q2Y(normY * 10);
        if (q3X) q3X(normX * 12);
        if (q3Y) q3Y(normY * -12);
      });

      heroWrap.addEventListener("mouseleave", () => {
        if (q1X) q1X(0);
        if (q1Y) q1Y(0);
        if (q2X) q2X(0);
        if (q2Y) q2Y(0);
        if (q3X) q3X(0);
        if (q3Y) q3Y(0);
      });
    }
  }

  /* ==========================================================================
     6. Velocity-Driven Ticker Marquee
     ========================================================================== */
  function initVelocityMarquee() {
    const track1 = document.querySelector(".marquee-track-1");
    const track2 = document.querySelector(".marquee-track-2");

    if (!track1 || !track2 || isReduced()) return;

    // Clone child nodes to ensure continuous seamless loop without empty gaps
    const cloneNodes = (track) => {
      const children = Array.from(track.children);
      children.forEach((c) => track.appendChild(c.cloneNode(true)));
      children.forEach((c) => track.appendChild(c.cloneNode(true)));
    };

    cloneNodes(track1);
    cloneNodes(track2);

    let track1Width = track1.scrollWidth / 3;
    let track2Width = track2.scrollWidth / 3;

    // Measure widths strictly on resize via ResizeObserver
    const ro = new ResizeObserver(() => {
      track1Width = track1.scrollWidth / 3;
      track2Width = track2.scrollWidth / 3;
    });
    ro.observe(track1);
    ro.observe(track2);

    let pos1 = 0;
    let pos2 = -track2Width;
    const baseSpeed = 1.2;

    // Unified GSAP Ticker animation loop
    gsap.ticker.add(() => {
      const vel = lenisInstance ? Math.abs(lenisInstance.velocity) : 0;
      const speed = baseSpeed + vel * 0.16;

      // Track 1 moves left
      pos1 -= speed;
      if (Math.abs(pos1) >= track1Width) {
        pos1 += track1Width;
      }
      gsap.set(track1, { x: pos1 });

      // Track 2 moves right
      pos2 += speed;
      if (pos2 >= 0) {
        pos2 -= track2Width;
      }
      gsap.set(track2, { x: pos2 });
    });
  }

  /* ==========================================================================
     7. Work Section: Full Screenshot Scrub inside Browser Frames
     ========================================================================== */
  function initWorkFrames() {
    if (!window.ScrollTrigger) return;

    const stages = document.querySelectorAll(".work-stage");

    stages.forEach((stage) => {
      const frameViewport = stage.querySelector(".frame-viewport");
      const img = stage.querySelector(".frame-img");

      if (!frameViewport || !img) return;

      const setupMotion = () => {
        const motionMode = window.SITE ? window.SITE.IMAGE_MOTION : "full";

        if (isReduced() || motionMode === "none") {
          gsap.set(img, { y: 0, scale: 1 });
          return;
        }

        const isTall = img.naturalHeight / (img.naturalWidth || 1) > 1.7;

        if (isTall && motionMode === "full") {
          // Tall image inner viewport scrub
          gsap.to(img, {
            y: () => -(img.offsetHeight - frameViewport.clientHeight),
            ease: "none",
            scrollTrigger: {
              trigger: stage,
              start: "top 70%",
              end: "bottom 30%",
              scrub: 1,
              invalidateOnRefresh: true
            }
          });
        } else {
          // Short image or "lite" motion fallback: calm scale scrub
          gsap.fromTo(img,
            { scale: 1.0 },
            {
              scale: 1.04,
              ease: "none",
              scrollTrigger: {
                trigger: stage,
                start: "top 80%",
                end: "bottom 20%",
                scrub: 1,
                invalidateOnRefresh: true
              }
            }
          );
        }
      };

      if (img.complete && img.naturalHeight > 0) {
        setupMotion();
      } else {
        img.addEventListener("load", setupMotion, { once: true });
      }
    });
  }

  /* ==========================================================================
     8. Statement Typography Scrub Fill
     ========================================================================== */
  function initStatementScrub() {
    const stmt = document.getElementById("statement-text");
    if (!stmt || !window.ScrollTrigger) return;

    const words = splitWordsIntoMasks(stmt);

    if (isReduced()) {
      gsap.set(words, { opacity: 1 });
      return;
    }

    gsap.set(words, { opacity: 0.15 });

    gsap.to(words, {
      opacity: 1,
      stagger: 0.08,
      ease: "none",
      scrollTrigger: {
        trigger: "#statement",
        start: "top 75%",
        end: "bottom 45%",
        scrub: 0.8
      }
    });
  }

  /* ==========================================================================
     9. Skills Entrance
     ========================================================================== */
  function initSkillsMotion() {
    if (!window.ScrollTrigger) return;
    const skillRows = document.querySelectorAll(".skill-row");

    if (isReduced()) {
      gsap.set(skillRows, { opacity: 1, y: 0 });
      return;
    }

    gsap.from(skillRows, {
      y: 32,
      opacity: 0,
      duration: 0.85,
      stagger: 0.08,
      ease: "expo.out",
      scrollTrigger: {
        trigger: "#skills",
        start: "top 75%"
      }
    });
  }

  /* ==========================================================================
     10. Magnetic Contact Buttons (Fine Pointers Only)
     ========================================================================== */
  function initMagneticElements() {
    if (!isFinePointer() || isReduced()) return;

    const magneticElements = document.querySelectorAll(".magnetic-item");

    magneticElements.forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power2.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power2.out" });

      el.addEventListener("mousemove", (e) => {
        const bounds = el.getBoundingClientRect();
        const deltaX = e.clientX - (bounds.left + bounds.width / 2);
        const deltaY = e.clientY - (bounds.top + bounds.height / 2);

        xTo(deltaX * 0.3);
        yTo(deltaY * 0.3);
      });

      el.addEventListener("mouseleave", () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: "elastic.out(1, 0.4)"
        });
      });
    });
  }

  /* ==========================================================================
     11. Footer Signature Scroll Scrub
     ========================================================================== */
  function initFooterSignature() {
    const signature = document.getElementById("footer-signature");
    if (!signature || !window.ScrollTrigger) return;

    if (isReduced()) {
      gsap.set(signature, { clipPath: "inset(0 0% 0 0)" });
      return;
    }

    const sigProxy = { progress: 0 };
    gsap.to(sigProxy, {
      progress: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "#site-footer",
        start: "top 85%",
        end: "top 35%",
        scrub: 1,
        onUpdate: () => {
          signature.style.clipPath = `inset(0 ${(1 - sigProxy.progress) * 100}% 0 0)`;
        }
      }
    });
  }

  /* ==========================================================================
     12. Custom Star Cursor Follower
     ========================================================================== */
  function initStarCursor() {
    const cursor = document.getElementById("star-cursor");
    if (!cursor || !window.SITE || !window.SITE.STAR_CURSOR || !isFinePointer() || isReduced()) {
      if (cursor) cursor.style.display = "none";
      return;
    }

    const xTo = gsap.quickTo(cursor, "x", { duration: 0.25, ease: "power2.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.25, ease: "power2.out" });

    let isVisible = false;

    window.addEventListener("mousemove", (e) => {
      if (!isVisible) {
        gsap.to(cursor, { opacity: 1, duration: 0.2 });
        isVisible = true;
      }
      xTo(e.clientX);
      yTo(e.clientY);
    });

    window.addEventListener("mouseleave", () => {
      gsap.to(cursor, { opacity: 0, duration: 0.2 });
      isVisible = false;
    });

    // Cursor scaling over clickable interactive elements
    const interactiveTargets = document.querySelectorAll("a, button, .browser-frame, .hero-card");
    interactiveTargets.forEach((target) => {
      target.addEventListener("mouseenter", () => {
        gsap.to(cursor, { scale: 2.2, duration: 0.3, ease: "power2.out" });
      });
      target.addEventListener("mouseleave", () => {
        gsap.to(cursor, { scale: 1, duration: 0.3, ease: "power2.out" });
      });
    });
  }

  /* ==========================================================================
     Master Motion Initialization
     ========================================================================== */
  function initAllMotion() {
    initSmoothScroll();
    initScrollProgress();
    initHeaderMotion();
    initHeroMotion();
    initVelocityMarquee();
    initWorkFrames();
    initStatementScrub();
    initSkillsMotion();
    initMagneticElements();
    initFooterSignature();
    initStarCursor();

    // Signal readiness for watchdog fail-safe
    window.__motionReady = true;

    // Recalculate ScrollTrigger positions once fonts and DOM settle
    window.addEventListener("load", () => {
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllMotion);
  } else {
    initAllMotion();
  }

})();
