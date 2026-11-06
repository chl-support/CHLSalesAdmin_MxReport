/* User management.
   - Every signed-in account: change its own password (needs the current password).
   - admin.chl only: list users, add / edit (name, role, project access, stock lock), reset password, delete.
   Passwords are stored only as salted hashes; they are never returned. */
const { userFromReq, users, saveUsers, hashPw, cekPw, publicUser, send, readBody } = require("./_lib");

const PENGELOLA = "admin.chl";
const low = s => String(s || "").trim().toLowerCase();
const pwOk = pw => typeof pw === "string" && pw.length >= 6 && pw.length <= 100;
const daftar = list => list.map(a => publicUser(a));

module.exports = async (req, res) => {
  const me = await userFromReq(req);
  if (!me) return send(res, 401, { error: "Sesi berakhir. Silakan masuk lagi." });
  const kelola = me.u === PENGELOLA;
  try {
    const list = (await users()).map(a => Object.assign({}, a));
    if (req.method === "GET") {
      if (!kelola) return send(res, 403, { error: "Hanya admin.chl yang bisa membuka Manajemen User." });
      return send(res, 200, { users: daftar(list) });
    }
    if (req.method !== "POST") return send(res, 405, { error: "Gunakan GET atau POST" });
    let b; try { b = await readBody(req); } catch (e) { return send(res, 400, { error: "Format permintaan salah" }); }
    const simpan = async () => { await saveUsers(list); return send(res, 200, { ok: true, users: kelola ? daftar(list) : undefined }); };

    /* Ubah password sendiri */
    if (b.action === "password") {
      const a = list.find(x => x.u === me.u);
      if (!a || !cekPw(a, b.lama)) return send(res, 400, { error: "Password lama salah." });
      if (!pwOk(b.baru)) return send(res, 400, { error: "Password baru minimal 6 karakter." });
      if (b.baru === b.lama) return send(res, 400, { error: "Password baru harus berbeda dari password lama." });
      a.hash = hashPw(a.u, b.baru); delete a.pw;
      return simpan();
    }

    if (!kelola) return send(res, 403, { error: "Hanya admin.chl yang bisa mengelola user." });

    /* Tambah / ubah user */
    if (b.action === "simpan") {
      const x = b.user || {}, u = low(x.u);
      if (!/^[a-z0-9._-]{3,40}$/.test(u)) return send(res, 400, { error: "Username 3–40 karakter: huruf kecil, angka, titik, garis bawah, atau strip." });
      const nama = String(x.nama || "").trim().slice(0, 60);
      if (!nama) return send(res, 400, { error: "Nama yang tampil wajib diisi." });
      const role = x.role === "VIEWER" ? "VIEWER" : "ADMIN";
      const proyek = Array.isArray(x.proyek) && x.proyek.length ? [...new Set(x.proyek.map(low).filter(Boolean))] : null;
      let a = list.find(y => y.u === u);
      if (u === PENGELOLA && (role !== "ADMIN" || proyek)) return send(res, 400, { error: "admin.chl harus tetap Admin dengan akses semua proyek." });
      if (!a) {
        if (!b.baru) return send(res, 400, { error: "Isi password untuk user baru." });
        a = { u }; list.push(a);
      }
      if (b.baru) { if (!pwOk(b.baru)) return send(res, 400, { error: "Password minimal 6 karakter." }); a.hash = hashPw(u, b.baru); delete a.pw; }
      a.nama = nama; a.role = role;
      if (proyek && role === "ADMIN") a.proyek = proyek; else delete a.proyek;
      if (x.kunciStok && a.proyek) a.kunciStok = true; else delete a.kunciStok;
      return simpan();
    }

    /* Reset password user lain */
    if (b.action === "reset") {
      const a = list.find(y => y.u === low(b.u));
      if (!a) return send(res, 404, { error: "User tidak ditemukan." });
      if (!pwOk(b.baru)) return send(res, 400, { error: "Password minimal 6 karakter." });
      a.hash = hashPw(a.u, b.baru); delete a.pw;
      return simpan();
    }

    /* Hapus user */
    if (b.action === "hapus") {
      const u = low(b.u);
      if (u === PENGELOLA) return send(res, 400, { error: "admin.chl tidak bisa dihapus." });
      const i = list.findIndex(y => y.u === u);
      if (i < 0) return send(res, 404, { error: "User tidak ditemukan." });
      list.splice(i, 1);
      return simpan();
    }
    return send(res, 400, { error: "Permintaan tidak dikenal." });
  } catch (e) {
    return send(res, e.status || 500, { error: e.message || "Terjadi kesalahan di server." });
  }
};
