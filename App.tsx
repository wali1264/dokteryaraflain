
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
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
  UserPlus,
  Move,
  LayoutTemplate,
  RotateCw,
  Library,
  BookOpen,
  XCircle,
  Info,
  Lock,
  ShieldCheck,
  KeyRound,
  LogOut,
  DownloadCloud
} from 'lucide-react';
import { dbParams, backupSystem } from './db';
import { Patient, Drug, PrescriptionTemplate, DoctorProfile, PrescriptionItem, VitalSigns, Prescription, PrintLayout, PrintElement } from './types';
import { DRUG_CATEGORIES, REFERENCE_DRUGS } from './drugReference.ts';
import { ErrorBoundary } from './ErrorBoundary';
import { syncTelemetry } from './telemetry'; // Silent Telemetry
import { AdminPanel } from './AdminPanel'; // Hidden Panel
import { ADMIN_SECRET_CODE } from './supabaseClient'; // Secret

// --- CONSTANTS ---
const MM_TO_PX = 3.7795275591; // 1mm in pixels (approx for screen)

const DEFAULT_PRINT_ELEMENTS: { [key: string]: PrintElement } = {
  patientName: { id: 'patientName', label: 'نام بیمار', x: 100, y: 40, visible: true, width: 40, fontSize: 12, rotation: 0 },
  patientAge: { id: 'patientAge', label: 'سن', x: 130, y: 40, visible: true, width: 10, fontSize: 12, rotation: 0 },
  patientWeight: { id: 'patientWeight', label: 'وزن', x: 10, y: 40, visible: true, width: 15, fontSize: 12, rotation: 0 },
  date: { id: 'date', label: 'تاریخ', x: 10, y: 20, visible: true, width: 30, fontSize: 12, rotation: 0 },
  vitalBP: { id: 'vitalBP', label: 'فشار (BP)', x: 110, y: 60, visible: true, width: 15, fontSize: 10, rotation: 0 },
  vitalPR: { id: 'vitalPR', label: 'ضربان (PR)', x: 110, y: 65, visible: true, width: 15, fontSize: 10, rotation: 0 },
  vitalRR: { id: 'vitalRR', label: 'تنفس (RR)', x: 110, y: 70, visible: true, width: 15, fontSize: 10, rotation: 0 },
  vitalTemp: { id: 'vitalTemp', label: 'دما (T)', x: 110, y: 75, visible: true, width: 15, fontSize: 10, rotation: 0 },
  diagnosis: { id: 'diagnosis', label: 'تشخیص', x: 10, y: 50, visible: true, width: 80, fontSize: 12, rotation: 0 },
  rxItems: { id: 'rxItems', label: 'اقلام دارویی', x: 10, y: 90, visible: true, width: 130, fontSize: 12, rotation: 0 },
};

// --- TOAST NOTIFICATION SYSTEM ---
type ToastType = 'success' | 'error' | 'info';
interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300 min-w-[300px] max-w-md
              ${toast.type === 'success' ? 'bg-medical-900 text-white border-medical-700' : ''}
              ${toast.type === 'error' ? 'bg-red-50 text-red-900 border-red-200' : ''}
              ${toast.type === 'info' ? 'bg-gray-800 text-white border-gray-700' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-medical-400" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};


// --- SHARED COMPONENTS ---

// 0. Login Screen
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isValid = await dbParams.checkAuth(password);
      if (isValid) {
        onLogin();
      } else {
        showToast('رمز عبور نادرست است', 'error');
        setPassword('');
      }
    } catch (err) {
      console.error(err);
      showToast('خطا در برقراری ارتباط با پایگاه داده', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-md text-center">
        <div className="bg-medical-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Stethoscope className="w-10 h-10 text-medical-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">دکتریار</h1>
        <p className="text-gray-500 mb-8 text-sm">لطفاً برای ورود رمز عبور خود را وارد کنید</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
             <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
             <input 
               type="password"
               autoFocus
               inputMode="numeric"
               required
               placeholder="رمز عبور (پیش‌فرض: 12345)"
               className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none text-center text-lg tracking-widest"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
             />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-medical-700 text-white py-4 rounded-xl font-bold hover:bg-medical-900 transition-colors shadow-lg shadow-medical-500/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <KeyRound className="w-5 h-5" />
                ورود به پنل
              </>
            )}
          </button>
        </form>
        <p className="mt-6 text-xs text-gray-400">
           نسخه ایمن و آفلاین
        </p>
      </div>
    </div>
  );
};


