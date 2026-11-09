import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Pencil as Edit2, X, Save, Trash2, Download } from 'lucide-react';
import { generateInstallationPDF } from '../lib/pipelinePdfGenerator';

const PROFESSION_OPTIONS = ['Architect', 'Plumber', 'Contractor', 'Electrician'];

interface Professional {
  id: string;
  name: string;
  profession: string;
  company_name: string;
}

interface InstallationEntry {
  id: string;
  customer_name: string;
  phone_number: string;
  site_survey: string;
  site_survey_comments: string;
  installation_status: string;
  site_handed_over: string;
  handover_comments: string;
  professional_id: string | null;
  created_at: string;
}

export default function InstallationPipeline() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<InstallationEntry[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<InstallationEntry>>({});
  const [selectedProfession, setSelectedProfession] = useState('');
  const [editSelectedProfession, setEditSelectedProfession] = useState('');
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    site_survey: 'Scheduled',
    site_survey_comments: '',
    installation_status: 'Scheduled',
    site_handed_over: 'Scheduled',
    handover_comments: '',
    professional_id: '' as string | null
  });

  useEffect(() => {
    fetchEntries();
    fetchProfessionals();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('installation_pipeline')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching installation entries:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionals = async () => {
    const { data } = await supabase.from('architects').select('id, name, profession, company_name').order('name');
    setProfessionals(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('installation_pipeline').insert([
        {
          user_id: user?.id,
          ...formData
        }
      ]);

      if (error) throw error;

      setFormData({
        customer_name: '',
        phone_number: '',
        site_survey: 'Scheduled',
        site_survey_comments: '',
        installation_status: 'Scheduled',
        site_handed_over: 'Scheduled',
        handover_comments: '',
        professional_id: ''
      });
      setSelectedProfession('');

      fetchEntries();
    } catch (error: any) {
      console.error('Error creating entry:', error.message);
    }
  };

  const startEditing = (entry: InstallationEntry) => {
    setEditingId(entry.id);
    setEditFormData(entry);
    if (entry.professional_id) {
      const prof = professionals.find(p => p.id === entry.professional_id);
      setEditSelectedProfession(prof?.profession || '');
    } else {
      setEditSelectedProfession('');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('installation_pipeline')
        .update(editFormData)
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      setEditFormData({});
      fetchEntries();
    } catch (error: any) {
      console.error('Error updating entry:', error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase
        .from('installation_pipeline')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchEntries();
    } catch (error: any) {
      console.error('Error deleting entry:', error.message);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const query = searchQuery.toLowerCase();
    return (
      entry.customer_name?.toLowerCase().includes(query) ||
      entry.phone_number?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-700">
            <strong>Customer Feedback:</strong> Share this feedback form link with customers to collect their reviews and testimonials.
          </p>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSesIQNvW49ZpbhmLg2VJDjHUAMMw1LMUsrDEXkReID2ybdXtw/viewform?usp=publish-editor"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            Feedback Form
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Plus className="w-6 h-6 text-green-600" />
          New Installation Entry
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Survey
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Completed"
                  checked={formData.site_survey === 'Completed'}
                  onChange={(e) => setFormData({ ...formData, site_survey: e.target.value })}
                  className="mr-2"
                />
                Completed
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Scheduled"
                  checked={formData.site_survey === 'Scheduled'}
                  onChange={(e) => setFormData({ ...formData, site_survey: e.target.value })}
                  className="mr-2"
                />
                Scheduled
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technician Comment
            </label>
            <textarea
              value={formData.site_survey_comments}
              onChange={(e) => setFormData({ ...formData, site_survey_comments: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Installation Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Completed"
                  checked={formData.installation_status === 'Completed'}
                  onChange={(e) => setFormData({ ...formData, installation_status: e.target.value })}
                  className="mr-2"
                />
                Completed
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Scheduled"
                  checked={formData.installation_status === 'Scheduled'}
                  onChange={(e) => setFormData({ ...formData, installation_status: e.target.value })}
                  className="mr-2"
                />
                Scheduled
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Handed Over
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Completed"
                  checked={formData.site_handed_over === 'Completed'}
                  onChange={(e) => setFormData({ ...formData, site_handed_over: e.target.value })}
                  className="mr-2"
                />
                Completed
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Scheduled"
                  checked={formData.site_handed_over === 'Scheduled'}
                  onChange={(e) => setFormData({ ...formData, site_handed_over: e.target.value })}
                  className="mr-2"
                />
                Scheduled
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Handover Comments
            </label>
            <textarea
              value={formData.handover_comments}
              onChange={(e) => setFormData({ ...formData, handover_comments: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Professional Type (Optional)</label>
              <select
                value={selectedProfession}
                onChange={(e) => { setSelectedProfession(e.target.value); setFormData({ ...formData, professional_id: '' }); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Type</option>
                {PROFESSION_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {selectedProfession && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{selectedProfession} Name</label>
                <select
                  value={formData.professional_id || ''}
                  onChange={(e) => setFormData({ ...formData, professional_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select {selectedProfession}</option>
                  {professionals.filter(p => p.profession === selectedProfession).map(p => (
                    <option key={p.id} value={p.id}>{p.name}{p.company_name ? ` - ${p.company_name}` : ''}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Submit Entry
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Installation Pipeline Entries</h3>
          <span className="text-sm text-gray-600">{filteredEntries.length} entries</span>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Site Survey</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Installation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Handed Over</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{entry.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{entry.phone_number}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.site_survey === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {entry.site_survey}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.installation_status === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {entry.installation_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.site_handed_over === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {entry.site_handed_over}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateInstallationPDF(entry)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditing(entry)}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === entry.id && (
                    <tr className="bg-green-50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-800">Edit Entry</h4>
                            <button
                              onClick={cancelEditing}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                              <input
                                type="text"
                                value={editFormData.customer_name}
                                onChange={(e) => setEditFormData({ ...editFormData, customer_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                              <input
                                type="tel"
                                value={editFormData.phone_number}
                                onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Site Survey</label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="Completed"
                                    checked={editFormData.site_survey === 'Completed'}
                                    onChange={(e) => setEditFormData({ ...editFormData, site_survey: e.target.value })}
                                    className="mr-2"
                                  />
                                  Completed
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="Scheduled"
                                    checked={editFormData.site_survey === 'Scheduled'}
                                    onChange={(e) => setEditFormData({ ...editFormData, site_survey: e.target.value })}
                                    className="mr-2"
                                  />
                                  Scheduled
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Installation Status</label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="Completed"
                                    checked={editFormData.installation_status === 'Completed'}
                                    onChange={(e) => setEditFormData({ ...editFormData, installation_status: e.target.value })}
                                    className="mr-2"
                                  />
                                  Completed
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="Scheduled"
                                    checked={editFormData.installation_status === 'Scheduled'}
                                    onChange={(e) => setEditFormData({ ...editFormData, installation_status: e.target.value })}
                                    className="mr-2"
                                  />
                                  Scheduled
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Site Handed Over</label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="Completed"
                                    checked={editFormData.site_handed_over === 'Completed'}
                                    onChange={(e) => setEditFormData({ ...editFormData, site_handed_over: e.target.value })}
                                    className="mr-2"
                                  />
                                  Completed
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="Scheduled"
                                    checked={editFormData.site_handed_over === 'Scheduled'}
                                    onChange={(e) => setEditFormData({ ...editFormData, site_handed_over: e.target.value })}
                                    className="mr-2"
                                  />
                                  Scheduled
                                </label>
                              </div>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Technician Comment</label>
                              <textarea
                                value={editFormData.site_survey_comments}
                                onChange={(e) => setEditFormData({ ...editFormData, site_survey_comments: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                rows={2}
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Handover Comments</label>
                              <textarea
                                value={editFormData.handover_comments}
                                onChange={(e) => setEditFormData({ ...editFormData, handover_comments: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                rows={2}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Professional Type</label>
                              <select
                                value={editSelectedProfession}
                                onChange={(e) => { setEditSelectedProfession(e.target.value); setEditFormData({ ...editFormData, professional_id: null }); }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              >
                                <option value="">None</option>
                                {PROFESSION_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            {editSelectedProfession && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{editSelectedProfession} Name</label>
                                <select
                                  value={editFormData.professional_id || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, professional_id: e.target.value || null })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                >
                                  <option value="">Select {editSelectedProfession}</option>
                                  {professionals.filter(p => p.profession === editSelectedProfession).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}{p.company_name ? ` - ${p.company_name}` : ''}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={cancelEditing}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdate(entry.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Save Changes
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
        </div>
      </div>
    </div>
  );
}
