# Orbe — histórico de versões

A versão é um número inteiro que sobe a cada atualização (`orbe/version.js`).

## v6 — 2026-11-04
- Botão de olho no campo de senha para ver o que está digitando (toque de novo para esconder).

## v5 — 2026-11-04
- Sincronização ligada ao projeto Supabase do Orbe: em Configurações (engrenagem) dá para criar conta e entrar
  com e-mail e senha; celular e computador ficam com as mesmas tarefas, áreas e anotações.

## v4 — 2026-11-04
- No computador tudo ficou maior: menu, textos, tarefas, agenda, Vida e Números.
- Esferas: os nomes das áreas ficam do lado de fora dos círculos, com espaço, e a porcentagem dentro.
- Sincronização com o Supabase pronta (entrar com e-mail e senha em Configurações; celular e computador
  ficam com as mesmas tarefas). Fica ativa assim que o endereço e a chave do projeto forem colocados no app.

## v3 — 2026-11-04
- O Orbe ganhou repositório e endereço próprios: https://davibequer.github.io/orbe/ (antes ficava dentro do Dalê Tarefas).
  As tarefas salvas no aparelho continuam lá.

## v2 — 2026-11-04
- **Ajustado para computador** (telas a partir de 900px): menu na lateral esquerda com o botão "Nova tarefa",
  conteúdo em duas colunas (Hoje: prioridades à esquerda, próximo importante, amanhã e sem data à direita;
  Agenda: mês à esquerda e semana à direita; Vida: esferas à esquerda e áreas à direita; Números em grade).
- Janelas (nova tarefa, área, configurações) abrem centralizadas; a parte de uma área abre como painel lateral.
- Atalhos: **N** cria uma tarefa e **Esc** fecha a janela aberta.
- No celular nada mudou.

## v1 — 2026-11-04
- Primeira versão publicada, feita a partir do design final das 3 rodadas.
- **Hoje:** topo preto com saudação, progresso do dia e os 4 blocos da matriz de Eisenhower (toque para filtrar);
  "Próximo importante" com a contagem do tempo; tarefas de hoje (e atrasadas) agrupadas por prioridade; amanhã
  (ou os próximos dias) e as tarefas sem data.
- **Nova tarefa** em tela cheia: data já com o dia de hoje e calendário próprio; hora vazia com duas colunas
  (horas e minutos de 10 em 10) que rolam com o dedo ou arrastando com o mouse; área, parte e prioridade na matriz.
- Tocar numa tarefa abre para editar ou excluir. Mudar a data conta como **remarcada**.
- **Agenda:** Semana ou Mês, com o dia de hoje em preto na página da semana. No computador dá para arrastar uma
  tarefa para outro dia.
- **Vida:** esferas com o equilíbrio da semana, áreas que abrem e fecham, partes com tarefas e anotações,
  criar e editar áreas (nome, ícone e cor) e partes.
- **Números:** no dia certo, remarcadas, atrasadas, tempo até fazer, gráfico de linha, matriz, as que mais voltam
  e por área, por semana ou mês.
- Funciona sem internet e instala como app (PWA). Os dados ficam só no aparelho.
