(function () {
  "use strict";

  // GitHub Pages — публичный статический хостинг без серверного обработчика.
  // На поддоменах *.github.io форма переходит в демо-режим (имитация приёма).
  window.IS_GITHUB_PAGES = /\.github\.io$/.test(window.location.hostname);

  // Единая точка настройки адреса обработчика формы.
  // Netlify:  "/api/submit" (Netlify Function)
  // PHP-хостинг: "/send.php"   — поменяйте одну строку ниже.
  window.API_URL = "/api/submit";
})();