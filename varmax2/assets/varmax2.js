/* VARMAX 2 : mêmes comportements que la landing page Aptae
   (barre de progression, navigation collante, révélations, lien actif). */
(function () {
  var rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* barre de progression + navigation collante */
  var bar = document.getElementById("bar");
  var nav = document.querySelector("header.navbar");
  function onScroll() {
    var h = document.documentElement,
      sc = h.scrollTop || document.body.scrollTop,
      max = h.scrollHeight - h.clientHeight || 1;
    if (bar) bar.style.width = (sc / max) * 100 + "%";
    if (nav) nav.classList.toggle("stuck", sc > 40);
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* révélations : posées ici pour que la page reste lisible sans JavaScript */
  var targets = [
    ".plusproduits .section-title", ".plusproduits .wrapper",
    ".pourquoi .flex-container",
    ".evolutions .flex-container",
    ".varmax2-fiable-img", ".varmax2-fiable-content", ".container.hybridation",
    ".varmax2-confiance-title", ".varmax2-confiance-card",
    ".varmax2-outils-header", ".varmax2-outils-card",
    ".varmax2-onenparle-title", ".varmax2-onenparle-card",
    ".closing-sign", ".varmax2-contact-content"
  ];
  var rv = [].slice.call(document.querySelectorAll(targets.join(",")));
  if (!rm && "IntersectionObserver" in window) {
    rv.forEach(function (el) {
      el.setAttribute("data-rv", "");
      var prev = el.previousElementSibling;
      if (prev && prev.hasAttribute("data-rv") && !prev.hasAttribute("data-d")) el.setAttribute("data-d", "1");
      else if (prev && prev.getAttribute("data-d") === "1") el.setAttribute("data-d", "2");
    });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* lien de navigation actif : chaque entrée couvre son groupe de sections */
  var NAV_SECTIONS = {
    "#plusproduits": ["plusproduits"],
    "#pourquoi": ["pourquoi"],
    "#evolutions": ["evolutions", "fiable"],
    "#confiance": ["confiance"],
    "#outils": ["outils", "onenparle"],
    "#contact": ["contact"]
  };
  var links = [].slice.call(document.querySelectorAll('.menu-list a[href^="#"]'));
  var groups = links.map(function (a) {
    var href = a.getAttribute("href");
    var ids = NAV_SECTIONS[href] || [href.slice(1)];
    return ids.map(function (id) { return document.getElementById(id); })
      .filter(function (el) { return !!el; });
  });
  var tick = false;
  function syncNav() {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      var line = innerHeight * 0.42, act = -1;
      groups.forEach(function (g, k) {
        g.forEach(function (el) {
          var r = el.getBoundingClientRect();
          /* #confiance contient #outils : la rubrique la plus précise l'emporte */
          if (r.top <= line && r.bottom > line) act = k;
        });
      });
      links.forEach(function (a, k) { a.classList.toggle("on", k === act); });
      tick = false;
    });
  }
  addEventListener("scroll", syncNav, { passive: true });
  addEventListener("resize", syncNav);
  syncNav();
})();
