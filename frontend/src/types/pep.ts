export type PepCategory = "evolution" | "prescription" | "exam";
export interface PepEntry { id: string; patientId: number; category: PepCategory; title: string; content: string; author: string; createdAt: string; file?: File; }