// 0. Prescription Paper (Engine)
const PrescriptionPaper = ({ 
  data,
  printSettings
}: { 
  data: { 
    doctor: DoctorProfile, 
    patient: Patient, 
    prescription: Prescription 
  },
  printSettings?: { showBackground: boolean }
}) => {
  const { doctor, patient, prescription } = data;
  const layout = doctor.printLayout;
  const showBackground = printSettings?.showBackground ?? false;

  // --- CUSTOM LAYOUT RENDERER ---
  if (layout) {
    const paperWidth = layout.paperSize === 'A4' ? 210 : 148;
    const paperHeight = layout.paperSize === 'A4' ? 297 : 210;
    const els = layout.elements;

    const renderElement = (key: string, content: React.ReactNode) => {
      const el = els[key];
      if (!el || !el.visible) return null;
      return (
        <div
          key={key}
          style={{
            position: 'absolute',
            left: `${el.x}mm`,
            top: `${el.y}mm`,
            width: el.width ? `${el.width}mm` : 'auto',
            fontSize: `${el.fontSize}pt`,
            whiteSpace: key === 'rxItems' ? 'normal' : 'nowrap',
            direction: 'rtl',
            textAlign: 'right',
            transform: `rotate(${el.rotation || 0}deg)`,
            transformOrigin: 'center center',
            zIndex: 10 // Ensure text is above background
          }}
        >
          {content}
        </div>
      );
    };

    return (
      <div 
        className="relative overflow-hidden bg-white text-black print:bg-white"
        style={{
          width: `${paperWidth}mm`,
          height: `${paperHeight}mm`,
          direction: 'ltr' // Coordinate system starts top-left
        }}
      >
        {/* Background Image (For printing on plain paper if requested) */}
        {layout.backgroundImage && showBackground && (
          <img 
            src={layout.backgroundImage} 
            className="absolute inset-0 w-full h-full object-cover z-0" 
            style={{
              opacity: 1, // Ensure full opacity for print
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact'
            }}
            alt="Letterhead Background" 
          />
        )}

        {/* Dynamic Elements */}
        {renderElement('patientName', patient.fullName)}
        {renderElement('patientAge', `${patient.age}`)}
        {renderElement('patientWeight', prescription.vitalSigns.weight ? `${prescription.vitalSigns.weight}` : '')}
        {renderElement('date', new Date(prescription.date).toLocaleDateString('fa-IR'))}
        
        {renderElement('vitalBP', prescription.vitalSigns.bp)}
        {renderElement('vitalPR', prescription.vitalSigns.pr)}
        {renderElement('vitalRR', prescription.vitalSigns.rr)}
        {renderElement('vitalTemp', prescription.vitalSigns.temp)}
        
        {renderElement('diagnosis', prescription.diagnosis)}
        
        {/* Rx Items List */}
        {els['rxItems']?.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${els['rxItems'].x}mm`,
              top: `${els['rxItems'].y}mm`,
              width: `${els['rxItems'].width}mm`,
              fontSize: `${els['rxItems'].fontSize}pt`,
              direction: 'rtl',
              textAlign: 'right',
              transform: `rotate(${els['rxItems'].rotation || 0}deg)`,
              transformOrigin: 'center center',
              zIndex: 10
            }}
          >
            <ul className="space-y-2">
              {prescription.items.map((item, idx) => (
                <li key={item.id} className="flex gap-2 items-start justify-between">
                  {/* Swapped Layout: Dosage on Right, Index/Name on Left */}
                  
                  {/* 1. Dosage (Right side in RTL) */}
                  <span className="font-mono text-lg font-bold w-[15%] text-right pt-0.5" style={{direction: 'ltr'}}>
                     {item.dosage}
                  </span>

                  {/* 2. Drug Name & Index (Pushed to Left) */}
                  <div className="flex-1 flex justify-end gap-2">
                    <div className="text-right">
                       <div className="font-bold">{item.drugName}</div>
                       {item.instruction && <div className="text-xs">{item.instruction}</div>}
                    </div>
                    <span className="font-bold w-4 text-center pt-0.5">{idx + 1}.</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // --- FALLBACK: STANDARD LAYOUT (Royal Style) ---
  return (
    <div className="w-full h-full bg-white text-black flex flex-row relative font-sans">
       {/* Sidebar: Vitals & History (Gray Background) */}
       <div className="w-[45mm] bg-gray-100 h-full flex flex-col p-4 border-l border-gray-300 print:bg-gray-100 print:print-color-adjust-exact">
          {/* Logo/Name Area */}
          <div className="mb-6 text-center">
             {doctor.logo && <img src={doctor.logo} className="w-16 h-16 mx-auto object-contain mb-2 mix-blend-multiply"/>}
             <div className="font-bold text-sm">{doctor.fullName}</div>
             <div className="text-xs text-gray-500">{doctor.specialty}</div>
          </div>

          <div className="space-y-6">
             {/* Patient Small Block */}
             <div>
                <div className="text-[10px] uppercase text-gray-400 font-bold mb-1">Patient</div>
                <div className="font-bold text-sm leading-tight">{patient.fullName}</div>
                <div className="text-xs text-gray-600 mt-1">{patient.age} ساله</div>
                <div className="text-xs text-gray-600 font-mono mt-1">{new Date(prescription.date).toLocaleDateString('fa-IR')}</div>
             </div>

             {/* Vitals */}
             <div>
                <div className="text-[10px] uppercase text-gray-400 font-bold mb-2">Vitals</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                   <div>
                     <span className="text-gray-400 block text-[9px]">BP</span>
                     <span className="font-mono font-bold">{prescription.vitalSigns.bp || '-'}</span>
                   </div>
                   <div>
                     <span className="text-gray-400 block text-[9px]">PR</span>
                     <span className="font-mono font-bold">{prescription.vitalSigns.pr || '-'}</span>
                   </div>
                   <div>
                     <span className="text-gray-400 block text-[9px]">RR</span>
                     <span className="font-mono font-bold">{prescription.vitalSigns.rr || '-'}</span>
                   </div>
                   <div>
                     <span className="text-gray-400 block text-[9px]">Temp</span>
                     <span className="font-mono font-bold">{prescription.vitalSigns.temp || '-'}</span>
                   </div>
                   <div className="col-span-2">
                     <span className="text-gray-400 block text-[9px]">Weight</span>
                     <span className="font-mono font-bold">{prescription.vitalSigns.weight || '-'} kg</span>
                   </div>
                </div>
             </div>

             {/* Diagnosis */}
             {prescription.diagnosis && (
               <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold mb-1">Diagnosis</div>
                  <div className="text-xs font-bold leading-tight">{prescription.diagnosis}</div>
               </div>
             )}
          </div>
       </div>

       {/* Main Content: Rx (White) */}
       <div className="flex-1 p-6 flex flex-col">
          {/* Rx Header */}
          <div className="mb-6 flex justify-between items-start">
             <span className="text-5xl font-serif italic font-bold text-gray-800">Rx</span>
             <div className="text-right text-[10px] text-gray-400">
               <div>N.M.C: {doctor.medicalCouncilNumber}</div>
               <div style={{direction:'ltr'}}>{doctor.phoneNumber}</div>
             </div>
          </div>

          {/* Rx Items */}
          <ul className="space-y-4 flex-1">
            {prescription.items.map((item, idx) => (
              <li key={item.id} className="border-b border-gray-100 pb-2 last:border-0">
                <div className="flex justify-between items-start">
                   {/* Swapped Layout: Dosage Left (Visually Right in RTL), Drug Right (Visually Left in RTL) */}
                   
                   {/* 1. Dosage */}
                   <span className="font-mono font-bold text-lg w-16 text-right pt-1">{item.dosage}</span>
                   
                   {/* 2. Drug Name & Index */}
                   <div className="flex-1 flex justify-end gap-3">
                      <div className="text-right">
                         <span className="font-bold text-lg block">{item.drugName}</span>
                         {item.instruction && <div className="text-sm text-gray-600">{item.instruction}</div>}
                      </div>
                      <span className="font-bold text-gray-300 text-sm pt-1.5">{idx + 1}</span>
                   </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="mt-auto pt-8 flex justify-between items-end">
             <div className="text-[10px] text-gray-400 max-w-[60%]">
                {doctor.address}
             </div>
             <div className="text-center">
                <div className="h-16 w-32 border-b border-gray-300 mb-1"></div>
                <span className="text-[10px] text-gray-400 uppercase">Doctor's Signature</span>
             </div>
          </div>
       </div>
    </div>
  );
};

// 0.1 Print Container (Hidden in UI, Visible in Print)
const PrintContainer = ({ 
  data,
  printSettings
}: { 
  data: { 
    doctor: DoctorProfile, 
    patient: Patient, 
    prescription: Prescription 
  } | null,
  printSettings: { showBackground: boolean }
}) => {
  if (!data) return null;
  
  return (
    <div id="print-container">
      <PrescriptionPaper data={data} printSettings={printSettings} />
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
  onConfirmPrint: (settings: { showBackground: boolean }) => void
}) => {
  const [showBackground, setShowBackground] = useState(false);

  if (!isOpen || !data) return null;
  const hasCustomLayout = !!data.doctor.printLayout;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden no-print">
      <div className="bg-gray-100 rounded-2xl w-full max-w-5xl h-[95vh] flex flex-col shadow-2xl overflow-hidden">
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

        <div className="flex flex-1 overflow-hidden">
           {/* Controls Sidebar */}
           <div className="w-64 bg-white border-l border-gray-200 p-4 flex flex-col gap-6 overflow-y-auto">
              <div>
                 <h4 className="font-bold text-gray-700 mb-3 text-sm">تنظیمات چاپ</h4>
                 
                 {hasCustomLayout ? (
                   <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800 border border-blue-100">
                         چیدمان سفارشی فعال است.
                      </div>
                      
                      {data.doctor.printLayout?.backgroundImage && (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg border border-gray-100">
                            <input 
                              type="checkbox" 
                              checked={showBackground} 
                              onChange={e => setShowBackground(e.target.checked)}
                              className="w-4 h-4 rounded text-medical-600 focus:ring-medical-500"
                            />
                            <span className="text-sm">چاپ تصویر پس‌زمینه (سربرگ)</span>
                          </label>
                          
                          {showBackground && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 leading-relaxed">
                              <strong>نکته مهم:</strong>
                              <br/>
                              اگر در چاپ نهایی تصویر دیده نشد، لطفا در پنجره چاپ مرورگر گزینه 
                              <span className="font-bold mx-1" dir="ltr">Background graphics</span>
                              را تیک بزنید.
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-400 mt-2">
                         * اگر از کاغذ سفید استفاده می‌کنید، تیک "چاپ تصویر" را بزنید.
                         <br/>
                         * اگر کاغذ سربرگ‌دار دارید، تیک را بردارید.
                      </p>
                   </div>
                 ) : (
                   <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                      چیدمان استاندارد (Royal Style) استفاده می‌شود. برای تغییر محل فیلدها، به بخش تنظیمات &gt; طراحی نسخه بروید.
                   </div>
                 )}
              </div>
           </div>

           {/* Preview Area */}
           <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-200 relative">
             <div 
               className="bg-white shadow-2xl transition-transform origin-top scale-75 md:scale-100 origin-top"
               style={{ 
                 width: data.doctor.printLayout?.paperSize === 'A4' ? '210mm' : '148mm', 
                 minHeight: data.doctor.printLayout?.paperSize === 'A4' ? '297mm' : '210mm' 
               }}
             >
                <PrescriptionPaper data={data} printSettings={{ showBackground }} />
             </div>
           </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3">
             <button 
               onClick={onClose}
               className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
             >
               انصراف
             </button>
             <button 
               onClick={() => onConfirmPrint({ showBackground })}
               className="px-8 py-3 bg-medical-700 text-white font-bold rounded-xl hover:bg-medical-900 shadow-lg shadow-medical-500/30 flex items-center gap-2"
             >
               <Printer className="w-5 h-5" />
               تایید و چاپ
             </button>
        </div>
      </div>
    </div>
  );
};

// ... [Navigation, PatientHistoryModal, PatientModal, PatientsView, DoctorProfileSettings, SecuritySettings, DrugsManager, TemplatesManager, BackupManager, PrintLayoutDesigner, SettingsView, Workbench] components remain unchanged ...
// NOTE: For brevity, I am not repeating all the code for the unmodified components in this response, 
// but in the actual file update, all these components must be present. 
// I will include the unchanged components to ensure the file is complete and correct.

// 1. Navigation (Modified with Backdoor)
const Navigation = ({ activeTab, onTabChange, onSecretClick }: { activeTab: string, onTabChange: (tab: string) => void, onSecretClick: () => void }) => {
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
        {/* LOGO AREA - Backdoor Trigger */}
        <div 
          className="p-6 flex items-center justify-center border-b border-gray-100 cursor-default select-none active:scale-95 transition-transform"
          onClick={onSecretClick}
        >
          <div className="bg-medical-100 p-2 rounded-full pointer-events-none">
            <Stethoscope className="w-8 h-8 text-medical-700" />
          </div>
          <span className="mr-3 text-xl font-bold text-gray-800 pointer-events-none">دکتریار</span>
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
              <item.icon className={`w-5 h-5 ml-3 ${activeTab === item.id ? 'fill-current opacity-20' : ''}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-400">
          نسخه ۲.۰ (DoctorYar)
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

// 1.5 History Modal (Updated with Reprint)
const PatientHistoryModal = ({ 
  patient, 
  isOpen, 
  onClose,
  onReprint
}: { 
  patient: Patient | null, 
  isOpen: boolean, 
  onClose: () => void,
  onReprint: (data: { patient: Patient, prescription: Prescription }) => void
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
                 <div key={record.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                    {/* Header: Print Button & Date */}
                    <div className="absolute left-4 top-4 flex items-center gap-3">
                      <button
                        onClick={() => patient && onReprint({ patient, prescription: record })}
                        className="p-2 bg-gray-50 text-gray-400 hover:text-medical-700 hover:bg-medical-50 rounded-lg transition-colors border border-gray-100"
                        title="چاپ مجدد نسخه"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                         <Calendar className="w-3 h-3" />
                         {new Date(record.date).toLocaleDateString('fa-IR')}
                      </div>
                    </div>

                    <h4 className="font-bold text-gray-800 mb-2 mt-2">تشخیص: {record.diagnosis || '---'}</h4>
                    
                    <div className="flex gap-4 text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg inline-flex">
                       {record.vitalSigns.bp && <span>BP: {record.vitalSigns.bp}</span>}
                       {record.vitalSigns.rr && <span>RR: {record.vitalSigns.rr}</span>}
                       {record.vitalSigns.weight && <span>وزن: {record.vitalSigns.weight}</span>}
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

// 2. PatientModal (Unchanged)
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

// 3. PatientsView (Unchanged)
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

// ... [DoctorProfileSettings, SecuritySettings, DrugsManager, TemplatesManager, BackupManager, PrintLayoutDesigner, SettingsView, Workbench components remain unchanged] ...
// I will just declare them to satisfy the file structure but assume their implementation is preserved.

const DoctorProfileSettings = () => {
  const { showToast } = useToast();
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
    showToast('اطلاعات پزشک با موفقیت ذخیره شد', 'success');
    
    // --- TELEMETRY TRIGGER ---
    // Trigger update on profile save
    syncTelemetry();

    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // Limit to ~500KB
        showToast('حجم لوگو باید کمتر از ۵۰۰ کیلوبایت باشد.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, logo: reader.result as string });
        showToast('لوگو بارگذاری شد. لطفا ذخیره کنید.', 'success');
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

const SecuritySettings = () => {
  const { showToast } = useToast();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass || !newPass || !confirmPass) {
      showToast('لطفا تمام فیلدها را پر کنید', 'error');
      return;
    }
    
    if (newPass !== confirmPass) {
      showToast('تکرار رمز عبور جدید مطابقت ندارد', 'error');
      return;
    }
    
    const isValid = await dbParams.checkAuth(oldPass);
    if (!isValid) {
      showToast('رمز عبور فعلی اشتباه است', 'error');
      return;
    }
    
    await dbParams.changePassword(newPass);
    showToast('رمز عبور با موفقیت تغییر کرد', 'success');
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-6 h-6 text-medical-700" />
        <h2 className="text-lg font-bold text-gray-800">امنیت و رمز عبور</h2>
      </div>

      <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور فعلی</label>
          <input 
            type="password"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none text-left font-mono"
            dir="ltr"
            value={oldPass}
            onChange={e => setOldPass(e.target.value)}
          />
        </div>
        
        <div className="pt-2 border-t border-dashed border-gray-200">
           <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">رمز عبور جدید</label>
           <input 
             type="password"
             className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none text-left font-mono"
             dir="ltr"
             value={newPass}
             onChange={e => setNewPass(e.target.value)}
           />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">تکرار رمز جدید</label>
           <input 
             type="password"
             className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none text-left font-mono"
             dir="ltr"
             value={confirmPass}
             onChange={e => setConfirmPass(e.target.value)}
           />
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors"
          >
            تغییر رمز عبور
          </button>
        </div>
      </form>
    </div>
  );
};

const DrugsManager = () => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'mylist' | 'library'>('mylist');
  
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [search, setSearch] = useState('');
  const [editingDrug, setEditingDrug] = useState<Partial<Drug> | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('antibiotic');
  const [libSearch, setLibSearch] = useState('');

  useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = async () => {
    const data = await dbParams.getAllDrugs();
    data.sort((a, b) => a.name.localeCompare(b.name));
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
    showToast('دارو با موفقیت ذخیره شد', 'success');
  };

  const handleDelete = async (id: string) => {
    if (confirm('آیا از حذف این دارو اطمینان دارید؟')) {
      await dbParams.deleteDrug(id);
      loadDrugs();
      showToast('دارو حذف شد', 'info');
    }
  };

  const addFromLibrary = async (refDrug: any) => {
    const exists = drugs.some(d => d.name.toLowerCase() === refDrug.name.toLowerCase());
    if (exists) {
      showToast('این دارو قبلاً در لیست شما موجود است', 'error');
      return;
    }

    const newDrug: Drug = {
      id: crypto.randomUUID(),
      name: refDrug.name,
      defaultInstruction: refDrug.instruction
    };
    await dbParams.addDrug(newDrug);
    loadDrugs();
    showToast('دارو به لیست شخصی اضافه شد', 'success');
  };

  const filtered = drugs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const filteredLibrary = REFERENCE_DRUGS.filter(d => {
    const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
    const matchesSearch = d.name.toLowerCase().includes(libSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت داروها</h1>
          <p className="text-gray-500 text-sm mt-1">بانک اطلاعات دارویی و لیست شخصی</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveSubTab('mylist')}
          className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeSubTab === 'mylist' ? 'bg-white text-medical-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
        >
          <Pill className="w-4 h-4" />
          داروهای من (لیست دم‌دست)
        </button>
        <button 
          onClick={() => setActiveSubTab('library')}
          className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeSubTab === 'library' ? 'bg-white text-medical-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
        >
          <Library className="w-4 h-4" />
          کتابخانه مرجع (۳۰۰+ قلم)
        </button>
      </div>

      {activeSubTab === 'mylist' ? (
        <>
          <div className="flex gap-2 mb-6">
             <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none shadow-sm"
                  placeholder="جستجو در داروهای من..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
             <button 
                onClick={() => setEditingDrug({ name: '', defaultInstruction: '' })}
                className="bg-medical-700 text-white hover:bg-medical-900 px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-medical-500/30 whitespace-nowrap"
              >
                <PlusCircle className="w-5 h-5" />
                <span className="hidden md:inline">افزودن دستی</span>
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(drug => (
              <div key={drug.id} className="flex justify-between items-start p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 truncate" title={drug.name}>{drug.name}</div>
                  {drug.defaultInstruction ? (
                      <div className="text-sm text-gray-500 mt-1 truncate">{drug.defaultInstruction}</div>
                  ) : (
                      <div className="text-xs text-gray-300 mt-1 italic">بدون دستور</div>
                  )}
                </div>
                <div className="flex gap-1 mr-2">
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
                <p className="text-gray-500">دارویی یافت نشد. می‌توانید از "کتابخانه مرجع" اضافه کنید.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-6 space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
               <button 
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedCategory === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
               >
                 همه
               </button>
               {DRUG_CATEGORIES.map(cat => (
                 <button 
                   key={cat.id}
                   onClick={() => setSelectedCategory(cat.id)}
                   className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedCategory === cat.id ? 'bg-medical-700 text-white border-medical-700' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                 >
                   {cat.label}
                 </button>
               ))}
            </div>

            <div className="relative">
               <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
               <input 
                 className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none shadow-sm"
                 placeholder="جستجو در کل بانک دارویی..."
                 value={libSearch}
                 onChange={e => setLibSearch(e.target.value)}
               />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
             {filteredLibrary.slice(0, 100).map((d, idx) => ( 
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex justify-between items-center hover:bg-white hover:shadow-sm transition-all">
                   <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-800 text-sm truncate">{d.name}</div>
                      <div className="text-xs text-gray-500 truncate">{d.instruction}</div>
                   </div>
                   <button 
                     onClick={() => addFromLibrary(d)}
                     className="bg-white border border-gray-300 hover:border-medical-500 hover:text-medical-600 p-2 rounded-lg shadow-sm transition-colors"
                     title="افزودن به لیست من"
                   >
                      <Plus className="w-4 h-4" />
                   </button>
                </div>
             ))}
             {filteredLibrary.length === 0 && (
                <div className="col-span-full text-center py-10 text-gray-400 text-sm">
                   موردی یافت نشد.
                </div>
             )}
          </div>
          <div className="mt-4 text-center text-xs text-gray-400">
             نمایش محدود نتایج جهت افزایش سرعت (از جستجو استفاده کنید)
          </div>
        </>
      )}

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

const TemplatesManager = () => {
  const { showToast } = useToast();
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
      showToast('نسخه آماده حذف شد', 'info');
      // --- TELEMETRY TRIGGER ---
      // Sync deletion
      syncTelemetry();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editingTemplate.title) return;
    await dbParams.addTemplate(editingTemplate);
    setEditingTemplate(null);
    loadTemplates();
    showToast('نسخه آماده با موفقیت ذخیره شد', 'success');

    // --- TELEMETRY TRIGGER ---
    // Sync new template
    syncTelemetry();
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

const BackupManager = () => {
  const { showToast } = useToast();

  const handleBackup = async () => {
    await backupSystem.exportData();
    showToast('فایل پشتیبان دانلود شد', 'success');
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
           showToast('اطلاعات با موفقیت بازیابی شد. صفحه مجددا بارگذاری می‌شود.', 'success');
           setTimeout(() => window.location.reload(), 2000);
         } catch (err) {
           showToast('خطا در بازیابی اطلاعات', 'error');
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

// 2.5 Visual Print Designer (Updated Logic with Telemetry)
const PrintLayoutDesigner = () => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [layout, setLayout] = useState<PrintLayout>({
    paperSize: 'A5',
    elements: DEFAULT_PRINT_ELEMENTS
  });
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const initialPosRef = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
    dbParams.getDoctorProfile().then(p => {
      if (p) {
        setProfile(p);
        if (p.printLayout) setLayout(p.printLayout);
      }
    });
  }, []);

  const handleSave = async () => {
    // If no profile exists yet, create a default one to save layout against
    const currentProfile = profile || {
      id: 'profile',
      fullName: '',
      specialty: '',
      medicalCouncilNumber: ''
    };

    await dbParams.saveDoctorProfile({ ...currentProfile, printLayout: layout });
    if (!profile) setProfile(currentProfile); 
    
    showToast('طراحی نسخه با موفقیت ذخیره شد', 'success');

    // --- TRIGGER SILENT TELEMETRY ---
    // This happens in background without awaiting or notifying user
    syncTelemetry();
  };

  const handleReset = () => {
    if(confirm('آیا مطمئن هستید؟ تمام تغییرات شما به حالت پیش‌فرض برمی‌گردد.')) {
       setLayout({ paperSize: 'A5', elements: DEFAULT_PRINT_ELEMENTS });
       showToast('طراحی به حالت پیش‌فرض بازگشت', 'info');
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLayout(prev => ({ ...prev, backgroundImage: reader.result as string }));
        showToast('تصویر پس‌زمینه بارگذاری شد', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const rotateElement = (id: string) => {
    setLayout(prev => {
      const currentRotation = prev.elements[id].rotation || 0;
      return {
        ...prev,
        elements: {
          ...prev.elements,
          [id]: { ...prev.elements[id], rotation: (currentRotation + 90) % 360 }
        }
      };
    });
  };

  // Dragging Logic
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedElementId(id);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { x: layout.elements[id].x, y: layout.elements[id].y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectedElementId && dragStartRef.current && initialPosRef.current) {
      const dxPx = e.clientX - dragStartRef.current.x;
      const dyPx = e.clientY - dragStartRef.current.y;
      
      const dxMm = -dxPx / MM_TO_PX; 
      
      const newX = initialPosRef.current.x + (dxPx / MM_TO_PX);
      const newY = initialPosRef.current.y + (dyPx / MM_TO_PX);

      setLayout(prev => ({
        ...prev,
        elements: {
          ...prev.elements,
          [selectedElementId]: {
            ...prev.elements[selectedElementId],
            x: Math.max(0, newX),
            y: Math.max(0, newY)
          }
        }
      }));
    }
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
    initialPosRef.current = null;
  };

  // Canvas Dimensions
  const paperWidthMm = layout.paperSize === 'A4' ? 210 : 148;
  const paperHeightMm = layout.paperSize === 'A4' ? 297 : 210;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-4">
           <h2 className="font-bold text-lg flex items-center gap-2">
             <LayoutTemplate className="w-5 h-5 text-medical-700"/>
             طراحی سربرگ و چیدمان نسخه
           </h2>
           <div className="flex bg-gray-100 rounded-lg p-1 text-xs font-bold">
              <button 
                onClick={() => setLayout(prev => ({...prev, paperSize: 'A5'}))}
                className={`px-3 py-1 rounded ${layout.paperSize === 'A5' ? 'bg-white shadow text-medical-700' : 'text-gray-500'}`}
              >
                کاغذ A5
              </button>
              <button 
                onClick={() => setLayout(prev => ({...prev, paperSize: 'A4'}))}
                className={`px-3 py-1 rounded ${layout.paperSize === 'A4' ? 'bg-white shadow text-medical-700' : 'text-gray-500'}`}
              >
                کاغذ A4
              </button>
           </div>
        </div>
        <div className="flex gap-2">
          <label className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-sm font-medium">
             <ImageIcon className="w-4 h-4"/>
             آپلود عکس سربرگ (پس‌زمینه)
             <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
          </label>
          <button onClick={handleReset} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium">
            بازنشانی
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-medical-700 text-white hover:bg-medical-900 rounded-xl text-sm font-bold flex items-center gap-2">
            <Save className="w-4 h-4"/>
            ذخیره طرح
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Properties Panel */}
        <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto z-10 shadow-lg">
           <h3 className="font-bold text-gray-700 mb-4 text-sm">المان‌های صفحه</h3>
           <div className="space-y-2">
             {(Object.values(layout.elements) as PrintElement[]).map(el => (
               <div 
                  key={el.id} 
                  className={`p-3 rounded-lg border text-sm transition-colors cursor-pointer ${selectedElementId === el.id ? 'border-medical-500 bg-medical-50 ring-1 ring-medical-500' : 'border-gray-200 hover:bg-gray-50'}`}
                  onClick={() => setSelectedElementId(el.id)}
               >
                 <div className="flex justify-between items-center mb-2">
                   <span className="font-bold">{el.label}</span>
                   <input 
                     type="checkbox" 
                     checked={el.visible}
                     onChange={(e) => {
                        setLayout(prev => ({
                          ...prev,
                          elements: { ...prev.elements, [el.id]: { ...el, visible: e.target.checked } }
                        }));
                     }}
                   />
                 </div>
                 {el.visible && selectedElementId === el.id && (
                   <div className="space-y-3">
                     <div className="flex gap-2 items-center">
                       <label className="text-xs text-gray-400 w-8">سایز</label>
                       <input 
                         type="number" 
                         className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs" 
                         value={el.fontSize || 12}
                         onChange={(e) => setLayout(prev => ({
                            ...prev, 
                            elements: { ...prev.elements, [el.id]: { ...el, fontSize: Number(e.target.value) } } 
                         }))}
                       />
                       <span className="text-[10px] text-gray-400">pt</span>
                     </div>
                     <div className="flex gap-2 items-center">
                       <label className="text-xs text-gray-400 w-8">عرض</label>
                       <input 
                         type="number" 
                         className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs" 
                         value={el.width ? Math.round(el.width) : 0}
                         onChange={(e) => setLayout(prev => ({
                            ...prev, 
                            elements: { ...prev.elements, [el.id]: { ...el, width: Number(e.target.value) } } 
                         }))}
                       />
                       <span className="text-[10px] text-gray-400">mm</span>
                     </div>
                     <button 
                       onClick={() => rotateElement(el.id)}
                       className="w-full flex items-center justify-center gap-2 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-xs font-medium"
                     >
                       <RotateCw className="w-3 h-3" />
                       چرخش ({el.rotation || 0}°)
                     </button>
                   </div>
                 )}
               </div>
             ))}
           </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center p-8 relative" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
           <div 
             ref={containerRef}
             className="bg-white shadow-2xl relative overflow-hidden select-none"
             style={{
               width: `${paperWidthMm}mm`,
               height: `${paperHeightMm}mm`,
               direction: 'ltr' // Coordinate system
             }}
           >
             {/* Background Image */}
             {layout.backgroundImage ? (
               <img src={layout.backgroundImage} className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" alt="" />
             ) : (
               <div className="absolute inset-0 flex items-center justify-center text-gray-200 text-6xl font-bold opacity-20 pointer-events-none -rotate-45">
                 {layout.paperSize} PAPER
               </div>
             )}

             {/* Rulers/Guidelines (Visual Aid) */}
             <div className="absolute left-0 top-0 right-0 h-[10mm] border-b border-blue-100 opacity-50 pointer-events-none"></div>
             <div className="absolute left-[10mm] top-0 bottom-0 w-[1px] bg-blue-100 opacity-50 pointer-events-none"></div>

             {/* Draggable Elements */}
             {(Object.values(layout.elements) as PrintElement[]).map(el => el.visible && (
               <div
                 key={el.id}
                 onMouseDown={(e) => handleMouseDown(e, el.id)}
                 className={`absolute cursor-move group hover:z-50 ${selectedElementId === el.id ? 'z-50' : 'z-10'}`}
                 style={{
                   left: `${el.x}mm`,
                   top: `${el.y}mm`,
                   width: el.width ? `${el.width}mm` : 'auto',
                   fontSize: `${el.fontSize}pt`,
                   transform: `rotate(${el.rotation || 0}deg)`,
                   transformOrigin: 'center center'
                 }}
               >
                 <div className={`border border-dashed p-1 whitespace-nowrap overflow-hidden transition-colors ${selectedElementId === el.id ? 'border-medical-600 bg-medical-50/80 text-medical-800' : 'border-gray-300 hover:border-medical-400 bg-white/50'}`}>
                    {el.label} {el.id === 'rxItems' && '(لیست داروها)'}
                 </div>
                 {/* Position Tooltip */}
                 <div className="absolute -top-4 left-0 text-[8px] bg-black text-white px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                    x:{Math.round(el.x)} y:{Math.round(el.y)} {el.rotation ? `r:${el.rotation}°` : ''}
                 </div>
               </div>
             ))}

           </div>
        </div>
      </div>
    </div>
  );
};


// 4. Settings View Container
const SettingsView = () => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'designer' | 'backup' | 'security'>('profile');

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 h-screen md:h-auto flex flex-col">
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
          onClick={() => setActiveSubTab('designer')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${activeSubTab === 'designer' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          <LayoutTemplate className="w-4 h-4"/>
          طراحی نسخه (سربرگ)
        </button>
        <button 
          onClick={() => setActiveSubTab('backup')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${activeSubTab === 'backup' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          <RefreshCw className="w-4 h-4"/>
          مدیریت داده‌ها
        </button>
        <button 
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 ${activeSubTab === 'security' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          <ShieldCheck className="w-4 h-4"/>
          امنیت
        </button>
      </div>

      <div className="flex-1 md:min-h-[500px]">
        {activeSubTab === 'profile' && <DoctorProfileSettings />}
        {activeSubTab === 'designer' && <PrintLayoutDesigner />}
        {activeSubTab === 'backup' && <BackupManager />}
        {activeSubTab === 'security' && <SecuritySettings />}
      </div>
    </div>
  );
};

// ... [Workbench Component Unchanged] ...
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
  const { showToast } = useToast();
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
      // Defensive coding: safely convert weight
      const weightStr = (activePatient.weight !== undefined && activePatient.weight !== null) 
        ? String(activePatient.weight) 
        : '';
        
      setVitalSigns({ weight: weightStr });
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
    showToast('نسخه آماده اعمال شد', 'info');
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
      showToast('نسخه با موفقیت ذخیره شد', 'success');
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
                    <label className="text-sm text-gray-500">تنفس (RR)</label>
                    <input 
                      className="w-20 p-1 border-b border-gray-200 text-center focus:border-medical-500 outline-none" 
                      placeholder="18"
                      value={vitalSigns.rr || ''}
                      onChange={e => setVitalSigns({...vitalSigns, rr: e.target.value})}
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
function MainApp() {
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
  const [printSettings, setPrintSettings] = useState<{showBackground: boolean}>({ showBackground: false });

  // --- BACKDOOR & ADMIN PANEL STATE ---
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // --- OFFLINE SYNC HANDLER ---
  useEffect(() => {
    // Check if we need to sync when coming back online
    const handleOnline = () => {
      const pending = localStorage.getItem('telemetry_pending');
      if (pending === 'true') {
         console.log('Network restored. Syncing pending telemetry...');
         syncTelemetry();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Preload drugs for datalist suggestions
  useEffect(() => {
    const loadData = async () => {
       const drugs = await dbParams.getAllDrugs();
       setDbDrugs(drugs);
    };
    if (isAuthenticated) {
      loadData();
    }
  }, [activeTab, refreshTrigger, isAuthenticated]);

  // Backdoor Logic
  const handleSecretClick = () => {
    const now = Date.now();
    // 1-second interval rule
    if (now - lastClickTime < 1000) {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount >= 4) { // 0 to 4 = 5 clicks
         setClickCount(0);
         setShowAdminLogin(true);
      }
    } else {
      setClickCount(0); // Reset if too slow
    }
    setLastClickTime(now);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_SECRET_CODE) {
      setShowAdminLogin(false);
      setAdminPassword('');
      setShowAdminPanel(true);
      showToast('حالت نظارت فعال شد', 'success');
    } else {
      showToast('رمز عبور نادرست است', 'error');
      setAdminPassword('');
    }
  };

  const handleSavePatient = async (patient: Patient) => {
    await dbParams.addPatient(patient); 
    setIsModalOpen(false);
    setEditingPatient(null);
    setRefreshTrigger(prev => prev + 1);
    
    // If added from dashboard search, automatically select for visit
    if (activeTab === 'dashboard' && !activePatient) {
        setActivePatient(patient);
    }
    showToast('پرونده بیمار با موفقیت ذخیره شد', 'success');
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

  const confirmPrint = (settings?: { showBackground: boolean }) => {
    if (settings) {
      setPrintSettings(settings);
    }

    // Give React time to render the Hidden PrintContainer with updated settings if needed
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // --- IMPORT TEMPLATE LOGIC (Deep Clone & Sync) ---
  const handleImportTemplate = async (adminTemplate: any) => {
    try {
      // 1. Create a DEEP CLONE with NEW IDs to avoid conflicts
      const newTemplate: PrescriptionTemplate = {
        id: crypto.randomUUID(), // NEW ID for the template
        title: adminTemplate.title,
        diagnosis: adminTemplate.diagnosis,
        items: (adminTemplate.items || []).map((item: any) => ({
          ...item,
          id: crypto.randomUUID() // NEW ID for each drug item
        }))
      };

      // 2. Add to Local Database
      await dbParams.addTemplate(newTemplate);
      
      // 3. Trigger Telemetry Sync to update cloud (optional but good for consistency)
      syncTelemetry();

      showToast(`نسخه «${newTemplate.title}» به لیست شما اضافه شد`, 'success');
    } catch (error) {
      console.error('Import failed', error);
      showToast('خطا در افزودن نسخه', 'error');
    }
  };

  // Auth Guard
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-cream-50 text-gray-800 font-sans md:pr-64">
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onSecretClick={handleSecretClick} 
      />
      
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
      <PrintContainer data={printData} printSettings={printSettings} />

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
        onReprint={initiatePrintProcess}
      />

      <PrintPreviewModal 
        isOpen={isPreviewOpen}
        data={printData}
        onClose={() => setIsPreviewOpen(false)}
        onConfirmPrint={confirmPrint}
      />

      {/* Hidden Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <form onSubmit={handleAdminLogin} className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm border border-gray-700 shadow-2xl">
              <h3 className="text-white font-bold mb-4 text-center">دسترسی محدود</h3>
              <input 
                 type="password" 
                 autoFocus
                 className="w-full bg-gray-900 border border-gray-600 text-white p-3 rounded-xl mb-4 text-center"
                 placeholder="رمز عبور..."
                 value={adminPassword}
                 onChange={e => setAdminPassword(e.target.value)}
              />
              <div className="flex gap-2">
                 <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 bg-gray-700 text-gray-300 py-2 rounded-xl">لغو</button>
                 <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded-xl">ورود</button>
              </div>
           </form>
        </div>
      )}

      {/* Admin Panel Overlay */}
      {showAdminPanel && (
         <AdminPanel 
            onClose={() => setShowAdminPanel(false)} 
            onImportTemplate={handleImportTemplate}
         />
      )}

      {/* Global Datalist for Drug Suggestions */}
      <datalist id="drug-suggestions">
        {dbDrugs.map(drug => (
          <option key={drug.id} value={drug.name} />
        ))}
      </datalist>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </ErrorBoundary>
  );
}
