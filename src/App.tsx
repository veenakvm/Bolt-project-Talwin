import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import SurveyForm from './components/SurveyForm';
import SurveyList from './components/SurveyList';
import SalesPipeline from './components/SalesPipeline';
import InstallationPipeline from './components/InstallationPipeline';
import ComplaintPipeline from './components/ComplaintPipeline';
import Reports from './components/Reports';
import UserAccess from './components/UserAccess';
import Products from './components/Products';
import Architects from './components/Architects';
import Vendors from './components/Vendors';
import Expenses from './components/Expenses';
import Invoices from './components/Invoices';
import Quotations from './components/Quotations';
import type { QuotationForInvoice } from './components/Invoices';
import {
  ClipboardPlus, ClipboardList, LogOut, TrendingUp, Wrench, AlertCircle, BarChart3, Wallet,
  ShieldCheck, Clock, Package, Users, Building2, FileText, Receipt, Menu, X, type LucideIcon
} from 'lucide-react';

type View =
  | 'sales' | 'installation' | 'complaint'
  | 'survey-new' | 'survey-list'
  | 'quotations' | 'invoices' | 'products' | 'expenses'
  | 'architects' | 'vendors'
  | 'reports' | 'access';

interface NavItem { id: View; label: string; icon: LucideIcon }
interface NavGroup { label: string; items: NavItem[] }

const STAFF_NAV: NavGroup[] = [
  {
    label: 'Pipelines',
    items: [
      { id: 'sales', label: 'Sales', icon: TrendingUp },
      { id: 'installation', label: 'Installations', icon: Wrench },
      { id: 'complaint', label: 'Complaints', icon: AlertCircle },
    ],
  },
  {
    label: 'Site Surveys',
    items: [
      { id: 'survey-new', label: 'New Survey', icon: ClipboardPlus },
      { id: 'survey-list', label: 'All Surveys', icon: ClipboardList },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'quotations', label: 'Quotations', icon: FileText },
      { id: 'invoices', label: 'Invoices', icon: Receipt },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'expenses', label: 'Expenses', icon: Wallet },
    ],
  },
  {
    label: 'Contacts',
    items: [
      { id: 'architects', label: 'Professionals', icon: Building2 },
      { id: 'vendors', label: 'Vendors', icon: Users },
    ],
  },
  {
    label: 'Admin',
    items: [
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'access', label: 'User Access', icon: ShieldCheck },
    ],
  },
];

const VENDOR_NAV: NavGroup[] = [
  {
    label: 'Vendor Portal',
    items: [
      { id: 'quotations', label: 'Quotations', icon: FileText },
      { id: 'invoices', label: 'Invoices', icon: Receipt },
    ],
  },
];

const logoSrc = `${import.meta.env.BASE_URL}talwin-logo.jpeg`;

function App() {
  const { user, role, loading, signOut } = useAuth();
  const isDealer = role === 'dealer';
  const nav = isDealer ? VENDOR_NAV : STAFF_NAV;
  const allowed = nav.flatMap(g => g.items);

  const [view, setView] = useState<View>('sales');
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingQuotation, setPendingQuotation] = useState<QuotationForInvoice | null>(null);

  // Vendors only ever land on their own pages.
  const activeView: View = allowed.some(i => i.id === view) ? view : allowed[0].id;
  const activeItem = allowed.find(i => i.id === activeView)!;
  const activeGroup = nav.find(g => g.items.includes(activeItem))!;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeView]);

  const go = (next: View) => {
    setView(next);
    setMenuOpen(false);
  };

  const convertQuotationToInvoice = (quotation: QuotationForInvoice) => {
    setPendingQuotation(quotation);
    go('invoices');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (role === 'pending' || role === 'disabled') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-card w-full max-w-md p-8 text-center">
          <img src={logoSrc} alt="Talwin AquaRay" className="h-14 w-14 mx-auto mb-6 object-contain" />
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-amber-50 mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            {role === 'pending' ? 'Waiting for approval' : 'Access disabled'}
          </h1>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            {role === 'pending'
              ? 'Thanks for registering. Talwin staff will review your account. Please sign in again once you have been approved.'
              : 'Your access to the Talwin portal has been turned off. Please contact Talwin AquaRay if you think this is a mistake.'}
          </p>
          <p className="mt-4 text-xs text-gray-500">Signed in as {user.email}</p>
          <button
            onClick={signOut}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-brand-950 text-brand-100">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0">
        <div className="h-10 w-10 rounded-lg bg-white p-1 shrink-0">
          <img src={logoSrc} alt="Talwin AquaRay logo" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white leading-tight">TALWIN AquaRay</div>
          <div className="text-xs text-brand-300 leading-tight">{isDealer ? 'Vendor Portal' : 'Solutions'}</div>
        </div>
        <button
          onClick={() => setMenuOpen(false)}
          className="ml-auto lg:hidden p-1.5 rounded-md text-brand-200 hover:bg-white/10"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Main">
        {nav.map(group => (
          <div key={group.label}>
            <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-400">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const active = item.id === activeView;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => go(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-brand-600 text-white'
                          : 'text-brand-100 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-brand-300'}`} />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-brand-700 text-white text-sm font-semibold flex items-center justify-center shrink-0">
            {(user.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-white truncate">{user.email}</div>
            <div className="text-xs text-brand-300">{isDealer ? 'Vendor' : 'Staff'}</div>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-md text-brand-200 hover:bg-white/10 hover:text-white"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
        <div className="mt-3 text-[11px] leading-relaxed text-brand-400">
          89040 69224 · info@talwin.in
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="no-print hidden lg:block fixed inset-y-0 left-0 w-64 z-30">{sidebar}</aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="no-print lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden -ml-1 p-2 rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src={logoSrc} alt="" className="lg:hidden h-8 w-8 object-contain" />
          <div className="min-w-0">
            <div className="text-xs text-gray-500 leading-tight">{activeGroup.label}</div>
            <div className="text-base font-semibold text-gray-900 leading-tight truncate">{activeItem.label}</div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {activeView === 'sales' && <SalesPipeline />}
          {activeView === 'installation' && <InstallationPipeline />}
          {activeView === 'complaint' && <ComplaintPipeline />}
          {activeView === 'survey-new' && <SurveyForm onSuccess={() => go('survey-list')} />}
          {activeView === 'survey-list' && <SurveyList />}
          {activeView === 'quotations' && <Quotations onConvertToInvoice={convertQuotationToInvoice} />}
          {activeView === 'invoices' && (
            <Invoices fromQuotation={pendingQuotation} onQuotationHandled={() => setPendingQuotation(null)} />
          )}
          {activeView === 'products' && <Products />}
          {activeView === 'expenses' && <Expenses />}
          {activeView === 'architects' && <Architects />}
          {activeView === 'vendors' && <Vendors />}
          {activeView === 'reports' && <Reports />}
          {activeView === 'access' && <UserAccess />}
        </main>
      </div>
    </div>
  );
}

export default App;
