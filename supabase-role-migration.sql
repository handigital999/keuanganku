-- =========================================
-- Tambah kolom role di tabel companies
-- =========================================
-- Tujuan:
-- - user = akses normal
-- - owner = akses lihat saja
-- - developer login tetap di env / API auth admin, bukan di tabel companies

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

UPDATE public.companies
SET role = 'user'
WHERE role IS NULL OR role NOT IN ('user', 'owner');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'companies_role_check'
      AND table_name = 'companies'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_role_check
      CHECK (role IN ('user', 'owner'));
  END IF;
END $$;

-- Cek hasilnya
SELECT id, name, email, active, role
FROM public.companies
ORDER BY created_at DESC;
