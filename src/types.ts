export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
}

export interface LabResult {
  id: number;
  date: string;
  creatinine: number | null;
  urea: number | null;
  potassium: number | null;
  hemoglobin: number | null;
  tacrolimus: number | null;
}

export interface VitalSigns {
  id: number;
  date: string;
  systolic: number | null;
  diastolic: number | null;
  weight: number | null;
  temperature: number | null;
}
