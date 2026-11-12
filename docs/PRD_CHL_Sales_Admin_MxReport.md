# PRD CHL Sales Admin System MxReport

12 November 2026

## Ringkasan

CHL Sales Admin System MxReport adalah aplikasi web internal Cipta Harmoni Lestari untuk mengumpulkan, menampilkan, dan membagikan laporan penjualan properti semua proyek. Aplikasi ini menggantikan laporan harian dan mingguan berbasis Excel serta teks WhatsApp yang diketik ulang setiap hari.

Satu aplikasi memuat lima laporan utama: Daily Sales, Weekly Sales (per proyek, termasuk Master Stock siteplan), Monthly Sales, Monitoring BAST, dan Sales Achievement (target vs actual). Ada juga Daily Report Message Template untuk mengirim ringkasan harian ke WhatsApp.

Aplikasi berjalan di Vercel: https://chlsalesadminmxreport.vercel.app

## Latar belakang dan masalah

Sebelumnya, laporan penjualan disusun dari banyak file Excel per proyek (Daily Report, Weekly Report, stock unit, budget) lalu diringkas manual menjadi teks WhatsApp.

Masalah utama:

- **Angka tidak sinkron.** Penjualan di Daily, Weekly, dan Monthly sering berbeda karena diketik di file terpisah.
- **Lambat dibaca.** Manajemen harus membuka beberapa file untuk melihat penjualan, batal, hold, sisa unit, dan pencapaian target.
- **Tidak ada posisi unit.** Status unit (sold, hold, available) tidak terlihat di siteplan.
- **Riwayat hilang.** Perubahan data tidak tercatat siapa dan kapan.
- **Akses tidak terkontrol.** Admin proyek bisa melihat atau mengubah data proyek lain.

## Tujuan dan metrik keberhasilan

| Tujuan | Metrik | Target |
| --- | --- | --- |
| Satu sumber angka | Selisih angka Daily vs Weekly vs Monthly | 0 selisih (ditandai otomatis jika ada) |
| Laporan cepat | Waktu menyiapkan Daily Report WhatsApp | Kurang dari 2 menit |
| Input ringan | Waktu admin proyek mengisi data harian/mingguan | Kurang dari 10 menit per hari |
| Posisi stock jelas | Proyek dengan siteplan berstatus otomatis | Semua proyek aktif |
| Akses aman | Admin proyek mengubah data proyek lain | 0 kejadian |
| Jejak perubahan | Perubahan data yang tercatat di History | 100% |

## Pengguna dan hak akses

| Peran | Akun | Yang dilakukan | Hak akses |
| --- | --- | --- | --- |
| Admin pusat | `admin.chl` | Mengelola semua proyek, target, user, Daily Report | Semua menu, input semua proyek, Manajemen User, Input Target, Impor Excel Weekly, Daily Report Message Template |
| Admin proyek | `admin.tsc`, `admin.biodistrict`, `admin.narayabanaraserpong`, `admin.permaiindah` | Mengisi data proyeknya sendiri | Lihat & ubah hanya proyek miliknya; total stock dapat dikunci |
| Viewer | `viewer.chl` | Memantau semua laporan | Lihat semua menu (mode lihat saja) dan ekspor Excel/gambar |

Aturan umum:

- Data yang dikirim ke browser admin proyek hanya berisi proyeknya sendiri (Daily, Weekly, BAST, Master Stock, History).
- Server menolak perubahan pada proyek di luar hak akses, dan menolak perubahan target selain oleh `admin.chl`.
- Setiap akun bisa mengganti password sendiri lewat menu profil. `admin.chl` bisa menambah, mengubah, mereset password, dan menghapus user.

## Struktur menu

Sidebar **PROPERTY SALES DASHBOARD**:

1. **DAILY SALES DASHBOARD**: Dashboard · Input Data · Hold Reserved · Master · History
2. **WEEKLY SALES DASHBOARD**: daftar proyek per PT; tiap proyek punya Dashboard · Input Data · Master Stock · History
3. **MONTHLY SALES DASHBOARD**: Dashboard
4. **MONITORING BAST (PPN & NON-PPN)**: Dashboard · Input Data · Master · History
5. **SALES ACHIEVEMENT DASHBOARD**: Dashboard · Input Data · History
6. **DAILY REPORT MESSAGE TEMPLATE** (tombol, khusus `admin.chl`)

Proyek dan PT:

