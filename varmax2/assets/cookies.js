(function () {
  const KEY = "gmmConsent_v1";
  const banner = document.getElementById("cc");
  const backdrop = document.getElementById("ccBackdrop");
  const manageBtn = document.getElementById("ccManage");
  const optStats = document.getElementById("optStats");
  const acceptBtn = document.getElementById("ccAccept");
  const rejectBtn = document.getElementById("ccReject");

  if (!banner || !backdrop || !manageBtn || !optStats || !acceptBtn || !rejectBtn) {
    return;
  }

  const state = {
    get() {
      try {
        return JSON.parse(localStorage.getItem(KEY));
      } catch (e) {
        return null;
      }
    },
    set(value) {
      localStorage.setItem(KEY, JSON.stringify(value));
    },
  };

  function showBanner() {
    const stored = state.get();
    optStats.checked = !!(stored && stored.stats === true);
    backdrop.style.display = "block";
    banner.style.display = "block";
    banner.focus();
  }

  function hideBanner() {
    backdrop.style.display = "none";
    banner.style.display = "none";
  }

  function loadAnalytics() {
    
  }

  function applyConsent(consent) {
    state.set(consent);
    hideBanner();
    if (consent.stats === true) {
      loadAnalytics();
    }
  }

  acceptBtn.addEventListener("click", function () {
    applyConsent({ stats: true, date: new Date().toISOString() });
  });

  rejectBtn.addEventListener("click", function () {
    applyConsent({ stats: false, date: new Date().toISOString() });
  });

  manageBtn.addEventListener("click", function (event) {
    event.preventDefault();
    showBanner();
  });

  const current = state.get();
  if (!current) {
    showBanner();
  } else if (current.stats === true) {
    loadAnalytics();
  }

  banner.setAttribute("tabindex", "-1");
})();

