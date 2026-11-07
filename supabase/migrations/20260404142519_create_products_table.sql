/*
  # Create Products Table

  ## New Tables
  - `products`
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `product_name` (text) - Name of the product
    - `hsn_sac_code` (text) - HSN/SAC code for GST
    - `description` (text) - Product description
    - `unit` (text) - Unit of measurement (Pcs/Set/Nos/KW/LPH/Litre/HP)
    - `mrp` (numeric) - Maximum Retail Price
    - `unit_price` (numeric) - Unit price excluding GST
    - `gst_rate` (numeric) - GST rate (5, 12, 18, 28)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on `products` table
  - Add policy for authenticated users to read their own products
  - Add policy for authenticated users to insert their own products
  - Add policy for authenticated users to update their own products
  - Add policy for authenticated users to delete their own products
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  hsn_sac_code text DEFAULT '',
  description text DEFAULT '',
  unit text DEFAULT 'Pcs',
  mrp numeric DEFAULT 0,
  unit_price numeric DEFAULT 0,
  gst_rate numeric DEFAULT 18,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);