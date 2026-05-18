(() => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- scroll reveal ---------- */
  const revealTargets = document.querySelectorAll("[data-reveal]");
  revealTargets.forEach((el) => {
    const delay = el.getAttribute("data-reveal-delay");
    if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  }

  /* ---------- header scrolled state ---------- */
  const header = document.querySelector("[data-header]");
  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 24) header.setAttribute("data-scrolled", "true");
    else header.removeAttribute("data-scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  const navToggle = document.querySelector("[data-nav-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const mainEl = document.getElementById("main");
  let prevBodyOverflow = "";
  let pendingCloseTimer = null;
  let pendingCloseHandler = null;

  const finalizeClose = () => {
    if (!mobileMenu) return;
    mobileMenu.hidden = true;
    if (pendingCloseHandler) {
      mobileMenu.removeEventListener("transitionend", pendingCloseHandler);
      pendingCloseHandler = null;
    }
    if (pendingCloseTimer) {
      clearTimeout(pendingCloseTimer);
      pendingCloseTimer = null;
    }
  };

  const setMenu = (open) => {
    if (!navToggle || !mobileMenu) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    if (open) {
      finalizeClose();
      prevBodyOverflow = document.body.style.overflow;
      mobileMenu.hidden = false;
      requestAnimationFrame(() => mobileMenu.setAttribute("data-open", "true"));
      document.body.style.overflow = "hidden";
      if (mainEl) mainEl.inert = true;
      const firstLink = mobileMenu.querySelector("a");
      if (firstLink) setTimeout(() => firstLink.focus(), 120);
    } else {
      mobileMenu.removeAttribute("data-open");
      document.body.style.overflow = prevBodyOverflow;
      if (mainEl) mainEl.inert = false;
      pendingCloseHandler = (e) => {
        if (e.target !== mobileMenu || e.propertyName !== "opacity") return;
        finalizeClose();
      };
      mobileMenu.addEventListener("transitionend", pendingCloseHandler);
      pendingCloseTimer = setTimeout(finalizeClose, 450);
      navToggle.focus();
    }
  };
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") === "true";
      setMenu(!open);
    });
  }
  if (mobileMenu) {
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setMenu(false))
    );
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navToggle?.getAttribute("aria-expanded") === "true") {
      setMenu(false);
    }
  });

  /* ---------- smooth scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });

  /* ---------- FAQ: only one open at a time ---------- */
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) {
        faqItems.forEach((other) => {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  /* ---------- parallax (writes only --parallax-y CSS var) ---------- */
  if (!prefersReducedMotion) {
    const parallaxItems = document.querySelectorAll("[data-parallax]");
    if (parallaxItems.length) {
      let ticking = false;
      const update = () => {
        const vh = window.innerHeight;
        parallaxItems.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.bottom < -200 || rect.top > vh + 200) return;
          const strength = parseFloat(el.getAttribute("data-parallax")) || 0.1;
          const center = rect.top + rect.height / 2 - vh / 2;
          const offset = -center * strength;
          el.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
        });
        ticking = false;
      };
      const requestUpdate = () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      };
      window.addEventListener("scroll", requestUpdate, { passive: true });
      window.addEventListener("resize", requestUpdate);
      update();
    }
  }
})();
