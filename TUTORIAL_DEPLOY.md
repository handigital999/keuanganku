# 🚀 Tutorial Deploy KeuanganKu — Panduan Lengkap
> **Estimasi waktu:** 30–45 menit | **Gratis sepenuhnya** (Supabase + Vercel)

---

## 📋 Daftar Isi
1. Persiapan awal
2. Setup Supabase (database)
3. Buat tabel di Supabase
4. Upload project ke GitHub
5. Deploy ke Vercel
6. Isi environment variables di Vercel
7. Test semua fitur
8. Cara daftarkan perusahaan pertama
9. Troubleshooting (jika ada masalah)

---

## BAGIAN 1 — Persiapan Awal

### Yang kamu butuhkan:
- Laptop/PC dengan koneksi internet
- Akun **GitHub** (gratis) → daftar di https://github.com
- Akun **Supabase** (gratis) → daftar di https://supabase.com
- Akun **Vercel** (gratis) → daftar di https://vercel.com
- **Node.js** terinstall di laptop → download di https://nodejs.org (pilih versi LTS)

### Cek Node.js sudah terinstall:
Buka Terminal (Mac/Linux) atau Command Prompt (Windows), ketik:
```
node -v
```
Harus muncul angka seperti `v20.x.x`. Kalau belum muncul, install dulu dari nodejs.org.

---

## BAGIAN 2 — Setup Supabase (Database)

Supabase adalah database gratis yang akan menyimpan semua data perusahaan dan transaksi.

**Langkah-langkah:**

**2.1** Buka https://supabase.com → klik **"Start your project"** → login dengan GitHub

**2.2** Klik **"New project"**

**2.3** Isi form:
- **Organization:** pilih organisasi kamu (atau buat baru)
- **Project name:** `keuanganku` (bebas, tanpa spasi)
- **Database Password:** buat password yang kuat, **SIMPAN password ini**, nanti dibutuhkan
- **Region:** pilih **Southeast Asia (Singapore)** → ini paling cepat untuk Indonesia
- Klik **"Create new project"**

**2.4** Tunggu 1–2 menit sampai project selesai dibuat (ada loading bar hijau di atas)

**2.5** Setelah selesai, buka menu **Project Settings** (ikon gear ⚙ di sidebar kiri bawah)

**2.6** Klik **"API"** di sub-menu

**2.7** Catat/copy 3 nilai ini (akan digunakan nanti):
```
Project URL:          https://xxxxxxxxxx.supabase.co
anon public key:      eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...  (panjang sekali)
service_role key:     eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...  (panjang sekali, RAHASIA!)
```

> ⚠️ **PENTING:** service_role key bersifat sangat rahasia. Jangan pernah share ke siapapun atau upload ke GitHub!

---

## BAGIAN 3 — Buat Tabel di Supabase

Ini adalah langkah paling penting. Kita akan membuat 3 tabel: companies, transactions, dan stocks.

**3.1** Di dashboard Supabase, klik **"SQL Editor"** di sidebar kiri (ikon database)

**3.2** Klik **"New query"**

**3.3** Copy-paste SQL berikut ini ke dalam kotak editor, lalu klik tombol **"RUN"** (atau Ctrl+Enter):

```sql
-- ============================================
-- TABEL 1: companies (data perusahaan)
-- ============================================
CREATE TABLE companies (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  pin        TEXT NOT NULL,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABEL 2: transactions (catatan keuangan)
-- ============================================
CREATE TABLE transactions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('masuk', 'keluar')),
  tanggal    DATE NOT NULL,
  ket        TEXT NOT NULL,
  nominal    NUMERIC NOT NULL,
  catatan    TEXT,
  nota_num   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABEL 3: stocks (stok barang)
-- ============================================
CREATE TABLE stocks (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  nama       TEXT NOT NULL,
  jml        NUMERIC NOT NULL DEFAULT 0,
  satuan     TEXT NOT NULL,
  harga      NUMERIC DEFAULT 0,
  min_stok   NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) — Keamanan data
-- Memastikan tiap perusahaan HANYA bisa lihat datanya sendiri
-- ============================================
ALTER TABLE companies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks      ENABLE ROW LEVEL SECURITY;

-- Policy: izinkan akses via service_role (untuk API kita)
CREATE POLICY "service_role_all_companies"
  ON companies FOR ALL USING (true);

CREATE POLICY "service_role_all_transactions"
  ON transactions FOR ALL USING (true);

CREATE POLICY "service_role_all_stocks"
  ON stocks FOR ALL USING (true);
```

