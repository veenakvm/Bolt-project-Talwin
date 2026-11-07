import { NavigationItem } from '../lib/supabase';

interface FooterProps {
  settings: Record<string, string>;
  navItems: Record<string, NavigationItem[]>;
}

export default function Footer({ settings, navItems }: FooterProps) {
  const contactEmail = settings.contact_email || 'SalesnServices@omnigrowcom.in';
  const whatsappNumber = settings.whatsapp_number || '1234567890';
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;
  const footerDescription = settings.footer_description || 'Empowering businesses with scalable coaching, automation, and intelligent sales systems.';
  const companyName = settings.company_name || 'OmniGrow';
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-slate-900 text-gray-300">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <img src="/omnigrow.png" alt="OmniGrow" className="h-12" />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {footerDescription}
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href={`mailto:${contactEmail}`} className="text-gray-400 hover:text-[#29b371] transition-colors text-sm">
                  {contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-gray-400">&copy; {currentYear} {companyName}. All rights reserved.</p>

          <div className="flex space-x-8 text-sm">
            <a href="/page/terms-and-conditions" className="text-gray-400 hover:text-[#29b371] transition-colors">
              Terms & Conditions
            </a>
            <a href="/page/refund-policy" className="text-gray-400 hover:text-[#29b371] transition-colors">
              Refund Policy
            </a>
            <a href="/page/privacy-policy" className="text-gray-400 hover:text-[#29b371] transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
