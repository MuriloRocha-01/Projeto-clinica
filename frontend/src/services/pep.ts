export const evolutionTemplates = {
 soap: "Subjetivo:\n\nObjetivo:\n\nAvaliação:\n\nPlano:\n",
 followup: "Motivo do retorno:\n\nEvolução desde a última consulta:\n\nAchados relevantes:\n\nConduta e acompanhamento:\n",
 blank: "",
};
export async function validateExam(file: File): Promise<string | null> {
 if (!file.size || file.size > 20 * 1024 * 1024) return "Selecione um arquivo de até 20 MB, não vazio.";
 const bytes = new Uint8Array(await file.slice(0,132).arrayBuffer());
 const pdf = file.name.toLowerCase().endsWith(".pdf") && String.fromCharCode(...bytes.slice(0,5)) === "%PDF-";
 const dicom = /\.(dcm|dicom)$/i.test(file.name) && String.fromCharCode(...bytes.slice(128,132)) === "DICM";
 return pdf || dicom ? null : "Arquivo inválido. Use PDF ou DICOM Part 10 (.dcm/.dicom com cabeçalho DICM).";
}
