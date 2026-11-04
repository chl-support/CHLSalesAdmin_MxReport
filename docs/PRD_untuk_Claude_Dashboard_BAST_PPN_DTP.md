# PRD untuk Claude: Dashboard BAST PPN DTP

4 November 2026

Salin seluruh isi dokumen ini ke Claude sebagai prompt untuk membangun aplikasi Dashboard BAST PPN DTP.

## 1. Instruksi untuk Claude

Kamu adalah full-stack engineer senior. Tugasmu: bangun aplikasi web **Dashboard BAST PPN DTP** sesuai spesifikasi di dokumen ini, sampai bisa dijalankan secara lokal.

Cara kerja:

1. Baca seluruh dokumen sebelum menulis kode.
2. Jika ada hal yang ambigu, tulis asumsimu di bagian awal jawaban, lalu lanjutkan. Jangan berhenti untuk bertanya kecuali spesifikasi saling bertentangan.
3. Ikuti nama tabel, nama kolom, rumus, dan teks antarmuka persis seperti tertulis. Bahasa antarmuka: Bahasa Indonesia.
4. Jangan menambah fitur di luar dokumen ini.
5. Pastikan semua kriteria penerimaan di bagian 8 terpenuhi, dan tulis test untuk aturan perhitungan di bagian 5.

## 2. Konteks produk

Perusahaan properti melaporkan progres BAST (Berita Acara Serah Terima) unit setiap hari, dipisah per **periode PPN DTP** (PPN Ditanggung Pemerintah), per **proyek**, dan per jenis: **BAST PPN DTP** dan **BAST Non PPN DTP**. Saat ini laporan dikirim sebagai teks WhatsApp dan file Excel.

Aplikasi ini menggantikan keduanya: admin mengisi data harian, lalu aplikasi menampilkan dashboard dan menghasilkan ekspor Excel serta teks WhatsApp.

Pengguna:

| Peran | Hak akses |
| --- | --- |
| `ADMIN` | Input, ubah, hapus data BAST; kelola master periode dan proyek; lihat dan ekspor |
| `VIEWER` | Lihat dashboard, ekspor Excel, salin teks WhatsApp |

Istilah: "Total X unit dari Y unit" berarti X unit sudah BAST (kumulatif) dari Y unit pada periode dan proyek itu.

## 3. Stack teknis dan struktur proyek

| Lapisan | Pilihan |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript |
| Tampilan | Tailwind CSS, font Archivo dari Google Fonts |
| Database | PostgreSQL lewat Prisma ORM |
| Login | Auth.js (NextAuth) dengan email + password, peran `ADMIN` / `VIEWER` |
| Validasi | Zod, dipakai di form dan di server |
| Ekspor Excel | ExcelJS |
| Test | Vitest untuk logika perhitungan |

Struktur folder yang diharapkan:

```
app/
  (auth)/login/page.tsx
  dashboard/page.tsx          // dashboard, query ?tanggal=YYYY-MM-DD
  input/page.tsx              // form input harian (ADMIN)
  master/page.tsx             // kelola periode & proyek (ADMIN)
  api/export/route.ts         // unduh Excel
lib/
  hitung.ts                   // semua rumus bagian 5, fungsi murni
  teks-whatsapp.ts            // format teks bagian 7
prisma/
  schema.prisma
  seed.ts                     // data awal bagian 4
tests/
  hitung.test.ts
```

Semua perhitungan ada di `lib/hitung.ts` sebagai fungsi murni, dipakai bersama oleh dashboard, ekspor Excel, dan teks WhatsApp agar angkanya selalu sama.

## 4. Model data dan data awal

Gunakan skema Prisma berikut sebagai dasar:

