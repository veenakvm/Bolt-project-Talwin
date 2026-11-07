import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, CreditCard as Edit2, X, Save, Trash2, TrendingUp, FileDown, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

const PRESET_CATEGORIES = [
  'Purchase',
  'Transport',
  'Labour',
  'Office',
  'Office Supplies',
  'Refreshments',
  'Postage & Courier',
  'Transportation/Travel',
  'Minor Repairs & Maintenance',
  'Outsource Plumber',
  'Petrol Reimbursement',
  'Staff Advance',
  'Salary',
  'Misc',
];

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_mode: string;
  remarks: string;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Purchase': 'bg-blue-100 text-blue-700',
  'Transport': 'bg-green-100 text-green-700',
  'Labour': 'bg-orange-100 text-orange-700',
  'Office': 'bg-cyan-100 text-cyan-700',
  'Office Supplies': 'bg-teal-100 text-teal-700',
  'Refreshments': 'bg-pink-100 text-pink-700',
  'Postage & Courier': 'bg-yellow-100 text-yellow-700',
  'Transportation/Travel': 'bg-lime-100 text-lime-700',
  'Minor Repairs & Maintenance': 'bg-red-100 text-red-700',
  'Outsource Plumber': 'bg-sky-100 text-sky-700',
  'Petrol Reimbursement': 'bg-amber-100 text-amber-700',
  'Staff Advance': 'bg-violet-100 text-violet-700',
  'Salary': 'bg-emerald-100 text-emerald-700',
  'Misc': 'bg-gray-100 text-gray-700',
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-700';
}

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Expense>>({});
  const [customCategory, setCustomCategory] = useState('');
  const [editCustomCategory, setEditCustomCategory] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Purchase',
    description: '',
    amount: 0,
    payment_mode: 'Cash',
    remarks: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const effectiveCategory = formData.category === '__custom__' ? customCategory : formData.category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const category = formData.category === '__custom__' ? customCategory.trim() : formData.category;
    if (!category) return;
    try {
      const { error } = await supabase.from('expenses').insert([{
        user_id: user?.id,
        ...formData,
        category,
        amount: parseFloat(String(formData.amount))
      }]);
      if (error) throw error;
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: 'Purchase',
        description: '',
        amount: 0,
        payment_mode: 'Cash',
        remarks: ''
      });
      setCustomCategory('');
      fetchExpenses();
    } catch (error: any) {
      console.error('Error creating expense:', error.message);
    }
  };

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    const isPreset = PRESET_CATEGORIES.includes(expense.category);
    setEditFormData({ ...expense, category: isPreset ? expense.category : '__custom__' });
    setEditCustomCategory(isPreset ? '' : expense.category);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
    setEditCustomCategory('');
  };

  const handleUpdate = async (id: string) => {
    const category = editFormData.category === '__custom__' ? editCustomCategory.trim() : editFormData.category;
    if (!category) return;
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ ...editFormData, category, amount: parseFloat(String(editFormData.amount || 0)) })
        .eq('id', id);
      if (error) throw error;
      setEditingId(null);
      setEditFormData({});
      setEditCustomCategory('');
      fetchExpenses();
    } catch (error: any) {
      console.error('Error updating expense:', error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      fetchExpenses();
    } catch (error: any) {
      console.error('Error deleting expense:', error.message);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = expense.description?.toLowerCase().includes(query) ||
      expense.category?.toLowerCase().includes(query) ||
      expense.remarks?.toLowerCase().includes(query);
    const matchesCategory = filterCategory === 'All' || expense.category === filterCategory;
    const expenseDate = new Date(expense.date);
    const matchesDateFrom = !dateFrom || expenseDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || expenseDate <= new Date(dateTo);
    return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyTotal = expenses.filter(e => e.date.startsWith(currentMonth)).reduce((sum, e) => sum + e.amount, 0);

  const allCategories = Array.from(new Set([...PRESET_CATEGORIES, ...expenses.map(e => e.category)]));

  const exportExcel = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Payment Mode', 'Remarks'];
    const rows = filteredExpenses.map(e => [
      new Date(e.date).toLocaleDateString('en-IN'),
      e.category,
      e.description,
      e.amount.toFixed(2),
      e.payment_mode,
      e.remarks || ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = 20;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TALWIN AQUARAY - EXPENSE REPORT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;

    if (dateFrom || dateTo) {
      pdf.text(`Period: ${dateFrom || 'Start'} to ${dateTo || 'End'}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 4;
    }

    yPos += 4;

    // Header
    pdf.setFillColor(50, 50, 50);
    pdf.rect(15, yPos, pageWidth - 30, 7, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text('Date', 17, yPos + 4.5);
    pdf.text('Category', 42, yPos + 4.5);
    pdf.text('Description', 82, yPos + 4.5);
    pdf.text('Amount', 140, yPos + 4.5, { align: 'right' });
    pdf.text('Mode', 155, yPos + 4.5);
    pdf.text('Remarks', 175, yPos + 4.5);
    pdf.setTextColor(0, 0, 0);
    yPos += 7;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);

    filteredExpenses.forEach((expense, idx) => {
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
      if (idx % 2 === 0) {
        pdf.setFillColor(248, 248, 248);
        pdf.rect(15, yPos, pageWidth - 30, 6, 'F');
      }
      pdf.text(new Date(expense.date).toLocaleDateString('en-IN'), 17, yPos + 4);
      pdf.text(expense.category.substring(0, 20), 42, yPos + 4);
      pdf.text(expense.description.substring(0, 30), 82, yPos + 4);
      pdf.text(`Rs ${expense.amount.toLocaleString('en-IN')}`, 140, yPos + 4, { align: 'right' });
      pdf.text(expense.payment_mode, 155, yPos + 4);
      pdf.text((expense.remarks || '').substring(0, 15), 175, yPos + 4);
      yPos += 6;
    });

    yPos += 6;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, yPos, pageWidth - 15, yPos);
    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(`Total: Rs ${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 15, yPos, { align: 'right' });

    pdf.save(`expenses_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Expenses</h1>
        <p className="text-gray-600">Track and manage your business expenses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm mb-1">Total Expenses (Filtered)</p>
              <p className="text-3xl font-bold">₹{totalExpenses.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-amber-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm mb-1">This Month</p>
              <p className="text-3xl font-bold">₹{monthlyTotal.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-teal-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Entries</p>
              <p className="text-3xl font-bold">{filteredExpenses.length}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Expense</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {PRESET_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__custom__">+ Add Custom Category</option>
            </select>
            {formData.category === '__custom__' && (
              <input
                type="text"
                placeholder="Enter category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-amber-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
            <select
              value={formData.payment_mode}
              onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y min-h-[60px]"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Expense List ({filteredExpenses.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="All">All Categories</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />

            {(dateFrom || dateTo || filterCategory !== 'All' || searchQuery) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); setFilterCategory('All'); setSearchQuery(''); }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Clear
              </button>
            )}

            <button
              onClick={exportPDF}
              className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <React.Fragment key={expense.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{expense.description}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ₹{expense.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{expense.payment_mode}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{expense.remarks}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditing(expense)}
                          className="text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === expense.id && (
                    <tr className="bg-amber-50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                              type="date"
                              value={editFormData.date || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                              value={editFormData.category || 'Purchase'}
                              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              {PRESET_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                              <option value="__custom__">+ Add Custom Category</option>
                            </select>
                            {editFormData.category === '__custom__' && (
                              <input
                                type="text"
                                placeholder="Enter category name"
                                value={editCustomCategory}
                                onChange={(e) => setEditCustomCategory(e.target.value)}
                                className="mt-2 w-full px-3 py-2 border border-amber-300 rounded-md"
                              />
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editFormData.amount || 0}
                              onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                            <select
                              value={editFormData.payment_mode || 'Cash'}
                              onChange={(e) => setEditFormData({ ...editFormData, payment_mode: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="Cash">Cash</option>
                              <option value="UPI">UPI</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={editFormData.description || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-y min-h-[60px]"
                              rows={2}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                            <input
                              type="text"
                              value={editFormData.remarks || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>

                          <div className="flex items-end gap-2">
                            <button
                              onClick={() => handleUpdate(expense.id)}
                              className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No expenses found. Add your first expense above.
            </div>
          )}
        </div>

        {filteredExpenses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
            <div className="text-right">
              <span className="text-sm text-gray-500 mr-4">Total ({filteredExpenses.length} entries):</span>
              <span className="text-lg font-bold text-gray-900">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
