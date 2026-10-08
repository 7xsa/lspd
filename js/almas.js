// ALMAS: the LSPD portal's page language, written by owners in the CMD tab.
// One instruction per line, in plain English or Arabic. ALMAS never accepts HTML or code:
// every word is escaped and every link, image and button is checked before it is drawn,
// so a page can only ever look like the rest of the site.

export const ICONS = ["hub", "regulations", "sop", "fto", "crew", "media", "streams", "credits", "roster", "admin", "review", "archives", "users", "link", "user-plus", "transfer", "search", "check", "plus", "eye", "external", "discord", "send", "key", "mail", "shield", "warn", "layers", "compass", "car", "file", "code", "star", "bolt", "inbox", "id", "user", "info", "clock", "refresh", "user-shield", "signal", "hourglass", "play", "bell", "globe", "pin", "lock", "wand"];
export const TABS = ["hub", "news", "regulations", "sop", "fto", "roster", "media", "streams", "crew", "credits"];
export const VARIABLES = ["officers", "online", "live", "news", "date", "time", "name", "role"];

// Every command: how to write it and what it does. This one list drives the parser,
// the Docs tab, the editor's insert buttons and the console's autocomplete.
export const COMMANDS = [
  { name: "title", ar: "عنوان", group: "text", syntax: "title Your page title", about: "The big heading at the top of the page.", example: "title Training Center" },
  { name: "kicker", ar: "تمهيد", group: "text", syntax: "kicker Small red line above the title", about: "A short label shown above the title.", example: "kicker LSPD Academy" },
  { name: "subtitle", ar: "وصف", group: "text", syntax: "subtitle One sentence under the title", about: "A larger line of text under the title.", example: "subtitle Everything a new cadet needs in one place." },
  { name: "heading", ar: "قسم", group: "text", syntax: "heading Section name", about: "Starts a new section.", example: "heading Weekly schedule" },
  { name: "text", ar: "نص", group: "text", syntax: "text Any sentence", about: "A paragraph. Write **two stars** around words to make them bold. Links are clickable. Any line that is not a command is also shown as text.", example: "text Training runs every **Monday** and **Friday** at 20:00." },
  { name: "note", ar: "ملاحظة", group: "text", syntax: "note Something to notice", about: "A blue information box.", example: "note Bring your full uniform." },
  { name: "warning", ar: "تحذير", group: "text", syntax: "warning Something important", about: "A yellow warning box.", example: "warning Late arrivals are not admitted." },
  { name: "success", ar: "نجاح", group: "text", syntax: "success Good news", about: "A green box for good news.", example: "success Class 07 graduated with a 100% pass rate." },
  { name: "quote", ar: "اقتباس", group: "text", syntax: 'quote "The words" "Who said it"', about: "A highlighted quote.", example: 'quote "To protect and to serve." "LSPD motto"' },
  { name: "-", ar: "-", group: "text", syntax: "- A list item", about: "Lines starting with a dash become a bullet list.", example: "- Radio discipline\n- Traffic stops\n- Report writing" },
  { name: "|", ar: "|", group: "text", syntax: "| Column | Column |", about: "Lines starting with | become a table. The first line is the header.", example: "| Rank | Points |\n| Officer I | 120 |\n| Officer II | 300 |" },
  { name: "hero", ar: "واجهة", group: "layout", syntax: 'hero "Big title" "Line under it" image https://...', about: "A large banner. The image is optional.", example: 'hero "LSPD Academy" "Train hard. Serve proud."' },
  { name: "box", ar: "صندوق", group: "layout", syntax: 'box "Box title"\n  ...anything...\nend', about: "Groups lines inside a panel. Close it with end.", example: 'box "Requirements"\n- 16 hours on duty\n- Clean record\nend' },
  { name: "columns", ar: "أعمدة", group: "layout", syntax: "columns\n  ...left side...\nnext\n  ...right side...\nend", about: "Puts content side by side. Write next between columns (up to 4).", example: "columns\nheading Day shift\ntext 08:00 to 16:00\nnext\nheading Night shift\ntext 16:00 to 00:00\nend" },
  { name: "divider", ar: "فاصل", group: "layout", syntax: "divider", about: "A thin line between sections.", example: "divider" },
  { name: "space", ar: "مسافة", group: "layout", syntax: "space", about: "Extra empty space.", example: "space" },
  { name: "button", ar: "زر", group: "action", syntax: 'button "Label" -> where\nbutton outline "Label" -> where', about: "A button. Where can be a link (https://...), a tab (news, regulations, sop, roster...), page my-page, apply recruitment, apply transfer or connect. Buttons next to each other sit in one row.", example: 'button "Apply now" -> apply recruitment\nbutton outline "Read the SOP" -> sop' },
  { name: "card", ar: "بطاقة", group: "action", syntax: 'card "Title" "Text" icon star -> where', about: "A clickable card. Icon and where are optional. Cards next to each other form a grid.", example: 'card "Patrol" "Daily briefings" icon car -> roster\ncard "Academy" "Courses and exams" icon fto -> fto' },
  { name: "image", ar: "صورة", group: "media", syntax: 'image https://... "Caption"', about: "A picture from an https link. The caption is optional.", example: 'image https://example.com/photo.jpg "Graduation day"' },
  { name: "video", ar: "فيديو", group: "media", syntax: "video https://.../clip.mp4", about: "An MP4 or WebM video from an https link.", example: "video https://example.com/clip.mp4" },
  { name: "stat", ar: "رقم", group: "live", syntax: 'stat "Label" value', about: "A big number tile. The value can be live: {officers}, {online}, {live}, {news}. Stats next to each other sit in one row.", example: 'stat "Officers" {officers}\nstat "Online now" {online}\nstat "Founded" 2024' },
  { name: "step", ar: "خطوة", group: "live", syntax: 'step "Title" "Text"', about: "A numbered step. Steps next to each other form a timeline.", example: 'step "Apply" "Fill in the form"\nstep "Interview" "Monday or Friday"\nstep "Academy" "Two weeks of training"' },
  { name: "faq", ar: "سؤال", group: "live", syntax: 'faq "Question" "Answer"', about: "A question that opens to show its answer.", example: 'faq "How long is the academy?" "Two weeks, four sessions."' },
  { name: "countdown", ar: "عداد", group: "live", syntax: 'countdown "Label" 2026-12-31 20:00', about: "A live countdown to a date and time (your local time).", example: 'countdown "Next graduation" 2026-12-31 20:00' },
  { name: "show", ar: "اعرض", group: "live", syntax: "show news 3\nshow apply", about: "Shows live parts of the site: the latest news posts, or the recruitment and transfer buttons.", example: "show news 3" },
  { name: "end", ar: "نهاية", group: "layout", syntax: "end", about: "Closes a box or columns.", example: "end" },
  { name: "next", ar: "التالي", group: "layout", syntax: "next", about: "Starts the next column inside columns.", example: "next" }
];

