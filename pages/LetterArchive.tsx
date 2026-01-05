
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
  Download,
  Eye
} from 'lucide-react';
import { Letter, LetterTypeCode } from '../types';
import { LETTER_TYPES, formatDateDisplay } from '../constants';
import { getLetters, saveLetter, updateLetter, setLetters as setLocalLetters, deleteLetter, removeFileFromLetter } from '../services/dbService';
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

  // Form State
  const [formData, setFormData] = useState<Partial<Letter>>({
    date: new Date().toISOString().split('T')[0],
    companyName: '',
    requestor: 'Admin',
    typeCode: LetterTypeCode.MISC,
    subject: '',
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

  const handleDeleteFile = (fileName: string) => {
    if (!selectedLetter) return;
    if (window.confirm(`Delete "${fileName}"? You will need to upload it again to replace it.`)) {
      const updated = removeFileFromLetter(selectedLetter.id, fileName);
      setLetters(letters.map(l => l.id === selectedLetter.id ? updated : l));
      setSelectedLetter(updated);
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

      // 1. Send to Google Drive
      await syncToGoogle({
        action: 'uploadFile',
        fileName: fileName,
        fileData: base64,
        mimeType: file.type,
        letterNumber: letter.letterNumber
      });

      const newFile = {
        name: fileName,
        url: '#SyncedToDrivePendingRefresh', // GAS will update the actual URL in the background
        uploadedAt: new Date().toISOString()
      };

      // 2. Update Local Storage immediately
      const updated = updateLetter(letterId, {
        files: [...letter.files, newFile]
      });
      
      setLetters(letters.map(l => l.id === letterId ? updated : l));
      if (selectedLetter?.id === letterId) {
        setSelectedLetter(updated);
      }
      
      alert('Upload dispatched to Drive! Please refresh in a few moments to see the final document link.');
    } catch (err) {
      console.error(err);
      alert('Upload failed. Check your connectivity.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Letter Archive</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500 font-medium">Auto-numbering & Google Master Sync.</p>
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
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-11 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="text-gray-400 shrink-0" size={18} />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm"
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
            <p className="text-gray-500 font-bold uppercase tracking-wider text-xs">Connecting to Master Database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Letter Number</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Recipient</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Subject</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Archive</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
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
                      <span className="text-sm font-bold text-gray-600">{formatDateDisplay(l.date)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-black text-gray-900">{l.companyName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 line-clamp-1 font-medium">{l.subject}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {l.files.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase border border-emerald-100">
                          <CheckCircle2 size={10} /> Signed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase border border-amber-100">
                          <AlertCircle size={10} /> Missing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="text-blue-600 hover:text-blue-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ml-auto"
                      >
                        Details <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">New Letter Generation</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Automatic sequence following Latest Log.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1">
                    <Calendar size={12} /> Date Created
                  </label>
                  <input 
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1">
                    <Tag size={12} /> Letter Category
                  </label>
                  <select 
                    required
                    value={formData.typeCode}
                    onChange={(e) => setFormData({...formData, typeCode: e.target.value as LetterTypeCode})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                  >
                    {LETTER_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1">
                    <Building2 size={12} /> Recipient Institution
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. PT Example Industry"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-gray-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1">
                    <UserIcon size={12} /> Official Requestor
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Official name"
                    value={formData.requestor}
                    onChange={(e) => setFormData({...formData, requestor: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Objective / Subject</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Main objective of the letter..."
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none font-bold"
                />
              </div>

              <div className="pt-6">
                <button 
                  type="submit"
                  disabled={isSyncing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-blue-100 transition-all transform hover:-translate-y-1 disabled:opacity-50 uppercase tracking-widest text-xs"
                >
                  {isSyncing ? 'Syncing to Google Cloud...' : 'Create & Log Letter Number'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedLetter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 my-8">
            <div className="bg-[#0f172a] p-10 text-white relative">
              <div className="absolute top-8 right-8 flex items-center gap-3">
                {!isEditing && (
                  <>
                    <button onClick={handleEditInit} className="p-3 hover:bg-white/10 rounded-2xl transition-colors text-blue-400 border border-white/5"><Edit3 size={20} /></button>
                    <button onClick={() => handleDeleteLetter(selectedLetter.id)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors text-red-400 border border-white/5"><Trash2 size={20} /></button>
                  </>
                )}
                <button onClick={() => { setSelectedLetter(null); setIsEditing(false); }} className="p-3 hover:bg-white/10 rounded-2xl transition-colors border border-white/5"><X size={24} /></button>
              </div>
              <p className="text-blue-400 font-mono text-[10px] mb-3 tracking-[0.3em] uppercase font-black">Archive Tracking Data</p>
              <h3 className="text-4xl font-black tracking-tight">{selectedLetter.letterNumber}</h3>
              <div className="mt-8 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl text-xs border border-white/10 font-black tracking-wider uppercase">
                  <Calendar size={18} className="text-blue-400" />
                  {formatDateDisplay(selectedLetter.date)}
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl text-xs border border-white/10 font-black tracking-wider uppercase">
                  <Tag size={18} className="text-blue-400" />
                  {selectedLetter.typeCode}
                </div>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdate} className="p-12 space-y-8 max-h-[60vh] overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Effective Date</label>
                    <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Letter Classification</label>
                    <select required value={formData.typeCode} onChange={(e) => setFormData({...formData, typeCode: e.target.value as LetterTypeCode})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm">
                      {LETTER_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Institution Name</label>
                    <input type="text" required value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requested By</label>
                    <input type="text" required value={formData.requestor} onChange={(e) => setFormData({...formData, requestor: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject Reference</label>
                  <textarea required rows={2} value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 resize-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
                </div>
                <div className="flex gap-4 justify-end pt-8">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-10 py-4 rounded-2xl font-black text-gray-400 hover:text-gray-600 transition-colors uppercase text-[10px] tracking-widest">Discard</button>
                  <button type="submit" disabled={isSyncing} className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-100 disabled:opacity-50 uppercase text-[10px] tracking-widest">
                    {isSyncing ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {isSyncing ? 'Synchronizing...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="space-y-10">
                  <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4">Recipient Entity</h4>
                    <p className="text-2xl font-black text-gray-900 leading-tight">{selectedLetter.companyName}</p>
                  </div>
                  <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4">Internal Requestor</h4>
                    <p className="text-xl font-bold text-gray-900">{selectedLetter.requestor}</p>
                  </div>
                  <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4">Official Subject</h4>
                    <p className="text-gray-700 leading-relaxed font-bold">{selectedLetter.subject}</p>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100 shadow-inner">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-sm font-black text-gray-900 flex items-center gap-4 uppercase tracking-[0.15em]">
                        <FileSearch size={28} className="text-blue-600" />
                        Stored Soft Copies
                      </h4>
                      <span className="text-[10px] font-black bg-blue-600 text-white px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-100">
                        {selectedLetter.files.length} Docs
                      </span>
                    </div>
                    
                    {selectedLetter.files.length > 0 ? (
                      <div className="space-y-5">
                        {selectedLetter.files.map((f, i) => {
                          const isLinkable = f.url && f.url.startsWith('http');
                          return (
                            <div key={i} className="group relative bg-white border border-gray-200 p-5 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col gap-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0 pr-10">
                                  <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight" title={f.name}>{f.name}</p>
                                  <p className="text-[10px] text-gray-400 font-black mt-1 uppercase tracking-widest">{formatDateDisplay(f.uploadedAt)}</p>
                                </div>
                                <button 
                                  onClick={() => handleDeleteFile(f.name)}
                                  className="text-gray-200 hover:text-red-500 p-2 transition-colors shrink-0 bg-gray-50 rounded-xl"
                                  title="Delete File Permanently"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="flex gap-3">
                                {isLinkable ? (
                                  <>
                                    <a 
                                      href={f.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-[#0f172a] text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-100"
                                    >
                                      <Eye size={16} /> Preview
                                    </a>
                                    <a 
                                      href={f.url.replace('/view', '/download')} 
                                      download
                                      className="flex items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-[1.25rem] hover:bg-blue-100 transition-colors"
                                      title="Download File"
                                    >
                                      <Download size={18} />
                                    </a>
                                  </>
                                ) : (
                                  <div className="flex-1 text-center py-4 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center justify-center gap-2">
                                    <RefreshCw size={12} className="animate-spin" /> Fetching Drive Link...
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-100 p-12 rounded-[2rem] text-center border-dashed border-2">
                        <AlertCircle className="mx-auto text-amber-500 mb-5" size={40} />
                        <p className="text-xs font-black text-amber-900 uppercase tracking-[0.2em]">Archive Missing</p>
                        <p className="text-[11px] text-amber-700 mt-3 font-bold">The signed document for this letter has not been uploaded to Google Drive yet.</p>
                      </div>
                    )}

                    <div className="mt-10">
                      <label className="block group">
                        <span className="sr-only">Choose file</span>
                        <div className="relative">
                          <input 
                            type="file" 
                            disabled={isUploading}
                            onChange={(e) => handleFileUpload(selectedLetter.id, e)}
                            className="block w-full text-sm text-gray-500
                              file:mr-5 file:py-4 file:px-8
                              file:rounded-2xl file:border-0
                              file:text-[10px] file:font-black file:uppercase
                              file:bg-blue-600 file:text-white
                              hover:file:bg-blue-700
                              disabled:opacity-50 transition-all cursor-pointer"
                          />
                        </div>
                      </label>
                      {isUploading && (
                        <div className="mt-5 flex items-center justify-center gap-4 text-xs text-blue-600 font-black uppercase tracking-[0.2em] animate-pulse">
                          <Loader2 size={18} className="animate-spin" /> Dispatching to Drive...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-10 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => { setSelectedLetter(null); setIsEditing(false); }}
                className="px-12 py-4.5 rounded-[1.5rem] font-black text-gray-500 hover:bg-gray-200 transition-all uppercase text-[11px] tracking-[0.2em]"
              >
                Close Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LetterArchive;
