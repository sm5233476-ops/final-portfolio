/* ==========================================================================
   motion.js — Portfolio ✦ Shivam Mishra
   Three.js WebGL Particle Mesh, Text Scramble, 3D Specular Tilt,
   Visuvate Floating Preview, Draggable Physics Stickers, Stacking Pin Deck
   ========================================================================== */

(function () {
  "use strict";

  if (window.__motionEngineActive) return;
  window.__motionEngineActive = true;

  const isReduced = () => window.SITE && window.SITE.isReducedMotion ? window.SITE.isReducedMotion() : false;
  const isFinePointer = () => window.SITE && window.SITE.isFinePointer ? window.SITE.isFinePointer() : false;

  let lenisInstance = null;

  /* ==========================================================================
     1. Unified Smooth Scroll Loop (Lenis + GSAP Ticker)
     ========================================================================== */
  function initSmoothScroll() {
    if (isReduced() || !window.Lenis) {
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
        wheelMultiplier: 0.95,
        touchMultiplier: 1.5,
        autoRaf: false
      });

      window.__lenis = lenisInstance;

      gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);

      lenisInstance.on("scroll", () => {
        if (window.ScrollTrigger) ScrollTrigger.update();
      });
    } catch (e) {
      lenisInstance = null;
    }
  }

  /* ==========================================================================
     2. Three.js Reactive WebGL Particle Wave Canvas (Hero Background)
     ========================================================================== */
  function initThreeHeroCanvas() {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas || !window.THREE || isReduced()) return;

    let scene, camera, renderer, particles, count = 0;
    const AMOUNTX = 45;
    const AMOUNTY = 45;
    const SEPARATION = 85;

    let mouseX = 0;
    let mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    let isVisible = true;
    let animFrameId = null;

    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.z = 1000;
      camera.position.y = 400;

      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const numParticles = AMOUNTX * AMOUNTY;
      const positions = new Float32Array(numParticles * 3);
      const scales = new Float32Array(numParticles);

      let i = 0, j = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          positions[i] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
          positions[i + 1] = 0;
          positions[i + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
          scales[j] = 1.0;
          i += 3;
          j++;
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));

      // Custom Shader Material for glowing cyan particles
      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0x00F2FE) }
        },
        vertexShader: `
          attribute float scale;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = scale * (220.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          void main() {
            if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
            gl_FragColor = vec4(color, 0.65);
          }
        `,
        transparent: true
      });

      particles = new THREE.Points(geometry, material);
      scene.add(particles);

      const onPointerMove = (e) => {
        mouseX = (e.clientX - windowHalfX) * 0.4;
        mouseY = (e.clientY - windowHalfY) * 0.4;
      };

      if (isFinePointer()) {
        window.addEventListener("mousemove", onPointerMove, { passive: true });
      }

      const onWindowResize = () => {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onWindowResize, { passive: true });

      // Auto-pause Three.js loop when hero is offscreen to save battery & GPU
      const heroSection = document.getElementById("hero");
      if ("IntersectionObserver" in window && heroSection) {
        const obs = new IntersectionObserver((entries) => {
          isVisible = entries[0].isIntersecting;
        }, { threshold: 0.05 });
        obs.observe(heroSection);
      }

      const render = () => {
        if (isVisible) {
          camera.position.x += (mouseX - camera.position.x) * 0.04;
          camera.position.y += (-mouseY + 360 - camera.position.y) * 0.04;
          camera.lookAt(scene.position);

          const pos = particles.geometry.attributes.position.array;
          const sc = particles.geometry.attributes.scale.array;

          let index = 0;
          let scaleIndex = 0;

          for (let ix = 0; ix < AMOUNTX; ix++) {
            for (let iy = 0; iy < AMOUNTY; iy++) {
              pos[index + 1] =
                Math.sin((ix + count) * 0.3) * 55 +
                Math.sin((iy + count) * 0.5) * 55;

              sc[scaleIndex] =
                (Math.sin((ix + count) * 0.3) + 1) * 3 +
                (Math.sin((iy + count) * 0.5) + 1) * 3;

              index += 3;
              scaleIndex++;
            }
          }

          particles.geometry.attributes.position.needsUpdate = true;
          particles.geometry.attributes.scale.needsUpdate = true;
          renderer.render(scene, camera);
          count += 0.04;
        }

        animFrameId = requestAnimationFrame(render);
      };

      render();
    } catch (err) {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    }
  }

  /* ==========================================================================
     3. Cyber Text-Scramble & Character Decode Engine
     ========================================================================== */
  function initTextScrambleEngine() {
    const chars = "!<>-_\\/[]{}—=+*^?#01";

    function scramble(element) {
      if (element._isScrambling) return;
      element._isScrambling = true;

      const originalText = element.getAttribute("data-scramble") || element.textContent.trim();
      const length = originalText.length;
      let frame = 0;
      const totalFrames = 20;

      if (window.SoundEngine) window.SoundEngine.playHover();

      const timer = setInterval(() => {
        let output = "";
        const progress = frame / totalFrames;

        for (let i = 0; i < length; i++) {
          if (progress >= (i + 1) / length) {
            output += originalText[i];
          } else {
            output += chars[Math.floor(Math.random() * chars.length)];
          }
        }

        element.textContent = output;
        frame++;

        if (frame > totalFrames) {
          clearInterval(timer);
          element.textContent = originalText;
          element._isScrambling = false;
        }
      }, 25);
    }

    // Scramble on hover
    document.querySelectorAll("[data-scramble]").forEach((el) => {
      el.addEventListener("mouseenter", () => scramble(el));
    });

    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("mouseenter", () => scramble(link));
    });
  }

  /* ==========================================================================
     4. Gertix-Style 3D Specular Tilt Cards with Light Spotlight
     ========================================================================== */
  function init3DTiltCards() {
    if (!isFinePointer() || isReduced()) return;

    const cards = document.querySelectorAll(".tilt-card");

    cards.forEach((card) => {
      let bounds;

      function updateBounds() {
        bounds = card.getBoundingClientRect();
      }

      function handleMouseMove(e) {
        if (!bounds) updateBounds();
        const mouseX = e.clientX - bounds.left;
        const mouseY = e.clientY - bounds.top;

        // Dynamic radial spotlight center
        card.style.setProperty("--mouse-x", `${mouseX}px`);
        card.style.setProperty("--mouse-y", `${mouseY}px`);

        // 3D Perspective Rotation
        const normX = (mouseX / bounds.width - 0.5) * 2;
        const normY = (mouseY / bounds.height - 0.5) * 2;

        gsap.to(card, {
          rotateX: -normY * 4.5,
          rotateY: normX * 4.5,
          transformPerspective: 1000,
          duration: 0.4,
          ease: "power2.out"
        });
      }

      function handleMouseLeave() {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.6,
          ease: "power2.out"
        });
      }

      card.addEventListener("mouseenter", updateBounds);
      card.addEventListener("mousemove", handleMouseMove);
      card.addEventListener("mouseleave", handleMouseLeave);
    });
  }

  /* ==========================================================================
     5. Visuvate-Style Floating Cursor Project Preview Capsule
     ========================================================================== */
  function initVisuvateCursorPreview() {
    const previewCapsule = document.getElementById("cursor-preview");
    const previewImg = document.getElementById("cursor-preview-img");
    const indexRows = document.querySelectorAll(".index-row[data-preview-img]");

    if (!previewCapsule || !previewImg || !isFinePointer() || isReduced()) return;

    const xTo = gsap.quickTo(previewCapsule, "x", { duration: 0.35, ease: "power2.out" });
    const yTo = gsap.quickTo(previewCapsule, "y", { duration: 0.35, ease: "power2.out" });

    let lastX = 0;

    window.addEventListener("mousemove", (e) => {
      const deltaX = e.clientX - lastX;
      lastX = e.clientX;

      xTo(e.clientX);
      yTo(e.clientY);

      // Organic rotation tilt based on mouse velocity
      const rotation = Math.max(-12, Math.min(12, deltaX * 0.4));
      gsap.to(previewCapsule, { rotation: rotation, duration: 0.4, ease: "power1.out" });
    });

    indexRows.forEach((row) => {
      row.addEventListener("mouseenter", () => {
        const imgSrc = row.getAttribute("data-preview-img");
        if (imgSrc) {
          previewImg.src = imgSrc;
        }

        gsap.to(previewCapsule, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });

        if (window.SoundEngine) window.SoundEngine.playHover();
      });

      row.addEventListener("mouseleave", () => {
        gsap.to(previewCapsule, {
          opacity: 0,
          scale: 0.8,
          duration: 0.25,
          ease: "power2.out"
        });
      });
    });
  }

  /* ==========================================================================
     6. Aashish Thakuri-Style Draggable Physics Stickers
     ========================================================================== */
  function initDraggableStickers() {
    if (isReduced()) return;

    const stickers = document.querySelectorAll(".physics-sticker");

    stickers.forEach((sticker) => {
      let isDragging = false;
      let startX = 0, startY = 0;
      let currentX = 0, currentY = 0;
      let lastMoveX = 0, lastMoveY = 0;
      let velocityX = 0, velocityY = 0;
      let animId = null;

      function onPointerDown(e) {
        isDragging = true;
        startX = (e.clientX || (e.touches && e.touches[0].clientX)) - currentX;
        startY = (e.clientY || (e.touches && e.touches[0].clientY)) - currentY;
        lastMoveX = e.clientX || (e.touches && e.touches[0].clientX);
        lastMoveY = e.clientY || (e.touches && e.touches[0].clientY);

        if (animId) cancelAnimationFrame(animId);
        gsap.to(sticker, { scale: 1.08, duration: 0.2 });

        if (window.SoundEngine) window.SoundEngine.playClick();

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
      }

      function onPointerMove(e) {
        if (!isDragging) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        currentX = clientX - startX;
        currentY = clientY - startY;

        velocityX = clientX - lastMoveX;
        velocityY = clientY - lastMoveY;
        lastMoveX = clientX;
        lastMoveY = clientY;

        gsap.set(sticker, { x: currentX, y: currentY });
      }

      function onPointerUp() {
        if (!isDragging) return;
        isDragging = false;

        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);

        gsap.to(sticker, { scale: 1, duration: 0.25 });

        // Throw Momentum & Inertia Physics Decay
        function applyInertia() {
          if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
            currentX += velocityX;
            currentY += velocityY;
            velocityX *= 0.92;
            velocityY *= 0.92;

            gsap.set(sticker, { x: currentX, y: currentY });
            animId = requestAnimationFrame(applyInertia);
          }
        }
        applyInertia();
      }

      sticker.addEventListener("pointerdown", onPointerDown);
    });
  }

  /* ==========================================================================
     7. Sticky Pin Deck Stacking Engine (Work Section)
     ========================================================================== */
  function initStackingPinDeck() {
    if (!window.ScrollTrigger) return;

    const cards = gsap.utils.toArray(".deck-card");

    cards.forEach((card, index) => {
      // Browser Frame Viewport Screenshot Scroll
      const viewport = card.querySelector(".frame-viewport");
      const img = card.querySelector(".frame-img");

      if (viewport && img) {
        const setupScrub = () => {
          const isTall = img.naturalHeight / (img.naturalWidth || 1) > 1.7;

          if (isTall && !isReduced()) {
            gsap.to(img, {
              y: () => -(img.offsetHeight - viewport.clientHeight),
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top 60%",
                end: "bottom 30%",
                scrub: 1,
                invalidateOnRefresh: true
              }
            });
          }
        };

        if (img.complete && img.naturalHeight > 0) {
          setupScrub();
        } else {
          img.addEventListener("load", setupScrub, { once: true });
        }
      }

      // Deck Stacking & Scale Down as Next Cards Arrive
      if (index < cards.length - 1 && !isReduced()) {
        gsap.to(card, {
          scale: 0.93,
          opacity: 0.7,
          ease: "none",
          scrollTrigger: {
            trigger: cards[index + 1],
            start: "top 80%",
            end: "top 20%",
            scrub: 1
          }
        });
      }
    });
  }

  /* ==========================================================================
     8. Interactive Architecture Simulator Sandbox
     ========================================================================== */
  function initArchitectureSimulator() {
    const tabs = document.querySelectorAll(".sim-tab");
    const pipelineBox = document.getElementById("sim-pipeline-box");
    const descBox = document.getElementById("sim-arch-desc");
    const fpsVal = document.getElementById("metric-fps");
    const fcpVal = document.getElementById("metric-fcp");
    const scoreVal = document.getElementById("metric-score");

    if (!tabs.length || !pipelineBox) return;

    const ARCH_CONFIGS = {
      motion: {
        pipeline: [
          "Client Browser",
          "→",
          "WebGL Canvas / GSAP",
          "→",
          "Edge CDN Cache",
          "→",
          "Zero-Latency Render"
        ],
        desc: "Hardware-accelerated creative motion engineered with unified requestAnimationFrame ticker, zero layout shifts, and sub-second First Contentful Paint.",
        fps: "60 FPS",
        fcp: "0.4s",
        score: "100/100"
      },
      saas: {
        pipeline: [
          "React / Next.js",
          "→",
          "Serverless API Gateways",
          "→",
          "PostgreSQL Multi-Tenant",
          "→",
          "Stripe & Auth Engine"
        ],
        desc: "Production-grade SaaS architectures featuring secure role-based access control, distributed caching, automated subscription webhooks, and sub-100ms API responses.",
        fps: "120Hz",
        fcp: "0.6s",
        score: "99/100"
      },
      funnel: {
        pipeline: [
          "Paid Traffic",
          "→",
          "Dynamic Interactive Estimator",
          "→",
          "Automated Lead Scoring",
          "→",
          "Instant CRM & WhatsApp Sync"
        ],
        desc: "High-converting lead acquisition funnels with real-time multi-step price calculators, automated SMS/WhatsApp alerts, and CRM synchronization that converts cold visits into contracts.",
        fps: "Instant",
        fcp: "0.3s",
        score: "100/100"
      }
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const archKey = tab.getAttribute("data-arch");
        const config = ARCH_CONFIGS[archKey];
        if (!config) return;

        tabs.forEach((t) => t.classList.remove("is-active"));
        tab.classList.add("is-active");

        if (window.SoundEngine) window.SoundEngine.playClick();

        // Animate Pipeline Node Elements
        pipelineBox.innerHTML = config.pipeline
          .map((item) =>
            item === "→"
              ? `<span class="pipeline-arrow">→</span>`
              : `<span class="pipeline-node">${item}</span>`
          )
          .join("");

        descBox.textContent = config.desc;

        // Metric Telemetry Counter Animation
        if (fpsVal) fpsVal.textContent = config.fps;
        if (fcpVal) fcpVal.textContent = config.fcp;
        if (scoreVal) scoreVal.textContent = config.score;

        gsap.from(".pipeline-node", {
          opacity: 0,
          y: 8,
          duration: 0.35,
          stagger: 0.05,
          ease: "power2.out"
        });
      });
    });
  }

  /* ==========================================================================
     9. Magnetic Star Cursor Follower
     ========================================================================== */
  function initStarCursor() {
    const cursor = document.getElementById("star-cursor");
    if (!cursor || !isFinePointer() || isReduced()) return;

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

    document.querySelectorAll("a, button, .tilt-card, .physics-sticker, .sim-tab").forEach((target) => {
      target.addEventListener("mouseenter", () => {
        gsap.to(cursor, { scale: 2.0, duration: 0.3, ease: "power2.out" });
      });
      target.addEventListener("mouseleave", () => {
        gsap.to(cursor, { scale: 1, duration: 0.3, ease: "power2.out" });
      });
    });
  }

  /* ==========================================================================
     10. Hero Entrance Orchestration
     ========================================================================== */
  function initHeroEntrance() {
    const heroTitle = document.getElementById("hero-headline");
    const heroBadge = document.querySelector(".hero-badge");
    const heroSubtext = document.querySelector(".hero-subtext");
    const heroCtas = document.querySelector(".hero-cta-group");
    const stickers = document.querySelectorAll(".physics-sticker");

    const revealHero = () => {
      if (isReduced()) {
        gsap.set([heroBadge, heroTitle, heroSubtext, heroCtas, stickers], {
          opacity: 1,
          y: 0,
          clearProps: "all"
        });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(heroBadge, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.1);
      tl.fromTo(heroTitle, { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0 }, 0.2);
      tl.fromTo(heroSubtext, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 }, 0.35);
      tl.fromTo(heroCtas, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 }, 0.45);
      tl.fromTo(stickers, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, stagger: 0.1 }, 0.55);
    };

    if (window.SITE && window.SITE.introReady) {
      window.SITE.introReady.then(revealHero);
    } else {
      revealHero();
    }
  }

  /* ==========================================================================
     Master Motion Initialization
     ========================================================================== */
  function initAllMotion() {
    initSmoothScroll();
    initThreeHeroCanvas();
    initTextScrambleEngine();
    init3DTiltCards();
    initVisuvateCursorPreview();
    initDraggableStickers();
    initStackingPinDeck();
    initArchitectureSimulator();
    initStarCursor();
    initHeroEntrance();

    // Signal motion readiness for fail-safe
    window.__motionReady = true;

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