const NAMES = COMMANDS.map((command) => command.name).filter((name) => /^[a-z]+$/.test(name));
const ALIASES = Object.fromEntries(COMMANDS.filter((command) => command.ar !== command.name).map((command) => [command.ar, command.name]));
// Optional wrappers people may write around groups; they only group, so they are accepted and ignored.
const WRAPPERS = { list: "-", cards: "card", stats: "stat", steps: "step", table: "|", buttons: "button", faqs: "faq", "قائمة": "-", "بطاقات": "card", "أرقام": "stat", "خطوات": "step", "جدول": "|" };
const CONTAINERS = ["box", "columns"];

export const TEMPLATE = `kicker LSPD
title New page
subtitle One sentence about what this page is for.

heading About
text Write anything here. Use **two stars** to make words bold.

- First point
- Second point

button "Apply now" -> apply recruitment
button outline "Read the SOP" -> sop
`;

export const EXAMPLE = `hero "LSPD Academy" "Train hard. Serve proud."

stat "Officers" {officers}
stat "Online now" {online}
stat "Founded" 2024

heading How to join
step "Apply" "Fill in the recruitment form"
step "Interview" "Monday or Friday at 20:00"
step "Academy" "Two weeks of training"
step "Patrol" "Ride along with an FTO"

countdown "Next academy class" 2026-12-31 20:00

columns
box "Requirements"
- Discord account linked
- 16 or older
- Clean record
end
next
box "What you learn"
- Radio discipline
- Traffic and felony stops
- Report writing
end
end

card "Police SOP" "The handbook" icon sop -> sop
card "Regulations" "Every rule by degree" icon regulations -> regulations
card "Schedule" "Ranks and points" icon roster -> roster

faq "How long is the academy?" "Two weeks, four sessions."
faq "Can I transfer from another department?" "Yes, use the transfer form."

note Questions? Ask any FTO on duty.
button "Apply now" -> apply recruitment
`;

