// Login and registration pages.
(function () {
  "use strict";

  const SB = window.LSPD_SUPABASE_CONFIG;
  const MIN_PASSWORD = Number(window.LSPD_CONFIG.security.minimumPasswordLength || 10);
  const PORTAL_URL = new URL("../ftlspd-portal.html", location.href).href; // allow-listed auth redirect
  const PENDING_NAME_KEY = "lspd-pending-display-name-v1";
  const mode = document.body.dataset.authMode === "register" ? "register" : "login";
  const arabic = document.documentElement.lang === "ar";
  const $ = (id) => document.getElementById(id);

  const copy = {
    en: {
      loginKicker: "LSPD // Secure access", loginTitle: "Officer login", registerKicker: "LSPD // New account", registerTitle: "Create account",
      name: "Display name", email: "Email", password: "Password", login: "Login", register: "Create account", discord: "Continue with Discord",
      toRegister: "Create account", toLogin: "Login", back: "Back to hub",
      required: "Fill in every field.", short: "Use at least {n} characters.", invalid: "Wrong email or password.", wait: "Too many attempts. Try again in 30 seconds.",
      working: "Working…", confirm: "Account created. Check your email to confirm it.", done: "Signed in. Returning to the hub…", offline: "Can't reach the server. Try again.", nameFirst: "Enter a display name first."
    },
    ar: {
      loginKicker: "LSPD // دخول آمن", loginTitle: "تسجيل الدخول", registerKicker: "LSPD // حساب جديد", registerTitle: "إنشاء حساب",
      name: "اسم العرض", email: "البريد", password: "كلمة المرور", login: "دخول", register: "إنشاء حساب", discord: "المتابعة عبر ديسكورد",
      toRegister: "حساب جديد", toLogin: "دخول", back: "العودة للرئيسية",
      required: "أكمل جميع الحقول.", short: "استخدم {n} حرفاً على الأقل.", invalid: "البريد أو كلمة المرور غير صحيحة.", wait: "محاولات كثيرة. حاول بعد 30 ثانية.",
      working: "جارٍ التنفيذ…", confirm: "تم إنشاء الحساب. تحقق من بريدك لتأكيده.", done: "تم الدخول. جارٍ العودة…", offline: "تعذر الاتصال بالخادم. حاول مجدداً.", nameFirst: "أدخل اسم العرض أولاً."
    }
  }[arabic ? "ar" : "en"];
  const t = (key, n) => copy[key].replace("{n}", n);

  document.querySelectorAll("[data-t]").forEach((node) => { node.textContent = t(node.dataset.t); });

  const form = $("authForm");
  const status = $("authStatus");
  const submit = $("authSubmit");
  let clientPromise = null;

  function setStatus(message, type) {
    status.textContent = message;
    status.dataset.state = type || "";
  }

  function client() {
    clientPromise = clientPromise || new Promise((resolve, reject) => {
      const make = () => resolve(window.supabase.createClient(SB.url, SB.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "ftlspd-supabase-auth-v1" }
      }));
      if (window.supabase && window.supabase.createClient) return make();
      const script = document.createElement("script");
      script.src = SB.sdk;
      script.onload = make;
      script.onerror = () => { clientPromise = null; reject(new Error(t("offline"))); };
      document.head.appendChild(script);
    });
    return clientPromise;
  }
  client().catch(() => {}); // start downloading while the visitor types

  // Small client-side brake; real rate limiting is done by Supabase Auth.
  const throttle = {
    read() { try { return JSON.parse(sessionStorage.getItem("lspd-auth-throttle")) || { n: 0, until: 0 }; } catch (e) { return { n: 0, until: 0 }; } },
    fail() { const s = this.read(); s.n += 1; if (s.n >= 5) { s.n = 0; s.until = Date.now() + 30000; } sessionStorage.setItem("lspd-auth-throttle", JSON.stringify(s)); },
    clear() { sessionStorage.removeItem("lspd-auth-throttle"); }
  };

  function finish(supabase, action) {
    try { sessionStorage.setItem("lspd-welcome", "1"); } catch (e) { /* ignore */ }
    setStatus(t("done"), "success");
    const leave = () => location.replace("../");
    // Audit entry (database function). Never blocks the redirect for long.
    Promise.race([supabase.rpc("lspd_log_event", { p_action: action, p_details: {} }).then(() => {}, () => {}), new Promise((r) => setTimeout(r, 700))]).then(leave, leave);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = $("authEmail").value.trim().toLowerCase();
    const password = $("authPassword").value;
    const name = mode === "register" ? $("authName").value.trim() : "";
    if (throttle.read().until > Date.now()) return setStatus(t("wait"), "error");
    if (!email || !password || (mode === "register" && !name)) return setStatus(t("required"), "error");
    if (mode === "register" && password.length < MIN_PASSWORD) return setStatus(t("short", MIN_PASSWORD), "error");

    submit.disabled = true;
    setStatus(t("working"), "");
    try {
      const supabase = await client();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.status === 400 ? t("invalid") : error.message || t("offline"));
        throttle.clear();
        finish(supabase, "auth.login");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: PORTAL_URL, data: { display_name: name, full_name: name, name } }
        });
        if (error) throw new Error(error.message || t("offline"));
        throttle.clear();
        if (!data.session) { setStatus(t("confirm"), "success"); submit.disabled = false; form.reset(); return; }
        finish(supabase, "auth.register");
      }
    } catch (error) {
      throttle.fail();
      setStatus(error.message || t("offline"), "error");
      submit.disabled = false;
    }
  });

  $("authDiscord").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    if (mode === "register") {
      const name = $("authName").value.trim();
      if (!name) return setStatus(t("nameFirst"), "error");
      try { sessionStorage.setItem(PENDING_NAME_KEY, name); } catch (e) { /* ignore */ }
    }
    button.disabled = true;
    setStatus(t("working"), "");
    try {
      const supabase = await client();
      const { error } = await supabase.auth.signInWithOAuth({ provider: "discord", options: { redirectTo: PORTAL_URL } });
      if (error) throw error;
    } catch (error) {
      setStatus(error.message || t("offline"), "error");
      button.disabled = false;
    }
  });
})();
