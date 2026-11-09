import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VendorSignup from './VendorSignup';

const logoSrc = `${import.meta.env.BASE_URL}talwin-logo.jpeg`;

type Mode = 'login' | 'change-password' | 'vendor-signup';

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  // Change password state
  const [cpEmail, setCpEmail] = useState('');
  const [cpCurrentPassword, setCpCurrentPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [cpShowCurrent, setCpShowCurrent] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);
  const [cpSuccess, setCpSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Invalid email or password'
        : `Sign-in failed: ${error.message}`);
    }
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCpSuccess('');

    if (cpNewPassword !== cpConfirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (cpNewPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cpEmail,
        password: cpCurrentPassword
      });

      if (signInError) {
        setError('Current email or password is incorrect');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: cpNewPassword
      });

      if (updateError) {
        setError('Failed to update password. Please try again.');
      } else {
        setCpSuccess('Password changed successfully! You can now log in with your new password.');
        setCpEmail('');
        setCpCurrentPassword('');
        setCpNewPassword('');
        setCpConfirmPassword('');
        await supabase.auth.signOut();
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] bg-white">
      <aside className="hidden lg:flex flex-col justify-between bg-brand-950 text-brand-100 p-12 xl:p-16">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-white p-1.5">
            <img src={logoSrc} alt="Talwin AquaRay logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="text-base font-semibold text-white leading-tight">TALWIN AquaRay</div>
            <div className="text-sm text-brand-300 leading-tight">Solutions</div>
          </div>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl xl:text-4xl font-semibold text-white leading-tight tracking-tight">
            Water treatment and solar, from site survey to invoice.
          </h2>
          <ul className="mt-8 space-y-3 text-sm text-brand-200">
            <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-400 shrink-0" />Sales, installation and complaint pipelines</li>
            <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-400 shrink-0" />Site surveys with product specifications</li>
            <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-400 shrink-0" />GST quotations and invoices</li>
          </ul>
        </div>
        <div className="text-xs text-brand-400 leading-relaxed">
          No 34, Nyanappanhalli, 80 Feet Road, BTM 4th Stage, Bengaluru 560076<br />
          89040 69224 · www.talwin.in · info@talwin.in
        </div>
      </aside>

      <div className="min-h-screen flex items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-sm">
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <img src={logoSrc} alt="Talwin AquaRay logo" className="h-11 w-11 object-contain" />
          <div>
            <div className="text-base font-semibold text-gray-900 leading-tight">TALWIN AquaRay</div>
            <div className="text-sm text-gray-500 leading-tight">Solutions</div>
          </div>
        </div>

        {mode === 'vendor-signup' && (
          <VendorSignup onBack={() => { setMode('login'); setError(''); }} />
        )}

        {mode === 'login' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Sign in</h1>
              <p className="mt-1 text-sm text-gray-600">Staff and vendors: sign in to access the dashboard.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setMode('change-password'); setError(''); }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mx-auto"
                >
                  <KeyRound className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
              New vendor?{' '}
              <button
                type="button"
                onClick={() => { setMode('vendor-signup'); setError(''); }}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Register here
              </button>
            </div>
          </>
        )}

        {mode === 'change-password' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Change password</h1>
              <p className="text-gray-600">Enter your current credentials and a new password</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={cpEmail}
                  onChange={(e) => setCpEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Your email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={cpShowCurrent ? 'text' : 'password'}
                    value={cpCurrentPassword}
                    onChange={(e) => setCpCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-12"
                    placeholder="Current password"
                  />
                  <button
                    type="button"
                    onClick={() => setCpShowCurrent(!cpShowCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {cpShowCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={cpShowNew ? 'text' : 'password'}
                    value={cpNewPassword}
                    onChange={(e) => setCpNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-12"
                    placeholder="New password (min 6 chars)"
                  />
                  <button
                    type="button"
                    onClick={() => setCpShowNew(!cpShowNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {cpShowNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={cpConfirmPassword}
                  onChange={(e) => setCpConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {cpSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {cpSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setCpSuccess(''); }}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </form>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
