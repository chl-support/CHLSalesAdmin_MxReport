/* Shared helpers for the CHL Monitoring Laporan API (Vercel Node functions).
   Storage: Upstash Redis REST (KV_REST_API_* or UPSTASH_REDIS_REST_*) or Neon Postgres (DATABASE_URL / POSTGRES_URL). */
const crypto = require("crypto");

const SALT = "chl-mockup-v1:";
/* Passwords are stored as salted SHA-256 hashes. Override the whole list with the USERS_JSON env var if needed. */
const DEFAULT_USERS = [
  {"u": "admin.chl", "hash": "c39f924db879fee6e3d6191b73bd812d80c881e4641d949c7fc0d08565bbab5d", "nama": "Admin CHL", "role": "ADMIN"},
  {"u": "admin.tsc", "hash": "1a5119082bb0f12134a1b29ae789a17364cf320b510b830dfdb5cad1fbc7d545", "nama": "Admin TSC", "role": "ADMIN", "proyek": ["tanglin parc", "newton springs", "scotts vale", "orchard riviera"], "kunciStok": true},
  {"u": "admin.biodistrict", "hash": "7fb0edc4a878368e2531076fbac9f8899492e09b92b3b595dbc7bb93e6ea32a7", "nama": "Admin Bio District", "role": "ADMIN", "proyek": ["bio district"], "kunciStok": true},
  {"u": "admin.narayabanaraserpong", "hash": "91e56c59466d0fb73759e51a56e4d72c9308e4e5ddbb305a1b146f6aa3f99747", "nama": "Admin Naraya Banara Serpong", "role": "ADMIN", "proyek": ["banara serpong", "naraya serpong", "mazenta residence", "mozenta residence"], "kunciStok": true},
  {"u": "admin.permaiindah", "hash": "619ba20ee737793756076fc8b806aaaf56825db4116df7726bf674762f444d34", "nama": "Admin Permai Indah", "role": "ADMIN", "proyek": ["permai indah"], "kunciStok": true},
  {"u": "viewer.chl", "hash": "8442f9337ac9cbafb2eb2405066fbdf32a4134a87e43c7e9b0d9db787d434822", "nama": "Viewer CHL", "role": "VIEWER"}
];
/* Starting list (used until the user list has been saved to the database by Manajemen User) */
function usersAwal() {
  try { if (process.env.USERS_JSON) return JSON.parse(process.env.USERS_JSON); } catch (e) {}
  return DEFAULT_USERS;
}
const USERS_KEY = "chl-monitoring-laporan:users";
/* User list: from the database when saved there, otherwise the starting list */
async function users() {
  try { const v = await kvGet(USERS_KEY); if (v) { const l = JSON.parse(v); if (Array.isArray(l) && l.length) return l; } } catch (e) {}
  return usersAwal();
}
async function saveUsers(list) { return kvSet(USERS_KEY, JSON.stringify(list)); }
const hashPw = (u, pw) => crypto.createHash("sha256").update(SALT + u + ":" + pw).digest("hex");
function cekPw(a, pw) { return a.hash ? crypto.timingSafeEqual(Buffer.from(a.hash), Buffer.from(hashPw(a.u, pw || ""))) : a.pw === pw; }
async function findUser(u, pw) {
  const a = (await users()).find(x => x.u === String(u || "").trim().toLowerCase());
  if (!a) return null;
  return cekPw(a, pw) ? a : null;
}
const publicUser = a => ({ u: a.u, nama: a.nama, role: a.role, proyek: a.proyek || null, kunciStok: !!a.kunciStok });