```
model Periode {
  id        Int      @id @default(autoincrement())
  nama      String   @unique   // contoh: "Nov-2023 s.d Des-2024"
  mulai     DateTime
  selesai   DateTime
  urutan    Int
  bast      BastHarian[]
}

model Proyek {
  id      Int      @id @default(autoincrement())
  nama    String   @unique     // contoh: "Naraya Serpong"
  urutan  Int
  aktif   Boolean  @default(true)
  bast    BastHarian[]
}

model BastHarian {
  id                  Int      @id @default(autoincrement())
  tanggalLaporan      DateTime @db.Date
  periodeId           Int
  proyekId            Int
  bastPpnDtp          Int      @default(0)
  totalUnitPpnDtp     Int      @default(0)
  bastNonPpnDtp       Int      @default(0)
  totalUnitNonPpnDtp  Int      @default(0)
  keterangan          String?
  dibuatOleh          String
  diubahPada          DateTime @updatedAt
  periode             Periode  @relation(fields: [periodeId], references: [id])
  proyek              Proyek   @relation(fields: [proyekId], references: [id])
  @@unique([tanggalLaporan, periodeId, proyekId])
}

model AuditLog {
  id        Int      @id @default(autoincrement())
  userEmail String
  aksi      String   // CREATE | UPDATE | DELETE
  tabel     String
  dataLama  Json?
  dataBaru  Json?
  waktu     DateTime @default(now())
}
```

Aturan validasi: semua angka unit bilangan bulat ≥ 0, `bastPpnDtp ≤ totalUnitPpnDtp`, dan `bastNonPpnDtp ≤ totalUnitNonPpnDtp`.

**Data awal untuk `seed.ts`** (tanggal laporan 2026-11-03; urutan proyek: Naraya Serpong 1, Bio District 2, Mazenta Residence 3, Banara Serpong 4):

```csv
periode,mulai,selesai,proyek,bastPpnDtp,totalUnitPpnDtp,bastNonPpnDtp,totalUnitNonPpnDtp
Nov-2023 s.d Des-2024,2023-11-01,2024-12-31,Naraya Serpong,13,13,8,8
Nov-2023 s.d Des-2024,2023-11-01,2024-12-31,Bio District,17,17,0,0
Jan-2025 s.d Des-2025,2025-01-01,2025-12-31,Mazenta Residence,1,1,0,0
Jan-2025 s.d Des-2025,2025-01-01,2025-12-31,Naraya Serpong,0,0,2,2
Jan-2025 s.d Des-2025,2025-01-01,2025-12-31,Bio District,6,6,1,2
Jan-2026 s.d Des-2026,2026-01-01,2026-12-31,Naraya Serpong,1,2,0,0
Jan-2026 s.d Des-2026,2026-01-01,2026-12-31,Banara Serpong,0,1,0,0
Jan-2026 s.d Des-2026,2026-01-01,2026-12-31,Bio District,2,7,0,3
Jan-2026 s.d Des-2026,2026-01-01,2026-12-31,Mazenta Residence,2,2,0,0
```

Seed juga membuat dua akun contoh: `admin@contoh.local` (ADMIN) dan `viewer@contoh.local` (VIEWER), password dibaca dari variabel lingkungan `SEED_PASSWORD`.

## 5. Aturan perhitungan dan status

Semua angka dihitung dari baris `BastHarian` dengan `tanggalLaporan` yang dipilih. Untuk satu kumpulan baris:

```
bast   = Σ bastPpnDtp + Σ bastNonPpnDtp
total  = Σ totalUnitPpnDtp + Σ totalUnitNonPpnDtp
persen = total = 0 ? 0 : round(bast / total × 100)
sisa   = total − bast
```

| Angka di dashboard | Kumpulan baris |
| --- | --- |
| Kartu Total BAST | Semua baris |
| Kartu BAST PPN DTP | Semua baris, hanya kolom PPN DTP |
| Kartu BAST Non PPN DTP | Semua baris, hanya kolom Non PPN DTP |
| Kartu Belum BAST | `sisa` dari semua baris; persen = sisa ÷ total |
| Progres per periode | Baris dengan periode itu |
| Progres per proyek | Baris dengan proyek itu, semua periode |
| Baris tabel rincian | Satu baris periode + proyek |

Status untuk setiap baris rincian (cek dari atas ke bawah, ambil yang pertama cocok):

| Kondisi | Teks status | Warna |
| --- | --- | --- |
| total = 0 | Tidak ada unit | `#8A9893` abu-abu |
| bast ≥ total | Selesai | `#1F8A55` hijau |
| bast = 0 | Belum · sisa {total} | `#C0392B` merah |
| lainnya | Sisa {sisa} unit | `#C98A12` oranye |

