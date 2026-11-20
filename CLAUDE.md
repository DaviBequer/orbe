# Orbe

App web estático (sem build) de tarefas, agenda e diário das áreas da vida, publicado como PWA no
GitHub Pages: https://davibequer.github.io/orbe/

Uso pessoal do dono, no **Android** (Chrome) e no **computador**. Layout de celular por padrão; a partir de
900px vira layout de computador (menu lateral, duas colunas, janelas centralizadas, atalhos N e Esc).

## O que tem
Abas (nome na tela → código): Foco → `home`, Planos → `agenda`, Caderno → `areas`, Constância → `habits`, Pulso → `stats`.
Partes de uma área aparecem como "subáreas". Matriz: Faça / Planeje / Resolva rápido / Quando der (antes Delegar/Solte; o colar ainda aceita os nomes antigos); hábitos: Construir / Cortar.
- **Hoje:** topo preto (saudação, progresso, 4 blocos da matriz de Eisenhower que filtram), "Próximo importante",
  tarefas de hoje e atrasadas por prioridade, amanhã (ou próximos dias) e sem data.
- **Agenda:** Semana/Mês, hoje em preto na página da semana; no computador arrasta tarefa para outro dia.
- **Vida:** esferas (equilíbrio da semana por área), áreas que abrem/fecham, partes com tarefas e anotações,
  criar/editar áreas (nome, ícone, cor) e partes.
- **Hábitos:** grade dia × hábito (semana/mês); `DB.habits` (`type` good/bad, `goal` dias, `days` {data: {at: ISO de quando marcou}};
  valor antigo `1` = marcado no dia). Bom: marca = fez; ruim: marca = caiu (dias sem marca = evitados). `hScore()` dá nota
  0–100 por critérios ponderados (força por suavização exponencial, 14 dias, pontualidade do registro, meta, recuperação,
  horário) e 10 níveis; "Hábitos de hoje" no Hoje.
- **Números:** no dia certo, remarcadas, atrasadas, tempo até fazer, gráfico de linha, matriz, as que mais voltam, por área.
- Mudar a data de uma tarefa conta como remarcada (`hist`). `dueState()`: vencida (vermelho `--late`) ou perto, até 2 h (laranja `--soon`).
- Resetar dados: ícone `data-resetall` ao lado da versão nas Configurações → `clearAccount()`.
- Subtarefas em `t.st` = [{id, t, done, doneAt}]. `units()` transforma cada subtarefa numa tarefa com a mesma prioridade,
  data, área e histórico da principal; `measure()` (Pulso) e o progresso do dia contam por unidades.
- Colar texto (☰ → Colar, `parseImport`/`applyImport`): uma linha por item, campos com "|":
  `TAREFA | título | Área > Subárea | Faça/Planeje/Resolva rápido/Quando der | data (hoje, amanhã, sexta, 15/11, vazio) | hora`,
  linhas "- " abaixo = subtarefas; `HABITO | nome | Construir/Cortar | meta`; `AREA | nome`; `SUBAREA | Área > nome`;
  `NOTA | Área > Subárea | texto`; "#" = comentário. Cria áreas/subáreas que faltam. TAREFA com o nome de uma tarefa aberta ATUALIZA os campos que vierem (sem `hist`);
  `APAGAR | título` remove; `LIMPAR | tudo/tarefas/hábitos/anotações` apaga antes de colar (pede confirmação); hábito com nome igual não repete.
- Fazendo agora (cronômetro): botão `.go` (`data-start`) em cada tarefa aberta → `openFocusPop()` pergunta a hora de acabar;
  `FOCI` = [{id, start, end}] em `localStorage['orbe.focus']` (só no aparelho; várias ao mesmo tempo). `tickFocus()` desenha
  `.focus` (z-index 11; com mais de uma, cartão escuro `.fz-list.multi` com uma linha por tarefa, a que acaba antes em cima;
  pílulas no topo quando há janela aberta no celular; altura em `--fzh`); cores por `focusState()` (azul → amarelo ≤50% → vermelho ≤20%/5 min → passou).
  Visual preto e branco: só o tempo, a bolinha e a linha de progresso usam a cor (`--fz`).
  Flutuar: `openPip()` usa Document Picture-in-Picture (Chrome do computador) ou vídeo PiP de um canvas (`drawPip`, celular).
  No computador (≥900px e mouse) `startFocus` já chama `openPip(true)`; se o Document PiP falhar, tenta o vídeo PiP.
  Concluir soma os minutos em `t.spent`.
