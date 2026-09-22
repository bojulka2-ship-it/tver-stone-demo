(function () {
  "use strict";

  var PRICE_PER_M2 = 800;

  document.documentElement.classList.add("js");

  if (document.getElementById("year")) {
    document.getElementById("year").textContent = String(new Date().getFullYear());
  }

  if (window.IS_GITHUB_PAGES) {
    var demoLink = document.getElementById("demoZayavkaLink");
    if (demoLink) {
      demoLink.hidden = false;
    }
  }

  var revealNodes = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealNodes.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealNodes.forEach(function (el) {
      el.classList.add("visible");
    });
  }

  var areaRange = document.getElementById("areaRange");
  var areaValue = document.getElementById("areaValue");
  var priceValue = document.getElementById("priceValue");

  function formatPrice(n) {
    return n.toLocaleString("ru-RU") + " \u20BD";
  }

  function updateCalc() {
    var area = parseInt(areaRange.value, 10);
    areaValue.value = String(area);
    if (priceValue) {
      priceValue.textContent = formatPrice(area * PRICE_PER_M2);
    }
  }

  if (areaRange) {
    areaRange.addEventListener("input", updateCalc);
    updateCalc();
  }

  var form = document.querySelector(".form");
  if (!form) {
    return;
  }

  var phoneInput = form.querySelector("input[name='phone']");
  var methodInputs = form.querySelectorAll("input[name='method']");
  var usernameInput = form.querySelector("input[name='username']");
  var emailInput = form.querySelector("input[name='email']");
  var fieldMessenger = document.getElementById("fieldMessenger");
  var fieldEmail = document.getElementById("fieldEmail");
  var submitBtn = form.querySelector(".form__submit");
  var agreeInput = form.querySelector("input[name='agree_pd']");
  var successBox = form.querySelector(".form__success");
  var errorBox = form.querySelector(".form__error");
  var successTimer = null;

  function maskPhone(input) {
    var digits = input.value.replace(/\D/g, "");
    if (!digits.length) {
      input.value = "";
      return;
    }
    if (digits[0] === "8") digits = "7" + digits.slice(1);
    if (digits[0] === "9") digits = "7" + digits;
    if (digits.length > 11) digits = digits.slice(0, 11);
    var out = "+7";
    if (digits.length > 1) out += " (" + digits.slice(1, 4);
    if (digits.length >= 4) out += ") " + digits.slice(4, 7);
    if (digits.length >= 7) out += "-" + digits.slice(7, 9);
    if (digits.length >= 9) out += "-" + digits.slice(9, 11);
    input.value = out;
  }

  phoneInput.addEventListener("input", function () {
    maskPhone(phoneInput);
  });
  phoneInput.addEventListener("focus", function () {
    if (!phoneInput.value) phoneInput.value = "+7 (";
  });

  function updateConditionalFields() {
    var method = null;
    methodInputs.forEach(function (radio) {
      if (radio.checked) method = radio.value;
    });

    var showMessenger = method === "whatsapp" || method === "telegram";
    var showEmail = method === "email";

    if (fieldMessenger) {
      fieldMessenger.hidden = !showMessenger;
      usernameInput.required = showMessenger;
    }
    if (fieldEmail) {
      fieldEmail.hidden = !showEmail;
      emailInput.required = showEmail;
    }
  }

  methodInputs.forEach(function (radio) {
    radio.addEventListener("change", updateConditionalFields);
  });
  updateConditionalFields();

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function setError(message) {
    if (!message) {
      errorBox.hidden = true;
      errorBox.textContent = "";
      return;
    }
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    setError(null);
    successBox.hidden = true;

    var name = form.querySelector("input[name='name']").value.trim();
    var phoneDigits = phoneInput.value.replace(/\D/g, "");

    if (!name) {
      setError("Укажите ваше имя.");
      form.querySelector("input[name='name']").focus();
      return;
    }
    if (phoneDigits.length < 11) {
      setError("Укажите номер телефона полностью.");
      phoneInput.focus();
      return;
    }

    var method = null;
    methodInputs.forEach(function (radio) {
      if (radio.checked) method = radio.value;
    });

    if (method === "email" && emailInput && !isValidEmail(emailInput.value.trim())) {
      setError("Укажите корректный e-mail.");
      emailInput.focus();
      return;
    }

    if (agreeInput && !agreeInput.checked) {
      setError("Подтвердите согласие на обработку персональных данных.");
      agreeInput.focus();
      return;
    }

    if (window.IS_GITHUB_PAGES) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Отправляем…";
      window.setTimeout(function () {
        form.reset();
        updateConditionalFields();
        clearTimeout(successTimer);
        successBox.innerHTML =
          "Ваша заявка принята (демо-режим: GitHub Pages не хранит заявки, серверный обработчик не подключён). " +
          '<a href="zayavka.html" style="color:#fff;text-decoration:underline">Посмотреть, как выглядит заявка у менеджера →</a>';
        successBox.hidden = false;
        successTimer = setTimeout(function () {
          successBox.hidden = true;
        }, 12000);
        submitBtn.disabled = false;
        submitBtn.textContent = "Рассчитать стоимость";
      }, 700);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Отправляем…";

    var apiUrl = window.API_URL || (form.action || "send.php");

    fetch(apiUrl, {
      method: "POST",
      body: new URLSearchParams(new FormData(form))
    })
      .then(function (response) {
        return response.json().catch(function () {
          return { ok: response.ok };
        }).then(function (data) {
          if (!response.ok || !data.ok) {
            throw new Error(data.message || "Не удалось отправить заявку.");
          }
          form.reset();
          updateConditionalFields();
          clearTimeout(successTimer);
          successBox.hidden = false;
          successTimer = setTimeout(function () {
            successBox.hidden = true;
          }, 8000);
        });
      })
      .catch(function (err) {
        var message;
        if (location.protocol === "file:") {
          message = "Форма работает только через сервер. Откройте сайт командой php -S 127.0.0.1:8000 из папки проекта (или загрузите на хостинг).";
        } else if (!navigator.onLine || err instanceof TypeError) {
          message = "Не удалось отправить заявку: нет связи с сервером. Проверьте интернет и повторите, или позвоните нам: +7 (900) 000-00-00.";
        } else {
          message = err.message + " Позвоните нам: +7 (900) 000-00-00.";
        }
        setError(message);
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Рассчитать стоимость";
      });
  });
})();