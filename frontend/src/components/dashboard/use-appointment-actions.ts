"use client";

import { useState } from "react";
import { useClinic } from "@/components/clinic-provider";
import { demoClockTime } from "./use-demo-clock";
import { appointmentTransitionError } from "@/services/appointment-workflow";
import { statusLabels, type Appointment, type AppointmentStatus } from "@/types/dashboard";

export function useAppointmentActions() {
  const { appointments, setAppointments } = useClinic();
  const [feedback, setFeedback] = useState({ text: "", error: false });
  function changeStatus(item: Appointment, target: AppointmentStatus) {
    const current = appointments.find(appointment => appointment.id === item.id);
    if (!current) { setFeedback({ text: "Agendamento não encontrado.", error: true }); return; }
    const error = appointmentTransitionError(appointments, current, target);
    if (error) { setFeedback({ text: error, error: true }); return; }
    const checkInAt = demoClockTime();
    setAppointments(items => {
      const latest = items.find(appointment => appointment.id === item.id);
      if (!latest || appointmentTransitionError(items, latest, target)) return items;
      return items.map(appointment => appointment.id === item.id ? { ...appointment, status: target, checkInAt: target === "chegou" ? checkInAt : appointment.checkInAt } : appointment);
    });
    setFeedback({ text: `${current.patient.name}: ${statusLabels[target].toLocaleLowerCase("pt-BR")}.`, error: false });
  }
  function clearFeedback() { setFeedback({ text: "", error: false }); }
  return { changeStatus, feedback, clearFeedback };
}
