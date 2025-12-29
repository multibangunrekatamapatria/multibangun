
import React, { useState, useEffect, useMemo } from 'react';
// Fix: Added Briefcase and CheckCircle2 to imports from lucide-react
import { 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  FileUp,
  X,
  ChevronDown,
  Calendar,
  Building2,
  User as UserIcon,
  Tag,
  Info,
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import { Letter, LetterTypeCode } from '../types';
import { LETTER_TYPES } from '../constants';
import { getLetters, saveLetter, updateLetter } from '../services/dbService';

const LetterArchive: React.FC = () => {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Letter>>({
    date: new Date().toISOString().split('T')[0],
    companyName: '',
    requestor: 'Admin',
    typeCode: LetterTypeCode.MISC,
    subject: '',
    materialInquired: '',
    projectName: '',
    startDate: '',
    transportation: '',
    installerNames: '',
    contactPersonName: '',
    contactPersonPhone: '',
    companyRequested: '',
    picName: '',
    expirationDate: ''
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLetters(getLetters());
  };

  const filteredLetters = useMemo(() => {
    return letters.filter(l => {
      const matchesSearch = 
        l.letterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || l.typeCode === filterType;
      return matchesSearch && matchesType;
    });
  }, [letters, searchTerm, filterType]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newLetter = saveLetter(formData);
    setLetters([newLetter, ...letters]);
    setIsModalOpen(false);
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      companyName: '',
      requestor: 'Admin',
      typeCode: LetterTypeCode.MISC,
      subject: '',
    });
  };

  const handleCopy = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = (letterId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const letter = letters.find(l => l.id === letterId);
    if (!letter) return;

    // Simulate upload and rename
    const fileIndex = letter.files.length + 1;
    const sequenceStr = letter.sequence.toString().padStart(3, '0');
    const baseName = `${sequenceStr} - ${letter.companyName} - ${letter.subject}`;
    const fileName = letter.files.length === 0 ? baseName : `${baseName} - ${fileIndex}`;
    
    const newFile = {
      name: fileName,
      url: '#', // In real app, this would be a Google Drive link
      uploadedAt: new Date().toISOString()
    };

    const updated = updateLetter(letterId, {
      files: [...letter.files, newFile]
    });
    
    setLetters(letters.map(l => l.id === letterId ? updated : l));
    if (selectedLetter?.id === letterId) {
      setSelectedLetter(updated);
    }
  };

  // Auto-generate subject for PWRN
  useEffect(() => {
    if (formData.typeCode === LetterTypeCode.PWRN && formData.materialInquired) {
      setFormData(prev => ({
        ...prev,
        subject: `Surat Penawaran Harga Material ${formData.materialInquired}`
      }));
    }
  }, [formData.typeCode, formData.materialInquired]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Letter Generator</h1>
          <p className="text-sm text-gray-500">Manage and archive company correspondence.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all"
        >
          <Plus size={20} />
          Generate New Letter
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by number, company, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-11 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="text-gray-400 shrink-0" size={18} />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
          >
            <option value="ALL">All Letter Types</option>
            {LETTER_TYPES.map(t => (
              <option key={t.code} value={t.code}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Letters List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Letter Number</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Archive</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLetters.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-gray-900">{l.letterNumber}</span>
                      <button 
                        onClick={() => handleCopy(l.letterNumber, l.id)}
                        className="text-gray-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        {copiedId === l.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{new Date(l.date).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">{l.companyName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 line-clamp-1">{l.subject}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {l.files.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                        <Check size={10} /> Signed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">
                        <AlertCircle size={10} /> Missing
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedLetter(l)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 ml-auto"
                    >
                      Details <ExternalLink size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLetters.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                    <FileUp size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-lg">No records found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">New Letter Request</h3>
                <p className="text-sm text-gray-500">Auto-number will be generated based on current date.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Fields */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    <Calendar size={12} /> Date Created
                  </label>
                  <input 
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    <Tag size={12} /> Letter Type
                  </label>
                  <select 
                    required
                    value={formData.typeCode}
                    onChange={(e) => setFormData({...formData, typeCode: e.target.value as LetterTypeCode})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    {LETTER_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    <Building2 size={12} /> Institution/Recipient
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Company name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    <UserIcon size={12} /> Requestor
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Requester name"
                    value={formData.requestor}
                    onChange={(e) => setFormData({...formData, requestor: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Conditional Fields: Quotation (PWRN) */}
              {formData.typeCode === LetterTypeCode.PWRN && (
                <div className="bg-blue-50 p-4 rounded-2xl space-y-4 border border-blue-100">
                  <h4 className="text-sm font-bold text-blue-700 flex items-center gap-2">
                    <Info size={16} /> Quotation Details
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-blue-600 uppercase">Material(s) Inquired</label>
                      <input 
                        type="text"
                        placeholder="e.g. Roof Tiles, Paving Blocks"
                        value={formData.materialInquired}
                        onChange={(e) => setFormData({...formData, materialInquired: e.target.value})}
                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-blue-600 uppercase">Project Name</label>
                      <input 
                        type="text"
                        placeholder="Project title"
                        value={formData.projectName}
                        onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Fields: Tugas */}
              {formData.typeCode === LetterTypeCode.TUGAS && (
                <div className="bg-indigo-50 p-4 rounded-2xl space-y-4 border border-indigo-100">
                  <h4 className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                    <Briefcase size={16} /> Assignment Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-indigo-600 uppercase">Start Date</label>
                      <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-indigo-600 uppercase">Transportation</label>
                      <input type="text" placeholder="e.g. Office Van, Plane" value={formData.transportation} onChange={(e) => setFormData({...formData, transportation: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-indigo-600 uppercase">Project Name</label>
                      <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-indigo-600 uppercase">Installer Name(s)</label>
                      <input type="text" placeholder="Separate by comma" value={formData.installerNames} onChange={(e) => setFormData({...formData, installerNames: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-indigo-600 uppercase">CP Name</label>
                      <input type="text" value={formData.contactPersonName} onChange={(e) => setFormData({...formData, contactPersonName: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-indigo-600 uppercase">CP Phone</label>
                      <input type="text" value={formData.contactPersonPhone} onChange={(e) => setFormData({...formData, contactPersonPhone: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3" />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Fields: SURDUK */}
              {formData.typeCode === LetterTypeCode.SURDUK && (
                <div className="bg-emerald-50 p-4 rounded-2xl space-y-4 border border-emerald-100">
                  <h4 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 size={16} /> Tender Support Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-emerald-600 uppercase">Project / Tender Name</label>
                      <input type="text" value={formData.projectName} onChange={(e) => setFormData({...formData, projectName: e.target.value})} className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-emerald-600 uppercase">Company Requesting</label>
                      <input type="text" value={formData.companyRequested} onChange={(e) => setFormData({...formData, companyRequested: e.target.value})} className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-emerald-600 uppercase">PIC</label>
                      <input type="text" value={formData.picName} onChange={(e) => setFormData({...formData, picName: e.target.value})} className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-emerald-600 uppercase">Expiration Date</label>
                      <input type="date" value={formData.expirationDate} onChange={(e) => setFormData({...formData, expirationDate: e.target.value})} className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Letter Subject</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="The main objective or title of the letter"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 transition-all transform hover:-translate-y-0.5"
                >
                  Generate Letter Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail/Edit/Archive Modal */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="bg-gray-900 p-8 text-white relative">
              <button 
                onClick={() => setSelectedLetter(null)} 
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <p className="text-blue-400 font-mono text-sm mb-2 tracking-widest uppercase">Letter Records</p>
              <h3 className="text-3xl font-black">{selectedLetter.letterNumber}</h3>
              <div className="mt-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm border border-white/10">
                  <Calendar size={16} className="text-blue-400" />
                  {new Date(selectedLetter.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm border border-white/10">
                  <Tag size={16} className="text-blue-400" />
                  {selectedLetter.typeCode}
                </div>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Company/Institution</h4>
                  <p className="text-lg font-bold text-gray-900">{selectedLetter.companyName}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Requestor</h4>
                  <p className="text-gray-900 font-medium">{selectedLetter.requestor}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Subject</h4>
                  <p className="text-gray-700 leading-relaxed">{selectedLetter.subject}</p>
                </div>

                {/* Additional dynamic info */}
                {selectedLetter.projectName && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Project</h4>
                    <p className="text-gray-700 font-medium">{selectedLetter.projectName}</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileUp size={18} className="text-blue-600" />
                    Archived Soft Copies
                  </h4>
                  
                  {selectedLetter.files.length > 0 ? (
                    <div className="space-y-3">
                      {selectedLetter.files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-xs font-bold text-gray-900 truncate" title={f.name}>{f.name}</p>
                            <p className="text-[10px] text-gray-400">{new Date(f.uploadedAt).toLocaleString()}</p>
                          </div>
                          <a href={f.url} className="text-blue-600 hover:text-blue-800 shrink-0">
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
                      <AlertCircle className="mx-auto text-amber-500 mb-2" size={24} />
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Missing Signed Copy</p>
                      <p className="text-[10px] text-amber-600 mt-1">Please upload the scanned version to close this archive.</p>
                    </div>
                  )}

                  <div className="mt-6">
                    <label className="block">
                      <span className="sr-only">Choose file</span>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileUpload(selectedLetter.id, e)}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2.5 file:px-4
                          file:rounded-xl file:border-0
                          file:text-sm file:font-bold
                          file:bg-blue-600 file:text-white
                          hover:file:bg-blue-700
                          transition-all cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedLetter(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LetterArchive;