Format angka: 0 ditampilkan sebagai "–" di tabel dan teks WhatsApp; persentase tanpa desimal.

## 6. Spesifikasi tampilan

Halaman `/dashboard` disusun dari atas ke bawah, lebar maksimal 1080 px, responsif sampai lebar 360 px.

| Urutan | Komponen | Isi |
| --- | --- | --- |
| 1 | Header | Latar navy. Label kiri atas "LAPORAN BAST" dan tanggal kanan atas (contoh "3 November 2026") di kotak biru. Judul "REPORT BAST PROGRAM PPN DTP" huruf besar tebal. Subjudul "Perubahan hari ini (03-11-2026)". Strip bawah: "Data BAST 4 proyek • 3 periode PPN DTP", tombol "Salin teks laporan", pilihan tanggal |
| 2 | 4 kartu KPI | Total BAST (garis kiri emas), BAST PPN DTP (biru), BAST Non PPN DTP (hijau), Belum BAST (merah). Isi: label huruf besar kecil, angka besar "53 / 64 unit", persen berwarna, keterangan "Sisa 7 unit" |
| 3 | Progres BAST per periode | Satu baris per periode: nama, batang gradasi selebar persen, "38 / 38 unit", persen |
| 4 | Progres BAST per proyek | Sama seperti nomor 3, satu baris per proyek, diurutkan dari total unit terbesar |
| 5 | Rincian per periode & proyek | Tabel. Header navy 2 baris: Proyek · BAST PPN DTP (BAST, Unit) · BAST Non PPN DTP (BAST, Unit) · Total (BAST, Status). Baris grup "PERIODE PPN DTP (…)" berlatar biru muda dengan garis kiri berwarna. Baris TOTAL tebal di bawah. Tampilkan hanya proyek yang punya baris pada periode itu |
| 6 | Catatan penting | Kotak biru muda, daftar otomatis setiap baris dengan sisa unit, contoh "Bio District (Jan-2026 s.d Des-2026): BAST PPN DTP sisa 5 unit dari 7 unit." |

Token warna:

| Token | Hex | Dipakai untuk |
| --- | --- | --- |
| navy | `#0D2A57` | Header, header tabel |
| navy-2 | `#163A70` | Strip header |
| biru | `#2A6FC0` | Label tanggal, persen, kartu PPN DTP |
| hijau | `#1F8A55` | Kartu Non PPN DTP, status Selesai |
| emas | `#C98A12` | Kartu Total, status Sisa |
| merah | `#C0392B` | Kartu Belum BAST, status Belum |
| biru muda | `#E8EEF7` | Baris grup, baris total, catatan |
| garis | `#DFE4EC` | Pemisah baris |

Di ponsel: kartu KPI 2 kolom (1 kolom di bawah 400 px), batang progres pindah ke bawah nama, tabel bisa digeser ke samping. Sediakan mode gelap lewat `prefers-color-scheme` dengan kontras yang tetap terbaca.

## 7. Fitur dan alur pengguna

**Input harian (`/input`, ADMIN)**

1. Admin memilih tanggal laporan (default hari ini).
2. Jika tanggal itu belum punya data, tombol "Salin dari laporan sebelumnya" mengisi form dengan baris tanggal terakhir.
3. Form berbentuk tabel yang bisa ditambah barisnya: Periode (dropdown), Proyek (dropdown, hanya yang aktif), 4 kolom angka, Keterangan.
4. Baris yang melanggar validasi diberi tanda merah dengan pesan "BAST melebihi total" atau "Isi angka bulat 0 atau lebih". Tombol Simpan nonaktif selama ada error.
5. Simpan menulis semua baris dalam satu transaksi dan mencatat `AuditLog`. Muncul pesan "Laporan 03-11-2026 tersimpan".

**Master (`/master`, ADMIN)**: tambah, ubah nama, ubah urutan, dan nonaktifkan periode serta proyek. Data yang sudah dipakai tidak boleh dihapus, hanya dinonaktifkan.

**Dashboard (`/dashboard`)**: tampil sesuai bagian 6 untuk tanggal terpilih (default tanggal terbaru yang punya data).

**Salin teks laporan**: menyalin teks berikut ke clipboard, dengan urutan periode dan proyek sesuai kolom `urutan`, angka 0 ditulis "-":

