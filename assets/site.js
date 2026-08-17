(function () {
  "use strict";

  var themeKey = "totalcode_theme";
  var root = document.documentElement;
  var systemTheme = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function savedTheme() {
    try {
      var value = localStorage.getItem(themeKey);
      return value === "light" || value === "dark" ? value : "";
    } catch (error) {
      return "";
    }
  }

  function applyTheme(theme, remember) {
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    if (remember) {
      try { localStorage.setItem(themeKey, theme); } catch (error) { /* Preference storage may be blocked. */ }
    }
  }

  if (!root.getAttribute("data-theme")) {
    applyTheme(savedTheme() || (systemTheme && systemTheme.matches ? "dark" : "light"), false);
  }

  var themeButton = document.createElement("button");
  themeButton.className = "theme-toggle";
  themeButton.type = "button";
  themeButton.setAttribute("aria-pressed", String(currentTheme() === "dark"));

  function updateThemeButton() {
    var dark = currentTheme() === "dark";
    var label = dark ? "Включить светлую тему" : "Включить тёмную тему";
    themeButton.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true">' + (dark ? "☀" : "☾") + '</span><span class="theme-toggle-text">' + (dark ? "Светлая" : "Тёмная") + '</span>';
    themeButton.setAttribute("aria-label", label);
    themeButton.setAttribute("title", label);
    themeButton.setAttribute("aria-pressed", String(dark));
  }

  updateThemeButton();
  themeButton.addEventListener("click", function () {
    applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
    updateThemeButton();
  });

  var headerInner = document.querySelector(".site-header .header-inner");
  var menuButton = document.querySelector(".menu-button");
  if (headerInner) {
    if (menuButton) headerInner.insertBefore(themeButton, menuButton);
    else headerInner.appendChild(themeButton);
  } else {
    themeButton.classList.add("theme-toggle-floating");
    document.body.appendChild(themeButton);
  }

  if (systemTheme) {
    var followSystemTheme = function (event) {
      if (!savedTheme()) {
        applyTheme(event.matches ? "dark" : "light", false);
        updateThemeButton();
      }
    };
    if (systemTheme.addEventListener) systemTheme.addEventListener("change", followSystemTheme);
    else if (systemTheme.addListener) systemTheme.addListener(followSystemTheme);
  }

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

  var motionReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function enableCursorGlow() {
    if (motionReduced || !window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var glow = document.createElement("div");
    var glowFrame = 0;
    var glowX = -400;
    var glowY = -400;
    glow.className = "cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);

    var paintGlow = function () {
      glow.style.transform = "translate3d(" + (glowX - 150) + "px," + (glowY - 150) + "px,0)";
      glowFrame = 0;
    };

    document.addEventListener("pointermove", function (event) {
      glowX = event.clientX;
      glowY = event.clientY;
      glow.classList.add("is-visible");
      if (!glowFrame) glowFrame = window.requestAnimationFrame(paintGlow);
    }, { passive: true });

    document.documentElement.addEventListener("mouseleave", function () {
      glow.classList.remove("is-visible");
    });
    window.addEventListener("blur", function () {
      glow.classList.remove("is-visible");
    });
  }

  function enableScrollReveals() {
    if (motionReduced || !("IntersectionObserver" in window)) return;

    var revealSelector = [
      ".section-heading", ".split-heading", ".catalog-group-heading", ".product-card",
      ".custom-service-card", ".service-card", ".seo-topic-grid > a", ".portfolio-showcase",
      ".portfolio-gallery-heading", ".portfolio-shot", ".about-grid > *", ".steps > li",
      ".review-heading", ".reviews-carousel", ".faq-home-grid > *", ".community-grid > *",
      ".social-stack > a", ".cta-card", ".page-hero .container", ".product-page-hero-grid > *",
      ".content-card", ".aside-card", ".faq-list > details", ".related-links > a",
      ".links-profile", ".link-tile", ".legal-card", ".legal-nav > a"
    ].join(",");
    var revealItems = Array.prototype.slice.call(document.querySelectorAll(revealSelector));
    if (!revealItems.length) return;

    root.classList.add("motion-ready");
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var item = entry.target;
        var delay = Number(item.getAttribute("data-reveal-delay")) || 0;
        item.classList.add("is-revealed");
        revealObserver.unobserve(item);
        window.setTimeout(function () {
          item.classList.remove("reveal-item", "is-revealed");
          item.removeAttribute("data-reveal-delay");
          item.style.removeProperty("--reveal-delay");
        }, 680 + delay);
      });
    }, { rootMargin: "0px 0px -7%", threshold: 0.08 });

    revealItems.forEach(function (item) {
      var siblings = item.parentElement ? Array.prototype.slice.call(item.parentElement.children) : [];
      var siblingIndex = Math.max(0, siblings.indexOf(item));
      var delay = Math.min(siblingIndex * 55, 220);
      item.classList.add("reveal-item");
      item.setAttribute("data-reveal-delay", String(delay));
      item.style.setProperty("--reveal-delay", delay + "ms");
      revealObserver.observe(item);
    });
  }

  function enablePressEffects() {
    var controlSelector = ".button, .nav-cta, .theme-toggle, .menu-button, .carousel-arrow";

    var addPressEffect = function (control, clientX, clientY) {
      var bounds = control.getBoundingClientRect();
      var ripple = document.createElement("span");
      ripple.className = "button-ripple";
      ripple.style.left = (clientX - bounds.left) + "px";
      ripple.style.top = (clientY - bounds.top) + "px";
      control.classList.remove("is-pressed");
      void control.offsetWidth;
      control.classList.add("is-pressed");
      control.appendChild(ripple);
      ripple.addEventListener("animationend", function () { ripple.remove(); }, { once: true });
      window.setTimeout(function () { control.classList.remove("is-pressed"); }, 220);
    };

    document.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      var control = event.target.closest(controlSelector);
      if (!control) return;
      addPressEffect(control, event.clientX, event.clientY);
    }, { passive: true });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      var control = event.target.closest(controlSelector);
      if (!control || event.repeat) return;
      var bounds = control.getBoundingClientRect();
      addPressEffect(control, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    });
  }

  enableCursorGlow();
  enableScrollReveals();
  if (!motionReduced) enablePressEffects();

  var track = document.querySelector("[data-carousel]");
  var previous = document.querySelector("[data-carousel-prev]");
  var next = document.querySelector("[data-carousel-next]");
  if (track && previous && next) {
    var resumeTimer = null;
    var temporarilyPaused = false;
    var holdPaused = false;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var reviewPauseDelay = 2000;
    var scrollSpeed = 115;
    var lastFrameTime = 0;
    var loopPoint = 0;
    var originalCards = Array.prototype.slice.call(track.querySelectorAll(".review-card"));

    originalCards.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.classList.add("review-card-clone");
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("a, button").forEach(function (control) {
        control.setAttribute("tabindex", "-1");
      });
      track.appendChild(clone);
    });

    var updateLoopPoint = function () {
      var firstOriginal = originalCards[0];
      var firstClone = track.querySelector(".review-card-clone");
      if (firstOriginal && firstClone) {
        loopPoint = firstClone.offsetLeft - firstOriginal.offsetLeft;
      }
    };

    updateLoopPoint();
    window.addEventListener("resize", updateLoopPoint);

    var scrollCards = function (direction) {
      var card = track.querySelector(".review-card");
      var distance = card ? card.getBoundingClientRect().width + 20 : 360;
      if (direction < 0 && loopPoint && track.scrollLeft < distance) {
        track.scrollLeft += loopPoint;
      }
      track.scrollBy({ left: direction * distance, behavior: "smooth" });
    };

    var clearResumeTimer = function () {
      if (resumeTimer) window.clearTimeout(resumeTimer);
      resumeTimer = null;
    };

    var pauseTemporarily = function () {
      temporarilyPaused = true;
      clearResumeTimer();
      resumeTimer = window.setTimeout(function () {
        if (!holdPaused) temporarilyPaused = false;
        resumeTimer = null;
      }, reviewPauseDelay);
    };

    var beginHoldPause = function () {
      holdPaused = true;
      temporarilyPaused = true;
      clearResumeTimer();
    };

    var endHoldPause = function () {
      if (!holdPaused) return;
      holdPaused = false;
      pauseTemporarily();
    };

    previous.addEventListener("click", function () {
      pauseTemporarily();
      scrollCards(-1);
    });
    next.addEventListener("click", function () {
      pauseTemporarily();
      scrollCards(1);
    });

    track.addEventListener("pointerdown", beginHoldPause);
    window.addEventListener("pointerup", endHoldPause);
    window.addEventListener("pointercancel", endHoldPause);
    track.addEventListener("focusin", pauseTemporarily);

    var animateCarousel = function (timestamp) {
      if (!lastFrameTime) lastFrameTime = timestamp;
      var elapsed = Math.min(timestamp - lastFrameTime, 64);
      lastFrameTime = timestamp;

      if (!temporarilyPaused && !reduceMotion && !document.hidden && loopPoint > 0) {
        track.scrollLeft += scrollSpeed * elapsed / 1000;
        if (track.scrollLeft >= loopPoint) track.scrollLeft -= loopPoint;
      }

      window.requestAnimationFrame(animateCarousel);
    };

    window.requestAnimationFrame(animateCarousel);
  }

  var messageTemplate = document.querySelector("[data-message-template]");
  var telegramTemplateLink = document.querySelector("[data-telegram-template]");

  if (messageTemplate && telegramTemplateLink) {
    var messageText = messageTemplate.textContent.replace(/^\s+/gm, "").trim();
    telegramTemplateLink.href = "https://t.me/Privatnumber5?text=" + encodeURIComponent(messageText);
  }

  document.querySelectorAll("[data-product-inquiry]").forEach(function (link) {
    var productName = link.getAttribute("data-product-inquiry");
    if (!productName) return;
    var productMessage = "Здравствуйте! Хочу уточнить наличие и итоговую стоимость.\n\n" +
      "Товар: " + productName + "\n" +
      "Аккаунт: [свой / нужен новый]\n\n" +
      "Подскажите, пожалуйста, актуальные условия.";
    link.href = "https://t.me/Privatnumber5?text=" + encodeURIComponent(productMessage);
  });

  document.querySelectorAll("[data-service-inquiry]").forEach(function (link) {
    var serviceName = link.getAttribute("data-service-inquiry");
    if (!serviceName) return;
    var serviceMessage = "Здравствуйте! Хочу обсудить проект.\n\n" +
      "Услуга: " + serviceName + "\n" +
      "Задача: [кратко опишите желаемый результат]\n" +
      "Важные функции: [если уже известны]\n" +
      "Желаемый срок: [если есть]\n\n" +
      "Подскажите, пожалуйста, какие данные нужны для предварительной оценки.";
    link.href = "https://t.me/Privatnumber5?text=" + encodeURIComponent(serviceMessage);
  });

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
    var specificGoal = link.getAttribute("data-metrika-goal");
    if (specificGoal) {
      window.ym(Number(config.yandexMetrikaId), "reachGoal", specificGoal, {
        product: link.getAttribute("data-product-inquiry") || "",
        service: link.getAttribute("data-service-inquiry") || "",
        url: link.href
      });
    }
    window.ym(Number(config.yandexMetrikaId), "reachGoal", "external_click", { url: link.href });
  });
})();
