README OFICIAL DO REPOSITÓRIO

O conteúdo abaixo será utilizado como base para o README.md.

📦 WMS Inteligente

Sistema corporativo de gestão de estoque, almoxarifado e operações logísticas desenvolvido com .NET, React, React Native e PostgreSQL.

O WMS Inteligente é uma plataforma completa para gerenciamento de materiais e operações dentro de almoxarifados e centros de distribuição.

O projeto integra uma aplicação Web destinada à administração e gestão com um aplicativo Mobile voltado aos operadores do estoque, permitindo controlar todo o fluxo de materiais desde o recebimento até a expedição.

O objetivo é desenvolver uma solução com arquitetura e regras de negócio próximas às encontradas em aplicações corporativas reais, abordando problemas como concorrência, rastreabilidade, inventário, lotes, validade, reservas, custos, NF-e e operações através de códigos de barras.

🎯 Objetivo

Centralizar e automatizar processos de estoque que normalmente dependem de planilhas, conferências manuais e sistemas pouco integrados.

A plataforma busca proporcionar:

rastreabilidade completa;
redução de divergências;
controle de lotes e validades;
localização física de produtos;
inventários mais eficientes;
prevenção de estoque negativo;
controle de reservas;
gestão de recebimentos;
picking orientado;
atualização em tempo real;
informações gerenciais.
🏗️ Arquitetura
                    ┌─────────────────────────┐
                    │       React Web         │
                    │                         │
                    │ Gestão / Administração  │
                    └────────────┬────────────┘
                                 │
                                 │ REST / SignalR
                                 ▼
                    ┌─────────────────────────┐
                    │   ASP.NET Core API      │
                    │       .NET 10           │
                    │                         │
                    │    Business Rules       │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     PostgreSQL 18       │
                    │                         │
                    │ Inventory / Audit       │
                    └─────────────────────────┘
                                 ▲
                                 │
                                 │ REST
                    ┌────────────┴────────────┐
                    │    React Native        │
                    │        Expo            │
                    │                        │
                    │ Scanner / Operations   │
                    └────────────────────────┘

O backend utiliza uma abordagem de Modular Monolith + Clean Architecture, mantendo os diferentes domínios do sistema desacoplados sem introduzir prematuramente a complexidade operacional de microserviços.

🛠️ Tecnologias
Backend






C#
.NET 10 LTS
ASP.NET Core
Entity Framework Core
PostgreSQL
Npgsql
FluentValidation
ASP.NET Core Identity
JWT
SignalR
OpenAPI
OpenTelemetry
Frontend






React
TypeScript
Vite
Tailwind CSS
shadcn/ui
TanStack Query
React Hook Form
Zod
Recharts
Mobile





React Native
Expo
TypeScript
Expo Router
expo-camera
expo-haptics
expo-secure-store
TanStack Query
Infraestrutura





Docker
Docker Compose
GitHub Actions
PostgreSQL
Structured Logging
Health Checks
📦 Principais módulos
Identity
Catalog
Suppliers
Warehouse
Inventory
Receiving
NFe
Orders
Picking
InventoryCount
Costing
Audit
Notifications
Analytics
🔐 Segurança

O sistema será desenvolvido considerando:

autenticação JWT;
refresh tokens;
RBAC;
permissões granulares;
rate limiting;
validação de entrada;
armazenamento seguro de credenciais;
auditoria de operações;
proteção contra estoque negativo;
idempotência;
controle de concorrência.
📊 Controle de Estoque

O estoque utiliza duas estruturas complementares.

Inventory Ledger

Mantém o histórico imutável de todas as movimentações.

+100  RECEBIMENTO
 -20  PICKING
  -2  AJUSTE
----------------
  78  SALDO
Stock Balance

Mantém o saldo atual otimizado.

On Hand:     100
Reserved:     25
Available:    75

Essa combinação oferece desempenho sem perder rastreabilidade.

📍 Endereçamento

O sistema modela fisicamente o armazém:

Warehouse
   ↓
Zone
   ↓
Aisle
   ↓
Rack
   ↓
Level
   ↓
Bin

Exemplo:

A-03-07-02-04
📱 Aplicativo Mobile

O aplicativo é destinado aos operadores do estoque.

Principais operações:

leitura de código de barras;
consulta de produtos;
recebimento;
armazenagem;
transferências;
picking;
inventários.

O scanner utiliza feedback visual, sonoro e tátil para reduzir erros operacionais.

📄 NF-e

O sistema possuirá um módulo para importação de XML de NF-e.

Fluxo:

XML
 ↓
Validação
 ↓
Parser
 ↓
Fornecedor
 ↓
Itens
 ↓
Mapeamento de Produtos
 ↓
Conferência
 ↓
Recebimento

A importação não movimenta estoque automaticamente antes da conferência do usuário.

📦 Lotes e validade

