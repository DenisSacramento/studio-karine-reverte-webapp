# Studio Karine Reverte — TODO

## Banco de Dados / Schema
- [x] Tabela `services` (serviços do salão)
- [x] Tabela `appointments` (agendamentos dos clientes)
- [x] Tabela `offers` (ofertas e novidades da Karine)
- [x] Tabela `offer_reads` (controle de leitura de ofertas por cliente)
- [x] Tabela `business_hours` (horários de funcionamento)
- [x] Tabela `blocked_times` (horários bloqueados pela Karine)
- [x] Estender tabela `users` com campos: phone, birthDate, notes

## Backend (tRPC Routers)
- [x] Router `services`: listar, criar, editar, desativar serviços
- [x] Router `appointments`: criar, listar, confirmar, cancelar, reagendar
- [x] Router `appointments`: listar horários disponíveis por data
- [x] Router `offers`: criar, listar, publicar, arquivar ofertas
- [x] Router `admin`: dashboard com métricas (total clientes, agendamentos do dia, etc.)
- [x] Router `notifications`: envio de email de confirmação de agendamento
- [x] Router `notifications`: envio de email de lembrete 24h antes
- [x] Router `notifications`: envio de email de nova oferta publicada
- [x] Router `users`: atualizar perfil (phone, birthDate)

## Frontend — Identidade Visual
- [x] Paleta de cores: rosa claro, vinho/rosa escuro, branco (index.css)
- [x] Tipografia elegante (Google Fonts: Playfair Display + Lato)
- [x] Logo do studio no header
- [x] Layout responsivo mobile-first

## Frontend — Páginas do Cliente
- [x] Home (landing com hero, serviços em destaque, CTA de agendamento)
- [x] Catálogo de serviços com cards e descrições
- [x] Página de agendamento (seleção de serviço, data, horário)
- [x] Perfil do cliente com histórico de agendamentos
- [x] Página de ofertas e novidades
- [x] Botão flutuante de WhatsApp em todas as páginas

## Frontend — Painel Administrativo
- [x] Dashboard com métricas do dia
- [x] Agenda do dia (lista de agendamentos com status)
- [x] Gerenciamento de agendamentos (confirmar, cancelar, reagendar)
- [x] Gerenciamento de serviços (CRUD)
- [x] Gerenciamento de clientes (lista, detalhes)
- [x] Criação e publicação de ofertas/novidades
- [x] Configuração de horários de funcionamento

## Funcionalidades Extras
- [x] Botão de WhatsApp (11 91092-8534) em todas as páginas
- [x] Notificação por email: confirmação de agendamento
- [x] Notificação por email: lembrete 24h antes
- [x] Notificação por email: nova oferta publicada
- [x] Proteção de rotas admin (apenas role=admin)

## Testes
- [x] Testes do router de agendamentos
- [x] Testes do router de serviços
- [x] Testes do router de ofertas