/* ---------- storage ---------- */
function storageKind() {
  if ((process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) || (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)) return "redis";
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return "postgres";
  return null;
}
const redisUrl = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
async function redis(cmd) {
  const r = await fetch(redisUrl(), { method: "POST", headers: { Authorization: "Bearer " + redisToken(), "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error("Redis: " + (j.error || r.status));
  return j.result;
}
async function sql(query, params = []) {
  const conn = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const host = new URL(conn).hostname;
  const r = await fetch("https://" + host + "/sql", { method: "POST",
    headers: { "Neon-Connection-String": conn, "Content-Type": "application/json" }, body: JSON.stringify({ query, params }) });
  const j = await r.json();
  if (!r.ok) throw new Error("Postgres: " + (j.message || r.status));
  return j.rows || [];
}
const KEY = "chl-monitoring-laporan:state";
/* Generic key/value (same storage as the data) */
async function kvGet(k) {
  const kind = storageKind();
  if (kind === "redis") return redis(["GET", k]);
  if (kind === "postgres") { await sql("CREATE TABLE IF NOT EXISTS chl_kv (k text PRIMARY KEY, v text NOT NULL)"); const rows = await sql("SELECT v FROM chl_kv WHERE k = $1", [k]); return rows.length ? rows[0].v : null; }
  return null;
}
async function kvSet(k, v) {
  const kind = storageKind();
  if (kind === "redis") return redis(["SET", k, v]);
  if (kind === "postgres") { await sql("CREATE TABLE IF NOT EXISTS chl_kv (k text PRIMARY KEY, v text NOT NULL)"); return sql("INSERT INTO chl_kv (k, v) VALUES ($1, $2) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v", [k, v]); }
  throw Object.assign(new Error("Database belum tersambung ke proyek Vercel."), { status: 503 });
}
async function loadDoc() {
  const k = storageKind();
  if (k === "redis") { const v = await redis(["GET", KEY]); return v ? JSON.parse(v) : null; }
  if (k === "postgres") {
    await sql("CREATE TABLE IF NOT EXISTS chl_kv (k text PRIMARY KEY, v text NOT NULL)");
    const rows = await sql("SELECT v FROM chl_kv WHERE k = $1", [KEY]);
    return rows.length ? JSON.parse(rows[0].v) : null;
  }
  throw Object.assign(new Error("Database belum tersambung ke proyek Vercel."), { status: 503 });
}
async function saveDoc(doc) {
  const k = storageKind(), v = JSON.stringify(doc);
  if (k === "redis") return redis(["SET", KEY, v]);
  if (k === "postgres") return sql("INSERT INTO chl_kv (k, v) VALUES ($1, $2) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v", [KEY, v]);
  throw Object.assign(new Error("Database belum tersambung ke proyek Vercel."), { status: 503 });
}

/* ---------- auth tokens ---------- */
const secret = () => process.env.AUTH_SECRET || redisToken() || process.env.DATABASE_URL || process.env.POSTGRES_URL || "chl-mockup-secret";
const b64 = s => Buffer.from(s).toString("base64url");
function signToken(u) {
  const body = b64(JSON.stringify({ u, exp: Date.now() + 12 * 3600e3 }));
  return body + "." + crypto.createHmac("sha256", secret()).update(body).digest("base64url");
}
async function userFromReq(req) {
  const t = String(req.headers.authorization || "").replace(/^Bearer /, "");
  const [body, sig] = t.split(".");
  if (!body || !sig) return null;
  const good = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  let p; try { p = JSON.parse(Buffer.from(body, "base64url").toString()); } catch (e) { return null; }
  if (!p.exp || p.exp < Date.now()) return null;
  return (await users()).find(x => x.u === p.u) || null;
}

/* ---------- what a restricted account may read: Weekly data and History of its own projects only ---------- */
const lowS = s => String(s || "").trim().toLowerCase();
/* Names of every project in the data (sales, BAST, Weekly), to filter History text */
function projectNames(state) {
  const n = new Set();
  ((state.sales2 || {}).proyek || []).forEach(p => n.add(p.nama));
  (state.proyek || []).forEach(p => n.add(p.nama));
  Object.keys(state.weekly || {}).forEach(k => n.add(k));
  return [...n].filter(Boolean);
}
/* A History line is visible when it does not mention a project of someone else */
const itemVisible = (txt, user, names) => !names.some(nm => !user.proyek.includes(lowS(nm)) && String(txt).toLowerCase().includes(lowS(nm)));
function historyVisible(h, user, names) {
  if (!user.proyek) return true;
  const m = /^weekly:(.+)$/.exec(String(h && h.report || ""));
  if (m) return user.proyek.includes(lowS(m[1]));
  return !(h.items || []).length || (h.items || []).some(t => itemVisible(t, user, names || []));
}
/* What a restricted account may read: only its own projects (sales, BAST, Weekly, History) */
function forUser(state, user) {
  if (!state || !user || !user.proyek) return state;
  const ok = nama => user.proyek.includes(lowS(nama)), names = projectNames(state);
  const out = Object.assign({}, state);
  if (state.sales2) {
    const s2 = Object.assign({}, state.sales2), ids = new Set((state.sales2.proyek || []).filter(p => ok(p.nama)).map(p => p.id));
    s2.proyek = (state.sales2.proyek || []).filter(p => ok(p.nama));
    ["batal", "hold", "pindah", "ganti"].forEach(j => { if (Array.isArray(state.sales2[j])) s2[j] = state.sales2[j].filter(x => ids.has(x.proyekId)); });
    out.sales2 = s2;
  }
  if (state.proyek) {
    const bids = new Set(state.proyek.filter(p => ok(p.nama)).map(p => p.id));
    out.proyek = state.proyek.filter(p => ok(p.nama));
    out.laporan = {};
    Object.keys(state.laporan || {}).forEach(d => { const r = (state.laporan[d] || []).filter(x => bids.has(x.proyekId)); if (r.length) out.laporan[d] = r; });
  }
  if (state.weekly) { out.weekly = {}; Object.keys(state.weekly).forEach(k => { if (ok(k)) out.weekly[k] = state.weekly[k]; }); }
  if (Array.isArray(state.history)) out.history = state.history.filter(h => historyVisible(h, user, names))
    .map(h => /^weekly:/.test(h.report) ? h : Object.assign({}, h, { items: (h.items || []).filter(t => itemVisible(t, user, names)) }));
  return out;
}
/* ---------- merge: restricted admins only change their own projects ---------- */
const low = s => String(s || "").trim().toLowerCase();
function merge(old, inc, user) {
  if (!user.proyek) return inc;
  const ok = nama => user.proyek.includes(low(nama));
  const out = JSON.parse(JSON.stringify(old));
  /* History: stored entries stay complete (the user only received a filtered copy); new entries from the request are added */
  const kunci = h => `${h.t}|${h.report}|${h.oleh}|${h.bagian}`, ada = new Set((old.history || []).map(kunci));
  const baru = (Array.isArray(inc.history) ? inc.history : []).filter(h => !ada.has(kunci(h)));
  out.history = [...baru, ...(old.history || [])].sort((a, b) => String(b.t).localeCompare(String(a.t))).slice(0, 500);
  /* BAST: rows of allowed projects come from the request, others stay as stored */
  const bastNama = id => ((old.proyek || []).find(p => p.id === id) || {}).nama;
  const dates = new Set([...Object.keys(old.laporan || {}), ...Object.keys(inc.laporan || {})]);
  out.laporan = {};
  dates.forEach(d => {
    const keep = ((old.laporan || {})[d] || []).filter(r => !ok(bastNama(r.proyekId)));
    const mine = ((inc.laporan || {})[d] || []).filter(r => ok(bastNama(r.proyekId)));
    const rows = [...keep, ...mine];
    if (rows.length) out.laporan[d] = rows;
  });
  /* Sales: numbers of allowed projects come from the request; names, groups, order, and (if locked) stock stay */
  if (old.sales2 && inc.sales2) {
    out.sales2.tanggal = inc.sales2.tanggal || old.sales2.tanggal;
    out.sales2.hariTanggal = inc.sales2.hariTanggal || old.sales2.hariTanggal;
    out.sales2.proyek = old.sales2.proyek.map(o => {
      const n = (inc.sales2.proyek || []).find(x => x.id === o.id);
      if (!n || !ok(o.nama)) return o;
      /* tahun & arsip ikut disimpan (pergantian tahun); arsip lama tidak pernah dibuang */
      const arsip = Object.assign({}, o.arsip || {}, n.arsip || {});
      return Object.assign({}, o, { base: n.base, bulan: n.bulan, hari: n.hari, stok: user.kunciStok ? o.stok : n.stok, catatan: n.catatan, catatanTampil: n.catatanTampil,
        tahun: n.tahun || o.tahun, arsip, holdWk: n.holdWk || o.holdWk });
    });
    const salesNama = id => ((old.sales2.proyek || []).find(p => p.id === id) || {}).nama;
    ["batal", "hold", "pindah", "ganti"].forEach(j => {
      const keep = (old.sales2[j] || []).filter(x => !ok(salesNama(x.proyekId)));
      const mine = (inc.sales2[j] || []).filter(x => ok(salesNama(x.proyekId)));
      out.sales2[j] = [...keep, ...mine];
    });
  }
  /* Weekly: data per proyek; hanya proyek yang diizinkan yang diambil dari request */
  if (inc.weekly) {
    out.weekly = Object.assign({}, old.weekly || {});
    Object.keys(inc.weekly).forEach(k => { if (ok(k)) out.weekly[k] = inc.weekly[k]; });
    /* Data awal yang belum ada di server boleh ditambahkan oleh siapa saja (tidak menimpa) */
    Object.keys(inc.weekly).forEach(k => { if (!out.weekly[k]) out.weekly[k] = inc.weekly[k]; });
  }
  return out;
}

function send(res, status, obj) { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(obj)); }
async function readBody(req) {
  if (req.body !== undefined) return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  const chunks = []; for await (const c of req) chunks.push(c);
  const s = Buffer.concat(chunks).toString(); return s ? JSON.parse(s) : {};
}
module.exports = { findUser, publicUser, signToken, userFromReq, loadDoc, saveDoc, merge, forUser, send, readBody, storageKind, users, saveUsers, hashPw, cekPw };
