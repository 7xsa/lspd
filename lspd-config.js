/*
  LSPD portal configuration — the one file to edit for branding, colours,
  images, the chief profile, credits and the Supabase connection.

  Secrets do NOT belong here (this file is public). Discord webhooks are
  stored inside the database: see supabase/README.md.
*/
(function () {
  "use strict";

  var config = {
    brand: {
      shortName: "FT | LSPD",
      department: "Los Santos Police Department",
      portal: "Command Portal",
      connectUrl: "fivem://connect/ftlspd.com",
      version: "2.0",
      madeBy: "Majed Alqahtani · Murphy Edward",
      // Loaded without blocking the first paint. Orbitron = titles and labels, Exo 2 = text, Cairo = Arabic.
      fonts: "https://fonts.googleapis.com/css2?family=Cairo:wght@500;700&family=Exo+2:wght@400;500;600;700&family=Orbitron:wght@500;700;900&family=Share+Tech+Mono&display=swap"
    },

    // Every colour of the interface. Change a value, refresh, done.
    colors: {
      bg: "#08090b",
      glass: "rgba(17, 18, 22, .72)",
      glassStrong: "rgba(12, 13, 16, .94)",
      line: "rgba(255, 255, 255, .085)",
      red: "#e5383b",
      blue: "#7ea6dc",
      text: "#ececef",
      muted: "#8d909a",
      success: "#3ddc97",
      warning: "#ffc061"
    },

    assets: {
      shield: "assets/shield.webp",
      backdrop: "assets/backdrop.webp",
      hero: "assets/hero.webp",
      chiefPortrait: "assets/chief.webp",
      fallback: "assets/fallback.webp"
    },

    chief: {
      firstName: "Murphy",
      lastName: "Edward",
      rank: "Chief of Police",
      intro: "Discipline, accountability and one clear standard for every officer under the badge.",
      details: [
        { label: "Command", value: "Department operations" },
        { label: "Standards", value: "Readiness and conduct" },
        { label: "Strategy", value: "Public safety direction" }
      ]
    },

    credits: [
      { name: "Majed Alqahtani", role: "Head of Internal Affairs · Lead developer", icon: "code" },
      { name: "Murphy Edward", role: "Chief of Police", icon: "star" },
      { name: "Mohsen Alqahtani", role: "Assistant developer", icon: "code" }
    ],

    supabase: {
      url: "https://cydsusnowotmorxywyxa.supabase.co",
      anonKey: "sb_publishable_1Onpbnsgcx2zaSAwqEsMMw_vDGJRdfq",
      sdk: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
      bucket: "lspd-media",
      tables: {
        applications: "lspd_applications",
        accounts: "lspd_accounts",
        assets: "lspd_assets",
        streams: "lspd_streams",
        reactions: "lspd_media_reactions",
        regulations: "lspd_regulations",
        schedule: "lspd_schedule",
        audit: "lspd_audit_log",
        news: "lspd_news",
        pages: "lspd_pages"
      }
    },

    features: {
      sounds: true,            // interface sound effects (each visitor can mute them)
      soundVolume: 0.5,        // 0 – 1
      animations: true,
      onlineCounter: true,     // live "online now" badge (Supabase Realtime presence)
      streamRefreshSeconds: 60
    },

    security: {
      minimumPasswordLength: 10
    }
  };

  // ---- applied before first paint (no flash of the wrong theme or direction) ----
  var root = document.documentElement;
  var vars = {
    bg: "--bg", glass: "--glass", glassStrong: "--glass-strong", line: "--line", red: "--red",
    blue: "--blue", text: "--text", muted: "--muted", success: "--ok", warning: "--warn"
  };
  Object.keys(config.colors).forEach(function (key) {
    if (vars[key]) root.style.setProperty(vars[key], config.colors[key]);
  });

  try {
    var prefs = JSON.parse(localStorage.getItem("lspd-prefs-v2") || "{}");
    if (/^#[0-9a-f]{6}$/i.test(prefs.red || "")) root.style.setProperty("--red", prefs.red);
    if (/^#[0-9a-f]{6}$/i.test(prefs.blue || "")) root.style.setProperty("--blue", prefs.blue);
    if (prefs.motion === false || config.features.animations === false) root.classList.add("no-motion");
    if (localStorage.getItem("lspd-language") === "ar") { root.lang = "ar"; root.dir = "rtl"; }
    if (localStorage.getItem("lspd-me-v2")) root.classList.add("signed-in");
  } catch (error) { /* storage blocked: defaults apply */ }

  // Show the right section immediately when the page opens on a deep link.
  var route = (location.hash.match(/^#\/([a-z]+)/) || [])[1];
  if (route && document.currentScript && !document.currentScript.hasAttribute("data-auth")) root.setAttribute("data-route", route);

  if (config.brand.fonts) {
    var fonts = document.createElement("link");
    fonts.rel = "stylesheet";
    fonts.href = config.brand.fonts;
    document.head.appendChild(fonts);
  }

  window.LSPD_CONFIG = config;
  // Used by the login / register pages.
  window.LSPD_SUPABASE_CONFIG = { url: config.supabase.url, anonKey: config.supabase.anonKey, sdk: config.supabase.sdk };
})();
