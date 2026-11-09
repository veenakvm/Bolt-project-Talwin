import React, { useState } from 'react';
import { ArrowLeft, UserPlus, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onBack: () => void;
}

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

/** Vendors register here; their account stays "pending" until staff approve it. */
export default function VendorSignup({ onBack }: Props) {
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<'signed-in' | 'confirm-email' | null>(null);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if ((form.phone.replace(/\D/g, '')).length < 10) {
      setError('Enter a valid phone number (at least 10 digits)');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          display_name: form.name.trim(),
          company: form.company.trim(),
          phone: form.phone.trim()
        }
      }
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    // With email confirmation off, Supabase signs the user in straight away and the
    // app shows the "awaiting approval" screen. Otherwise they must confirm first.
    setDone(data.session ? 'signed-in' : 'confirm-email');
  };

  if (done === 'confirm-email') {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="w-14 h-14 text-green-600 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">Registration received</h1>
        <p className="text-gray-600">
          We've sent a confirmation link to <strong>{form.email}</strong>. Click it, then sign in.
          You'll be able to use the portal once Talwin staff approve your account.
        </p>
        <button onClick={onBack} className="text-blue-600 hover:text-blue-800 font-medium">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to sign in
      </button>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <UserPlus className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendor Registration</h1>
        <p className="text-gray-600 text-sm">
          Register for the Talwin vendor portal. Talwin staff will approve your account before you can use it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name *</label>
          <input value={form.name} onChange={set('name')} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name *</label>
          <input value={form.company} onChange={set('company')} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
          <input type="tel" value={form.phone} onChange={set('phone')} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
          <input type="email" value={form.email} onChange={set('email')} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
          <input type="password" value={form.password} onChange={set('password')} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password *</label>
          <input type="password" value={form.confirm} onChange={set('confirm')} required className={inputClass} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </>
  );
}
