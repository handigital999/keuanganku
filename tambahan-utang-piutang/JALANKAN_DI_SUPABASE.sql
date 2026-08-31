-- ============================================================
-- JALANKAN SQL INI DI SUPABASE SQL EDITOR
-- Supabase → SQL Editor → New Query → paste → RUN
-- ============================================================

-- TABEL 1: debts (data utang & piutang)
CREATE TABLE debts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('utang', 'piutang')),
  nama        TEXT NOT NULL,
  keterangan  TEXT,
  total       NUMERIC NOT NULL,
  jatuh_tempo DATE,
  lunas       BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TABEL 2: debt_payments (riwayat cicilan)
CREATE TABLE debt_payments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id    UUID REFERENCES debts(id) ON DELETE CASCADE,
  tanggal    DATE NOT NULL,
  nominal    NUMERIC NOT NULL,
  catatan    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE debts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_debts"
  ON debts FOR ALL USING (true);

CREATE POLICY "service_role_all_debt_payments"
  ON debt_payments FOR ALL USING (true);
