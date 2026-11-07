import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckSquare, Square, Save, FileText } from 'lucide-react';

interface SurveyFormData {
  customer: string;
  mobile: string;
  survey_date: string;
  area_location: string;
  property_type: string;
  users: string;
  requested_install_date: string;
  water_source_borewell: boolean;
  water_source_kaveri: boolean;
  water_source_tanker: boolean;
  water_source_mixed: boolean;
  sump_capacity: string;
  sump_ltrs: string;
  oht_capacity: string;
  oht_ltrs: string;
  hardness_ppm: string;
  tds_ppm: string;
  water_iron: boolean;
  water_smell: boolean;
  pressure_low: boolean;
  pressure_med: boolean;
  pressure_high: boolean;
  pipe_old: boolean;
  pipe_new: boolean;
  pipe_size: string;
  water_softener: boolean;
  water_softener_capacity: string;
  ro_purifier: boolean;
  ro_purifier_model: string;
  water_heater: boolean;
  water_heater_litres: string;
  solar_heat_pump: boolean;
  solar_heat_pump_lpd: string;
  pressure_pump: boolean;
  pressure_pump_hp: string;
  submersible_pump: boolean;
  submersible_pump_hp: string;
  water_level_controller: boolean;
  water_level_controller_type: string;
  solar_rooftop: boolean;
  solar_rooftop_kw: string;
  power_available: string;
  drain_available: string;
  earthing_available: string;
  safe_access: string;
  plumbing_status: string;
  tech_signature: string;
}

const initialFormData: SurveyFormData = {
  customer: '',
  mobile: '',
  survey_date: '',
  area_location: '',
  property_type: '',
  users: '',
  requested_install_date: '',
  water_source_borewell: false,
  water_source_kaveri: false,
  water_source_tanker: false,
  water_source_mixed: false,
  sump_capacity: '',
  sump_ltrs: '',
  oht_capacity: '',
  oht_ltrs: '',
  hardness_ppm: '',
  tds_ppm: '',
  water_iron: false,
  water_smell: false,
  pressure_low: false,
  pressure_med: false,
  pressure_high: false,
  pipe_old: false,
  pipe_new: false,
  pipe_size: '',
  water_softener: false,
  water_softener_capacity: '',
  ro_purifier: false,
  ro_purifier_model: '',
  water_heater: false,
  water_heater_litres: '',
  solar_heat_pump: false,
  solar_heat_pump_lpd: '',
  pressure_pump: false,
  pressure_pump_hp: '',
  submersible_pump: false,
  submersible_pump_hp: '',
  water_level_controller: false,
  water_level_controller_type: '',
  solar_rooftop: false,
  solar_rooftop_kw: '',
  power_available: '',
  drain_available: '',
  earthing_available: '',
  safe_access: '',
  plumbing_status: '',
  tech_signature: '',
};

interface SurveyFormProps {
  onSuccess?: () => void;
}

