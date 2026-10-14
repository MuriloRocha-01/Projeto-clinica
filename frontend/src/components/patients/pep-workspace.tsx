"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FilePlus2, FileText, Pill, X } from "lucide-react";
import { useClinic } from "@/components/clinic-provider";
import { evolutionTemplates, validateExam } from "@/services/pep";
import type { PepCategory } from "@/types/pep";

const field = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-blue-600";
const labels: Record<PepCategory,string> = { evolution: "Evoluções", prescription: "Prescrições", exam: "Exames anexados" };

export function PepActions({patientId}:{patientId:number}) {
  const {pepEntries,setPepEntries}=useClinic();
  const [template,setTemplate]=useState<keyof typeof evolutionTemplates>("soap");
  const [note,setNote]=useState(evolutionTemplates.soap);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const prescriptionDialog=useRef<HTMLDialogElement>(null);
  const examDialog=useRef<HTMLDialogElement>(null);

  function add(category:PepCategory,title:string,content:string,author:string,file?:File) {
    setPepEntries(entries=>[{id:crypto.randomUUID(),patientId,category,title,content,author,createdAt:new Date().toISOString(),file},...entries]);
    setMessage("Rascunho adicionado ao histórico desta sessão.");
    setError("");
  }
  function saveNote(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.trim() || Object.values(evolutionTemplates).some(value=>value.trim()===note.trim())) {setError("Preencha a evolução antes de salvar o rascunho.");return;}
    const data=new FormData(event.currentTarget);
    const author=String(data.get("author")??"").trim();
    if (!author) {setError("Informe o profissional responsável pelo rascunho.");return;}
    add("evolution",template==="soap"?"Evolução SOAP":"Evolução clínica",note.trim(),author);
    setNote(evolutionTemplates[template]);
  }
  function savePrescription(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=event.currentTarget;const data=new FormData(form);
    const values=["medication","instructions","author"].map(key=>String(data.get(key)??"").trim());
    if(values.some(value=>!value)){setError("Preencha medicamento, orientação e profissional.");return;}
    add("prescription",values[0],values[1],values[2]);form.reset();prescriptionDialog.current?.close();
  }
  async function saveExam(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(busy)return;const form=event.currentTarget;const data=new FormData(form);const file=data.get("file");
    const title=String(data.get("title")??"").trim();
    if(!(file instanceof File)||!title){setError("Informe o título e selecione um arquivo.");return;}
    setBusy(true);setError("");
    try {
      const invalid=await validateExam(file);if(invalid){setError(invalid);return;}
      const used=pepEntries.reduce((sum,entry)=>sum+(entry.file?.size??0),0);
      if(used+file.size>100*1024*1024){setError("Limite de 100 MB de anexos nesta sessão atingido.");return;}
      add("exam",title,String(data.get("description")??"").trim(),"Anexo local de demonstração",file);form.reset();examDialog.current?.close();
    } catch {setError("Não foi possível ler o arquivo. Tente novamente.");} finally {setBusy(false);}
  }
  return <>
    <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><FileText size={18} className="text-blue-600"/><h2 className="font-bold">Evolução clínica</h2></div>
      <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Ambiente de demonstração. Use somente dados fictícios. Rascunhos e anexos ficam nesta sessão e são perdidos ao recarregar a página.</p>
      <form onSubmit={saveNote} className="mt-4 space-y-4"><label className="block text-xs font-semibold text-slate-600">Modelo<select value={template} onChange={e=>{setTemplate(e.target.value as keyof typeof evolutionTemplates);}} className={field}><option value="soap">SOAP</option><option value="followup">Retorno</option><option value="blank">Texto livre</option></select></label>
      <button type="button" onClick={()=>setNote(current=>current.trim() ? current+"\n\n"+evolutionTemplates[template] : evolutionTemplates[template])} className="text-xs font-semibold text-blue-600 hover:underline">Inserir modelo no texto</button>
      <label className="block text-xs font-semibold text-slate-600">Anotações<textarea value={note} onChange={e=>setNote(e.target.value)} required maxLength={12000} rows={12} className={field}/></label>
      <label className="block text-xs font-semibold text-slate-600">Profissional (informado, sem autenticação)<input name="author" required maxLength={120} className={field}/></label>
      <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Salvar rascunho de evolução</button></form>
    </section>
    <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-bold">Prescrições e exames</h2><button onClick={()=>{setError("");prescriptionDialog.current?.showModal();}} className="overview-interactive flex w-full items-center gap-2 rounded-xl bg-blue-50 p-3 text-left text-sm font-semibold text-blue-700"><Pill size={18}/>Nova prescrição · rascunho</button><button onClick={()=>{setError("");examDialog.current?.showModal();}} className="overview-interactive flex w-full items-center gap-2 rounded-xl border border-slate-200 p-3 text-left text-sm font-semibold"><FilePlus2 size={18}/>Anexar exame PDF / DICOM</button><p className="text-xs leading-5 text-slate-500">Prescrições sem assinatura e sem validade de receita. DICOM disponível para download; visualizador especializado ainda não integrado.</p></section>
    <p role="status" className="text-sm text-blue-700">{message}</p>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    <dialog ref={prescriptionDialog} aria-labelledby="prescription-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-2xl border-0 p-6 shadow-xl backdrop:bg-slate-900/40"><div className="flex items-center justify-between"><h2 id="prescription-title" className="text-lg font-bold">Rascunho de prescrição</h2><button aria-label="Fechar prescrição" onClick={()=>prescriptionDialog.current?.close()} className="rounded-lg p-2 hover:bg-slate-100"><X size={18}/></button></div><p className="mt-2 text-xs text-amber-800">Não é uma receita emitida ou assinada. Não utilizar para dispensação.</p><form onSubmit={savePrescription} className="mt-5 space-y-4"><label className="block text-sm">Medicamento e apresentação<input autoFocus name="medication" required maxLength={200} className={field}/></label><label className="block text-sm">Dose, via, frequência, duração e orientações<textarea name="instructions" required maxLength={4000} rows={5} className={field}/></label><label className="block text-sm">Profissional responsável (informado)<input name="author" required maxLength={120} className={field}/></label>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}<button className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white">Salvar rascunho de prescrição</button></form></dialog>
    <dialog ref={examDialog} aria-labelledby="exam-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-2xl border-0 p-6 shadow-xl backdrop:bg-slate-900/40"><div className="flex items-center justify-between"><h2 id="exam-title" className="text-lg font-bold">Anexar exame</h2><button aria-label="Fechar anexo" disabled={busy} onClick={()=>examDialog.current?.close()} className="rounded-lg p-2 hover:bg-slate-100"><X size={18}/></button></div><p className="mt-2 text-xs text-slate-500">Arquivo local, até 20 MB. Nenhum arquivo será enviado ao servidor.</p><form onSubmit={saveExam} className="mt-5 space-y-4"><label className="block text-sm">Título do exame<input autoFocus name="title" required maxLength={200} className={field}/></label><label className="block text-sm">Observações<textarea name="description" maxLength={4000} rows={3} className={field}/></label><label className="block text-sm">Arquivo PDF ou DICOM<input name="file" type="file" required accept=".pdf,.dcm,.dicom" className={field}/></label>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white disabled:opacity-50">{busy?"Validando arquivo…":"Adicionar anexo à sessão"}</button></form></dialog>
  </>;
}

