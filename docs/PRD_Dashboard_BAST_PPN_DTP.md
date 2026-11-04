# PRD Dashboard BAST PPN DTP

4 November 2026

## Ringkasan

Dashboard BAST PPN DTP adalah aplikasi web internal yang menampilkan progres serah terima (BAST) unit properti per periode PPN DTP dan per proyek. Aplikasi ini menggantikan laporan harian berbasis teks WhatsApp dan file Excel `Dashboard_BAST_PPN_DTP_Properti_Oktober_2026_IT.xlsx`.

Versi pertama mengikuti struktur Excel yang sudah ada: data diinput manual oleh admin, lalu dashboard menghitung total, persentase, sisa unit, dan status secara otomatis. Per 03-11-2026 tercatat 53 dari 64 unit sudah BAST (83%), dengan sisa 11 unit.

## Latar belakang dan masalah

Laporan BAST saat ini dikirim setiap hari sebagai teks dengan format "Total X unit dari Y unit" per proyek, per jenis BAST, dan per periode PPN DTP. Format ini sulit dibaca sekilas dan tidak menunjukkan proyek mana yang masih punya sisa unit.

Masalah utama yang perlu diselesaikan:

- **Tidak ada ringkasan.** Pembaca harus menjumlahkan sendiri total BAST dari 3 periode dan 4 proyek.
- **Status tidak terlihat.** Proyek dengan sisa unit, misalnya Bio District periode 2026 (2 dari 7 unit PPN DTP), tercampur dengan yang sudah selesai.
- **Rawan salah hitung.** Angka diketik ulang setiap hari, dan tidak ada pengecekan bila BAST melebihi total unit.
- **Riwayat hilang.** Laporan teks tidak menyimpan perubahan dari hari ke hari.

## Tujuan dan metrik keberhasilan

Tujuannya: manajemen bisa melihat progres BAST dan sisa unit dalam satu layar, dan admin cukup mengisi data sekali per hari.

| Tujuan | Metrik | Target |
| --- | --- | --- |
| Laporan cepat dibaca | Waktu bagi manajemen untuk menemukan proyek dengan sisa unit | Kurang dari 30 detik |
| Input lebih ringan | Waktu admin mengisi data harian | Kurang dari 10 menit per hari |
| Angka akurat | Selisih angka dashboard dengan data sumber | 0 selisih |
| Data tervalidasi | Baris dengan BAST melebihi total unit yang lolos tersimpan | 0 baris |
| Dipakai rutin | Laporan harian dibagikan lewat dashboard, bukan teks manual | 100% hari kerja |

## Pengguna

| Peran | Yang dilakukan | Yang dibutuhkan | Hak akses |
| --- | --- | --- | --- |
| Admin BAST | Mengisi data BAST harian per periode dan proyek | Form input cepat dengan dropdown, validasi angka, dan salin data hari sebelumnya | Input, ubah, hapus data; kelola daftar periode dan proyek |
| Manajemen / pimpinan | Memantau progres dan sisa unit | Ringkasan di atas, status berwarna, tampilan rapi di ponsel | Lihat saja |
| Tim pajak / finance | Mencocokkan unit PPN DTP dengan pelaporan pajak | Rincian per periode dan jenis BAST, ekspor ke Excel | Lihat dan ekspor |
| Tim IT | Membangun dan merawat aplikasi | Spesifikasi data dan rumus yang jelas | Administrator sistem |

## Ruang lingkup

**Termasuk di versi pertama:**

- Input data BAST manual per baris (periode, proyek, 4 angka unit, keterangan)
- Pengelolaan daftar periode PPN DTP dan daftar proyek
- Dashboard: header, 4 kartu KPI, progres per periode, progres per proyek, tabel rincian, catatan penting
- Perhitungan otomatis total, persentase, sisa unit, dan status
- Ekspor ke Excel dan salin teks laporan untuk WhatsApp
- Login dengan peran Admin dan Viewer

**Tidak termasuk di versi pertama:**

- Integrasi otomatis dengan sistem ERP, CRM, atau data pajak
- Data per unit (nomor kavling, nama pembeli, tanggal BAST per unit)
- Notifikasi otomatis lewat email atau WhatsApp
- Data penjualan atau nilai rupiah

## Model data

File Excel punya 3 sheet: **Input Data** (data mentah), **Daftar** (master periode dan proyek), dan **Report** (tampilan hasil rumus). Aplikasi menyimpan dua tabel master dan satu tabel transaksi.

**Tabel `periode`** (dari sheet Daftar, kolom B)