| PT | Proyek |
| --- | --- |
| PT. Serpong Bangun Cipta | Banara Serpong, Naraya Serpong, Mazenta Residence, Marchand |
| PT. Serpong Bangun Lestari | Bio District |
| PT. Bumi Mahardhika Makmur | Permai Indah |
| PT. Bhakti Bangun Harmoni – The Sanctuary Collection | Tanglin Parc, Newton Springs, Orchard Riviera, Scotts Vale |

## Kebutuhan fungsional

### 1. Daily Sales Dashboard

- Kartu: terjual hari ini, bulan berjalan, YTD, akumulasi terjual, batal, hold reserved.
- Tabel rincian per PT dan proyek: hari ini, bulan, YTD, akumulasi terjual dengan **sisa unit/nilai** (stock − akumulasi).
- Pilihan tahun dan tanggal (data per bulan); arsip tahun sebelumnya tersimpan saat pergantian tahun.
- Input Data: angka per bulan per proyek, total stock, catatan proyek, daftar Batal, Hold Reserved, Pindah Unit, Ganti Cara Bayar.
- Tab **Hold Reserved**: semua unit hold dari Weekly seluruh proyek (lama hold dalam hari, nilai reserved, filter proyek & tanggal, ekspor Excel, unduh/bagikan gambar, kirim ringkasan).
- Peringatan merah **"Data belum sama"** jika angka Daily berbeda dengan Weekly/Monthly.
- Salin teks laporan, unduh/bagikan gambar, ekspor Excel.

### 2. Weekly Sales Dashboard (per proyek)

- Kartu baris 1: Minggu berjalan, Penjualan tahun ini, Akumulasi, Stock awal, Sisa unit.
- Kartu baris 2: Batal, Pindah Unit, Ganti Cara Bayar, Hold Reserved.
- Kotak **Catatan** di bawah kartu dengan format tebal/miring/garis bawah (admin proyek dan `admin.chl`).
- Tabel penjualan per minggu (Senin–Minggu), batal, hold, pindah unit, ganti cara bayar, rekap per tahun.
- Input Data per tabel: kolom proyek (unit, konsumen, tipe, skema bayar, nilai kontrak incl./excl. PPN, Nilai Reserved, SBUM/PPN DTP sesuai proyek, sales, keterangan, sumber informasi, usia, tanggal lahir, domisili).
- Format penulisan otomatis: kapital di awal kata/kalimat, singkatan tetap huruf besar.
- Baris bertanda **Catatan saja** tidak dihitung ke angka.
- Impor dari Excel Weekly Report (khusus `admin.chl`), ekspor Excel, unduh/bagikan gambar.

### 3. Master Stock (siteplan) per proyek

- Impor **Excel stock** (kolom Code, Address/Blok, Type, Build, Land, Status bertanggal). Jika ada beberapa kolom Status, dipakai yang bertanggal; unit UNRELEASED dihitung Stock (belum dirilis).
- Status: Sold, Reserved (Hold), Available, Marketing Gallery, Rumah Contoh, Stock.
- Status otomatis diperbarui dari Weekly: penjualan/batal sesudah tanggal Excel, dan unit yang tercantum di Hold Reserved.
- Ubah status manual per unit dari daftar unit (tercatat di History).
- **Siteplan**: unggah, ganti, hapus; beberapa siteplan per proyek (mis. Lantai 1/2/3 Marchand) dengan tampilan **Semua lantai** dalam satu layar.
- **Titik unit** berwarna di siteplan; unit Available dibiarkan kosong. Posisi titik bawaan sudah dipetakan untuk 10 proyek; dapat diatur (Atur titik) dan dirapikan (Sunting titik, drag atau tombol panah).
- **Unit Status Legend** dengan jumlah dan persen, posisi otomatis di area kosong atau dipindah ke pojok.
- Zoom 50–400%, ukuran titik dapat diatur.
- Ekspor Excel (dengan kolom lantai), Ekspor gambar dan Bagikan (pilih semua lantai atau per lantai), kirim ringkasan teks. Tanggal data dan tanggal kirim tertulis otomatis.
- Data stock dan gambar disimpan terpisah per proyek di server, tersimpan otomatis setiap perubahan.

### 4. Monthly Sales Dashboard

- Pilihan tahun, bulan, dan proyek.
- Kartu baris 1: Penjualan bulan, Penjualan Netto (penjualan − batal), YTD.
- Kartu baris 2: Batal, Pindah Unit, Ganti Cara Bayar, Hold Reserved.
- Grafik penjualan & batal per bulan, rincian skema bayar (KPR, Cash Keras, Cicilan Bertahap), sumber informasi, Inhouse vs Agen, ringkasan per proyek, tabel cek data Daily vs Weekly.
- Angka penjualan diambil dari Daily Sales; rincian dari Weekly.
- Kirim ringkasan, unduh/bagikan gambar, ekspor Excel.

