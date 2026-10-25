# Show do Cristão — Roteiro de Desenvolvimento Passo a Passo

Este documento serve como o **guia de acompanhamento** de todo o ciclo de desenvolvimento do aplicativo. Cada etapa é independente, possui objetivos claros e critérios de validação para que você possa acompanhar cada linha de evolução.

Cada etapa também traz uma seção **"Pontos a validar"**: são dúvidas e sugestões de melhoria que **ainda não foram decididas**. A ideia é discutir cada uma delas ao chegar na etapa correspondente, testando na própria aplicação, e registrar o resultado no [Registro de Decisões](#-registro-de-decisões).

## Regras de Trabalho

- **Commits e envio ao GitHub (`git commit` / `git push`) só são feitos após autorização explícita do Matheus**, depois que ele validar os arquivos alterados. Ao terminar uma etapa, o assistente apresenta o resumo das mudanças e aguarda a aprovação.
- Antes de alterar código em uma nova etapa, a proposta da etapa e seus "Pontos a validar" são apresentados e discutidos primeiro.

---

## Progresso Geral

- [x] **Etapa 0:** Preparação de Ambiente & Estrutura de Pastas *(Concluído)*
- [x] **Etapa 1:** Configuração do Ecossistema Base (`package.json`, Vite, TypeScript & Tailwind - Paleta IPB) *(Concluído)*
- [x] **Etapa 2:** Integração com o Electron (Janela Desktop Nativa, Segurança & Funcionamento Offline) *(Concluído)*
- [x] **Etapa 2.1:** Migração do Tailwind CSS 3 → 4 *(Concluído)*
- [x] **Etapa 2.2:** Atualização do Vite 6 → 8 *(Concluído)*
- [x] **Etapa 3:** Modelagem de Dados, Motor de Regras & Banco Inicial de Perguntas (com testes unitários) *(Concluído)*
- [x] **Etapa 4:** Armazenamento Local & Gerenciamento de Perguntas (CRUD do Apresentador) *(Concluído)*
- [x] **Etapa 4.1:** Refinamento da Identidade Visual & Design System Bíblia Sagrada *(Concluído com pendência)*
- [x] **Etapa 5:** Estado Global, Navegação & Tela de Configuração da Partida *(Concluído)*
- [ ] **Etapa 6:** O Mural de Perguntas (Grade Interativa de Números)
- [ ] **Etapa 7:** Tela de Pergunta Ativa, Cronômetro & Controles do Apresentador
- [ ] **Etapa 8:** Pontuação Secreta, Roubo a 50%, Desfazer & Salvamento Automático
- [ ] **Etapa 9:** Tela de Encerramento & Grande Pódio (Revelação e Confetes)
- [ ] **Etapa 10:** Efeitos Audiovisuais & Ajustes de Projeção
- [ ] **Etapa 11:** Qualidade: Lint, Testes Automatizados & Testes Integrados de Ponta a Ponta
- [ ] **Etapa 12:** Geração do Instalador Windows (`.exe` com `electron-builder`)
- [ ] **Etapa 13:** Automação com CI/CD (GitHub Actions e/ou GitLab CI/CD) *(Para aprendizado)*

---

## 📌 Registro de Decisões

Decisões já tomadas. Novas decisões devem ser adicionadas aqui conforme o desenvolvimento avança.

| # | Data | Decisão |
|---|---|---|
| D1 | 2026-10-05 | O repositório permanece no **GitHub**. A migração/espelhamento para o GitLab será avaliada apenas na Etapa 13 (CI/CD). |
| D2 | 2026-10-05 | O cronômetro é **apenas indicativo**: quando chega a zero, **não** conta automaticamente como erro nem dispara o roubo. Quem decide o resultado é sempre o apresentador. |
| D3 | 2026-10-05 | O cronômetro é **por pergunta**: a contagem reinicia a cada pergunta aberta (ex.: 10 segundos para responder). |
| D4 | 2026-10-05 | A forma de exibir os controles do apresentador (tela única, duas janelas ou atalhos de teclado) será decidida na Etapa 7. |
| D5 | 2026-10-05 | O app será usado em **notebook espelhado em uma TV** (não em projetor). Janela mínima mantida em **1280×720**; o tamanho poderá ser revisto depois. |
| D6 | 2026-10-05 | O app abre em **janela maximizada**; a tela cheia é ativada pelo apresentador com **F11**. |
| D7 | 2026-10-05 | ~~Mantido o **modo navegador** para desenvolvimento rápido (`npm run dev:web`).~~ Substituída pela D18. |
| D8 | 2026-10-05 | **Node.js 22.12+** passa a ser obrigatório: todas as versões suportadas do Electron (42, 43 e 44) exigem essa versão, e o Node 20 está fora de suporte. Electron fixado em `44.4.5`. Ambiente de desenvolvimento atualizado para o Node **24 LTS** (gerenciado pelo nvm-windows). |
| D9 | 2026-10-05 | Migração para o **Tailwind CSS 4** ainda no início do desenvolvimento (menos telas para revisar), usando o plugin `@tailwindcss/vite` no lugar do PostCSS. A configuração do tema passa a ficar no `@theme` do `src/index.css`. |
| D10 | 2026-10-05 | Atualização para o **Vite 8** (Rolldown/Oxc) ainda no início do desenvolvimento. Remove os avisos do `vite-plugin-electron`, a dependência do `esbuild` e acelera os builds. |
| D11 | 2026-10-06 | **Ordem das equipes:** as equipes se revezam a cada pergunta (A, B, A, B…), **independentemente de roubo**. Ex.: A erra a pergunta 1 e B rouba (acertando ou não); a pergunta 2 é de B. |
| D12 | 2026-10-06 | O apresentador **define a ordem das equipes** na tela de configuração (arrastando para cima/baixo); a primeira da lista começa e a ordem se reveza a partir dela. |
| D13 | 2026-10-06 | **Número de equipes configurável, de 2 a 4.** O roubo vale sempre 50%: **5, 10 ou 15 pontos** (sem arredondamento, já que as pontuações são fixas em 10/20/30). |
| D14 | 2026-10-06 | A pergunta tem apenas **enunciado, 4 alternativas, resposta correta e dificuldade**. Sem categoria e sem referência bíblica, para facilitar a criação de perguntas. |
| D15 | 2026-10-06 | As perguntas ficam em um **arquivo JSON separado** (`src/data/perguntas.json`), com chaves em português e a resposta correta como letra (A–D), fácil de editar à mão ou gerar por IA no futuro. As 20 perguntas atuais são dados de teste. |
| D16 | 2026-10-06 | **Roubo sempre pela próxima equipe na ordem.** Ex. com A, B e C: A erra e B pode roubar; a próxima pergunta é de B; se B errar, C pode roubar. |
| D17 | 2026-10-06 | A configuração da partida fica em **uma única tela**: quantidade e nomes das equipes, ordem (arrastar), roubo ativo e tempo para responder. |
| D18 | 2026-10-13 | **Só existirá o aplicativo instalado (Electron).** O modo navegador (`npm run dev:web`) foi removido. |
| D19 | 2026-10-13 | **Importar e exportar** perguntas em JSON já na Etapa 4. Ao importar, o apresentador escolhe entre *substituir todas* ou *adicionar às atuais* (cada uma no final do grupo da sua dificuldade, D24). |
| D20 | 2026-10-13 | As perguntas são **salvas automaticamente ao fechar o formulário** com Salvar (não a cada tecla digitada). Excluir, restaurar e importar salvam na hora, após confirmação. |
| D21 | 2026-10-13 | **Não embaralhar** as alternativas: a ordem cadastrada é a ordem exibida. |
| D22 | 2026-10-13 | **A gincana usa todas as perguntas cadastradas**; não há seleção de perguntas por partida. As equipes escolhem pelo número no mural (ex.: "quero a pergunta 5"). |
| D23 | 2026-10-13 | As perguntas ficam em uma **pasta própria** (`%APPDATA%\show-do-cristao\perguntas\`), separada dos arquivos internos do Electron, e o botão se chama **"Abrir pasta das perguntas"**, para o usuário encontrar facilmente o arquivo a editar. |
| D24 | 2026-10-13 | **Ordenação automática por dificuldade:** primeiro todas as fáceis, depois as médias, depois as difíceis. Pergunta nova, ou que mudou de dificuldade, vai para o **final do grupo** da sua dificuldade (ex.: a pergunta 3, fácil, que vira média passa a ser a última média). Arquivos editados à mão ou importados também são organizados. |
| D25 | 2026-10-13 | **Padrão visual do cabeçalho das telas:** textos em branco; botões com fundo verde, texto branco e borda verde-clara (variação `light`); botão principal com fundo branco, texto e borda verde-escuros (variação `highlight`). Filtros seguem o mesmo padrão. O conteúdo das telas (listas, formulários) mantém a paleta verde. |
| D26 | 2026-10-15 | **Identidade Visual: Bíblia Sagrada & Cânon de Escriba.** Descarte do estilo "Tech Bento" e adoção oficial da metáfora de uma Bíblia Sagrada encadernada em couro nobre, com bifólio (duas páginas espelhadas), tipografia clássica serifada, versículos numerados com rubrica carmesim (`§ 1.`), alternativas em medalhões e efeito tridimensional de virada de página com som de folhear papel bíblia. Especificações completas documentadas em `docs/identidade-visual.md`. |
| D27 | 2026-10-17 | **Modo Noturno (Códice Escuro) e Header Compacto em Nível Único.** Introdução do suporte ao Modo Claro (Papel Marfim) / Modo Noturno (Códice Escuro) com switch deslizante de largura fixa; abertura direta no Livro das Perguntas (6 perguntas por folha aberta / 3 por página); cabeçalho simplificado em uma única linha horizontal com botões de ação em ícones (pasta, importação, exportação, restauração), eliminação de barras de rolagem verticais na tela e ajuste do botão "Novo Versículo". |
| D28 | 2026-10-17 | **Diagramação em 4 Versículos por Página (8 por Folha) e Alinhamento Vertical Dinâmico.** Adoção de 4 perguntas por página (totalizando 8 perguntas no bifólio aberto), centralização óptica das letras (A, B, C, D) nos medalhões circulares (`font-sans`, `pt-[1px]`) e distribuição vertical dinâmica: páginas completas distribuem-se de ponta a ponta (`justify-between`) ocupando harmoniosamente toda a altura sem deixar vácuo no rodapé, enquanto páginas parciais agrupam-se no topo (`justify-start`). |
| D29 | 2026-10-17 | **Animação Fluida 3D de Virada de Página Ancorada na Medianiz.** Substituição da rotação do livro inteiro por um giro 3D de alta performance (`will-change: transform, filter, opacity`) aplicado exclusivamente à página ativa (página direita no avanço; página esquerda no retorno), com ponto de giro centrado na costura/medianiz (`transform-origin: left/right center`), sombras dinâmicas de curvatura de papel e sincronização precisa da troca de dados no ápice de 50% (190ms de 380ms), eliminando solavancos e engasgos. |
| D30 | 2026-10-18 | **Distribuição Proporcional dos Versículos por Quadrante (`flex-1`).** Eliminação dos vácuos brancos entre perguntas causados pelo `justify-between` com cards compactos. Quando a página possui 4 versículos, cada `<article>` ocupa exatamente 25% da altura (`flex-1 min-h-0 flex flex-col justify-center py-1`), centralizando verticalmente o cabeçalho, texto e alternativas, posicionando a linha divisória de forma equidistante e simétrica (~10px acima e abaixo) e garantindo preenchimento harmônico sem qualquer barra de rolagem em todas as alturas de tela (de 600px a 1080p). Em páginas parciais (< 4 perguntas), o alinhamento mantém-se no topo (`justify-start space-y-1`). |
| D31 | 2026-10-18 | **Parâmetros da Partida e Identidade das 4 Equipes (Etapa 5).** O tempo do cronômetro é único para todas as perguntas da partida (não proporcional por dificuldade), selecionado na tela de configuração. Não há persistência local dos nomes das equipes entre sessões (inicia com os nomes padrão a cada nova gincana). Identidades visuais oficiais definidas para as 4 equipes: Equipe I (Sarça Verde - verde IPB), Equipe II (Chama Dourada - ouro/âmbar), Equipe III (Vinho Carmesim - rubrica/vermelho nobre) e Equipe IV (Safira Celeste - azul reformado). |
| D32 | 2026-10-18 | **Metáfora da Bíblia Sagrada Unificada em Toda a Aplicação.** A tela inicial (`MainMenu.tsx`) é modelada como a **Capa Fechada da Bíblia**, com encadernação em couro, cantoneiras e títulos dourados, fitilho vermelho, corte de páginas dourado e as opções centrais "INICIAR GINCANA" e "Configurar Perguntas". Ao selecionar uma opção, o livro abre com áudio sintetizado e transição suave. A tela de Configuração (`GameConfig.tsx`) também segue o visual de Bíblia aberta (bifólio com duas páginas sobre encadernação de couro, medianiz e fitilho central), eliminando caixas isoladas e mantendo a atmosfera sacra e clássica em todo o aplicativo. |
| D33 | 2026-10-25 | **Animação 3D Realista de Abertura da Bíblia na Transição do Menu Inicial.** A transição entre o menu inicial (`MainMenu.tsx` - Capa Fechada) e as janelas de Configuração da Gincana (`GameConfig.tsx`) ou Banco de Perguntas (`QuestionManager.tsx`) ocorre mediante uma animação tridimensional física da capa se abrindo em perspectiva 3D (`perspective: 2400px`). Ao acionar "INICIAR GINCANA" ou "Configurar Perguntas", a Bíblia sincroniza um deslocamento horizontal suave (`translateX(50%)`) enquanto a capa gira $-180^\circ$ em torno da lombada (`transform-origin: left center`), acompanhada de projeção de sombra dinâmica (`animate-cover-shadow`), revelação do fitilho de cetim no centro e reprodução do efeito sonoro sintetizado de abertura solene e farfalhar de páginas (`playBookOpenSound()`). As páginas internas do bifólio revelado são folhas limpas em pergaminho/papel sagrado (sem textos preliminares), garantindo que o carregamento da tela de destino ocorra com total naturalidade sem sobreposição ou troca abrupta de texto. |
| D34 | 2026-10-25 | **Animação 3D de Fechamento da Bíblia ao Retornar ao Menu Inicial.** Ao retornar para a tela inicial (`MainMenu.tsx`) a partir de qualquer janela (`GameConfig.tsx` ou `QuestionManager.tsx`), a Bíblia inicia no estado de bifólio aberto e executa a animação tridimensional inversa de fechamento: a capa gira de $-180^\circ$ de volta a $0^\circ$ cobrindo as páginas, a lombada translada de volta ao centro (`translateX(0)`), a sombra de fechamento (`animate-cover-close-shadow`) projeta-se sobre o volume e é disparado o efeito sonoro de fechamento solene (`playBookCloseSound()`) combinando o farfalhar das folhas ao recolher e o impacto aveludado do couro nobre se fechando. O estado prévio é rastreado automaticamente no `GameContext`, garantindo que na primeira abertura do app o livro permaneça fechado e apenas execute o fechamento quando o usuário estiver efetivamente retornando ao menu. |
| D35 | 2026-10-25 | **Unificação do Fundo da Aplicação no Modo Claro e Noturno.** O fundo externo que envolve a Bíblia é rigorosamente padronizado em todas as telas (`MainMenu`, `GameConfig`, `QuestionManager`/`BibleLayout` e `BoardPlaceholder`), garantindo continuidade visual sem quebras de cor: no Modo Claro, adota-se o degradê quente de papel bíblia/marfim (`from-[#fdfbf7] via-[#faf7f0] to-[#f3ebd9]`) tanto com o livro fechado quanto com ele aberto, e as barras superiores adotam acabamento translúcido claro com tipografia e bordas sépia; no Modo Noturno, adota-se o degradê solene de códice escuro/madeira de púlpito (`dark:from-[#18110b] dark:via-[#120a06] dark:to-[#0a0503]`). O `html, body` do `src/index.css` foi atualizado para eliminar fundos pretos residuais no modo claro. |

---

## Detalhamento das Etapas

### 🟩 Etapa 0: Preparação de Ambiente & Estrutura de Pastas `[CONCLUÍDO]`
- [x] Download e configuração do Node.js LTS no ambiente do usuário.
- [x] Criação da árvore de pastas base (`electron/`, `src/assets`, `src/components`, `src/pages`, etc.).

---

### 🟩 Etapa 1: Configuração do Ecossistema Base `[CONCLUÍDO]`
**Objetivo:** Criar os arquivos de configuração do projeto React com TypeScript, empacotador rápido (Vite) e biblioteca de estilização moderna (Tailwind CSS) com a identidade visual da Igreja Presbiteriana do Brasil (IPB).
- [x] Criar `package.json` com scripts de desenvolvimento e dependências necessárias.
- [x] Configurar `tsconfig.json` para TypeScript estrito e organizado.
- [x] Configurar `vite.config.ts` para compilação estática compatível com desktop.
- [x] Configurar `tailwind.config.js` (migrado para o `@theme` do `src/index.css` na Etapa 2.1) e `src/index.css` com paleta de cores institucional IPB (Verde escuro, Verde médio, Dourado da sarça, Branco).
- [x] Criar o `index.html` e `src/main.tsx` inicial com demonstração reativa das equipes.
- **Validação:** Compilação do TypeScript e Vite bem-sucedida (`npm run build`).

---

### 🟩 Etapa 2: Integração com o Electron (Janela Nativa) `[CONCLUÍDO]`
**Objetivo:** Permitir que o aplicativo abra em uma janela nativa do Windows em vez do navegador, de forma segura e funcionando **100% offline** (o local do evento pode não ter internet confiável).
- [x] Instalar `electron` (`44.4.5`) e `vite-plugin-electron` para compilar o `electron/main.ts` e o `electron/preload.ts` em TypeScript (saída em `dist-electron/`).
- [x] Criar `electron/main.ts`:
  - Controle do ciclo de vida da janela (abrir, fechar, encerrar o app).
  - Em desenvolvimento, carregar o servidor do Vite; em produção, carregar `dist/index.html`.
  - Remover a barra de menu padrão (`Menu.setApplicationMenu(null)`).
  - Janela mínima de 1280×720, abrindo **maximizada** (decisões D5 e D6).
  - Suporte a Tela Cheia com **F11** (entrar/sair) e **Esc** (sair).
  - Configurações de segurança: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` (inclusive no modo de desenvolvimento).
- [x] Criar `electron/preload.ts` (canal seguro de comunicação entre Node e React via `contextBridge`), gerado como `preload.cjs`.
- [x] Empacotar a fonte **Roboto localmente** (`@fontsource/roboto`, apenas o subconjunto latino) e remover o carregamento pelo Google Fonts no `index.html`.
- [x] Aplicar uma Política de Segurança de Conteúdo (CSP) no build de produção.
- [x] Ajustar `tsconfig.json` para tipar também a pasta `electron/`.
- [x] Criar scripts no `package.json`: `dev` (janela do Electron), `dev:web` (somente navegador, removido na Etapa 4), `build` (React + Electron) e `start` (abre o build de produção no Electron).
- [x] Atualizar o Node.js para **22.12+** (decisão D8) e reinstalar as dependências. Instalado o Node **24.21.0 LTS** via nvm-windows.
- **Validação:** Executar `npm run dev` e ver a janela nativa do Windows abrindo maximizada, sem barras de navegador e sem menu, com o rodapé indicando "Rodando na janela nativa (Electron)"; F11 alterna a tela cheia e Esc sai; a fonte continua correta com a internet desligada; `npm run build && npm start` abre a versão de produção.

**Pontos a validar:**
- Revisar o tamanho mínimo da janela quando as telas do jogo estiverem prontas (D5).
- ~~O plugin `vite-plugin-electron` exibe avisos inofensivos no build (`Unknown input options: platform`) por ser voltado ao Vite 8.~~ Resolvido na Etapa 2.2.

---

### 🟩 Etapa 2.1: Migração do Tailwind CSS 3 → 4 `[CONCLUÍDO]`
**Objetivo:** Atualizar o Tailwind enquanto o projeto ainda tem poucas telas, eliminando as vulnerabilidades do Tailwind 3 e alinhando com o `tailwind-merge` 3 (feito para o Tailwind 4) (decisão D9).
- [x] Executar a ferramenta oficial `@tailwindcss/upgrade` e revisar as alterações.
- [x] Mover o tema (paleta IPB, cores das equipes, sombras e fonte) do `tailwind.config.js` para o bloco `@theme` do `src/index.css`.
- [x] Trocar o PostCSS pelo plugin `@tailwindcss/vite` (removidos `postcss.config.js`, `postcss` e `autoprefixer`).
- [x] Usar as variáveis do tema (ex.: `var(--color-ipb-darkest)`) no CSS base no lugar das cores escritas à mão.
- [x] Ajustar as classes renomeadas (`bg-gradient-to-*` → `bg-linear-to-*`, `rounded` → `rounded-sm`).
- [x] Executar `npm audit fix` (0 vulnerabilidades).
- **Validação:** `npm run build` sem erros e a tela de demonstração com o mesmo visual de antes na janela do Electron.

**Pontos a validar:**
- No Tailwind 4 a cor padrão das bordas é `currentColor`. Toda borda nova deve declarar a cor explicitamente (ex.: `border border-ipb-medium/30`).

---

### 🟩 Etapa 2.2: Atualização do Vite 6 → 8 `[CONCLUÍDO]`
**Objetivo:** Atualizar o empacotador enquanto o projeto ainda é pequeno, alinhando com o `vite-plugin-electron` (feito para o Vite 8) e removendo a dependência do `esbuild` (decisão D10).
- [x] Atualizar `vite` para `8.3.1` e `@vitejs/plugin-react` para `6.1.1` (versões fixadas).
- [x] Renomear `rollupOptions` → `rolldownOptions` no `vite.config.ts` (o Vite 8 usa o Rolldown no lugar do Rollup).
- [x] Trocar `__dirname` por `import.meta.dirname` no `vite.config.ts`.
- [x] Posicionar o CSP no início do `<head>`, antes dos scripts, para que ele se aplique a todo o conteúdo da página.
- **Validação:** `npm run build` sem avisos; `npm run dev`, `npm run dev:web` e `npm start` funcionando, com a ponte do preload ativa, a fonte local carregada e sem acesso ao Node no React.

---

### 🟩 Etapa 3: Modelagem de Dados, Motor de Regras & Perguntas Iniciais `[CONCLUÍDO]`
**Objetivo:** Definir as regras de negócio em código TypeScript, de forma **isolada da interface** (funções puras), testável, e criar o catálogo de perguntas bíblicas padrão.
- [x] Criar `src/types/game.ts`:
  - `Question`: `id`, enunciado, 4 alternativas, índice da resposta correta e dificuldade. **Sem** categoria ou referência bíblica (decisão D14).
  - A pontuação (10/20/30) é **derivada da dificuldade**, e não armazenada na pergunta.
  - `GameConfig`: lista de equipes (2 a 4) **na ordem de jogo**, tempo do cronômetro por pergunta e roubo ativo.
  - `GameState`: configuração, perguntas, histórico de jogadas e se a partida foi encerrada. A pontuação, a equipe da vez e as perguntas respondidas são **calculadas a partir do histórico**, o que torna o "desfazer" trivial.
- [x] Criar `src/game/engine.ts` com as regras como **funções puras**: criar partida, equipe da vez, próxima equipe, perguntas disponíveis, registrar resultado (acerto, erro, roubo), desfazer, encerrar, pontuação, ranking e vencedor(es)/empate.
- [x] Criar `src/game/questions.ts`: leitura e validação do arquivo de perguntas, com mensagens de erro em português indicando o número da pergunta com problema.
- [x] Criar `src/data/perguntas.json`, um **arquivo separado e editável**, com **20 perguntas bíblicas** (7 fáceis, 7 médias, 6 difíceis). Formato de cada pergunta:
  ```json
  { "pergunta": "Quem construiu a arca?", "alternativas": ["Moisés", "Noé", "Abraão", "Davi"], "correta": "B", "dificuldade": "facil" }
  ```
- [x] Instalar o **Vitest** (`5.0.2`) e criar 19 testes unitários (acerto = 100%, roubo = 50%, erro = 0, rodízio de equipes com e sem roubo, 3 equipes, validações, desfazer, fim de jogo, ranking e empate, leitura do arquivo de perguntas).
- [x] Criar os scripts `test`, `test:watch` e `typecheck`.
- **Validação:** `npm run typecheck` sem erros e todos os testes passando (`npm test`).

**Pontos a validar:**
- ~~Quem rouba com mais de 2 equipes?~~ Sempre a próxima equipe na ordem (decisão D16).
- ~~Revisar o conteúdo das 20 perguntas padrão.~~ São dados de teste; podem ser substituídos a qualquer momento (decisão D15).

---

### 🟩 Etapa 4: Armazenamento Local & Gerenciamento de Perguntas (Apresentador) `[CONCLUÍDO]`
**Objetivo:** Permitir que o apresentador cadastre, edite, visualize e exclua perguntas antes de começar a gincana, com os dados salvos no computador.
- [x] Criar `electron/questionsIpc.ts` (processo principal), com canais de IPC que só aceitam chamadas da página do próprio app:
  - Ler e gravar o arquivo `perguntas.json` na **pasta das perguntas** (`%APPDATA%\show-do-cristao\perguntas\`, decisão D23), no **mesmo formato** do `src/data/perguntas.json`. A gravação é segura: grava em arquivo temporário e depois substitui.
  - Guardar uma cópia de segurança (`perguntas.backup-<data>.json`) antes de substituir todas as perguntas.
  - Importar e exportar pelas janelas nativas "Abrir" e "Salvar como" do Windows (limite de 5 MB na importação).
  - Abrir a pasta das perguntas no Explorador de Arquivos.
  - Mover automaticamente arquivos gravados no local antigo (raiz da pasta de dados) para a pasta das perguntas.
- [x] Expor essas funções no `electron/preload.ts` (`window.showDoCristao`), sem expor o Node ao React.
- [x] Criar `src/services/questionStorage.ts`: carregar (na primeira abertura cria o arquivo com as perguntas padrão), salvar, substituir com cópia de segurança, importar e exportar.
- [x] Ampliar `src/game/questions.ts`: conversão para o formato do arquivo, leitura de JSON com mensagem amigável, validação do formulário (campos obrigatórios e alternativas repetidas) e adição de perguntas importadas.
- [x] Criar a página `src/pages/QuestionManager.tsx`:
  - Lista com o número da pergunta (o mesmo do mural), etiqueta de dificuldade, enunciado e resposta correta; filtro por dificuldade com contadores.
  - Botões **Nova pergunta**, **Importar** (pergunta se deve *substituir todas* ou *adicionar às atuais*), **Exportar**, **Restaurar padrão** e **Abrir pasta das perguntas**.
  - Editar e excluir (com confirmação) em cada pergunta; avisos rápidos de sucesso ou erro.
  - Se o arquivo tiver erro (ex.: editado à mão), mostra a mensagem com o número da pergunta e oferece **Abrir pasta das perguntas**, **Tentar novamente** ou **Restaurar padrão** (com cópia do arquivo com problema).
- [x] Criar os componentes `QuestionForm` (janela sobreposta), `ConfirmDialog`, `Modal` e `Button`.
  - O formulário salva ao fechar com **Salvar** ou **Salvar e adicionar outra** (decisão D20). **Cancelar** com alterações pede confirmação antes de descartar.
- [x] **Ordenação automática** fáceis → médias → difíceis (decisão D24), aplicada ao salvar, importar, restaurar e ao abrir um arquivo editado à mão. O aviso informa quando a pergunta muda de posição (ex.: "movida da posição 3 para a 14").
- [x] Botão provisório **"Gerenciar perguntas"** na tela de demonstração (será substituído pelo menu da Etapa 5).
- [x] Remover o modo navegador (`npm run dev:web`) (decisão D18).
- [x] 19 novos testes (38 no total): formato do arquivo, formulário, ordenação por dificuldade, armazenamento com o arquivo simulado, arquivo com erro, cópia de segurança, importação e exportação.
- **Validação:** cadastrar, editar e excluir perguntas, fechar e reabrir o app e conferir que tudo foi mantido; editar o `perguntas.json` com erro e ver a mensagem e a restauração; `npm test`, `npm run typecheck` e `npm run build` sem erros.

**Pontos a validar:**
- ~~Importar/Exportar perguntas em JSON~~ Implementado nesta etapa (decisão D19).
- **Gerar perguntas com IA** (ex.: chave de API do Gemini ou outra IA) produzindo um arquivo no mesmo formato, que poderá ser trazido pelo botão Importar. Avaliar em uma etapa futura.
- ~~Escolher quais perguntas entram em cada gincana~~ Não será feito: a gincana usa todas as perguntas cadastradas (decisão D22).
- ~~Embaralhar a ordem das alternativas~~ Não será feito (decisão D21).
- ~~Reordenar as perguntas na lista?~~ A lista é ordenada automaticamente por dificuldade (decisão D24).

---

### 🟩 Etapa 4.1: Refinamento da Identidade Visual & Design System Bíblia Sagrada `[CONCLUÍDO COM PENDÊNCIA]`
**Objetivo:** Consolidar e refinar a experiência visual completa no estilo Bíblia Sagrada (decisão D26) antes de avançar para as telas da partida (Etapa 5), garantindo que todo o design system (fontes, paleta de papel e couro, proporções do bifólio, animações e componentes) sirva de padrão consolidado para o restante do app.
- [x] Criar `docs/identidade-visual.md` com a documentação de layout, tipografia, tokens e metáfora do livro sagrado.
- [x] Implementar o componente `src/components/BibleLayout.tsx` com paginação em bifólio, animação 3D de virada e sintetizador Web Audio API para o folhear de páginas.
- [x] Refatorar `src/pages/QuestionManager.tsx` e componentes de formulário/diálogo para adotarem o estilo Bíblia, descartando o visual Tech Bento.
- [x] Implementar alternador de tema Claro (Papel Marfim) / Noturno (Códice Escuro) com switch deslizante de largura estritamente fixa (`ThemeToggle.tsx`).
- [x] Redesenhar o cabeçalho superior em um único nível sem scroll: botão voltar apenas com ícone, filtro encurtado, botões de ação em ícones limpos e ajuste no botão "Novo Versículo".
- [x] Atualizar a diagramação para 4 versículos por página (8 por folha aberta), centralização óptica das letras das alternativas (A, B, C, D) e preenchimento vertical harmônico (`flex-1 min-h-0` proporcional nos 4 quadrantes quando cheia / `justify-start` quando parcial) sem vácuos brancos entre perguntas nem no rodapé (decisões D28 e D30).
- [x] Refatorar a animação de virada de página para giro 3D com pivô na medianiz (`transform-origin: left/right center`), sombras dinâmicas e sincronização aos 190ms (decisão D29).
- [x] Refinar estética, diagramação, proporções, margens e contraste dos elementos da Bíblia nos modos Claro e Noturno.
- **Validação:** Navegação pelas folhas de perguntas aprovada, 100% sem scrollbars e com distribuição harmônica validada via CDP e testes unitários.

**Pontos em aberto / pendências:**
- **Melhoria da animação ao virar a página:** Ficou registrado como pendência para aprimoramento futuro deixar a animação de passagem de páginas ainda mais fluida e orgânica.

---

### 🟩 Etapa 5: Estado Global, Navegação & Tela de Configuração da Partida `[CONCLUÍDO]`
**Objetivo:** Definir como as telas se comunicam e preparar as regras antes de a gincana começar.
- [x] Criar o estado global do jogo com `useReducer` + Context (`src/contexts/GameContext.tsx`), integrando o motor de regras da Etapa 3.
- [x] Criar a navegação entre telas no estado global (`'menu'` | `'questions'` | `'config'` | `'board'` | `'question-view'` | `'podium'`), 100% compatível com desktop offline sem conflitos de rotas.
- [x] Criar a página inicial `src/pages/MainMenu.tsx` no design da **Capa da Bíblia Fechada** (decisão D32), com textura de couro nobre, cantoneiras douradas, brasão da sarça e os botões **"INICIAR GINCANA"** e **"Configurar Perguntas"**.
- [x] Implementar a **animação 3D de abertura da Bíblia** (decisão D33) com giro de $-180^\circ$ ancorado na lombada, perspectiva tátil e páginas internas limpas em pergaminho sagrado para transição fluida sem sobreposição de textos.
- [x] Implementar a **animação 3D de fechamento da Bíblia** (decisão D34) com som solene de encadernação e folhas (`playBookCloseSound`) ao retornar ao menu inicial de qualquer tela.
- [x] Unificar rigorosamente o fundo da aplicação nos modos Claro e Noturno (decisão D35).
- [x] Criar `src/game/teams.ts` com as identidades visuais oficiais das 4 equipes (Sarça Verde, Chama Dourada, Vinho Carmesim, Safira Celeste) e testes unitários.
- [x] Criar página `src/pages/GameConfig.tsx` no estilo de **Bíblia Aberta (Bifólio)** (decisão D32):
  - Folha I (Página Esquerda): Seleção de 2 a 4 equipes e ordenação de saída com botões subir/descer e estandartes coloridos para cada equipe.
  - Folha II (Página Direita): Seletor de tempo único para a partida (`Sem limite`, `10s`, `15s`, `30s`, `45s`, `60s`), interruptor para Roubo de Pergunta a 50%, resumo de versículos por equipe e botão principal **"INICIAR GINCANA BÍBLICA"**.
  - Layout 100% responsivo para 720p sem barras de rolagem e com suporte a Modo Claro e Modo Noturno.
- [x] Criar componente `src/pages/BoardPlaceholder.tsx` para validação end-to-end do fluxo de início de partida, banner da equipe da vez e diálogo de encerramento.
- **Validação:** Fluxo completo automatizado e verificado no Electron via CDP (Capa Fechada ➔ Abertura 3D ➔ Configuração Bifólio 2/4 equipes ➔ Iniciar Gincana ➔ Encerrar Partida ➔ Fechamento 3D ➔ Capa Fechada ➔ Configurar Perguntas) e 42 testes unitários passando.

**Decisões validadas:**
- Tempo único para todas as perguntas da partida (decisão D31).
- Sem persistência local de nomes entre partidas (decisão D31).
- Identidades visuais aprovadas para as 4 equipes (Sarça Verde, Chama Dourada, Vinho Carmesim, Safira Celeste - D31).
- Design System da Bíblia Sagrada aplicado à Capa Inicial e à Configuração da Partida (decisão D32).

---

### 🔹 Etapa 6: Mural de Perguntas (Grade de Números)
**Objetivo:** A tela central do jogo onde as equipes escolhem qual pergunta querem abrir.
- [ ] Criar componente `src/components/QuestionBoard.tsx` (grade de cartões com números `1`, `2`, `3`...).
- [ ] Indicar no topo de qual equipe é a vez de escolher.
- [ ] Desabilitar e marcar visualmente números de perguntas que já foram respondidas.
- [ ] Incluir o botão fixo no topo: **"Encerrar Gincana"** com modal de confirmação.
- **Validação:** Clicar num número disponível e navegar para a tela de pergunta correspondente.

**Pontos a validar:**
- O mural deve mostrar a dificuldade de cada número (cor/etiqueta), permitindo estratégia, ou manter tudo oculto?
- Embaralhar a associação número ↔ pergunta a cada partida?
- Marcar no cartão respondido qual equipe acertou? (Cuidado: pode revelar parte do placar secreto.)

---

### 🔹 Etapa 7: Tela da Pergunta Ativa, Cronômetro & Controles do Apresentador
**Objetivo:** A tela de grande impacto visual que o público e as equipes veem durante a resposta, junto com os controles do apresentador.
- [ ] Criar página `src/pages/QuestionView.tsx`:
  - Enunciado da pergunta com tipografia grande e clara para leitura à distância (tamanhos fluidos, adaptados à resolução da TV).
  - 4 alternativas (A, B, C, D) estilizadas.
  - Tag visual da dificuldade com **texto + cor** (Fácil: Verde, Médio: Amarelo, Difícil: Vermelho), pensando em pessoas daltônicas.
  - Revelação da alternativa correta **somente após** a decisão final da pergunta, inclusive após o roubo.
- [ ] Criar componente `src/components/Timer.tsx`:
  - Barra ou círculo regressivo com contagem visual, reiniciado a cada pergunta.
  - Efeito de pulsar em vermelho nos últimos 5 segundos.
  - Ao chegar a zero, apenas sinaliza "Tempo esgotado" — **não** aplica erro automaticamente (decisão D2).
  - Controles de pausar/reiniciar o tempo pelo apresentador.
- [ ] Criar os controles do apresentador (Correto / Incorreto / Dar chance de roubo / Voltar ao mural).
- **Validação:** Testar a contagem regressiva, garantir que para ao chegar em zero sem alterar a pontuação, e que a resposta correta só aparece após a decisão.

**Pontos a validar (decisão D4):**
- **Onde ficam os controles do apresentador?** Com o notebook espelhado na TV, botões como "Correto/Incorreto" ficam visíveis para o público. Opções:
  1. Tela única com os botões visíveis (mais simples).
  2. Duas janelas no Electron: uma para a TV (modo "estender tela" em vez de espelhar) e outra com o painel do apresentador (notebook).
  3. Controles por **atalhos de teclado** (ex.: `C` = correto, `E` = errado, `R` = roubo), sem botões visíveis.
- Quem marca a alternativa escolhida: a equipe responde em voz alta e o apresentador clica na alternativa?
- No roubo, o cronômetro reinicia para a equipe adversária?

---

### 🔹 Etapa 8: Pontuação Secreta, Roubo a 50%, Desfazer & Salvamento Automático
**Objetivo:** Ligar o motor de regras (Etapa 3) à interface, mantendo a pontuação oculta e o jogo protegido contra erros e travamentos.
- [ ] Ligar os controles do apresentador ao motor de jogo:
  - **"Correto"**: soma 100% dos pontos para a equipe da vez.
  - **"Incorreto"**: não pontua (ou abre a chance de roubo, se ativa na partida).
  - **"Roubo"**: transfere o direito de responder para a equipe adversária; se ela acertar, credita **50% dos pontos**.
- [ ] Garantir que **nenhum número de placar é exibido no telão** nesta fase.
- [ ] Atualizar a lista de perguntas respondidas e alternar a equipe da vez ao retornar ao mural.
- [ ] **Desfazer a última ação** do apresentador (um clique errado na pontuação secreta não pode ser irreversível).
- [ ] **Salvamento automático** da partida em andamento, com opção de "Retomar partida" ao reabrir o app após fechamento inesperado.
- **Validação:** Simular rodada completa de acerto, erro e roubo validando se os pontos internos bateram; desfazer uma ação; fechar o app no meio da partida e retomá-la.

**Pontos a validar:**
- Painel secreto para o apresentador conferir o placar (ex.: atalho de teclado que mostra o placar só enquanto pressionado)?
- Histórico de jogadas visível ao apresentador (pergunta, equipe, resultado)?

---

### 🔹 Etapa 9: Tela de Encerramento & Grande Pódio
**Objetivo:** O clímax da gincana com suspense e celebração.
- [ ] Criar página `src/pages/FinalPodium.tsx`:
  - Animação de revelação gradual do placar secreto de cada equipe.
  - Destaque triunfal com troféu para a equipe campeã (ou tela amigável de empate).
  - Efeito de explosão de confetes na tela (`canvas-confetti`).
  - Botão para "Jogar Nova Partida" ou "Voltar ao Menu".
- **Validação:** Encerrar uma partida e verificar a exibição correta das pontuações e do vencedor.

**Pontos a validar:**
- Em caso de empate: apenas tela de empate ou "pergunta de desempate"?
- Mostrar um resumo final (acertos, roubos por equipe)?

---

### 🔹 Etapa 10: Efeitos Audiovisuais & Ajustes de Projeção
**Objetivo:** Dar o clima de auditório de TV ao evento.
- [ ] Criar `src/services/audioService.ts`:
  - Sons sintetizados via Web Audio API (dispensa arquivos pesados externos):
    - Tique-taque de tensão no cronômetro.
    - Som de acerto (comemoração).
    - Som de erro ("buzzer").
    - Fanfarra final da vitória.
  - Controle de **volume / mudo** acessível ao apresentador.
- [ ] Revisar legibilidade e contraste das telas na TV espelhada (tamanhos fluidos, leitura à distância).
- **Validação:** Testar os sons com fone/caixa de som e verificar as telas em resoluções 1280×720 e 1920×1080.

**Pontos a validar:**
- Usar arquivos de áudio reais (pasta `src/assets/audio/`) em vez de sons sintetizados?
- Animações de transição entre telas?

---

### 🔹 Etapa 11: Qualidade — Lint, Testes Automatizados & Testes Integrados
**Objetivo:** Garantir estabilidade total antes de gerar o instalador.
- [ ] Configurar **ESLint** e criar os scripts `lint` e `typecheck` no `package.json` (usados também na Etapa 13).
- [ ] Ampliar a cobertura de testes do Vitest (motor de regras, serviço de armazenamento).
- [ ] Simular uma partida inteira de 10 a 20 perguntas.
- [ ] Testar cenários de borda: encerramento no meio do jogo, todas as perguntas esgotadas, empates, desfazer, retomar partida após fechamento.
- [ ] Validar cadastro de novas perguntas personalizadas, edições e exclusões.

**Pontos a validar:**
- Testes de ponta a ponta automatizados (ex.: Playwright com Electron) ou apenas roteiro de testes manuais?

---

### 🔹 Etapa 12: Geração do Instalador Windows (.exe)
**Objetivo:** Entregar o arquivo executável final pronto para uso em qualquer PC/Notebook Windows.
- [ ] Configurar o `electron-builder` (no `package.json` ou em `electron-builder.json`) com nome, versão e metadados.
- [ ] Criar o ícone do aplicativo (`.ico` com 256×256).
- [ ] Executar script de build de produção (`npm run dist`).
- [ ] Gerar o arquivo instalador com nome sem acentos: `ShowDoCristao-Setup-1.0.0.exe`.
- [ ] Documentar o aviso do **Windows SmartScreen** (o instalador não terá assinatura digital) e como prosseguir com a instalação.
- **Validação:** Instalar o aplicativo em uma pasta do Windows e conferir a abertura pelo atalho da Área de Trabalho.

**Pontos a validar:**
- Versão portátil (`.exe` que roda sem instalar, útil em pen drive) além do instalador?
- Uso do nome/logo oficial da IPB: confirmar se há autorização para uso do símbolo.

---

### 🔹 Etapa 13: Automação com CI/CD (GitHub Actions e/ou GitLab CI/CD)
**Objetivo:** Praticar integração contínua (CI) e entrega contínua (CD). O repositório está no **GitHub** (decisão D1); nesta etapa será decidido se a pipeline roda no GitHub Actions, no GitLab (espelhando o repositório) ou em ambos.
- [ ] Criar a pipeline com os estágios:
  - `lint` / `typecheck`: validação estática do código TypeScript.
  - `test`: testes unitários do Vitest.
  - `build`: compilação da aplicação React e Electron.
  - `package`: geração automática do `.exe` do instalador como artefato de download.
- [ ] Executar a pipeline em um **runner local (Windows)** usando o hardware da própria máquina (GitHub self-hosted runner ou GitLab Runner).
- [ ] Testar a pipeline disparando um `git push`.
- **Validação:** Visualizar a pipeline verde e baixar o `.exe` gerado automaticamente pela esteira de CI/CD.

**Pontos a validar:**
- GitHub Actions (já integrado ao repositório atual) **ou** espelhar para o GitLab e usar GitLab CI/CD?
- Criar *releases* automáticas com o `.exe` anexado ao publicar uma tag de versão?
- Observação: o caminho da pasta local contém espaço e acento (`show do cristão`), o que pode causar problemas em algumas ferramentas de CI/runner; se ocorrer, clonar em um caminho sem acentos.