**3.4** Kalau berhasil, akan muncul pesan hijau: **"Success. No rows returned"**

**3.5** Verifikasi tabel berhasil dibuat: klik **"Table Editor"** di sidebar → harus muncul 3 tabel: companies, transactions, stocks

---

## BAGIAN 4 — Upload Project ke GitHub

GitHub adalah tempat menyimpan kode, dan Vercel akan membaca langsung dari sini.

**4.1** Buka https://github.com → login → klik tombol **"+"** di pojok kanan atas → **"New repository"**

**4.2** Isi:
- **Repository name:** `keuanganku`
- **Visibility:** pilih **Private** (agar kode tidak bisa dilihat orang lain)
- Jangan centang apapun
- Klik **"Create repository"**

**4.3** Buka Terminal/Command Prompt di laptop, masuk ke folder project:
```bash
cd keuanganku
```
(Sesuaikan path dengan lokasi folder project kamu)

**4.4** Jalankan perintah-perintah ini satu per satu:
```bash
git init
git add .
git commit -m "first commit: KeuanganKu app"
git branch -M main
git remote add origin https://github.com/USERNAME_KAMU/keuanganku.git
git push -u origin main
```
> Ganti `USERNAME_KAMU` dengan username GitHub kamu yang sebenarnya.

**4.5** Masukkan username dan password GitHub jika diminta.
> ⚠️ Jika GitHub meminta token bukan password, buat Personal Access Token di: GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic) → Generate new token → centang "repo" → copy tokennya, gunakan sebagai password.

**4.6** Refresh halaman GitHub → kode sudah muncul di repository ✓

---

## BAGIAN 5 — Deploy ke Vercel

**5.1** Buka https://vercel.com → klik **"Sign Up"** → pilih **"Continue with GitHub"** → izinkan akses

**5.2** Setelah masuk dashboard Vercel, klik **"Add New..."** → **"Project"**

**5.3** Di bagian "Import Git Repository", cari repository `keuanganku` → klik **"Import"**

**5.4** Di halaman konfigurasi:
- **Framework Preset:** pastikan terdeteksi **Next.js** (otomatis)
- **Root Directory:** biarkan `.` (titik)
- **Build Command:** biarkan default (`next build`)
- **Output Directory:** biarkan default

**5.5** Jangan klik Deploy dulu! Lanjut ke Bagian 6 untuk isi environment variables.

---

## BAGIAN 6 — Isi Environment Variables di Vercel

Ini adalah langkah yang PALING KRUSIAL. Tanpa ini, app tidak bisa terhubung ke database.

**6.1** Masih di halaman konfigurasi Vercel, scroll ke bawah ke bagian **"Environment Variables"**

**6.2** Tambahkan variabel satu per satu. Klik **"Add"** untuk setiap variabel:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase kamu (dari Bagian 2.7) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key dari Supabase (dari Bagian 2.7) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key dari Supabase (dari Bagian 2.7) |
| `ADMIN_EMAIL` | Email untuk login admin, contoh: `admin@keuanganku.com` |
| `ADMIN_PASSWORD` | Password admin yang kuat, contoh: `AdminKuat2025!` |

**6.3** Pastikan semua 5 variabel sudah terisi dengan benar

**6.4** Klik tombol **"Deploy"**

**6.5** Tunggu proses build selesai (sekitar 2–3 menit). Ada progress bar dan log real-time.

**6.6** Kalau berhasil, muncul animasi konfeti 🎉 dan link URL seperti:
```
https://keuanganku-xxxxxxx.vercel.app
```

**6.7** Klik link tersebut → aplikasi sudah online! ✓

---

## BAGIAN 7 — Test Semua Fitur

Lakukan checklist ini untuk memastikan semuanya berjalan:

**7.1 Test login admin:**
- Buka URL → klik "Login admin"
- Masukkan email dan password yang diisi di environment variables
- Harus masuk ke Panel Admin dengan background gelap coklat

