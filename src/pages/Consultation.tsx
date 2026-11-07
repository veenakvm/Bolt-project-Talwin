import { useState } from 'react';
import { Menu, X, CheckCircle, Calendar, Clock, User, Mail, Phone, Building2, MessageSquare, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

const timeSlots = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '1:00 PM - 2:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM',
];

const businessTypes = [
  'E-Commerce / Retail',
  'SaaS / Software',
  'Healthcare',
  'Real Estate',
  'Education / EdTech',
  'Finance / FinTech',
  'Marketing / Agency',
  'Food & Beverage',
  'Hospitality / Travel',
  'Manufacturing',
  'Consulting / Professional Services',
  'Other',
];

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  business_type: string;
  message: string;
  preferred_date: string;
  preferred_time: string;
}

const initialForm: FormData = {
  full_name: '',
  email: '',
  phone: '',
  business_name: '',
  business_type: '',
  message: '',
  preferred_date: '',
  preferred_time: '',
};

export default function Consultation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.phone) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const { error: dbError } = await supabase.from('consultation_bookings').insert([form]);
      if (dbError) throw dbError;
      setSubmitted(true);
      setForm(initialForm);
    } catch {
      setError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="https://omnigrowcom.in">
              <img src="/omnigrow.png" alt="OmniGrow" className="h-10" />
            </a>
            <div className="hidden md:flex items-center space-x-8">
              <a href="https://omnigrowcom.in/#features" className="text-gray-700 hover:text-[#29b371] transition-colors font-medium">Features</a>
              <a href="https://omnigrowcom.in/#pricing" className="text-gray-700 hover:text-[#29b371] transition-colors font-medium">Pricing</a>
              <a
                href="https://admin.omnigrowcom.in/u/67653/appointment-for-demo-session"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-[#29b371] text-white rounded-lg font-semibold hover:bg-[#22a065] hover:shadow-lg transition-all"
              >
                Book a Demo
              </a>
            </div>
            <button className="md:hidden text-gray-700" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          {menuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3">
              <a href="https://omnigrowcom.in/#features" className="block text-gray-700 hover:text-[#29b371] font-medium">Features</a>
              <a href="https://omnigrowcom.in/#pricing" className="block text-gray-700 hover:text-[#29b371] font-medium">Pricing</a>
              <a
                href="https://admin.omnigrowcom.in/u/67653/appointment-for-demo-session"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center px-6 py-2.5 bg-[#29b371] text-white rounded-lg font-semibold"
              >
                Book a Demo
              </a>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-slate-900 via-slate-800 to-[#1a7a4a]">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#29b371]/20 text-[#4ade80] text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-[#29b371]/30">
            <Calendar size={14} />
            Free Consultation
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Book Your Free<br />
            <span className="text-[#29b371]">Growth Consultation</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Talk to our experts and discover how OmniGrow can transform your business. No commitment, no pressure — just real insights tailored to your goals.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-300">
            {['30-minute session', '100% Free', 'Expert advice', 'Tailored strategy'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle size={16} className="text-[#29b371]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto">

            {/* Left — What to expect */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What to Expect</h2>
                <p className="text-gray-600 leading-relaxed">
                  In your free 30-minute consultation, our growth specialists will walk you through how OmniGrow can be tailored specifically to your business needs.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: <CheckCircle size={20} className="text-[#29b371] mt-0.5 shrink-0" />, title: 'Business Analysis', desc: 'We review your current setup and identify key growth opportunities.' },
                  { icon: <CheckCircle size={20} className="text-[#29b371] mt-0.5 shrink-0" />, title: 'Custom Strategy', desc: 'Get a personalised roadmap built around your goals and budget.' },
                  { icon: <CheckCircle size={20} className="text-[#29b371] mt-0.5 shrink-0" />, title: 'Live Demo', desc: 'See OmniGrow in action with a walkthrough relevant to your industry.' },
                  { icon: <CheckCircle size={20} className="text-[#29b371] mt-0.5 shrink-0" />, title: 'Q&A Session', desc: 'Ask anything — our experts answer every question honestly.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    {item.icon}
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#29b371]/10 border border-[#29b371]/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} className="text-[#29b371]" />
                  <span className="font-semibold text-gray-900 text-sm">Session Details</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Duration: 30 minutes</li>
                  <li>Format: Video call (Google Meet / Zoom)</li>
                  <li>Cost: Completely free</li>
                  <li>Response within 24 hours</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-1">Need immediate help?</p>
                <a href="mailto:SalesnServices@omnigrowcom.in" className="text-[#29b371] text-sm font-medium hover:underline">SalesnServices@omnigrowcom.in</a>
              </div>
            </div>

            {/* Right — Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                  <div className="w-16 h-16 bg-[#29b371]/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle size={32} className="text-[#29b371]" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Booking Received!</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    Thank you! Our team will review your request and get back to you within 24 hours to confirm your consultation slot.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 bg-[#29b371] text-white rounded-lg font-semibold hover:bg-[#22a065] transition-all"
                  >
                    Book Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Schedule Your Consultation</h2>
                    <p className="text-gray-500 text-sm mt-1">Fill in your details and we'll confirm your slot within 24 hours.</p>
                  </div>

                  {/* Personal Info */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="full_name"
                          value={form.full_name}
                          onChange={handleChange}
                          placeholder="John Smith"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#29b371]/30 focus:border-[#29b371] transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="john@company.com"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#29b371]/30 focus:border-[#29b371] transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#29b371]/30 focus:border-[#29b371] transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
                      <div className="relative">
                        <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="business_name"
                          value={form.business_name}
                          onChange={handleChange}
                          placeholder="Your Business"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#29b371]/30 focus:border-[#29b371] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Type / Industry</label>
                    <div className="relative">
                      <select
                        name="business_type"
                        value={form.business_type}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#29b371]/30 focus:border-[#29b371] transition-all text-gray-700 bg-white"
                      >
                        <option value="">Select your industry</option>
                        {businessTypes.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Preferred Date & Time */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <Calendar size={14} className="inline mr-1 text-gray-400" />
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        name="preferred_date"
                        value={form.preferred_date}
                        onChange={handleChange}
                        min={today}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#29b371]/30 focus:border-[#29b371] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <Clock size={14} className="inline mr-1 text-gray-400" />
                        Preferred Time Slot
                      </label>
                      <div className="relative">
                        <select
                          name="preferred_time"
                          value={form.preferred_time}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#29b371]/30 focus:border-[#29b371] transition-all bg-white text-gray-700"
                        >
                          <option value="">Select a time</option>
                          {timeSlots.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <MessageSquare size={14} className="inline mr-1 text-gray-400" />
                      What would you like help with?
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Tell us about your business goals, current challenges, or anything specific you'd like to discuss..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#29b371]/30 focus:border-[#29b371] transition-all resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#29b371] text-white rounded-lg font-semibold text-base hover:bg-[#22a065] hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? 'Submitting...' : 'Book My Free Consultation'}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    By submitting, you agree to our privacy policy. We'll never share your data.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-8">
        <div className="container mx-auto px-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} OmniGrow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
