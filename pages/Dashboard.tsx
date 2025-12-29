
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLetters } from '../services/dbService';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  Files,
  ShoppingCart,
  Briefcase,
  Wallet
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const letters = useMemo(() => getLetters(), []);
  
  const stats = useMemo(() => {
    const missingFiles = letters.filter(l => l.files.length === 0).length;
    const todayCount = letters.filter(l => {
      const today = new Date().toISOString().split('T')[0];
      return l.date === today;
    }).length;

    return {
      total: letters.length,
      missing: missingFiles,
      today: todayCount,
      completed: letters.length - missingFiles
    };
  }, [letters]);

  const recentLetters = letters.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-500 mt-1">Here is what's happening at PT MRP today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<FileText className="text-blue-600" />} 
          label="Total Letters" 
          value={stats.total} 
          color="blue"
        />
        <StatCard 
          icon={<AlertTriangle className="text-amber-600" />} 
          label="Missing Files" 
          value={stats.missing} 
          color="amber"
          warning
        />
        <StatCard 
          icon={<CheckCircle2 className="text-emerald-600" />} 
          label="Archived & Signed" 
          value={stats.completed} 
          color="emerald"
        />
        <StatCard 
          icon={<Clock className="text-indigo-600" />} 
          label="Created Today" 
          value={stats.today} 
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Recent Letters
            </h2>
            <button 
              onClick={() => navigate('/letters')}
              className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentLetters.length > 0 ? recentLetters.map((l) => (
              <div key={l.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-mono text-xs">
                  {l.typeCode}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{l.letterNumber}</p>
                  <p className="text-xs text-gray-500 truncate">{l.companyName} • {l.subject}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${l.files.length > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {l.files.length > 0 ? 'Signed' : 'Draft'}
                  </span>
                  <p className="text-[10px] text-gray-400 font-medium">{new Date(l.date).toLocaleDateString()}</p>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-gray-400">
                <Files size={40} className="mx-auto mb-3 opacity-20" />
                <p>No letters generated yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-gray-900 mb-6">Quick Actions</h2>
          <button 
            onClick={() => navigate('/letters')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <PlusCircle size={20} />
            </div>
            <div>
              <p className="font-bold">New Letter</p>
              <p className="text-xs opacity-80">Generate auto number</p>
            </div>
          </button>
          <button 
            onClick={() => navigate('/ppu')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Wallet size={20} />
            </div>
            <div>
              <p className="font-bold">New PPU Request</p>
              <p className="text-xs opacity-80">Finance & Expenses</p>
            </div>
          </button>
          <button 
            onClick={() => navigate('/po')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-white">
              <ShoppingCart size={20} />
            </div>
            <div>
              <p className="font-bold">New PO Number</p>
              <p className="text-xs text-gray-500">Procurement tracking</p>
            </div>
          </button>
          <button 
            onClick={() => navigate('/tugas')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="font-bold">Tugas Request</p>
              <p className="text-xs text-gray-500">Personnel assignment</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: number, color: string, warning?: boolean }> = ({ icon, label, value, color, warning }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border ${warning ? 'border-amber-100' : 'border-gray-200'}`}>
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-xl bg-${color}-50`}>
        {icon}
      </div>
      {warning && value > 0 && <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-pulse" />}
    </div>
    <div className="mt-4">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-1">{label}</p>
    </div>
  </div>
);

export default Dashboard;
