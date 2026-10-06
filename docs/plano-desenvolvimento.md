# Show do Cristão — Roteiro de Desenvolvimento Passo a Passo

Este documento serve como o **guia de acompanhamento** de todo o ciclo de desenvolvimento do aplicativo. Cada etapa é independente, possui objetivos claros e critérios de validação para que você possa acompanhar cada linha de evolução.

Cada etapa também traz uma seção **"Pontos a validar"**: são dúvidas e sugestões de melhoria que **ainda não foram decididas**. A ideia é discutir cada uma delas ao chegar na etapa correspondente, testando na própria aplicação, e registrar o resultado no [Registro de Decisões](#-registro-de-decisões).

---

## Progresso Geral

- [x] **Etapa 0:** Preparação de Ambiente & Estrutura de Pastas *(Concluído)*
- [x] **Etapa 1:** Configuração do Ecossistema Base (`package.json`, Vite, TypeScript & Tailwind - Paleta IPB) *(Concluído)*
- [x] **Etapa 2:** Integração com o Electron (Janela Desktop Nativa, Segurança & Funcionamento Offline) *(Concluído)*
- [x] **Etapa 2.1:** Migração do Tailwind CSS 3 → 4 *(Concluído)*
- [x] **Etapa 2.2:** Atualização do Vite 6 → 8 *(Concluído)*
- [ ] **Etapa 3:** Modelagem de Dados, Motor de Regras & Banco Inicial de Perguntas (com testes unitários)
- [ ] **Etapa 4:** Armazenamento Local & Gerenciamento de Perguntas (CRUD do Apresentador)
- [ ] **Etapa 5:** Estado Global, Navegação & Tela de Configuração da Partida
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
| D7 | 2026-10-05 | Mantido o **modo navegador** para desenvolvimento rápido (`npm run dev:web`). |
| D8 | 2026-10-05 | **Node.js 22.12+** passa a ser obrigatório: todas as versões suportadas do Electron (42, 43 e 44) exigem essa versão, e o Node 20 está fora de suporte. Electron fixado em `44.4.5`. Ambiente de desenvolvimento atualizado para o Node **24 LTS** (gerenciado pelo nvm-windows). |
| D9 | 2026-10-05 | Migração para o **Tailwind CSS 4** ainda no início do desenvolvimento (menos telas para revisar), usando o plugin `@tailwindcss/vite` no lugar do PostCSS. A configuração do tema passa a ficar no `@theme` do `src/index.css`. |
| D10 | 2026-10-05 | Atualização para o **Vite 8** (Rolldown/Oxc) ainda no início do desenvolvimento. Remove os avisos do `vite-plugin-electron`, a dependência do `esbuild` e acelera os builds. |

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
- [x] Criar scripts no `package.json`: `dev` (janela do Electron), `dev:web` (somente navegador), `build` (React + Electron) e `start` (abre o build de produção no Electron).
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

### 🔹 Etapa 3: Modelagem de Dados, Motor de Regras & Perguntas Iniciais
**Objetivo:** Definir as regras de negócio em código TypeScript, de forma **isolada da interface** (funções puras), testável, e criar o catálogo de perguntas bíblicas padrão.
- [ ] Criar `src/types/game.ts`:
  - Interface `Question`: `id`, enunciado, 4 alternativas, índice da resposta correta, dificuldade (Fácil/Médio/Difícil) e, opcionalmente, `reference` (referência bíblica, ex.: "Gn 1:1") e `category`.
  - A pontuação (10/20/30) é **derivada da dificuldade**, e não armazenada na pergunta, para evitar inconsistências.
  - Interface `GameConfig`: nomes das equipes, tempo do cronômetro por pergunta, roubo ativo.
  - Interface `GameState`: tela atual, equipe da vez, perguntas respondidas, pontuações secretas e histórico de jogadas.
- [ ] Criar `src/game/engine.ts` com as regras como **funções puras** (acerto, erro, roubo, troca de vez, fim de jogo).
- [ ] Instalar o **Vitest** e criar testes unitários do motor de regras (acerto = 100%, roubo = 50%, erro sem roubo = 0, troca de vez, empate).
- [ ] Criar `src/data/defaultQuestions.json` com **20 perguntas bíblicas prontas** (distribuídas entre fáceis, médias e difíceis), cada uma com referência bíblica.
- **Validação:** `tsc` sem erros de tipagem e todos os testes do Vitest passando (`npm test`).

**Pontos a validar:**
- Após um roubo (com ou sem acerto), de quem é a vez de escolher a próxima pergunta?
- O roubo de 50% em perguntas de pontuação ímpar: arredondar para cima ou para baixo? (Com 10/20/30 não ocorre, mas importa se as pontuações forem personalizáveis.)
- O modelo deve suportar mais de 2 equipes no futuro? (Custo baixo se pensado agora.)
- Usar categorias (ex.: Antigo Testamento, Novo Testamento, Personagens)?

---

### 🔹 Etapa 4: Armazenamento Local & Gerenciamento de Perguntas (Apresentador)
**Objetivo:** Permitir que o apresentador cadastre, edite, visualize e exclua perguntas antes de começar a gincana, com os dados salvos no computador.
- [ ] Criar `src/services/storageService.ts` para salvar e carregar perguntas:
  - No Electron: arquivo JSON na pasta de dados do usuário (`app.getPath('userData')`), acessado pelo React via IPC exposto no `preload`.
  - No navegador (modo de desenvolvimento web): fallback para `localStorage`.
- [ ] Criar página `src/pages/QuestionManager.tsx`:
  - Formulário para **adicionar e editar** pergunta (seletor de dificuldade, marcação da alternativa correta, referência bíblica).
  - Validação do formulário (enunciado e 4 alternativas obrigatórios, uma alternativa correta marcada).
  - Lista de perguntas cadastradas com contador, filtro por dificuldade e botões de editar e excluir (com confirmação).
  - Botão para restaurar perguntas padrão bíblicas (com confirmação).
- **Validação:** Cadastrar e editar uma pergunta na interface, fechar e reabrir o aplicativo e conferir se as alterações permanecem salvas.

**Pontos a validar:**
- **Importar/Exportar** perguntas em arquivo JSON (backup e compartilhamento entre igrejas/departamentos).
- Separar "banco de perguntas" de "perguntas da partida": escolher quais (ou quantas) perguntas entram em cada gincana.
- Embaralhar a ordem das alternativas automaticamente?

---

### 🔹 Etapa 5: Estado Global, Navegação & Tela de Configuração da Partida
**Objetivo:** Definir como as telas se comunicam e preparar as regras antes de a gincana começar.
- [ ] Criar o estado global do jogo com `useReducer` + Context, usando o motor de regras da Etapa 3.
- [ ] Criar a navegação entre telas (Menu Inicial → Perguntas → Configuração → Mural → Pergunta → Pódio).
  - Sugestão: uma "máquina de telas" simples no estado global, sem biblioteca de rotas. Se for usado um roteador, deve ser `HashRouter` (compatível com arquivos locais `file://` do Electron).
- [ ] Criar página `src/pages/MainMenu.tsx` (Iniciar Gincana, Gerenciar Perguntas, Sair).
- [ ] Criar página `src/pages/GameConfig.tsx`:
  - Inputs para nome da **Equipe A** e **Equipe B**.
  - Seletor de tempo do cronômetro **por pergunta** (ex.: `Sem tempo`, `10s`, `15s`, `30s`, `45s`, `60s`).
  - Interruptor (toggle) para **"Permitir Roubo de Pergunta"**.
  - Botão de ação: **"Iniciar Gincana"**.
- **Validação:** Ao clicar em iniciar, os dados configurados são repassados com sucesso para o estado global do jogo e o mural é exibido.

**Pontos a validar:**
- O tempo deve ser único para todas as perguntas da partida ou pode variar por pergunta/dificuldade (ex.: difíceis com mais tempo)?
- Quantidade de perguntas da partida: sugerir número **par** e equilibrado por dificuldade, para ser justo com as duas equipes?
- Qual equipe começa: sempre a Equipe A ou sorteio?
- Lembrar a última configuração usada?

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
  - Revelação da alternativa correta (e da referência bíblica, se houver) **somente após** a decisão final da pergunta, inclusive após o roubo.
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
