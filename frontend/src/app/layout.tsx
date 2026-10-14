import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/layout/footer";
import { ClinicProvider } from "@/components/clinic-provider";

export const metadata: Metadata = {
  title: "Cliniq | Gestão da clínica",
  description: "Agenda, recepção e gestão de pacientes em um só lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" data-scroll-behavior="smooth"><body id="top" className="flex min-h-screen flex-col"><ClinicProvider><div className="flex-1">{children}</div><Footer /></ClinicProvider></body></html>;
}
