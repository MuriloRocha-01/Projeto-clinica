import type { Metadata } from "next";
import { CallPanel } from "@/components/panel/call-panel";

export const metadata: Metadata = { title: "Painel de chamada | Cliniq" };

export default function PainelPage() {
  return <CallPanel />;
}
