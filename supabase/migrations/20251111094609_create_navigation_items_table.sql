/*
  # Create navigation items table

  1. New Tables
    - `navigation_items`
      - `id` (uuid, primary key) - Unique identifier
      - `label` (text) - Display text for the link (e.g., "Pricing", "Integration")
      - `url` (text) - The href/link (e.g., "#pricing", "/integration", "https://example.com")
      - `location` (text) - Where this link appears (e.g., 'header', 'footer_pages', 'footer_utility')
      - `display_order` (integer) - Order of appearance
      - `is_active` (boolean) - Whether to show this link
      - `open_in_new_tab` (boolean) - Whether to open link in new tab
      - `created_at` (timestamp) - Creation timestamp
      - `updated_at` (timestamp) - Last update timestamp

  2. Security
    - Enable RLS on `navigation_items` table
    - Add policy for public read access (navigation is public)
    - Authenticated users can manage navigation items

  3. Notes
    - Links can be internal (#pricing) or external (https://example.com)
    - Different locations: header, footer_pages, footer_utility
    - Display order controls sequence of links
*/

CREATE TABLE IF NOT EXISTS navigation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  location text NOT NULL DEFAULT 'header',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  open_in_new_tab boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access (navigation is displayed on public website)
CREATE POLICY "Public can view navigation items"
  ON navigation_items
  FOR SELECT
  TO public
  USING (is_active = true);

-- Authenticated users can manage navigation items
CREATE POLICY "Authenticated users can insert navigation items"
  ON navigation_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update navigation items"
  ON navigation_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete navigation items"
  ON navigation_items
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_navigation_location ON navigation_items(location, display_order);
CREATE INDEX IF NOT EXISTS idx_navigation_active ON navigation_items(is_active);