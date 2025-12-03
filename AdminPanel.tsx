
import React, { useEffect, useState } from 'react';
import { supabase, TABLES } from './supabaseClient';
import { X, Search, FileText, Calendar, MapPin, Phone, User, Activity, Download, FileJson, ZoomIn, DownloadCloud, Users, History, Pill, ChevronLeft } from 'lucide-react';

interface Doctor {
  device_id: string;
  full_name: string;
  specialty: string;
  phone_number: string;
  address: string;
  header_image_url: string;
  last_sync_at: string;
}

interface Template {
  id: string;
  title: string;
  diagnosis: string;
  items: any[];
  synced_at: string;
}

interface PatientRecord {
  id: string;
  patient_id_local: string;
  full_name: string;
  age: number;
  gender: 'male' | 'female';
  weight: string;
  medical_history: string;
  allergies: string;
  updated_at: string;
}

interface PrescriptionRecord {
  id: string;
  diagnosis: string;
  date_epoch: number;
  vital_signs: any;
  items: any[];
  synced_at: string;
}

interface AdminPanelProps {
  onClose: () => void;
  onImportTemplate: (template: Template) => void;
}

export const AdminPanel = ({ onClose, onImportTemplate }: AdminPanelProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'templates' | 'patients'>('templates');

  // Templates State
  const [templates, setTemplates] = useState<Template[]>([]);
  
  // Patients State
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [patientHistory, setPatientHistory] = useState<PrescriptionRecord[]>([]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DOCTORS)
        .select('*')
        .order('last_sync_at', { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = async (doc: Doctor) => {
    setSelectedDoctor(doc);
    setSelectedPatient(null);
    setLoadingDetails(true);
    setTemplates([]);
    setPatients([]);
    setActiveTab('templates'); // Default tab
    
    // Fetch Templates (Initial Load)
    await loadTemplates(doc.device_id);
    setLoadingDetails(false);
  };

  const loadTemplates = async (deviceId: string) => {
    try {
      const { data } = await supabase
        .from(TABLES.TEMPLATES)
        .select('*')
        .eq('device_id', deviceId)
        .order('synced_at', { ascending: false });
      if (data) setTemplates(data);
    } catch (err) { console.error(err); }
  };

  const loadPatients = async (deviceId: string) => {
    try {
      setLoadingDetails(true);
      const { data } = await supabase
        .from(TABLES.PATIENTS)
        .select('*')
        .eq('device_id', deviceId)
        .order('updated_at', { ascending: false });
      if (data) setPatients(data);
    } catch (err) { console.error(err); }
    finally { setLoadingDetails(false); }
  };

  const handleTabChange = async (tab: 'templates' | 'patients') => {
    setActiveTab(tab);
    if (tab === 'patients' && patients.length === 0 && selectedDoctor) {
      await loadPatients(selectedDoctor.device_id);
    }
    if (tab === 'templates' && templates.length === 0 && selectedDoctor) {
      await loadTemplates(selectedDoctor.device_id);
    }
  };

  const handleSelectPatient = async (patient: PatientRecord) => {
    setSelectedPatient(patient);
    try {
      const { data } = await supabase
        .from(TABLES.PRESCRIPTIONS)
        .select('*')
        .eq('device_id', selectedDoctor?.device_id)
        .eq('patient_id_local', patient.patient_id_local)
        .order('date_epoch', { ascending: false });
      
      if (data) setPatientHistory(data);
    } catch (err) { console.error(err); }
  };

  const downloadJSON = () => {
    if (!templates.length || !selectedDoctor) return;
    const dataStr = JSON.stringify(templates, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Templates_${selectedDoctor.full_name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTXT = () => {
    if (!templates.length || !selectedDoctor) return;
    let txt = `DOCTOR: ${selectedDoctor.full_name}\nDEVICE ID: ${selectedDoctor.device_id}\nDATE: ${new Date().toLocaleString()}\n\n`;
    templates.forEach((t, i) => {
      txt += `====================================\n`;
      txt += `#${i + 1} TITLE: ${t.title}\n`;
      txt += `DIAGNOSIS: ${t.diagnosis}\n`;
      txt += `ITEMS:\n`;
      if (Array.isArray(t.items)) {
        t.items.forEach((item: any, j) => {
           txt += `  ${j + 1}. ${item.drugName} | ${item.dosage} | ${item.instruction}\n`;
        });
      }
      txt += `\n`;
    });
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Templates_${selectedDoctor.full_name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredPatients = patients.filter(p => p.full_name.toLowerCase().includes(patientSearch.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-gray-900 z-[100] flex flex-col text-gray-100 font-sans" dir="rtl">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center shadow-md">
        <h2 className="text-xl font-bold flex items-center gap-2 text-red-400">
          <Activity className="w-5 h-5" />
          پنل نظارت مخفی
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar List */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
             <div className="text-xs text-gray-400 mb-1">تعداد دستگاه‌های فعال</div>
             <div className="text-2xl font-bold">{doctors.length}</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">در حال دریافت...</div>
            ) : doctors.map(doc => (
              <div 
                key={doc.device_id}
                onClick={() => handleSelectDoctor(doc)}
                className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${selectedDoctor?.device_id === doc.device_id ? 'bg-gray-700 border-r-4 border-r-red-500' : ''}`}
              >
                <div className="font-bold text-white mb-1">{doc.full_name || 'نامشخص'}</div>
                <div className="text-xs text-gray-400 flex justify-between">
                  <span>{doc.specialty}</span>
                  <span>{new Date(doc.last_sync_at).toLocaleDateString('fa-IR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-900 p-6 overflow-y-auto">
          {selectedDoctor ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Doctor Info Card */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg relative">
                <div className="flex gap-6">
                  {/* Header Image Preview */}
                  <div 
                    className="w-32 h-32 bg-gray-900 rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer group relative"
                    onClick={() => selectedDoctor.header_image_url && setViewingImage(selectedDoctor.header_image_url)}
                  >
                    {selectedDoctor.header_image_url ? (
                      <>
                        <img src={selectedDoctor.header_image_url} alt="Header" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <ZoomIn className="w-8 h-8 text-white" />
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-600 text-xs">بدون سربرگ</span>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <h1 className="text-2xl font-bold text-white">{selectedDoctor.full_name}</h1>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                       <div className="flex items-center gap-2">
                         <User className="w-4 h-4 text-gray-500"/>
                         {selectedDoctor.specialty}
                       </div>
                       <div className="flex items-center gap-2">
                         <Phone className="w-4 h-4 text-gray-500"/>
                         {selectedDoctor.phone_number || '---'}
                       </div>
                       <div className="col-span-2 flex items-start gap-2">
                         <MapPin className="w-4 h-4 text-gray-500 mt-1"/>
                         {selectedDoctor.address || '---'}
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABS */}
              <div className="flex border-b border-gray-700 mb-6">
                 <button 
                   onClick={() => handleTabChange('templates')}
                   className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'templates' ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                 >
                    نسخه‌های آماده ({templates.length})
                 </button>
                 <button 
                   onClick={() => handleTabChange('patients')}
                   className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'patients' ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                 >
                    پرونده بیماران ({patients.length})
                 </button>
              </div>

              {/* TEMPLATES TAB CONTENT */}
              {activeTab === 'templates' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-gray-300">
                        <FileText className="w-5 h-5" />
                        لیست نسخه‌ها
                    </h3>
                    {templates.length > 0 && (
                        <div className="flex gap-2">
                        <button onClick={downloadJSON} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors">
                            <FileJson className="w-4 h-4" /> دانلود JSON
                        </button>
                        <button onClick={downloadTXT} className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition-colors">
                            <Download className="w-4 h-4" /> دانلود Text
                        </button>
                        </div>
                    )}
                    </div>
                    
                    {loadingDetails ? (
                    <div className="text-center py-10 text-gray-500">در حال دریافت...</div>
                    ) : templates.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500 border border-gray-700 border-dashed">
                        هیچ نسخه‌ای یافت نشد
                    </div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((tmpl) => (
                        <div key={tmpl.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-500 transition-colors relative group">
                            <button
                            onClick={(e) => { e.stopPropagation(); onImportTemplate(tmpl); }}
                            className="absolute top-4 left-4 p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-lg flex items-center gap-1 z-10"
                            title="افزودن به لیست من"
                            >
                            <DownloadCloud className="w-4 h-4" />
                            <span className="text-xs font-bold">افزودن</span>
                            </button>

                            <div className="flex justify-between items-start mb-3">
                            <div className="font-bold text-white max-w-[80%]">{tmpl.title}</div>
                            <div className="text-[10px] text-gray-500">{new Date(tmpl.synced_at).toLocaleDateString('fa-IR')}</div>
                            </div>
                            <div className="text-xs text-gray-400 mb-3 bg-gray-900/50 p-2 rounded">
                            {tmpl.diagnosis || 'بدون تشخیص'}
                            </div>
                            <div className="space-y-1">
                            {tmpl.items && Array.isArray(tmpl.items) && tmpl.items.slice(0, 3).map((item: any, idx: number) => (
                                <div key={idx} className="text-xs text-gray-300 flex justify-between border-b border-gray-700/50 pb-1 last:border-0">
                                <span>{item.drugName}</span>
                                <span className="text-gray-500">{item.dosage}</span>
                                </div>
                            ))}
                            </div>
                        </div>
                        ))}
                    </div>
                    )}
                </div>
              )}

              {/* PATIENTS TAB CONTENT */}
              {activeTab === 'patients' && (
                  <div>
                     {!selectedPatient ? (
                        <>
                           <div className="mb-4 relative">
                              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                              <input 
                                 type="text" 
                                 placeholder="جستجوی نام بیمار..."
                                 className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-4 pr-10 text-white focus:ring-2 focus:ring-red-500 outline-none"
                                 value={patientSearch}
                                 onChange={e => setPatientSearch(e.target.value)}
                              />
                           </div>
                           
                           {loadingDetails ? (
                              <div className="text-center py-10 text-gray-500">در حال دریافت...</div>
                           ) : filteredPatients.length === 0 ? (
                              <div className="text-center py-10 text-gray-500 bg-gray-800 rounded-xl border border-dashed border-gray-700">بیماری یافت نشد</div>
                           ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                 {filteredPatients.map(p => (
                                    <div 
                                       key={p.id} 
                                       onClick={() => handleSelectPatient(p)}
                                       className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:bg-gray-750 hover:border-gray-500 cursor-pointer transition-all flex justify-between items-center group"
                                    >
                                       <div>
                                          <div className="font-bold text-white mb-1">{p.full_name}</div>
                                          <div className="text-xs text-gray-400">
                                             {p.age} ساله | {p.gender === 'male' ? 'آقا' : 'خانم'}
                                          </div>
                                       </div>
                                       <History className="w-5 h-5 text-gray-600 group-hover:text-red-400 transition-colors" />
                                    </div>
                                 ))}
                              </div>
                           )}
                        </>
                     ) : (
                        // PATIENT TIMELINE VIEW
                        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                           <div className="p-4 border-b border-gray-700 bg-gray-850 flex items-center gap-4">
                              <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                                 <ChevronLeft className="w-6 h-6 text-gray-400" />
                              </button>
                              <div>
                                 <h3 className="font-bold text-lg text-white">{selectedPatient.full_name}</h3>
                                 <div className="text-xs text-gray-400 flex gap-3">
                                    <span>{selectedPatient.age} ساله</span>
                                    <span>وزن: {selectedPatient.weight} kg</span>
                                    {selectedPatient.medical_history && <span className="text-orange-400">سابقه دار</span>}
                                 </div>
                              </div>
                           </div>

                           <div className="p-6 space-y-8 relative">
                              {/* Timeline Line */}
                              <div className="absolute top-6 bottom-6 right-[29px] w-0.5 bg-gray-700"></div>

                              {patientHistory.length === 0 ? (
                                 <div className="text-center text-gray-500 py-10">هیچ سابقه ویزیت ثبت نشده است.</div>
                              ) : (
                                 patientHistory.map((rx, idx) => (
                                    <div key={rx.id} className="relative pr-10">
                                       {/* Timeline Dot */}
                                       <div className="absolute right-0 top-0 w-4 h-4 rounded-full bg-red-500 border-4 border-gray-800 shadow-sm z-10"></div>
                                       
                                       <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-gray-500 transition-colors">
                                          <div className="flex justify-between items-start mb-3">
                                             <div>
                                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                                   <Calendar className="w-3 h-3"/>
                                                   {new Date(rx.date_epoch).toLocaleDateString('fa-IR')}
                                                </div>
                                                <div className="font-bold text-white text-lg">تشخیص: {rx.diagnosis || '---'}</div>
                                             </div>
                                          </div>
                                          
                                          {/* Vitals */}
                                          {rx.vital_signs && (
                                             <div className="flex flex-wrap gap-2 mb-4">
                                                {Object.entries(rx.vital_signs).map(([k, v]) => v && (
                                                   <span key={k} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 border border-gray-700">
                                                      {k.toUpperCase()}: {String(v)}
                                                   </span>
                                                ))}
                                             </div>
                                          )}

                                          {/* Items */}
                                          <div className="space-y-2 bg-gray-800/50 p-3 rounded-lg">
                                             {rx.items && Array.isArray(rx.items) && rx.items.map((item: any, i) => (
                                                <div key={i} className="flex justify-between items-center text-sm border-b border-gray-700/50 last:border-0 pb-1 mb-1 last:mb-0 last:pb-0">
                                                   <div className="flex items-center gap-2 text-gray-200">
                                                      <span className="text-gray-500 font-mono w-4">{i+1}.</span>
                                                      <span>{item.drugName}</span>
                                                   </div>
                                                   <div className="text-gray-400 font-mono text-xs">{item.dosage}</div>
                                                </div>
                                             ))}
                                          </div>
                                       </div>
                                    </div>
                                 ))
                              )}
                           </div>
                        </div>
                     )}
                  </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
               <Search className="w-16 h-16 mb-4 opacity-20" />
               <p>یک پزشک را از لیست انتخاب کنید</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center p-4">
           <div className="absolute top-4 right-4 flex gap-4">
             <a 
               href={viewingImage} 
               download={`Header_${selectedDoctor?.device_id}.png`} 
               target="_blank"
               rel="noopener noreferrer"
               className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
               title="دانلود تصویر"
             >
                <Download className="w-6 h-6" />
             </a>
             <button onClick={() => setViewingImage(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                <X className="w-6 h-6" />
             </button>
           </div>
           <img src={viewingImage} alt="Full Size Header" className="max-w-full max-h-[90vh] object-contain" />
        </div>
      )}
    </div>
  );
};
