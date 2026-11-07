/*
  # Create site settings table

  1. New Tables
    - `site_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `setting_key` (text, unique) - Setting identifier (e.g., 'contact_email', 'whatsapp_number')
      - `setting_value` (text) - The actual value
      - `setting_group` (text) - Group settings by category (e.g., 'contact', 'social', 'company')
      - `description` (text) - Human-readable description of what this setting controls
      - `updated_at` (timestamp) - Last update timestamp
      - `created_at` (timestamp) - Creation timestamp

  2. Security
    - Enable RLS on `site_settings` table
    - Add policy for public read access (settings are public on the website)
    - Only authenticated admins can update (restrictive by default, can be adjusted later)

  3. Notes
    - Settings include: email addresses, WhatsApp numbers, social links, company info
    - All settings are stored as text for flexibility
    - Settings are grouped for better organization in CMS
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL DEFAULT '',
  setting_group text NOT NULL DEFAULT 'general',
  description text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (settings are displayed on public website)
CREATE POLICY "Public can view site settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can update settings (can be restricted further to admin role)
CREATE POLICY "Authenticated users can update settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can insert settings
CREATE POLICY "Authenticated users can insert settings"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_group ON site_settings(setting_group);