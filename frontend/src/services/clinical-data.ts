import type { ClinicalProfile } from "@/types/clinical";

// Todos os dados clínicos deste arquivo são fictícios, sem ligação com prontuários reais.
export const demoClinicalProfiles: Record<number, ClinicalProfile> = Object.fromEntries(Array.from({ length: 8 }, (_, index) => [index + 1, {
  birthDate: "1991-05-12", gender: "Não informado", emergencyName: "Alex Costa (contato fictício)", emergencyPhone: "(11) 99999-0200",
  address: "Rua das Flores, 123 · São Paulo, SP", condition: "Acompanhamento de rotina", wellnessScore: 82,
  notes: ["Paciente relata boa adaptação à rotina de acompanhamento. Registro fictício para demonstração da interface.", "Retorno registrado para revisão dos exames e atualização do histórico. Dados demonstrativos."],
  metrics: [
    { id: "heart", label: "Frequência cardíaca", value: "72", unit: "bpm", readings: [76, 74, 80, 75, 73, 74, 72], color: "#ef4444" },
    { id: "pressure", label: "Pressão arterial", value: "120/80", unit: "mmHg", readings: [126, 122, 124, 118, 122, 121, 120], color: "#2563eb" },
    { id: "glucose", label: "Glicose", value: "95", unit: "mg/dL", readings: [102, 98, 96, 100, 94, 97, 95], color: "#f59e0b" },
    { id: "oxygen", label: "SpO₂", value: "98", unit: "%", readings: [97, 98, 98, 97, 99, 98, 98], color: "#8b5cf6" },
  ],
  records: {
    exams: [{ id: 1, date: "2026-10-01", title: "Hemograma", professional: "Dra. Ana Oliveira", result: "Resultado demonstrativo" }, { id: 2, date: "2026-09-15", title: "Glicemia em jejum", professional: "Dr. Lucas Mendes", result: "95 mg/dL (fictício)" }],
    consultations: [{ id: 3, date: "2026-10-01", title: "Consulta de rotina", professional: "Dra. Ana Oliveira", result: "Concluída" }, { id: 4, date: "2026-09-15", title: "Avaliação inicial", professional: "Dr. Lucas Mendes", result: "Concluída" }],
    medications: [{ id: 5, date: "2026-10-01", title: "Medicação de demonstração", professional: "Dra. Ana Oliveira", result: "Exemplo de registro, sem prescrição" }],
  },
} satisfies ClinicalProfile]));
