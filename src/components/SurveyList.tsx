import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Calendar, MapPin, User, Phone, CheckCircle, XCircle, Download, Search } from 'lucide-react';
import { jsPDF } from 'jspdf';
import type { SurveyProduct } from './shared/surveyProducts';

interface Survey {
  id: string;
  created_at: string;
  customer: string;
  mobile: string;
  survey_date: string;
  area_location: string;
  property_type: string;
  users: string;
  water_source_borewell: boolean;
  water_source_kaveri: boolean;
  water_source_tanker: boolean;
  water_source_mixed: boolean;
  water_softener: boolean;
  ro_purifier: boolean;
  water_heater: boolean;
  solar_rooftop: boolean;
  products_required?: SurveyProduct[];
}

export default function SurveyList() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('site_surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error: any) {
      console.error('Error fetching surveys:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('site_surveys')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSelectedSurvey(data);
    } catch (error: any) {
      console.error('Error fetching survey details:', error.message);
    }
  };

  const getWaterSources = (survey: Survey) => {
    const sources = [];
    if (survey.water_source_borewell) sources.push('Borewell');
    if (survey.water_source_kaveri) sources.push('Kaveri/Corp');
    if (survey.water_source_tanker) sources.push('Tanker');
    if (survey.water_source_mixed) sources.push('Mixed');
    return sources.join(', ') || 'Not specified';
  };

  const downloadPDF = () => {
    if (!selectedSurvey) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TALWIN AquaRay', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('89040 69224 | www.talwin.in | info@talwin.in', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TECHNICIAN SITE SURVEY CHECKLIST', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Submitted: ${new Date(selectedSurvey.created_at).toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. BASIC DETAILS', 15, yPosition);

    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Customer: ${selectedSurvey.customer || 'N/A'}`, 15, yPosition);
    doc.text(`Mobile: ${selectedSurvey.mobile || 'N/A'}`, 110, yPosition);

    yPosition += 6;
    doc.text(`Survey Date: ${selectedSurvey.survey_date || 'N/A'}`, 15, yPosition);
    doc.text(`Users: ${selectedSurvey.users || 'N/A'}`, 110, yPosition);

    yPosition += 6;
    doc.text(`Area/Location: ${selectedSurvey.area_location || 'N/A'}`, 15, yPosition);

    yPosition += 6;
    doc.text(`Property Type: ${selectedSurvey.property_type || 'N/A'}`, 15, yPosition);

    yPosition += 6;
    doc.text(`Requested Install Date: ${selectedSurvey.requested_install_date || 'N/A'}`, 15, yPosition);

    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. WATER SOURCE', 15, yPosition);

    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const waterSources = [];
    if (selectedSurvey.water_source_borewell) waterSources.push('Borewell');
    if (selectedSurvey.water_source_kaveri) waterSources.push('Kaveri/Corp');
    if (selectedSurvey.water_source_tanker) waterSources.push('Tanker');
    if (selectedSurvey.water_source_mixed) waterSources.push('Mixed');
    doc.text(`Sources: ${waterSources.join(', ') || 'N/A'}`, 15, yPosition);

    yPosition += 6;
    doc.text(`Sump: ${selectedSurvey.sump_capacity || 'N/A'}`, 15, yPosition);
    doc.text(`Sump Ltrs: ${selectedSurvey.sump_ltrs || 'N/A'}`, 70, yPosition);
    doc.text(`OHT: ${selectedSurvey.oht_capacity || 'N/A'}`, 130, yPosition);
    doc.text(`OHT Ltrs: ${selectedSurvey.oht_ltrs || 'N/A'}`, 170, yPosition);

    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. WATER & PRESSURE', 15, yPosition);

    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Hardness: ${selectedSurvey.hardness_ppm || 'N/A'} ppm`, 15, yPosition);
    doc.text(`TDS: ${selectedSurvey.tds_ppm || 'N/A'} ppm`, 110, yPosition);

    yPosition += 6;
    doc.text(`Iron: ${selectedSurvey.water_iron ? 'Yes' : 'No'}`, 15, yPosition);
    doc.text(`Smell: ${selectedSurvey.water_smell ? 'Yes' : 'No'}`, 110, yPosition);

    yPosition += 6;
    const pressure = [];
    if (selectedSurvey.pressure_low) pressure.push('Low');
    if (selectedSurvey.pressure_med) pressure.push('Med');
    if (selectedSurvey.pressure_high) pressure.push('High');
    doc.text(`Pressure: ${pressure.join(', ') || 'N/A'}`, 15, yPosition);

    yPosition += 6;
    const pipe = [];
    if (selectedSurvey.pipe_old) pipe.push('Old');
    if (selectedSurvey.pipe_new) pipe.push('New');
    doc.text(`Pipe: ${pipe.join(', ') || 'N/A'}`, 15, yPosition);
    doc.text(`Size: ${selectedSurvey.pipe_size || 'N/A'}`, 110, yPosition);

    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('4. PRODUCTS REQUIRED', 15, yPosition);

    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (selectedSurvey.water_softener) {
      doc.text(`[X] Water Softener - Capacity: ${selectedSurvey.water_softener_capacity || 'N/A'}`, 15, yPosition);
      yPosition += 6;
    }
    if (selectedSurvey.ro_purifier) {
      doc.text(`[X] RO Purifier - Model: ${selectedSurvey.ro_purifier_model || 'N/A'}`, 15, yPosition);
      yPosition += 6;
    }
    if (selectedSurvey.water_heater) {
      doc.text(`[X] Water Heater - Litres: ${selectedSurvey.water_heater_litres || 'N/A'}`, 15, yPosition);
      yPosition += 6;
    }
    if (selectedSurvey.solar_heat_pump) {
      doc.text(`[X] Solar/Heat Pump - LPD: ${selectedSurvey.solar_heat_pump_lpd || 'N/A'}`, 15, yPosition);
      yPosition += 6;
    }
    if (selectedSurvey.pressure_pump) {
      doc.text(`[X] Pressure Pump - HP: ${selectedSurvey.pressure_pump_hp || 'N/A'}`, 15, yPosition);
      yPosition += 6;
    }
    if (selectedSurvey.submersible_pump) {
      doc.text(`[X] Submersible/Open Well Pump - HP: ${selectedSurvey.submersible_pump_hp || 'N/A'}`, 15, yPosition);
      yPosition += 6;
    }
    if (selectedSurvey.water_level_controller) {
      doc.text(`[X] Water Level Controller - Type: ${selectedSurvey.water_level_controller_type || 'N/A'}`, 15, yPosition);
      yPosition += 6;
    }
    if (selectedSurvey.solar_rooftop) {
      doc.text(`[X] Solar Rooftop - kW: ${selectedSurvey.solar_rooftop_kw || 'N/A'}`, 15, yPosition);
      yPosition += 6;
    }

    (selectedSurvey.products_required as SurveyProduct[] || []).forEach((product: SurveyProduct) => {
      if (yPosition > 270) { doc.addPage(); yPosition = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${product.product_name}  x ${product.quantity}`, 15, yPosition);
      yPosition += 5;
      if (product.product_specs) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const specLines: string[] = doc.splitTextToSize(`Specs: ${product.product_specs}`, 175);
        specLines.forEach((line) => {
          if (yPosition > 280) { doc.addPage(); yPosition = 20; }
          doc.text(line, 20, yPosition);
          yPosition += 4;
        });
      }
      yPosition += 2;
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    yPosition += 4;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('5. INSTALL CHECK', 15, yPosition);

    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Power: ${selectedSurvey.power_available || 'N/A'}`, 15, yPosition);
    doc.text(`Drain: ${selectedSurvey.drain_available || 'N/A'}`, 110, yPosition);

    yPosition += 6;
    doc.text(`Earthing: ${selectedSurvey.earthing_available || 'N/A'}`, 15, yPosition);
    doc.text(`Safe Access: ${selectedSurvey.safe_access || 'N/A'}`, 110, yPosition);

    yPosition += 6;
    doc.text(`Plumbing: ${selectedSurvey.plumbing_status || 'N/A'}`, 15, yPosition);

    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tech Name & Sign: ${selectedSurvey.tech_signature || '___________________'}`, 15, yPosition);

    const fileName = `Survey_${selectedSurvey.customer || 'Unknown'}_${selectedSurvey.survey_date || new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedSurvey) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setSelectedSurvey(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to List
          </button>
          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <h2 className="text-2xl font-bold">Survey Details</h2>
            <p className="text-blue-100 mt-1">
              Submitted on {new Date(selectedSurvey.created_at).toLocaleString()}
            </p>
          </div>

          <div className="p-6 space-y-6">
            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                Basic Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Customer:</span>
                  <p className="font-semibold">{selectedSurvey.customer || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Mobile:</span>
                  <p className="font-semibold">{selectedSurvey.mobile || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Survey Date:</span>
                  <p className="font-semibold">{selectedSurvey.survey_date || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Area/Location:</span>
                  <p className="font-semibold">{selectedSurvey.area_location || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Property Type:</span>
                  <p className="font-semibold">{selectedSurvey.property_type || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Users:</span>
                  <p className="font-semibold">{selectedSurvey.users || 'N/A'}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                Water Source
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Sources:</span>
                  <p className="font-semibold">{getWaterSources(selectedSurvey)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Sump:</span>
                  <p className="font-semibold">
                    {selectedSurvey.sump_capacity || 'N/A'}{' '}
                    {selectedSurvey.sump_ltrs && `(${selectedSurvey.sump_ltrs} L)`}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">OHT:</span>
                  <p className="font-semibold">
                    {selectedSurvey.oht_capacity || 'N/A'}{' '}
                    {selectedSurvey.oht_ltrs && `(${selectedSurvey.oht_ltrs} L)`}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                Water & Pressure
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Hardness:</span>
                  <p className="font-semibold">{selectedSurvey.hardness_ppm || 'N/A'} ppm</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">TDS:</span>
                  <p className="font-semibold">{selectedSurvey.tds_ppm || 'N/A'} ppm</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Iron:</span>
                  <p className="font-semibold">{selectedSurvey.water_iron ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Smell:</span>
                  <p className="font-semibold">{selectedSurvey.water_smell ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Pressure:</span>
                  <p className="font-semibold">
                    {selectedSurvey.pressure_low && 'Low'}
                    {selectedSurvey.pressure_med && 'Medium'}
                    {selectedSurvey.pressure_high && 'High'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Pipe:</span>
                  <p className="font-semibold">
                    {selectedSurvey.pipe_old && 'Old'}
                    {selectedSurvey.pipe_new && 'New'}{' '}
                    {selectedSurvey.pipe_size && `(${selectedSurvey.pipe_size})`}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                Products Required
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedSurvey.water_softener && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>
                      Water Softener
                      {selectedSurvey.water_softener_capacity &&
                        ` (${selectedSurvey.water_softener_capacity})`}
                    </span>
                  </div>
                )}
                {selectedSurvey.ro_purifier && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>
                      RO Purifier
                      {selectedSurvey.ro_purifier_model &&
                        ` (${selectedSurvey.ro_purifier_model})`}
                    </span>
                  </div>
                )}
                {selectedSurvey.water_heater && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>
                      Water Heater
                      {selectedSurvey.water_heater_litres &&
                        ` (${selectedSurvey.water_heater_litres} L)`}
                    </span>
                  </div>
                )}
                {selectedSurvey.solar_heat_pump && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>
                      Solar/Heat Pump
                      {selectedSurvey.solar_heat_pump_lpd &&
                        ` (${selectedSurvey.solar_heat_pump_lpd} LPD)`}
                    </span>
                  </div>
                )}
                {selectedSurvey.pressure_pump && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>
                      Pressure Pump
                      {selectedSurvey.pressure_pump_hp &&
                        ` (${selectedSurvey.pressure_pump_hp} HP)`}
                    </span>
                  </div>
                )}
                {selectedSurvey.submersible_pump && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>
                      Submersible Pump
                      {selectedSurvey.submersible_pump_hp &&
                        ` (${selectedSurvey.submersible_pump_hp} HP)`}
                    </span>
                  </div>
                )}
                {selectedSurvey.water_level_controller && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>
                      Water Level Controller
                      {selectedSurvey.water_level_controller_type &&
                        ` (${selectedSurvey.water_level_controller_type})`}
                    </span>
                  </div>
                )}
                {selectedSurvey.solar_rooftop && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>
                      Solar Rooftop
                      {selectedSurvey.solar_rooftop_kw &&
                        ` (${selectedSurvey.solar_rooftop_kw} kW)`}
                    </span>
                  </div>
                )}
              </div>
              {(selectedSurvey.products_required || []).length > 0 && (
                <div className="mt-4 space-y-2">
                  {(selectedSurvey.products_required as SurveyProduct[] || []).map((product: SurveyProduct, i: number) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        {product.product_name}
                        <span className="text-sm font-normal text-gray-500">× {product.quantity}</span>
                      </div>
                      {product.product_specs && (
                        <p className="mt-1 ml-7 text-sm text-gray-600 whitespace-pre-line">{product.product_specs}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                Installation Check
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Power:</span>
                  <p className="font-semibold">{selectedSurvey.power_available || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Drain:</span>
                  <p className="font-semibold">{selectedSurvey.drain_available || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Earthing:</span>
                  <p className="font-semibold">
                    {selectedSurvey.earthing_available || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Safe Access:</span>
                  <p className="font-semibold">{selectedSurvey.safe_access || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Plumbing:</span>
                  <p className="font-semibold">{selectedSurvey.plumbing_status || 'N/A'}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                Signature
              </h3>
              <div>
                <span className="text-sm text-gray-600">Technician:</span>
                <p className="font-semibold">{selectedSurvey.tech_signature || 'N/A'}</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  const filteredSurveys = surveys.filter(survey => {
    const query = searchQuery.toLowerCase();
    return (
      survey.customer?.toLowerCase().includes(query) ||
      survey.mobile?.toLowerCase().includes(query) ||
      survey.area_location?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Site Survey Records</h2>
        <p className="text-gray-600">View all submitted site survey checklists</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredSurveys.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Surveys Yet</h3>
          <p className="text-gray-600">Submit your first site survey to see it here.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSurveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-5 h-5" />
                  <h3 className="font-bold text-lg">{survey.customer || 'Unknown'}</h3>
                </div>
                <div className="flex items-center gap-2 text-blue-100 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>{survey.mobile || 'No phone'}</span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-700">
                    {survey.area_location || 'Location not specified'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {survey.survey_date
                      ? new Date(survey.survey_date).toLocaleDateString()
                      : 'Date not set'}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Water Sources:</p>
                  <p className="text-sm font-medium text-gray-700">
                    {getWaterSources(survey)}
                  </p>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-2">Products Required:</p>
                  <div className="flex flex-wrap gap-2">
                    {survey.water_softener && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        Softener
                      </span>
                    )}
                    {survey.ro_purifier && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        RO
                      </span>
                    )}
                    {survey.water_heater && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        Heater
                      </span>
                    )}
                    {survey.solar_rooftop && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        Solar
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => viewDetails(survey.id)}
                  className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View Details
                </button>
              </div>

              <div className="px-4 pb-3 text-xs text-gray-500">
                Submitted: {new Date(survey.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
