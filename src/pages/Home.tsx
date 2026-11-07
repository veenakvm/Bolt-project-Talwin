import Hero from '../components/Hero';
import Features from '../components/Features';
import Pricing from '../components/Pricing';
import CTA from '../components/CTA';
import { Section, PricingPlan } from '../lib/supabase';

interface HomeProps {
  sections: Record<string, Section>;
  pricingPlans: PricingPlan[];
  settings: Record<string, string>;
}

export default function Home({ sections, pricingPlans, settings }: HomeProps) {
  return (
    <>
      <Hero section={sections.hero || null} />
      <Features section={sections.features || null} />
      <Pricing plans={pricingPlans} />
      <CTA section={sections.cta || null} settings={settings} />
    </>
  );
}
