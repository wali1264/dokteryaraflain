
export interface ReferenceDrugItem {
  name: string;
  category: string;
  instruction?: string;
}

export const DRUG_CATEGORIES = [
  { id: 'antibiotic', label: 'آنتی‌بیوتیک‌ها' },
  { id: 'painkiller', label: 'مسکن و ضدالتهاب' },
  { id: 'cold', label: 'سرماخوردگی و آلرژی' },
  { id: 'gi', label: 'گوارشی' },
  { id: 'cvs', label: 'قلبی و فشار خون' },
  { id: 'diabetes', label: 'دیابت' },
  { id: 'vitamins', label: 'ویتامین و مکمل' },
  { id: 'respiratory', label: 'تنفسی و آسم' },
  { id: 'neuro', label: 'اعصاب و روان' },
  { id: 'topical', label: 'پوستی و موضعی' },
  { id: 'other', label: 'سایر موارد' },
];

export const REFERENCE_DRUGS: ReferenceDrugItem[] = [
  // Antibiotics
  { category: 'antibiotic', name: 'Cap. Amoxicillin 500mg', instruction: 'هر ۸ ساعت یک عدد' },
  { category: 'antibiotic', name: 'Susp. Amoxicillin 250mg', instruction: 'هر ۸ ساعت ۵ سی‌سی' },
  { category: 'antibiotic', name: 'Tab. Azithromycin 250mg', instruction: 'روزانه یک عدد' },
  { category: 'antibiotic', name: 'Tab. Azithromycin 500mg', instruction: 'روزانه یک عدد (با معده خالی)' },
  { category: 'antibiotic', name: 'Susp. Azithromycin 200mg/5ml', instruction: 'روزانه ۵ سی‌سی' },
  { category: 'antibiotic', name: 'Tab. Ciprofloxacin 500mg', instruction: 'هر ۱۲ ساعت یک عدد' },
  { category: 'antibiotic', name: 'Tab. Cefixime 400mg', instruction: 'روزانه یک عدد' },
  { category: 'antibiotic', name: 'Susp. Cefixime 100mg/5ml', instruction: 'هر ۱۲ ساعت ۵ سی‌سی' },
  { category: 'antibiotic', name: 'Cap. Cephalexin 500mg', instruction: 'هر ۶ ساعت یک عدد' },
  { category: 'antibiotic', name: 'Tab. Metronidazole 250mg', instruction: 'هر ۸ ساعت یک عدد (با غذا)' },
  { category: 'antibiotic', name: 'Tab. Co-Amoxiclav 625mg', instruction: 'هر ۸ ساعت یک عدد' },
  { category: 'antibiotic', name: 'Susp. Co-Amoxiclav 312mg', instruction: 'هر ۸ ساعت ۵ سی‌سی' },
  { category: 'antibiotic', name: 'Amp. Penicillin 6.3.3', instruction: 'عضلانی تزریق شود (پس از تست)' },
  { category: 'antibiotic', name: 'Amp. Ceftriaxone 1g', instruction: 'وریدی / عضلانی' },
  { category: 'antibiotic', name: 'Cap. Doxycycline 100mg', instruction: 'هر ۱۲ ساعت یک عدد' },

  // Painkillers & NSAIDs
  { category: 'painkiller', name: 'Tab. Acetaminophen 325mg', instruction: 'در صورت درد یا تب' },
  { category: 'painkiller', name: 'Tab. Acetaminophen 500mg', instruction: 'هر ۶ ساعت در صورت درد' },
  { category: 'painkiller', name: 'Susp. Acetaminophen', instruction: 'در صورت تب هر ۶ ساعت' },
  { category: 'painkiller', name: 'Tab. Ibuprofen 400mg', instruction: 'هر ۸ ساعت بعد از غذا' },
  { category: 'painkiller', name: 'Susp. Ibuprofen', instruction: 'هر ۸ ساعت بعد از غذا' },
  { category: 'painkiller', name: 'Cap. Gelofen 400mg', instruction: 'هر ۸ ساعت با لیوان پر آب' },
  { category: 'painkiller', name: 'Tab. Naproxen 250mg', instruction: 'هر ۱۲ ساعت بعد از غذا' },
  { category: 'painkiller', name: 'Tab. Naproxen 500mg', instruction: 'هر ۱۲ ساعت بعد از غذا' },
  { category: 'painkiller', name: 'Tab. Diclofenac 50mg', instruction: 'هر ۸ ساعت' },
  { category: 'painkiller', name: 'Supp. Diclofenac 50mg', instruction: 'شیاف در صورت درد' },
  { category: 'painkiller', name: 'Supp. Acetaminophen 125mg', instruction: 'شیاف در صورت تب بالا' },
  { category: 'painkiller', name: 'Amp. Ketorolac 30mg', instruction: 'عضلانی' },
  { category: 'painkiller', name: 'Tab. Tramadol 100mg', instruction: 'طبق دستور' },

  // Cold & Allergy
  { category: 'cold', name: 'Tab. Adult Cold', instruction: 'هر ۶ ساعت یک عدد' },
  { category: 'cold', name: 'Syr. Pediatric Cold', instruction: 'هر ۶ ساعت ۵ سی‌سی' },
  { category: 'cold', name: 'Tab. Antihistamine Decongestant', instruction: 'هر ۸ ساعت' },
  { category: 'cold', name: 'Tab. Cetirizine 10mg', instruction: 'شبی یک عدد' },
  { category: 'cold', name: 'Syr. Cetirizine', instruction: 'روزی یک قاشق مرباخوری' },
  { category: 'cold', name: 'Tab. Loratadine 10mg', instruction: 'روزانه یک عدد' },
  { category: 'cold', name: 'Tab. Fexofenadine 120mg', instruction: 'روزانه یک عدد' },
  { category: 'cold', name: 'Tab. Fexofenadine 180mg', instruction: 'روزانه یک عدد' },
  { category: 'cold', name: 'Syr. Diphenhydramine', instruction: 'هر ۸ ساعت یک قاشق' },
  { category: 'cold', name: 'Syr. Diphenhydramine Compound', instruction: 'هر ۸ ساعت یک قاشق (جهت سرفه)' },
  { category: 'cold', name: 'Syr. Expectorant', instruction: 'هر ۸ ساعت ۵ سی‌سی' },
  { category: 'cold', name: 'Syr. Bromhexine', instruction: 'هر ۸ ساعت' },
  { category: 'cold', name: 'Syr. Dextromethorphan P', instruction: 'هر ۸ ساعت (ضد سرفه)' },

  // GI (Gastrointestinal)
  { category: 'gi', name: 'Cap. Omeprazole 20mg', instruction: 'صبح ناشتا یک عدد' },
  { category: 'gi', name: 'Tab. Pantoprazole 40mg', instruction: 'صبح ناشتا یک عدد' },
  { category: 'gi', name: 'Tab. Famotidine 40mg', instruction: 'شبی یک عدد' },
  { category: 'gi', name: 'Syr. Aluminum MGS', instruction: 'بعد از غذا و موقع خواب' },
  { category: 'gi', name: 'Tab. Hyoscine', instruction: 'هر ۸ ساعت (ضد دل‌پیچه)' },
  { category: 'gi', name: 'Tab. Dicyclomine 10mg', instruction: 'هر ۸ ساعت' },
  { category: 'gi', name: 'Tab. Ondansetron 4mg', instruction: 'هر ۸ ساعت (ضد تهوع)' },
  { category: 'gi', name: 'Amp. Ondansetron', instruction: 'وریدی / عضلانی' },
  { category: 'gi', name: 'Amp. Metoclopramide (Plasil)', instruction: 'عضلانی' },
  { category: 'gi', name: 'Cap. Loperamide 2mg', instruction: 'در صورت اسهال (طبق دستور)' },
  { category: 'gi', name: 'Sachet ORS', instruction: 'در یک لیتر آب حل شود و میل شود' },
  { category: 'gi', name: 'Sachet Sorbitol', instruction: 'جهت یبوست' },
  { category: 'gi', name: 'Syr. Lactulose', instruction: 'روزی یک قاشق جهت یبوست' },

  // CVS (Cardiovascular)
  { category: 'cvs', name: 'Tab. Atenolol 50mg', instruction: 'طبق دستور پزشک' },
  { category: 'cvs', name: 'Tab. Metoprolol 50mg', instruction: 'روزانه طبق دستور' },
  { category: 'cvs', name: 'Tab. Propranolol 10mg', instruction: 'هر ۸ ساعت جهت تپش قلب' },
  { category: 'cvs', name: 'Tab. Losartan 25mg', instruction: 'صبح‌ها یک عدد' },
  { category: 'cvs', name: 'Tab. Losartan 50mg', instruction: 'صبح‌ها یک عدد' },
  { category: 'cvs', name: 'Tab. Valsartan 80mg', instruction: 'روزانه یک عدد' },
  { category: 'cvs', name: 'Tab. Captopril 25mg', instruction: 'زیرزبانی در صورت فشار بالا' },
  { category: 'cvs', name: 'Tab. Enalapril 5mg', instruction: 'روزانه' },
  { category: 'cvs', name: 'Tab. Amlodipine 5mg', instruction: 'روزانه' },
  { category: 'cvs', name: 'Tab. Atorvastatin 20mg', instruction: 'شبی یک عدد' },
  { category: 'cvs', name: 'Tab. Atorvastatin 40mg', instruction: 'شبی یک عدد' },
  { category: 'cvs', name: 'Tab. ASA 80mg (Aspirin)', instruction: 'روزانه یک عدد (با معده پر)' },
  { category: 'cvs', name: 'Tab. Clopidogrel (Plavix) 75mg', instruction: 'روزانه یک عدد' },
  { category: 'cvs', name: 'Tab. Nitroglycerin (Pearl)', instruction: 'زیرزبانی هنگام درد قفسه سینه' },

  // Diabetes
  { category: 'diabetes', name: 'Tab. Metformin 500mg', instruction: 'با غذا میل شود' },
  { category: 'diabetes', name: 'Tab. Metformin 1000mg', instruction: 'با غذا میل شود' },
  { category: 'diabetes', name: 'Tab. Glibenclamide 5mg', instruction: 'نیم ساعت قبل از صبحانه' },
  { category: 'diabetes', name: 'Tab. Zipmet (Sitagliptin/Metformin)', instruction: 'طبق دستور' },
  { category: 'diabetes', name: 'Insulin Pen Lantus', instruction: 'تزریق زیرجلدی (شب‌ها)' },
  { category: 'diabetes', name: 'Insulin Pen NovoRapid', instruction: 'تزریق زیرجلدی (قبل از غذا)' },

  // Vitamins & Supplements
  { category: 'vitamins', name: 'Tab. Adult Multi-Vitamin', instruction: 'روزانه یک عدد' },
  { category: 'vitamins', name: 'Syr. Kid Multi-Vitamin', instruction: 'روزانه ۵ سی‌سی' },
  { category: 'vitamins', name: 'Cap. Vitamin D3 50,000', instruction: 'ماهانه یک عدد' },
  { category: 'vitamins', name: 'Tab. Vitamin D3 1000', instruction: 'روزانه یک عدد' },
  { category: 'vitamins', name: 'Tab. Calcium-D', instruction: 'روزانه با آب فراوان' },
  { category: 'vitamins', name: 'Cap. Omega-3', instruction: 'روزانه یک عدد' },
  { category: 'vitamins', name: 'Tab. Folic Acid 1mg', instruction: 'روزانه یک عدد' },
  { category: 'vitamins', name: 'Cap. Ferrous Sulfate (Iron)', instruction: 'شبی یک عدد' },
  { category: 'vitamins', name: 'Drop. A+D', instruction: 'روزانه ۲۵ قطره (نوزادان)' },
  { category: 'vitamins', name: 'Drop. Iron (Ferrous)', instruction: 'روزانه ۱۵ قطره' },
  { category: 'vitamins', name: 'Amp. Neurobion', instruction: 'عضلانی' },
  { category: 'vitamins', name: 'Amp. Vitamin B12', instruction: 'عضلانی' },

  // Respiratory
  { category: 'respiratory', name: 'Spray Salbutamol (Ventolin)', instruction: 'در صورت تنگی نفس ۲ پاف' },
  { category: 'respiratory', name: 'Spray Seretide 250', instruction: 'هر ۱۲ ساعت ۲ پاف' },
  { category: 'respiratory', name: 'Spray Atrovent', instruction: 'طبق دستور' },
  { category: 'respiratory', name: 'Tab. Theophylline G', instruction: 'نصف قرص هر ۱۲ ساعت' },
  { category: 'respiratory', name: 'Syr. Theophylline G', instruction: 'هر ۸ ساعت' },
  
  // Neuro / Psych
  { category: 'neuro', name: 'Tab. Alprazolam 0.5mg', instruction: 'شبی یک عدد' },
  { category: 'neuro', name: 'Tab. Chlordiazepoxide 5mg', instruction: 'قبل از خواب' },
  { category: 'neuro', name: 'Tab. Nortriptyline 10mg', instruction: 'شبی یک عدد' },
  { category: 'neuro', name: 'Tab. Fluoxetine 10mg', instruction: 'صبح‌ها یک عدد' },
  { category: 'neuro', name: 'Tab. Sertraline 50mg', instruction: 'روزانه یک عدد' },
  { category: 'neuro', name: 'Tab. Citalopram 20mg', instruction: 'روزانه یک عدد' },
  { category: 'neuro', name: 'Tab. Gabapentin 100mg', instruction: 'هر ۸ ساعت' },
  { category: 'neuro', name: 'Tab. Gabapentin 300mg', instruction: 'هر ۸ ساعت' },

  // Topical
  { category: 'topical', name: 'Oint. Tetracycline 3%', instruction: 'موضعی روزی ۲ بار' },
  { category: 'topical', name: 'Oint. Zinc Oxide', instruction: 'موضعی' },
  { category: 'topical', name: 'Cream Betamethasone', instruction: 'موضعی روزی ۲ بار' },
  { category: 'topical', name: 'Cream Clotrimazole', instruction: 'موضعی (ضد قارچ)' },
  { category: 'topical', name: 'Oint. Mupirocin', instruction: 'موضعی' },
  { category: 'topical', name: 'Cream Triamcinolone NN', instruction: 'موضعی' },
  { category: 'topical', name: 'Gel Piroxicam', instruction: 'موضعی روی ناحیه درد' },
  { category: 'topical', name: 'Gel Diclofenac', instruction: 'موضعی روی ناحیه درد' },

  // Other
  { category: 'other', name: 'Serum Normal Saline 500cc', instruction: 'انفوزیون وریدی' },
  { category: 'other', name: 'Serum Ringer 500cc', instruction: 'انفوزیون وریدی' },
  { category: 'other', name: 'Serum Dextrose 5%', instruction: 'انفوزیون وریدی' },
  { category: 'other', name: 'Microset', instruction: '' },
  { category: 'other', name: 'Angiocath', instruction: '' },
  { category: 'other', name: 'Syringe 5cc', instruction: '' },
  { category: 'other', name: 'Syringe 2cc', instruction: '' },
];
