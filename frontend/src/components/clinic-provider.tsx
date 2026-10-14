"use client";

import { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
import { demoAppointments } from "@/services/dashboard-data";
import type { Appointment } from "@/types/dashboard";

import type { PepEntry } from "@/types/pep";
import type { SystemSettings } from "@/types/settings";
import { demoSettings } from "@/services/settings-data";

interface ClinicState {
  settings: SystemSettings;
  setSettings: Dispatch<SetStateAction<SystemSettings>>;
  pepEntries: PepEntry[];
  setPepEntries: Dispatch<SetStateAction<PepEntry[]>>;
  appointments: Appointment[];
  setAppointments: Dispatch<SetStateAction<Appointment[]>>;
  date: string;
  setDate: Dispatch<SetStateAction<string>>;
}
const ClinicContext = createContext<ClinicState | null>(null);
export function ClinicProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(demoSettings);
  const [pepEntries, setPepEntries] = useState<PepEntry[]>([]);
  const [appointments, setAppointments] = useState(demoAppointments);
  const [date, setDate] = useState("2026-10-08");
  return <ClinicContext.Provider value={{ settings, setSettings, pepEntries, setPepEntries, appointments, setAppointments, date, setDate }}>{children}</ClinicContext.Provider>;
}
export function useClinic() {
  const clinic = useContext(ClinicContext);
  if (!clinic) throw new Error("useClinic requer ClinicProvider");
  return clinic;
}
