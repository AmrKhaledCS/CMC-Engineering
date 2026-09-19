/* ============================================================
   CMC — Civil, Marine & Coastal Engineering Office
   main.js — all site interactions, vanilla JavaScript, no build step
   ------------------------------------------------------------
   Modules: header, mobile nav, services dropdown, active nav,
   reveal on scroll, stat counters, project filters, project dialog,
   testimonial slider, back to top, year.
   The site takes no user input: there are no forms anywhere.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isDesktop = function () { return window.matchMedia("(min-width: 1025px)").matches; };
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Header shadow on scroll ---------- */
  var header = $(".site-header");
  if (header) {
    var setStuck = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    setStuck();
    window.addEventListener("scroll", setStuck, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  var nav = $("#primary-nav");
  var toggle = $(".nav-toggle");
  var backdrop = $(".nav-backdrop");

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    if (backdrop) backdrop.classList.remove("is-visible");
    document.body.style.overflow = "";
  }

  function openNav() {
    if (!nav || !toggle) return;
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    if (backdrop) backdrop.classList.add("is-visible");
    document.body.style.overflow = "hidden";
    var first = $("a, button", nav);
    if (first) first.focus();
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      open ? closeNav() : openNav();
    });
  }
  if (backdrop) backdrop.addEventListener("click", closeNav);

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeNav();
    $$(".dropdown.is-open").forEach(function (dd) {
      dd.classList.remove("is-open");
      var btn = dd.previousElementSibling;
      if (btn) { btn.setAttribute("aria-expanded", "false"); btn.focus(); }
    });
  });

  // Close the drawer when a link is used (in-page links included)
  if (nav) {
    nav.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (link && !isDesktop()) closeNav();
    });
  }

  window.addEventListener("resize", function () {
    if (isDesktop()) closeNav();
  });

  /* ---------- Services dropdown (click + keyboard on all sizes) ---------- */
  $$(".dropdown-toggle").forEach(function (btn) {
    var menu = btn.nextElementSibling;
    if (!menu) return;

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var open = menu.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });

    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        menu.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        var first = $("a", menu);
        if (first) first.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (!btn.parentNode.contains(e.target)) {
        menu.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  });

  /* ---------- Active section highlighting (homepage) ---------- */
  var sectionLinks = $$('.nav-link[href*="#"]').filter(function (a) {
    return a.getAttribute("href").indexOf("#") === 0 ||
      a.getAttribute("href").indexOf("index.html#") === 0;
  });
  var watched = sectionLinks
    .map(function (a) {
      var id = a.getAttribute("href").split("#")[1];
      var el = id ? document.getElementById(id) : null;
      return el ? { link: a, el: el } : null;
    })
    .filter(Boolean);

  if (watched.length && "IntersectionObserver" in window) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          watched.forEach(function (w) {
            w.link.classList.toggle("is-active", w.el === entry.target);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    watched.forEach(function (w) { navObserver.observe(w.el); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealables = $$(".reveal");
  if (revealables.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var revealObserver = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            obs.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      revealables.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  /* ---------- Stat count-up ----------
     Only runs when a [data-count] value is a real number.
     Placeholders such as [XX]+ are left exactly as written. */
  var counters = $$("[data-count]");
  if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
    var countObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          obs.unobserve(el);
          var target = parseFloat(el.getAttribute("data-count"));
          if (isNaN(target)) return;
          var suffix = el.getAttribute("data-suffix") || "";
          var start = performance.now();
          var dur = 1200;
          var tick = function (now) {
            var p = Math.min((now - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) { countObserver.observe(el); });
  }

  /* ---------- Project category filters ---------- */
  var filterBar = $("[data-filters]");
  if (filterBar) {
    var cards = $$("[data-category]");
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter");
      if (!btn) return;
      var value = btn.getAttribute("data-filter");
      $$(".filter", filterBar).forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      var shown = 0;
      cards.forEach(function (card) {
        var match = value === "all" || card.getAttribute("data-category") === value;
        card.classList.toggle("is-hidden", !match);
        if (match) shown++;
      });
      var live = $("#filter-status");
      if (live) live.textContent = shown + " projects shown";
    });
  }

  /* ---------- Project detail dialog ---------- */
  var dialog = $("#project-dialog");
  if (dialog && typeof dialog.showModal === "function") {
    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-project-open]");
      if (opener) {
        e.preventDefault();
        var card = opener.closest("[data-category]");
        if (!card) return;
        $("#dialog-title", dialog).textContent = $("h3", card).textContent;
        $("#dialog-meta", dialog).textContent = card.getAttribute("data-meta") || "";
        $("#dialog-text", dialog).textContent = card.getAttribute("data-detail") || "";
        var img = $("#dialog-image", dialog);
        var cardImg = $("img", card);
        if (img && cardImg) { img.src = cardImg.src; img.alt = cardImg.alt; }
        dialog.showModal();
      }
      if (e.target.closest("[data-dialog-close]")) dialog.close();
    });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });
  }

  /* ---------- Testimonial slider ---------- */
  var slider = $("[data-slider]");
  if (slider) {
    var track = $(".slides", slider);
    var slides = $$(".slide", slider);
    var dotsWrap = $(".slider-dots", slider);
    var index = 0;
    var timer = null;

    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.className = "dot";
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Testimonial " + (i + 1));
      dot.addEventListener("click", function () { go(i); restart(); });
      if (dotsWrap) dotsWrap.appendChild(dot);
    });

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(" + index * -100 + "%)";
      slides.forEach(function (s, n) { s.setAttribute("aria-hidden", String(n !== index)); });
      if (dotsWrap) {
        $$(".dot", dotsWrap).forEach(function (d, n) {
          d.setAttribute("aria-selected", String(n === index));
        });
      }
    }

    function restart() {
      if (timer) clearInterval(timer);
      if (reduceMotion || slides.length < 2) return;
      timer = setInterval(function () { go(index + 1); }, 7000);
    }

    var prev = $("[data-slide-prev]", slider);
    var next = $("[data-slide-next]", slider);
    if (prev) prev.addEventListener("click", function () { go(index - 1); restart(); });
    if (next) next.addEventListener("click", function () { go(index + 1); restart(); });
    slider.addEventListener("mouseenter", function () { if (timer) clearInterval(timer); });
    slider.addEventListener("mouseleave", restart);
    slider.addEventListener("focusin", function () { if (timer) clearInterval(timer); });
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { go(index - 1); restart(); }
      if (e.key === "ArrowRight") { go(index + 1); restart(); }
    });

    go(0);
    restart();
  }

  /* ---------- Back to top ---------- */
  var toTop = $(".to-top");
  if (toTop) {
    var toggleTop = function () {
      toTop.classList.toggle("is-visible", window.scrollY > 700);
    };
    toggleTop();
    window.addEventListener("scroll", toggleTop, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Current year in the footer ---------- */
  $$("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
