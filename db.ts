import { Patient, Drug, PrescriptionTemplate, DoctorProfile, Prescription } from './types';

const DB_NAME = 'TabYarDB';
const DB_VERSION = 3;
const STORE_PATIENTS = 'patients';
const STORE_DRUGS = 'drugs';
const STORE_TEMPLATES = 'templates';
const STORE_SETTINGS = 'settings';
const STORE_PRESCRIPTIONS = 'prescriptions';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Phase 1
      if (!db.objectStoreNames.contains(STORE_PATIENTS)) {
        const store = db.createObjectStore(STORE_PATIENTS, { keyPath: 'id' });
        store.createIndex('fullName', 'fullName', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Phase 2
      if (!db.objectStoreNames.contains(STORE_DRUGS)) {
        const store = db.createObjectStore(STORE_DRUGS, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORE_TEMPLATES)) {
        db.createObjectStore(STORE_TEMPLATES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }

      // Phase 3
      if (!db.objectStoreNames.contains(STORE_PRESCRIPTIONS)) {
        const store = db.createObjectStore(STORE_PRESCRIPTIONS, { keyPath: 'id' });
        store.createIndex('patientId', 'patientId', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

const performTransaction = <T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> => {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      let request;

      try {
        request = callback(store);
      } catch (e) {
        reject(e);
        return;
      }

      transaction.oncomplete = () => {
        if (request && 'result' in request) {
          resolve((request as IDBRequest<T>).result);
        } else {
          resolve(undefined as unknown as T);
        }
      };

      transaction.onerror = () => reject(transaction.error);
    });
  });
};

export const dbParams = {
  // Patients
  getAllPatients: async (): Promise<Patient[]> => {
    return performTransaction(STORE_PATIENTS, 'readonly', (store) => store.getAll()) as Promise<Patient[]>;
  },

  addPatient: async (patient: Patient): Promise<string> => {
    return performTransaction(STORE_PATIENTS, 'readwrite', (store) => store.put(patient)) as Promise<string>;
  },

  updatePatient: async (patient: Patient): Promise<string> => {
    return performTransaction(STORE_PATIENTS, 'readwrite', (store) => store.put(patient)) as Promise<string>;
  },
  
  deletePatient: async (id: string): Promise<void> => {
    return performTransaction(STORE_PATIENTS, 'readwrite', (store) => store.delete(id));
  },

  // Drugs
  getAllDrugs: async (): Promise<Drug[]> => {
    return performTransaction(STORE_DRUGS, 'readonly', (store) => store.getAll()) as Promise<Drug[]>;
  },
  
  addDrug: async (drug: Drug): Promise<string> => {
    return performTransaction(STORE_DRUGS, 'readwrite', (store) => store.put(drug)) as Promise<string>;
  },

  deleteDrug: async (id: string): Promise<void> => {
    return performTransaction(STORE_DRUGS, 'readwrite', (store) => store.delete(id));
  },

  // Templates
  getAllTemplates: async (): Promise<PrescriptionTemplate[]> => {
    return performTransaction(STORE_TEMPLATES, 'readonly', (store) => store.getAll()) as Promise<PrescriptionTemplate[]>;
  },

  addTemplate: async (template: PrescriptionTemplate): Promise<string> => {
    return performTransaction(STORE_TEMPLATES, 'readwrite', (store) => store.put(template)) as Promise<string>;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    return performTransaction(STORE_TEMPLATES, 'readwrite', (store) => store.delete(id));
  },

  // Settings
  getDoctorProfile: async (): Promise<DoctorProfile | undefined> => {
    return performTransaction(STORE_SETTINGS, 'readonly', (store) => store.get('profile')) as Promise<DoctorProfile | undefined>;
  },

  saveDoctorProfile: async (profile: DoctorProfile): Promise<string> => {
    return performTransaction(STORE_SETTINGS, 'readwrite', (store) => store.put(profile)) as Promise<string>;
  },

  // Prescriptions
  addPrescription: async (prescription: Prescription): Promise<string> => {
    return performTransaction(STORE_PRESCRIPTIONS, 'readwrite', (store) => store.put(prescription)) as Promise<string>;
  },

  getPatientPrescriptions: async (patientId: string): Promise<Prescription[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PRESCRIPTIONS, 'readonly');
      const store = transaction.objectStore(STORE_PRESCRIPTIONS);
      const index = store.index('patientId');
      const request = index.getAll(patientId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
};

// Phase 4: Backup System
export const backupSystem = {
  exportData: async () => {
    const db = await openDB();
    const stores = [STORE_PATIENTS, STORE_DRUGS, STORE_TEMPLATES, STORE_SETTINGS, STORE_PRESCRIPTIONS];
    const data: any = {};
    
    // We need to fetch all data from all stores
    await Promise.all(stores.map(storeName => {
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => {
          data[storeName] = request.result;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    }));

    // Create JSON blob
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TabYar_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData: async (jsonData: string) => {
    const data = JSON.parse(jsonData);
    const db = await openDB();
    const stores = [STORE_PATIENTS, STORE_DRUGS, STORE_TEMPLATES, STORE_SETTINGS, STORE_PRESCRIPTIONS];

    // Transaction to clear old data and add new data
    // Note: This is a heavy operation, doing it sequentially for safety
    for (const storeName of stores) {
      if (data[storeName] && Array.isArray(data[storeName])) {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Clear existing
        store.clear();

        // Add new items
        for (const item of data[storeName]) {
          store.put(item);
        }
        
        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
      }
    }
  }
};