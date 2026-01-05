
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  X,
  RefreshCw,
  Calendar,
  Building2,
  User as UserIcon,
  Tag,
  Briefcase,
  CheckCircle2,
  Loader2,
  Edit3,
  Save,
  Trash2,
  CloudUpload,
  FileSearch,
  Download,
  Eye,
  Package
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
    typeCode: LetterTypeCode.PWRN,
    subject: '',
    materialInquired: '',
    projectName: '',
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
      console.error("Cloud connection failure:", e);
      setLetters(getLetters());
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadCloudData();
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

  // Logic: Automatically update subject for Quotations (PWRN)
  useEffect(() => {
    if (formData.typeCode === LetterTypeCode.PWRN && !isEditing) {
      const material = formData.materialInquired || '';
      const project = formData.projectName || '';
      
      let newSubject = 'Surat Penawaran Harga Material';
      if (material) newSubject += ` ${material}`;
      if (project) newSubject += ` - Proyek ${project}`;
      
      if (newSubject !== formData.subject) {
        setFormData(prev => ({
          ...prev,
          subject: newSubject
        }));
      }
    }
  }, [formData.typeCode, formData.materialInquired, formData.projectName, isEditing]);

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
      typeCode: LetterTypeCode.PWRN,
      subject: '',
      materialInquired: '',
      projectName: '',
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
    if (window.confirm('Delete this letter permanently? It will be removed from the Master Sheet.')) {
      deleteLetter(id);
      setLetters(letters.filter(l => l.id !== id));
      setSelectedLetter(null);
    }
  };

  const handleDeleteFile = (fileName: string) => {
    if (!selectedLetter) return;
    if (window.confirm(`Delete attachment: "${fileName}"?`)) {
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
      const sequenceStr = letter.sequence.toString().padStart(3, '0');
      const baseName = `${sequenceStr} - ${letter.companyName} - ${letter.subject}`.substring(0, 80);
      const fileName = letter.files.length === 0 ? baseName : `${baseName} (v${letter.files.length + 1})`;
      
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
        url: '#pending_sync', 
        uploadedAt: new Date().toISOString()
      };

      const updated = updateLetter(letterId, {
        files: [...letter.files, newFile]
      });
      
      setLetters(letters.map(l => l.id === letterId ? updated : l));
      if (selectedLetter?.id === letterId) {
        setSelectedLetter(updated);
      }
      
      alert('File successfully dispatched to Google Drive! Refresh later for the public link.');
    } catch (err) {
      console.error(err);
      alert('Upload failed. Check if your Script URL is correct.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Letter Archive</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Master Cloud Sync</p>
            {showSyncSuccess && (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
                <CheckCircle2 size={12} /> Sync Active
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadCloudData}
            disabled={isSyncing}
            className={`p-2.5 rounded-xl transition-all border ${isSyncing ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-gray-200'}`}
          >
            <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-100 transition-all"
          >
            <Plus size={18} />
            Generate New
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by company, number, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
          />
        </div>
        <div className="flex items-center gap-2 min-w-[220px]">
          <Filter className="text-gray-400 shrink-0" size={18} />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black text-[10px] uppercase tracking-widest cursor-pointer"
          >
            <option value="ALL">All Letter Types</option>
            {LETTER_TYPES.map(t => (
              <option key={t.code} value={t.code}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference No.</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Recipient</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLetters.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedLetter(l)}>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-black text-gray-900">{l.letterNumber}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCopy(l.letterNumber, l.id); }}
                        className="text-gray-300 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        {copiedId === l.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-500">{formatDateDisplay(l.date)}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{l.companyName}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm text-gray-600 line-clamp-1 font-medium italic">{l.subject}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    {l.files.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        <CheckCircle2 size={10} /> Archived
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-100">
                        <AlertCircle size={10} /> No File
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ml-auto">
                      View <ExternalLink size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">New Letter Entry</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-200 rounded-full text-gray-400">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</label>
                  <select required value={formData.typeCode} onChange={(e) => setFormData({...formData, typeCode: e.target.value as LetterTypeCode})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold">
                    {LETTER_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* AUTOMATIC PWRN FIELDS */}
              {formData.typeCode === LetterTypeCode.PWRN && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-blue-50 rounded-[2rem] border border-blue-100 animate-in fade-in slide-in-from-top-4 shadow-inner">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                      <Package size={14} /> Material Product
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Roof Tiles"
                      value={formData.materialInquired}
                      onChange={(e) => setFormData({...formData, materialInquired: e.target.value})}
                      className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                      <Briefcase size={14} /> Project Name
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Wisma Atlet"
                      value={formData.projectName}
                      onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                      className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recipient</label>
                  <input type="text" required placeholder="Company Name" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requestor</label>
                  <input type="text" required value={formData.requestor} onChange={(e) => setFormData({...formData, requestor: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</label>
                <textarea required rows={2} value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold italic" />
              </div>

              <button type="submit" disabled={isSyncing} className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl transition-all disabled:opacity-50 uppercase tracking-widest text-xs">
                {isSyncing ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Confirm Entry'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedLetter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0f172a]/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 my-8">
            <div className="bg-[#0f172a] p-12 text-white relative">
              <div className="absolute top-10 right-10 flex items-center gap-4">
                {!isEditing && (
                  <>
                    <button onClick={handleEditInit} className="p-4 hover:bg-white/10 rounded-2xl text-blue-400 border border-white/5"><Edit3 size={24} /></button>
                    <button onClick={() => handleDeleteLetter(selectedLetter.id)} className="p-4 hover:bg-white/10 rounded-2xl text-red-400 border border-white/5"><Trash2 size={24} /></button>
                  </>
                )}
                <button onClick={() => { setSelectedLetter(null); setIsEditing(false); }} className="p-4 hover:bg-white/10 rounded-2xl border border-white/5"><X size={28} /></button>
              </div>
              <h3 className="text-5xl font-black tracking-tighter mb-4">{selectedLetter.letterNumber}</h3>
              <div className="flex flex-wrap gap-5">
                <div className="flex items-center gap-3 bg-white/5 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                  <Calendar size={20} className="text-blue-400" /> {formatDateDisplay(selectedLetter.date)}
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                  <Tag size={20} className="text-blue-400" /> {selectedLetter.typeCode}
                </div>
              </div>
            </div>

            <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-12">
                <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 shadow-sm border-l-8 border-l-blue-600">
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-5">Recipient</h4>
                  <p className="text-3xl font-black text-gray-900 leading-tight uppercase tracking-tight">{selectedLetter.companyName}</p>
                </div>
                <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 shadow-sm">
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-5">Subject</h4>
                  <p className="text-gray-700 leading-relaxed font-bold italic">"{selectedLetter.subject}"</p>
                </div>
              </div>

              <div className="space-y-12">
                <div className="bg-gray-50 rounded-[3.5rem] p-12 border border-gray-100">
                  <div className="flex items-center justify-between mb-10">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-3">
                      <FileSearch size={32} className="text-blue-600" /> Archives
                    </h4>
                  </div>
                  
                  {selectedLetter.files.length > 0 ? (
                    <div className="space-y-6">
                      {selectedLetter.files.map((f, i) => {
                        const isLinkable = f.url && (f.url.startsWith('http') || f.url.includes('drive.google.com'));
                        return (
                          <div key={i} className="bg-white border border-gray-200 p-6 rounded-[2.5rem] flex flex-col gap-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0 pr-12">
                                <p className="text-[11px] font-black text-gray-900 truncate uppercase" title={f.name}>{f.name}</p>
                                <p className="text-[9px] text-gray-400 font-black mt-2 uppercase tracking-[0.4em]">{formatDateDisplay(f.uploadedAt)}</p>
                              </div>
                              <button onClick={() => handleDeleteFile(f.name)} className="text-gray-200 hover:text-red-500 p-3 bg-gray-50 rounded-2xl">
                                <Trash2 size={20} />
                              </button>
                            </div>
                            <div className="flex gap-4">
                              {isLinkable ? (
                                <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-4 px-10 py-5 bg-[#0f172a] text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                                  <Eye size={20} /> Open Document
                                </a>
                              ) : (
                                <div className="flex-1 text-center py-6 bg-emerald-50 text-emerald-700 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center justify-center gap-4">
                                  <RefreshCw size={16} className="animate-spin" /> Fetching Master URL...
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border-dashed border-4 border-amber-200 p-20 rounded-[3rem] text-center">
                      <AlertCircle className="mx-auto text-amber-500 mb-8" size={64} />
                      <p className="text-xs font-black text-amber-900 uppercase tracking-[0.4em]">No Soft Copy</p>
                    </div>
                  )}

                  <div className="mt-12">
                    <input 
                      type="file" 
                      disabled={isUploading}
                      onChange={(e) => handleFileUpload(selectedLetter.id, e)}
                      className="block w-full text-sm text-gray-500 file:mr-6 file:py-5 file:px-12 file:rounded-[1.75rem] file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-100"
                    />
                    {isUploading && (
                      <div className="mt-8 flex items-center justify-center gap-5 text-[10px] text-blue-600 font-black uppercase tracking-[0.4em] animate-pulse">
                        <Loader2 size={24} className="animate-spin" /> Synchronizing with Google Drive...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-12 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button onClick={() => { setSelectedLetter(null); setIsEditing(false); }} className="px-20 py-6 rounded-[2.5rem] font-black text-gray-500 hover:bg-gray-200 uppercase text-[12px] tracking-[0.4em]">Close Archive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LetterArchive;
