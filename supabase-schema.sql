-- Run this in your Supabase SQL Editor to create the table

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster filtering by brand
CREATE INDEX idx_products_brand ON products(brand);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security (allow all for now — public app)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON products
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed data from Excel
INSERT INTO products (brand, model, stock) VALUES
  ('Apple', 'IP11', 0),
  ('Apple', 'IP11-PRO', 0),
  ('Apple', 'IP11-PRO-MAX', 0),
  ('Apple', 'IP12/IP12-PRO', 40),
  ('Apple', 'IP12-PRO-MAX', 40),
  ('Apple', 'IP13/IP14', 40),
  ('Apple', 'IP13-PRO', 20),
  ('Apple', 'IP13-PRO-MAX', 20),
  ('Apple', 'IP14-PRO', 20),
  ('Apple', 'IP14-PRO-MAX', 20),
  ('Apple', 'IP15', 20),
  ('Apple', 'IP15-PRO', 20),
  ('Apple', 'IP15-PLUS/IP14-PLUS', 40),
  ('Apple', 'IP15-PRO-MAX', 20),
  ('Apple', 'IP16', 20),
  ('Apple', 'IP16-PRO', 20),
  ('Apple', 'IP16-PLUS', 20),
  ('Apple', 'IP16-PRO-MAX', 20),
  ('Apple', 'IP17', 20),
  ('Apple', 'IP17-AIR', 20),
  ('Apple', 'IP17-PRO', 20),
  ('Apple', 'IP17-PRO-MAX', 20),
  ('Samsung', 'A06', 20),
  ('Samsung', 'A56', 20),
  ('Samsung', 'A16', 20),
  ('Samsung', 'A54', 20),
  ('Samsung', 'A55', 20),
  ('Samsung', 'S23', 20),
  ('Samsung', 'S23-FE', 20),
  ('Samsung', 'S23-PLUS', 20),
  ('Samsung', 'S23-ULTRA', 20),
  ('Samsung', 'S24', 20),
  ('Samsung', 'S24-PLUS', 20),
  ('Samsung', 'S24-ULTRA', 20),
  ('Samsung', 'S25', 20),
  ('Samsung', 'S25-PLUS', 20),
  ('Samsung', 'S25-ULTRA', 20),
  ('Xiaomi', '15C', 60),
  ('Xiaomi', 'A3', 60),
  ('Xiaomi', '14C', 60),
  ('Xiaomi', '9A', 60),
  ('HONOR', 'X8B', 60);
