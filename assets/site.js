(function () {
  "use strict";

  var menuButton = document.querySelector(".menu-button");
  var nav = document.querySelector(".main-nav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      var isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      nav.classList.toggle("is-open", !isOpen);
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        menuButton.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    });
  }

  var track = document.querySelector("[data-carousel]");
  var previous = document.querySelector("[data-carousel-prev]");
  var next = document.querySelector("[data-carousel-next]");
  var toggle = document.querySelector("[data-carousel-toggle]");
  if (track && previous && next) {
    var autoplayTimer = null;
    var userPaused = false;
    var interactionPaused = false;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var scrollCards = function (direction) {
      var card = track.querySelector(".review-card");
      var distance = card ? card.getBoundingClientRect().width + 20 : 360;
      track.scrollBy({ left: direction * distance, behavior: "smooth" });
    };

    var stopAutoplay = function () {
      if (autoplayTimer) window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    };

    var advanceCarousel = function () {
      var end = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft >= end - 12) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollCards(1);
      }
    };

    var startAutoplay = function () {
      stopAutoplay();
      if (!userPaused && !interactionPaused && !reduceMotion && !document.hidden) {
        autoplayTimer = window.setInterval(advanceCarousel, 5500);
      }
    };

    var restartAutoplay = function () {
      stopAutoplay();
      startAutoplay();
    };

    previous.addEventListener("click", function () {
      scrollCards(-1);
      restartAutoplay();
    });
    next.addEventListener("click", function () {
      scrollCards(1);
      restartAutoplay();
    });

    track.addEventListener("mouseenter", function () {
      interactionPaused = true;
      stopAutoplay();
    });
    track.addEventListener("mouseleave", function () {
      interactionPaused = false;
      startAutoplay();
    });
    track.addEventListener("focusin", function () {
      interactionPaused = true;
      stopAutoplay();
    });
    track.addEventListener("focusout", function () {
      interactionPaused = false;
      startAutoplay();
    });
    track.addEventListener("touchstart", function () {
      interactionPaused = true;
      stopAutoplay();
    }, { passive: true });
    track.addEventListener("touchend", function () {
      interactionPaused = false;
      startAutoplay();
    }, { passive: true });

    if (toggle) {
      if (reduceMotion) {
        userPaused = true;
        toggle.textContent = "▶";
        toggle.setAttribute("aria-pressed", "true");
        toggle.setAttribute("aria-label", "Включить автопрокрутку отзывов");
      }
      toggle.addEventListener("click", function () {
        userPaused = !userPaused;
        toggle.textContent = userPaused ? "▶" : "Ⅱ";
        toggle.setAttribute("aria-pressed", String(userPaused));
        toggle.setAttribute("aria-label", userPaused ? "Включить автопрокрутку отзывов" : "Приостановить автопрокрутку отзывов");
        if (userPaused) stopAutoplay();
        else startAutoplay();
      });
    }

    document.addEventListener("visibilitychange", startAutoplay);
    startAutoplay();
  }

  var consentKey = "totalcode_analytics_consent_v1";
  var banner = document.querySelector("[data-cookie-banner]");
  if (!banner) {
    banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("data-cookie-banner", "");
    banner.hidden = true;
    banner.innerHTML = '<div><b>Аналитические файлы cookie</b><p>С вашего согласия мы подключаем Яндекс Метрику. Без согласия аналитика не загружается. <a href="/legal/privacy/">Подробнее</a></p></div><div class="cookie-actions"><button class="button button-secondary" type="button" data-cookie-reject>Только необходимые</button><button class="button button-primary" type="button" data-cookie-accept>Разрешить</button></div>';
    document.body.appendChild(banner);
  }
  var config = window.TOTAL_CODE_CONFIG || {};

  function validCounterId(value) {
    return /^\d{5,12}$/.test(String(value || ""));
  }

  function loadMetrika() {
    var id = config.yandexMetrikaId;
    if (!validCounterId(id) || window.__totalCodeMetrikaLoaded) return;
    window.__totalCodeMetrikaLoaded = true;
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    document.head.appendChild(script);
    window.ym(Number(id), "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: false
    });
  }

  function saveConsent(value) {
    localStorage.setItem(consentKey, value);
    if (banner) banner.hidden = true;
    if (value === "accepted") loadMetrika();
  }

  var storedConsent = localStorage.getItem(consentKey);
  if (storedConsent === "accepted") loadMetrika();
  if (!storedConsent && banner) banner.hidden = false;

  document.querySelectorAll("[data-cookie-accept]").forEach(function (button) {
    button.addEventListener("click", function () { saveConsent("accepted"); });
  });
  document.querySelectorAll("[data-cookie-reject]").forEach(function (button) {
    button.addEventListener("click", function () { saveConsent("rejected"); });
  });
  document.querySelectorAll("[data-cookie-settings]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      if (banner) banner.hidden = false;
    });
  });

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href^='http']");
    if (!link || !window.ym || !validCounterId(config.yandexMetrikaId)) return;
    window.ym(Number(config.yandexMetrikaId), "reachGoal", "external_click", { url: link.href });
  });
})();
