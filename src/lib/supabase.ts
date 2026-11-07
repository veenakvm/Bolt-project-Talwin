import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Section {
  id: string;
  section_name: string;
  title: string;
  subtitle: string;
  content: Record<string, any>;
  image_url: string;
  is_active: boolean;
  display_order: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  is_popular: boolean;
  display_order: number;
  is_active: boolean;
  button_link?: string;
}

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_group: string;
  description: string;
  updated_at: string;
  created_at: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  location: string;
  display_order: number;
  is_active: boolean;
  open_in_new_tab: boolean;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
