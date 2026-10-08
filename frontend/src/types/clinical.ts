export type RecordCategory = "exams" | "consultations" | "medications";
export interface ClinicalRecord { id: number; date: string; title: string; professional: string; result: string; }
export interface HealthMetric { id: string; label: string; value: string; unit: string; readings: number[]; color: string; }
export interface ClinicalProfile { birthDate: string; gender: string; emergencyName: string; emergencyPhone: string; address: string; condition: string; wellnessScore: number; notes: string[]; metrics: HealthMetric[]; records: Record<RecordCategory, ClinicalRecord[]>; }