Produtos poderão possuir controle de:

lote;
fabricação;
validade.

Para produtos perecíveis, o sistema poderá aplicar:

FEFO

First Expired, First Out

Priorizando durante a separação os lotes com vencimento mais próximo.

🔎 Inventário

Suporte planejado para:

inventário geral;
inventário rotativo;
contagem por endereço;
contagem por produto;
contagem cega;
recontagem;
análise de divergências.
⚡ Atualização em tempo real

Através do SignalR, movimentações realizadas pelo aplicativo poderão atualizar imediatamente a interface administrativa.

Mobile
  ↓
API
  ↓
Movimentação
  ↓
PostgreSQL
  ↓
SignalR
  ↓
Dashboard Web

Sem necessidade de atualizar manualmente a página.

📊 Analytics

Indicadores planejados:

valor do estoque;
Curva ABC;
giro;
aging;
produtos abaixo do mínimo;
ruptura;
produtos próximos ao vencimento;
ocupação;
movimentações;
produtividade operacional.
🧪 Testes

O projeto terá:

Unit Tests;
Integration Tests;
Architecture Tests;
testes de componentes;
testes E2E;
testes de concorrência.

Cenários críticos incluem:

✓ impedir estoque negativo
✓ impedir NF-e duplicada
✓ impedir reserva superior ao saldo
✓ detectar item incorreto no picking
✓ impedir operações sem autorização
✓ impedir duplicação causada por retry
✓ garantir consistência em operações concorrentes
🐳 Docker

A infraestrutura poderá ser iniciada através de Docker Compose.

Docker Compose
│
├── PostgreSQL
├── ASP.NET Core API
└── React Web
🗂️ Estrutura
/
├── backend/
│   ├── src/
│   │   ├── Wms.Api/
│   │   ├── Wms.Application/
│   │   ├── Wms.Domain/
│   │   └── Wms.Infrastructure/
│   └── tests/
│
├── web/
├── mobile/
├── infra/
├── docs/
├── scripts/
├── .github/
├── docker-compose.yml
└── README.md
🛣️ Roadmap
Fase 0 — Engenharia

Requisitos

Regras de negócio

Arquitetura

Banco

Diagramas

ADRs

Fase 1 — Fundação

Backend

Frontend

PostgreSQL

Docker

CI

Fase 2 — Segurança

Usuários

Login

Roles

Permissões

JWT

Refresh Tokens

Fase 3 — Catálogo

Produtos

Categorias

Unidades

Barcodes

Fornecedores

Fase 4 — Armazém

Warehouses

Zones

Aisles

Racks

Levels

Bins

Fase 5 — Estoque

Lotes

Stock Balance

Inventory Ledger

Entradas

Saídas

Transferências

Ajustes

Reservas

Concorrência

Idempotência

Fase 6 — Inventário

Contagem

Contagem cega

Recontagem

Divergências

Ajustes

Fase 7 — NF-e

Upload XML

Parser

Product Matching

Recebimento

Custo Médio

Fase 8 — Mobile

Login

Scanner

Consulta

Recebimento

Movimentação

Inventário

Fase 9 — Pedidos

Orders

Reservations

Status

Fase 10 — Picking

Picking

FEFO

Scanner

Conferência

Expedição

Fase 11 — Realtime

SignalR

Alertas

Dashboard em tempo real

Fase 12 — Analytics

Dashboard

Curva ABC

Giro

Aging

Ocupação

Fase 13 — Advanced WMS

Mapa 2D

Mapa 3D

Heatmap

Roteirização de Picking

🔮 Evoluções futuras

Possíveis evoluções:

otimização automática de slotting;
algoritmos de roteirização;
previsão de demanda;
previsão de ruptura;
sugestão automática de compras;
detecção de anomalias;
operação offline;
integrações com ERP;
leitores industriais;
etiquetas;
impressão térmica;
múltiplos centros de distribuição.
🎓 Objetivo acadêmico e profissional

Além de resolver um problema empresarial real, o projeto foi concebido para aplicar conhecimentos modernos de Engenharia de Software, incluindo:

arquitetura;
APIs;
segurança;
concorrência;
transações;
bancos relacionais;
desenvolvimento Web;
desenvolvimento Mobile;
testes;
DevOps;
integração contínua;
observabilidade.
👥 Equipe

Projeto desenvolvido em grupo por estudantes de Análise e Desenvolvimento de Sistemas.

📌 Status

🚧 Em planejamento e desenvolvimento.

O projeto será desenvolvido incrementalmente, priorizando estabilidade, testes e integração antes da implementação de funcionalidades avançadas.

📜 Licença

A licença do projeto será definida pela equipe antes da primeira versão pública.

<p align="center"> <strong>WMS Inteligente</strong><br> Sistema de Gestão de Estoque e Operações Logísticas </p>
