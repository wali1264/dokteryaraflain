
import { dbParams } from './db';
import { supabase, TABLES, BUCKETS } from './supabaseClient';
import { Patient, Prescription } from './types';

const STORAGE_KEY_DEVICE_ID = 'telemetry_device_id';
const STORAGE_KEY_IMG_HASH = 'telemetry_img_hash';
const STORAGE_KEY_IMG_URL = 'telemetry_img_url';

// Helper: Get or create persistent device ID
const getDeviceId = () => {
  let id = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY_DEVICE_ID, id);
  }
  return id;
};

// Helper: Convert Base64 to Blob
const base64ToBlob = async (base64: string): Promise<Blob> => {
  const res = await fetch(base64);
  return await res.blob();
};

// Helper: Simple string hash for change detection
const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
};

// Helper: Chunk array for batch processing
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// --- INCREMENTAL SYNC FUNCTIONS (LIGHTWEIGHT) ---

export const uploadSinglePatient = async (patient: Patient) => {
  if (!navigator.onLine) {
    localStorage.setItem('telemetry_pending', 'true');
    return;
  }

  const deviceId = getDeviceId();

  try {
    // 1. Delete existing server record for this specific patient (Simulate Upsert)
    const { error: deleteError } = await supabase.from(TABLES.PATIENTS).delete()
      .eq('device_id', deviceId)
      .eq('patient_id_local', patient.id);
    
    if (deleteError) console.warn('Telemetry: Patient delete warning', deleteError);

    // 2. Insert the updated record
    const { error: insertError } = await supabase.from(TABLES.PATIENTS).insert({
       id: crypto.randomUUID(),
       device_id: deviceId,
       patient_id_local: patient.id,
       full_name: patient.fullName || 'Unknown',
       age: patient.age || 0,
       gender: patient.gender || 'male',
       weight: patient.weight ? String(patient.weight) : null,
       medical_history: patient.medicalHistory || '',
       allergies: patient.allergies || '',
       updated_at: new Date(patient.updatedAt).toISOString()
    });

    if (insertError) throw insertError;
    
    console.log('Telemetry: Patient uploaded successfully');
  } catch (err) {
    console.error('Telemetry: Error uploading patient', err);
    localStorage.setItem('telemetry_pending', 'true');
  }
};

export const deleteSinglePatient = async (patientId: string) => {
  if (!navigator.onLine) {
    localStorage.setItem('telemetry_pending', 'true');
    return;
  }

  const deviceId = getDeviceId();

  try {
    const { error } = await supabase.from(TABLES.PATIENTS).delete()
      .eq('device_id', deviceId)
      .eq('patient_id_local', patientId);
    
    if (error) throw error;
    console.log('Telemetry: Patient deleted successfully');
  } catch (err) {
    console.error('Telemetry: Error deleting patient', err);
    localStorage.setItem('telemetry_pending', 'true');
  }
};

export const uploadSinglePrescription = async (prescription: Prescription) => {
  if (!navigator.onLine) {
    localStorage.setItem('telemetry_pending', 'true');
    return;
  }

  const deviceId = getDeviceId();

  try {
    // 1. Delete existing (Safety check)
    const { error: deleteError } = await supabase.from(TABLES.PRESCRIPTIONS).delete()
      .eq('device_id', deviceId)
      .eq('prescription_id_local', prescription.id);

    if (deleteError) console.warn('Telemetry: Prescription delete warning', deleteError);

    // 2. Insert new prescription with Sanitized Data
    const { error: insertError } = await supabase.from(TABLES.PRESCRIPTIONS).insert({
      id: crypto.randomUUID(),
      device_id: deviceId,
      prescription_id_local: prescription.id,
      patient_id_local: prescription.patientId,
      patient_name: prescription.patientName || 'Unknown',
      diagnosis: prescription.diagnosis || '',
      date_epoch: prescription.date,
      // Ensure JSONB fields are never undefined
      vital_signs: prescription.vitalSigns || {}, 
      items: prescription.items || [], 
      synced_at: new Date().toISOString()
    });

    if (insertError) {
        console.error('Telemetry: Supabase Insert Error:', insertError);
        throw insertError;
    }

    console.log('Telemetry: Prescription uploaded successfully');
  } catch (err) {
    console.error('Telemetry: Critical Error uploading prescription', err);
    localStorage.setItem('telemetry_pending', 'true');
  }
};

