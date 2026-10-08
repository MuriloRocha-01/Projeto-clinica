This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Dashboard Cliniq

Tela em `src/app/page.tsx`, com navbar renderizada no servidor e dashboard interativo em `src/components/dashboard`. Tipos estritos em `src/types/dashboard.ts`; dados fictícios em `src/services/dashboard-data.ts`.

Execute `npm run dev` nesta pasta (ou `npm run dev:frontend` na raiz) e abra http://localhost:3000.

A demonstração possui filtros de data, profissional, status e busca; check-in, chamada e conclusão; ficha de paciente; cadastro local de agendamento; exportação CSV. Métricas e resumos acompanham as alterações. A tabela usa rolagem horizontal em telas pequenas. Diálogos nativos suportam teclado e Escape.

Os dados não são persistidos: recarregar restaura a demonstração de 08/10/2026. Perfil e gráfico utilizam dados fictícios. O dashboard não envia alterações à API Go e não recebe eventos externos em tempo real. A conexão futura deve substituir os dados de demonstração e as atualizações locais pelos endpoints existentes.

### Particular e convênios

O agendamento possui tipo de atendimento (Particular, Unimed ou Bradesco Saúde) e valor em centavos. O formulário permite informar o preço particular ou o valor contratado para faturar ao convênio. Fila, ficha e cartões de pacientes exibem a identificação; o filtro por tipo também ajusta as métricas e o resumo financeiro. O CSV respeita todos os filtros e inclui tipo e valor.

O resumo financeiro considera data, profissional e tipo de atendimento; busca textual e status filtram apenas a lista/CSV. Valores previstos incluem os agendamentos do recorte, e valores concluídos apenas consultas concluídas. Nenhum valor representa pagamento confirmado ou recebimento do convênio. Persistência, cobrança e processamento de lotes não estão implementados nesta demonstração frontend.

Teste dos cálculos: `node --experimental-strip-types tests/billing.test.mts` (Node 24).

### Organização por módulos

O menu superior alterna visualizações independentes na mesma rota, mantendo agendamentos e edições compartilhados durante a sessão:
- Visão geral: KPIs, movimento da agenda, progresso e financeiro da data selecionada (`overview.tsx`).
- Agenda: fila ordenada por etapa e chegada, com ações de atendimento (`patient-table-view.tsx`).
- Pacientes: tabela ordenada por nome, contato e acesso à ficha editável, para a data selecionada (mesmo componente de tabela).

`dashboard.tsx` coordena navegação, estado e diálogos; `queue-table.tsx` renderiza as colunas corporativas. Os filtros de nome/telefone, profissional, status e convênio ficam dentro de cada visualização de tabela; não alteram os totais da Visão geral. Exportar tabela respeita esses filtros. Trocar de módulo reinicia os filtros, mas preserva as edições. Recarregar o navegador reinicia a demonstração.

### Agenda em grade e perfil do paciente

- `src/components/calendar/calendar-grid.tsx`: grade semanal de segunda a sábado, das 09:00 às 16:00; navegação entre semanas, filtro por profissional, avatares com iniciais e cartões com motivo e intervalo. Consultas simultâneas usam colunas separadas. Horários fora da grade aparecem em uma lista própria.
- Na Agenda, alterne entre Grade semanal e Fila do dia. Ao clicar em um cartão, um drawer com foco modal mostra ID, modalidade, data, horário e profissional. Ver Ficha do Paciente abre a rota `/patients/[id]` do App Router.
- `src/components/patients/patient-profile.tsx`: contato, idade, gênero, emergência, próximas consultas, notas e pontuação fictícia de bem-estar.
- `health-analytics.tsx`: indicadores selecionáveis e gráfico SVG de sete registros; a pressão arterial representa apenas a série sistólica.
- `medical-records.tsx`: tabelas alternadas de exames, consultas e medicações.
- `src/components/clinic-provider.tsx`: estado compartilhado de agenda, data e visualização. Navegar entre rotas preserva as edições durante a sessão; recarregar reinicia os dados de demonstração.

Dados clínicos e consultas adicionais são fictícios (`src/services/clinical-data.ts` e `dashboard-data.ts`). Novos pacientes sem perfil clínico mostram estados vazios. A pontuação de bem-estar é um exemplo visual; não é calculada a partir de sinais vitais. Não há prontuários reais, armazenamento ou integração com o backend neste módulo.

Teste de semana, intervalos e consultas simultâneas: `node --experimental-strip-types tests/calendar.test.mts`. Teste de valores: `node --experimental-strip-types tests/billing.test.mts`.
