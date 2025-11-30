
export interface Patient {
  id: string;
  fullName: string;
  gender: 'male' | 'female';
  age: number;
  weight: number;
  medicalHistory: string;
  allergies: string;
  phoneNumber?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Drug {
  id: string;
  name: string;
  defaultInstruction?: string;
}

export interface PrescriptionItem {
  id: string;
  drugName: string;
  dosage: string;
  instruction: string;
}

export interface PrescriptionTemplate {
  id: string;
  title: string;
  diagnosis: string;
  items: PrescriptionItem[];
}

export interface DoctorProfile {
  id: string;
  fullName: string;
  specialty: string;
  medicalCouncilNumber: string;
  address?: string;
  phoneNumber?: string;
  logo?: string; // Base64 encoded image string
}

export interface VitalSigns {
  bp?: string; // Blood Pressure
  pr?: string; // Pulse Rate
  rr?: string; // Respiration Rate
  temp?: string; // Temperature
  weight?: string; // Current weight during visit
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string; // Denormalized for easier listing
  date: number;
  diagnosis: string;
  vitalSigns: VitalSigns;
  items: PrescriptionItem[];
}
