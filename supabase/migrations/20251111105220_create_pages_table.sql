/*
  # Create pages table for editable content pages

  1. New Tables
    - `pages`
      - `id` (uuid, primary key) - Unique identifier
      - `slug` (text, unique) - URL-friendly identifier (e.g., 'terms-and-conditions', 'privacy-policy')
      - `title` (text) - Page title
      - `content` (text) - Full HTML/markdown content of the page
      - `meta_description` (text) - SEO meta description
      - `is_active` (boolean) - Whether page is published
      - `created_at` (timestamp) - Creation timestamp
      - `updated_at` (timestamp) - Last update timestamp

  2. Security
    - Enable RLS on `pages` table
    - Add policy for public read access (pages are public)
    - Authenticated users can manage pages

  3. Notes
    - Stores full page content like Terms & Conditions, Privacy Policy, etc.
    - Content can be HTML or markdown
    - Each page has a unique slug for routing
*/

CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  meta_description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active pages
CREATE POLICY "Public can view active pages"
  ON pages
  FOR SELECT
  TO public
  USING (is_active = true);

-- Authenticated users can manage pages
CREATE POLICY "Authenticated users can insert pages"
  ON pages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pages"
  ON pages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete pages"
  ON pages
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster lookups by slug
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_active ON pages(is_active);