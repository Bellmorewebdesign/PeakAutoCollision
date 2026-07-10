/* ============================================================
   Peak Auto Collision — script.js
   Mobile nav toggle, close-on-click, and footer year.
   ============================================================ */
(function () {
  "use strict";

  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("navMenu");

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("open");
    toggle.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("open");
      toggle.classList.toggle("open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close the mobile menu after tapping a link
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeMenu();
    });

    // Close when tapping outside the header
    document.addEventListener("click", function (e) {
      if (!menu.classList.contains("open")) return;
      if (!e.target.closest(".site-header")) closeMenu();
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  // Current year in the footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
