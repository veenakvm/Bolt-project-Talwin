import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, CreditCard as Edit2, X, Save, Trash2, Copy } from 'lucide-react';

const PROFESSION_OPTIONS = ['Architect', 'Plumber', 'Contractor', 'Electrician'];

interface Architect {
  id: string;
  name: string;
  profession: string;
  phone_number: string;
  company_name: string;
  city: string;
  locality: string;
  email: string;
  notes: string;
  created_at: string;
}

export default function Architects() {
  const { user } = useAuth();
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Architect>>({});
  const [formData, setFormData] = useState({
    name: '',
    profession: 'Architect',
    phone_number: '',
    company_name: '',
    city: '',
    locality: '',
    email: '',
    notes: ''
  });

  useEffect(() => {
    fetchArchitects();
  }, []);

  const fetchArchitects = async () => {
    try {
      const { data, error } = await supabase
        .from('architects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArchitects(data || []);
    } catch (error: any) {
      console.error('Error fetching architects:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('architects').insert([
        {
          user_id: user?.id,
          ...formData
        }
      ]);

      if (error) throw error;

      setFormData({
        name: '',
        profession: 'Architect',
        phone_number: '',
        company_name: '',
        city: '',
        locality: '',
        email: '',
        notes: ''
      });

      fetchArchitects();
    } catch (error: any) {
      console.error('Error creating architect:', error.message);
    }
  };

  const startEditing = (architect: Architect) => {
    setEditingId(architect.id);
    setEditFormData(architect);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('architects')
        .update(editFormData)
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      setEditFormData({});
      fetchArchitects();
    } catch (error: any) {
      console.error('Error updating architect:', error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this architect?')) return;

    try {
      const { error } = await supabase
        .from('architects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchArchitects();
    } catch (error: any) {
      console.error('Error deleting architect:', error.message);
    }
  };

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    alert('Phone number copied!');
  };

  const filteredArchitects = architects.filter(architect => {
    const query = searchQuery.toLowerCase();
    return (
      architect.name?.toLowerCase().includes(query) ||
      architect.phone_number?.toLowerCase().includes(query) ||
      architect.company_name?.toLowerCase().includes(query) ||
      architect.city?.toLowerCase().includes(query) ||
      architect.profession?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading architects...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Architects & Trade Contacts</h1>
        <p className="text-gray-600">Manage architects, plumbers, contractors and electricians</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Contact</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profession *
            </label>
            <select
              required
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {PROFESSION_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company/Firm Name
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Locality/Area
            </label>
            <input
              type="text"
              value={formData.locality}
              onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Contacts ({filteredArchitects.length})
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, profession, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArchitects.map((architect) => (
            editingId === architect.id ? (
              <div key={architect.id} className="bg-teal-50 p-4 rounded-lg border-2 border-teal-200">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <select
                    value={editFormData.profession || 'Architect'}
                    onChange={(e) => setEditFormData({ ...editFormData, profession: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {PROFESSION_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input
                    type="tel"
                    value={editFormData.phone_number || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                    placeholder="Phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    value={editFormData.company_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                    placeholder="Company"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    value={editFormData.locality || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, locality: e.target.value })}
                    placeholder="Locality"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="Email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <textarea
                    value={editFormData.notes || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    placeholder="Notes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(architect.id)}
                      className="flex-1 bg-teal-600 text-white px-3 py-2 rounded-md hover:bg-teal-700 text-sm flex items-center justify-center gap-1"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="flex-1 bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 text-sm flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={architect.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{architect.name}</h3>
                    <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-medium rounded-full bg-teal-100 text-teal-700">{architect.profession || 'Architect'}</span>
                    {architect.company_name && (
                      <p className="text-sm text-gray-600 mt-0.5">{architect.company_name}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{architect.phone_number}</span>
                      <button
                        onClick={() => copyPhone(architect.phone_number)}
                        className="text-teal-600 hover:text-teal-800"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {architect.city && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">City:</span>
                      <span className="text-gray-900">{architect.city}</span>
                    </div>
                  )}

                  {architect.locality && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Locality:</span>
                      <span className="text-gray-900">{architect.locality}</span>
                    </div>
                  )}

                  {architect.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="text-gray-900 text-xs">{architect.email}</span>
                    </div>
                  )}

                  {architect.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-gray-600 text-xs">{architect.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(architect)}
                    className="flex-1 text-teal-600 hover:text-teal-800 font-medium text-sm flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(architect.id)}
                    className="flex-1 text-red-600 hover:text-red-800 font-medium text-sm flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )
          ))}
        </div>

        {filteredArchitects.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No contacts found. Add your first contact above.
          </div>
        )}
      </div>
    </div>
  );
}
