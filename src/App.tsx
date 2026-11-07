import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import SurveyForm from './components/SurveyForm';
import SurveyList from './components/SurveyList';
import SalesPipeline from './components/SalesPipeline';
import InstallationPipeline from './components/InstallationPipeline';
import ComplaintPipeline from './components/ComplaintPipeline';
import Reports from './components/Reports';
import Products from './components/Products';
import Architects from './components/Architects';
import Vendors from './components/Vendors';
import Expenses from './components/Expenses';
import Invoices from './components/Invoices';
import Quotations from './components/Quotations';
import { ClipboardList, List, LogOut, TrendingUp, Wrench, AlertCircle, BarChart3, DollarSign, Package, Users, Building2, FileText, Receipt } from 'lucide-react';

type MainTab = 'surveys' | 'pipelines' | 'finance' | 'reports';
type SurveyView = 'form' | 'list';
type PipelineView = 'sales' | 'installation' | 'complaint' | 'architects' | 'vendors';
type FinanceView = 'products' | 'expenses' | 'quotations' | 'invoices';

function App() {
  const [mainTab, setMainTab] = useState<MainTab>('pipelines');
  const [surveyView, setSurveyView] = useState<SurveyView>('form');
  const [pipelineView, setPipelineView] = useState<PipelineView>('sales');
  const [financeView, setFinanceView] = useState<FinanceView>('products');
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <img
                src="/talwin-logo.jpeg"
                alt="TALWIN AquaRay Logo"
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">TALWIN AquaRay Solutions</h1>
                <p className="text-sm text-gray-600">Field Technician Management System</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>

          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setMainTab('pipelines')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                mainTab === 'pipelines'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              Pipelines
            </button>
            <button
              onClick={() => setMainTab('surveys')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                mainTab === 'surveys'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <ClipboardList className="w-5 h-5 inline mr-2" />
              Site Surveys
            </button>
            <button
              onClick={() => setMainTab('finance')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                mainTab === 'finance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <DollarSign className="w-5 h-5 inline mr-2" />
              Finance
            </button>
            <button
              onClick={() => setMainTab('reports')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                mainTab === 'reports'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="w-5 h-5 inline mr-2" />
              Reports
            </button>
          </div>
        </div>
      </nav>

      {mainTab === 'surveys' && (
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex gap-2">
              <button
                onClick={() => setSurveyView('form')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  surveyView === 'form'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                New Survey
              </button>
              <button
                onClick={() => setSurveyView('list')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  surveyView === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                View Surveys
              </button>
            </div>
          </div>
        </div>
      )}

      {mainTab === 'pipelines' && (
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex gap-2">
              <button
                onClick={() => setPipelineView('sales')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  pipelineView === 'sales'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Sales Pipeline
              </button>
              <button
                onClick={() => setPipelineView('installation')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  pipelineView === 'installation'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Wrench className="w-4 h-4" />
                Installation Pipeline
              </button>
              <button
                onClick={() => setPipelineView('complaint')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  pipelineView === 'complaint'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Complaint Pipeline
              </button>
              <button
                onClick={() => setPipelineView('architects')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  pipelineView === 'architects'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Professionals
              </button>
              <button
                onClick={() => setPipelineView('vendors')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  pipelineView === 'vendors'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4" />
                Vendors
              </button>
            </div>
          </div>
        </div>
      )}

      {mainTab === 'finance' && (
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex gap-2">
              <button
                onClick={() => setFinanceView('products')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  financeView === 'products'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Package className="w-4 h-4" />
                Products
              </button>
              <button
                onClick={() => setFinanceView('expenses')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  financeView === 'expenses'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Expenses
              </button>
              <button
                onClick={() => setFinanceView('quotations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  financeView === 'quotations'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Quotations
              </button>
              <button
                onClick={() => setFinanceView('invoices')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  financeView === 'invoices'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Receipt className="w-4 h-4" />
                Invoices
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="py-8 px-4">
        {mainTab === 'surveys' && (
          <>
            {surveyView === 'form' ? (
              <SurveyForm onSuccess={() => setSurveyView('list')} />
            ) : (
              <SurveyList />
            )}
          </>
        )}

        {mainTab === 'pipelines' && (
          <>
            {pipelineView === 'sales' && <SalesPipeline />}
            {pipelineView === 'installation' && <InstallationPipeline />}
            {pipelineView === 'complaint' && <ComplaintPipeline />}
            {pipelineView === 'architects' && <Architects />}
            {pipelineView === 'vendors' && <Vendors />}
          </>
        )}

        {mainTab === 'finance' && (
          <>
            {financeView === 'products' && <Products />}
            {financeView === 'expenses' && <Expenses />}
            {financeView === 'quotations' && <Quotations />}
            {financeView === 'invoices' && <Invoices />}
          </>
        )}

        {mainTab === 'reports' && <Reports />}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>TALWIN AquaRay - Technician Site Survey System</p>
          <p className="mt-1">89040 69224 | www.talwin.in | info@talwin.in</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
