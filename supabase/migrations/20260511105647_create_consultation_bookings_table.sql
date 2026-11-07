/*
  # Create Consultation Bookings Table

  1. New Tables
    - `consultation_bookings`
      - `id` (uuid, primary key)
      - `full_name` (text, required) - visitor's full name
      - `email` (text, required) - visitor's email address
      - `phone` (text) - visitor's phone number
      - `business_name` (text) - name of their business
      - `business_type` (text) - type/industry of business
      - `message` (text) - what they want help with
      - `preferred_date` (date) - preferred consultation date
      - `preferred_time` (text) - preferred time slot
      - `status` (text) - booking status: pending, confirmed, cancelled
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `consultation_bookings` table
    - Allow public (anonymous) users to INSERT (submit booking form)
    - Only authenticated users (admins) can SELECT all bookings
*/

CREATE TABLE IF NOT EXISTS consultation_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  business_name text DEFAULT '',
  business_type text DEFAULT '',
  message text DEFAULT '',
  preferred_date date,
  preferred_time text DEFAULT '',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a consultation booking"
  ON consultation_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all bookings"
  ON consultation_bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update bookings"
  ON consultation_bookings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
