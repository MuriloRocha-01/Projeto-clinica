import { redirect, notFound } from "next/navigation";
export default async function LegacyPatient({ params }: { params: Promise<{id:string}> }) { const {id}=await params; if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id)<1) notFound(); redirect(`/dashboard/pacientes/${id}`); }
