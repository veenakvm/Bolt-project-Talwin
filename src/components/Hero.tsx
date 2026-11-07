import { ArrowRight } from 'lucide-react';
import { Section } from '../lib/supabase';

interface HeroProps {
  section: Section | null;
}

export default function Hero({ section }: HeroProps) {
  const title = section?.title || 'Maximize Your Business Impact & Profitability';
  const description = section?.content?.description || 'We empower business owners with scalable coaching, new-age automation, and intelligent sales systems. The perfect synergy of human insight and AI efficiency, built for your success.';
  const ctaText = section?.content?.cta_text || 'Book a Free Demo';
  const bookDemoUrl = 'https://admin.omnigrowcom.in/u/67653/appointment-for-demo-session';

  return (
    <section className="relative min-h-[680px] flex items-center overflow-hidden bg-[#032826]">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
              <img src="/omnigrow.png" alt="OmniGrow" className="w-20 h-20" />
              <div className="text-7xl font-black text-[#29b371]">
                OmniGrow
              </div>
            </div>
            <div className="text-6xl font-bold text-white mb-5">
              Simplified Success
            </div>
            <h1 className="text-[42px] leading-tight font-bold text-white mb-5">
              {title}
            </h1>

            <p className="text-lg text-gray-200 leading-relaxed mb-8 max-w-xl">
              {description}
            </p>

            <a
              href={bookDemoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-[#29b371] text-white rounded-lg font-semibold text-lg hover:bg-[#22a065] transition-all shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
            >
              <span>{ctaText}</span>
              <ArrowRight size={20} />
            </a>
          </div>

          <div className="relative lg:block hidden">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:scale-105 transition-transform duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=300&fit=crop"
                    alt="AI Assistant Bot"
                    className="w-full h-auto rounded-xl"
                  />
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:scale-105 transition-transform duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=300&h=300&fit=crop"
                    alt="Business Analytics"
                    className="w-full h-auto rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-6 mt-12">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:scale-105 transition-transform duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=300&h=300&fit=crop"
                    alt="Automation System"
                    className="w-full h-auto rounded-xl"
                  />
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:scale-105 transition-transform duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=300&h=300&fit=crop"
                    alt="Growth Dashboard"
                    className="w-full h-auto rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