**7.2 Daftarkan perusahaan pertama:**
- Di panel admin → tab "Daftarkan baru"
- Isi: Nama usaha, email, PIN 6 digit, ulangi PIN
- Klik "Daftarkan perusahaan"
- Harus muncul pesan hijau "Berhasil didaftarkan"

**7.3 Test login user:**
- Klik "Keluar" di panel admin
- Di halaman login, masukkan email dan PIN perusahaan yang baru didaftarkan
- Harus masuk ke HOME dengan background kuning cerah

**7.4 Test catat uang masuk:**
- Klik "Uang masuk" → isi semua form → klik "Simpan"
- Harus muncul pesan sukses dan kembali ke dashboard

**7.5 Test catat uang keluar:**
- Klik "Uang keluar" → isi form → simpan

**7.6 Test download nota:**
- Klik "Riwayat & nota" → klik salah satu transaksi
- Scroll ke bawah → klik "Download nota (PDF)"
- File PDF harus terdownload ke perangkat

**7.7 Test rekap bulanan:**
- Klik "Rekap bulanan" → pilih bulan dan tahun
- Grafik dan ringkasan harus tampil
- Coba klik "Download rekap PDF"

**7.8 Test stok:**
- Klik "Stok barang" → tambah barang dengan stok minimal
- Isi stok lebih kecil dari minimal → harus muncul notifikasi merah

---

## BAGIAN 8 — Cara Daftarkan Perusahaan Baru (Selanjutnya)

Setiap kali ada klien/perusahaan baru yang mau menggunakan aplikasi:

1. Login sebagai admin di `/admin`
2. Masuk ke tab **"Daftarkan baru"**
3. Isi nama usaha, email, dan buat PIN untuk mereka
4. Klik **"Daftarkan perusahaan"**
5. Berikan email dan PIN tersebut ke perusahaan
6. Mereka langsung bisa login di halaman utama `/`

Untuk **nonaktifkan** perusahaan (misal berhenti berlangganan):
1. Login admin → tab **"Semua perusahaan"**
2. Klik tombol **"Nonaktifkan"** di baris perusahaan tersebut
3. Mereka tidak akan bisa login lagi sampai diaktifkan kembali

---

## BAGIAN 9 — Troubleshooting

### ❌ Error: "Email atau PIN tidak sesuai"
- Pastikan perusahaan sudah didaftarkan admin
- Pastikan status perusahaan "Aktif" (bukan Nonaktif)
- Cek typo di email atau PIN

### ❌ Error saat build Vercel: "Module not found"
- Pastikan semua file sudah di-push ke GitHub (`git push`)
- Cek di tab "Deployments" Vercel untuk melihat log error detail

### ❌ Environment variables tidak terbaca
- Pastikan nama variabel PERSIS sama (case-sensitive)
- Setelah edit env variables di Vercel, kamu harus **redeploy**: Vercel dashboard → tab "Deployments" → klik "..." → "Redeploy"

### ❌ Tabel tidak ditemukan / error database
- Pastikan SQL di Bagian 3 sudah dijalankan di Supabase SQL Editor
- Cek di Supabase → Table Editor apakah 3 tabel sudah ada

### ❌ Error "invalid API key"
- Pastikan SUPABASE_SERVICE_ROLE_KEY sudah benar (bukan anon key)
- Copy ulang dari Supabase → Settings → API

### 🔄 Cara update app setelah edit kode:
1. Edit kode di laptop
2. `git add .`
3. `git commit -m "update: deskripsi perubahan"`
4. `git push`
5. Vercel otomatis deploy ulang dalam 2–3 menit ✓

---

## 🎉 Selamat!

Aplikasi KeuanganKu kamu sudah online dan siap digunakan!

**Ringkasan URL penting:**
- App utama (user): `https://keuanganku-xxx.vercel.app/`
- Login admin: `https://keuanganku-xxx.vercel.app/admin`

**Akses gratis yang kamu dapat:**
- Vercel: 100GB bandwidth/bulan, unlimited deploys
- Supabase: 500MB database, 50.000 baris data, 2GB storage

Cukup untuk ratusan perusahaan dan ribuan transaksi!
