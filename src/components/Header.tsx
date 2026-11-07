import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NavigationItem } from '../lib/supabase';

interface HeaderProps {
  navItems: NavigationItem[];
}

export default function Header({ navItems }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const getStartedUrl = 'https://admin.omnigrowcom.in/u/67653/appointment-for-demo-session';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/omnigrow.png" alt="OmniGrow" className="h-10" />
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target={item.open_in_new_tab ? '_blank' : undefined}
                rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}
                className="text-gray-700 hover:text-[#29b371] transition-colors font-medium"
              >
                {item.label}
              </a>
            ))}
            <a
              href={getStartedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-[#29b371] text-white rounded-lg font-semibold hover:bg-[#22a065] hover:shadow-lg transition-all"
            >
              Get Started
            </a>
          </div>

          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target={item.open_in_new_tab ? '_blank' : undefined}
                rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}
                className="block text-gray-700 hover:text-[#29b371] transition-colors font-medium"
              >
                {item.label}
              </a>
            ))}
            <a
              href={getStartedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center w-full px-6 py-2.5 bg-[#29b371] text-white rounded-lg font-semibold"
            >
              Get Started
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}
