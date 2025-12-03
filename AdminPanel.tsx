
import React, { useEffect, useState } from 'react';
import { supabase, TABLES } from './supabaseClient';
import { X, Search, FileText, Calendar, MapPin, Phone, User, Activity, Download, FileJson, ZoomIn, DownloadCloud } from 'lucide-react';

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

interface AdminPanelProps {
  onClose: () => void;
  onImportTemplate: (template: Template) => void;
}

export const AdminPanel = ({ onClose, onImportTemplate }: AdminPanelProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

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
    setLoadingDetails(true);
    setTemplates([]);
    
    try {
      const { data, error } = await supabase
        .from(TABLES.TEMPLATES)
        .select('*')
        .eq('device_id', doc.device_id)
        .order('synced_at', { ascending: false });

      if (!error && data) {
        setTemplates(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
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
                    className="w-48 h-48 bg-gray-900 rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer group relative"
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
                       <div className="col-span-2 flex items-center gap-2 text-xs text-gray-500 font-mono">
                         ID: {selectedDoctor.device_id}
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Templates Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-300">
                    <FileText className="w-5 h-5" />
                    نسخه‌های ذخیره شده ({templates.length})
                  </h3>
                  {templates.length > 0 && (
                    <div className="flex gap-2">
                      <button 
                        onClick={downloadJSON}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        <FileJson className="w-4 h-4" /> دانلود JSON
                      </button>
                      <button 
                        onClick={downloadTXT}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        <Download className="w-4 h-4" /> دانلود Text
                      </button>
                    </div>
                  )}
                </div>
                
                {loadingDetails ? (
                  <div className="text-center py-10 text-gray-500">در حال بارگذاری نسخه‌ها...</div>
                ) : templates.length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500 border border-gray-700 border-dashed">
                    هیچ نسخه‌ای یافت نشد
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((tmpl) => (
                      <div key={tmpl.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-500 transition-colors relative group">
                        
                        {/* IMPORT BUTTON */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onImportTemplate(tmpl);
                          }}
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
                          {tmpl.items && tmpl.items.length > 3 && (
                            <div className="text-[10px] text-gray-500 text-center pt-1">
                              + {tmpl.items.length - 3} قلم دیگر
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