| Kolom | Tipe | Contoh | Aturan |
| --- | --- | --- | --- |
| id | integer | 1 | Otomatis |
| nama | teks | Nov-2023 s.d Des-2024 | Wajib, unik |
| tanggal_mulai | tanggal | 2023-11-01 | Wajib |
| tanggal_selesai | tanggal | 2024-12-31 | Wajib, setelah tanggal mulai |
| urutan | integer | 1 | Urutan tampil di dashboard |

**Tabel `proyek`** (dari sheet Daftar, kolom D)

| Kolom | Tipe | Contoh | Aturan |
| --- | --- | --- | --- |
| id | integer | 1 | Otomatis |
| nama | teks | Naraya Serpong | Wajib, unik |
| aktif | ya/tidak | ya | Proyek nonaktif tidak muncul di dropdown |

**Tabel `bast_harian`** (dari sheet Input Data, baris 7 sampai 56)

| Kolom | Tipe | Kolom Excel | Aturan |
| --- | --- | --- | --- |
| tanggal_laporan | tanggal | D3 | Wajib |
| periode_id | referensi | C (Periode PPN DTP) | Wajib, dari tabel periode |
| proyek_id | referensi | D (Proyek) | Wajib, dari tabel proyek |
| bast_ppn_dtp | integer | E | ≥ 0, ≤ total_unit_ppn_dtp |
| total_unit_ppn_dtp | integer | F | ≥ 0 |
| bast_non_ppn_dtp | integer | G | ≥ 0, ≤ total_unit_non_ppn_dtp |
| total_unit_non_ppn_dtp | integer | H | ≥ 0 |
| keterangan | teks | I | Opsional |
| dibuat_oleh, diubah_pada | audit | – | Otomatis |

Kombinasi tanggal_laporan + periode_id + proyek_id harus unik. Data awal yang dimigrasikan dari Excel: 3 periode, 4 proyek, dan 9 baris BAST per 03-11-2026.

## Kebutuhan fungsional

**Input data (Admin)**

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-01 | Admin memilih tanggal laporan, lalu mengisi baris per periode dan proyek | Wajib |
| F-02 | Periode dan proyek dipilih dari dropdown yang diambil dari tabel master | Wajib |
| F-03 | Angka unit hanya menerima bilangan bulat ≥ 0; kosong dianggap 0 | Wajib |
| F-04 | Sistem menolak simpan bila BAST melebihi total unit, dengan pesan "BAST melebihi total" pada baris itu | Wajib |
| F-05 | Tombol "Salin dari laporan sebelumnya" mengisi form dengan data tanggal terakhir | Wajib |
| F-06 | Admin bisa menambah, mengubah nama, dan menonaktifkan periode atau proyek | Wajib |
| F-07 | Impor data dari file Excel dengan format sheet Input Data | Sebaiknya |

**Perhitungan**

Semua angka di dashboard dihitung dari tabel `bast_harian` untuk tanggal laporan yang dipilih, sama seperti rumus SUMIFS di sheet Report.

| Angka | Rumus | Contoh 03-11-2026 |
| --- | --- | --- |
| Total BAST | jumlah bast_ppn_dtp + jumlah bast_non_ppn_dtp | 53 |
| Total unit | jumlah total_unit_ppn_dtp + jumlah total_unit_non_ppn_dtp | 64 |
| Persentase | Total BAST ÷ Total unit; 0% bila total unit 0 | 83% |
| Belum BAST | Total unit − Total BAST | 11 unit |
| Progres per periode | Jumlah BAST ÷ jumlah unit, difilter per periode | 2026: 5 / 15 (33%) |
| Progres per proyek | Jumlah BAST ÷ jumlah unit, difilter per proyek | Bio District: 26 / 35 (74%) |

**Aturan status per baris rincian**

| Kondisi | Status | Warna |
| --- | --- | --- |
| Total unit = 0 | Tidak ada unit | Abu-abu |
| BAST ≥ total unit | Selesai | Hijau |
| BAST = 0 dan total unit > 0 | Belum · sisa N | Merah |
| 0 < BAST < total unit | Sisa N unit | Oranye |

**Dashboard dan berbagi**

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| F-08 | Viewer memilih tanggal laporan; default tanggal terbaru | Wajib |
| F-09 | Catatan penting dibuat otomatis dari baris yang masih punya sisa unit | Wajib |
| F-10 | Tombol "Salin teks laporan" menghasilkan teks format WhatsApp yang sama dengan laporan lama | Wajib |
| F-11 | Ekspor dashboard ke Excel dengan layout sheet Report | Wajib |
| F-12 | Ekspor ke PDF atau gambar untuk dibagikan | Sebaiknya |
| F-13 | Tampilkan perubahan dibanding laporan sebelumnya, misalnya "+2 unit BAST" | Sebaiknya |

## Tata letak dan komponen

Layout mengikuti sheet Report dan contoh dashboard penjualan: header biru navy, 4 kartu KPI, dua grafik batang progres, tabel rincian, lalu catatan. Urutan dari atas ke bawah:

