"use client";

import { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
import { demoAppointments } from "@/services/dashboard-data";
import type { Appointment } from "@/types/dashboard";

type View = "overview" | "queue" | "patients";
interface ClinicState {
  appointments: Appointment[];
  setAppointments: Dispatch<SetStateAction<Appointment[]>>;
  date: string;
  setDate: Dispatch<SetStateAction<string>>;
  view: View;
  setView: Dispatch<SetStateAction<View>>;
}
const ClinicContext = createContext<ClinicState | null>(null);
export function ClinicProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState(demoAppointments);
  const [date, setDate] = useState("2026-10-08");
  const [view, setView] = useState<View>("overview");
  return <ClinicContext.Provider value={{ appointments, setAppointments, date, setDate, view, setView }}>{children}</ClinicContext.Provider>;
}
export function useClinic() {
  const clinic = useContext(ClinicContext);
  if (!clinic) throw new Error("useClinic requer ClinicProvider");
  return clinic;
}
