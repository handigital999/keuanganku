# Cara Tambah Fitur Utang Piutang ke Project yang Sudah Jalan

## LANGKAH 1 — Tambah tabel di Supabase (1 menit)

1. Buka https://supabase.com → project kamu
2. Klik **SQL Editor** → **New Query**
3. Copy-paste isi file `JALANKAN_DI_SUPABASE.sql`
4. Klik **RUN**
5. Harus muncul: "Success. No rows returned" ✓

---

## LANGKAH 2 — Tambah file ke project di laptop

Copy file-file berikut ke folder project `keuanganku` kamu:

```
src/app/api/debts/route.ts              → copy ke project
src/app/api/debt-payments/route.ts      → copy ke project
src/app/utang/page.tsx                  → copy ke project (buat folder utang dulu)
src/app/utang/tambah/page.tsx           → copy ke project
src/app/utang/[id]/page.tsx             → copy ke project (buat folder [id] dulu)
```

Struktur folder yang harus dibuat di project:
```
src/app/
├── api/
│   ├── debts/
│   │   └── route.ts          ← file baru
│   └── debt-payments/
│       └── route.ts          ← file baru
└── utang/
    ├── page.tsx              ← file baru
    ├── tambah/
    │   └── page.tsx          ← file baru
    └── [id]/
        └── page.tsx          ← file baru
```

---

## LANGKAH 3 — Tambah menu di dashboard

Buka file `src/app/dashboard/page.tsx` di project kamu.

Cari bagian menu grid (ada tulisan 'Uang masuk', 'Uang keluar', dst).
Tambahkan menu baru ini di dalam array menu:

```typescript
{ label: 'Utang & Piutang', desc: 'Catat & cicil utang piutang', bg: '#F0E6FB', icon: '⇄', href: '/utang' },
```

Contoh sebelum ditambah:
```typescript
{ label: 'Stok barang', desc: 'Kelola stok usaha', bg: '#FAEEDA', icon: '≡', href: '/stok', notif: stokMenipis.length },
```

Contoh sesudah ditambah:
```typescript
{ label: 'Stok barang', desc: 'Kelola stok usaha', bg: '#FAEEDA', icon: '≡', href: '/stok', notif: stokMenipis.length },
{ label: 'Utang & Piutang', desc: 'Catat & cicil utang piutang', bg: '#F0E6FB', icon: '⇄', href: '/utang' },
```

---

## LANGKAH 4 — Push ke GitHub

```bash
cd keuanganku
git add .
git commit -m "feat: tambah fitur utang piutang dengan cicilan"
git push origin main
```

---

## LANGKAH 5 — Update di VPS

SSH ke VPS lalu jalankan:

```bash
cd /var/www/keuanganku
git pull origin main
npm install
npm run build
pm2 restart keuanganku
```

Selesai! Fitur utang piutang langsung aktif tanpa restart Nginx/NPM.

---

## Yang bisa dilakukan setelah fitur aktif:

- Tambah utang baru (kamu yang berhutang ke orang lain)
- Tambah piutang baru (orang lain yang berhutang ke kamu)
- Catat cicilan berapa saja dan kapan saja
- Lihat progress pelunasan dalam bentuk bar
- Otomatis tandai lunas kalau total cicilan sudah >= total utang
- Filter: semua / utang / piutang / lunas