// ---------------------------------------------------------------- parsing
const esc = (value) => String(value ?? "").replace(/[&<>"'`]/g, (char) => "&#" + char.charCodeAt(0) + ";");
const isUrl = (value) => /^https:\/\/[^\s"'<>`]+$/i.test(value || "") || /^http:\/\/[^\s"'<>`]+$/i.test(value || "");
const isSecureUrl = (value) => /^https:\/\/[^\s"'<>`]+$/i.test(value || "");

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return row[b.length];
}

export function suggest(word, options = NAMES) {
  let best = null;
  for (const option of options) {
    const score = distance(word, option);
    if (score <= Math.max(1, Math.round(option.length / 3)) && (!best || score < best.score)) best = { option, score };
  }
  return best?.option || null;
}

// Splits arguments: "quoted text", “Arabic quotes”, -> and single words.
function tokens(rest) {
  const out = [];
  const re = /"([^"]*)"|“([^”]*)”|«([^»]*)»|(->|→)|(\S+)/g;
  let match;
  while ((match = re.exec(rest))) {
    if (match[4]) out.push({ arrow: true });
    else if (match[5] !== undefined) out.push({ text: match[5], quoted: false });
    else out.push({ text: match[1] ?? match[2] ?? match[3], quoted: true });
  }
  return out;
}

const unquote = (rest) => { const trimmed = rest.trim(); const match = trimmed.match(/^["“«](.*)["”»]$/); return match ? match[1] : trimmed; };

// "-> where": a link, a tab, page slug, apply kind or connect.
function parseTarget(list, fail) {
  if (!list.length) return fail('Say where it goes after ->, for example  -> news  or  -> https://...');
  const [first, second] = list.map((token) => token.text || "");
  const word = first.toLowerCase();
  if (isUrl(first)) return { href: first, external: true };
  if (word === "page" || word === "صفحة") return /^[a-z0-9][a-z0-9-]*$/.test(second || "") ? { href: "#/p/" + second } : fail("Write the page's short name after page, for example  -> page training");
  if (word === "apply" || word === "قدم") return ["recruitment", "transfer"].includes(second) ? { act: "apply", kind: second } : fail("Use  -> apply recruitment  or  -> apply transfer");
  if (word === "connect") return { connect: true };
  if (TABS.includes(word)) return { href: "#/" + word };
  const guess = suggest(word, TABS);
  return fail(`"${first}" is not a tab.` + (guess ? ` Did you mean ${guess}?` : ` Tabs: ${TABS.join(", ")}.`));
}

function splitArrow(list) {
  const at = list.findIndex((token) => token.arrow);
  return at < 0 ? [list, null] : [list.slice(0, at), list.slice(at + 1)];
}

/** Turns ALMAS text into blocks. Returns { blocks, errors: [{ line, message }] }. */
export function parse(source) {
  const lines = String(source || "").replace(/\r/g, "").split("\n");
  const errors = [];
  let i = 0;

  const read = (stops) => {
    const out = [];
    while (i < lines.length) {
      const line = i + 1;
      const raw = lines[i].trim();
      if (!raw || raw.startsWith("#") || raw.startsWith("//")) { i++; continue; }
      const fail = (message) => { errors.push({ line, message }); return null; };

      if (/^-(\s|$)/.test(raw)) {
        const items = [];
        while (i < lines.length && /^-(\s|$)/.test(lines[i].trim())) items.push(lines[i++].trim().replace(/^-\s*/, ""));
        out.push({ type: "list", items, line });
        continue;
      }
      if (raw.startsWith("|")) {
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(lines[i++].trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
        out.push({ type: "table", rows, line });
        continue;
      }

      const spaceAt = raw.search(/\s/);
      const typed = (spaceAt < 0 ? raw : raw.slice(0, spaceAt)).toLowerCase();
      const rest = spaceAt < 0 ? "" : raw.slice(spaceAt + 1).trim();
      const word = ALIASES[typed] || typed;
      if (stops.includes(word)) return out;
      i++;
      if (WRAPPERS[word] !== undefined && !rest) continue;
      if (word === "end" || word === "next") { fail(`"${typed}" has nothing to close here.`); continue; }

      const args = tokens(rest);
      const texts = args.filter((token) => !token.arrow).map((token) => token.text);
      switch (word) {
        case "title": case "kicker": case "subtitle": case "heading": case "text": case "note": case "warning": case "success":
          if (!rest) { fail(`Write something after ${typed}.`); break; }
          out.push({ type: word, text: unquote(rest), line });
          break;
        case "quote":
          if (!texts.length) { fail('Write the quote in quotes, for example  quote "Words" "Who"'); break; }
          out.push({ type: "quote", text: args[0].quoted ? texts[0] : rest, by: args[0].quoted ? texts[1] || "" : "", line });
          break;
        case "hero": {
          const at = texts.findIndex((text) => text.toLowerCase() === "image");
          const image = at >= 0 ? texts[at + 1] : "";
          const words = at >= 0 ? texts.slice(0, at) : texts;
          if (image && !isSecureUrl(image)) fail("The hero image must be an https:// link.");
          out.push({ type: "hero", title: args[0]?.quoted ? words[0] : words.join(" "), text: args[0]?.quoted ? words[1] || "" : "", image: isSecureUrl(image) ? image : "", line });
          break;
        }
        case "divider": case "space":
          out.push({ type: word, line });
          break;
        case "button": {
          const [left, right] = splitArrow(args);
          let style = "red";
          if (left[0] && !left[0].quoted && ["red", "outline", "plain"].includes(left[0].text.toLowerCase())) style = left.shift().text.toLowerCase();
          const label = left.map((token) => token.text).join(" ");
          if (!label) { fail('Give the button a label, for example  button "Apply" -> apply recruitment'); break; }
          if (!right) { fail('Add -> and where the button goes, for example  -> news'); break; }
          const target = parseTarget(right, fail);
          if (target) out.push({ type: "button", label, style, target, line });
          break;
        }
        case "card": {
          const [left, right] = splitArrow(args);
          const parts = left.map((token) => token.text);
          const at = parts.findIndex((text) => text.toLowerCase() === "icon");
          const name = at >= 0 ? (parts[at + 1] || "").toLowerCase() : "";
          const words = at >= 0 ? parts.slice(0, at) : parts;
          if (!words[0]) { fail('Give the card a title, for example  card "Patrol" "Daily briefings"'); break; }
          if (name && !ICONS.includes(name)) fail(`"${name}" is not an icon.` + (suggest(name, ICONS) ? ` Did you mean ${suggest(name, ICONS)}?` : " Type  icons  in the console to see them all."));
          const target = right ? parseTarget(right, fail) : null;
          out.push({ type: "card", title: words[0], text: words.slice(1).join(" "), icon: ICONS.includes(name) ? name : "", target, line });
          break;
        }
        case "image": case "video": {
          const link = texts[0];
          if (!isSecureUrl(link)) { fail(`Put an https:// link after ${typed}.`); break; }
          if (word === "video" && !/\.(mp4|webm)(\?|#|$)/i.test(link)) { fail("Videos must be .mp4 or .webm links."); break; }
          out.push({ type: word, src: link, caption: texts.slice(1).join(" "), line });
          break;
        }
        case "stat":
          if (texts.length < 2) { fail('Write a label and a value, for example  stat "Officers" {officers}'); break; }
          out.push({ type: "stat", label: texts[0], value: texts.slice(1).join(" "), line });
          break;
        case "step": case "faq":
          if (!texts[0]) { fail(`Write it in quotes, for example  ${word} "Title" "Text"`); break; }
          out.push({ type: word, title: texts[0], text: texts.slice(1).join(" "), line });
          break;
        case "countdown": {
          const label = args[0]?.quoted ? texts[0] : "";
          const when = (args[0]?.quoted ? texts.slice(1) : texts).join(" ");
          const match = when.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?$/);
          const at = match ? new Date(+match[1], +match[2] - 1, +match[3], +(match[4] || 0), +(match[5] || 0)) : null;
          if (!at || Number.isNaN(+at)) { fail("Write the date as  2026-12-31 20:00"); break; }
          out.push({ type: "countdown", label, at: at.toISOString(), line });
          break;
        }
        case "show": {
          const what = (texts[0] || "").toLowerCase();
          if (what === "news") out.push({ type: "show", what, n: Math.min(9, Math.max(1, parseInt(texts[1], 10) || 3)), line });
          else if (what === "apply") out.push({ type: "show", what, line });
          else fail("Use  show news 3  or  show apply");
          break;
        }
        case "box": case "columns": {
          const columns = [];
          let closed = false;
          do {
            columns.push(read(["next", "end"]));
            if (i >= lines.length) break;
            const closing = lines[i].trim().split(/\s+/)[0].toLowerCase();
            i++;
            if ((ALIASES[closing] || closing) === "end") { closed = true; break; }
            if (word === "box") fail("next only works inside columns.");
          } while (columns.length < 4);
          if (!closed) fail(`This ${typed} needs an end line to close it.`);
          out.push(word === "box" ? { type: "box", title: unquote(rest), children: columns.flat(), line } : { type: "columns", columns, line });
          break;
        }
        default: {
          // Not a command: a typo of one is reported, anything else is just a sentence.
          const guess = typed.length >= 3 ? suggest(typed) : null;
          // Short lines and lines with quotes or -> look like commands; long sentences are just text.
          if (guess && (args.some((token) => token.quoted || token.arrow) || args.length <= 3)) fail(`"${typed}" is not a command. Did you mean ${guess}?`);
          else out.push({ type: "text", text: raw, line });
        }
      }
    }
    return out;
  };

  const blocks = read([]);
  return { blocks, errors };
}

// ---------------------------------------------------------------- rendering
const GROUPS = { button: "almas-actions actions", card: "quick-grid almas-cards", stat: "tiles almas-stats", step: "almas-steps", faq: "almas-faqs" };

/**
 * Turns blocks into HTML that uses the site's own classes.
 * ctx = { vars: {officers, ...}, t(key), icon(name), lang }
 */
export function render(blocks, ctx) {
  const icon = ctx.icon;
  const fill = (text) => String(text ?? "").replace(/\{(\w+)\}/g, (match, key) => (key in ctx.vars ? String(ctx.vars[key]) : match));
  const inline = (text) => esc(fill(text))
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/https?:\/\/[^\s<]+/g, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
  const at = (block) => `data-line="${block.line}"`;
  const link = (target, inner, className, extra = "") => {
    if (!target) return `<div class="${className}" ${extra}>${inner}</div>`;
    if (target.act) return `<button class="${className}" type="button" data-act="apply" data-kind="${target.kind}" ${extra}>${inner}</button>`;
    if (target.connect) return `<a class="${className}" href="${esc(ctx.connectUrl || "#")}" ${extra}>${inner}</a>`;
    return `<a class="${className}" href="${esc(target.href)}"${target.external ? ' target="_blank" rel="noopener noreferrer"' : ""} ${extra}>${inner}</a>`;
  };

  const one = (block) => {
    switch (block.type) {
      case "kicker": return `<p class="kicker almas-kicker" ${at(block)} dir="auto">${inline(block.text)}</p>`;
      case "title": return `<h1 class="almas-title" ${at(block)} dir="auto">${inline(block.text)}</h1>`;
      case "subtitle": return `<p class="almas-lead" ${at(block)} dir="auto">${inline(block.text)}</p>`;
      case "heading": return `<h2 class="almas-heading" ${at(block)} dir="auto">${inline(block.text)}</h2>`;
      case "text": return `<p class="almas-text" ${at(block)} dir="auto">${inline(block.text)}</p>`;
      case "note": case "warning": case "success": {
        const tone = { note: ["note", "info"], warning: ["warn", "warn"], success: ["ok", "check"] }[block.type];
        return `<div class="callout ${tone[0]}" ${at(block)}>${icon(tone[1])}<p dir="auto">${inline(block.text)}</p></div>`;
      }
      case "quote": return `<blockquote class="almas-quote" ${at(block)} dir="auto">${inline(block.text)}${block.by ? `<cite>${inline(block.by)}</cite>` : ""}</blockquote>`;
      case "list": return `<ul class="sop-list almas-list" ${at(block)}>${block.items.map((item) => `<li dir="auto">${inline(item)}</li>`).join("")}</ul>`;
      case "table": {
        const [head, ...rows] = block.rows;
        return `<div class="sop-table" ${at(block)}><table><thead><tr>${head.map((cell) => `<th dir="auto">${inline(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td dir="auto">${inline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      }
      case "hero": return `<section class="almas-hero" ${at(block)}>${block.image ? `<img class="almas-hero-image" src="${esc(block.image)}" alt="" referrerpolicy="no-referrer">` : ""}<div class="almas-hero-copy"><h1 dir="auto">${inline(block.title)}</h1>${block.text ? `<p dir="auto">${inline(block.text)}</p>` : ""}</div></section>`;
      case "divider": return `<hr class="almas-divider" ${at(block)}>`;
      case "space": return `<div class="almas-space" ${at(block)}></div>`;
      case "button": {
        const style = { red: "btn btn-red", outline: "btn btn-outline", plain: "btn" }[block.style];
        return link(block.target, `<span>${inline(block.label)}</span>${block.target.external ? icon("external") : ""}`, style, at(block));
      }
      case "card": return link(block.target, `${icon(block.icon || "layers")}<strong dir="auto">${inline(block.title)}</strong>${block.text ? `<span dir="auto">${inline(block.text)}</span>` : ""}${block.target ? `<svg class="i go flip"><use href="assets/icons.svg#i-arrow-right"/></svg>` : ""}`, "quick-card", at(block));
      case "image": return `<figure class="almas-figure" ${at(block)}><img src="${esc(block.src)}" alt="${esc(block.caption)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">${block.caption ? `<figcaption dir="auto">${inline(block.caption)}</figcaption>` : ""}</figure>`;
      case "video": return `<figure class="almas-figure" ${at(block)}><video src="${esc(block.src)}" controls preload="metadata" playsinline></video>${block.caption ? `<figcaption dir="auto">${inline(block.caption)}</figcaption>` : ""}</figure>`;
      case "stat": return `<div class="tile" ${at(block)}><span class="tile-text"><b>${inline(block.value)}</b><strong dir="auto">${inline(block.label)}</strong></span></div>`;
      case "step": return `<li ${at(block)}><i></i><b dir="auto">${inline(block.title)}</b>${block.text ? `<small dir="auto">${inline(block.text)}</small>` : ""}</li>`;
      case "faq": return `<details class="sop-qa" ${at(block)}><summary><span class="sop-n">?</span><span class="qa-q" dir="auto">${inline(block.title)}</span>${icon("chevron")}</summary><div class="qa-a"><p dir="auto">${inline(block.text)}</p></div></details>`;
      case "countdown": {
        const units = ["days", "hours", "minutes", "seconds"].map((unit) => `<span><b data-unit="${unit}">0</b><small>${esc(ctx.t("almasUnits")[unit])}</small></span>`).join("");
        return `<section class="almas-countdown" data-countdown="${esc(block.at)}" ${at(block)}>${block.label ? `<p class="kicker" dir="auto">${inline(block.label)}</p>` : ""}<div class="almas-clock">${units}</div></section>`;
      }
      case "show":
        if (block.what === "news") return `<div class="news-strip" data-almas-news="${block.n}" ${at(block)}></div>`;
        return `<div class="actions almas-actions" ${at(block)}><button class="btn btn-red" type="button" data-act="apply" data-kind="recruitment">${icon("user-plus")}<span>${esc(ctx.t("recruitment"))}</span></button><button class="btn btn-outline" type="button" data-act="apply" data-kind="transfer">${icon("transfer")}<span>${esc(ctx.t("transfer"))}</span></button></div>`;
      case "box": return `<section class="panel almas-box" ${at(block)}>${block.title ? `<h2 class="panel-title" dir="auto">${inline(block.title)}</h2>` : ""}${many(block.children)}</section>`;
      case "columns": return `<div class="almas-columns" style="--cols:${block.columns.length}" ${at(block)}>${block.columns.map((column) => `<div class="almas-col">${many(column)}</div>`).join("")}</div>`;
      default: return "";
    }
  };

  // Neighbouring buttons, cards, stats, steps and questions are drawn as one row, grid or timeline.
  const many = (list) => {
    let html = "";
    for (let index = 0; index < list.length;) {
      const type = list[index].type;
      if (GROUPS[type]) {
        let end = index;
        while (end < list.length && list[end].type === type) end++;
        const inner = list.slice(index, end).map(one).join("");
        html += type === "step" ? `<ol class="${GROUPS[type]}">${inner}</ol>` : `<div class="${GROUPS[type]}">${inner}</div>`;
        index = end;
      } else html += one(list[index++]);
    }
    return html;
  };

  return `<div class="almas-page">${many(blocks)}</div>`;
}
