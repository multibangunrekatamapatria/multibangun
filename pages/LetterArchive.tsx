
import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
  Calendar,
  Building2,
  User as UserIcon,
  Tag,
  Info,
  Briefcase,
  CheckCircle2,
  Loader2,
  Edit3,
  Save,
  Trash2,
  CloudUpload,
  FileSearch,
  Download
} from 'lucide-react';
import { Letter, LetterTypeCode } from '../types';
import { LETTER_TYPES, formatDateDisplay } from '../constants';
import { getLetters, saveLetter, updateLetter, setLetters as setLocalLetters, deleteLetter } from '../services/dbService';
import { syncToGoogle, fileToBase64, fetchLettersFromGoogle } from '../services/googleService';

const LetterArchive: React.FC = () => {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Form State (for Create & Edit)
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

  const loadCloudData = async () => {
    setIsSyncing(true);
    try {
      const cloudLetters = await fetchLettersFromGoogle();
      if (cloudLetters && cloudLetters.length > 0) {
        setLocalLetters(cloudLetters);
        setLetters(cloudLetters);
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 2000);
      } else {
        setLetters(getLetters());
      }
    } catch (e) {
      setLetters(getLetters());
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    setLetters(getLetters());
  }, []);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      const newLetter = saveLetter(formData);
      setLetters([newLetter, ...letters]);
      setIsModalOpen(false);
      resetForm();
    } finally {
      setIsSyncing(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
  };

  const handleEditInit = () => {
    if (selectedLetter) {
      setFormData({ ...selectedLetter });
      setIsEditing(true);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLetter) {
      setIsSyncing(true);
      try {
        const updated = updateLetter(selectedLetter.id, formData);
        setLetters(letters.map(l => l.id === selectedLetter.id ? updated : l));
        setSelectedLetter(updated);
        setIsEditing(false);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleDeleteLetter = (id: string) => {
    if (window.confirm('Delete this record? This will also remove it from the Google Sheet.')) {
      deleteLetter(id);
      setLetters(letters.filter(l => l.id !== id));
      setSelectedLetter(null);
    }
  };

  const handleCopy = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = async (letterId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const letter = letters.find(l => l.id === letterId);
    if (!letter) return;

    setIsUploading(true);

    try {
      const fileIndex = letter.files.length + 1;
      const sequenceStr = letter.sequence.toString().padStart(3, '0');
      const baseName = `${sequenceStr} - ${letter.companyName} - ${letter.subject}`;
      const fileName = letter.files.length === 0 ? baseName : `${baseName} - ${fileIndex}`;
      
      const base64 = await fileToBase64(file);

      await syncToGoogle({
        action: 'uploadFile',
        fileName: fileName,
        fileData: base64,
        mimeType: file.type,
        letterNumber: letter.letterNumber
      });

      const newFile = {
        name: fileName,
        url: '#SyncedToDrivePendingRefresh',
        uploadedAt: new Date().toISOString()
      };

      const updated = updateLetter(letterId, {
        files: [...letter.files, newFile]
      });
      
      setLetters(letters.map(l => l.id === letterId ? updated : l));
      if (selectedLetter?.id === letterId) {
        setSelectedLetter(updated);
      }
      
      alert('Upload dispatched! Refresh in a few moments to see the Drive link.');
    } catch (err) {
      console.error(err);
      alert('Upload failed. Check your connectivity.');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (formData.typeCode === LetterTypeCode.PWRN && formData.materialInquired && !isEditing) {
      setFormData(prev => ({
        ...prev,
        subject: `Surat Penawaran Harga Material ${formData.materialInquired}`
      }));
    }
  }, [formData.typeCode, formData.materialInquired, isEditing]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Letter Archive</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">Auto-numbering & Google Master Sync.</p>
            {showSyncSuccess && (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 animate-bounce">
                <Check size={12} /> Database Synced
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadCloudData}
            disabled={isSyncing}
            className={`p-2.5 rounded-xl transition-all border ${isSyncing ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-gray-200'}`}
            title="Refresh from Google Sheet"
          >
            <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all"
          >
            <Plus size={20} />
            Generate New Letter
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by number, recipient, or subject..."
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
        {isSyncing && letters.length === 0 ? (
          <div className="p-20 text-center">
            <Loader2 size={40} className="animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Connecting to Master Database...</p>
          </div>
        ) : (
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
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setSelectedLetter(l)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-gray-900">{l.letterNumber}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCopy(l.letterNumber, l.id); }}
                          className="text-gray-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          {copiedId === l.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{formatDateDisplay(l.date)}</span>
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
                        className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 ml-auto"
                      >
                        Details <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredLetters.length === 0 && !isSyncing && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                      <CloudUpload size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-lg">No records found. Click "Generate" to create one.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">New Letter Request</h3>
                <p className="text-sm text-gray-500">Auto-number will follow the latest sequence.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  disabled={isSyncing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {isSyncing ? 'Syncing to Google...' : 'Generate & Sync Letter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedLetter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="bg-gray-900 p-8 text-white relative">
              <div className="absolute top-6 right-6 flex items-center gap-2">
                {!isEditing && (
                  <>
                    <button 
                      onClick={handleEditInit} 
                      className="p-2 hover:bg-white/10 rounded-full transition-colors text-blue-400"
                      title="Edit Record"
                    >
                      <Edit3 size={20} />
                    </button>
                    <button 
                      onClick={() => handleDeleteLetter(selectedLetter.id)} 
                      className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-400"
                      title="Delete Record"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => { setSelectedLetter(null); setIsEditing(false); }} 
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-blue-400 font-mono text-sm mb-2 tracking-widest uppercase">{isEditing ? 'Editing Record' : 'Archive Detail'}</p>
              <h3 className="text-3xl font-black">{selectedLetter.letterNumber}</h3>
              <div className="mt-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm border border-white/10">
                  <Calendar size={16} className="text-blue-400" />
                  {formatDateDisplay(selectedLetter.date)}
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm border border-white/10">
                  <Tag size={16} className="text-blue-400" />
                  {selectedLetter.typeCode}
                </div>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdate} className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date Created</label>
                    <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Letter Type</label>
                    <select required value={formData.typeCode} onChange={(e) => setFormData({...formData, typeCode: e.target.value as LetterTypeCode})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none">
                      {LETTER_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recipient</label>
                    <input type="text" required value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Requestor</label>
                    <input type="text" required value={formData.requestor} onChange={(e) => setFormData({...formData, requestor: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subject</label>
                  <textarea required rows={2} value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
                  <button type="submit" disabled={isSyncing} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50">
                    {isSyncing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {isSyncing ? 'Syncing...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
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
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileUp size={18} className="text-blue-600" />
                      Archived Soft Copies
                    </h4>
                    
                    {selectedLetter.files.length > 0 ? (
                      <div className="space-y-3">
                        {selectedLetter.files.map((f, i) => {
                          const isLinkable = f.url && f.url.startsWith('http');
                          return (
                            <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                              <div className="flex-1 min-w-0 pr-4">
                                <p className="text-xs font-bold text-gray-900 truncate" title={f.name}>{f.name}</p>
                                <p className="text-[10px] text-gray-400">{formatDateDisplay(f.uploadedAt)}</p>
                              </div>
                              {isLinkable ? (
                                <a 
                                  href={f.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                  <Download size={10} /> View
                                </a>
                              ) : (
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase">Pending Link</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
                        <AlertCircle className="mx-auto text-amber-500 mb-2" size={24} />
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Missing Signed Copy</p>
                        <p className="text-[10px] text-amber-600 mt-1">Scanned version not yet uploaded.</p>
                      </div>
                    )}

                    <div className="mt-6 relative">
                      <label className="block">
                        <span className="sr-only">Choose file</span>
                        <input 
                          type="file" 
                          disabled={isUploading}
                          onChange={(e) => handleFileUpload(selectedLetter.id, e)}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2.5 file:px-4
                            file:rounded-xl file:border-0
                            file:text-sm file:font-bold
                            file:bg-blue-600 file:text-white
                            hover:file:bg-blue-700
                            disabled:opacity-50 transition-all cursor-pointer"
                        />
                      </label>
                      {isUploading && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 font-bold animate-pulse">
                          <Loader2 size={14} className="animate-spin" /> Uploading to Drive...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => { setSelectedLetter(null); setIsEditing(false); }}
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
