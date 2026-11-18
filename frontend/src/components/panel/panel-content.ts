import type { Scene } from "./panel-illustrations";

// Conteúdo que gira no lado esquerdo do painel e a faixa que corre embaixo. A clínica pode editar estes textos.
// "ribbon" é a fita colorida do canto (curta!); "ribbonColor" precisa de texto branco legível (700 ou mais escuro).
export interface Slide { id: Scene; ribbon: string; ribbonColor: string; title: string; text: string }

export const slides: Slide[] = [
  {
    id: "bem-vindo", ribbon: "Bem-vindo", ribbonColor: "bg-brand-700",
    title: "Cuidar de você é o nosso começo",
    text: "Aguarde ser chamado pela senha e pelo nome neste painel. Já já chega a sua vez.",
  },
  {
    id: "prioridade", ribbon: "Prioridade", ribbonColor: "bg-violet-700",
    title: "Atendimento prioritário garantido por lei",
    text: "Idosos, gestantes, lactantes, pessoas com deficiência e quem está com criança de colo são atendidos primeiro.",
  },
  {
    id: "agua", ribbon: "Dica de saúde", ribbonColor: "bg-cyan-700",
    title: "Aproveite a espera: hidrate-se",
    text: "Beber água ao longo do dia ajuda o corpo a funcionar melhor.",
  },
  {
    id: "maos", ribbon: "Dica de saúde", ribbonColor: "bg-emerald-700",
    title: "Lave bem as mãos",
    text: "Água e sabão por pelo menos 20 segundos, ou álcool em gel, protegem você e quem está por perto.",
  },
  {
    id: "retorno", ribbon: "Lembrete", ribbonColor: "bg-amber-700",
    title: "Saia daqui com o retorno marcado",
    text: "Pergunte na recepção pelo próximo horário disponível e deixe a próxima consulta combinada.",
  },
  {
    id: "duvidas", ribbon: "Ajuda", ribbonColor: "bg-rose-700",
    title: "Ficou com alguma dúvida?",
    text: "Fale com a recepção. Ajudamos com agendamentos, remarcações e informações sobre o seu atendimento.",
  },
];

export const tickerText =
  "SEJA BEM-VINDO! AGUARDE SER CHAMADO PELA SENHA E PELO NOME  •  ATENDIMENTO PRIORITÁRIO PARA IDOSOS, GESTANTES E PESSOAS COM DEFICIÊNCIA  •  DÚVIDAS? FALE COM A RECEPÇÃO  •";
