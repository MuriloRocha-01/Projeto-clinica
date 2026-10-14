export type UserRole = "admin" | "reception" | "doctor";
export interface ProfessionalSettings {
  id: string; name: string; specialty: string; crm: string; photo: string;
  weekdays: number[]; start: string; end: string; active: boolean;
}
export interface ClinicUser {
  id: string; name: string; email: string; role: UserRole; active: boolean;
}
export interface ConsultationType { id: string; name: string; active: boolean; }
export interface SystemSettings {
  professionals: ProfessionalSettings[];
  users: ClinicUser[];
  consultationTypes: ConsultationType[];
  defaultDuration: number;
  openingTime: string;
  closingTime: string;
  cancellationHours: number;
}
export const roleLabels: Record<UserRole, string> = { admin: "Administrador", reception: "Recepcionista", doctor: "Médico" };
export const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
