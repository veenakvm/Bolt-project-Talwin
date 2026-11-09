import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Wrench, AlertCircle, Calendar, ShoppingBag, Search, Download } from 'lucide-react';
import { generateExpenseReportPDF } from '../lib/reportPdfGenerator';

type DateFilter = 'today' | 'week' | 'month' | 'quarter' | 'all' | 'custom';
type ReportTab = 'dashboard' | 'expenses';

interface SalesEntry {
  id: string;
  source: string;
  city: string;
  quotation_status: string;
  estimated_value: number;
  created_at: string;
}
interface InstallationEntry { id: string; installation_status: string; created_at: string; }
interface ComplaintEntry { id: string; complaint_status: string; created_at: string; }

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_mode: string;
  remarks: string;
}


function DateFilterBar({
  dateFilter, setDateFilter,
  customStartDate, setCustomStartDate,
  customEndDate, setCustomEndDate
}: {
  dateFilter: DateFilter;
  setDateFilter: (f: DateFilter) => void;
  customStartDate: string;
  setCustomStartDate: (d: string) => void;
  customEndDate: string;
  setCustomEndDate: (d: string) => void;
}) {
  const btns: { label: string; value: DateFilter }[] = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'All Time', value: 'all' },
    { label: 'Custom', value: 'custom' },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-5 h-5 text-gray-500" />
        {btns.map(b => (
          <button
            key={b.value}
            onClick={() => setDateFilter(b.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              dateFilter === b.value
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >{b.label}</button>
        ))}
      </div>
      {dateFilter === 'custom' && (
        <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-300">
          <label className="text-sm font-medium text-gray-700">From:</label>
          <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm" />
          <label className="text-sm font-medium text-gray-700">To:</label>
          <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm" />
        </div>
      )}
    </div>
  );
}

