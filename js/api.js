// Data layer: anonymous REST reads (no SDK wait), the Supabase client for
// signed-in work, a small cache, and image upload helpers.

const CFG = window.LSPD_CONFIG.supabase;
export const T = CFG.tables;
const REST = CFG.url + "/rest/v1/";
const ANON = { apikey: CFG.anonKey, Authorization: "Bearer " + CFG.anonKey };

export class ApiError extends Error {
  constructor(message, code) {
    super(message || "Request failed");
    this.code = code || "";
  }
}

async function request(url, init, timeout = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok) throw new ApiError(body?.message, body?.code || String(response.status));
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("offline", "offline");
  } finally {
    clearTimeout(timer);
  }
}

/** Read a public table without waiting for the SDK or the auth session. */
export function publicRead(table, params, timeout) {
  return request(REST + table + "?" + new URLSearchParams(params), { headers: ANON }, timeout);
}

export function publicRpc(name, args) {
  return request(REST + "rpc/" + name, {
    method: "POST",
    headers: { ...ANON, "Content-Type": "application/json" },
    body: JSON.stringify(args || {})
  });
}

// ---------------------------------------------------------------- SDK
let sdkPromise = null;

export function sdk() {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const make = () => window.supabase.createClient(CFG.url, CFG.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "ftlspd-supabase-auth-v1" }
    });
    if (window.supabase?.createClient) return resolve(make());
    const script = document.createElement("script");
    script.src = CFG.sdk;
    script.async = true;
    script.onload = () => resolve(make());
    script.onerror = () => { sdkPromise = null; script.remove(); reject(new ApiError("offline", "offline")); };
    document.head.append(script);
  });
  return sdkPromise;
}

/** Await a Supabase query builder and turn `{ error }` into a thrown ApiError. */
export async function run(builder) {
  let result;
  try {
    result = await builder;
  } catch (error) {
    throw new ApiError("offline", "offline");
  }
  if (result.error) {
    const offline = /fetch|network/i.test(result.error.message || "") && !result.error.code;
    throw new ApiError(offline ? "offline" : result.error.message, offline ? "offline" : result.error.code);
  }
  return result;
}

export const db = {
  async insert(table, row) {
    const client = await sdk();
    await run(client.from(table).insert(row));
  },
  async update(table, id, patch) {
    const client = await sdk();
    await run(client.from(table).update(patch).eq("id", id));
  },
  async remove(table, ids) {
    if (!ids.length) return;
    const client = await sdk();
    await run(client.from(table).delete().in("id", ids));
  }
};

// ---------------------------------------------------------------- cache
/**
 * A cached, de-duplicated loader. `peek()` returns what is known right now
 * (memory, or the last visit when `persist` is on) so views paint instantly,
 * then `load()` revalidates when the data is older than `ttl`.
 */
export function resource(key, loader, { ttl = 60000, persist = false } = {}) {
  const storageKey = "lspd-cache-v2:" + key;
  let data;
  let loadedAt = 0;
  let inflight = null;

  if (persist) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved) data = saved;
    } catch (error) { /* ignore a broken cache entry */ }
  }

  const store = () => {
    if (!persist) return;
    try {
      const text = JSON.stringify(data);
      if (text.length < 200000) localStorage.setItem(storageKey, text);
      else localStorage.removeItem(storageKey);
    } catch (error) { /* quota or blocked storage: memory cache still works */ }
  };

  return {
    peek: () => data,
    fresh: () => data !== undefined && Date.now() - loadedAt < ttl,
    load(force) {
      if (!force && this.fresh()) return Promise.resolve(data);
      if (inflight) return inflight;
      inflight = loader().then((next) => {
        data = next;
        loadedAt = Date.now();
        store();
        return next;
      }).finally(() => { inflight = null; });
      return inflight;
    },
    set(next) { data = next; loadedAt = Date.now(); store(); },
    stale() { loadedAt = 0; },
    clear() { data = undefined; loadedAt = 0; if (persist) { try { localStorage.removeItem(storageKey); } catch (error) { /* ignore */ } } }
  };
}

// ---------------------------------------------------------------- images
const UPLOAD_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "video/mp4"];

export const isUploadable = (file) => !file.type || UPLOAD_TYPES.includes(file.type);

function drawToWebp(source, width, height, maxSide, quality) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

/** Shrink a still image to WebP. GIFs and videos are returned untouched. */
export async function compressFile(file, maxSide, quality = 0.82) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const blob = await drawToWebp(bitmap, bitmap.width, bitmap.height, maxSide, quality);
    bitmap.close?.();
    return blob && blob.size < file.size ? blob : file;
  } catch (error) {
    return file;
  }
}

/** Re-encode an image that lives at a URL (or a data: URL). Null when the host blocks access. */
export function compressUrl(url, maxSide, quality = 0.82) {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => drawToWebp(image, image.naturalWidth, image.naturalHeight, maxSide, quality).then(resolve, () => resolve(null));
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

export async function upload(blob, name) {
  const client = await sdk();
  const extension = blob.type === "image/webp" ? "webp" : (String(name || "").split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = String(name || "file").toLowerCase().replace(/\.[^.]*$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "file";
  const path = "media/" + new Date().toISOString().slice(0, 10) + "/" + crypto.randomUUID() + "-" + base + "." + extension;
  const bucket = client.storage.from(CFG.bucket);
  const result = await bucket.upload(path, blob, { cacheControl: "31536000", contentType: blob.type || "application/octet-stream", upsert: false });
  if (result.error) throw new ApiError(result.error.message, "upload");
  return { url: bucket.getPublicUrl(path).data.publicUrl, path };
}

export const isStorageUrl = (url) => String(url || "").startsWith(CFG.url + "/storage/");
