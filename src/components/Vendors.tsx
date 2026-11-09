import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Pencil as Edit2, X, Save, Trash2, Copy } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  phone_number: string;
  category: string;
  company_name: string;
  city: string;
  locality: string;
  email: string;
  notes: string;
  created_at: string;
}

export default function Vendors() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Vendor>>({});
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    category: '',
    company_name: '',
    city: '',
    locality: '',
    email: '',
    notes: ''
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false});

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      console.error('Error fetching vendors:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('vendors').insert([
        {
          user_id: user?.id,
          ...formData
        }
      ]);

      if (error) throw error;

      setFormData({
        name: '',
        phone_number: '',
        category: '',
        company_name: '',
        city: '',
        locality: '',
        email: '',
        notes: ''
      });

      fetchVendors();
    } catch (error: any) {
      console.error('Error creating vendor:', error.message);
    }
  };

  const startEditing = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setEditFormData(vendor);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update(editFormData)
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      setEditFormData({});
      fetchVendors();
    } catch (error: any) {
      console.error('Error updating vendor:', error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchVendors();
    } catch (error: any) {
      console.error('Error deleting vendor:', error.message);
    }
  };

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    alert('Phone number copied!');
  };

  const filteredVendors = vendors.filter(vendor => {
    const query = searchQuery.toLowerCase();
    return (
      vendor.name?.toLowerCase().includes(query) ||
      vendor.phone_number?.toLowerCase().includes(query) ||
      vendor.category?.toLowerCase().includes(query) ||
      vendor.company_name?.toLowerCase().includes(query) ||
      vendor.city?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading vendors...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Vendors</h1>
        <p className="text-gray-600">Manage your vendor contacts</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Vendor</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name *
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
              Category
            </label>
            <input
              type="text"
              placeholder="e.g. Plumbing, Electrical, Supplier"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
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
              Add Vendor
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Vendors ({filteredVendors.length})
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => (
            editingId === vendor.id ? (
              <div key={vendor.id} className="bg-teal-50 p-4 rounded-lg border-2 border-teal-200">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="tel"
                    value={editFormData.phone_number || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                    placeholder="Phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    value={editFormData.category || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    placeholder="Category"
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
                      onClick={() => handleUpdate(vendor.id)}
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
              <div key={vendor.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                    {vendor.category && (
                      <span className="inline-block px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded mt-1">
                        {vendor.category}
                      </span>
                    )}
                    {vendor.company_name && (
                      <p className="text-sm text-gray-600 mt-1">{vendor.company_name}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{vendor.phone_number}</span>
                      <button
                        onClick={() => copyPhone(vendor.phone_number)}
                        className="text-teal-600 hover:text-teal-800"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {vendor.city && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">City:</span>
                      <span className="text-gray-900">{vendor.city}</span>
                    </div>
                  )}

                  {vendor.locality && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Locality:</span>
                      <span className="text-gray-900">{vendor.locality}</span>
                    </div>
                  )}

                  {vendor.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="text-gray-900 text-xs">{vendor.email}</span>
                    </div>
                  )}

                  {vendor.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-gray-600 text-xs">{vendor.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(vendor)}
                    className="flex-1 text-teal-600 hover:text-teal-800 font-medium text-sm flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(vendor.id)}
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

        {filteredVendors.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No vendors found. Add your first vendor above.
          </div>
        )}
      </div>
    </div>
  );
}