export function PepHistory({patientId}:{patientId:number}) {
  const {pepEntries}=useClinic();const [category,setCategory]=useState<PepCategory|"all">("all");const [preview,setPreview]=useState<string|null>(null);const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
  const entries=pepEntries.filter(entry=>entry.patientId===patientId&&(category==="all"||entry.category===category));
  function openFile(file:File){setPreview(URL.createObjectURL(file));dialog.current?.showModal();}
  function download(file:File){const url=URL.createObjectURL(file);const a=document.createElement("a");a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Histórico do prontuário</h2><p className="mt-1 text-xs text-slate-500">Rascunhos desta sessão · mais recentes primeiro</p><div className="my-5 flex flex-wrap gap-2">{(["all","evolution","prescription","exam"] as const).map(key=><button key={key} onClick={()=>setCategory(key)} aria-pressed={category===key} className={`rounded-lg px-3 py-2 text-xs font-semibold ${category===key?"bg-blue-600 text-white":"bg-slate-50 text-slate-600"}`}>{key==="all"?"Todos":labels[key]}</button>)}</div>
    {!entries.length&&<p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">Nenhum registro nesta categoria. Use as ações ao lado para começar.</p>}
    <ol className="space-y-4">{entries.map(entry=><li key={entry.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><span className="text-xs font-semibold text-blue-700">{labels[entry.category]} · {entry.category==="exam"?"Local":"Rascunho"}</span><time dateTime={entry.createdAt} className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString("pt-BR")}</time></div><h3 className="mt-2 font-bold">{entry.title}</h3><p className="mt-1 text-xs text-slate-500">{entry.author}</p><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{entry.content}</p>{entry.file&&<div className="mt-4 space-y-2"><p className="break-all text-xs text-slate-500">{entry.file.name} · {(entry.file.size/1024/1024).toFixed(2)} MB</p><div className="flex gap-4">{entry.file.name.toLowerCase().endsWith(".pdf")&&<button onClick={()=>openFile(entry.file!)} className="text-sm font-semibold text-blue-600">Visualizar PDF</button>}<button onClick={()=>download(entry.file!)} className="text-sm font-semibold text-blue-600">Baixar arquivo</button></div></div>}</li>)}</ol>
    <dialog ref={dialog} onClose={()=>setPreview(null)} aria-label="Visualização do exame PDF" className="fixed inset-0 m-auto h-[85dvh] w-[calc(100%-2rem)] max-w-4xl rounded-2xl border-0 p-4 shadow-xl backdrop:bg-slate-900/40"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Exame PDF · visualização local</h2><button onClick={()=>dialog.current?.close()} aria-label="Fechar visualização" className="p-2"><X size={18}/></button></div>{preview&&<iframe sandbox="" src={preview} title="Conteúdo do exame PDF" className="h-[calc(100%-4rem)] w-full rounded-xl border border-slate-200"/>}</dialog>
  </section>;
}