function fmt(n: number) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getPeriodLabel(dateFilter: DateFilter, customStartDate: string, customEndDate: string): string {
  if (dateFilter === 'today') return 'Today';
  if (dateFilter === 'week') return 'This Week';
  if (dateFilter === 'month') return 'This Month';
  if (dateFilter === 'quarter') return 'This Quarter';
  if (dateFilter === 'all') return 'All Time';
  if (dateFilter === 'custom' && customStartDate && customEndDate) return `${customStartDate} to ${customEndDate}`;
  return 'Custom';
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('dashboard');

  // Dashboard data
  const [salesData, setSalesData] = useState<SalesEntry[]>([]);
  const [installationData, setInstallationData] = useState<InstallationEntry[]>([]);
  const [complaintData, setComplaintData] = useState<ComplaintEntry[]>([]);

  // Finance data
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [loading, setLoading] = useState(true);

  // Shared date filter
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Search
  const [expenseSearch, setExpenseSearch] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [sales, inst, comp, exp] = await Promise.all([
        supabase.from('sales_pipeline').select('*').order('created_at', { ascending: false }),
        supabase.from('installation_pipeline').select('*').order('created_at', { ascending: false }),
        supabase.from('complaint_pipeline').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
      ]);
      if (sales.data) setSalesData(sales.data);
      if (inst.data) setInstallationData(inst.data);
      if (comp.data) setComplaintData(comp.data);
      if (exp.data) setExpenses(exp.data);
    } catch (err: any) {
      console.error('Error fetching report data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start = new Date(0);
    switch (dateFilter) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case 'week': {
        const d = now.getDay();
        const mon = new Date(now);
        mon.setDate(now.getDate() - (d === 0 ? 6 : d - 1));
        start = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate(), 0, 0, 0, 0);
        break;
      }
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        break;
      case 'quarter': {
        const q = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), q * 3, 1, 0, 0, 0, 0);
        break;
      }
      case 'custom':
        if (customStartDate && customEndDate) {
          return { start: new Date(customStartDate), end: new Date(new Date(customEndDate).setHours(23, 59, 59, 999)) };
        }
        break;
      default:
        break;
    }
    return { start, end };
  };

  const inRange = (dateStr: string) => {
    if (dateFilter === 'all') return true;
    const { start, end } = getDateRange();
    const d = new Date(dateStr);
    return d >= start && d <= end;
  };

  // Dashboard filtered
  const filtSales = useMemo(() => salesData.filter(s => inRange(s.created_at)), [salesData, dateFilter, customStartDate, customEndDate]);
  const filtInst = useMemo(() => installationData.filter(s => inRange(s.created_at)), [installationData, dateFilter, customStartDate, customEndDate]);
  const filtComp = useMemo(() => complaintData.filter(s => inRange(s.created_at)), [complaintData, dateFilter, customStartDate, customEndDate]);

  // Finance filtered (by date field, not created_at)
  const filtExpenses = useMemo(() => {
    return expenses.filter(e => {
      const dateOk = dateFilter === 'all' ? true : inRange(e.date);
      const q = expenseSearch.toLowerCase();
      const searchOk = !q || e.description?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q) || e.remarks?.toLowerCase().includes(q);
      return dateOk && searchOk;
    });
  }, [expenses, dateFilter, customStartDate, customEndDate, expenseSearch]);

  // Dashboard KPIs
  const kpis = useMemo(() => ({
    totalSalesLeads: filtSales.length,
    totalInstallations: filtInst.length,
    totalComplaints: filtComp.length,
    quotationsSent: filtSales.filter(s => s.quotation_status === 'Sent').length,
    quotationsPending: filtSales.filter(s => s.quotation_status === 'Pending').length,
  }), [filtSales, filtInst, filtComp]);

  const todayCustomers = useMemo(() => {
    const today = new Date().toDateString();
    return filtSales.filter(s => new Date(s.created_at).toDateString() === today).length;
  }, [filtSales]);

  const cityBreakdown = useMemo(() => {
    const m: Record<string, number> = {};
    filtSales.forEach(e => { m[e.city] = (m[e.city] || 0) + 1; });
    return Object.entries(m).map(([city, count]) => ({ city, count }));
  }, [filtSales]);

  const sourceBreakdown = useMemo(() => {
    const m: Record<string, number> = {};
    filtSales.forEach(e => { m[e.source] = (m[e.source] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [filtSales]);

  const installationSummary = useMemo(() => [
    { name: 'Completed', value: filtInst.filter(i => i.installation_status === 'Completed').length },
    { name: 'Scheduled', value: filtInst.filter(i => i.installation_status === 'Scheduled').length },
  ], [filtInst]);

  const complaintSummary = useMemo(() => [
    { name: 'Open', value: filtComp.filter(c => c.complaint_status === 'Open').length },
    { name: 'Closed', value: filtComp.filter(c => c.complaint_status === 'Closed').length },
  ], [filtComp]);

  // Expense summaries
  const expenseCategoryTotals = useMemo(() => {
    const m: Record<string, number> = {};
    filtExpenses.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [filtExpenses]);

  const expensePaymentTotals = useMemo(() => {
    const m: Record<string, number> = {};
    filtExpenses.forEach(e => { m[e.payment_mode] = (m[e.payment_mode] || 0) + e.amount; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [filtExpenses]);

  const totalExpenses = useMemo(() => filtExpenses.reduce((s, e) => s + e.amount, 0), [filtExpenses]);

  // Brand teal first, then the logo's leaf green and sun yellow, then supporting hues.
  const COLORS = ['#1f8fc8', '#5a9a30', '#e0b000', '#12618d', '#79c3e5', '#8a6fb8', '#d9734a', '#64748b'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs: { key: ReportTab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Pipeline Dashboard', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'expenses', label: 'Expense Report', icon: <ShoppingBag className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Reports</h2>
        <p className="text-gray-500 text-sm">Analytics and financial summaries across all modules</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Date Filter (shared across all tabs) */}
      <DateFilterBar
        dateFilter={dateFilter} setDateFilter={setDateFilter}
        customStartDate={customStartDate} setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate} setCustomEndDate={setCustomEndDate}
      />

      {/* ───── DASHBOARD TAB ───── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6 text-gray-900">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-brand-600" />
                <span className="text-2xl font-semibold text-gray-900">{kpis.totalSalesLeads}</span>
              </div>
              <p className="text-gray-500 text-sm">Total Sales Leads</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6 text-gray-900">
              <div className="flex items-center justify-between mb-2">
                <Wrench className="w-8 h-8 text-brand-600" />
                <span className="text-2xl font-semibold text-gray-900">{kpis.totalInstallations}</span>
              </div>
              <p className="text-gray-500 text-sm">Total Installations</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6 text-gray-900">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-8 h-8 text-brand-600" />
                <span className="text-2xl font-semibold text-gray-900">{kpis.totalComplaints}</span>
              </div>
              <p className="text-gray-500 text-sm">Total Complaints</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6 text-gray-900">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-brand-600" />
                <span className="text-2xl font-semibold text-gray-900">{todayCustomers}</span>
              </div>
              <p className="text-gray-500 text-sm">Customers Visited Today</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Quotation Status</h3>
              <p className="text-sm text-gray-500 mb-4">Sent vs Pending</p>
              <div className="flex items-center gap-8 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Sent: {kpis.quotationsSent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Pending: {kpis.quotationsPending}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8">
                <div
                  className="bg-green-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${(kpis.quotationsSent / (kpis.quotationsSent + kpis.quotationsPending || 1)) * 100}%` }}
                >
                  {kpis.quotationsSent > 0 && `${Math.round((kpis.quotationsSent / (kpis.quotationsSent + kpis.quotationsPending)) * 100)}%`}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">City-wise Breakdown</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart key={`city-${dateFilter}-${customStartDate}-${customEndDate}`} data={cityBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" angle={-45} textAnchor="end" height={80} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1f8fc8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Lead Sources</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart key={`src-${dateFilter}-${customStartDate}-${customEndDate}`}>
                  <Pie data={sourceBreakdown} cx="50%" cy="50%" labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80} dataKey="value">
                    {sourceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Installation Status</h3>
              <p className="text-xs text-gray-400 mb-4">{getPeriodLabel(dateFilter, customStartDate, customEndDate)}</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart key={`inst-${dateFilter}-${customStartDate}-${customEndDate}`} data={installationSummary} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [v, 'Count']} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    <Cell fill="#10B981" />
                    <Cell fill="#F59E0B" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Complaint Status</h3>
              <p className="text-xs text-gray-400 mb-4">{getPeriodLabel(dateFilter, customStartDate, customEndDate)}</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart key={`comp-${dateFilter}-${customStartDate}-${customEndDate}`} data={complaintSummary} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [v, 'Count']} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    <Cell fill="#EF4444" />
                    <Cell fill="#10B981" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ───── EXPENSE REPORT TAB ───── */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6 text-gray-900">
              <p className="text-gray-500 text-sm mb-1">Total Expenses</p>
              <p className="text-xl font-semibold text-gray-900">{fmt(totalExpenses)}</p>
              <p className="text-gray-500 text-xs mt-1">{filtExpenses.length} entries</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6 text-gray-900">
              <p className="text-gray-500 text-sm mb-1">Highest Category</p>
              <p className="text-xl font-semibold text-gray-900">{expenseCategoryTotals[0]?.name || '—'}</p>
              <p className="text-gray-500 text-xs mt-1">{expenseCategoryTotals[0] ? fmt(expenseCategoryTotals[0].value) : ''}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6 text-gray-900">
              <p className="text-gray-500 text-sm mb-1">Avg per Entry</p>
              <p className="text-xl font-semibold text-gray-900">{filtExpenses.length ? fmt(totalExpenses / filtExpenses.length) : '₹0.00'}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Expenses by Category</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={expenseCategoryTotals} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Mode Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={expensePaymentTotals} cx="50%" cy="50%"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90} dataKey="value">
                    {expensePaymentTotals.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <h3 className="text-lg font-bold text-gray-800">Expense Details ({filtExpenses.length})</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={expenseSearch}
                    onChange={e => setExpenseSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => generateExpenseReportPDF(filtExpenses, totalExpenses, getPeriodLabel(dateFilter, customStartDate, customEndDate))}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
                >
                  <Download className="w-4 h-4" />Export PDF
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Mode</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">{e.category}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-800">{e.description}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(e.amount)}</td>
                      <td className="px-4 py-3 text-gray-600">{e.payment_mode}</td>
                      <td className="px-4 py-3 text-gray-500">{e.remarks}</td>
                    </tr>
                  ))}
                  {filtExpenses.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No expenses found for this period.</td></tr>
                  )}
                </tbody>
                {filtExpenses.length > 0 && (
                  <tfoot>
                    <tr className="bg-amber-50 font-bold border-t-2 border-amber-200">
                      <td colSpan={3} className="px-4 py-3 text-right text-gray-700">Total</td>
                      <td className="px-4 py-3 text-right text-amber-700">{fmt(totalExpenses)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
