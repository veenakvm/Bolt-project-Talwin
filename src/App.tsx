import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase, Section, PricingPlan, SiteSetting, NavigationItem } from './lib/supabase';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import PageView from './pages/PageView';
import Consultation from './pages/Consultation';

export default function App() {
  const [sections, setSections] = useState<Record<string, Section>>({});
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [navigation, setNavigation] = useState<Record<string, NavigationItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    try {
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .eq('is_active', true);

      if (sectionsError) throw sectionsError;

      const sectionsMap: Record<string, Section> = {};
      sectionsData?.forEach((section) => {
        sectionsMap[section.section_name] = section;
      });
      setSections(sectionsMap);

      const { data: plansData, error: plansError } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (plansError) throw plansError;

      setPricingPlans(plansData || []);

      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('*');

      if (settingsError) throw settingsError;

      const settingsMap: Record<string, string> = {};
      settingsData?.forEach((setting: SiteSetting) => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });
      setSettings(settingsMap);

      const { data: navData, error: navError } = await supabase
        .from('navigation_items')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (navError) throw navError;

      const navMap: Record<string, NavigationItem[]> = {};
      navData?.forEach((item: NavigationItem) => {
        if (!navMap[item.location]) {
          navMap[item.location] = [];
        }
        navMap[item.location].push(item);
      });
      setNavigation(navMap);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Header navItems={navigation.header || []} />
                <Home sections={sections} pricingPlans={pricingPlans} settings={settings} />
                <Footer settings={settings} navItems={navigation} />
              </>
            }
          />
          <Route
            path="/page/:slug"
            element={
              <PageView
                settings={settings}
                navItems={navigation}
                headerNavItems={navigation.header || []}
              />
            }
          />
          <Route path="/consultation" element={<Consultation />} />
        </Routes>
      </div>
    </Router>
  );
}