### 5. Monitoring BAST (PPN & Non-PPN)

- Progres BAST PPN DTP dan Non PPN DTP per periode dan proyek, status Selesai/Sisa.
- Input per tanggal laporan dengan validasi (BAST tidak boleh melebihi total), filter periode & proyek, salin dari laporan sebelumnya.
- Master periode dan proyek, History, ekspor Excel.

### 6. Sales Achievement Dashboard

- Target vs Actual per proyek per bulan dan YTD (unit dan Rp), sisa target dan kebutuhan per bulan.
- Input Target per tahun (khusus `admin.chl`): isi manual, bagi rata total tahunan, salin dari tahun lalu, impor dari Excel budget.
- Tanggal penerimaan data budget, tanggal aktif, dan catatan per tahun.
- Actual otomatis dari Daily Sales. Kirim ringkasan, unduh/bagikan gambar, ekspor Excel.

### 7. Daily Report Message Template (`admin.chl`)

- Isi report: Gabungan, Daily Report Penjualan, atau Report BAST; pilih proyek.
- Pilih **Tanggal report** (bawaan tanggal laporan terakhir); untuk tanggal lain, perubahan hari itu mengikuti tanggal tersebut dan diberi keterangan.
- Per proyek: **Terjual hari ini** dengan kode unit dan nilai per unit, contoh `*Terjual hari ini : 2 Unit (NS-NRB-16/2,01 M & NS-NRB-12/2,18 M)*`; Batal; Pindah Unit; Ganti Bayar; Hold Reserved dengan nilai reserved; Bulan/YTD; Total Terjual; catatan proyek.
- Ringkasan CHL/Total dan Note Hold Reserved, Report BAST.
- Pratinjau, edit teks, salin, bagikan, kirim ke WhatsApp.

### 8. Fitur umum

- **History**: setiap perubahan tercatat (waktu, user, bagian, rincian).
- **Mode Viewer**: semua isian terkunci, ekspor tetap bisa.
- **Sinkron server**: data tersimpan di database (Upstash Redis atau Neon Postgres); deteksi konflik bila data diubah pengguna lain.
- Tampilan komputer dan ponsel, bahasa Indonesia (opsi English untuk tampilan).

## Kebutuhan non-fungsional

| Aspek | Kebutuhan |
| --- | --- |
| Platform | Web (desktop dan ponsel), satu file aplikasi (`mockup/index.html`) + API serverless Vercel (`api/`) |
| Penyimpanan | Upstash Redis REST atau Neon Postgres; data utama, user, stock, dan siteplan disimpan dengan kunci terpisah |
| Keamanan | Login dengan token bertanda tangan (12 jam), password di-hash (SHA-256 + salt), pembatasan data per proyek di server |
| Ukuran gambar | Siteplan dikompres di browser (maks. ±2.400 px, < 3,5 MB) |
| Ketersediaan | Perubahan langsung tersimpan; data juga disimpan sementara di browser |
| Ekspor | Excel (SheetJS), gambar PNG, teks WhatsApp |

## Model data (ringkas)

| Kunci | Isi |
| --- | --- |
| `sales2` | Proyek Daily (bulan[12], stok, hari, tahun, arsip), batal, hold, pindah, ganti, tanggal laporan |
| `weekly[proyek]` | jual, batal, hold, pindah, ganti, rekap per tahun, catatan kartu |
| `laporan`, `periode`, `proyek` | Data BAST per tanggal, master periode & proyek |
| `target[tahun]`, `targetInfo[tahun]` | Target per proyek per bulan; tanggal budget & catatan |
| `history` | 500 perubahan terakhir |
| `stok:<proyek>` | Unit, status, posisi titik, daftar siteplan, ukuran titik, posisi legenda |
| `siteplan:<proyek>#<lantai>` | Gambar siteplan |
| `users` | Daftar user dan hak akses |

## Di luar cakupan (saat ini)

- Integrasi langsung ke sistem ERP/booking (data masih input/impor Excel).
- Membaca status otomatis dari Google Sheets.
- Status historis Master Stock per tanggal mundur (tanggal data hanya label).
- Notifikasi otomatis (email/WhatsApp terjadwal).

## Pengembangan berikutnya (usulan)

1. Sinkron Excel stock dari Google Sheets agar Master Stock selalu terbaru tanpa impor.
2. Simpan angka harian Daily agar Daily Report tanggal lampau akurat untuk Bulan/YTD.
3. Pengingat hold yang lebih dari 30 hari.
4. Dashboard ringkas untuk ponsel manajemen.
