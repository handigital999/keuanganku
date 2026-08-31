# Cara Tambah Laporan Neraca, Laba/Rugi & Ekuitas

## LANGKAH 1 — Update database Supabase (2 menit)

1. Buka Supabase → SQL Editor → New Query
2. Copy-paste isi `JALANKAN_DI_SUPABASE.sql`
3. Klik RUN → harus muncul "Success"

---

## LANGKAH 2 — Copy file ke project

Salin semua file berikut ke folder project kamu:

```
src/app/api/accounts/route.ts         → BARU
src/app/api/laporan/route.ts          → BARU
src/app/api/equity/route.ts           → BARU
src/app/laporan/page.tsx              → BARU (buat folder laporan)
src/app/laporan/neraca/page.tsx       → BARU
src/app/laporan/laba-rugi/page.tsx    → BARU
src/app/laporan/ekuitas/page.tsx      → BARU
src/app/masuk/page.tsx                → GANTI yang lama (ada pilih akun)
src/app/keluar/page.tsx               → GANTI yang lama (ada pilih akun)
```

---

## LANGKAH 3 — Tambah menu Laporan di dashboard

Buka `src/app/dashboard/page.tsx`, tambahkan menu ini di array menu:

```typescript
{ label: 'Laporan Keuangan', desc: 'Neraca, Laba/Rugi, Ekuitas', bg: '#E6F1FB', icon: '📊', href: '/laporan' },
```

---

## LANGKAH 4 — Push & deploy ke VPS

```bash
# Di laptop
git add .
git commit -m "feat: tambah 3 laporan keuangan + COA di form transaksi"
git push origin main

# Di VPS
cd /var/www/keuanganku
git pull origin main
npm install
npm run build
pm2 restart keuanganku
```

---

## LANGKAH 5 — Setup awal setelah deploy

Pertama kali buka aplikasi setelah update:

1. Login sebagai user perusahaan
2. Buka menu "Uang Masuk" atau "Uang Keluar"
3. COA (Chart of Accounts) otomatis ter-seed sesuai struktur properti
4. Mulai input transaksi dengan pilih kategori akun

Untuk laporan Ekuitas:
- Klik menu "Laporan Keuangan" → "Ekuitas"
- Klik "+ Input modal / deviden" untuk input modal awal perusahaan
- Setelah modal diinput, laporan langsung terhitung otomatis

---

## Catatan penting

- **Transaksi lama** (sebelum update) tidak punya account_id, jadi tidak akan muncul di laporan
- **Transaksi baru** setelah update akan otomatis masuk ke laporan sesuai akun yang dipilih
- COA bisa ditambah akun baru lewat database Supabase langsung (Table Editor → accounts)
- Laporan bisa dicetak lewat tombol 🖨 Cetak di setiap halaman laporan
