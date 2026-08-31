-- ============================================================
-- JALANKAN DI SUPABASE SQL EDITOR
-- Supabase → SQL Editor → New Query → paste semua → RUN
-- ============================================================

-- ============================================================
-- TABEL: accounts (Chart of Accounts / COA)
-- ============================================================
CREATE TABLE accounts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  kode        TEXT NOT NULL,
  nama        TEXT NOT NULL,
  tipe        TEXT NOT NULL CHECK (tipe IN (
                'kas', 'bank', 'piutang', 'aset_lancar', 'aset_tetap',
                'kewajiban', 'ekuitas', 'pendapatan', 'hpp', 'beban'
              )),
  kelompok    TEXT NOT NULL,  -- contoh: ASET LANCAR, PENDAPATAN, BEBAN, dst
  aktif       BOOLEAN DEFAULT true,
  urutan      INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UPDATE TABEL transactions: tambah kolom account_id
-- ============================================================
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- ============================================================
-- TABEL: equity_entries (modal awal & penyesuaian ekuitas)
-- ============================================================
CREATE TABLE equity_entries (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  tipe        TEXT NOT NULL CHECK (tipe IN ('modal_awal', 'tambahan_modal', 'deviden')),
  nominal     NUMERIC NOT NULL DEFAULT 0,
  keterangan  TEXT,
  tanggal     DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE equity_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_accounts"
  ON accounts FOR ALL USING (true);

CREATE POLICY "service_role_all_equity"
  ON equity_entries FOR ALL USING (true);

-- ============================================================
-- SEED COA DEFAULT untuk perusahaan properti
-- (akan diinsert via API saat perusahaan pertama kali setup)
-- Tapi bisa juga dijalankan manual dengan ganti company_id
-- ============================================================
-- Lihat file SEED_COA.sql untuk insert data COA default
