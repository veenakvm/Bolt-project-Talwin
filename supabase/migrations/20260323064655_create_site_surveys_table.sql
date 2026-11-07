/*
  # Create Site Surveys Table

  1. New Tables
    - `site_surveys`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `customer` (text) - Customer name
      - `mobile` (text) - Mobile number
      - `survey_date` (date) - Date of survey
      - `area_location` (text) - Area/Location
      - `property_type` (text) - Type of property
      - `users` (text) - Number of users
      - `requested_install_date` (date) - Requested installation date
      - `water_source_borewell` (boolean)
      - `water_source_kaveri` (boolean)
      - `water_source_tanker` (boolean)
      - `water_source_mixed` (boolean)
      - `sump_capacity` (text) - Y/N
      - `sump_ltrs` (text) - Sump Ltrs
      - `oht_capacity` (text) - Y/N
      - `oht_ltrs` (text) - OHT Ltrs
      - `hardness_ppm` (text)
      - `tds_ppm` (text)
      - `water_iron` (boolean)
      - `water_smell` (boolean)
      - `pressure_low` (boolean)
      - `pressure_med` (boolean)
      - `pressure_high` (boolean)
      - `pipe_old` (boolean)
      - `pipe_new` (boolean)
      - `pipe_size` (text)
      - `water_softener` (boolean)
      - `water_softener_capacity` (text)
      - `ro_purifier` (boolean)
      - `ro_purifier_model` (text)
      - `water_heater` (boolean)
      - `water_heater_litres` (text)
      - `solar_heat_pump` (boolean)
      - `solar_heat_pump_lpd` (text)
      - `pressure_pump` (boolean)
      - `pressure_pump_hp` (text)
      - `submersible_pump` (boolean)
      - `submersible_pump_hp` (text)
      - `water_level_controller` (boolean)
      - `water_level_controller_type` (text)
      - `solar_rooftop` (boolean)
      - `solar_rooftop_kw` (text)
      - `power_available` (text) - Y/N
      - `drain_available` (text) - Y/N
      - `earthing_available` (text) - Y/N
      - `safe_access` (text) - Y/N
      - `plumbing_status` (text) - No/Minor/Major
      - `tech_signature` (text) - Tech Name & Sign
      - `customer_signature` (text) - Customer Sign

  2. Security
    - Enable RLS on `site_surveys` table
    - Add policy for public access (for demo purposes)
*/

CREATE TABLE IF NOT EXISTS site_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  customer text DEFAULT '',
  mobile text DEFAULT '',
  survey_date date,
  area_location text DEFAULT '',
  property_type text DEFAULT '',
  users text DEFAULT '',
  requested_install_date date,
  water_source_borewell boolean DEFAULT false,
  water_source_kaveri boolean DEFAULT false,
  water_source_tanker boolean DEFAULT false,
  water_source_mixed boolean DEFAULT false,
  sump_capacity text DEFAULT '',
  sump_ltrs text DEFAULT '',
  oht_capacity text DEFAULT '',
  oht_ltrs text DEFAULT '',
  hardness_ppm text DEFAULT '',
  tds_ppm text DEFAULT '',
  water_iron boolean DEFAULT false,
  water_smell boolean DEFAULT false,
  pressure_low boolean DEFAULT false,
  pressure_med boolean DEFAULT false,
  pressure_high boolean DEFAULT false,
  pipe_old boolean DEFAULT false,
  pipe_new boolean DEFAULT false,
  pipe_size text DEFAULT '',
  water_softener boolean DEFAULT false,
  water_softener_capacity text DEFAULT '',
  ro_purifier boolean DEFAULT false,
  ro_purifier_model text DEFAULT '',
  water_heater boolean DEFAULT false,
  water_heater_litres text DEFAULT '',
  solar_heat_pump boolean DEFAULT false,
  solar_heat_pump_lpd text DEFAULT '',
  pressure_pump boolean DEFAULT false,
  pressure_pump_hp text DEFAULT '',
  submersible_pump boolean DEFAULT false,
  submersible_pump_hp text DEFAULT '',
  water_level_controller boolean DEFAULT false,
  water_level_controller_type text DEFAULT '',
  solar_rooftop boolean DEFAULT false,
  solar_rooftop_kw text DEFAULT '',
  power_available text DEFAULT '',
  drain_available text DEFAULT '',
  earthing_available text DEFAULT '',
  safe_access text DEFAULT '',
  plumbing_status text DEFAULT '',
  tech_signature text DEFAULT '',
  customer_signature text DEFAULT ''
);

ALTER TABLE site_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site surveys"
  ON site_surveys
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert site surveys"
  ON site_surveys
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update site surveys"
  ON site_surveys
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete site surveys"
  ON site_surveys
  FOR DELETE
  TO public
  USING (true);