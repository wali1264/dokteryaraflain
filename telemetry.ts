
import { dbParams } from './db';
import { supabase, TABLES, BUCKETS } from './supabaseClient';

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

export const syncTelemetry = async () => {
  // 1. Check Internet Connection
  if (!navigator.onLine) {
    // Flag for sync when online
    localStorage.setItem('telemetry_pending', 'true');
    console.log('Telemetry: Offline. Pending sync set.');
    return;
  }

  try {
    const deviceId = getDeviceId();
    const profile = await dbParams.getDoctorProfile();
    const templates = await dbParams.getAllTemplates();

    if (!profile) return;

    // 2. Handle Header Image Upload (Only if changed)
    let headerImageUrl = localStorage.getItem(STORAGE_KEY_IMG_URL);
    const currentImage = profile.printLayout?.backgroundImage;

    if (currentImage) {
      const currentHash = simpleHash(currentImage);
      const savedHash = localStorage.getItem(STORAGE_KEY_IMG_HASH);

      if (currentHash !== savedHash) {
        // Image changed, need upload
        try {
          const blob = await base64ToBlob(currentImage);
          // Use a fixed name to overwrite (if policy allows) or unique name
          // Using unique name guarantees update and avoids browser caching issues in admin panel
          const fileName = `${deviceId}_header_${Date.now()}.png`;
          
          const { data, error } = await supabase.storage
            .from(BUCKETS.HEADERS)
            .upload(fileName, blob);

          if (!error) {
            const { data: publicUrlData } = supabase.storage
              .from(BUCKETS.HEADERS)
              .getPublicUrl(fileName);
            
            headerImageUrl = publicUrlData.publicUrl;
            
            // Update local cache
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

    // 4. Mirror Templates (Delete Old -> Insert New)
    // First, delete all templates for this device to ensure we don't have duplicates/stale data
    await supabase
      .from(TABLES.TEMPLATES)
      .delete()
      .eq('device_id', deviceId);

    // Insert current snapshot
    if (templates.length > 0) {
      const templatesPayload = templates.map(t => ({
        id: crypto.randomUUID(), // New UUID for the archive record
        device_id: deviceId,
        title: t.title,
        diagnosis: t.diagnosis,
        items: t.items, // JSONB
        synced_at: new Date().toISOString()
      }));

      await supabase.from(TABLES.TEMPLATES).insert(templatesPayload);
    }

    // Clear pending flag
    localStorage.removeItem('telemetry_pending');
    console.log('Telemetry: Sync complete');

  } catch (err) {
    console.error('Telemetry: Error during sync', err);
  }
};
