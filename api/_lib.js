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
function users() {
  try { if (process.env.USERS_JSON) return JSON.parse(process.env.USERS_JSON); } catch (e) {}
  return DEFAULT_USERS;
}
const hashPw = (u, pw) => crypto.createHash("sha256").update(SALT + u + ":" + pw).digest("hex");
function findUser(u, pw) {
  const a = users().find(x => x.u === String(u || "").trim().toLowerCase());
  if (!a) return null;
  const ok = a.hash ? crypto.timingSafeEqual(Buffer.from(a.hash), Buffer.from(hashPw(a.u, pw || ""))) : a.pw === pw;
  return ok ? a : null;
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
function userFromReq(req) {
  const t = String(req.headers.authorization || "").replace(/^Bearer /, "");
  const [body, sig] = t.split(".");
  if (!body || !sig) return null;
  const good = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  let p; try { p = JSON.parse(Buffer.from(body, "base64url").toString()); } catch (e) { return null; }
  if (!p.exp || p.exp < Date.now()) return null;
  return users().find(x => x.u === p.u) || null;
}

/* ---------- what a restricted account may read: Weekly data and History of its own projects only ---------- */
function historyVisible(h, user) {
  if (!user.proyek) return true;
  const m = /^weekly:(.+)$/.exec(String(h && h.report || ""));
  return !m || user.proyek.includes(String(m[1]).trim().toLowerCase());
}
function forUser(state, user) {
  if (!state || !user || !user.proyek) return state;
  const out = Object.assign({}, state);
  if (state.weekly) { out.weekly = {}; Object.keys(state.weekly).forEach(k => { if (user.proyek.includes(String(k).trim().toLowerCase())) out.weekly[k] = state.weekly[k]; }); }
  if (Array.isArray(state.history)) out.history = state.history.filter(h => historyVisible(h, user));
  return out;
}
/* ---------- merge: restricted admins only change their own projects ---------- */
const low = s => String(s || "").trim().toLowerCase();
function merge(old, inc, user) {
  if (!user.proyek) return inc;
  const ok = nama => user.proyek.includes(low(nama));
  const out = JSON.parse(JSON.stringify(old));
  /* History: entries this user cannot see (other projects' Weekly) are kept from the stored data */
  const hidden = (old.history || []).filter(h => !historyVisible(h, user));
  out.history = Array.isArray(inc.history) ? [...inc.history, ...hidden].sort((a, b) => String(b.t).localeCompare(String(a.t))).slice(0, 500) : old.history;
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
      return Object.assign({}, o, { base: n.base, bulan: n.bulan, hari: n.hari, stok: user.kunciStok ? o.stok : n.stok, catatan: n.catatan, catatanTampil: n.catatanTampil });
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
module.exports = { findUser, publicUser, signToken, userFromReq, loadDoc, saveDoc, merge, forUser, send, readBody, storageKind };
