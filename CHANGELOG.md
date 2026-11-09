# Orbe — histórico de versões

A versão é um número inteiro que sobe a cada atualização (`orbe/version.js`).

## v18 — 2026-11-09
- Colar não repete anotação que já existe com o mesmo texto na mesma área.

## v17 — 2026-11-09
- **Colar corrige:** se já existe uma tarefa aberta com o mesmo nome, colar de novo **atualiza** a área, a prioridade,
  a data e a hora (e acrescenta subtarefas novas), sem duplicar e sem contar como adiada. A prévia mostra "atualiza".
- Nova linha **APAGAR | título** para tirar uma tarefa aberta pelo nome.

## v16 — 2026-11-09
- Matriz com nomes para quem organiza só a própria vida: **Faça** (urgente e importante), **Planeje** (importante,
  sem pressa), **Resolva rápido** (urgente, pouco importante: faça logo, sem gastar muito tempo) e **Quando der**
  (nem urgente, nem importante: só se sobrar tempo). As tarefas que já existem continuam no mesmo quadrante.

## v15 — 2026-11-09
- **Colar tarefas e hábitos** (☰ → Colar): cole um texto pronto (montado com o Claude) e o app cria as tarefas com
  área, subárea, prioridade, data, hora e subtarefas, além de hábitos, áreas, subáreas e anotações. Mostra a prévia
  antes de adicionar, avisa o que não entendeu e não repete o que já existe.

## v14 — 2026-11-08
- **Subtarefas:** na tarefa, adicione, marque e tire subtarefas. Elas aparecem embaixo da tarefa no Foco, nos Planos
  e no Caderno, e dá para marcar direto na lista. Concluir a tarefa marca as subtarefas que faltavam.
- Nas métricas (Pulso, progresso do dia), **cada subtarefa conta como uma tarefa** com a mesma prioridade, data e
  área da tarefa principal.

## v13 — 2026-11-07
- **Ícones animados**, desenhados em partes (a animação mostra o que o ícone é):
  - Abas: Foco (porta abrindo), Planos (escrevendo o plano), Caderno (vento nas páginas), Constância (caneta marcando
    a lista) e Pulso (traçando o batimento) — animam ao tocar na aba.
  - Símbolo do Orbe (lua em órbita, ao abrir), Menu (onda, ao tocar), Sincronizado (dados subindo, ao terminar de sincronizar).
  - Feito (caneta marcando, ao concluir uma tarefa), Data (folha arrancada) e Hora (areia caindo) ao escolher na nova tarefa,
    Editar (assinatura), Adiada (pulando pro próximo dia, quando a data muda) e Anotação (alfinete, ao anotar).
  - Ícones das áreas e subáreas se preenchem ao abrir uma área no Caderno.

## v12 — 2026-11-07
- **Nome da saudação por conta:** cada conta guarda o próprio nome. Ao trocar de conta, a saudação e o campo
  "Teu nome" mostram o nome daquela conta (conta nova começa sem nome).
- Entrar, trocar de conta e sair agora ficam numa **janela própria** (Configurações → Conta → Entrar / Trocar ou sair),
  separada do nome. Assim o nome de uma conta não passa para a outra.

## v11 — 2026-11-07
- **Contas separadas:** cada conta do Supabase tem o próprio espaço no aparelho. Ao sair, a tela fica vazia; ao
  entrar com outra conta, aparecem só as tarefas, áreas, anotações e hábitos dela.
- Se o aparelho tiver tarefas guardadas sem conta, ao entrar o app pergunta se elas vão para essa conta.
- Configurações: novo botão **Apagar todos os dados desta conta** (some aqui e nos outros aparelhos dela),
  para limpar uma conta que ficou com dados de outra.

## v10 — 2026-11-07
- Nomes e ícones escolhidos item por item:
  - Abas: **Foco**, **Planos**, **Caderno**, **Constância** e **Pulso** (ícones de Planos e Pulso novos); símbolo do Orbe novo.
  - Ícones arredondados um pouco mais visíveis e a aba ativa fica preenchida.
  - Seções: "Em foco agora", "Não esqueça", "Para amanhã", "Sem prazo" e "Desempenho".
  - Botões: "Anotar tarefa", "+ Área", "Nova subárea", "+ Hábito" e "Pronto".
  - Matriz: Faça, Planeje, Delegar e Solte. Hábitos: Construir e Cortar. Níveis: Poeira → Órbita.
  - Pulso: Pontuais, Adiadas, Vencidas e Dias até concluir.
  - Ícones novos de hora, editar, excluir, menu, feito, sincronizado, das áreas Profissional e Espiritual e das
    subáreas Clientes, Projetos, Estudos, Saúde, Finanças e Leitura.

## v9 — 2026-11-07
- Hábitos em **grade dia × hábito** (como o rastreador do bullet journal): cada linha é um hábito, cada coluna um dia,
  na semana ou no mês inteiro (rola para o lado e abre no dia de hoje). Toque no quadradinho para marcar.
- Cada marca guarda **quando** foi feita. Marcar um dia depois aparece em cinza com um pontinho ("marcado depois")
  e conta menos na nota.
- Cada hábito tem uma **meta em dias** (21, 30, 66, 90 ou qualquer número).
- **Análise de cada hábito** com nota de 0 a 100 e 10 níveis (Semente → Automático), somando critérios:
  força do hábito (média que pesa mais os dias recentes), constância dos últimos 14 dias, marcou no mesmo dia,
  progresso na meta, recuperação depois de uma falha e horário regular. Mostra sequência atual, melhor sequência,
  dias feitos, quantos foram marcados depois e o atraso médio, o dia de formação (referência de 66 dias) e uma
  dica do que mais faz a nota subir. "Como a nota é calculada" explica tudo.

## v8 — 2026-11-05
- Nova aba **Hábitos**, como o rastreador do bullet journal: cada hábito tem uma grade de quadradinhos da semana
  ou do mês. **Bons** (quero fazer): toque no ✓ quando fizer, e o quadradinho fica preto. **Ruins** (quero evitar):
  toque no × se fizer; os dias em que tu evitou ficam em petróleo.
- Cada hábito mostra a sequência (dias seguidos ou dias sem) e a porcentagem da semana ou do mês. Dá para marcar
  ou desmarcar dias passados tocando no quadradinho e ver semanas e meses anteriores.
- Criar e editar hábito com nome, tipo (bom ou ruim) e ícone.
- No Hoje aparece **Hábitos de hoje** para marcar rápido. Os hábitos também sincronizam pelo Supabase.

## v7 — 2026-11-04
- Botão voltar do Android: fecha a janela aberta, depois volta para Hoje e, em Hoje, só sai do app apertando
  voltar duas vezes seguidas (avisa "Toque em voltar de novo para sair"). Agora funciona também logo ao abrir.
- Ao reabrir o app (até 12 h depois), ele volta para onde estava: aba, rolagem, filtros, dia da agenda,
  áreas abertas, parte aberta e a tarefa que estava sendo escrita.

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
