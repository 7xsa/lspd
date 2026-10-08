// Interface feedback: synthesized sound effects (no audio files) and light
// pointer effects. Everything here is optional and cheap: one shared
// AudioContext, one delegated listener per event type, no layout reads in loops.

const FEATURES = window.LSPD_CONFIG.features || {};
const PREFS_KEY = "lspd-prefs-v2";

export const prefs = { sound: FEATURES.sounds !== false, volume: FEATURES.soundVolume ?? 0.5, motion: FEATURES.animations !== false, red: "", blue: "" };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS_KEY) || "{}")); } catch (error) { /* defaults */ }

export function savePrefs(patch) {
  Object.assign(prefs, patch);
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (error) { /* ignore */ }
  document.documentElement.classList.toggle("no-motion", !motionOn());
  if (master) master.gain.value = prefs.volume * 0.5;
}

export const motionOn = () => prefs.motion !== false && FEATURES.animations !== false && !matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------------- sound
let ctx = null;
let master = null;

function unlock() {
  if (ctx || !prefs.sound) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = prefs.volume * 0.5;
    master.connect(ctx.destination);
  } catch (error) { ctx = null; }
}

// [frequency Hz, peak gain, seconds, wave, delay seconds, end frequency]
const SOUNDS = {
  hover:   [[1900, 0.018, 0.035, "sine"]],
  click:   [[520, 0.09, 0.06, "triangle", 0, 300]],
  nav:     [[380, 0.08, 0.07, "triangle"], [760, 0.05, 0.09, "sine", 0.045]],
  open:    [[300, 0.07, 0.09, "sine", 0, 620]],
  close:   [[620, 0.06, 0.09, "sine", 0, 280]],
  toggle:  [[900, 0.05, 0.04, "square"]],
  success: [[523, 0.08, 0.1, "sine"], [784, 0.08, 0.16, "sine", 0.08]],
  error:   [[196, 0.1, 0.14, "sawtooth", 0, 130]],
  connect: [[220, 0.08, 0.12, "triangle"], [440, 0.07, 0.12, "triangle", 0.09], [880, 0.06, 0.22, "sine", 0.18]]
};

const lastPlayed = {};

export function play(name) {
  if (!prefs.sound || !ctx) return;
  const now = performance.now();
  if (now - (lastPlayed[name] || 0) < (name === "hover" ? 70 : 40)) return;
  lastPlayed[name] = now;
  if (ctx.state === "suspended") ctx.resume();
  for (const [freq, peak, length, wave, delay = 0, endFreq] of SOUNDS[name] || SOUNDS.click) {
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + length);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + length + 0.02);
  }
}

// ---------------------------------------------------------------- pointer effects
const HOVER_SOUND = "a, button, summary, select, .card";
const GLOW = ".card, .tile, .panel-glow";

export function initFeedback() {
  addEventListener("pointerdown", unlock, { once: true, passive: true });
  addEventListener("keydown", unlock, { once: true, passive: true });

  document.addEventListener("pointerover", (event) => {
    if (event.pointerType !== "mouse") return;
    const target = event.target.closest?.(HOVER_SOUND);
    if (target && !target.contains(event.relatedTarget) && !target.disabled) play("hover");
  }, { passive: true });

  // Pointer-follow highlight: writes two CSS variables on the hovered card, at most once per frame.
  let frame = 0;
  let last = null;
  document.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || !motionOn()) return;
    last = event;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const target = last.target.closest?.(GLOW);
      if (!target) return;
      const box = target.getBoundingClientRect();
      target.style.setProperty("--mx", (last.clientX - box.left) + "px");
      target.style.setProperty("--my", (last.clientY - box.top) + "px");
    });
  }, { passive: true });

  // Ripple on buttons.
  document.addEventListener("pointerdown", (event) => {
    const button = event.target.closest?.(".btn, .tab, .chip-btn");
    if (!button || button.disabled || !motionOn()) return;
    const box = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = (event.clientX - box.left) + "px";
    ripple.style.top = (event.clientY - box.top) + "px";
    button.append(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  }, { passive: true });
}

/** Animate a number from its current text to `value`. */
export function countTo(node, value) {
  if (!node) return;
  const target = Number(value) || 0;
  const from = Number(node.textContent) || 0;
  if (!motionOn() || from === target) { node.textContent = String(target); return; }
  const started = performance.now();
  const duration = 500;
  const tick = (now) => {
    const progress = Math.min(1, (now - started) / duration);
    node.textContent = String(Math.round(from + (target - from) * (1 - Math.pow(1 - progress, 3))));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