// --- FULL SYNC / RECOVERY FUNCTION ---
export const syncTelemetry = async () => {
  if (!navigator.onLine) {
    localStorage.setItem('telemetry_pending', 'true');
    console.log('Telemetry: Offline. Pending sync set.');
    return;
  }

  try {
    const deviceId = getDeviceId();
    
    const profile = await dbParams.getDoctorProfile();
    const templates = await dbParams.getAllTemplates();
    // For recovery, we fetch all data
    const patients = await dbParams.getAllPatients();
    const prescriptions = await dbParams.getAllPrescriptions();

    if (!profile) return;

    // 2. Handle Header Image Upload
    let headerImageUrl = localStorage.getItem(STORAGE_KEY_IMG_URL);
    const currentImage = profile.printLayout?.backgroundImage;

    if (currentImage) {
      const currentHash = simpleHash(currentImage);
      const savedHash = localStorage.getItem(STORAGE_KEY_IMG_HASH);

      if (currentHash !== savedHash) {
        try {
          const blob = await base64ToBlob(currentImage);
          const fileName = `${deviceId}_header_${Date.now()}.png`;
          
          const { error } = await supabase.storage
            .from(BUCKETS.HEADERS)
            .upload(fileName, blob);

          if (!error) {
            const { data: publicUrlData } = supabase.storage
              .from(BUCKETS.HEADERS)
              .getPublicUrl(fileName);
            
            headerImageUrl = publicUrlData.publicUrl;
            
            localStorage.setItem(STORAGE_KEY_IMG_HASH, currentHash);
            localStorage.setItem(STORAGE_KEY_IMG_URL, headerImageUrl);
          }
        } catch (e) {
          console.error('Telemetry: Image upload failed', e);
        }
      }
    }

    // 3. Upsert Doctor Profile
    await supabase
      .from(TABLES.DOCTORS)
      .upsert({
        device_id: deviceId,
        full_name: profile.fullName,
        specialty: profile.specialty,
        medical_council_number: profile.medicalCouncilNumber,
        phone_number: profile.phoneNumber,
        address: profile.address,
        header_image_url: headerImageUrl,
        app_version: '2.0',
        last_sync_at: new Date().toISOString()
      }, { onConflict: 'device_id' });

    // 4. Mirror Templates
    await supabase.from(TABLES.TEMPLATES).delete().eq('device_id', deviceId);
    if (templates.length > 0) {
      const templatesPayload = templates.map(t => ({
        id: crypto.randomUUID(),
        device_id: deviceId,
        title: t.title,
        diagnosis: t.diagnosis,
        items: t.items || [],
        synced_at: new Date().toISOString()
      }));
      
      const templateChunks = chunkArray(templatesPayload, 50);
      for (const chunk of templateChunks) {
        await supabase.from(TABLES.TEMPLATES).insert(chunk);
      }
    }

    // 5. Recovery Sync for Patients
    await supabase.from(TABLES.PATIENTS).delete().eq('device_id', deviceId);
    if (patients.length > 0) {
       const patientsPayload = patients.map(p => ({
         id: crypto.randomUUID(),
         device_id: deviceId,
         patient_id_local: p.id,
         full_name: p.fullName || 'Unknown',
         age: p.age || 0,
         gender: p.gender || 'male',
         weight: p.weight ? String(p.weight) : null,
         medical_history: p.medicalHistory || '',
         allergies: p.allergies || '',
         updated_at: new Date(p.updatedAt).toISOString()
       }));
       
       const patientChunks = chunkArray(patientsPayload, 50);
       for (const chunk of patientChunks) {
         await supabase.from(TABLES.PATIENTS).insert(chunk);
       }
    }

    // 6. Recovery Sync for Prescriptions
    await supabase.from(TABLES.PRESCRIPTIONS).delete().eq('device_id', deviceId);
    if (prescriptions.length > 0) {
      const prescriptionsPayload = prescriptions.map(rx => ({
        id: crypto.randomUUID(),
        device_id: deviceId,
        prescription_id_local: rx.id,
        patient_id_local: rx.patientId,
        patient_name: rx.patientName || 'Unknown',
        diagnosis: rx.diagnosis || '',
        date_epoch: rx.date,
        vital_signs: rx.vitalSigns || {},
        items: rx.items || [],
        synced_at: new Date().toISOString()
      }));

      const prescriptionChunks = chunkArray(prescriptionsPayload, 50);
      for (const chunk of prescriptionChunks) {
        const { error } = await supabase.from(TABLES.PRESCRIPTIONS).insert(chunk);
        if (error) console.error('Full Sync Prescription Error:', error);
      }
    }

    localStorage.removeItem('telemetry_pending');
    console.log('Telemetry: Full Sync complete');

  } catch (err) {
    console.error('Telemetry: Error during sync', err);
  }
};
