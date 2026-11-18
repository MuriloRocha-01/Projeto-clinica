# Guia de Arquitetura e Padrões de Código - Sistema de Clínicas (SaaS)

Este documento define as regras de arquitetura, design, padrões de código e diretrizes de refatoração para o desenvolvimento deste projeto (Frontend Next.js + Backend Go).

## 1. Stack Tecnológica
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide React.
- **Backend:** Go (Golang), PostgreSQL, Arquitetura Limpa (Clean Architecture).
- **Estilo Visual (Design System):** 
  - Interface limpa estilo *Clean Medical / Enterprise*.
  - Fundo geral em Milk White (`bg-canvas`, `#F7F4F1`).
  - Containers, cartões e tabelas brancos com bordas arredondadas pronunciadas (`rounded-2xl`) e sombras suaves (`shadow-sm`).
  - Paleta da marca em tokens, definidos em `frontend/src/app/globals.css`: `brand-*` (Forest Green `#244F28` nas ações principais, Soft Lime `#E3FAA5` nos blocos suaves), `accent` (Electric Lime `#D3FF5B`, só para destaques), `ink` e `muted` (textos) e `line` (bordas). Badges de status mantêm cores semânticas (rose, amber, emerald, violet).

## 2. Padrões de Código e Boas Práticas (Frontend - Next.js/TypeScript)
- **Tipagem Estrita:** Evite o uso de `any`. Todas as entidades (Pacientes, Agendamentos, Profissionais, Fila) devem possuir interfaces ou types bem definidos.
- **Componentização:** Mantenha os componentes pequenos e reutilizáveis. Separe a lógica de negócio dos componentes visuais sempre que possível.
- **Client vs Server Components:** Utilize Server Components por padrão no Next.js. Adicione `'use client'` apenas estritamente onde houver interatividade (ex: botões de ação, formulários, estados locais).
- **Organização de Pastas:**
  - `src/app/`: Rotas e páginas da aplicação (App Router).
  - `src/components/`: Componentes globais reutilizáveis (`ui/`, `layout/`).
  - `src/services/`: Camada de comunicação com a API (Axios/Fetch).
  - `src/types/`: Interfaces e tipos TypeScript globais.

## 3. Padrões de Código e Boas Práticas (Backend - Go)
- **Clean Architecture:** Separação clara entre camadas:
  - `cmd/`: Ponto de entrada da aplicação.
  - `internal/handlers`: Controladores HTTP (rotas e validação de payload).
  - `internal/services`: Regras de negócio da aplicação.
  - `internal/repository`: Camada de acesso ao banco de dados (PostgreSQL).
- **Concorrência Segura:** Uso consciente de *Goroutines* e *Channels* para rotinas em background (como o worker de notificações).
- **Tratamento de Erros:** Sempre trate os erros explicitamente em Go (`if err != nil`), retornando mensagens claras para o cliente da API.

## 4. Acessibilidade (a11y) e Semântica HTML
- Utilize elementos semânticos do HTML (`nav`, `main`, `section`, `article`, `aside`) em vez de apenas `div` genéricas.
- Garanta que botões interativos tenham atributos `aria-label` quando necessário e que elementos focáveis possuam *outline* visível para navegação por teclado.

## 5. Performance e Otimização
- Evite que a aplicação fique lenta conforme cresce.
- No Next.js, utilize Server Components por padrão para reduzir o *bundle* do cliente.
- Em listas grandes (como a lista de pacientes ou histórico de agendamentos), implemente paginação ou virtualização de componentes.
- Evite re-renderizações desnecessárias no React utilizando `useMemo` ou `useCallback` apenas quando houver gargalos mensuráveis.

## 6. Diretrizes de Refatoração
Sempre que for solicitado a revisar ou refatorar o código, siga rigorosamente esta ordem de prioridade:
1. **Legibilidade e Clean Code:** Funções e componentes devem ser coesos, pequenos e fáceis de ler.
2. **Consistência Visual:** Respeite o Design System estabelecido (cantos arredondados, tokens da paleta em `globals.css`, espaçamentos consistentes; não use classes cruas `slate-*` ou `blue-*`).
3. **Tipagem e Segurança:** Garanta que nenhuma alteração quebre os tipos do TypeScript ou introduza comportamentos indesejados nas requisições da API.
4. **Performance e Acessibilidade:** Valide semântica HTML, uso correto de Server/Client components e eficiência de renderização.