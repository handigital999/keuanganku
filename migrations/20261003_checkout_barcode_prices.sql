ALTER TABLE stocks
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS harga_grosir NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS harga_usaha NUMERIC NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS stocks_company_barcode_unique
  ON stocks (company_id, barcode)
  WHERE barcode IS NOT NULL AND barcode <> '';
