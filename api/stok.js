/* Data Master Stock per proyek (daftar unit, status, posisi titik), disimpan terpisah dari data utama
   supaya tidak menambah ukuran data utama dan tidak bentrok dengan perubahan admin lain.
   GET  /api/stok?p=<nama proyek>  -> { data }
   POST /api/stok { p, data }      -> simpan (akun ADMIN dengan akses ke proyek itu) */
const { userFromReq, send, readBody, kvGet, kvSet } = require("./_lib");
const KEY = "chl-monitoring-laporan:stok:";
const low = s => String(s || "").trim().toLowerCase();
module.exports = async (req, res) => {
  const user = await userFromReq(req);
  if (!user) return send(res, 401, { error: "Sesi berakhir. Silakan masuk lagi." });
  try {
    if (req.method === "GET") {
      const p = low(new URL(req.url, "http://x").searchParams.get("p"));
      if (!p) return send(res, 400, { error: "Nama proyek kosong" });
      if (user.proyek && !user.proyek.includes(p)) return send(res, 403, { error: "Akun ini tidak punya akses ke proyek tersebut." });
      const v = await kvGet(KEY + p);
      return send(res, 200, { data: v ? JSON.parse(v) : null });
    }
    if (req.method === "POST") {
      if (user.role !== "ADMIN") return send(res, 403, { error: "Akun Viewer tidak bisa mengubah data." });
      const b = await readBody(req), p = low(b && b.p);
      if (!p) return send(res, 400, { error: "Nama proyek kosong" });
      if (user.proyek && !user.proyek.includes(p)) return send(res, 403, { error: "Akun ini tidak punya akses ke proyek tersebut." });
      if (!b.data || typeof b.data !== "object" || !Array.isArray(b.data.units)) return send(res, 400, { error: "Data stock tidak valid" });
      await kvSet(KEY + p, JSON.stringify(b.data));
      return send(res, 200, { ok: true, at: new Date().toISOString(), by: user.nama });
    }
    return send(res, 405, { error: "Metode tidak didukung" });
  } catch (e) {
    return send(res, e.status || 500, { error: e.message || "Gagal mengakses database" });
  }
};
