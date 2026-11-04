const { userFromReq, loadDoc, saveDoc, merge, send, readBody } = require("./_lib");
module.exports = async (req, res) => {
  const user = userFromReq(req);
  if (!user) return send(res, 401, { error: "Sesi berakhir. Silakan masuk lagi." });
  try {
    if (req.method === "GET") {
      const doc = await loadDoc();
      return send(res, 200, doc ? { version: doc.v, state: doc.data, updatedAt: doc.at, by: doc.by } : { version: 0, state: null });
    }
    if (req.method === "POST") {
      if (user.role !== "ADMIN") return send(res, 403, { error: "Akun Viewer tidak bisa mengubah data." });
      const b = await readBody(req);
      if (!b || typeof b.state !== "object") return send(res, 400, { error: "Data kosong" });
      const doc = await loadDoc();
      if (doc && b.version !== doc.v) return send(res, 409, { error: "Data sudah diubah pengguna lain.", version: doc.v, state: doc.data, updatedAt: doc.at, by: doc.by });
      if (!doc && user.proyek) return send(res, 403, { error: "Data awal harus disimpan oleh Admin CHL terlebih dahulu." });
      const data = doc ? merge(doc.data, b.state, user) : b.state;
      const next = { v: (doc ? doc.v : 0) + 1, data, at: new Date().toISOString(), by: user.nama };
      await saveDoc(next);
      return send(res, 200, { version: next.v, state: next.data, updatedAt: next.at, by: next.by });
    }
    return send(res, 405, { error: "Metode tidak didukung" });
  } catch (e) {
    return send(res, e.status || 500, { error: e.message || "Gagal mengakses database" });
  }
};
