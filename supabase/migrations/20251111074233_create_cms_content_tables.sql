/*
  # Create CMS Content Management System

  1. New Tables
    - `sections`
      - `id` (uuid, primary key) - Unique identifier for each section
      - `section_name` (text) - Name/identifier of the section (hero, features, about, etc.)
      - `title` (text) - Main heading text
      - `subtitle` (text) - Subheading or description
      - `content` (jsonb) - Flexible content storage for various data types
      - `image_url` (text) - Optional image URL
      - `is_active` (boolean) - Whether section is visible
      - `display_order` (integer) - Order of display on page
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `pricing_plans`
      - `id` (uuid, primary key) - Unique identifier
      - `name` (text) - Plan name (Basic, Advance, Customised)
      - `price` (numeric) - Plan price
      - `description` (text) - Plan description
      - `features` (jsonb) - Array of features
      - `is_popular` (boolean) - Highlight as popular plan
      - `display_order` (integer) - Order of display
      - `is_active` (boolean) - Whether plan is active
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access (anyone can view the website)
    - Add policies for authenticated admin users to manage content

  3. Initial Data
    - Seed with default section placeholders
    - Seed with three pricing plans
*/

CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name text UNIQUE NOT NULL,
  title text DEFAULT '',
  subtitle text DEFAULT '',
  content jsonb DEFAULT '{}'::jsonb,
  image_url text DEFAULT '',
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  description text DEFAULT '',
  features jsonb DEFAULT '[]'::jsonb,
  is_popular boolean DEFAULT false,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sections"
  ON sections FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active pricing plans"
  ON pricing_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert sections"
  ON sections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sections"
  ON sections FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sections"
  ON sections FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pricing plans"
  ON pricing_plans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pricing plans"
  ON pricing_plans FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete pricing plans"
  ON pricing_plans FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO sections (section_name, title, subtitle, content, display_order) VALUES
  ('hero', 'Transform Your Business with AI-Powered Automation', 'Success Simplified with OmniGrow', '{"cta_text": "Get Started", "cta_secondary": "Learn More"}'::jsonb, 1),
  ('features', 'Powerful Features for Modern Businesses', 'Everything you need to scale your business efficiently', '{}'::jsonb, 2),
  ('benefits', 'Why Choose OmniGrow', 'Built for business owners who want results', '{}'::jsonb, 3),
  ('testimonials', 'Trusted by Business Leaders', 'See what our clients say about us', '{}'::jsonb, 4),
  ('cta', 'Ready to Transform Your Business?', 'Join hundreds of successful businesses using OmniGrow', '{"button_text": "Start Your Journey"}'::jsonb, 5);

INSERT INTO pricing_plans (name, price, description, features, is_popular, display_order) VALUES
  ('Basic', 7999, 'Perfect for startups and small businesses', '["Essential automation tools", "Email support", "Basic analytics", "Up to 5 users"]'::jsonb, false, 1),
  ('Advance', 11999, 'For growing businesses that need more power', '["Advanced automation suite", "Priority support", "Advanced analytics & reporting", "Up to 20 users", "Custom integrations", "API access"]'::jsonb, true, 2),
  ('Customised', 0, 'Tailored solutions for enterprise needs', '["Everything in Advance", "Unlimited users", "Dedicated account manager", "Custom development", "White-label options", "SLA guarantee"]'::jsonb, false, 3);
