
import React from 'react';
import { Wallet, Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PPUManagement: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
        <Wallet size={48} />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900">Pengajuan Pengeluaran Uang (PPU)</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Finance and expense request module. We are preparing to integrate your existing PPU forms into this central portal.
        </p>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full font-bold text-xs uppercase tracking-widest border border-amber-100">
          <Construction size={14} /> Ready for Integration
        </div>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PPUManagement;