export default function SurveyForm({ onSuccess }: SurveyFormProps) {
  const [formData, setFormData] = useState<SurveyFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: keyof SurveyFormData) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.from('site_surveys').insert([formData]);

      if (error) throw error;

      setMessage('Survey submitted successfully!');
      setFormData(initialFormData);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const Checkbox = ({ checked, label }: { checked: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckSquare className="w-5 h-5 text-blue-600" />
      ) : (
        <Square className="w-5 h-5 text-gray-400" />
      )}
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-t-lg">
          <div className="flex items-center justify-center gap-3 mb-2">
            <FileText className="w-8 h-8" />
            <h1 className="text-3xl font-bold">TALWIN AquaRay</h1>
          </div>
          <p className="text-center text-blue-100">
            89040 69224 | www.talwin.in | info@talwin.in
          </p>
          <h2 className="text-center text-2xl font-semibold mt-4">
            TECHNICIAN SITE SURVEY CHECKLIST
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* 1. BASIC DETAILS */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
              1. BASIC DETAILS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer
                </label>
                <input
                  type="text"
                  name="customer"
                  value={formData.customer}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mobile
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Survey Date
                </label>
                <input
                  type="date"
                  name="survey_date"
                  value={formData.survey_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Area / Location
                </label>
                <input
                  type="text"
                  name="area_location"
                  value={formData.area_location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Property Type
                </label>
                <input
                  type="text"
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Users
                </label>
                <input
                  type="text"
                  name="users"
                  value={formData.users}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Requested Date of Installation
                </label>
                <input
                  type="date"
                  name="requested_install_date"
                  value={formData.requested_install_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* 2. WATER SOURCE */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
              2. WATER SOURCE
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-3">
                <div
                  onClick={() => handleCheckboxChange('water_source_borewell')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.water_source_borewell} label="Borewell" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Sump Y / N
                  </label>
                  <input
                    type="text"
                    name="sump_capacity"
                    value={formData.sump_capacity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div
                  onClick={() => handleCheckboxChange('water_source_kaveri')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.water_source_kaveri} label="Kaveri / Corp" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Sump Ltrs
                  </label>
                  <input
                    type="text"
                    name="sump_ltrs"
                    value={formData.sump_ltrs}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div
                  onClick={() => handleCheckboxChange('water_source_tanker')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.water_source_tanker} label="Tanker" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    OHT Y / N
                  </label>
                  <input
                    type="text"
                    name="oht_capacity"
                    value={formData.oht_capacity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div
                  onClick={() => handleCheckboxChange('water_source_mixed')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.water_source_mixed} label="Mixed" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    OHT Ltrs
                  </label>
                  <input
                    type="text"
                    name="oht_ltrs"
                    value={formData.oht_ltrs}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 3. WATER & PRESSURE */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
              3. WATER & PRESSURE
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Hardness ppm
                </label>
                <input
                  type="text"
                  name="hardness_ppm"
                  value={formData.hardness_ppm}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">TDS ppm</label>
                <input
                  type="text"
                  name="tds_ppm"
                  value={formData.tds_ppm}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div
                onClick={() => handleCheckboxChange('water_iron')}
                className="cursor-pointer flex items-center"
              >
                <Checkbox checked={formData.water_iron} label="Iron" />
              </div>

              <div
                onClick={() => handleCheckboxChange('water_smell')}
                className="cursor-pointer flex items-center"
              >
                <Checkbox checked={formData.water_smell} label="Smell" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Pressure</label>
                <div className="flex gap-4">
                  <div
                    onClick={() => handleCheckboxChange('pressure_low')}
                    className="cursor-pointer"
                  >
                    <Checkbox checked={formData.pressure_low} label="Low" />
                  </div>
                </div>
              </div>

              <div className="flex items-end">
                <div
                  onClick={() => handleCheckboxChange('pressure_med')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.pressure_med} label="Med" />
                </div>
              </div>

              <div className="flex items-end">
                <div
                  onClick={() => handleCheckboxChange('pressure_high')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.pressure_high} label="High" />
                </div>
              </div>

              <div></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Pipe</label>
                <div
                  onClick={() => handleCheckboxChange('pipe_old')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.pipe_old} label="Old" />
                </div>
              </div>

              <div className="flex items-end">
                <div
                  onClick={() => handleCheckboxChange('pipe_new')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.pipe_new} label="New" />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">Size</label>
                <input
                  type="text"
                  name="pipe_size"
                  value={formData.pipe_size}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* 4. PRODUCTS REQUIRED */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
              4. PRODUCTS REQUIRED
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div
                  onClick={() => handleCheckboxChange('water_softener')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.water_softener} label="Water Softener" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="text"
                    name="water_softener_capacity"
                    value={formData.water_softener_capacity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div
                  onClick={() => handleCheckboxChange('ro_purifier')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.ro_purifier} label="RO Purifier" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    name="ro_purifier_model"
                    value={formData.ro_purifier_model}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div
                  onClick={() => handleCheckboxChange('water_heater')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.water_heater} label="Water Heater (Geyser)" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Litres
                  </label>
                  <input
                    type="text"
                    name="water_heater_litres"
                    value={formData.water_heater_litres}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div
                  onClick={() => handleCheckboxChange('solar_heat_pump')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.solar_heat_pump} label="Solar / Heat Pump" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    LPD
                  </label>
                  <input
                    type="text"
                    name="solar_heat_pump_lpd"
                    value={formData.solar_heat_pump_lpd}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div
                  onClick={() => handleCheckboxChange('pressure_pump')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.pressure_pump} label="Pressure Pump" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">HP</label>
                  <input
                    type="text"
                    name="pressure_pump_hp"
                    value={formData.pressure_pump_hp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div
                  onClick={() => handleCheckboxChange('submersible_pump')}
                  className="cursor-pointer"
                >
                  <Checkbox
                    checked={formData.submersible_pump}
                    label="Submersible / Open Well Pump"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">HP</label>
                  <input
                    type="text"
                    name="submersible_pump_hp"
                    value={formData.submersible_pump_hp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div
                  onClick={() => handleCheckboxChange('water_level_controller')}
                  className="cursor-pointer"
                >
                  <Checkbox
                    checked={formData.water_level_controller}
                    label="Water Level Controller"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type
                  </label>
                  <input
                    type="text"
                    name="water_level_controller_type"
                    value={formData.water_level_controller_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div
                  onClick={() => handleCheckboxChange('solar_rooftop')}
                  className="cursor-pointer"
                >
                  <Checkbox checked={formData.solar_rooftop} label="Solar Rooftop" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">kW</label>
                  <input
                    type="text"
                    name="solar_rooftop_kw"
                    value={formData.solar_rooftop_kw}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 5. INSTALL CHECK */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
              5. INSTALL CHECK
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Power Y / N
                </label>
                <input
                  type="text"
                  name="power_available"
                  value={formData.power_available}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Drain Y / N
                </label>
                <input
                  type="text"
                  name="drain_available"
                  value={formData.drain_available}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Earthing Y / N
                </label>
                <input
                  type="text"
                  name="earthing_available"
                  value={formData.earthing_available}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Safe Access Y / N
                </label>
                <input
                  type="text"
                  name="safe_access"
                  value={formData.safe_access}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Plumbing (No / Minor / Major)
                </label>
                <input
                  type="text"
                  name="plumbing_status"
                  value={formData.plumbing_status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* SIGNATURE */}
          <section>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tech Name & Sign
              </label>
              <input
                type="text"
                name="tech_signature"
                value={formData.tech_signature}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </section>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.includes('Error')
                  ? 'bg-red-50 text-red-800'
                  : 'bg-green-50 text-green-800'
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Submitting...' : 'Submit Survey'}
          </button>
        </form>
      </div>
    </div>
  );
}
