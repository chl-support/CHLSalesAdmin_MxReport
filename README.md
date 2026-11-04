# CHLSalesAdmin_MxReport

Laporan BAST Program PPN DTP: template Excel, dashboard HTML, dan PRD untuk pengembangan aplikasi.

## Isi repo

| Folder / file | Isi |
| --- | --- |
| `template/Report_BAST_PPN_DTP.xlsx` | Template Excel: isi data di sheet **Input Data**, sheet **Report** terhitung otomatis, sheet **Daftar** berisi master periode dan proyek |
| `dashboard/index.html` | Dashboard web statis (buka langsung di browser), dengan tombol salin teks laporan untuk WhatsApp. Data ada di objek `REPORT` di dalam file |
| `docs/PRD_Dashboard_BAST_PPN_DTP.md` | PRD untuk tim IT / bisnis |
| `docs/PRD_untuk_Claude_Dashboard_BAST_PPN_DTP.md` | PRD dalam bentuk prompt, siap ditempel ke Claude untuk membangun aplikasi |
| `mockup/index.html` | Mockup aplikasi (Dashboard, Input Data, Master) untuk dideploy ke Vercel. Data tersimpan di browser |
| `scripts/build_template.py` | Script Python (openpyxl) untuk membuat ulang template Excel |

## Cara pakai template Excel

1. Buka `template/Report_BAST_PPN_DTP.xlsx`.
2. Di sheet **Input Data**, ubah tanggal laporan (sel D3) dan isi baris data. Hanya sel kuning yang diisi.
3. Pilih Periode dan Proyek dari dropdown. Isi 0 atau kosongkan untuk tanda "–".
4. Sheet **Report** terisi otomatis dan siap dibagikan.

Data awal di template adalah laporan per 03-11-2026.

## Membuat ulang template

```bash
pip install openpyxl
python scripts/build_template.py
```

## Mockup di Vercel

Folder `mockup/` adalah situs statis tanpa build. Di Vercel, set **Root Directory** ke `mockup` dan **Framework** ke `Other`. Setiap push ke `main` akan otomatis dideploy.
