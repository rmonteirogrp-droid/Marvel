(function () {
  var toggle = document.getElementById("menu-toggle");
  var menu = document.getElementById("menu-list");
  var closeBtn = document.getElementById("menu-close");
  var navEl = document.getElementById("menu");

  function openMenu() {
    menu.classList.add("show");
    if (navEl) navEl.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    menu.classList.remove("show");
    if (navEl) navEl.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      if (menu.classList.contains("show")) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeMenu);
  }

  var links = menu ? menu.querySelectorAll("a") : [];
  links.forEach(function (a) {
    a.addEventListener("click", function () {
      closeMenu();
    });
  });
})();

