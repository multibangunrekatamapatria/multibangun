
import React from 'react';
import { ShoppingCart, Construction } from 'lucide-react';

const POManagement: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400">
        <ShoppingCart size={48} />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900">PO Number Generator</h1>
        <p className="text-gray-500 max-w-md mx-auto">This module is currently being optimized for PT MRP's purchasing workflow. Check back soon for the automated procurement tracker.</p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full font-bold text-xs uppercase tracking-widest border border-amber-100">
        <Construction size={14} /> Under Development
      </div>
    </div>
  );
};

export default POManagement;
