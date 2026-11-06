const { findUser, publicUser, signToken, send, readBody, storageKind } = require("./_lib");
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Gunakan POST" });
  let b; try { b = await readBody(req); } catch (e) { return send(res, 400, { error: "Format permintaan salah" }); }
  const a = await findUser(b.username, b.password);
  if (!a) return send(res, 401, { error: "Username atau password salah. Periksa lalu coba lagi." });
  return send(res, 200, { token: signToken(a.u), user: publicUser(a), storage: storageKind() });
};
