import type { Metadata } from "next";
import "./globals.css";
import { ClinicProvider } from "@/components/clinic-provider";

export const metadata: Metadata = {
  title: "Cliniq | Gestão da clínica",
  description: "Agenda, recepção e gestão de pacientes em um só lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><ClinicProvider>{children}</ClinicProvider></body></html>;
}

