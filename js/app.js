// LSPD Command Portal — application logic.
// Views render from cache first and load only the data they need.

import { t, getLang, setLang, questions, transferRules, ranks, rosterSections, wings, reactions, staffRoles } from "./i18n.js";
import { T, publicRead, publicRpc, sdk, run, db, resource, compressFile, compressUrl, upload, isUploadable, isStorageUrl } from "./api.js";
import { prefs, savePrefs, play, initFeedback, countTo } from "./sfx.js";

const CONFIG = window.LSPD_CONFIG;
const PORTAL_URL = new URL("ftlspd-portal.html", location.href).href; // allow-listed auth redirect
const PENDING_NAME_KEY = "lspd-pending-display-name-v1";
const ME_KEY = "lspd-me-v2";
// Degrees 1–7 share one neutral colour; degree 0 (critical) is the only one in red.
const DEGREE_COLORS = { 1: "#f1f2f4", 2: "#f1f2f4", 3: "#f1f2f4", 4: "#f1f2f4", 5: "#f1f2f4", 6: "#f1f2f4", 7: "#f1f2f4", 0: "#e5383b" };
const DEGREE_ORDER = [1, 2, 3, 4, 5, 6, 7, 0];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value) => String(value ?? "").replace(/[&<>"'`]/g, (char) => "&#" + char.charCodeAt(0) + ";");
const icon = (name) => `<svg class="i"><use href="assets/icons.svg#i-${name}"/></svg>`;
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const webUrl = (value) => (/^https?:\/\//i.test(String(value || "").trim()) ? String(value).trim() : "");
const imageUrl = (value) => (/^(https?:\/\/|data:image\/)/i.test(String(value || "")) ? value : CONFIG.assets.fallback);
const locale = () => (getLang() === "ar" ? "ar-SA-u-ca-gregory" : "en-GB");
const fmtDate = (value) => (value ? new Date(value).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" }) : "–");
const fmtDateTime = (value) => (value ? new Date(value).toLocaleString(locale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "–");
const initials = (value) => String(value || "?").replace(/@.*/, "").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
const debounce = (fn, ms) => { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }; };
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 600));

const state = {
  me: null,
  authReady: false,
  route: "",
  regFilter: "all",
  sopChapter: "institution",
  sopResults: false,
  newsFilter: "all",
  logFilter: "all",
  logs: [],
  logsMore: false,
  reviewKind: "recruitment",
  archiveKey: "accepted-recruitment",
  archiveRows: [],
  archiveMore: false,
  editing: {},
  apply: { kind: "recruitment", step: 0, draft: {} },
  decision: null,
  live: {},
  liveAt: 0,
  liveTimer: 0,
  accounts: []
};

try { state.me = JSON.parse(localStorage.getItem(ME_KEY) || "null"); } catch (error) { /* signed-out header */ }

// ---------------------------------------------------------------- permissions
const role = () => state.me?.role || "guest";
const can = {
  admin: () => role() === "owner" || role() === "admin",
  review: () => can.admin() || role() === "fto",
  crew: () => can.admin(),
  mediaAdd: () => can.admin() || role() === "media",
  mediaEdit: () => can.admin(),
  regs: () => can.admin() || role() === "ia",
  roster: () => can.admin()
};
const roleLabel = (value) => t("role" + value.charAt(0).toUpperCase() + value.slice(1));

// ---------------------------------------------------------------- data
const sortAssets = (rows) => rows.slice().sort((a, b) => (a.display_order ?? 1e9) - (b.display_order ?? 1e9) || String(b.created_at).localeCompare(String(a.created_at)));

const res = {
  assets: resource("assets", async () => sortAssets(await publicRead(T.assets, { select: "id,category,title,subtitle,discord_id,photo_url,storage_path,caption,display_order,media_type,created_at" })), { persist: true }),
  streams: resource("streams", () => publicRead(T.streams, { select: "id,name,logo_url,kick_url", order: "created_at.asc" }), { persist: true, ttl: 300000 }),
  // The roster loads without insignia first: older rows embed multi-megabyte images.
  roster: resource("roster", () => publicRead(T.schedule, { select: "id,badge_number,name,rank,department,admin_rank,status,punishment,last_promotion,discord_user,points,privilege_points,wings" }), { persist: true }),
  insignia: resource("insignia", async () => Object.fromEntries((await publicRead(T.schedule, { select: "id,insignia_url" }, 45000)).map((row) => [row.id, row.insignia_url || ""])), { persist: true, ttl: 600000 }),
  news: resource("news", () => publicRead(T.news, { select: "id,title,body,category,image_url,pinned,created_at,updated_at", order: "pinned.desc,created_at.desc", limit: "60" }), { persist: true, ttl: 120000 }),
  regs: resource("regs", () => publicRead(T.regulations, { select: "id,degree,regulation_code,title,description", order: "created_at.asc" }), { persist: true }),
  reactions: resource("reactions", loadReactions, { ttl: 30000 }),
  myApps: resource("myApps", loadMyApps, { ttl: 30000 }),
  pending: resource("pending", async () => {
    const client = await sdk();
    return (await run(client.from(T.applications).select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(300))).data;
  }, { ttl: 20000 })
};

async function loadReactions() {
  let rows;
  try {
    rows = state.me ? (await run((await sdk()).rpc("lspd_reaction_summary"))).data : await publicRpc("lspd_reaction_summary");
  } catch (error) {
    if (error.code === "offline") throw error;
    // Database not migrated yet: count on the client.
    const raw = await publicRead(T.reactions, { select: "asset_id,reaction,user_key" });
    const tally = new Map();
    for (const row of raw) {
      const key = row.asset_id + "|" + row.reaction;
      const entry = tally.get(key) || { asset_id: row.asset_id, reaction: row.reaction, total: 0, mine: false };
      entry.total += 1;
      if (state.me && row.user_key === state.me.id) entry.mine = true;
      tally.set(key, entry);
    }
    rows = [...tally.values()];
  }
  const map = {};
  for (const row of rows || []) (map[row.asset_id] ||= {})[row.reaction] = { n: Number(row.total) || 0, mine: Boolean(row.mine) };
  return map;
}

async function loadMyApps() {
  if (!state.me) return [];
  const client = await sdk();
  const email = String(state.me.email || "").replace(/["\\]/g, "");
  const query = client.from(T.applications)
    .select("id,kind,status,created_at,cooldown_until,decision_message,rejection_reason,interview_dates,decided_at")
    .or(`applicant_user_id.eq.${state.me.id},applicant_email.eq."${email}"`)
    .order("created_at", { ascending: false }).limit(20);
  return (await run(query)).data;
}

/** Paint from cache immediately, then revalidate and repaint only when the data changed. */
async function hydrate(source, render, target) {
  const cached = source.peek();
  let shown = cached === undefined ? null : JSON.stringify(cached);
  if (shown !== null) render();
  if (source.fresh()) return;
  try {
    const data = await source.load();
    setOnline(true);
    if (JSON.stringify(data) !== shown) render();
  } catch (error) {
    console.warn(error);
    if (error.code === "offline") setOnline(false);
    if (shown === null && target) target.innerHTML = `<div class="empty">${esc(explain(error))}</div>`;
  }
}

function explain(error) {
  if (error?.code === "offline") return t("offlineError");
  if (error?.code === "42501" || /row-level security|permission denied/i.test(error?.message || "")) return t("noPermission");
  if (error?.code === "P0001" && error.message) return error.message;
  if (error?.code === "upload") return t("uploadError");
  return t("genericError");
}

function fail(error) {
  console.warn(error);
  toast(explain(error), "error");
}

// ---------------------------------------------------------------- ui primitives
function toast(message, type = "", sticky = false) {
  const node = document.createElement("div");
  node.className = "toast " + type;
  node.textContent = message;
  const stack = $("#toasts");
  while (stack.children.length >= 3) stack.firstElementChild.remove();
  stack.append(node);
  if (type === "error") play("error"); else if (type === "ok") play("success");
  const close = () => { node.classList.add("out"); setTimeout(() => node.remove(), 260); };
  if (!sticky) setTimeout(close, 3600);
  return { set: (text) => { node.textContent = text; }, close };
}

function openDialog(id) {
  const dialog = $("#" + id);
  if (!dialog.open) { dialog.showModal(); play("open"); }
  return dialog;
}

const closeDialog = (id) => { const dialog = $("#" + id); if (dialog.open) dialog.close(); };

function ask(text) {
  return new Promise((resolve) => {
    const dialog = $("#dlgConfirm");
    $("#confirmText").textContent = text;
    let answer = false;
    const yes = () => { answer = true; dialog.close(); };
    $("#confirmYes").addEventListener("click", yes, { once: true });
    dialog.addEventListener("close", () => { $("#confirmYes").removeEventListener("click", yes); resolve(answer); }, { once: true });
    openDialog("dlgConfirm");
  });
}

async function busy(button, task) {
  if (button?.classList.contains("is-busy")) return;
  button?.classList.add("is-busy");
  try { return await task(); } catch (error) { fail(error); } finally { button?.classList.remove("is-busy"); }
}

function setOnline(online) {
  const pill = $("#statusPill");
  if (pill.classList.contains("is-offline") === !online) return;
  pill.classList.toggle("is-offline", !online);
  pill.lastElementChild.textContent = t(online ? "statusOnline" : "statusOffline");
}

const empty = (key) => `<div class="empty">${esc(t(key))}</div>`;
const skeletons = (count, kind = "") => Array.from({ length: count }, () => `<div class="skeleton ${kind}"></div>`).join("");
const tools = (kind, id) => `<div class="card-tools"><button class="icon-btn" type="button" data-act="edit-${kind}" data-id="${esc(id)}" title="${esc(t("edit"))}">${icon("edit")}</button><button class="icon-btn danger" type="button" data-act="del-${kind}" data-id="${esc(id)}" title="${esc(t("remove"))}">${icon("trash")}</button></div>`;

// ---------------------------------------------------------------- language
function applyLanguage() {
  const root = document.documentElement;
  root.lang = getLang();
  root.dir = getLang() === "ar" ? "rtl" : "ltr";
  document.title = t("pageTitle");
  $("#lang").value = getLang();
  for (const node of $$("[data-t]")) node.textContent = t(node.dataset.t);
  for (const node of $$("[data-t-html]")) node.innerHTML = t(node.dataset.tHtml);
  for (const node of $$("[data-t-ph]")) node.placeholder = t(node.dataset.tPh);
  for (const node of $$("[data-t-title]")) { node.title = t(node.dataset.tTitle); node.setAttribute("aria-label", node.title); }
  $("#passwordLabel").textContent = t("newPassword", { n: CONFIG.security.minimumPasswordLength });
  $("#footerLeft").textContent = `${CONFIG.brand.shortName} · v${CONFIG.brand.version} · ${CONFIG.brand.madeBy}`;
  $("#rulesList").innerHTML = transferRules.map((rule) => `<li>${esc(rule)}</li>`).join("");
  renderIdentity();
  renderCredits();
  renderChief();
}

// ---------------------------------------------------------------- router
const routes = {
  hub: { live: true, enter: enterHub },
  news: { live: true, enter: enterNews },
  regulations: { enter: enterRegulations },
  sop: { enter: enterSop },
  fto: {},
  crew: { live: true, enter: enterCrew },
  media: { live: true, enter: enterMedia },
  streams: { live: true, enter: enterStreams, leave: () => clearInterval(state.liveTimer) },
  credits: {},
  roster: { live: true, enter: enterRoster },
  admin: { need: "admin", enter: enterAdmin },
  review: { need: "review", live: true, enter: enterReview },
  archives: { need: "review", enter: enterArchives },
  logs: { need: "admin", enter: () => loadLogs(true) }
};

function navigate() {
  const match = location.hash.match(/^#\/([a-z]+)/);
  let name = match && routes[match[1]] ? match[1] : "hub";
  const need = routes[name].need;
  if (need && !can[need]()) {
    if (state.authReady) { toast(t("needAccess"), "warn"); history.replaceState(null, "", "#/hub"); }
    name = "hub";
  }
  const changed = name !== state.route;
  if (changed) {
    routes[state.route]?.leave?.();
    for (const view of $$(".view")) view.hidden = view.id !== "view-" + name;
    for (const tab of $$(".tab")) {
      if (tab.dataset.tab === name) { tab.setAttribute("aria-current", "page"); tab.scrollIntoView({ block: "nearest", inline: "nearest" }); }
      else tab.removeAttribute("aria-current");
    }
    $(".more-btn").classList.toggle("is-active", Boolean($("#morePop [aria-current]")));
    closePops();
    const view = $("#view-" + name);
    view.classList.remove("enter");
    void view.offsetWidth;
    view.classList.add("enter");
    setTimeout(() => view.classList.remove("enter"), 900);
    if (state.route) { scrollTo(0, 0); play("nav"); }
    state.route = name;
    document.documentElement.removeAttribute("data-route");
  }
  routes[name].enter?.();
}

// ---------------------------------------------------------------- identity
function renderIdentity() {
  const me = state.me;
  document.documentElement.classList.toggle("signed-in", Boolean(me));
  $("#guestActions").hidden = Boolean(me);
  $("#logoutBtn").hidden = !me;
  $("#accountBtn").hidden = !me;
  $("#userAvatar").innerHTML = !me ? icon("user") : me.avatar ? `<img src="${esc(me.avatar)}" alt="" referrerpolicy="no-referrer">` : esc(initials(me.name || me.email));
  $("#userChip").classList.toggle("needs-profile", Boolean(me) && !profileComplete());
  $("#roleBadge").textContent = me ? me.name || roleLabel(role()) : roleLabel(role());
  $("#userChip").title = me ? `${me.email} · ${roleLabel(role())}` : "";
  for (const node of $$("[data-need]")) node.hidden = !can[node.dataset.need]();
  $("#regComposer").hidden = !can.regs();
  $("#crewComposer").hidden = !can.crew();
  $("#mediaComposer").hidden = !can.mediaAdd();
  $("#streamComposer").hidden = !can.admin();
  $("#rosterComposer").hidden = !can.roster();
  $("#newsComposer").hidden = !can.admin();
}

function setMe(me) {
  state.me = me;
  try {
    if (me) localStorage.setItem(ME_KEY, JSON.stringify(me)); else localStorage.removeItem(ME_KEY);
  } catch (error) { /* ignore */ }
}

const profileComplete = () => Boolean(state.me?.name && state.me?.discord && state.me?.linked);

let authQueue = Promise.resolve();

async function initAuth() {
  let client;
  try {
    client = await sdk();
  } catch (error) {
    setOnline(false);
    state.authReady = true;
    return;
  }
  const enqueue = (event, session) => { authQueue = authQueue.then(() => onAuth(event, session)).catch(console.warn); };
  client.auth.onAuthStateChange((event, session) => setTimeout(() => enqueue(event, session), 0));
  // Older SDK builds do not emit INITIAL_SESSION.
  client.auth.getSession().then(({ data }) => { if (!state.authReady) enqueue("INITIAL_SESSION", data?.session || null); });
}

async function onAuth(event, session) {
  const user = session?.user || null;
  if (event === "TOKEN_REFRESHED") return;
  if (user && state.authReady && state.me?.id === user.id && event !== "USER_UPDATED") return; // tab focus re-emits SIGNED_IN
  const wasSignedIn = Boolean(state.me);
  const hadSession = state.authReady;
  if (user) await loadProfile(user); else setMe(null);
  state.authReady = true;
  res.myApps.clear();
  res.reactions.stale();
  if (!user) res.pending.clear();
  renderIdentity();
  navigate();
  let greet = hadSession && !wasSignedIn;
  try { if (sessionStorage.getItem("lspd-welcome")) { sessionStorage.removeItem("lspd-welcome"); greet = true; } } catch (error) { /* ignore */ }
  if (user && greet) toast(t("welcome", { name: state.me.name || state.me.email }), "ok");
  if (can.review()) idle(refreshReviewBadge);
  idle(checkNotes);
}

async function loadProfile(user) {
  const client = await sdk();
  const columns = "id,email,role,display_name,discord_user,discord_avatar_url,discord_provider_id,discord_linked";
  const read = () => client.from(T.accounts).select(columns).eq("auth_user_id", user.id).maybeSingle();
  let { data: row, error } = await read();
  if (!row && !error) {
    await client.rpc("lspd_ensure_account").then(() => {}, () => {});
    ({ data: row } = await read());
  }
  if (error) console.warn(error);

  const meta = user.user_metadata || {};
  const identity = (user.identities || []).find((entry) => entry.provider === "discord");
  const discord = identity?.identity_data || {};
  let pendingName = "";
  try { pendingName = (sessionStorage.getItem(PENDING_NAME_KEY) || "").trim(); sessionStorage.removeItem(PENDING_NAME_KEY); } catch (e) { /* ignore */ }

  const me = {
    id: user.id,
    accountId: row?.id || "",
    email: String(row?.email || user.email || "").toLowerCase(),
    // If the profile could not be read (network), keep the last known role instead of demoting the UI.
    role: ["owner", "admin", "fto", "media", "ia"].includes(row?.role) ? row.role : (error && state.me?.id === user.id ? state.me.role : "applicant"),
    name: row?.display_name || pendingName || meta.display_name || meta.full_name || meta.name || "",
    discord: row?.discord_user || discord.preferred_username || discord.user_name || discord.name || "",
    avatar: row?.discord_avatar_url || discord.avatar_url || discord.picture || "",
    discordId: row?.discord_provider_id || discord.provider_id || discord.sub || "",
    linked: Boolean(row?.discord_linked || identity)
  };
  setMe(me);

  // Keep the account row in step with the linked Discord identity.
  if (row) {
    const patch = {};
    if ((row.display_name || "") !== me.name) patch.display_name = me.name || null;
    if ((row.discord_user || "") !== me.discord) patch.discord_user = me.discord || null;
    if ((row.discord_avatar_url || "") !== me.avatar) patch.discord_avatar_url = me.avatar || null;
    if ((row.discord_provider_id || "") !== me.discordId) patch.discord_provider_id = me.discordId || null;
    if (Boolean(row.discord_linked) !== me.linked) patch.discord_linked = me.linked;
    if (Object.keys(patch).length) db.update(T.accounts, row.id, { ...patch, updated_at: now() }).catch(console.warn);
  }
}

async function updateOwnAccount(patch) {
  if (!state.me?.accountId) throw new Error("No account row");
  await db.update(T.accounts, state.me.accountId, { ...patch, updated_at: now() });
}

async function logout() {
  const client = await sdk();
  await Promise.race([client.rpc("lspd_log_event", { p_action: "auth.logout", p_details: {} }).then(() => {}, () => {}), new Promise((done) => setTimeout(done, 500))]);
  await client.auth.signOut();
  closeDialog("dlgAccount");
  toast(t("loggedOut"), "ok");
}

async function linkDiscord() {
  if (!state.me) return toast(t("needLogin"), "warn");
  const name = ($("#profileForm").elements.name.value || state.me.name || "").trim();
  try { if (name) sessionStorage.setItem(PENDING_NAME_KEY, name); } catch (error) { /* ignore */ }
  const client = await sdk();
  const { error } = await client.auth.linkIdentity({ provider: "discord", options: { redirectTo: PORTAL_URL } });
  if (error) toast(error.message || t("genericError"), "error");
}

function renderDiscordState(target) {
  const linked = Boolean(state.me?.linked);
  target.className = "link-state full" + (linked ? " ok" : "");
  target.innerHTML = `${icon("discord")}<span>${esc(t(linked ? "discordLinked" : "discordMissing"))}</span>${state.me?.discord ? `<strong>${esc(state.me.discord)}</strong>` : ""}`;
}

function openProfile() {
  $("#profileForm").elements.name.value = state.me?.name || "";
  renderDiscordState($("#profileDiscord"));
  $('[data-act="link-discord"]').hidden = Boolean(state.me?.linked);
  openDialog("dlgProfile");
}

function openAccount() {
  if (!state.me) return;
  const me = state.me;
  $("#accountSummary").innerHTML = `
    <div class="avatar">${me.avatar ? `<img src="${esc(me.avatar)}" alt="" referrerpolicy="no-referrer">` : esc(initials(me.name || me.email))}</div>
    <div class="grow"><h3>${esc(me.name || me.email)}</h3><p>${esc(me.email)} · ${esc(roleLabel(me.role))}</p></div>
    ${me.linked ? `<span class="pill">${icon("discord")}${esc(me.discord || t("discordLinked"))}</span>` : `<button class="btn btn-discord" type="button" data-act="link-discord">${icon("discord")}<span>${esc(t("linkDiscord"))}</span></button>`}`;
  $("#nameForm").elements.name.value = me.name;
  $("#emailForm").elements.email.value = me.email;
  $("#passwordForm").reset();
  const list = $("#accountApplications");
  hydrate(res.myApps, () => {
    const rows = res.myApps.peek() || [];
    list.innerHTML = rows.length ? rows.map(appRow).join("") : empty("noApplications");
  }, list);
  openDialog("dlgAccount");
}

// ---------------------------------------------------------------- hub
function enterHub() {
  hydrate(res.roster, () => countTo($("#statOfficers"), (res.roster.peek() || []).length));
  hydrate(res.streams, () => refreshLive());
  renderHubApplications();
  if (!newsMissing) res.news.load().then(renderHubNews, noteNewsMissing);
  renderHubNews();
}

const kindLabel = (kind) => t(kind === "transfer" ? "transfer" : "recruitment");

function appRow(app) {
  const detail = app.status === "accepted" ? [app.decision_message, interviewText(app)].filter(Boolean).join(" · ") : app.status === "rejected" ? app.rejection_reason : "";
  return `<div class="app-row"><div><strong>${esc(kindLabel(app.kind))}</strong><small>${esc(fmtDateTime(app.created_at))}${detail ? " · " + esc(detail) : ""}</small></div><span class="state ${esc(app.status)}">${esc(t(app.status))}</span></div>`;
}

function interviewText(app) {
  const dates = app.interview_dates;
  return dates ? [dates.monday, dates.friday].filter(Boolean).join(" / ") : "";
}

function applyBlock(rows) {
  const cooling = rows.filter((app) => app.cooldown_until && new Date(app.cooldown_until) > new Date()).sort((a, b) => String(b.cooldown_until).localeCompare(String(a.cooldown_until)))[0];
  if (cooling) return t(cooling.status === "accepted" ? "cooldownAccepted" : "cooldownRejected", { date: fmtDate(cooling.cooldown_until) });
  const pending = rows.find((app) => app.status === "pending");
  return pending ? t("pendingNotice", { type: kindLabel(pending.kind) }) : "";
}

function renderHubApplications() {
  const panel = $("#hubApplications");
  const notice = $("#hubNotice");
  if (!state.me) { panel.hidden = true; notice.hidden = true; return; }
  hydrate(res.myApps, () => {
    const rows = res.myApps.peek() || [];
    const block = applyBlock(rows);
    notice.hidden = !block;
    notice.lastElementChild.textContent = block;
    panel.hidden = !rows.length;
    $("#hubApplicationList").innerHTML = rows.slice(0, 4).map(appRow).join("");
    renderTracker(rows[0]);
  });
}

// The newest application as a four-step timeline: submitted → review → decision → interview.
function renderTracker(app) {
  const box = $("#hubTracker");
  box.hidden = !app;
  if (!app) return;
  const decided = app.status !== "pending";
  const accepted = app.status === "accepted";
  const steps = [
    ["stepSubmitted", "done", fmtDate(app.created_at), "send"],
    ["stepReview", decided ? "done" : "current", decided ? "" : t("pending"), "eye"],
    ["stepDecision", !decided ? "" : accepted ? "done" : "fail", decided ? `${t(app.status)} · ${fmtDate(app.decided_at)}` : "", accepted || !decided ? "check" : "x"],
    ["stepInterview", accepted ? "current" : "", accepted ? interviewText(app) : "", "clock"]
  ];
  box.innerHTML = `<header class="tracker-head"><h2 class="panel-title">${esc(t("trackerTitle"))} · ${esc(kindLabel(app.kind))}</h2><span class="state ${esc(app.status)}">${esc(t(app.status))}</span></header>
    <ol class="steps">${steps.map(([key, mode, detail, name]) => `<li class="${mode}"><i>${icon(name)}</i><b>${esc(t(key))}</b>${detail ? `<small>${esc(detail)}</small>` : ""}</li>`).join("")}</ol>`;
}

// ---------------------------------------------------------------- news
// Set once the news table turns out not to exist (news.sql not run yet), so the site stops asking for it.
let newsMissing = false;
const noteNewsMissing = (error) => { if (/PGRST205|42P01|404/.test(String(error?.code))) newsMissing = true; };
const NEWS_CATS = ["announcement", "update", "event", "promotion", "alert"];
const newsCat = (value) => t("newsCats")[value] || value;
const excerpt = (text, length) => { const flat = String(text || "").replace(/\s+/g, " ").trim(); return flat.length > length ? flat.slice(0, length).replace(/\s\S*$/, "") + "…" : flat; };
const newsCover = (row, className) => (webUrl(row.image_url) ? `<img class="${className}" src="${esc(webUrl(row.image_url))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : `<span class="${className} news-placeholder"><img src="assets/shield.webp" alt=""></span>`);

const fillNewsCategories = () => { const select = $("#newsCategory"); const value = select.value; select.innerHTML = NEWS_CATS.map((key) => `<option value="${key}">${esc(newsCat(key))}</option>`).join(""); if (value) select.value = value; };

function enterNews() {
  fillNewsCategories();
  const list = $("#newsList");
  if (res.news.peek()) renderNews();
  else list.innerHTML = `<div class="news-grid">${skeletons(3, "wide")}</div>`;
  const openLinked = () => { const id = location.hash.split("/")[2]; if (id) openNews(id); };
  if (res.news.fresh()) return openLinked();
  res.news.load().then(() => { renderNews(); openLinked(); }, (error) => {
    // Before news.sql has run the table does not exist; admins get the setup hint, everyone else an empty state.
    noteNewsMissing(error);
    if (!res.news.peek()) list.innerHTML = empty(newsMissing && can.admin() ? "newsSetup" : "newsEmpty");
  });
}

function renderNews() {
  const rows = res.news.peek();
  if (!rows) return;
  loadNotes().newsSeenAt = now();
  saveNotes();
  updateNewsDot();
  const query = $("#newsSearch").value.trim().toLowerCase();
  const used = NEWS_CATS.filter((key) => rows.some((row) => row.category === key));
  if (state.newsFilter !== "all" && !used.includes(state.newsFilter)) state.newsFilter = "all";
  $("#newsFilters").innerHTML = (used.length > 1 ? ["all", ...used] : []).map((key) => `<button class="chip-btn" type="button" data-act="news-filter" data-id="${key}" aria-selected="${state.newsFilter === key}">${esc(key === "all" ? t("newsAll") : newsCat(key))}</button>`).join("");
  const shown = rows.filter((row) => (state.newsFilter === "all" || row.category === state.newsFilter) && (!query || `${row.title} ${row.body}`.toLowerCase().includes(query)));
  const list = $("#newsList");
  if (!shown.length) { list.innerHTML = empty("newsEmpty"); return; }
  const [lead, ...rest] = shown;
  list.innerHTML = newsCard(lead, true) + (rest.length ? `<div class="news-grid">${rest.map((row) => newsCard(row)).join("")}</div>` : "");
}

function newsCard(row, featured = false) {
  const id = esc(row.id);
  return `<article class="news-card${featured ? " featured" : ""} cat-${esc(row.category)}">
    <button class="news-media" type="button" data-act="news-open" data-id="${id}" aria-label="${esc(row.title)}">${newsCover(row, "news-cover")}</button>
    <div class="news-body">
      <p class="news-meta"><span class="news-tag">${esc(newsCat(row.category))}</span>${row.pinned ? `<span class="news-pin">${icon("bolt")}${esc(t("newsPinnedTag"))}</span>` : ""}<time datetime="${esc(row.created_at)}">${esc(fmtDate(row.created_at))}</time></p>
      <h3 dir="auto"><button type="button" data-act="news-open" data-id="${id}">${esc(row.title)}</button></h3>
      ${row.body ? `<p class="news-excerpt" dir="auto">${esc(excerpt(row.body, featured ? 340 : 150))}</p>` : ""}
      <div class="news-foot"><button class="link-btn" type="button" data-act="news-open" data-id="${id}">${esc(t("newsRead"))} <svg class="i flip"><use href="assets/icons.svg#i-arrow-right"/></svg></button>${can.admin() ? tools("news", row.id) : ""}</div>
    </div>
  </article>`;
}

function renderHubNews() {
  const rows = (res.news.peek() || []).slice(0, 3);
  $("#hubNews").hidden = !rows.length;
  $("#hubNewsList").innerHTML = rows.map((row) => `<button class="news-mini" type="button" data-act="news-open" data-id="${esc(row.id)}">${newsCover(row, "news-mini-cover")}<span><small><b>${esc(newsCat(row.category))}</b> · ${esc(fmtDate(row.created_at))}</small><strong dir="auto">${esc(row.title)}</strong></span></button>`).join("");
  updateNewsDot();
}

function openNews(id) {
  const row = (res.news.peek() || []).find((entry) => entry.id === id);
  if (!row) return;
  const words = String(row.body || "").split(/\s+/).filter(Boolean).length;
  $("#newsCover").innerHTML = webUrl(row.image_url) ? newsCover(row, "") : "";
  $("#newsCover").hidden = !webUrl(row.image_url);
  $("#newsMeta").textContent = [newsCat(row.category), fmtDateTime(row.created_at), t("sopMinutes", { n: Math.max(1, Math.round(words / 200)) })].join(" · ");
  $("#newsHeading").textContent = row.title;
  $("#newsBody").innerHTML = String(row.body || "").split(/\n{2,}/).map((part) => `<p>${esc(part.trim()).replace(/\n/g, "<br>")}</p>`).join("");
  $("#newsFoot").innerHTML = `<button class="btn" type="button" data-act="news-link" data-id="${esc(row.id)}">${icon("link")}<span>${esc(t("newsCopyLink"))}</span></button>` + (can.admin() ? `<button class="btn" type="button" data-act="edit-news" data-id="${esc(row.id)}">${icon("edit")}<span>${esc(t("edit"))}</span></button><button class="btn btn-danger" type="button" data-act="del-news" data-id="${esc(row.id)}">${icon("trash")}<span>${esc(t("remove"))}</span></button>` : "");
  // Opening an article gives it a shareable address; closing it goes back to the list address.
  if (state.route === "news") history.replaceState(null, "", "#/news/" + row.id);
  const dialog = $("#dlgNews");
  dialog.addEventListener("close", () => { if (location.hash.startsWith("#/news/")) history.replaceState(null, "", state.route === "news" ? "#/news" : location.hash); }, { once: true });
  if (!dialog.open) openDialog("dlgNews");
}

function editNews(id) {
  const row = (res.news.peek() || []).find((entry) => entry.id === id);
  if (!row) return;
  closeDialog("dlgNews");
  if (state.route !== "news") location.hash = "#/news";
  const form = $("#newsForm");
  form.reset();
  fillNewsCategories();
  state.editing.news = row.id;
  form.elements.title.value = row.title;
  form.elements.category.value = row.category;
  form.elements.image_url.value = row.image_url || "";
  form.elements.body.value = row.body || "";
  form.elements.pinned.checked = Boolean(row.pinned);
  form.querySelector('[type="submit"] span').textContent = t("newsUpdate");
  setTimeout(() => revealForm(form), 120);
}

async function saveNews(form, button) {
  const data = Object.fromEntries(new FormData(form));
  const id = state.editing.news;
  const existing = id ? (res.news.peek() || []).find((row) => row.id === id) : null;
  const title = String(data.title || "").trim();
  if (!title) return toast(t("fillRequired"), "error");
  await busy(button, async () => {
    const picked = await pickImage(form, 1600);
    const patch = {
      title, body: String(data.body || "").trim(), category: NEWS_CATS.includes(data.category) ? data.category : "announcement",
      image_url: picked?.url || webUrl(data.image_url) || null, pinned: form.elements.pinned.checked, updated_at: now()
    };
    if (existing) await db.update(T.news, id, patch);
    else await db.insert(T.news, { id: uid(), created_at: now(), ...patch });
    form.reset();
    form.closest("details").open = false;
    toast(t(existing ? "saved" : "newsPublished"), "ok");
    const rows = await res.news.load(true);
    loadNotes().news = rows.slice(0, 30).map((row) => row.id); // your own post is not news to you
    saveNotes();
    renderNews();
  });
}

function syncNewsNotes(rows) {
  if (!rows) return;
  loadNotes();
  const known = new Set(notes.news || []);
  if (notes.news) for (const row of rows.slice(0, 10).reverse()) if (!known.has(row.id)) pushNote("news", { title: row.title, cat: row.category }, { href: "#/news/" + row.id, at: row.created_at });
  notes.news = rows.slice(0, 30).map((row) => row.id);
  saveNotes();
  updateNewsDot();
  if (state.route === "hub") renderHubNews();
}

// A dot on the News tab while there is a post newer than the visitor's last look.
function updateNewsDot() {
  const latest = (res.news.peek() || []).reduce((max, row) => (row.created_at > max ? row.created_at : max), "");
  $("#newsDot").hidden = !latest || latest <= (loadNotes().newsSeenAt || "") || Date.now() - new Date(latest) > 14 * 86400000;
}

// ---------------------------------------------------------------- logs
const LOG_PAGE = 80;
const LOG_ICONS = { insert: ["plus", "ok"], update: ["edit", ""], delete: ["trash", "bad"], submit: ["send", ""], accepted: ["check", "ok"], rejected: ["x", "bad"], role: ["user-shield", "warn"], login: ["login", ""], logout: ["logout", ""], sync: ["refresh", "ok"] };
const logParts = (action) => { const [noun = "", verb = ""] = String(action || "").split("."); return { noun, verb }; };
const roleName = (value) => { const key = "role" + String(value).charAt(0).toUpperCase() + String(value).slice(1); const label = t(key); return label === key ? value : label; };

function logTitle(row) {
  const { noun, verb } = logParts(row.action);
  const name = t("logNouns")[noun] || noun;
  const done = t("logVerbs")[verb] || verb;
  if (noun === "auth") return done.charAt(0).toUpperCase() + done.slice(1);
  return getLang() === "ar" ? `${done} ${name}` : `${name} ${done}`;
}

const logDay = (value) => {
  const date = new Date(value);
  const days = Math.round((new Date(new Date().toDateString()) - new Date(date.toDateString())) / 86400000);
  return days === 0 ? t("logToday") : days === 1 ? t("logYesterday") : date.toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};

async function loadLogs(reset) {
  if (!can.admin()) return;
  const list = $("#logList");
  if (reset) {
    state.logs = [];
    list.innerHTML = skeletons(6);
    const filters = t("logFilters");
    $("#logFilters").innerHTML = Object.keys(filters).map((key) => `<button class="chip-btn" type="button" data-act="logs-filter" data-id="${key}" aria-selected="${state.logFilter === key}">${esc(filters[key])}</button>`).join("");
    loadLogStats();
  }
  try {
    const client = await sdk();
    let query = client.from(T.audit).select("id,action,target,event_type,details,source,actor_email,actor_role,created_at")
      .order("created_at", { ascending: false }).range(state.logs.length, state.logs.length + LOG_PAGE - 1);
    if (state.logFilter !== "all") query = query.eq("event_type", state.logFilter);
    const { data } = await run(query);
    state.logs = state.logs.concat(data);
    state.logsMore = data.length === LOG_PAGE;
    renderLogs();
  } catch (error) {
    fail(error);
    if (!state.logs.length) list.innerHTML = empty("logsEmpty");
  }
}

async function loadLogStats() {
  const labels = t("logStats");
  const cards = [["today", "clock"], ["week", "layers"], ["decisions", "check"], ["people", "users"]];
  $("#logStats").innerHTML = cards.map(([key, name]) => `<div class="card metric">${icon(name)}<b id="logStat-${key}">–</b><span>${esc(labels[key])}</span></div>`).join("");
  try {
    const client = await sdk();
    const midnight = new Date(new Date().toDateString()).toISOString();
    const week = new Date(Date.now() - 7 * 86400000).toISOString();
    const count = (filter) => run(filter(client.from(T.audit).select("id", { count: "exact", head: true }))).then((result) => result.count || 0);
    const [today, weekly, decisions, people] = await Promise.all([
      count((query) => query.gte("created_at", midnight)),
      count((query) => query.gte("created_at", week)),
      count((query) => query.gte("created_at", week).in("action", ["application.accepted", "application.rejected"])),
      run(client.from(T.audit).select("actor_email").gte("created_at", week).limit(1000)).then((result) => new Set(result.data.map((row) => row.actor_email).filter(Boolean)).size)
    ]);
    Object.entries({ today, week: weekly, decisions, people }).forEach(([key, value]) => countTo($("#logStat-" + key), value));
  } catch (error) { console.warn(error); }
}

function filteredLogs() {
  const query = $("#logsSearch").value.trim().toLowerCase();
  return state.logs.filter((row) => !query || [row.action, logTitle(row), row.target, row.actor_email, row.actor_role, JSON.stringify(row.details || {})].join(" ").toLowerCase().includes(query));
}

function renderLogs() {
  const rows = filteredLogs();
  $("#logsCount").textContent = t("logsCount", { n: state.logs.length });
  $("#logsMore").hidden = !state.logsMore;
  if (!rows.length) { $("#logList").innerHTML = empty("logsEmpty"); return; }
  let day = "";
  $("#logList").innerHTML = rows.map((row) => {
    const label = logDay(row.created_at);
    const head = label !== day ? `<p class="log-day">${esc(label)}</p>` : "";
    day = label;
    return head + logItem(row);
  }).join("");
}

function logItem(row) {
  const { verb } = logParts(row.action);
  const [name, tone] = LOG_ICONS[verb] || ["info", ""];
  const fields = t("logFields");
  const details = row.details || {};
  const shown = (key, value) => (/_(at|until)$/.test(key) && !Number.isNaN(Date.parse(value)) ? fmtDateTime(value) : typeof value === "object" ? JSON.stringify(value) : String(value));
  const extra = Object.entries(details).filter(([, value]) => value !== "" && value != null);
  const change = row.action === "account.role" && details.previous_role ? `<span class="log-change">${esc(roleName(details.previous_role))} → ${esc(roleName(details.role))}</span>` : "";
  const field = (label, value) => `<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
  return `<details class="log-item">
    <summary>
      <i class="note-icon ${tone}">${icon(name)}</i>
      <span class="log-main"><b>${esc(logTitle(row))}</b>${row.target ? `<span class="log-target" dir="auto">${esc(row.target)}</span>` : ""}${change}</span>
      <span class="log-who"><span>${esc(row.actor_email || t("logSystem"))}</span>${row.actor_role ? `<em class="role-chip">${esc(roleName(row.actor_role))}</em>` : ""}</span>
      <time datetime="${esc(row.created_at)}" title="${esc(fmtDateTime(row.created_at))}">${esc(new Date(row.created_at).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" }))}</time>
      ${icon("chevron")}
    </summary>
    <div class="log-detail">
      <dl class="log-fields">
        ${field(fields.actor, esc(row.actor_email || t("logSystem")))}
        ${field(fields.role, esc(row.actor_role ? roleName(row.actor_role) : "–"))}
        ${field(fields.source, esc([row.source, row.event_type].filter(Boolean).join(" · ") || "–"))}
        ${field(fields.when, esc(`${fmtDateTime(row.created_at)} · ${ago(row.created_at)}`))}
        ${field(fields.id, `<code>${esc(row.id)}</code>`)}
        ${row.target ? field(fields.target, `<span dir="auto">${esc(row.target)}</span>`) : ""}
      </dl>
      ${extra.length ? `<p class="log-sub">${esc(fields.details)} · <code>${esc(row.action)}</code></p><dl class="log-data">${extra.map(([key, value]) => `<div><dt>${esc(key)}</dt><dd dir="auto">${esc(shown(key, value))}</dd></div>`).join("")}</dl>` : ""}
    </div>
  </details>`;
}

function exportLogs() {
  const rows = filteredLogs();
  if (!rows.length) return toast(t("logsEmpty"), "warn");
  const columns = ["created_at", "action", "target", "actor_email", "actor_role", "event_type", "source", "details"];
  const cell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [columns.join(","), ...rows.map((row) => columns.map((key) => cell(key === "details" ? JSON.stringify(row.details || {}) : row[key])).join(","))].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  link.download = `lspd-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

// ---------------------------------------------------------------- notifications
// Built from data the visitor can already read: their applications, their account role and (for
// reviewers) the pending queue. Each account keeps its own list and last-seen snapshot in this browser.
const NOTES_KEY = "lspd-notes-v1:";
const NOTE_LIMIT = 40;
const NOTE_STYLE = { news: ["bell", ""], welcome: ["shield", ""], sop: ["sop", ""], submitted: ["send", ""], accepted: ["check", "ok"], rejected: ["x", "bad"], role: ["user-shield", "warn"], pending: ["inbox", "warn"] };
let notes = null;

function loadNotes() {
  const key = NOTES_KEY + (state.me?.id || "guest");
  if (notes?.key === key) return notes;
  try { notes = { ...JSON.parse(localStorage.getItem(key) || "{}"), key }; } catch (error) { notes = { key }; }
  notes.items ||= [];
  notes.apps ||= {};
  return notes;
}

function saveNotes() {
  try { localStorage.setItem(notes.key, JSON.stringify({ ...notes, key: undefined })); } catch (error) { /* storage blocked: list lasts for this visit */ }
}

function pushNote(kind, vars = {}, { at = now(), href = "", quiet = false } = {}) {
  loadNotes().items.unshift({ id: uid(), kind, vars, at, href, read: false });
  notes.items.length = Math.min(notes.items.length, NOTE_LIMIT);
  saveNotes();
  renderNotes();
  if (!quiet) { toast(noteText(notes.items[0]).title, NOTE_STYLE[kind]?.[1] === "bad" ? "error" : "ok"); play("success"); }
}

function noteText(note) {
  const vars = { ...note.vars, cat: note.vars.cat ? t("newsCats")[note.vars.cat] || note.vars.cat : "", type: note.vars.kind ? kindLabel(note.vars.kind) : "", role: note.vars.role ? roleLabel(note.vars.role) : "", from: note.vars.from ? roleLabel(note.vars.from) : "" };
  const keys = { news: "noteNews", welcome: "noteWelcome", sop: "noteSop", submitted: "noteSubmitted", accepted: "noteAccepted", rejected: "noteRejected", role: "noteRole", pending: "notePending" };
  const key = keys[note.kind] || "noteWelcome";
  return { title: t(key, vars), text: note.vars.detail || t(key + "Text", vars) };
}

const ago = (value) => {
  const seconds = Math.round((new Date(value) - Date.now()) / 1000);
  if (seconds > -45) return t("justNow");
  const units = [["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  const [unit, size] = units.find(([, length]) => -seconds >= length);
  return new Intl.RelativeTimeFormat(getLang(), { numeric: "auto" }).format(Math.round(seconds / size), unit);
};

function renderNotes() {
  const list = loadNotes().items;
  const unread = list.filter((note) => !note.read).length;
  const badge = $("#notesCount");
  badge.hidden = !unread;
  badge.textContent = unread > 9 ? "9+" : String(unread);
  $("#notesBtn").classList.toggle("has-unread", unread > 0);
  $("#notesList").innerHTML = list.length ? list.map((note) => {
    const [name, tone] = NOTE_STYLE[note.kind] || ["info", ""];
    const { title, text } = noteText(note);
    return `<button class="note${note.read ? "" : " unread"}" type="button" data-act="note-open" data-id="${esc(note.id)}"><i class="note-icon ${tone}">${icon(name)}</i><span><b>${esc(title)}</b><small>${esc(text)}</small><time>${esc(ago(note.at))}</time></span></button>`;
  }).join("") : `<p class="notes-empty">${icon("check")}<span>${esc(t("notesEmpty"))}</span></p>`;
}

// Compares fresh data with the last snapshot. The first run only records it, apart from decisions from the last two weeks.
function syncNotes(apps) {
  loadNotes();
  const first = !notes.seeded;
  const recent = (value) => value && Date.now() - new Date(value) < 14 * 86400000;
  for (const app of apps || []) {
    const before = notes.apps[app.id];
    const decided = app.status === "accepted" || app.status === "rejected";
    const detail = app.status === "accepted" ? [app.decision_message, interviewText(app)].filter(Boolean).join(" · ") : app.rejection_reason || "";
    if (before === undefined && !first) pushNote(decided ? app.status : "submitted", { kind: app.kind, detail: decided ? detail : "" }, { at: app.decided_at || app.created_at, quiet: !decided });
    else if (decided && (before ? before !== app.status : first && recent(app.decided_at))) pushNote(app.status, { kind: app.kind, detail }, { at: app.decided_at || now(), quiet: first });
    notes.apps[app.id] = app.status;
  }
  if (state.me) {
    if (notes.role && notes.role !== state.me.role) pushNote("role", { role: state.me.role, from: notes.role }, { href: can.review() ? "#/review" : "" });
    notes.role = state.me.role;
  }
  if (first) {
    pushNote("sop", {}, { href: "#/sop", quiet: true });
    pushNote("welcome", {}, { href: "#/regulations", quiet: true });
    notes.seeded = true;
  }
  saveNotes();
  renderNotes();
}

function syncPendingNote(count) {
  loadNotes();
  if (notes.pending != null && count > notes.pending) pushNote("pending", { n: count - notes.pending }, { href: "#/review" });
  notes.pending = count;
  saveNotes();
}

// Re-reads the role and the visitor's applications; runs on sign-in, every minute and when the tab comes back.
async function checkNotes() {
  if (!state.authReady) return;
  if (!newsMissing) res.news.load(true).then(syncNewsNotes, noteNewsMissing);
  if (!state.me) return syncNotes([]);
  try {
    const client = await sdk();
    const { data } = await client.from(T.accounts).select("role").eq("auth_user_id", state.me.id).maybeSingle();
    const fresh = ["owner", "admin", "fto", "media", "ia"].includes(data?.role) ? data.role : data ? "applicant" : state.me.role;
    if (fresh !== state.me.role) { setMe({ ...state.me, role: fresh }); renderIdentity(); if (can.review()) refreshReviewBadge(); }
    const apps = await res.myApps.load(true);
    syncNotes(apps);
    if (state.route === "hub") renderHubApplications();
  } catch (error) { console.warn(error); }
}

// ---------------------------------------------------------------- popovers
function closePops(except) {
  for (const pop of $$(".popover")) {
    if (pop.id === except) continue;
    pop.hidden = true;
    $(`[data-id="${pop.id}"]`)?.setAttribute("aria-expanded", "false");
  }
}

function togglePop(button) {
  const pop = $("#" + button.dataset.id);
  closePops(pop.id);
  pop.hidden = !pop.hidden;
  button.setAttribute("aria-expanded", String(!pop.hidden));
  if (!pop.hidden && pop.id === "notesPop") renderNotes();
}

// ---------------------------------------------------------------- command palette
let paletteItems = [];
let paletteIndex = 0;

async function openPalette() {
  closePops();
  const input = $("#paletteInput");
  input.value = "";
  openDialog("dlgPalette");
  input.focus();
  renderPalette();
  // Chapters and regulations load on first use, then the list repaints with them.
  const loads = [];
  if (!sop) loads.push(loadSop());
  if (!builtinRegs) loads.push(import("../data/regulations.js").then((module) => { builtinRegs = module.default; }));
  if (loads.length) { await Promise.allSettled(loads); if ($("#dlgPalette").open) renderPalette(); }
}

function paletteSource() {
  const lang = getLang();
  const items = $$(".tab[data-tab]").filter((tab) => !tab.hidden).map((tab) => ({ group: "palettePages", label: tab.textContent.trim(), run: () => { location.hash = tab.getAttribute("href"); } }));
  items.push(
    { group: "paletteActions", label: t("recruitment"), run: () => startApply("recruitment") },
    { group: "paletteActions", label: t("transfer"), run: () => startApply("transfer") },
    { group: "paletteActions", label: t("notifications"), run: () => togglePop($("#notesBtn")) },
    { group: "paletteActions", label: t("settings"), run: openSettings },
    { group: "paletteActions", label: t("actLang"), run: () => { $("#lang").value = lang === "ar" ? "en" : "ar"; $("#lang").dispatchEvent(new Event("change")); } },
    { group: "paletteActions", label: t("connect"), run: () => { location.href = CONFIG.brand.connectUrl; } }
  );
  if (state.me) items.push({ group: "paletteActions", label: t("account"), run: openAccount });
  for (const chapter of sop || []) {
    items.push({ group: "paletteSop", label: chapter.title[lang], meta: chapter.title[lang === "ar" ? "en" : "ar"], run: () => { location.hash = "#/sop/" + chapter.id; } });
    for (const section of chapter.sections) items.push({ group: "paletteSop", label: sopLabel(section.text), meta: chapter.title[lang], deep: true, run: () => { location.hash = "#/sop/" + chapter.id; setTimeout(() => document.getElementById(`sop-${chapter.id}-${section.n}`)?.scrollIntoView({ behavior: "smooth" }), 350); } });
  }
  for (const reg of allRegs()) items.push({ group: "paletteRegs", label: reg.title, meta: reg.id, deep: true, run: () => { location.hash = "#/regulations"; setTimeout(() => { $("#regSearch").value = reg.id || reg.title; renderRegs(); }, 250); } });
  return items;
}

function renderPalette() {
  const query = $("#paletteInput").value.trim();
  const re = sopPattern(query);
  const all = paletteSource();
  // With no query, show pages, actions and chapters; sections and regulations appear once you type.
  paletteItems = (re ? all.filter((item) => `${item.label} ${item.meta || ""}`.search(re) >= 0) : all.filter((item) => !item.deep)).slice(0, 40);
  // Titles rarely hold the word you want, so a query can always go to the handbook's full-text search.
  if (re) paletteItems.push({ group: "paletteActions", label: `${t("sopSearch")}: “${query}”`, run: () => { $("#sopSearch").value = query; state.sopResults = true; location.hash = "#/sop"; if (state.route === "sop") renderSop(); } });
  paletteIndex = Math.min(paletteIndex, Math.max(0, paletteItems.length - 1));
  let group = "";
  $("#paletteList").innerHTML = paletteItems.length ? paletteItems.map((item, index) => {
    const head = item.group !== group ? `<p class="palette-group">${esc(t(item.group))}</p>` : "";
    group = item.group;
    return `${head}<button class="palette-item" type="button" role="option" data-act="palette-run" data-id="${index}" aria-selected="${index === paletteIndex}"><span dir="auto">${sopMark(item.label, re)}</span>${item.meta ? `<small dir="auto">${esc(item.meta)}</small>` : ""}</button>`;
  }).join("") : `<p class="notes-empty">${esc(t("paletteEmpty"))}</p>`;
}

function runPalette(index) {
  const item = paletteItems[index];
  if (!item) return;
  closeDialog("dlgPalette");
  item.run();
}

// ---------------------------------------------------------------- ambient: hero rail, clock
function startAmbient() {
  let step = 2;
  const tick = () => {
    for (const list of [$("#heroRail"), $("#heroSteps")]) [...list.children].forEach((item, index) => item.classList.toggle("on", index === step));
    step = (step + 1) % 3;
  };
  tick();
  setInterval(() => { if (state.route === "hub" && !document.hidden) tick(); }, 3200);
  // Los Santos runs on Pacific time.
  const clock = $("#clock");
  const format = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "America/Los_Angeles" });
  const paint = () => { clock.textContent = format.format(new Date()); };
  paint();
  setInterval(paint, 15000);
}

// ---------------------------------------------------------------- regulations
let builtinRegs = null;

async function enterRegulations() {
  if (!builtinRegs) {
    $("#regList").innerHTML = skeletons(6);
    try { builtinRegs = (await import("../data/regulations.js")).default; } catch (error) { return fail({ code: "offline" }); }
  }
  hydrate(res.regs, renderRegs);
  if (res.regs.peek() === undefined) renderRegs();
}

function allRegs() {
  const custom = (res.regs.peek() || []).map((row) => ({ degree: Number(row.degree), id: row.regulation_code || "IA-" + String(row.id).slice(0, 4), title: row.title, desc: row.description, custom: row.id }));
  return [...(builtinRegs || []), ...custom].sort((a, b) => DEGREE_ORDER.indexOf(a.degree) - DEGREE_ORDER.indexOf(b.degree));
}

function renderRegs() {
  if (!builtinRegs) return;
  const all = allRegs();
  const query = $("#regSearch").value.trim().toLowerCase();
  const filters = [["all", t("regAll"), all.length], ...DEGREE_ORDER.map((degree) => [String(degree), degree === 0 ? t("regCritical") : t("regDegree", { n: degree }), all.filter((reg) => reg.degree === degree).length])];
  $("#regFilters").innerHTML = filters.map(([key, label, count]) => `<button class="side-item" type="button" data-act="reg-filter" data-id="${key}" aria-pressed="${state.regFilter === key}" style="--deg:${DEGREE_COLORS[key] || "var(--blue)"}"><span>${esc(label)}</span><b>${count}</b></button>`).join("");

  const rows = all.filter((reg) => (state.regFilter === "all" || String(reg.degree) === state.regFilter) && (!query || (reg.id + " " + reg.title + " " + reg.desc).toLowerCase().includes(query)));
  $("#regHeading").textContent = state.regFilter === "all" ? t("regTitle") : state.regFilter === "0" ? t("regCritical") : t("regDegree", { n: state.regFilter });
  $("#regCount").textContent = t("regCount", { n: rows.length });
  const editable = can.regs();
  $("#regList").className = "stack stagger";
  $("#regList").innerHTML = rows.length ? rows.map((reg, index) => `
    <details class="reg" dir="rtl" lang="ar" style="--deg:${DEGREE_COLORS[reg.degree] || "var(--blue)"};--i:${Math.min(index, 14)}">
      <summary><span class="reg-code">#${esc(reg.id)}</span><span class="reg-title">${esc(reg.title)}</span>${icon("chevron")}</summary>
      <div class="reg-body">${esc(reg.desc)}${reg.custom && editable ? tools("reg", reg.custom) : ""}</div>
    </details>`).join("") : empty("regEmpty");
}

async function saveRegulation(form, button) {
  const data = Object.fromEntries(new FormData(form));
  const patch = { degree: Number(data.degree), regulation_code: data.regulation_code.trim(), title: data.title.trim(), description: data.description.trim(), updated_at: now() };
  if (!patch.title || !patch.description) return toast(t("fillRequired"), "error");
  await busy(button, async () => {
    const id = state.editing.reg;
    if (id) await db.update(T.regulations, id, patch);
    else await db.insert(T.regulations, { id: uid(), created_by: state.me.email, created_at: now(), ...patch });
    form.reset();
    toast(t("saved"), "ok");
    await res.regs.load(true);
    renderRegs();
  });
}

// ---------------------------------------------------------------- SOP
// data/sop.js holds each chapter as light line markup (described at the top of that file).
// Chapters are parsed once into blocks; the outline, search and reader all work from those blocks.
let sop = null;
const SOP_ORDINAL = /^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سابعاً|ثامناً|تاسعاً|عاشراً|السابع)\s*:\s*/;
const SOP_LATIN = /\s*\(([A-Za-z][^()]*)\)\s*:?$/;
const SOP_FOLD = { "ا": "اأإآ", "أ": "اأإآ", "إ": "اأإآ", "آ": "اأإآ", "ي": "يى", "ى": "يى", "ة": "ةه", "ه": "ةه" };
const pad2 = (value) => String(value).padStart(2, "0");
const sopLabel = (text) => text.replace(SOP_ORDINAL, "").replace(SOP_LATIN, "");

async function loadSop() {
  sop ||= (await import("../data/sop.js")).default.map((chapter) => {
    const blocks = parseSop(chapter.body);
    const words = blocks.reduce((sum, block) => sum + block.search.split(/\s+/).length, 0);
    return { ...chapter, blocks, sections: blocks.filter((block) => block.type === "h2"), questions: blocks.filter((block) => block.type === "qa").length, minutes: Math.max(1, Math.round(words / 160)) };
  });
  return sop;
}

async function enterSop() {
  if (!sop) {
    $("#sopDoc").innerHTML = skeletons(8);
    try { await loadSop(); } catch (error) { return fail({ code: "offline" }); }
  }
  const id = location.hash.split("/")[2];
  if (sop.some((chapter) => chapter.id === id)) state.sopChapter = id;
  renderSop();
}

function parseSop(body) {
  const blocks = [];
  const count = { h2: 0, qa: 0 };
  let open = null;
  const add = (block) => { if (block.type in count) block.n = ++count[block.type]; blocks.push(block); return block; };
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) { open = null; continue; }
    const [, tag = "", rest = line] = line.match(/^(###|##|=|>|!|Q:|A:|A-)\s*(.*)$/) || [];
    if (tag === "##" || tag === "###") { open = null; add({ type: tag === "##" ? "h2" : "h3", text: rest }); }
    else if (tag === "=") open = add({ type: "card", text: rest, items: [] });
    else if (tag === ">" || tag === "!") { open = null; add({ type: tag === ">" ? "note" : "warn", text: rest }); }
    else if (tag === "Q:") open = add({ type: "qa", text: rest, answer: "", items: [] });
    else if (tag === "A:" && open?.type === "qa") open.answer = rest;
    else if (tag === "A-" && open?.type === "qa") open.items.push(rest);
    else if (line.startsWith("|")) {
      const cells = line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
      if (open?.type === "table") open.rows.push(cells); else open = add({ type: "table", rows: [cells] });
    }
    else if (open?.type === "card") open.items.push(line);
    else if (/:$/.test(line)) open = add({ type: "list", text: line, items: [] });
    else if (open?.type === "list") open.items.push(line);
    else add({ type: /^["“«].*["”»]$/.test(line) ? "quote" : "p", text: line });
  }
  for (const block of blocks) block.search = [block.text, block.answer, ...(block.items || []), ...(block.rows || []).flat()].filter(Boolean).join(" ");
  return blocks;
}

// Arabic-aware pattern: hamza forms and taa marbuta match their plain letters, diacritics are skipped.
function sopPattern(query) {
  const chars = [...query.trim().replace(/\s+/g, " ").replace(/[ً-ْـ]/g, "")].slice(0, 60);
  if (chars.length < 2) return null;
  const source = chars.map((char) => (char === " " ? "\\s+" : SOP_FOLD[char] ? `[${SOP_FOLD[char]}]` : char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).join("[\\u064B-\\u0652\\u0640]*");
  return new RegExp(`(${source})`, "gi");
}

const sopMark = (text, re) => (re ? text.split(re).map((part, index) => (index % 2 ? `<mark>${esc(part)}</mark>` : esc(part))).join("") : esc(text));

// "Term: explanation" lines get the term highlighted (only when the colon is not inside brackets).
function sopText(text, re) {
  const term = text.match(/^([^:]{2,70}):\s+(.+)$/);
  if (term && term[1].split("(").length === term[1].split(")").length) return `<b class="term">${sopMark(term[1], re)}</b> ${sopMark(term[2], re)}`;
  return sopMark(text, re);
}

function sopHeading(text, re) {
  const latin = text.match(SOP_LATIN);
  const main = latin ? text.slice(0, latin.index) : text.replace(/:$/, "");
  return sopMark(main, re) + (latin ? ` <small dir="ltr">${sopMark(latin[1], re)}</small>` : "");
}

const sopItems = (items, re) => (items.length ? `<ul class="sop-list">${items.map((item) => `<li>${sopText(item, re)}</li>`).join("")}</ul>` : "");

function sopBlock(block, index, re, chapter) {
  const at = `data-b="${index}"`;
  switch (block.type) {
    case "h2": {
      const ordinal = block.text.match(SOP_ORDINAL);
      return `<h2 class="sop-h2" id="sop-${chapter.id}-${block.n}" ${at}><span class="sop-n">${pad2(block.n)}</span><span>${ordinal ? `<em>${esc(ordinal[1])}</em>` : ""}${sopHeading(block.text.replace(SOP_ORDINAL, ""), re)}</span></h2>`;
    }
    case "h3": {
      const number = block.text.match(/^(\d+(?:\.\d+)?)\.?\s*/);
      return `<h3 class="sop-h3" ${at}>${number ? `<span class="sop-n">${number[1]}</span>` : ""}<span>${sopHeading(block.text.slice(number ? number[0].length : 0), re)}</span></h3>`;
    }
    case "card":
      return `<article class="sop-card" ${at}><h4 dir="auto">${sopMark(block.text, re)}</h4>${block.items.length > 1 ? sopItems(block.items, re) : block.items.map((item) => `<p>${sopText(item, re)}</p>`).join("")}</article>`;
    case "list":
      return `<div class="sop-group" ${at}><p class="lead-in">${sopText(block.text, re)}</p>${sopItems(block.items, re)}</div>`;
    case "table": {
      const [head, ...rows] = block.rows;
      return `<div class="sop-table" ${at}><table><thead><tr>${head.map((cell) => `<th>${sopMark(cell, re)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${sopMark(cell, re)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    case "note":
    case "warn":
      return `<div class="callout ${block.type}" ${at}>${icon(block.type === "note" ? "info" : "warn")}<p>${sopText(block.text, re)}</p></div>`;
    case "quote":
      return `<blockquote ${at}>${sopMark(block.text, re)}</blockquote>`;
    case "qa": {
      // A one-line answer reads as a paragraph; an answer with items becomes a list (its first line too, unless it introduces them).
      const leads = block.answer && (!block.items.length || /:$/.test(block.answer));
      const items = leads ? block.items : [block.answer, ...block.items].filter(Boolean);
      const open = re && block.search.search(re) >= 0 ? " open" : "";
      return `<details class="sop-qa" ${at}${open}><summary><span class="sop-n">${pad2(block.n)}</span><span class="qa-q">${sopMark(block.text, re)}</span>${icon("chevron")}</summary><div class="qa-a">${leads ? `<p>${sopText(block.answer, re)}</p>` : ""}${sopItems(items, re)}</div></details>`;
    }
    default:
      return `<p ${at}>${sopText(block.text, re)}</p>`;
  }
}

function renderSop() {
  if (!sop) return;
  const query = $("#sopSearch").value.trim();
  const re = sopPattern(query);
  if (!re) state.sopResults = false;
  const hits = [];
  if (re) for (const chapter of sop) chapter.blocks.forEach((block, index) => { if (block.search.search(re) >= 0) hits.push({ chapter, block, index }); });
  const counts = re ? Object.fromEntries(sop.map((chapter) => [chapter.id, hits.filter((hit) => hit.chapter === chapter).length])) : null;
  if (!sop.some((chapter) => chapter.id === state.sopChapter)) state.sopChapter = sop[0].id;

  const lang = getLang();
  $("#sopChapters").innerHTML = sop.map((chapter, index) => {
    const active = chapter.id === state.sopChapter && !state.sopResults;
    const toc = active && chapter.sections.length > 1
      ? `<ol class="sop-toc">${chapter.sections.map((section) => `<li><button type="button" data-act="sop-jump" data-id="sop-${chapter.id}-${section.n}">${esc(sopLabel(section.text))}</button></li>`).join("")}</ol>`
      : "";
    return `<div class="sop-nav-item${counts && !counts[chapter.id] ? " is-dim" : ""}"><button class="side-item" type="button" data-act="sop-chapter" data-id="${chapter.id}" aria-pressed="${active}"><span><i>${pad2(index + 1)}</i>${esc(chapter.title[lang])}</span>${counts?.[chapter.id] ? `<b>${counts[chapter.id]}</b>` : ""}</button>${toc}</div>`;
  }).join("");

  const results = $("#sopResults");
  results.hidden = !state.sopResults;
  $("#sopDoc").hidden = $("#sopPager").hidden = state.sopResults;
  $("#sopBar").hidden = !re || state.sopResults;
  if (state.sopResults) {
    const shown = hits.slice(0, 60);
    results.innerHTML = `<p class="sop-count">${esc(t("sopResults", { n: hits.length, q: query }))}</p>` + (hits.length ? shown.map(({ chapter, block, index }) => {
      const at = Math.max(0, block.search.search(re) - 70);
      const section = chapter.blocks.slice(0, index + 1).reverse().find((entry) => entry.type === "h2");
      return `<button class="sop-hit" type="button" data-act="sop-hit" data-id="${chapter.id}" data-block="${index}"><small>${esc(chapter.title[lang])}${section ? ` · <span lang="ar">${esc(sopLabel(section.text))}</span>` : ""}</small><span lang="ar" dir="rtl">${at ? "… " : ""}${sopMark(block.search.slice(at, at + 240), re)}${block.search.length > at + 240 ? " …" : ""}</span></button>`;
    }).join("") + (hits.length > shown.length ? `<p class="hint center">${esc(t("sopMore", { n: hits.length - shown.length }))}</p>` : "") : empty("sopEmpty"));
    sopProgress();
    return;
  }

  $("#sopBar").innerHTML = re ? `<button class="chip-btn" type="button" data-act="sop-results"><svg class="i flip"><use href="assets/icons.svg#i-arrow-left"/></svg><span>${esc(t("sopAllResults"))} · ${hits.length}</span></button><button class="chip-btn" type="button" data-act="sop-clear">${icon("x")}<span>${esc(t("sopClear"))}</span></button>` : "";
  const index = sop.findIndex((chapter) => chapter.id === state.sopChapter);
  const chapter = sop[index];
  const meta = [icon("layers") + esc(t("sopSections", { n: chapter.sections.length })), icon("clock") + esc(t("sopMinutes", { n: chapter.minutes }))];
  if (chapter.questions) meta.push(icon("info") + esc(t("sopQuestions", { n: chapter.questions })));
  let body = "";
  let inCards = false;
  chapter.blocks.forEach((block, position) => {
    const card = block.type === "card";
    if (card !== inCards) { body += card ? `<div class="sop-cards">` : "</div>"; inCards = card; }
    body += sopBlock(block, position, re, chapter);
  });
  if (inCards) body += "</div>";
  $("#sopDoc").innerHTML = `<header class="sop-hero">
      <p class="kicker" lang="${lang}" dir="auto">${esc(t("sopChapter", { n: pad2(index + 1), total: pad2(sop.length) }))}</p>
      <h1>${esc(chapter.title.ar)}</h1>
      <p class="sop-en" dir="ltr">${esc(chapter.title.en)}</p>
      <div class="sop-meta" lang="${lang}">${meta.map((item) => `<span dir="auto">${item}</span>`).join("")}${chapter.questions ? `<button class="chip-btn" type="button" data-act="sop-answers" aria-pressed="false">${icon("eye")}<span>${esc(t("sopShowAnswers"))}</span></button>` : ""}</div>
    </header>${body}`;
  $("#sopPager").innerHTML = [sop[index - 1], sop[index + 1]].map((entry, next) => (entry
    ? `<button class="sop-page${next ? " next" : ""}" type="button" data-act="sop-chapter" data-id="${entry.id}"><small><svg class="i flip"><use href="assets/icons.svg#i-arrow-${next ? "right" : "left"}"/></svg>${esc(t(next ? "sopNext" : "sopPrev"))}</small><strong>${esc(entry.title[lang])}</strong></button>`
    : "<span></span>")).join("");
  sopProgress();
}

function openSopChapter(id, block) {
  state.sopChapter = id;
  state.sopResults = false;
  history.replaceState(null, "", "#/sop/" + id);
  renderSop();
  const target = block == null ? null : $(`#sopDoc [data-b="${block}"]`);
  if (target) {
    if (target.tagName === "DETAILS") target.open = true;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.remove("flash");
    void target.offsetWidth;
    target.classList.add("flash");
    return;
  }
  const top = $("#view-sop").getBoundingClientRect().top + scrollY - 12;
  if (scrollY > top) scrollTo({ top, behavior: "smooth" });
}

// Runs on scroll: fills the reading bar and marks the outline entry for the section being read.
function sopProgress() {
  if (state.route !== "sop") return;
  const doc = $("#sopDoc");
  const box = doc.getBoundingClientRect();
  const value = doc.hidden ? 0 : Math.min(1, Math.max(0, (innerHeight * 0.35 - box.top) / Math.max(1, box.height - innerHeight * 0.4)));
  $("#sopProgress").style.transform = `scaleX(${value})`;
  const current = $$("#sopDoc .sop-h2").filter((heading) => heading.getBoundingClientRect().top < innerHeight * 0.3).pop();
  for (const link of $$("#sopChapters [data-act='sop-jump']")) link.toggleAttribute("aria-current", link.dataset.id === current?.id);
}

// ---------------------------------------------------------------- roster
const rankIndex = (rank) => { const index = ranks.indexOf(rank); return index < 0 ? 99 : index; };

function enterRoster() {
  const body = $("#rosterBody");
  if (res.roster.peek() === undefined) body.innerHTML = `<tr><td colspan="13">${skeletons(4)}</td></tr>`;
  hydrate(res.roster, renderRoster, body);
  hydrate(res.insignia, renderRoster);
}

function renderRoster() {
  const rows = (res.roster.peek() || []).slice().sort((a, b) => rankIndex(a.rank) - rankIndex(b.rank) || (Number(a.badge_number) || 0) - (Number(b.badge_number) || 0) || String(a.name).localeCompare(String(b.name)));
  const insignia = res.insignia.peek() || {};
  const editable = can.roster();
  $("#rosterCount").textContent = String(rows.length);
  if (!rows.length) { $("#rosterBody").innerHTML = `<tr><td colspan="13" class="empty">${esc(t("rosterEmpty"))}</td></tr>`; return; }
  const cell = (value) => `<td>${esc(value || "–")}</td>`;
  // One "Points / Privilege" column, like the merged cell in the schedule sheet: the points number,
  // or the privilege number for rows that only have that. Blank-looking filler characters count as empty.
  const pointsCell = (row) => {
    const [points, privilege] = [row.points, row.privilege_points].map((value) => String(value ?? "").replace(/[\sㅤ​]/g, ""));
    const value = /\d/.test(points) ? points : /\d/.test(privilege) ? privilege : "";
    return `<td class="points">${value ? `<b>${esc(value)}</b>` : "–"}</td>`;
  };
  const line = (row) => `<tr>
    ${cell(row.badge_number)}<td class="name">${esc(row.name)}</td>
    <td>${insignia[row.id] ? `<img class="insignia" src="${esc(imageUrl(insignia[row.id]))}" alt="" loading="lazy" decoding="async">` : "–"}</td>
    ${cell(row.rank)}${cell(row.department)}${cell(row.admin_rank)}
    <td><span class="state ${esc(String(row.status || "").toLowerCase())}">${esc(row.status || "–")}</span></td>
    ${cell(row.punishment)}${cell(row.last_promotion)}${cell(row.discord_user)}${pointsCell(row)}
    <td>${wings.filter(([key]) => row.wings?.[key]).map(([, label]) => `<span class="wing" title="${esc(label)}">${esc(label.slice(0, 3).toUpperCase())}</span>`).join("") || "–"}</td>
    <td>${editable ? `<div class="row-tools"><button class="icon-btn" type="button" data-act="edit-roster" data-id="${esc(row.id)}" title="${esc(t("edit"))}">${icon("edit")}</button><button class="icon-btn danger" type="button" data-act="del-roster" data-id="${esc(row.id)}" title="${esc(t("remove"))}">${icon("trash")}</button></div>` : ""}</td></tr>`;
  const used = new Set();
  let html = "";
  for (const [title, sectionRanks] of rosterSections) {
    const group = rows.filter((row) => sectionRanks.includes(row.rank));
    if (!group.length) continue;
    if (title) html += `<tr class="section"><td colspan="13">// ${esc(title)}</td></tr>`;
    for (const row of group) { used.add(row.id); html += line(row); }
  }
  html += rows.filter((row) => !used.has(row.id)).map(line).join("");
  $("#rosterBody").innerHTML = html;
}

async function saveRoster(form, button) {
  const data = Object.fromEntries(new FormData(form));
  const text = (key) => String(data[key] || "").trim();
  const patch = {
    badge_number: text("badge_number"), name: text("name"), rank: text("rank"), department: text("department"), admin_rank: text("admin_rank"),
    status: text("status") || "ACTIVE", punishment: text("punishment"), last_promotion: text("last_promotion"), discord_user: text("discord_user"),
    points: text("points"), privilege_points: text("privilege_points"),
    wings: Object.fromEntries(wings.map(([key]) => [key, Boolean(form.elements["wing_" + key].checked)])),
    updated_at: now()
  };
  if (!patch.badge_number || !patch.name) return toast(t("fillRequired"), "error");
  await busy(button, async () => {
    const picked = await pickImage(form, 160);
    const typed = webUrl(text("insignia_url"));
    if (picked) patch.insignia_url = picked.url; else if (typed || !state.editing.roster) patch.insignia_url = typed;
    const id = state.editing.roster;
    if (id) await db.update(T.schedule, id, patch);
    else await db.insert(T.schedule, { id: uid(), created_by: state.me.email, created_at: now(), ...patch });
    form.reset();
    toast(t("saved"), "ok");
    res.insignia.stale();
    await res.roster.load(true);
    renderRoster();
    hydrate(res.insignia, renderRoster);
  });
}

/** Returns the uploaded file from a form's `file` input, or null when none was chosen. */
async function pickImage(form, maxSide) {
  const file = form.elements.file?.files?.[0];
  if (!file) return null;
  if (!isUploadable(file)) throw Object.assign(new Error(t("fileType")), { code: "P0001" });
  return upload(await compressFile(file, maxSide), file.name);
}

// ---------------------------------------------------------------- crew + media
function renderChief() {
  const chief = CONFIG.chief;
  $("#chief").innerHTML = `
    <div class="chief-ghost" aria-hidden="true">${esc(chief.firstName)}<br>${esc(chief.lastName)}</div>
    <div class="chief-copy">
      <p class="kicker">${esc(chief.rank)}</p>
      <h2>${esc(chief.firstName)} ${esc(chief.lastName)}</h2>
      <p>${esc(chief.intro)}</p>
      <dl class="chief-facts">${(chief.details || []).map((item) => `<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`).join("")}</dl>
    </div>
    <img class="chief-portrait" src="${esc(CONFIG.assets.chiefPortrait)}" width="576" height="880" alt="${esc(chief.firstName + " " + chief.lastName)}" loading="lazy" decoding="async">`;
}

function renderCredits() {
  $("#creditGrid").className = "grid grid-3 stagger";
  $("#creditGrid").innerHTML = (CONFIG.credits || []).map((credit, index) => `<article class="card credit lift" style="--i:${index}">${icon(credit.icon || "star")}<h3>${esc(credit.name)}</h3><p>${esc(credit.role)}</p></article>`).join("");
}

const assetsOf = (category) => (res.assets.peek() || []).filter((asset) => asset.category === category);

function enterCrew() {
  const grid = $("#crewGrid");
  if (res.assets.peek() === undefined) grid.innerHTML = skeletons(6, "tall");
  hydrate(res.assets, renderCrew, grid);
}

function renderCrew() {
  const rows = assetsOf("crew");
  const editable = can.crew();
  const grid = $("#crewGrid");
  grid.className = "grid grid-cards stagger";
  grid.innerHTML = rows.length ? rows.map((member, index) => `
    <article class="card person lift" data-id="${esc(member.id)}" style="--i:${Math.min(index, 14)}" ${editable ? 'draggable="true"' : ""}>
      ${editable ? `<span class="drag-handle" title="${esc(t("dragHint"))}">${icon("grip")}</span>` : ""}
      <img class="person-photo" src="${esc(imageUrl(member.photo_url))}" alt="${esc(member.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" draggable="false">
      <div class="person-body"><h3>${esc(member.title)}</h3><p>${esc(member.subtitle)}</p>${member.discord_id ? `<small>${esc(member.discord_id)}</small>` : ""}${editable ? tools("asset", member.id) : ""}</div>
    </article>`).join("") : empty("crewEmpty");
}

function enterMedia() {
  const grid = $("#mediaGrid");
  if (res.assets.peek() === undefined) grid.innerHTML = skeletons(3, "wide");
  hydrate(res.assets, renderMedia, grid);
  hydrate(res.reactions, renderMedia);
}

function renderMedia() {
  const rows = assetsOf("media");
  const editable = can.mediaEdit();
  const counts = res.reactions.peek() || {};
  const grid = $("#mediaGrid");
  grid.className = "grid grid-media stagger";
  grid.innerHTML = rows.length ? rows.map((post, index) => {
    const source = imageUrl(post.photo_url);
    const video = post.media_type === "video" || /\.mp4(\?|#|$)/i.test(source);
    const media = video
      ? `<video class="post-media" src="${esc(source)}" controls muted playsinline preload="metadata"></video>`
      : `<img class="post-media" src="${esc(source)}" alt="${esc(post.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-act="zoom" draggable="false">`;
    const reacts = reactions.map((emoji) => {
      const entry = counts[post.id]?.[emoji] || { n: 0, mine: false };
      return `<button class="react${entry.mine ? " on" : ""}" type="button" data-act="react" data-id="${esc(post.id)}" data-emoji="${emoji}" aria-pressed="${entry.mine}"><span>${emoji}</span><b>${entry.n}</b></button>`;
    }).join("");
    return `<article class="card post" data-id="${esc(post.id)}" style="--i:${Math.min(index, 10)}" ${editable ? 'draggable="true"' : ""}>
      ${editable ? `<span class="drag-handle" title="${esc(t("dragHint"))}">${icon("grip")}</span>` : ""}${media}
      <div class="post-body"><h3>${esc(post.title)}</h3>${post.caption ? `<p>${esc(post.caption)}</p>` : ""}<div class="reacts">${reacts}</div>${editable ? tools("asset", post.id) : ""}</div>
    </article>`;
  }).join("") : empty("mediaEmpty");
}

async function saveAsset(form, button, category) {
  const data = Object.fromEntries(new FormData(form));
  const id = state.editing[category];
  const existing = id ? (res.assets.peek() || []).find((asset) => asset.id === id) : null;
  await busy(button, async () => {
    const picked = await pickImage(form, category === "crew" ? 720 : 1600);
    const typed = webUrl(data.photo_url);
    const photo = picked?.url || typed || existing?.photo_url || "";
    if (!photo || !String(data.title).trim()) return toast(t("fillRequired"), "error");
    const patch = {
      title: String(data.title).trim(), subtitle: String(data.subtitle || "").trim(), discord_id: String(data.discord_id || "").trim(),
      caption: String(data.caption || "").trim(), photo_url: photo,
      storage_path: picked?.path || (photo === existing?.photo_url ? existing.storage_path || "" : ""),
      media_type: category === "crew" ? "image" : /\.mp4(\?|#|$)/i.test(photo) ? "video" : /\.gif(\?|#|$)/i.test(photo) ? "gif" : "image",
      updated_at: now()
    };
    if (existing) await db.update(T.assets, id, patch);
    else await db.insert(T.assets, { id: uid(), category, created_by: state.me.email, created_at: now(), display_order: assetsOf(category).length, ...patch });
    form.reset();
    toast(t("saved"), "ok");
    await res.assets.load(true);
    category === "crew" ? renderCrew() : renderMedia();
  });
}

function editAsset(id) {
  const asset = (res.assets.peek() || []).find((entry) => entry.id === id);
  if (!asset) return;
  const category = asset.category === "media" ? "media" : "crew";
  const form = $(category === "crew" ? "#crewForm" : "#mediaForm");
  form.reset();
  state.editing[category] = id;
  for (const key of ["title", "subtitle", "discord_id", "caption", "photo_url"]) if (form.elements[key]) form.elements[key].value = asset[key] || "";
  revealForm(form);
}

function revealForm(form) {
  form.closest("details").open = true;
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  form.querySelector("input, select, textarea")?.focus({ preventScroll: true });
}

function initDrag(grid, category, render) {
  let dragged = null;
  const clear = () => $$(".drop-target, .dragging", grid).forEach((node) => node.classList.remove("drop-target", "dragging"));
  grid.addEventListener("dragstart", (event) => {
    const card = event.target.closest?.("[data-id][draggable]");
    if (!card) return;
    dragged = card.dataset.id;
    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dragged);
  });
  grid.addEventListener("dragover", (event) => {
    const card = event.target.closest?.("[data-id]");
    if (!dragged || !card || card.dataset.id === dragged) return;
    event.preventDefault();
    if (!card.classList.contains("drop-target")) { $$(".drop-target", grid).forEach((node) => node.classList.remove("drop-target")); card.classList.add("drop-target"); }
  });
  grid.addEventListener("drop", async (event) => {
    const card = event.target.closest?.("[data-id]");
    if (!dragged || !card || card.dataset.id === dragged) return;
    event.preventDefault();
    const all = res.assets.peek() || [];
    const ids = assetsOf(category).map((asset) => asset.id);
    ids.splice(ids.indexOf(card.dataset.id), 0, ids.splice(ids.indexOf(dragged), 1)[0]);
    const changed = ids.map((id, index) => [id, index]).filter(([id, index]) => all.find((asset) => asset.id === id).display_order !== index);
    res.assets.set(sortAssets(all.map((asset) => (asset.category === category ? { ...asset, display_order: ids.indexOf(asset.id) } : asset))));
    render();
    try {
      await Promise.all(changed.map(([id, index]) => db.update(T.assets, id, { display_order: index })));
      toast(t("orderSaved"), "ok");
    } catch (error) { fail(error); res.assets.stale(); }
  });
  grid.addEventListener("dragend", () => { clear(); dragged = null; });
}

async function react(button) {
  if (!state.me) return toast(t("reactLogin"), "warn");
  const { id, emoji } = button.dataset;
  const map = res.reactions.peek() || {};
  const entry = ((map[id] ||= {})[emoji] ||= { n: 0, mine: false });
  const adding = !entry.mine;
  entry.mine = adding;
  entry.n = Math.max(0, entry.n + (adding ? 1 : -1));
  res.reactions.set(map);
  button.classList.toggle("on", adding);
  button.setAttribute("aria-pressed", String(adding));
  button.lastElementChild.textContent = String(entry.n);
  button.classList.remove("pop"); void button.offsetWidth; button.classList.add("pop");
  play("toggle");
  try {
    const client = await sdk();
    if (adding) await run(client.from(T.reactions).insert({ id: uid(), asset_id: id, reaction: emoji, user_key: state.me.id, user_email: state.me.email, created_at: now() }));
    else await run(client.from(T.reactions).delete().eq("asset_id", id).eq("reaction", emoji).eq("user_key", state.me.id));
  } catch (error) {
    fail(error);
    res.reactions.stale();
    hydrate(res.reactions, renderMedia);
  }
}

function zoom(image) {
  $("#lightboxBody").innerHTML = `<img src="${esc(image.currentSrc || image.src)}" alt="${esc(image.alt)}">`;
  openDialog("dlgLightbox");
}

// ---------------------------------------------------------------- streams
const kickSlug = (url) => { const match = String(url || "").trim().match(/kick\.com\/([^/?#]+)/i); return (match ? match[1] : String(url || "").trim()).replace(/^@/, "").replace(/[^\w.-]/g, ""); };

function enterStreams() {
  const grid = $("#streamGrid");
  if (res.streams.peek() === undefined) grid.innerHTML = skeletons(3, "wide");
  hydrate(res.streams, () => { renderStreams(); refreshLive(); }, grid);
  clearInterval(state.liveTimer);
  state.liveTimer = setInterval(() => { if (!document.hidden) refreshLive(true); }, Math.max(30, CONFIG.features.streamRefreshSeconds || 60) * 1000);
}

async function refreshLive(force) {
  const list = res.streams.peek() || [];
  const paint = () => {
    countTo($("#statLive"), list.filter((stream) => state.live[stream.id]?.live).length);
    if (state.route === "streams") renderStreams();
  };
  if (!list.length || (!force && Date.now() - state.liveAt < 50000)) return paint();
  state.liveAt = Date.now();
  await Promise.all(list.map(async (stream) => {
    try {
      const response = await fetch("https://kick.com/api/v2/channels/" + encodeURIComponent(kickSlug(stream.kick_url)), { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error("kick " + response.status);
      const live = (await response.json()).livestream;
      const thumb = live && (typeof live.thumbnail === "string" ? live.thumbnail : live.thumbnail?.url || live.thumbnail?.src || "");
      state.live[stream.id] = live ? { live: true, title: live.session_title || "", viewers: Number(live.viewer_count) || 0, thumb } : { live: false };
    } catch (error) {
      state.live[stream.id] ||= { live: false };
    }
  }));
  paint();
}

function renderStreams() {
  const rows = (res.streams.peek() || []).slice().sort((a, b) => Number(Boolean(state.live[b.id]?.live)) - Number(Boolean(state.live[a.id]?.live)));
  const editable = can.admin();
  const grid = $("#streamGrid");
  grid.className = "grid grid-media stagger";
  grid.innerHTML = rows.length ? rows.map((stream, index) => {
    const status = state.live[stream.id] || {};
    const shot = status.live && status.thumb ? status.thumb + (status.thumb.includes("?") ? "&" : "?") + "t=" + Math.floor(Date.now() / 60000) : imageUrl(stream.logo_url);
    return `<article class="card post ${status.live ? "is-live" : ""}" style="--i:${Math.min(index, 10)}">
      <div class="stream-shot"><img class="post-media" src="${esc(shot)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="live-pill">${esc(t(status.live ? "live" : "offline"))}</span></div>
      <div class="post-body">
        <div class="stream-row"><img src="${esc(imageUrl(stream.logo_url))}" alt="" loading="lazy" referrerpolicy="no-referrer"><div><h3>${esc(stream.name)}</h3><p>${esc(status.live ? (status.title || t("viewers", { n: status.viewers })) : t("offline"))}</p></div>${status.live ? `<span class="pill">${icon("eye")}${esc(String(status.viewers))}</span>` : ""}</div>
        <div class="card-tools"><a class="btn btn-sm ${status.live ? "btn-red" : ""}" href="${esc(webUrl(stream.kick_url) || "https://kick.com/" + kickSlug(stream.kick_url))}" target="_blank" rel="noopener noreferrer">${icon("external")}<span>${esc(t("watch"))}</span></a>
        ${editable ? `<button class="icon-btn" type="button" data-act="edit-stream" data-id="${esc(stream.id)}" title="${esc(t("edit"))}">${icon("edit")}</button><button class="icon-btn danger" type="button" data-act="del-stream" data-id="${esc(stream.id)}" title="${esc(t("remove"))}">${icon("trash")}</button>` : ""}</div>
      </div></article>`;
  }).join("") : empty("streamsEmpty");
}

async function saveStream(form, button) {
  const data = Object.fromEntries(new FormData(form));
  const slug = kickSlug(data.kick_url);
  const patch = { name: String(data.name).trim(), logo_url: webUrl(data.logo_url), kick_url: slug ? "https://kick.com/" + slug : "", updated_at: now() };
  if (!patch.name || !patch.kick_url) return toast(t("fillRequired"), "error");
  await busy(button, async () => {
    const id = state.editing.stream;
    if (id) await db.update(T.streams, id, patch);
    else await db.insert(T.streams, { id: uid(), created_by: state.me.email, created_at: now(), ...patch });
    form.reset();
    toast(t("saved"), "ok");
    await res.streams.load(true);
    renderStreams();
    refreshLive(true);
  });
}

// ---------------------------------------------------------------- applications (apply)
const labelOf = (question) => question.label[getLang()] || question.label.en;

async function startApply(kind, rulesAccepted) {
  if (!state.me) {
    toast(t("needLogin"), "warn");
    setTimeout(() => { location.href = "login/"; }, 1100);
    return;
  }
  if (!profileComplete()) { toast(t("needProfile"), "warn"); return openProfile(); }
  let rows = [];
  try { rows = await res.myApps.load(); } catch (error) { return fail(error); }
  const block = applyBlock(rows);
  if (block) return toast(block, "warn");
  if (kind === "transfer" && !rulesAccepted) {
    $("#rulesAgree").checked = false;
    $("#rulesContinue").disabled = true;
    return openDialog("dlgRules");
  }
  state.apply = { kind: kind === "transfer" ? "transfer" : "recruitment", step: 0, draft: { contact_email: state.me.email, full_name: state.me.name, discord_id: state.me.discord } };
  renderApplyStep();
  openDialog("dlgApply");
}

function renderApplyStep() {
  const { kind, step, draft } = state.apply;
  $("#applyTitle").textContent = t(kind === "transfer" ? "appTransfer" : "appRecruitment");
  $("#applyStep").textContent = t("step", { n: step + 1 });
  $("#applyProgress").style.width = step === 0 ? "50%" : "100%";
  $("#applyFields").innerHTML = questions[kind][step].map((question) => {
    const name = esc(question.key);
    if (question.type === "checkbox") return `<label class="check"><input type="checkbox" name="${name}" ${draft[question.key] ? "checked" : ""}><span>${esc(labelOf(question))}</span></label>`;
    if (question.type === "textarea") return `<label class="field"><span>${esc(labelOf(question))}</span><textarea name="${name}" maxlength="2000" dir="auto">${esc(draft[question.key] || "")}</textarea></label>`;
    return `<label class="field"><span>${esc(labelOf(question))}</span><input name="${name}" type="${question.type}" maxlength="120" value="${esc(draft[question.key] || "")}" dir="auto"></label>`;
  }).join("");
  $("#applyBack").hidden = step === 0;
  $("#applyNext").hidden = step === 1;
  $("#applySubmit").hidden = step === 0;
  $("#applyFields").scrollTop = 0;
}

/** Stores the current step in the draft. Returns false (and marks fields) when something is missing. */
function collectApplyStep() {
  const { kind, step, draft } = state.apply;
  const form = $("#applyForm");
  let valid = true;
  for (const question of questions[kind][step]) {
    const field = form.elements[question.key];
    const value = question.type === "checkbox" ? field.checked : field.value.trim();
    draft[question.key] = value;
    const ok = question.type === "email" ? /^\S+@\S+\.\S+$/.test(value) : Boolean(value);
    const wrap = field.closest("label");
    wrap.classList.remove("invalid");
    if (!ok) { if (valid) field.focus(); valid = false; void wrap.offsetWidth; wrap.classList.add("invalid"); }
  }
  if (!valid) toast(t("fillRequired"), "error");
  return valid;
}

async function submitApplication(button) {
  if (!collectApplyStep()) return;
  const { kind, draft } = state.apply;
  await busy(button, async () => {
    const stamp = now();
    await db.insert(T.applications, {
      id: uid(), kind, status: "pending",
      applicant_email: state.me.email, applicant_name: state.me.name || draft.full_name, discord_id: state.me.discord || draft.discord_id,
      answers: { ...draft }, question_labels: Object.fromEntries(questions[kind].flat().map((question) => [question.key, labelOf(question)])),
      created_at: stamp, updated_at: stamp
    });
    closeDialog("dlgApply");
    toast(t("appSent"), "ok");
    res.myApps.stale();
    res.pending.stale();
    renderHubApplications();
    checkNotes();
  });
}

// ---------------------------------------------------------------- applications (staff)
function appCard(app, index) {
  const labels = app.question_labels || {};
  const answers = Object.entries(app.answers || {}).filter(([, value]) => value !== "" && value != null)
    .map(([key, value]) => `<div><dt>${esc(labels[key] || key)}</dt><dd dir="auto">${esc(value === true ? "✓" : value)}</dd></div>`).join("");
  const decided = app.status === "pending" ? "" : [
    app.decision_message && [t("decisionMessage"), app.decision_message],
    interviewText(app) && [t("interview"), interviewText(app)],
    app.rejection_reason && [t("reason"), app.rejection_reason],
    app.decided_at && [fmtDateTime(app.decided_at), t("by", { name: app.decided_by || "–" })]
  ].filter(Boolean).map(([label, value]) => `<div><dt>${esc(label)}</dt><dd dir="auto">${esc(value)}</dd></div>`).join("");
  const id = esc(app.id);
  const actions = app.status === "pending"
    ? `<button class="btn btn-ok btn-sm" type="button" data-act="decide" data-id="${id}" data-status="accepted">${icon("check")}<span>${esc(t("approve"))}</span></button><button class="btn btn-danger btn-sm" type="button" data-act="decide" data-id="${id}" data-status="rejected">${icon("x")}<span>${esc(t("reject"))}</span></button>`
    : can.admin() ? `<button class="btn btn-danger btn-sm" type="button" data-act="del-app" data-id="${id}">${icon("trash")}<span>${esc(t("deleteRecord"))}</span></button>` : "";
  return `<article class="card app-card" style="--i:${Math.min(index, 10)}">
    <div class="app-top"><div><h3>${esc(app.applicant_name || "–")}</h3><p>${esc(app.applicant_email || "")} · ${esc(app.discord_id || "–")} · ${esc(fmtDateTime(app.created_at))}</p></div><span class="state ${esc(app.status)}">${esc(t(app.status))}</span></div>
    ${decided ? `<dl class="qa">${decided}</dl>` : ""}
    <details ${app.status === "pending" ? "open" : ""}><summary>${esc(t("answers"))}</summary><dl class="qa">${answers}</dl></details>
    ${actions ? `<div class="card-tools">${actions}</div>` : ""}</article>`;
}

function refreshReviewBadge() {
  res.pending.load().then((rows) => {
    const badge = $("#reviewBadge");
    badge.hidden = !rows.length;
    badge.textContent = String(rows.length);
    $("#moreBadge").hidden = !rows.length;
    $("#moreBadge").textContent = String(rows.length);
    syncPendingNote(rows.length);
    countTo($("#mPending"), rows.length);
  }, console.warn);
}

function enterReview() {
  const list = $("#reviewList");
  if (res.pending.peek() === undefined) list.innerHTML = skeletons(3);
  hydrate(res.pending, renderReview, list);
}

function renderReview() {
  const query = $("#reviewSearch").value.trim().toLowerCase();
  for (const tab of $$("#reviewTabs .chip-btn")) tab.setAttribute("aria-selected", String(tab.dataset.kind === state.reviewKind));
  const rows = (res.pending.peek() || []).filter((app) => app.kind === state.reviewKind && (!query || [app.applicant_name, app.applicant_email, app.discord_id, JSON.stringify(app.answers || {})].join(" ").toLowerCase().includes(query)));
  $("#reviewCount").textContent = String(rows.length) + " · " + t("pending");
  $("#reviewList").className = "stack stagger";
  $("#reviewList").innerHTML = rows.length ? rows.map(appCard).join("") : empty("reviewEmpty");
  refreshReviewBadge();
}

async function loadArchive(reset) {
  const [status, kind] = state.archiveKey.split("-");
  const list = $("#archiveList");
  if (reset) { state.archiveRows = []; list.innerHTML = skeletons(3); }
  for (const tab of $$("#archiveTabs .chip-btn")) tab.setAttribute("aria-selected", String(tab.dataset.key === state.archiveKey));
  const key = state.archiveKey;
  try {
    const client = await sdk();
    const from = state.archiveRows.length;
    const { data } = await run(client.from(T.applications).select("*").eq("status", status).eq("kind", kind).order("created_at", { ascending: false }).range(from, from + 29));
    if (key !== state.archiveKey) return;
    state.archiveRows.push(...data);
    state.archiveMore = data.length === 30;
  } catch (error) {
    fail(error);
  }
  list.className = "stack stagger";
  list.innerHTML = state.archiveRows.length ? state.archiveRows.map(appCard).join("") : empty("archiveEmpty");
  $("#archiveMore").hidden = !state.archiveMore;
}

function enterArchives() { loadArchive(true); }

function openDecision(id, status) {
  const app = (res.pending.peek() || []).find((entry) => entry.id === id);
  if (!app) return;
  state.decision = { id, status };
  const form = $("#decisionForm");
  form.reset();
  $("#decisionTitle").textContent = t(status === "accepted" ? "decisionApprove" : "decisionReject");
  $("#decisionWho").textContent = app.applicant_name || app.applicant_email;
  form.elements.message.value = t("decisionDefault");
  for (const field of $$("[data-when]", form)) field.hidden = field.dataset.when !== status;
  openDialog("dlgDecision");
}

async function saveDecision(form, button) {
  const { id, status } = state.decision || {};
  if (!id) return;
  const data = Object.fromEntries(new FormData(form));
  const stamp = new Date();
  const patch = { status, decided_at: stamp.toISOString(), decided_by: state.me.email, updated_at: stamp.toISOString(), cooldown_until: new Date(stamp.getTime() + (status === "accepted" ? 7 : 3) * 864e5).toISOString() };
  if (status === "accepted") {
    Object.assign(patch, { decision_message: data.message.trim() || t("decisionDefault"), interview_dates: { monday: data.monday.replace(/-/g, "/"), friday: data.friday.replace(/-/g, "/") }, rejection_reason: null });
  } else {
    if (!data.reason.trim()) return toast(t("fillRequired"), "error");
    Object.assign(patch, { rejection_reason: data.reason.trim(), decision_message: null, interview_dates: null });
  }
  await busy(button, async () => {
    await db.update(T.applications, id, patch);
    closeDialog("dlgDecision");
    toast(t("decisionSaved"), "ok");
    res.pending.set((res.pending.peek() || []).filter((app) => app.id !== id));
    renderReview();
  });
}

async function bulkDelete(question, filter, after) {
  if (!can.admin() || !(await ask(question))) return;
  try {
    const client = await sdk();
    await run(filter(client.from(T.applications).delete()));
    toast(t("removed"), "ok");
    after();
  } catch (error) { fail(error); }
}

// ---------------------------------------------------------------- admin
async function enterAdmin() {
  countTo($("#mOfficers"), (res.roster.peek() || []).length);
  countTo($("#mMedia"), assetsOf("media").length);
  res.roster.load().then((rows) => countTo($("#mOfficers"), rows.length), console.warn);
  res.assets.load().then(() => countTo($("#mMedia"), assetsOf("media").length), console.warn);
  refreshReviewBadge();
  try {
    const client = await sdk();
    const archived = await run(client.from(T.applications).select("id", { count: "exact", head: true }).in("status", ["accepted", "rejected"]));
    countTo($("#mArchived"), archived.count || 0);
  } catch (error) { console.warn(error); }
}

async function openAccounts() {
  if (!can.admin()) return;
  const list = $("#accountsList");
  list.innerHTML = skeletons(4);
  openDialog("dlgAccounts");
  try {
    const client = await sdk();
    state.accounts = (await run(client.from(T.accounts).select("id,email,role,display_name,discord_user,discord_avatar_url,discord_linked").order("email").limit(1000))).data;
    renderAccounts();
  } catch (error) { list.innerHTML = `<div class="empty">${esc(explain(error))}</div>`; }
}

function renderAccounts() {
  const query = $("#accountsSearch").value.trim().toLowerCase();
  const rows = state.accounts.filter((account) => !query || [account.email, account.display_name, account.discord_user].join(" ").toLowerCase().includes(query));
  $("#accountsList").innerHTML = rows.length ? rows.map((account) => `
    <div class="acct">
      <div class="avatar sm">${account.discord_avatar_url ? `<img src="${esc(account.discord_avatar_url)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : esc(initials(account.display_name || account.email))}</div>
      <div class="grow"><strong>${esc(account.display_name || account.email)}</strong><small>${esc(account.email)}${account.discord_user ? " · " + esc(account.discord_user) : ""}</small></div>
      ${account.role === "owner" ? `<span class="pill pill-red">${esc(roleLabel("owner"))}</span>` : `<select data-account="${esc(account.id)}" aria-label="${esc(t("roleAdmin"))}">${staffRoles.map((value) => `<option value="${value}" ${account.role === value ? "selected" : ""}>${esc(roleLabel(value))}</option>`).join("")}</select>`}
    </div>`).join("") : empty("accountsEmpty");
}

async function optimizeImages() {
  if (!can.admin()) return;
  const progress = toast(t("optimizeWorking", { done: 0, total: "…" }), "", true);
  let done = 0;
  let skipped = 0;
  try {
    const client = await sdk();
    const jobs = [];
    for (const row of (await run(client.from(T.schedule).select("id,insignia_url"))).data) {
      if (row.insignia_url && !isStorageUrl(row.insignia_url)) jobs.push({ table: T.schedule, id: row.id, field: "insignia_url", url: row.insignia_url, max: 160 });
    }
    for (const asset of await res.assets.load(true)) {
      if (asset.photo_url && asset.media_type === "image" && !isStorageUrl(asset.photo_url)) jobs.push({ table: T.assets, id: asset.id, field: "photo_url", url: asset.photo_url, max: asset.category === "crew" ? 720 : 1600, path: true });
    }
    if (!jobs.length) { progress.close(); return toast(t("optimizeNothing"), "ok"); }
    for (const job of jobs) {
      progress.set(t("optimizeWorking", { done: done + skipped, total: jobs.length }));
      const blob = await compressUrl(job.url, job.max);
      if (!blob) { skipped += 1; continue; }
      try {
        const file = await upload(blob, "optimized.webp");
        await db.update(job.table, job.id, { [job.field]: file.url, ...(job.path ? { storage_path: file.path } : {}), updated_at: now() });
        done += 1;
      } catch (error) { console.warn(error); skipped += 1; }
    }
    res.insignia.clear();
    res.assets.stale();
    toast(t("optimizeDone", { done, skipped }), done ? "ok" : "warn");
  } catch (error) {
    fail(error);
  } finally {
    progress.close();
  }
}

// ---------------------------------------------------------------- settings + presence
function openSettings() {
  $("#setSound").checked = prefs.sound;
  $("#setVolume").value = prefs.volume;
  $("#setMotion").checked = prefs.motion !== false;
  const style = getComputedStyle(document.documentElement);
  $("#setRed").value = prefs.red || style.getPropertyValue("--red").trim();
  $("#setBlue").value = prefs.blue || style.getPropertyValue("--blue").trim();
  openDialog("dlgSettings");
}

function applyAccent() {
  const root = document.documentElement.style;
  root.setProperty("--red", prefs.red || CONFIG.colors.red);
  root.setProperty("--blue", prefs.blue || CONFIG.colors.blue);
}

function setOnlineCount(count) {
  const value = Math.max(1, count);
  $("#presenceCount").textContent = String(value);
  $("#presence").title = t("online", { n: value });
  countTo($("#statOnline"), value);
}

async function startPresence() {
  if (CONFIG.features.onlineCounter === false) return;
  try {
    const client = await sdk();
    let visitor = localStorage.getItem("lspd-visitor");
    if (!visitor) { visitor = uid(); localStorage.setItem("lspd-visitor", visitor); }
    const channel = client.channel("lspd-online", { config: { presence: { key: visitor } } });
    channel.on("presence", { event: "sync" }, () => setOnlineCount(Object.keys(channel.presenceState()).length));
    channel.subscribe((status) => { if (status === "SUBSCRIBED") channel.track({ at: Date.now() }); });
  } catch (error) { console.warn(error); }
}

// ---------------------------------------------------------------- events
const removers = {
  reg: [T.regulations, "regDeleteAsk", () => res.regs.load(true).then(renderRegs)],
  asset: [T.assets, "deleteAsk", () => res.assets.load(true).then(() => { renderCrew(); renderMedia(); })],
  stream: [T.streams, "deleteAsk", () => res.streams.load(true).then(renderStreams)],
  roster: [T.schedule, "deleteAsk", () => res.roster.load(true).then(renderRoster)],
  news: [T.news, "newsDeleteAsk", () => res.news.load(true).then(() => { closeDialog("dlgNews"); renderNews(); })]
};

async function removeRecord(kind, id) {
  const [table, question, after] = removers[kind];
  if (!(await ask(t(question)))) return;
  try {
    await db.remove(table, [id]);
    toast(t("removed"), "ok");
    await after();
  } catch (error) { fail(error); }
}

const actions = {
  apply: (el) => startApply(el.dataset.kind),
  account: openAccount,
  settings: openSettings,
  logout: () => logout().catch(fail),
  accounts: openAccounts,
  optimize: optimizeImages,
  "link-discord": () => linkDiscord().catch(fail),
  "reset-settings": () => { savePrefs({ sound: CONFIG.features.sounds !== false, volume: CONFIG.features.soundVolume ?? 0.5, motion: true, red: "", blue: "" }); applyAccent(); openSettings(); },
  "reg-filter": (el) => { state.regFilter = el.dataset.id; renderRegs(); },
  "reg-expand": () => $$("#regList details").forEach((node) => { node.open = true; }),
  "reg-collapse": () => $$("#regList details").forEach((node) => { node.open = false; }),
  pop: togglePop,
  palette: openPalette,
  "palette-run": (el) => runPalette(Number(el.dataset.id)),
  top: () => scrollTo({ top: 0, behavior: "smooth" }),
  "notes-read": () => { for (const note of loadNotes().items) note.read = true; saveNotes(); renderNotes(); },
  "note-open": (el) => {
    const note = loadNotes().items.find((entry) => entry.id === el.dataset.id);
    if (!note) return;
    note.read = true;
    saveNotes();
    renderNotes();
    closePops();
    if (note.href) location.hash = note.href;
    else if (["accepted", "rejected", "submitted"].includes(note.kind) && state.me) openAccount();
  },
  "sop-chapter": (el) => openSopChapter(el.dataset.id),
  "sop-hit": (el) => openSopChapter(el.dataset.id, Number(el.dataset.block)),
  "sop-jump": (el) => document.getElementById(el.dataset.id)?.scrollIntoView({ behavior: "smooth", block: "start" }),
  "sop-results": () => { state.sopResults = true; renderSop(); },
  "sop-clear": () => { $("#sopSearch").value = ""; renderSop(); },
  "sop-answers": (el) => {
    const open = el.getAttribute("aria-pressed") !== "true";
    for (const node of $$("#sopDoc details.sop-qa")) node.open = open;
    el.setAttribute("aria-pressed", open);
    el.lastElementChild.textContent = t(open ? "sopHideAnswers" : "sopShowAnswers");
  },
  "edit-reg": (el) => {
    const row = (res.regs.peek() || []).find((entry) => entry.id === el.dataset.id);
    if (!row) return;
    const form = $("#regForm");
    form.reset();
    state.editing.reg = row.id;
    form.elements.degree.value = String(row.degree);
    form.elements.regulation_code.value = row.regulation_code || "";
    form.elements.title.value = row.title || "";
    form.elements.description.value = row.description || "";
    revealForm(form);
  },
  "edit-asset": (el) => editAsset(el.dataset.id),
  "edit-stream": (el) => {
    const row = (res.streams.peek() || []).find((entry) => entry.id === el.dataset.id);
    if (!row) return;
    const form = $("#streamForm");
    form.reset();
    state.editing.stream = row.id;
    for (const key of ["name", "logo_url", "kick_url"]) form.elements[key].value = row[key] || "";
    revealForm(form);
  },
  "edit-roster": (el) => {
    const row = (res.roster.peek() || []).find((entry) => entry.id === el.dataset.id);
    if (!row) return;
    const form = $("#rosterForm");
    form.reset();
    state.editing.roster = row.id;
    for (const key of ["badge_number", "name", "rank", "department", "admin_rank", "status", "punishment", "last_promotion", "discord_user", "points", "privilege_points"]) form.elements[key].value = row[key] || "";
    for (const [key] of wings) form.elements["wing_" + key].checked = Boolean(row.wings?.[key]);
    revealForm(form);
  },
  "del-reg": (el) => removeRecord("reg", el.dataset.id),
  "del-asset": (el) => removeRecord("asset", el.dataset.id),
  "del-stream": (el) => removeRecord("stream", el.dataset.id),
  "del-roster": (el) => removeRecord("roster", el.dataset.id),
  "del-news": (el) => removeRecord("news", el.dataset.id),
  "edit-news": (el) => editNews(el.dataset.id),
  "news-open": (el) => openNews(el.dataset.id),
  "news-filter": (el) => { state.newsFilter = el.dataset.id; renderNews(); },
  "news-link": (el) => navigator.clipboard?.writeText(new URL("#/news/" + el.dataset.id, location.href).href).then(() => toast(t("linkCopied"), "ok"), () => {}),
  "logs-filter": (el) => { state.logFilter = el.dataset.id; loadLogs(true); },
  "logs-more": () => loadLogs(false),
  "logs-refresh": () => loadLogs(true),
  "logs-export": exportLogs,
  react: react,
  zoom: zoom,
  decide: (el) => openDecision(el.dataset.id, el.dataset.status),
  "del-app": async (el) => {
    if (!(await ask(t("deleteAsk")))) return;
    try { await db.remove(T.applications, [el.dataset.id]); toast(t("removed"), "ok"); loadArchive(true); } catch (error) { fail(error); }
  },
  "clear-pending": () => bulkDelete(t("clearAsk", { type: kindLabel(state.reviewKind) }), (query) => query.eq("status", "pending").eq("kind", state.reviewKind), () => res.pending.load(true).then(renderReview)),
  "reset-archives": () => bulkDelete(t("resetAsk"), (query) => query.in("status", ["accepted", "rejected"]), () => loadArchive(true)),
  "archive-more": () => loadArchive(false)
};

function bindForm(selector, handler, editKey) {
  const form = $(selector);
  form.addEventListener("submit", (event) => { event.preventDefault(); handler(form, event.submitter || form.querySelector('[type="submit"]')); });
  if (editKey) form.addEventListener("reset", () => { state.editing[editKey] = null; });
}

function bindEvents() {
  addEventListener("hashchange", navigate);

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".pop")) closePops();
    const closer = event.target.closest("[data-close]");
    if (closer) return closer.closest("dialog").close();
    if (event.target instanceof HTMLDialogElement) return event.target.close(); // click on the backdrop
    const target = event.target.closest("[data-act]");
    if (target) { if (target.dataset.act !== "react") play("click"); actions[target.dataset.act]?.(target); return; }
    const link = event.target.closest("a:not(.tab), summary, .chip-btn");
    if (link) play(link.dataset.sound || "click");
  });

  for (const dialog of $$("dialog")) dialog.addEventListener("close", () => play("close"));
  document.addEventListener("change", (event) => { if (event.target.matches('input[type="checkbox"], select')) play("toggle"); });

  // Broken or blocked remote images fall back once to the local placeholder.
  document.addEventListener("error", (event) => {
    const image = event.target;
    if (image instanceof HTMLImageElement && !image.dataset.fallback && image.closest("#main, dialog")) { image.dataset.fallback = "1"; image.src = CONFIG.assets.fallback; }
  }, true);

  $("#lang").addEventListener("change", (event) => { setLang(event.target.value); applyLanguage(); renderNotes(); routes[state.route].enter?.(); });
  $("#regSearch").addEventListener("input", debounce(renderRegs, 120));
  $("#sopSearch").addEventListener("input", debounce(() => { state.sopResults = true; renderSop(); }, 160));
  addEventListener("scroll", () => requestAnimationFrame(sopProgress), { passive: true });
  // Ctrl/Cmd+K opens the search palette from anywhere; Esc closes open menus.
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openPalette(); }
    if (event.key === "Escape") closePops();
  });
  $("#paletteInput").addEventListener("input", () => { paletteIndex = 0; renderPalette(); });
  $("#paletteInput").addEventListener("keydown", (event) => {
    const move = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (move) {
      event.preventDefault();
      paletteIndex = (paletteIndex + move + paletteItems.length) % Math.max(1, paletteItems.length);
      for (const item of $$("#paletteList .palette-item")) item.setAttribute("aria-selected", String(Number(item.dataset.id) === paletteIndex));
      $(`#paletteList [data-id="${paletteIndex}"]`)?.scrollIntoView({ block: "nearest" });
    }
    if (event.key === "Enter") { event.preventDefault(); runPalette(paletteIndex); }
  });
  setInterval(() => { if (!document.hidden) checkNotes(); }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkNotes(); });
  // "/" jumps to the search box on the handbook and the regulations.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.ctrlKey || event.metaKey || event.target.closest("input, textarea, select, [contenteditable]")) return;
    const box = state.route === "sop" ? $("#sopSearch") : state.route === "regulations" ? $("#regSearch") : null;
    if (box) { event.preventDefault(); box.focus(); box.select(); }
  });
  $("#reviewSearch").addEventListener("input", debounce(renderReview, 120));
  $("#newsSearch").addEventListener("input", debounce(renderNews, 120));
  $("#logsSearch").addEventListener("input", debounce(renderLogs, 120));
  bindForm("#newsForm", saveNews, "news");
  $("#newsForm").addEventListener("reset", () => { $('#newsForm [type="submit"] span').textContent = t("newsPublish"); });
  $("#accountsSearch").addEventListener("input", debounce(renderAccounts, 120));
  $("#reviewTabs").addEventListener("click", (event) => { const tab = event.target.closest("[data-kind]"); if (tab) { state.reviewKind = tab.dataset.kind; renderReview(); } });
  $("#archiveTabs").addEventListener("click", (event) => { const tab = event.target.closest("[data-key]"); if (tab) { state.archiveKey = tab.dataset.key; loadArchive(true); } });

  bindForm("#regForm", saveRegulation, "reg");
  bindForm("#crewForm", (form, button) => saveAsset(form, button, "crew"), "crew");
  bindForm("#mediaForm", (form, button) => saveAsset(form, button, "media"), "media");
  bindForm("#streamForm", saveStream, "stream");
  bindForm("#rosterForm", saveRoster, "roster");
  bindForm("#decisionForm", saveDecision);
  bindForm("#applyForm", (form, button) => submitApplication(button));
  initDrag($("#crewGrid"), "crew", renderCrew);
  initDrag($("#mediaGrid"), "media", renderMedia);

  $("#applyNext").addEventListener("click", () => { if (collectApplyStep()) { state.apply.step = 1; renderApplyStep(); } });
  $("#applyBack").addEventListener("click", () => {
    const { kind, draft } = state.apply;
    for (const question of questions[kind][1]) { const field = $("#applyForm").elements[question.key]; draft[question.key] = question.type === "checkbox" ? field.checked : field.value; }
    state.apply.step = 0;
    renderApplyStep();
  });
  $("#rulesAgree").addEventListener("change", (event) => { $("#rulesContinue").disabled = !event.target.checked; });
  $("#rulesContinue").addEventListener("click", () => { closeDialog("dlgRules"); startApply("transfer", true); });

  bindForm("#profileForm", (form, button) => busy(button, async () => {
    const name = form.elements.name.value.trim();
    if (!name) return toast(t("fillRequired"), "error");
    await updateOwnAccount({ display_name: name });
    setMe({ ...state.me, name });
    renderIdentity();
    if (profileComplete()) { closeDialog("dlgProfile"); toast(t("saved"), "ok"); } else toast(t("needProfile"), "warn");
  }));
  bindForm("#nameForm", (form, button) => busy(button, async () => {
    const name = form.elements.name.value.trim();
    if (!name) return;
    const client = await sdk();
    await run(client.auth.updateUser({ data: { display_name: name, full_name: name } }));
    await updateOwnAccount({ display_name: name });
    setMe({ ...state.me, name });
    renderIdentity();
    openAccount();
    toast(t("saved"), "ok");
  }));
  bindForm("#emailForm", (form, button) => busy(button, async () => {
    const email = form.elements.email.value.trim().toLowerCase();
    if (!email || email === state.me.email) return;
    const client = await sdk();
    const { data } = await run(client.auth.updateUser({ email }, { emailRedirectTo: PORTAL_URL }));
    if ((data.user?.email || "").toLowerCase() === email) { await updateOwnAccount({ email }); setMe({ ...state.me, email }); }
    toast(t("emailSent"), "ok");
  }));
  bindForm("#passwordForm", (form, button) => busy(button, async () => {
    const password = form.elements.password.value;
    if (password.length < CONFIG.security.minimumPasswordLength) return toast(t("newPassword", { n: CONFIG.security.minimumPasswordLength }), "error");
    const client = await sdk();
    await run(client.auth.updateUser({ password }));
    form.reset();
    toast(t("passwordSaved"), "ok");
  }));

  $("#accountsList").addEventListener("change", async (event) => {
    const select = event.target.closest("[data-account]");
    if (!select) return;
    const account = state.accounts.find((entry) => entry.id === select.dataset.account);
    try {
      await db.update(T.accounts, account.id, { role: select.value, updated_at: now() });
      account.role = select.value;
      toast(t("roleSaved"), "ok");
    } catch (error) { select.value = account.role; fail(error); }
  });

  $("#setSound").addEventListener("change", (event) => { savePrefs({ sound: event.target.checked }); play("success"); });
  $("#setVolume").addEventListener("input", (event) => { savePrefs({ volume: Number(event.target.value) }); play("click"); });
  $("#setMotion").addEventListener("change", (event) => savePrefs({ motion: event.target.checked }));
  $("#setRed").addEventListener("input", (event) => { savePrefs({ red: event.target.value }); applyAccent(); });
  $("#setBlue").addEventListener("input", (event) => { savePrefs({ blue: event.target.value }); applyAccent(); });

  // Coming back to the tab refreshes whatever is on screen if it went stale.
  document.addEventListener("visibilitychange", () => { if (!document.hidden && routes[state.route].live) routes[state.route].enter(); });
}

// ---------------------------------------------------------------- start
function start() {
  $("#connectBtn").href = CONFIG.brand.connectUrl;
  $("#rosterRank").innerHTML = ranks.map((rank) => `<option${rank === "Rookie" ? " selected" : ""}>${esc(rank)}</option>`).join("");
  $("#rosterWings").insertAdjacentHTML("beforeend", wings.map(([key, label]) => `<label class="check"><input type="checkbox" name="wing_${key}"><span>${esc(label)}</span></label>`).join(""));
  initFeedback();
  bindEvents();
  applyLanguage();
  // A failed Discord / email link comes back as "#error=...&error_description=...".
  const authError = new URLSearchParams(location.hash.slice(1)).get("error_description");
  if (authError) { history.replaceState(null, "", "#/hub"); setTimeout(() => toast(authError, "error"), 400); }
  navigate();
  renderNotes();
  startAmbient();
  initAuth();
  idle(startPresence);
}

start();
