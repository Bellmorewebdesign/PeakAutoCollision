/* ============================================================
   Peak Auto Collision — script.js
   Navigation, scroll reveals, featured-image pan, lightbox,
   and reviews toggle. No dependencies.
   ============================================================ */
(function () {
  "use strict";

  // Gates the CSS that hides .reveal elements, so content stays
  // visible if this file ever fails to load.
  document.documentElement.classList.add("js");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ===== Header: transparent over hero, solid after scrolling ===== */
  function initHeader() {
    var header = document.getElementById("siteHeader");
    if (!header) return;
    var update = function () {
      header.classList.toggle("scrolled", window.scrollY > 30);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ===== Mobile navigation ===== */
  function initMobileNav() {
    var toggle = document.getElementById("navToggle");
    var menu = document.getElementById("navMenu");
    if (!toggle || !menu) return;

    function closeMenu() {
      menu.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("open");
      toggle.classList.toggle("open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });

    document.addEventListener("click", function (e) {
      if (!menu.classList.contains("open")) return;
      if (!e.target.closest(".site-header")) closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ===== Scroll reveals (sections, cards, headings) ===== */
  function initReveals() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ===== Featured image scroll pan =====
     Enters focused on the lower "Before" half, pans up to the
     "After" half, then zooms out to reveal the whole composition.
     Disabled under 768px and for prefers-reduced-motion; in those
     cases the complete image is shown statically. */
  function initFeaturedPan() {
    var viewport = document.getElementById("featuredViewport");
    var img = document.getElementById("featuredImg");
    if (!viewport || !img) return;

    var wideScreen = window.matchMedia("(min-width: 768px)");
    var active = false;
    var ticking = false;
    var SCALE = 1.7;
    var PAN = 19; // max translateY %, keeps edges covered at SCALE

    function ease(t) { return t * t * (3 - 2 * t); } // smoothstep

    function apply() {
      ticking = false;
      if (!active) return;

      var rect = viewport.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      // 0 = viewport top enters screen bottom, 1 = fully traversed
      var raw = (vh - rect.top) / (vh + rect.height);
      // Remap so the sequence completes as the image reaches screen
      // center (raw = 0.5), leaving the full composition visible
      var p = Math.min(1, Math.max(0, (raw - 0.06) / 0.44));

      var scale, ty;
      if (p < 0.55) {
        // Phase 1: pan from Before (bottom) up to After (top)
        var t1 = ease(p / 0.55);
        scale = SCALE;
        ty = -PAN + t1 * (PAN * 2);
      } else {
        // Phase 2: zoom out to the full edited image
        var t2 = ease((p - 0.55) / 0.45);
        scale = SCALE + t2 * (1 - SCALE);
        ty = PAN * (1 - t2);
      }
      img.style.transform = "scale(" + scale + ") translateY(" + ty + "%)";
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(apply);
      }
    }

    function setMode() {
      active = wideScreen.matches && !reducedMotion.matches;
      if (!active) {
        img.style.transform = "";
      } else {
        onScroll();
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    if (wideScreen.addEventListener) {
      wideScreen.addEventListener("change", setMode);
      reducedMotion.addEventListener("change", setMode);
    }
    setMode();
  }

  /* ===== Lightbox (featured image + work gallery) ===== */
  function initLightbox() {
    var box = document.getElementById("lightbox");
    var boxImg = document.getElementById("lightboxImg");
    var closeBtn = document.getElementById("lightboxClose");
    if (!box || !boxImg || !closeBtn) return;

    var lastFocused = null;

    function open(src, alt) {
      lastFocused = document.activeElement;
      boxImg.src = src;
      boxImg.alt = alt || "";
      box.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }

    function close() {
      box.hidden = true;
      boxImg.src = "";
      document.body.style.overflow = "";
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    // Featured image opens itself fullscreen
    var featuredOpen = document.getElementById("featuredOpen");
    var featuredImg = document.getElementById("featuredImg");
    if (featuredOpen && featuredImg) {
      featuredOpen.addEventListener("click", function () {
        open(featuredImg.getAttribute("src"), featuredImg.getAttribute("alt"));
      });
    }

    // Gallery cards declare their media via data attributes
    document.querySelectorAll("[data-lightbox-src]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        open(btn.getAttribute("data-lightbox-src"), btn.getAttribute("data-lightbox-alt"));
      });
    });

    closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden) close();
    });
    // Keep focus inside the dialog (single focusable control)
    box.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        e.preventDefault();
        closeBtn.focus();
      }
    });
  }

  /* ===== Reviews: show the rest on demand ===== */
  function initReviewsToggle() {
    var btn = document.getElementById("reviewsToggle");
    var more = document.getElementById("reviewsMore");
    if (!btn || !more) return;

    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      more.hidden = expanded;
      btn.textContent = expanded ? "Show More Reviews" : "Show Fewer Reviews";
      if (!expanded) {
        more.querySelectorAll(".review-card").forEach(function (card) {
          card.classList.add("visible");
        });
      }
    });
  }

  /* ===== Live Eastern Time business status ===== */
  function initBusinessHours() {
    var status = document.getElementById("businessStatus");
    var title = document.getElementById("businessStatusTitle");
    var detail = document.getElementById("businessStatusDetail");
    if (!status || !title || !detail) return;

    var timeZone = "America/New_York";
    var weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var weeklyHours = [
      null,
      { opens: 8 * 60, closes: 17 * 60, openLabel: "8 AM", closeLabel: "5 PM" },
      { opens: 8 * 60, closes: 17 * 60, openLabel: "8 AM", closeLabel: "5 PM" },
      { opens: 8 * 60, closes: 17 * 60, openLabel: "8 AM", closeLabel: "5 PM" },
      { opens: 8 * 60, closes: 17 * 60, openLabel: "8 AM", closeLabel: "5 PM" },
      { opens: 8 * 60, closes: 17 * 60, openLabel: "8 AM", closeLabel: "5 PM" },
      { opens: 8 * 60, closes: 12 * 60, openLabel: "8 AM", closeLabel: "12 PM" }
    ];

    function getEasternTime(date) {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timeZone,
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).formatToParts(date);
      var values = {};

      parts.forEach(function (part) {
        if (part.type !== "literal") values[part.type] = part.value;
      });

      return {
        day: weekDays.indexOf(values.weekday),
        minutes: Number(values.hour) * 60 + Number(values.minute)
      };
    }

    function getNextOpening(day, minutes) {
      for (var offset = 0; offset <= 7; offset += 1) {
        var nextDay = (day + offset) % 7;
        var hours = weeklyHours[nextDay];

        if (!hours) continue;
        if (offset === 0 && minutes >= hours.opens) continue;

        var dayLabel = offset === 0 ? "today" : (offset === 1 ? "tomorrow" : weekDays[nextDay]);
        return "Opens " + dayLabel + " at " + hours.openLabel;
      }

      return "Call for our next opening";
    }

    function update() {
      var eastern = getEasternTime(new Date());
      var todayHours = weeklyHours[eastern.day];
      var isOpen = Boolean(todayHours && eastern.minutes >= todayHours.opens && eastern.minutes < todayHours.closes);

      title.textContent = isOpen ? "Open" : "Closed";
      detail.textContent = isOpen
        ? "Closes at " + todayHours.closeLabel
        : getNextOpening(eastern.day, eastern.minutes);
      status.classList.toggle("is-open", isOpen);
      status.classList.toggle("is-closed", !isOpen);

      document.querySelectorAll("[data-day]").forEach(function (element) {
        var isToday = Number(element.getAttribute("data-day")) === eastern.day;
        element.classList.toggle("is-today", isToday);
        if (isToday) {
          element.setAttribute("aria-current", "date");
        } else {
          element.removeAttribute("aria-current");
        }
      });
    }

    update();
    window.setInterval(update, 60000);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) update();
    });
  }

  /* ===== Footer year ===== */
  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  initHeader();
  initMobileNav();
  initReveals();
  initFeaturedPan();
  initLightbox();
  initReviewsToggle();
  initBusinessHours();
  initYear();
})();
