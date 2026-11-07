import { Mail, Calendar } from 'lucide-react';
import { Section } from '../lib/supabase';

interface CTAProps {
  section: Section | null;
  settings: Record<string, string>;
}

export default function CTA({ section, settings }: CTAProps) {
  const title = section?.title || 'Ready to Transform Your Business';
  const subtitle = section?.subtitle || 'Reach us by Email or WhatsApp for Understanding more Ways in Build a Sales System for your Business.';
  const contactEmail = settings.contact_email || 'SalesnServices@omnigrowcom.in';
  const whatsappNumber = settings.whatsapp_number || '1234567890';
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;
  const bookDemoUrl = 'https://admin.omnigrowcom.in/u/67653/appointment-for-demo-session';

  return (
    <section className="py-24 bg-[#032826] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzFmMmQzZCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {title}
          </h2>
          <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={bookDemoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group px-8 py-4 bg-[#29b371] text-white rounded-xl font-semibold text-lg hover:bg-[#22a065] hover:shadow-2xl hover:scale-105 transition-all flex items-center space-x-3"
            >
              <Calendar size={22} />
              <span>Book a Calendar</span>
            </a>
            <a
              href={`mailto:${contactEmail}`}
              className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all flex items-center space-x-3"
            >
              <Mail size={22} />
              <span>Email Us</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