1. Header: judul "Report BAST Program PPN DTP", tanggal laporan, jumlah proyek dan periode, tombol Salin teks laporan
2. 4 kartu KPI: Total BAST (53 / 64 unit · 83%), BAST PPN DTP (42 / 49 · 86%), BAST Non PPN DTP (11 / 15 · 73%), Belum BAST (11 unit · 17%)
3. Progres BAST per periode
4. Progres BAST per proyek
5. Rincian per periode dan proyek
6. Catatan penting

Angka di atas memakai data 03-11-2026. Di ponsel, kartu KPI menjadi 2 kolom dan tabel rincian digeser ke samping.

| Komponen | Isi | Warna |
| --- | --- | --- |
| Kartu KPI | Label, BAST / total unit, persentase, keterangan sisa | Garis kiri: emas (Total), biru (PPN DTP), hijau (Non PPN DTP), merah (Belum BAST) |
| Batang progres | Nama, batang gradasi, "BAST / unit", persentase | Satu warna per baris |
| Tabel rincian | Baris grup per periode, baris per proyek, baris TOTAL | Status mengikuti aturan warna di Kebutuhan fungsional; baris tanpa unit abu-abu |

## Kebutuhan non-fungsional

| Aspek | Kebutuhan |
| --- | --- |
| Tampilan | Responsif dari ponsel (lebar 360 px) sampai desktop; tabel rincian bisa digeser ke samping di ponsel |
| Kecepatan | Dashboard tampil dalam 2 detik untuk data hingga 5 tahun laporan harian |
| Keamanan | Login wajib; hanya Admin yang bisa mengubah data; koneksi HTTPS |
| Audit | Setiap perubahan data mencatat siapa, kapan, nilai lama, dan nilai baru |
| Ketersediaan | Bisa diakses pada jam kerja, 99% per bulan |
| Cadangan data | Backup harian, disimpan minimal 1 tahun |
| Bahasa dan format | Bahasa Indonesia; tanggal dd-mm-yyyy; angka 0 ditampilkan sebagai "–" |
| Konsistensi | Angka di dashboard, ekspor Excel, dan teks WhatsApp selalu sama untuk tanggal yang sama |

## Asumsi, risiko, dan pertanyaan terbuka

**Asumsi**

- Angka "Total X unit dari Y unit" berarti X unit sudah BAST dari Y unit yang masuk program pada periode itu, bukan jumlah BAST yang terjadi hari itu saja.
- Satu laporan per hari, diisi oleh satu admin.
- Daftar periode mengikuti tahun program PPN DTP: Nov-2023 s.d Des-2024, Jan-2025 s.d Des-2025, Jan-2026 s.d Des-2026.

**Risiko**

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Admin salah ketik angka | Laporan ke manajemen keliru | Validasi BAST ≤ total, tampilkan selisih dibanding hari sebelumnya |
| Nama proyek ditulis berbeda (misal "Mazenta" dan "Mozenta") | Angka terpecah jadi dua proyek | Proyek hanya dipilih dari dropdown master |
| Aturan PPN DTP berubah untuk periode baru | Struktur periode tidak cocok | Periode dikelola sebagai data master, bukan ditanam di kode |

**Pertanyaan terbuka**

- [ ] Apakah dashboard perlu menampilkan BAST yang terjadi hari itu saja, selain total kumulatif?
- [ ] Siapa saja yang boleh melihat dashboard, dan apakah perlu akses dari luar kantor?
- [ ] Apakah data per unit (nomor unit, nama pembeli) akan ditambahkan di versi berikutnya?
- [ ] Aplikasi dibangun sendiri oleh tim IT, atau memakai tools BI yang sudah ada (misalnya Looker Studio atau Power BI)?

## Rencana rilis bertahap

Tanggal tiap tahap ditentukan setelah tim IT memberi estimasi.

1. **Tahap 1, Excel sebagai sumber.** Template Excel dipakai harian oleh admin. Dashboard web membaca file Excel yang diunggah dan menampilkan layout Report. Selesai bila angka web sama dengan sheet Report untuk 5 hari berturut-turut.
2. **Tahap 2, input langsung di aplikasi.** Form input, master periode dan proyek, validasi, login Admin/Viewer, salin teks WhatsApp, dan ekspor Excel (F-01 sampai F-11). Selesai bila admin berhenti memakai Excel selama 2 minggu.
3. **Tahap 3, riwayat dan perbandingan.** Perubahan dibanding hari sebelumnya, grafik tren BAST per minggu, ekspor PDF (F-12, F-13).
4. **Tahap 4, opsional.** Data per unit dan integrasi dengan sistem lain, tergantung jawaban pertanyaan terbuka.