```
*Report BAST Program PPN DTP*
Perubahan Hari ini (03-11-2026)

*Periode PPN DTP (Nov-2023 s.d Des-2024)*
*NARAYA SERPONG*
BAST PPN DTP
    Total 13 unit dari 13 unit
BAST Non PPN DTP
    Total 8 unit dari 8 unit
...
```

**Ekspor Excel (`/api/export?tanggal=YYYY-MM-DD`)**: file `Report_BAST_PPN_DTP_YYYY-MM-DD.xlsx` dengan 2 sheet: "Report" (layout dan warna bagian 6, font Arial) dan "Data" (baris mentah untuk tanggal itu).

## 8. Kriteria penerimaan dan data uji

Dengan data seed tanggal 2026-11-03, dashboard, ekspor Excel, dan test di `tests/hitung.test.ts` harus menghasilkan angka berikut:

| Bagian | Hasil yang diharapkan |
| --- | --- |
| Kartu Total BAST | 53 / 64 unit · 83% |
| Kartu BAST PPN DTP | 42 / 49 unit · 86% · Sisa 7 unit |
| Kartu BAST Non PPN DTP | 11 / 15 unit · 73% · Sisa 4 unit |
| Kartu Belum BAST | 11 unit · 17% |
| Periode Nov-2023 s.d Des-2024 | 38 / 38 unit · 100% |
| Periode Jan-2025 s.d Des-2025 | 10 / 11 unit · 91% |
| Periode Jan-2026 s.d Des-2026 | 5 / 15 unit · 33% |
| Proyek (urutan tampil) | Bio District 26 / 35 (74%), Naraya Serpong 24 / 25 (96%), Mazenta Residence 3 / 3 (100%), Banara Serpong 0 / 1 (0%) |
| Status Bio District 2025 | Sisa 1 unit |
| Status Naraya Serpong 2026 | Sisa 1 unit |
| Status Banara Serpong 2026 | Belum · sisa 1 |
| Status Bio District 2026 | Sisa 8 unit |
| Status baris lainnya | Selesai |
| Catatan penting | 5 butir: Bio District 2025 Non PPN DTP sisa 1 dari 2; Naraya Serpong 2026 PPN DTP sisa 1 dari 2; Banara Serpong 2026 PPN DTP sisa 1 dari 1; Bio District 2026 PPN DTP sisa 5 dari 7; Bio District 2026 Non PPN DTP sisa 3 dari 3 |
| Baris TOTAL tabel | PPN DTP 42 / 49 · Non PPN DTP 11 / 15 · Total 53 dari 64 · 83% |

Kriteria lain:

- [ ] Menyimpan baris dengan BAST 3 dan total unit 2 ditolak dengan pesan "BAST melebihi total".
- [ ] Akun VIEWER tidak bisa membuka `/input` dan `/master` (diarahkan ke `/dashboard`).
- [ ] Teks WhatsApp hasil salin sama persis dengan format laporan lama untuk data seed.
- [ ] Dashboard terbaca tanpa scroll ke samping di lebar 360 px, kecuali tabel rincian.
- [ ] Setiap simpan, ubah, dan hapus tercatat di `AuditLog`.
- [ ] `npm run test` lulus semua.

## 9. Format jawaban yang diharapkan

Kirim jawaban dengan urutan ini:

1. **Asumsi**: daftar singkat keputusan yang kamu ambil sendiri.
2. **Struktur file**: pohon folder lengkap.
3. **Kode**: isi setiap file, satu blok kode per file dengan path di baris pertama sebagai komentar. Mulai dari `prisma/schema.prisma`, `lib/hitung.ts`, dan `tests/hitung.test.ts`, lalu halaman dan API.
4. **Cara menjalankan**: perintah dari nol, termasuk isi contoh `.env` (tanpa password asli), `npx prisma migrate dev`, `npx prisma db seed`, `npm run dev`, dan `npm run test`.
5. **Cek kriteria**: tabel kriteria bagian 8 dengan kolom "Terpenuhi" dan cara memeriksanya.

Jika jawaban terlalu panjang untuk satu pesan, berhenti di akhir file yang utuh, tulis "LANJUT", dan teruskan saat diminta.