- Voltar do Android: fecha janela → volta para Hoje → em Hoje sai só com dois toques (trava re-armada no primeiro
  toque, porque o Chrome ignora entradas de histórico sem gesto). Ao reabrir, restaura a tela (`localStorage['orbe.ui']`).

Visual: preto, branco e petróleo (#0F5463), fonte Outfit fina, ícones Material Symbols Rounded (peso 250).
Ícones animados: desenhos SVG em partes em `SV` (app.js) + `svgi(nome)`; `playIc(el)` recoloca a classe `run`; animações `.i-<nome>.run`
no styles.css (abas, logo, menu, sync, feito, data, hora, editar, adiada, nota). Áreas/subáreas: `playFill` (FILL do Material).
Dados em `localStorage['orbe.v1']`. Sincronização opcional com Supabase (fim do `app.js`: `SUPA_URL`/`SUPA_KEY`):
login por e-mail e senha em Configurações; tabela `orbe_data(user_id, data jsonb, updated_at)` com RLS, uma linha por
usuário com o documento inteiro. Cada item tem carimbo `u` (posto em `save()` por comparação) e exclusões ficam em
`DB.del`; `merge()` junta item a item pelo mais recente. Cada conta tem a própria chave local `orbe.v1:<user id>`
(`orbe.uid` guarda a conta atual; `useAccount()` troca ao entrar/sair); sem conta usa `orbe.v1`. `sync()` só grava na conta atual. Biblioteca supabase-js carregada do jsDelivr só se houver chave.

## Apps nativos (pasta `native/`)
Cascas que abrem o site publicado (mudanças no site chegam sozinhas): Android com Capacitor (`capacitor.config.json`,
`android/`, `server.url` = site, user agent `OrbeApp/android/<n>`) e Windows com Tauri (`src-tauri/`, janela "main"
com o site e `window.ORBE_SHELL = {plat:'windows', v}`; comandos `open_timer(height)`, `close_timer`, `update_app(url)`).
No site: `SHELL`/`TAURI()` no app.js. Windows: a janelinha `timer.html` (sem bordas, sempre por cima) conta sozinha a
partir de `localStorage['orbe.fzdata']` e devolve concluir/parar em `orbe.fzcmd` (`nativeData`/`nativeCmds`).
Versão da casca: `native/shell-version.txt` (inteiro). O workflow `native.yml` monta `Orbe.apk` e `Orbe-instalador.exe`
a cada push em `native/` e, com número novo, publica a versão `app-v<n>` no GitHub (downloads em
`releases/latest/download/`). O app confere a API do GitHub (`checkShell`) e pergunta se quer atualizar.
Só aumente `shell-version.txt` quando mudar a parte nativa. APK assinado com `native/orbe-release.p12` + segredo
`ORBE_KEY_PASS` (sempre a mesma chave, senão o Android não atualiza por cima).

## Regra de versão (obrigatória)
Toda alteração no app: some 1 em `self.APP_VERSION` em `version.js` (número inteiro) e adicione
`## v<número> — <data>` no topo do `CHANGELOG.md`. A versão dá nome ao cache do `sw.js`; arquivo novo
usado pelo app entra em `ASSETS` no `sw.js` e no passo "Montar o site" do workflow.

Não use `confirm()`, `alert()` nem inputs nativos de data, hora ou cor (no Android abrem janelas pretas do
sistema). Use as janelas próprias (`askConfirm`, calendário e colunas de hora do app).

## Quando publicar direto e quando perguntar
- Pedido específico: implementar, testar, aumentar a versão e fazer push na `main` (deploy automático).
- Mudança muito grande ou pedido de ideias/opções: apresentar a proposta e publicar só depois de aprovado.

## Publicação
`.github/workflows/pages.yml` publica a `main` no GitHub Pages a cada push (Settings → Pages → Source:
GitHub Actions) e cria a tag `v<versão>`. Falha se o app mudou sem a versão ter sido alterada.
