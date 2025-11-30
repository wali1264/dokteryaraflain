
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Stethoscope, 
  LayoutDashboard, 
  Settings, 
  Plus, 
  Search, 
  User, 
  Activity, 
  AlertCircle, 
  Save, 
  X,
  Edit2,
  Trash2,
  Pill,
  FileText,
  UserCog,
  PlusCircle,
  MinusCircle,
  Printer,
  ChevronDown,
  History,
  Download,
  Upload,
  Calendar,
  Clock,
  Database,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle,
  UserPlus
} from 'lucide-react';
import { dbParams, backupSystem } from './db';
import { Patient, Drug, PrescriptionTemplate, DoctorProfile, PrescriptionItem, VitalSigns, Prescription } from './types';

// --- SHARED COMPONENTS ---

// 0. Prescription Paper (Reusable UI for both Preview and Print)
const PrescriptionPaper = ({ 
  data 
}: { 
  data: { 
    doctor: DoctorProfile, 
    patient: Patient, 
    prescription: Prescription 
  } 
}) => {
  const { doctor, patient, prescription } = data;

  return (
    <div className="w-full h-full bg-white text-black p-8 relative flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex gap-4 items-center">
           <div className="text-right">
            <h1 className="text-2xl font-bold mb-1">{doctor.fullName}</h1>
            <p className="text-sm text-gray-600 font-bold">{doctor.specialty}</p>
            <p className="text-sm text-gray-600 mt-1">نظام پزشکی: {doctor.medicalCouncilNumber}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
           {doctor.logo && (
             <img src={doctor.logo} alt="Logo" className="h-20 object-contain mb-2" />
           )}
           <div className="text-left text-xs text-gray-600">
            <p className="mb-1">{doctor.address}</p>
            <p style={{direction: 'ltr'}}>{doctor.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6 text-sm print:bg-transparent print:border-gray-300">
        <div className="flex gap-6">
          <span className="font-bold text-lg">نام بیمار: {patient.fullName}</span>
          <span className="pt-1">سن: {patient.age}</span>
          {prescription.vitalSigns.weight && <span className="pt-1">وزن: {prescription.vitalSigns.weight} kg</span>}
        </div>
        <div className="flex gap-2 items-center">
          <span className="font-bold">تاریخ:</span>
          <span className="font-mono text-lg">{new Date(prescription.date).toLocaleDateString('fa-IR')}</span>
        </div>
      </div>

      {/* Vitals & Diagnosis */}
      <div className="mb-6 grid grid-cols-4 gap-4 text-sm text-gray-600 border-b border-gray-100 pb-4">
         {prescription.vitalSigns.bp && <div><span className="font-bold text-xs text-gray-400 ml-1">BP:</span>{prescription.vitalSigns.bp}</div>}
         {prescription.vitalSigns.pr && <div><span className="font-bold text-xs text-gray-400 ml-1">PR:</span>{prescription.vitalSigns.pr}</div>}
         {prescription.vitalSigns.temp && <div><span className="font-bold text-xs text-gray-400 ml-1">Temp:</span>{prescription.vitalSigns.temp}</div>}
         {prescription.diagnosis && <div className="col-span-4 mt-2 font-bold text-gray-900 text-base">Dx: {prescription.diagnosis}</div>}
      </div>

      {/* Rx Items */}
      <div className="mb-12 flex-1">
        <h3 className="font-bold text-3xl mb-6 text-gray-800 font-serif italic">Rx</h3>
        <ul className="space-y-6">
          {prescription.items.map((item, idx) => (
            <li key={item.id} className="flex justify-between items-baseline border-b border-dashed border-gray-200 pb-3 last:border-0">
              <div className="flex items-baseline gap-3">
                <span className="font-bold text-gray-400 w-6 text-sm">{idx + 1}.</span>
                <div>
                   <span className="font-bold text-xl">{item.drugName}</span>
                   {item.instruction && <div className="text-sm text-gray-600 mt-1 mr-4 font-medium">{item.instruction}</div>}
                </div>
              </div>
              <span className="font-mono text-xl font-bold">{item.dosage}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer / Signature */}
      <div className="mt-auto pt-10 flex justify-between items-end">
         <div className="text-[10px] text-gray-300">
            Powered by TabYar
         </div>
         <div className="text-center w-48">
            <div className="h-24 border-b border-gray-400 mb-2"></div>
            <span className="text-sm font-bold text-gray-600">مهر و امضاء پزشک</span>
         </div>
      </div>
    </div>
  );
};

// 0.1 Print Container (Hidden in UI, Visible in Print)
const PrintContainer = ({ 
  data 
}: { 
  data: { 
    doctor: DoctorProfile, 
    patient: Patient, 
    prescription: Prescription 
  } | null 
}) => {
  if (!data) return null;
  
  return (
    <div id="print-container">
      <PrescriptionPaper data={data} />
    </div>
  );
};

// 0.2 Print Preview Modal
const PrintPreviewModal = ({
  data,
  isOpen,
  onClose,
  onConfirmPrint
}: {
  data: { doctor: DoctorProfile, patient: Patient, prescription: Prescription } | null,
  isOpen: boolean,
  onClose: () => void,
  onConfirmPrint: () => void
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden no-print">
      <div className="bg-gray-100 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Printer className="w-5 h-5 text-medical-700" />
            پیش‌نمایش چاپ
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Preview Area (Simulates Paper) */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-200">
          <div className="w-[148mm] min-h-[210mm] bg-white shadow-xl transition-transform origin-top scale-100 md:scale-105">
             <PrescriptionPaper data={data} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center">
           <span className="text-sm text-gray-500 hidden md:block">
             * اندازه کاغذ پیش‌فرض: A5
           </span>
           <div className="flex gap-3 w-full md:w-auto">
             <button 
               onClick={onClose}
               className="flex-1 md:flex-none px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
             >
               بازگشت به ویرایش
             </button>
             <button 
               onClick={onConfirmPrint}
               className="flex-1 md:flex-none px-8 py-3 bg-medical-700 text-white font-bold rounded-xl hover:bg-medical-900 shadow-lg shadow-medical-500/30 flex items-center justify-center gap-2 transition-all transform hover:scale-105"
             >
               <Printer className="w-5 h-5" />
               تایید و چاپ نهایی
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// 1. Navigation
const Navigation = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => {
  const navItems = [
    { id: 'dashboard', label: 'میز کار', icon: LayoutDashboard }, 
    { id: 'patients', label: 'بیماران', icon: Users },
    { id: 'templates', label: 'نسخه‌های آماده', icon: FileText }, 
    { id: 'drugs', label: 'بانک دارویی', icon: Pill }, 
    { id: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-l border-gray-200 h-full fixed right-0 top-0 z-20 shadow-lg no-print">
        <div className="p-6 flex items-center justify-center border-b border-gray-100">
          <div className="bg-medical-100 p-2 rounded-full">
            <Stethoscope className="w-8 h-8 text-medical-700" />
          </div>
          <span className="mr-3 text-xl font-bold text-gray-800">طب‌یار</span>
        </div>
        <div className="flex-1 py-6 space-y-2 px-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-medical-50 text-medical-700 font-bold shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <item.icon className="w-5 h-5 ml-3" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-400">
          نسخه ۱.۶.۱
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-30 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] no-print">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center p-1 ${
              activeTab === item.id ? 'text-medical-700' : 'text-gray-400'
            }`}
          >
            <item.icon className={`w-6 h-6 mb-1 ${activeTab === item.id ? 'fill-current opacity-20' : ''}`} />
            <span className="text-[9px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

// 1.5 History Modal
const PatientHistoryModal = ({ 
  patient, 
  isOpen, 
  onClose 
}: { 
  patient: Patient | null, 
  isOpen: boolean, 
  onClose: () => void 
}) => {
  const [history, setHistory] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patient && isOpen) {
      setLoading(true);
      dbParams.getPatientPrescriptions(patient.id).then(data => {
        data.sort((a, b) => b.date - a.date);
        setHistory(data);
        setLoading(false);
      });
    }
  }, [patient, isOpen]);

  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <History className="w-5 h-5 text-medical-700" />
            سوابق بیمار: {patient.fullName}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
             <div className="text-center py-10">در حال بارگذاری...</div>
          ) : history.length === 0 ? (
             <div className="text-center py-10 text-gray-400">هیچ سابقه‌ای یافت نشد.</div>
          ) : (
            <div className="space-y-6">
               {history.map((record) => (
                 <div key={record.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative">
                    <div className="absolute left-4 top-4 text-xs text-gray-400 flex items-center gap-1">
                       <Calendar className="w-3 h-3" />
                       {new Date(record.date).toLocaleDateString('fa-IR')}
                       <Clock className="w-3 h-3 mr-2" />
                       {new Date(record.date).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}
                    </div>

                    <h4 className="font-bold text-gray-800 mb-2">تشخیص: {record.diagnosis || '---'}</h4>
                    
                    <div className="flex gap-4 text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg inline-flex">
                       {record.vitalSigns.bp && <span>BP: {record.vitalSigns.bp}</span>}
                       {record.vitalSigns.weight && <span>وزن: {record.vitalSigns.weight}</span>}
                       {record.vitalSigns.temp && <span>دما: {record.vitalSigns.temp}</span>}
                    </div>

                    <div className="space-y-1">
                      {record.items.map((item, idx) => (
                        <div key={idx} className="text-sm flex justify-between border-b border-gray-50 pb-1 last:border-0">
                          <span className="font-medium text-gray-700">{idx + 1}. {item.drugName}</span>
                          <span className="text-gray-500 font-mono">{item.dosage}</span>
                        </div>
                      ))}
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. Patient Modal
const PatientModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (p: Patient) => void;
  initialData?: Patient | null;
}) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    fullName: '',
    age: '' as any,
    gender: 'male',
    weight: '' as any,
    medicalHistory: '',
    allergies: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        fullName: '',
        age: '' as any,
        gender: 'male',
        weight: '' as any,
        medicalHistory: '',
        allergies: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) return;

    const patient: Patient = {
      id: initialData?.id || crypto.randomUUID(),
      fullName: formData.fullName!,
      age: Number(formData.age),
      gender: formData.gender as 'male' | 'female',
      weight: Number(formData.weight),
      medicalHistory: formData.medicalHistory || '',
      allergies: formData.allergies || '',
      createdAt: initialData?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    onSave(patient);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-cream-50 rounded-t-2xl">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5 text-medical-700" />
            {initialData ? 'ویرایش پرونده بیمار' : 'ثبت بیمار جدید'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی</label>
            <input
              type="text"
              required
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 focus:border-transparent outline-none transition-all"
              placeholder="مثال: علی رضایی"
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سن (سال)</label>
              <input
                type="number"
                required
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none"
                value={formData.age}
                onChange={e => setFormData({...formData, age: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">جنسیت</label>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.gender === 'male' ? 'bg-white text-medical-700 shadow-sm' : 'text-gray-500'}`}
                  onClick={() => setFormData({...formData, gender: 'male'})}
                >
                  آقا
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.gender === 'female' ? 'bg-white text-medical-700 shadow-sm' : 'text-gray-500'}`}
                  onClick={() => setFormData({...formData, gender: 'female'})}
                >
                  خانم
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وزن (کیلوگرم)</label>
            <input
              type="number"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none"
              value={formData.weight}
              onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Activity className="w-4 h-4 text-orange-500" />
              سابقه بیماری
            </label>
            <textarea
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none h-20 resize-none"
              placeholder="دیابت، فشار خون و..."
              value={formData.medicalHistory}
              onChange={e => setFormData({...formData, medicalHistory: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              حساسیت‌ها و آلرژی
            </label>
            <textarea
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none h-20 resize-none"
              placeholder="پنی‌سیلین، آسپرین..."
              value={formData.allergies}
              onChange={e => setFormData({...formData, allergies: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-medical-700 text-white p-3 rounded-xl font-bold hover:bg-medical-900 transition-colors shadow-lg shadow-medical-500/30 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              ذخیره پرونده
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. Patients View
const PatientsView = ({ 
  onEdit, 
  onSelect, 
  onHistory 
}: { 
  onEdit: (p: Patient) => void, 
  onSelect?: (p: Patient) => void,
  onHistory: (p: Patient) => void
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    const data = await dbParams.getAllPatients();
    data.sort((a, b) => b.updatedAt - a.updatedAt);
    setPatients(data);
    setLoading(false);
  };

  const filteredPatients = patients.filter(p => 
    p.fullName.includes(search) || 
    p.phoneNumber?.includes(search)
  );

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت بیماران</h1>
          <p className="text-gray-500 text-sm mt-1">لیست تمام پرونده‌های تشکیل شده</p>
        </div>
        
        <div className="w-full md:w-auto relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="جستجوی نام بیمار..."
            className="w-full md:w-80 pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-700"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">هیچ بیماری یافت نشد</p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div 
                key={patient.id} 
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative cursor-pointer"
                onClick={() => onSelect && onSelect(patient)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      patient.gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                    }`}>
                      {patient.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{patient.fullName}</h3>
                      <p className="text-xs text-gray-500">{patient.age} ساله | {patient.weight} کیلوگرم</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onHistory(patient);
                      }}
                      className="p-2 text-gray-400 hover:text-medical-700 hover:bg-medical-50 rounded-lg transition-colors"
                      title="سوابق بیمار"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(patient);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="ویرایش"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {(patient.medicalHistory || patient.allergies) && (
                  <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
                    {patient.medicalHistory && (
                      <span className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] rounded-md border border-orange-100">
                         سابقه دار
                      </span>
                    )}
                    {patient.allergies && (
                      <span className="px-2 py-1 bg-red-50 text-red-700 text-[10px] rounded-md border border-red-100">
                         حساسیت
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// 2.1 Doctor Profile Settings
const DoctorProfileSettings = () => {
  const [profile, setProfile] = useState<DoctorProfile>({
    id: 'profile',
    fullName: '',
    specialty: '',
    medicalCouncilNumber: '',
    address: '',
    phoneNumber: '',
    logo: ''
  });
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dbParams.getDoctorProfile().then(p => {
      if (p) setProfile(p);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbParams.saveDoctorProfile(profile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // Limit to ~500KB
        alert('حجم لوگو باید کمتر از ۵۰۰ کیلوبایت باشد.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <UserCog className="w-6 h-6 text-medical-700" />
        <h2 className="text-lg font-bold text-gray-800">اطلاعات پزشک</h2>
      </div>
      
      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        {/* Logo Section */}
        <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
           <div className="w-24 h-24 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden relative group">
             {profile.logo ? (
               <img src={profile.logo} alt="Logo" className="w-full h-full object-contain" />
             ) : (
               <ImageIcon className="w-8 h-8 text-gray-300" />
             )}
             <button 
               type="button"
               onClick={() => setProfile({...profile, logo: ''})}
               className={`absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${!profile.logo && 'hidden'}`}
             >
               <Trash2 className="w-5 h-5" />
             </button>
           </div>
           <div>
             <h3 className="font-bold text-gray-700 text-sm mb-1">لوگوی سربرگ</h3>
             <p className="text-xs text-gray-500 mb-3">فرمت PNG یا JPG (حداکثر ۵۰۰ کیلوبایت)</p>
             <input 
               type="file" 
               accept="image/*" 
               className="hidden" 
               ref={fileInputRef}
               onChange={handleLogoUpload}
             />
             <button 
               type="button" 
               onClick={() => fileInputRef.current?.click()}
               className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
             >
               انتخاب تصویر
             </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی پزشک</label>
            <input 
              required
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none"
              value={profile.fullName}
              onChange={e => setProfile({...profile, fullName: e.target.value})}
              placeholder="دکتر..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تخصص</label>
            <input 
              required
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none"
              value={profile.specialty}
              onChange={e => setProfile({...profile, specialty: e.target.value})}
              placeholder="مثال: متخصص اطفال"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">شماره نظام پزشکی</label>
          <input 
            required
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none"
            value={profile.medicalCouncilNumber}
            onChange={e => setProfile({...profile, medicalCouncilNumber: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">آدرس مطب (جهت چاپ در سربرگ)</label>
          <textarea 
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none resize-none h-20"
            value={profile.address}
            onChange={e => setProfile({...profile, address: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">شماره تماس مطب</label>
          <input 
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none text-left"
            style={{direction: 'ltr'}}
            value={profile.phoneNumber}
            onChange={e => setProfile({...profile, phoneNumber: e.target.value})}
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            className="bg-medical-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-medical-900 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaved ? 'ذخیره شد' : 'ذخیره تنظیمات'}
          </button>
        </div>
      </form>
    </div>
  );
};

// 2.2 Drugs Manager
const DrugsManager = () => {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [search, setSearch] = useState('');
  const [editingDrug, setEditingDrug] = useState<Partial<Drug> | null>(null);

  useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = async () => {
    const data = await dbParams.getAllDrugs();
    setDrugs(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrug?.name) return;

    const drug: Drug = {
      id: editingDrug.id || crypto.randomUUID(),
      name: editingDrug.name,
      defaultInstruction: editingDrug.defaultInstruction
    };
    await dbParams.addDrug(drug);
    setEditingDrug(null);
    loadDrugs();
  };

  const handleDelete = async (id: string) => {
    if (confirm('آیا از حذف این دارو اطمینان دارید؟')) {
      await dbParams.deleteDrug(id);
      loadDrugs();
    }
  };

  const filtered = drugs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">بانک دارویی</h1>
          <p className="text-gray-500 text-sm mt-1">مدیریت لیست داروهای پرکاربرد</p>
        </div>
        <button 
          onClick={() => setEditingDrug({ name: '', defaultInstruction: '' })}
          className="bg-medical-700 text-white hover:bg-medical-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-medical-500/30"
        >
          <PlusCircle className="w-5 h-5" />
          افزودن دارو
        </button>
      </div>

      <div className="mb-6 relative max-w-lg">
         <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
         <input 
           className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none shadow-sm"
           placeholder="جستجوی نام دارو..."
           value={search}
           onChange={e => setSearch(e.target.value)}
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(drug => (
          <div key={drug.id} className="flex justify-between items-start p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all">
             <div>
               <div className="font-bold text-gray-800">{drug.name}</div>
               {drug.defaultInstruction ? (
                  <div className="text-sm text-gray-500 mt-1">{drug.defaultInstruction}</div>
               ) : (
                  <div className="text-xs text-gray-300 mt-1 italic">بدون دستور</div>
               )}
             </div>
             <div className="flex gap-1">
               <button onClick={() => setEditingDrug(drug)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                 <Edit2 className="w-4 h-4" />
               </button>
               <button onClick={() => handleDelete(drug.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                 <Trash2 className="w-4 h-4" />
               </button>
             </div>
          </div>
        ))}
        {filtered.length === 0 && (
           <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
             <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500">دارویی یافت نشد.</p>
           </div>
        )}
      </div>

      {/* Mini Modal for Drug Add/Edit */}
      {editingDrug && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-800">{editingDrug.id ? 'ویرایش دارو' : 'افزودن دارو جدید'}</h3>
                <button type="button" onClick={() => setEditingDrug(null)}><X className="w-5 h-5 text-gray-500"/></button>
             </div>
             
             <label className="block text-sm font-medium text-gray-700 mb-1">نام دارو</label>
             <input 
               autoFocus
               className="w-full p-3 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-medical-500 outline-none"
               placeholder="مثال: Amoxicillin 500"
               value={editingDrug.name}
               onChange={e => setEditingDrug({...editingDrug, name: e.target.value})}
               required
             />
             
             <label className="block text-sm font-medium text-gray-700 mb-1">دستور مصرف پیش‌فرض (اختیاری)</label>
             <input 
               className="w-full p-3 border border-gray-200 rounded-xl mb-6 focus:ring-2 focus:ring-medical-500 outline-none"
               placeholder="مثال: هر ۸ ساعت یک عدد"
               value={editingDrug.defaultInstruction}
               onChange={e => setEditingDrug({...editingDrug, defaultInstruction: e.target.value})}
             />
             
             <button type="submit" className="w-full py-3 bg-medical-700 text-white rounded-xl font-bold hover:bg-medical-900 transition-colors">ذخیره</button>
          </form>
        </div>
      )}
    </div>
  );
};

// 2.3 Templates Manager
const TemplatesManager = () => {
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<PrescriptionTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await dbParams.getAllTemplates();
    setTemplates(data);
  };

  const handleDelete = async (id: string) => {
    if (confirm('حذف شود؟')) {
      await dbParams.deleteTemplate(id);
      loadTemplates();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editingTemplate.title) return;
    await dbParams.addTemplate(editingTemplate);
    setEditingTemplate(null);
    loadTemplates();
  };

  const addRow = () => {
    if (!editingTemplate) return;
    const newItem: PrescriptionItem = { id: crypto.randomUUID(), drugName: '', dosage: '', instruction: '' };
    setEditingTemplate({ ...editingTemplate, items: [...editingTemplate.items, newItem] });
  };

  const removeRow = (itemId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({ ...editingTemplate, items: editingTemplate.items.filter(i => i.id !== itemId) });
  };

  const updateRow = (itemId: string, field: keyof PrescriptionItem, value: string) => {
    if (!editingTemplate) return;
    const newItems = editingTemplate.items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    setEditingTemplate({ ...editingTemplate, items: newItems });
  };

  if (editingTemplate) {
    return (
      <div className="p-4 md:p-8 h-screen md:h-auto flex flex-col max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
             <h3 className="font-bold text-lg">{editingTemplate.id ? 'ویرایش نسخه آماده' : 'نسخه آماده جدید'}</h3>
             <button onClick={() => setEditingTemplate(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
          </div>
          <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
               <input 
                 required
                 className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none"
                 placeholder="عنوان نسخه (مثال: سرماخوردگی)"
                 value={editingTemplate.title}
                 onChange={e => setEditingTemplate({...editingTemplate, title: e.target.value})}
               />
               <input 
                 className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none"
                 placeholder="تشخیص پیش‌فرض (Diagnosis)"
                 value={editingTemplate.diagnosis}
                 onChange={e => setEditingTemplate({...editingTemplate, diagnosis: e.target.value})}
               />
             </div>

             <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-2 border border-gray-100 mb-4">
               <table className="w-full text-sm">
                 <thead className="text-gray-500 border-b border-gray-200">
                   <tr>
                     <th className="pb-2 text-right font-normal">نام دارو</th>
                     <th className="pb-2 text-right font-normal w-24">دوز</th>
                     <th className="pb-2 text-right font-normal">دستور مصرف</th>
                     <th className="w-8"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {editingTemplate.items.map(item => (
                     <tr key={item.id} className="group">
                       <td className="p-2">
                         <input 
                           className="w-full bg-transparent outline-none placeholder-gray-400" 
                           placeholder="نام دارو..."
                           value={item.drugName}
                           onChange={e => updateRow(item.id, 'drugName', e.target.value)}
                           list="drug-suggestions"
                         />
                       </td>
                       <td className="p-2">
                         <input 
                           className="w-full bg-transparent outline-none placeholder-gray-400" 
                           placeholder="دوز"
                           value={item.dosage}
                           onChange={e => updateRow(item.id, 'dosage', e.target.value)}
                         />
                       </td>
                       <td className="p-2">
                         <input 
                           className="w-full bg-transparent outline-none placeholder-gray-400" 
                           placeholder="دستور..."
                           value={item.instruction}
                           onChange={e => updateRow(item.id, 'instruction', e.target.value)}
                         />
                       </td>
                       <td className="p-2 text-center">
                         <button type="button" onClick={() => removeRow(item.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100">
                           <MinusCircle className="w-4 h-4"/>
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               <button type="button" onClick={addRow} className="mt-4 w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm hover:bg-gray-100 flex items-center justify-center gap-2">
                 <PlusCircle className="w-4 h-4"/> افزودن قلم دارو
               </button>
             </div>
             
             <button type="submit" className="w-full bg-medical-700 text-white py-3 rounded-xl font-bold">ذخیره نسخه آماده</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">
       <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">نسخه‌های آماده</h1>
          <p className="text-gray-500 text-sm mt-1">مدیریت پکیج‌های درمانی برای تجویز سریع</p>
        </div>
        <button 
          onClick={() => setEditingTemplate({ id: crypto.randomUUID(), title: '', diagnosis: '', items: [] })}
          className="bg-medical-700 text-white hover:bg-medical-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-medical-500/30"
        >
          <PlusCircle className="w-5 h-5" />
          نسخه جدید
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(tmpl => (
           <div key={tmpl.id} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all group relative cursor-pointer" onClick={() => setEditingTemplate(tmpl)}>
             <div className="flex justify-between items-start">
               <div>
                 <h3 className="font-bold text-gray-800 text-lg mb-1">{tmpl.title}</h3>
                 <p className="text-sm text-gray-500 flex items-center gap-1">
                   {tmpl.diagnosis ? (
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{tmpl.diagnosis}</span>
                   ) : (
                      <span className="italic text-gray-300 text-xs">بدون تشخیص پیش‌فرض</span>
                   )}
                 </p>
               </div>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 left-4">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(tmpl.id); }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4"/></button>
               </div>
             </div>
             <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-400">تعداد اقلام:</span>
                <span className="text-sm font-bold text-medical-700 bg-medical-50 px-2 py-1 rounded-md">
                   {tmpl.items.length} دارو
                </span>
             </div>
           </div>
        ))}
        {templates.length === 0 && (
           <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
             <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500">هیچ الگویی تعریف نشده است.</p>
           </div>
        )}
      </div>
    </div>
  );
};

// 2.4 Backup Manager
const BackupManager = () => {
  const handleBackup = async () => {
    await backupSystem.exportData();
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (confirm('هشدار مهم: با بازگردانی نسخه پشتیبان، تمام اطلاعات فعلی جایگزین خواهند شد و اطلاعات جدید حذف می‌شوند. آیا مطمئن هستید؟')) {
       const reader = new FileReader();
       reader.onload = async (ev) => {
         const json = ev.target?.result as string;
         try {
           await backupSystem.importData(json);
           alert('اطلاعات با موفقیت بازیابی شد. صفحه مجددا بارگذاری می‌شود.');
           window.location.reload();
         } catch (err) {
           alert('خطا در بازیابی اطلاعات.');
           console.error(err);
         }
       };
       reader.readAsText(file);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <Database className="w-6 h-6 text-medical-700" />
        <h2 className="text-lg font-bold text-gray-800">مدیریت داده‌ها و پشتیبان‌گیری</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export */}
        <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50">
           <div className="flex items-center gap-3 mb-4 text-blue-800">
             <div className="bg-blue-100 p-3 rounded-full">
               <Download className="w-6 h-6" />
             </div>
             <h3 className="font-bold">تهیه نسخه پشتیبان</h3>
           </div>
           <p className="text-sm text-gray-600 mb-6 leading-relaxed">
             با کلیک روی دکمه زیر، یک فایل حاوی تمام اطلاعات بیماران، داروها، نسخه‌ها و تنظیمات دانلود می‌شود. پیشنهاد می‌شود به صورت هفتگی این کار را انجام دهید.
           </p>
           <button 
             onClick={handleBackup}
             className="w-full py-4 bg-white border border-blue-200 text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
           >
             دانلود فایل پشتیبان
           </button>
        </div>

        {/* Import */}
        <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50">
           <div className="flex items-center gap-3 mb-4 text-orange-800">
             <div className="bg-orange-100 p-3 rounded-full">
               <Upload className="w-6 h-6" />
             </div>
             <h3 className="font-bold">بازیابی اطلاعات</h3>
           </div>
           <p className="text-sm text-gray-600 mb-6 leading-relaxed">
             اگر قبلاً فایل پشتیبان تهیه کرده‌اید، می‌توانید آن را اینجا بارگذاری کنید. توجه کنید که اطلاعات فعلی پاک شده و با فایل جدید جایگزین می‌شود.
           </p>
           <label className="w-full py-4 bg-white border border-orange-200 text-orange-700 font-bold rounded-xl hover:bg-orange-50 transition-colors shadow-sm block text-center cursor-pointer">
             انتخاب و بازیابی فایل
             <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
           </label>
        </div>
      </div>
    </div>
  );
};


// 4. Settings View Container
const SettingsView = () => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'backup'>('profile');

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 h-screen md:h-auto flex flex-col">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">تنظیمات و مدیریت</h1>
      
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        <button 
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${activeSubTab === 'profile' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          <UserCog className="w-4 h-4"/>
          اطلاعات مطب
        </button>
        <button 
          onClick={() => setActiveSubTab('backup')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${activeSubTab === 'backup' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          <RefreshCw className="w-4 h-4"/>
          مدیریت داده‌ها
        </button>
      </div>

      <div className="flex-1 md:min-h-[500px]">
        {activeSubTab === 'profile' && <DoctorProfileSettings />}
        {activeSubTab === 'backup' && <BackupManager />}
      </div>
    </div>
  );
};

// --- PHASE 3 COMPONENTS ---

// 3.1 Workbench/Dashboard
const Workbench = ({ 
  onSelectPatient,
  activePatient,
  onCloseVisit,
  onPrint,
  onAddPatient
}: { 
  onSelectPatient: (p: Patient) => void,
  activePatient: Patient | null,
  onCloseVisit: () => void,
  onPrint: (data: { patient: Patient, prescription: Prescription }) => void,
  onAddPatient: () => void
}) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  
  // Visit State
  const [diagnosis, setDiagnosis] = useState('');
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({});
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [drugs, setDrugs] = useState<Drug[]>([]);

  // Search Logic
  useEffect(() => {
    if (search.length > 1) {
      dbParams.getAllPatients().then(all => {
        const filtered = all.filter(p => p.fullName.includes(search));
        setResults(filtered);
      });
    } else {
      setResults([]);
    }
  }, [search]);

  // Load Data on Mount
  useEffect(() => {
    dbParams.getAllTemplates().then(setTemplates);
    dbParams.getAllDrugs().then(setDrugs);
  }, []);

  // Initialize Visit when patient changes
  useEffect(() => {
    if (activePatient) {
      setVitalSigns({ weight: activePatient.weight.toString() });
      setItems([]);
      setDiagnosis('');
    }
  }, [activePatient]);

  const handleApplyTemplate = (tmpl: PrescriptionTemplate) => {
    setDiagnosis(prev => prev ? `${prev} - ${tmpl.diagnosis}` : tmpl.diagnosis);
    // Add new IDs to items to avoid key conflicts
    const newItems = tmpl.items.map(i => ({...i, id: crypto.randomUUID()}));
    setItems(prev => [...prev, ...newItems]);
    setShowTemplates(false);
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), drugName: '', dosage: '', instruction: '' }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof PrescriptionItem, value: string) => {
    const newItems = items.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: value };
        // Auto-fill instruction if drug selected from DB
        if (field === 'drugName') {
           const foundDrug = drugs.find(d => d.name === value);
           if (foundDrug && foundDrug.defaultInstruction && !i.instruction) {
             updated.instruction = foundDrug.defaultInstruction;
           }
        }
        return updated;
      }
      return i;
    });
    setItems(newItems);
  };

  const handleSave = async (print: boolean) => {
    if (!activePatient) return;

    // 1. Update Patient Weight if changed
    if (vitalSigns.weight && Number(vitalSigns.weight) !== activePatient.weight) {
      await dbParams.updatePatient({
        ...activePatient,
        weight: Number(vitalSigns.weight),
        updatedAt: Date.now()
      });
    }

    // 2. Save Prescription
    const prescription: Prescription = {
      id: crypto.randomUUID(),
      patientId: activePatient.id,
      patientName: activePatient.fullName,
      date: Date.now(),
      diagnosis,
      vitalSigns,
      items
    };

    await dbParams.addPrescription(prescription);

    if (print) {
      onPrint({ patient: activePatient, prescription });
    } else {
      alert('نسخه ذخیره شد.');
      onCloseVisit();
    }
  };

  if (!activePatient) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] max-w-2xl mx-auto px-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 w-full text-center">
          <Stethoscope className="w-20 h-20 text-medical-500 mx-auto mb-6 bg-medical-50 p-4 rounded-full" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">خوش آمدید، دکتر</h2>
          <p className="text-gray-500 mb-8">برای شروع ویزیت، نام بیمار را جستجو کنید</p>
          
          <div className="flex gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input 
                autoFocus
                className="w-full p-4 pl-12 pr-12 text-lg border border-gray-200 rounded-2xl focus:ring-4 focus:ring-medical-100 focus:border-medical-500 outline-none transition-all shadow-inner"
                placeholder="جستجوی نام بیمار..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white mt-2 rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 max-h-60 overflow-y-auto">
                  {results.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => onSelectPatient(p)}
                      className="w-full text-right p-4 hover:bg-medical-50 border-b border-gray-50 last:border-0 transition-colors flex justify-between"
                    >
                      <span className="font-bold text-gray-800">{p.fullName}</span>
                      <span className="text-sm text-gray-500">{p.age} ساله</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              onClick={onAddPatient}
              className="bg-medical-700 hover:bg-medical-900 text-white p-4 rounded-2xl transition-colors shadow-lg shadow-medical-500/30 flex items-center justify-center min-w-[60px]"
              title="ثبت بیمار جدید"
            >
              <UserPlus className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Visit UI
  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-gray-50">
      {/* Left Panel: Prescription Writer */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={onCloseVisit} className="p-2 hover:bg-gray-100 rounded-full">
               <X className="w-6 h-6 text-gray-500" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{activePatient.fullName}</h2>
              <div className="flex gap-3 text-sm text-gray-500">
                <span>{activePatient.age} ساله</span>
                <span>•</span>
                <span>وزن: {activePatient.weight} kg</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-2 px-4 py-2 bg-cream-200 text-gray-700 rounded-xl font-medium hover:bg-cream-300 transition-colors"
              >
                <FileText className="w-4 h-4" />
                نسخه‌های آماده
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showTemplates && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2">
                  {templates.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 p-2">الگویی یافت نشد</p>
                  ) : (
                    templates.map(t => (
                      <button 
                        key={t.id}
                        onClick={() => handleApplyTemplate(t)}
                        className="w-full text-right p-3 hover:bg-medical-50 rounded-lg text-sm text-gray-700 transition-colors"
                      >
                        <div className="font-bold">{t.title}</div>
                        <div className="text-xs text-gray-400 truncate">{t.diagnosis}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          
          {/* Clinical Notes & Vitals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <label className="text-sm font-bold text-gray-700 mb-2 block">تشخیص (Diagnosis)</label>
                <input 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none"
                  placeholder="مثال: Acute Bronchitis"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                />
              </div>

              {/* Prescription Items */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-medical-700" />
                    اقلام دارویی
                  </h3>
                  <button onClick={addItem} className="text-sm text-medical-700 font-bold hover:underline flex items-center gap-1">
                    <Plus className="w-4 h-4" /> افزودن
                  </button>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <div key={item.id} className="p-3 flex gap-2 items-start bg-white group hover:bg-gray-50 transition-colors">
                      <div className="w-8 pt-3 text-center text-gray-300 text-sm font-bold">{index + 1}</div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2">
                        <div className="md:col-span-5">
                          <input 
                            className="w-full p-2 bg-transparent border-b border-transparent focus:border-medical-500 outline-none font-medium"
                            placeholder="نام دارو"
                            value={item.drugName}
                            onChange={e => updateItem(item.id, 'drugName', e.target.value)}
                            list="drug-suggestions"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <input 
                            className="w-full p-2 bg-transparent border-b border-transparent focus:border-medical-500 outline-none text-sm"
                            placeholder="دوز/تعداد"
                            value={item.dosage}
                            onChange={e => updateItem(item.id, 'dosage', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-5">
                          <input 
                            className="w-full p-2 bg-transparent border-b border-transparent focus:border-medical-500 outline-none text-sm"
                            placeholder="دستور مصرف"
                            value={item.instruction}
                            onChange={e => updateItem(item.id, 'instruction', e.target.value)}
                          />
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      هنوز دارویی اضافه نشده است.
                    </div>
                  )}
                </div>
                {items.length > 0 && (
                   <div className="p-2 bg-gray-50 border-t border-gray-200">
                     <button onClick={addItem} className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-white transition-colors text-sm">
                       + سطر جدید
                     </button>
                   </div>
                )}
              </div>
            </div>

            {/* Right Sidebar: Vitals & History */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-medical-700" />
                  علائم حیاتی
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-500">فشار خون (BP)</label>
                    <input 
                      className="w-20 p-1 border-b border-gray-200 text-center focus:border-medical-500 outline-none" 
                      placeholder="120/80"
                      value={vitalSigns.bp || ''}
                      onChange={e => setVitalSigns({...vitalSigns, bp: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-500">ضربان (PR)</label>
                    <input 
                      className="w-20 p-1 border-b border-gray-200 text-center focus:border-medical-500 outline-none" 
                      placeholder="72"
                      value={vitalSigns.pr || ''}
                      onChange={e => setVitalSigns({...vitalSigns, pr: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-500">دما (Temp)</label>
                    <input 
                      className="w-20 p-1 border-b border-gray-200 text-center focus:border-medical-500 outline-none" 
                      placeholder="36.5"
                      value={vitalSigns.temp || ''}
                      onChange={e => setVitalSigns({...vitalSigns, temp: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                    <label className="text-sm font-bold text-gray-700">وزن فعلی (kg)</label>
                    <input 
                      className="w-20 p-1 bg-yellow-50 border-b border-yellow-200 text-center font-bold text-gray-800 focus:border-medical-500 outline-none rounded" 
                      value={vitalSigns.weight || ''}
                      onChange={e => setVitalSigns({...vitalSigns, weight: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {(activePatient.medicalHistory || activePatient.allergies) && (
                <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                  <h3 className="font-bold text-red-800 mb-2 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    هشدارهای پرونده
                  </h3>
                  {activePatient.allergies && (
                    <div className="mb-2">
                      <span className="text-xs font-bold text-red-700 block mb-1">حساسیت‌ها:</span>
                      <p className="text-sm text-red-600 leading-relaxed">{activePatient.allergies}</p>
                    </div>
                  )}
                  {activePatient.medicalHistory && (
                    <div>
                      <span className="text-xs font-bold text-red-700 block mb-1">سوابق:</span>
                      <p className="text-sm text-red-600 leading-relaxed">{activePatient.medicalHistory}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-between items-center pb-safe">
           <button 
             onClick={() => handleSave(false)}
             className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
           >
             ذخیره بدون چاپ
           </button>
           <button 
             onClick={() => handleSave(true)}
             className="px-8 py-3 bg-medical-700 text-white font-bold rounded-xl hover:bg-medical-900 transition-shadow shadow-lg shadow-medical-500/30 flex items-center gap-2"
           >
             <Printer className="w-5 h-5" />
             ذخیره و چاپ نسخه
           </button>
        </div>
      </div>
    </div>
  );
};


// 5. Main App Container
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const [dbDrugs, setDbDrugs] = useState<Drug[]>([]);
  
  // Phase 3: Active Visit State
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  
  // Phase 4: History & Print
  const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
  const [printData, setPrintData] = useState<{ doctor: DoctorProfile, patient: Patient, prescription: Prescription } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Preload drugs for datalist suggestions
  useEffect(() => {
    const loadData = async () => {
       const drugs = await dbParams.getAllDrugs();
       setDbDrugs(drugs);
    };
    loadData();
  }, [activeTab, refreshTrigger]);

  const handleSavePatient = async (patient: Patient) => {
    await dbParams.addPatient(patient); 
    setIsModalOpen(false);
    setEditingPatient(null);
    setRefreshTrigger(prev => prev + 1);
    
    // If added from dashboard search, automatically select for visit
    if (activeTab === 'dashboard' && !activePatient) {
        setActivePatient(patient);
    }
  };

  const openAddModal = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };
  
  const handleSelectPatient = (patient: Patient) => {
      setActivePatient(patient);
      setActiveTab('dashboard');
  };

  const initiatePrintProcess = async (data: { patient: Patient, prescription: Prescription }) => {
    const doctor = await dbParams.getDoctorProfile();
    const fullData = { 
      doctor: doctor || { id: 'default', fullName: 'دکتر', specialty: '', medicalCouncilNumber: '' },
      patient: data.patient, 
      prescription: data.prescription 
    };
    setPrintData(fullData);
    setIsPreviewOpen(true);
  };

  const confirmPrint = () => {
    setIsPreviewOpen(false);
    // Give React time to render the Hidden PrintContainer if needed, though it's always rendered with printData
    setTimeout(() => {
      window.print();
      // Optional cleanup
      setActivePatient(null); 
    }, 500);
  };

  return (
    <div className="min-h-screen bg-cream-50 text-gray-800 font-sans md:pr-64">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="min-h-screen no-print">
        {activeTab === 'dashboard' && (
          <Workbench 
            activePatient={activePatient} 
            onSelectPatient={handleSelectPatient}
            onCloseVisit={() => setActivePatient(null)}
            onPrint={initiatePrintProcess}
            onAddPatient={openAddModal}
          />
        )}

        {activeTab === 'patients' && (
          <div key={refreshTrigger}>
            <PatientsView 
              onEdit={openEditModal} 
              onSelect={handleSelectPatient} 
              onHistory={(p) => setHistoryPatient(p)}
            />
            <button 
              onClick={openAddModal}
              className="fixed bottom-20 left-6 md:bottom-8 md:left-8 bg-medical-700 text-white p-4 rounded-full shadow-lg hover:bg-medical-900 transition-transform hover:scale-105 z-40 flex items-center gap-2 group"
            >
              <Plus className="w-6 h-6" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
                بیمار جدید
              </span>
            </button>
          </div>
        )}

        {activeTab === 'templates' && <TemplatesManager />}

        {activeTab === 'drugs' && <DrugsManager />}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Hidden Print Container - Only visible during actual print */}
      <PrintContainer data={printData} />

      {/* Modals */}
      <PatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSavePatient}
        initialData={editingPatient}
      />

      <PatientHistoryModal 
        isOpen={!!historyPatient}
        patient={historyPatient}
        onClose={() => setHistoryPatient(null)}
      />

      <PrintPreviewModal 
        isOpen={isPreviewOpen}
        data={printData}
        onClose={() => setIsPreviewOpen(false)}
        onConfirmPrint={confirmPrint}
      />

      {/* Global Datalist for Drug Suggestions */}
      <datalist id="drug-suggestions">
        {dbDrugs.map(drug => (
          <option key={drug.id} value={drug.name} />
        ))}
      </datalist>
    </div>
  );
}
