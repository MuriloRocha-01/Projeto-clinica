import { notFound } from "next/navigation";
import { PatientProfile } from "@/components/patients/patient-profile";
export default async function PatientPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id)<1) notFound();
  return <PatientProfile patientId={Number(id)} />;
}
