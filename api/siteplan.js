/* Gambar siteplan Master Stock per proyek (disimpan terpisah dari data utama).
   GET  /api/siteplan?p=<nama proyek>  -> { img }
   POST /api/siteplan { p, img }       -> simpan (akun ADMIN dengan akses ke proyek itu) */
const { userFromReq, send, readBody, kvGet, kvSet } = require("./_lib");
const KEY = "chl-monitoring-laporan:siteplan:";
const low = s => String(s || "").trim().toLowerCase();
module.exports = async (req, res) => {
  const user = await userFromReq(req);
  if (!user) return send(res, 401, { error: "Sesi berakhir. Silakan masuk lagi." });
  try {
    if (req.method === "GET") {
      const p = low(new URL(req.url, "http://x").searchParams.get("p"));
      if (!p) return send(res, 400, { error: "Nama proyek kosong" });
      if (user.proyek && !user.proyek.includes(p)) return send(res, 403, { error: "Akun ini tidak punya akses ke proyek tersebut." });
      return send(res, 200, { img: (await kvGet(KEY + p)) || "" });
    }
    if (req.method === "POST") {
      if (user.role !== "ADMIN") return send(res, 403, { error: "Akun Viewer tidak bisa mengubah data." });
      const b = await readBody(req), p = low(b && b.p);
      if (!p) return send(res, 400, { error: "Nama proyek kosong" });
      if (user.proyek && !user.proyek.includes(p)) return send(res, 403, { error: "Akun ini tidak punya akses ke proyek tersebut." });
      if (typeof b.img !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(b.img)) return send(res, 400, { error: "Format gambar tidak didukung" });
      if (b.img.length > 3500000) return send(res, 413, { error: "Gambar terlalu besar" });
      await kvSet(KEY + p, b.img);
      return send(res, 200, { ok: true });
    }
    return send(res, 405, { error: "Metode tidak didukung" });
  } catch (e) {
    return send(res, e.status || 500, { error: e.message || "Gagal mengakses database" });
  }
};
