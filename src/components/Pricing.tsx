import { Check, Sparkles } from 'lucide-react';
import { PricingPlan } from '../lib/supabase';

interface PricingProps {
  plans: PricingPlan[];
}

export default function Pricing({ plans }: PricingProps) {
  const sortedPlans = [...plans].sort((a, b) => a.display_order - b.display_order);

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-6">
            <span className="text-emerald-600 font-semibold text-sm">PRICING PLANS</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Investment That Pays for Itself
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan to accelerate your business growth
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {sortedPlans.map((plan, idx) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl p-10 transition-all duration-500 border-2 border-[#29b371] ${
                plan.is_popular
                  ? 'shadow-2xl scale-105'
                  : 'shadow-lg hover:shadow-2xl'
              }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <div className="bg-[#29b371] text-white px-6 py-2 rounded-full text-sm font-bold flex items-center space-x-2 shadow-lg">
                    <Sparkles size={16} />
                    <span>RECOMMENDED</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{plan.name}</h3>
                <div className="mb-6">
                  {plan.price === 0 ? (
                    <div className="flex items-baseline justify-center">
                      <span className="text-6xl font-bold text-[#29b371]">-</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-semibold text-gray-900">₹</span>
                      <span className="text-6xl font-bold text-[#29b371]">
                        {plan.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-gray-500 ml-2">/month</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed min-h-[60px]">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#29b371] flex items-center justify-center mt-0.5">
                      <Check className="text-white" size={14} strokeWidth={3} />
                    </div>
                    <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              {plan.button_link ? (
                <a
                  href={plan.button_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 rounded-xl font-bold text-lg transition-all text-center bg-[#29b371] text-white shadow-lg hover:bg-[#22a065] hover:shadow-xl hover:scale-105"
                >
                  {plan.price === 0 ? 'CONTACT SALES' : 'SELECT'}
                </a>
              ) : (
                <button
                  className="w-full py-4 rounded-xl font-bold text-lg transition-all bg-[#29b371] text-white shadow-lg hover:bg-[#22a065] hover:shadow-xl hover:scale-105"
                >
                  {plan.price === 0 ? 'CONTACT SALES' : 'SELECT'}
                </button>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
