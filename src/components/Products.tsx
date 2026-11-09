import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Pencil as Edit2, X, Save, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  product_name: string;
  hsn_sac_code: string;
  description: string;
  unit: string;
  mrp: number;
  unit_price: number;
  gst_rate: number;
  created_at: string;
}

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Product>>({});
  const [formData, setFormData] = useState({
    product_name: '',
    hsn_sac_code: '',
    description: '',
    unit: 'Pcs',
    mrp: 0,
    unit_price: 0,
    gst_rate: 18
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('products').insert([
        {
          user_id: user?.id,
          ...formData,
          mrp: parseFloat(String(formData.mrp)),
          unit_price: parseFloat(String(formData.unit_price)),
          gst_rate: parseFloat(String(formData.gst_rate))
        }
      ]);

      if (error) throw error;

      setFormData({
        product_name: '',
        hsn_sac_code: '',
        description: '',
        unit: 'Pcs',
        mrp: 0,
        unit_price: 0,
        gst_rate: 18
      });

      fetchProducts();
    } catch (error: any) {
      console.error('Error creating product:', error.message);
    }
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditFormData(product);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          ...editFormData,
          mrp: parseFloat(String(editFormData.mrp || 0)),
          unit_price: parseFloat(String(editFormData.unit_price || 0)),
          gst_rate: parseFloat(String(editFormData.gst_rate ?? 18))
        })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      setEditFormData({});
      fetchProducts();
    } catch (error: any) {
      console.error('Error updating product:', error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error.message);
    }
  };

  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase();
    return (
      product.product_name?.toLowerCase().includes(query) ||
      product.hsn_sac_code?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Product Catalog</h1>
        <p className="text-gray-600">Manage your product inventory for invoices and quotations</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Product</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HSN/SAC Code
            </label>
            <input
              type="text"
              value={formData.hsn_sac_code}
              onChange={(e) => setFormData({ ...formData, hsn_sac_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="Pcs">Pcs</option>
              <option value="Set">Set</option>
              <option value="Nos">Nos</option>
              <option value="KW">KW</option>
              <option value="LPH">LPH</option>
              <option value="Litre">Litre</option>
              <option value="HP">HP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MRP (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.mrp}
              onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Price (excl. GST) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Rate (%)
            </label>
            <select
              value={formData.gst_rate}
              onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value={0}>0%</option>
              <option value={5}>5%</option>
              <option value={8.9}>8.9%</option>
              <option value={12}>12%</option>
              <option value={18}>18%</option>
              <option value={28}>28%</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description / Specs
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y min-h-[60px]"
              rows={2}
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Products ({filteredProducts.length})
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">HSN/SAC</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description / Specs</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">MRP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">GST%</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <React.Fragment key={product.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {product.product_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {product.hsn_sac_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {product.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      ₹{product.mrp.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      ₹{product.unit_price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {product.gst_rate}%
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditing(product)}
                          className="text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === product.id && (
                    <tr className="bg-teal-50">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Product Name
                            </label>
                            <input
                              type="text"
                              value={editFormData.product_name || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, product_name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              HSN/SAC Code
                            </label>
                            <input
                              type="text"
                              value={editFormData.hsn_sac_code || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, hsn_sac_code: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Unit
                            </label>
                            <select
                              value={editFormData.unit || 'Pcs'}
                              onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="Pcs">Pcs</option>
                              <option value="Set">Set</option>
                              <option value="Nos">Nos</option>
                              <option value="KW">KW</option>
                              <option value="LPH">LPH</option>
                              <option value="Litre">Litre</option>
                              <option value="HP">HP</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              MRP
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editFormData.mrp || 0}
                              onChange={(e) => setEditFormData({ ...editFormData, mrp: parseFloat(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Unit Price
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editFormData.unit_price || 0}
                              onChange={(e) => setEditFormData({ ...editFormData, unit_price: parseFloat(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              GST Rate
                            </label>
                            <select
                              value={editFormData.gst_rate ?? 18}
                              onChange={(e) => setEditFormData({ ...editFormData, gst_rate: parseFloat(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value={0}>0%</option>
                              <option value={5}>5%</option>
                              <option value={8.9}>8.9%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                              <option value={28}>28%</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description / Specs
                            </label>
                            <textarea
                              value={editFormData.description || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-y min-h-[60px]"
                              rows={2}
                            />
                          </div>

                          <div className="flex items-end gap-2">
                            <button
                              onClick={() => handleUpdate(product.id)}
                              className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
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

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No products found. Add your first product above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
