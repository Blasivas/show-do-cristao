# Show do Cristão — Roteiro de Desenvolvimento Passo a Passo

Este documento serve como o **guia de acompanhamento** de todo o ciclo de desenvolvimento do aplicativo. Cada etapa é independente, possui objetivos claros e critérios de validação para que você possa acompanhar cada linha de evolução.

---

## Progresso Geral

- [x] **Etapa 0:** Preparação de Ambiente & Estrutura de Pastas *(Concluído)*
- [x] **Etapa 1:** Configuração do Ecossistema Base (`package.json`, Vite, TypeScript & Tailwind - Paleta IPB) *(Concluído)*
- [ ] **Etapa 2:** Integração com o Electron (Janela Desktop Nativa)
- [ ] **Etapa 3:** Modelagem de Dados & Banco Inicial de Perguntas (`types` e `perguntas.json`)
- [ ] **Etapa 4:** Módulo de Cadastro & Gerenciamento de Perguntas (CRUD do Apresentador)
- [ ] **Etapa 5:** Tela de Configuração da Partida (Equipes, Timer & Regra do Roubo)
- [ ] **Etapa 6:** O Mural de Perguntas (Grade Interativa de Números)
- [ ] **Etapa 7:** Tela de Pergunta Ativa & Cronômetro Regressivo
- [ ] **Etapa 8:** Motor de Jogo & Pontuação Secreta (Regras de Roubo a 50%)
- [ ] **Etapa 9:** Tela de Encerramento & Grande Pódio (Revelação e Confetes)
- [ ] **Etapa 10:** Efeitos Audiovisuais & Modo Tela Cheia (F11)
- [ ] **Etapa 11:** Testes Integrados de Ponta a Ponta
- [ ] **Etapa 12:** Geração do Instalador Windows (`.exe` com `electron-builder`)
- [ ] **Etapa 13:** Automação com CI/CD (GitLab CI/CD & Runner Local) *(Para aprendizado)*

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
- [x] Configurar `tailwind.config.js` e `src/index.css` com paleta de cores institucional IPB (Verde escuro, Verde médio, Dourado da sarça, Branco).
- [x] Criar o `index.html` e `src/main.tsx` inicial com demonstração reativa das equipes.
- **Validação:** Compilação do TypeScript e Vite bem-sucedida (`npm run build`).

---

### 🔹 Etapa 2: Integração com o Electron (Janela Nativa)
**Objetivo:** Permitir que o aplicativo abra em uma janela nativa do Windows em vez do navegador.
- [ ] Criar `electron/main.ts` (controle de ciclo de vida da janela, resolução 1280x720 mínima, suporte a Fullscreen).
- [ ] Criar `electron/preload.ts` (canal seguro de comunicação entre Node e React).
- [ ] Criar script no `package.json` para iniciar o Electron apontando para o servidor de desenvolvimento.
- **Validação:** Executar o comando e ver a janela nativa do Windows abrindo o app sem barras de navegador.

---

### 🔹 Etapa 3: Modelagem de Dados & Perguntas Iniciais
**Objetivo:** Definir as regras de negócio em código TypeScript e criar o catálogo de perguntas bíblicas padrão.
- [ ] Criar `src/types/game.ts`:
  - Interface `Question` (enunciado, 4 alternativas, resposta correta, dificuldade Fácil/Médio/Difícil, pontuação 10/20/30).
  - Interface `GameConfig` (nomes das equipes, tempo limite, roubo ativo).
  - Interface `GameState` (rodada atual, equipe da vez, pontuações secretas).
- [ ] Criar `src/data/defaultQuestions.json` com **20 perguntas bíblicas prontas** (distribuídas entre fáceis, médias e difíceis).
- **Validação:** Confirmar que o TypeScript valida os tipos sem erros de tipagem.

---

### 🔹 Etapa 4: Módulo de Gerenciamento de Perguntas (Apresentador)
**Objetivo:** Permitir que o apresentador cadastre, edite, visualize e exclua perguntas antes de começar a gincana.
- [ ] Criar `src/services/storageService.ts` para salvar e carregar perguntas do disco local.
- [ ] Criar página `src/pages/QuestionManager.tsx`:
  - Formulário para adicionar nova pergunta (com seletor de dificuldade e marcação da alternativa correta).
  - Lista de perguntas cadastradas com contador e botão para excluir.
  - Botão para restaurar perguntas padrão bíblicas.
- **Validação:** Cadastrar uma nova pergunta na interface e conferir se ela permanece salva ao recarregar a tela.

---

### 🔹 Etapa 5: Tela de Configuração da Partida
**Objetivo:** Preparar as regras antes de a gincana começar.
- [ ] Criar página `src/pages/GameConfig.tsx`:
  - Inputs para nome da **Equipe A** e **Equipe B**.
  - Seletor de tempo no cronômetro (`Sem tempo`, `15s`, `30s`, `45s`, `60s`).
  - Interruptor (toggle) para **"Permitir Roubo de Pergunta"**.
  - Botão de ação: **"Iniciar Gincana"**.
- **Validação:** Ao clicar em iniciar, os dados configurados são repassados com sucesso para o estado global do jogo.

---

### 🔹 Etapa 6: Mural de Perguntas (Grade de Números)
**Objetivo:** A tela central do jogo onde as equipes escolhem qual pergunta querem abrir.
- [ ] Criar componente `src/components/QuestionBoard.tsx` (grade de cartões com números `1`, `2`, `3`...).
- [ ] Indicar no topo de qual equipe é a vez de escolher.
- [ ] Desabilitar e marcar visualmente números de perguntas que já foram respondidas.
- [ ] Incluir o botão fixo no topo: **"Encerrar Gincana"** com modal de confirmação.
- **Validação:** Clicar num número disponível e navegar para a tela de pergunta correspondente.

---

### 🔹 Etapa 7: Tela da Pergunta Ativa & Cronômetro
**Objetivo:** A tela de grande impacto visual que o público e as equipes veem durante a resposta.
- [ ] Criar página `src/pages/QuestionView.tsx`:
  - Enunciado da pergunta com tipografia grande e clara para leitura à distância.
  - 4 botões de alternativas (A, B, C, D) estilizados.
  - Tag visual da dificuldade (Fácil: Verde, Médio: Amarelo, Difícil: Vermelho).
- [ ] Criar componente `src/components/Timer.tsx`:
  - Barra ou círculo regressivo com contagem visual.
  - Efeito de pulsar em vermelho nos últimos 5 segundos.
- **Validação:** Testar a contagem regressiva e garantir que para ao chegar em zero.

---

### 🔹 Etapa 8: Motor de Jogo & Pontuação Secreta
**Objetivo:** Implementar o coração das regras (pontuação oculta e repasse de roubo a 50%).
- [ ] Criar controles exclusivos do apresentador na tela de pergunta:
  - Botão **"Correto"** (soma 100% dos pontos para a equipe da vez).
  - Botão **"Incorreto"** (não pontua).
  - Botão **"Dar chance de roubo"** (se ativo na partida):
    - Transfere o direito de responder para a equipe adversária.
    - Se a adversária acertar, credita **50% dos pontos**.
- [ ] Garantir que **nenhum número de placar é exibido no telão** nesta fase.
- [ ] Atualizar a lista de perguntas respondidas e alternar a equipe da vez ao retornar ao mural.
- **Validação:** Simular rodada completa de acerto, erro e roubo validando se os pontos internos bateram.

---

### 🔹 Etapa 9: Tela de Encerramento & Grande Pódio
**Objetivo:** O clímax da gincana com suspense e celebração.
- [ ] Criar página `src/pages/FinalPodium.tsx`:
  - Animação de revelação gradual do placar secreto de cada equipe.
  - Destaque triunfal com troféu para a equipe campeã (ou tela amigável de empate).
  - Efeito de explosão de confetes na tela (`canvas-confetti`).
  - Botão para "Jogar Nova Partida" ou "Voltar ao Menu".
- **Validação:** Encerrar uma partida e verificar a exibição correta das pontuações e do vencedor.

---

### 🔹 Etapa 10: Efeitos Audiovisuais & Modo Tela Cheia
**Objetivo:** Dar o clima de auditório de TV ao evento.
- [ ] Criar `src/services/audioService.ts`:
  - Sons sintetizados via Web Audio API (dispensa arquivos pesados externos):
    - Tique-taque de tensão no cronômetro.
    - Som de acerto (comemoração).
    - Som de erro ("buzzer").
    - Fanfarra final da vitória.
- [ ] Suporte a tecla de atalho **F11** para entrar/sair de Tela Cheia no Windows.
- **Validação:** Testar os sons com fone/caixa de som e alternar tela cheia com F11.

---

### 🔹 Etapa 11: Testes Integrados
**Objetivo:** Garantir estabilidade total antes de gerar o instalador.
- [ ] Simular uma partida inteira de 10 a 20 perguntas.
- [ ] Testar cenários de borda: encerramento no meio do jogo, todas as perguntas esgotadas, empates.
- [ ] Validar cadastro de novas perguntas personalizadas e exclusões.

---

### 🔹 Etapa 12: Geração do Instalador Windows (.exe)
**Objetivo:** Entregar o arquivo executável final pronto para uso em qualquer PC/Notebook Windows.
- [ ] Configurar `electron-builder.json` com nome, versão e metadados.
- [ ] Executar script de build de produção (`npm run dist`).
- [ ] Gerar o arquivo instalador: `ShowDoCristao-Setup-1.0.0.exe`.
- **Validação:** Instalar o aplicativo em uma pasta do Windows e conferir a abertura pelo atalho da Área de Trabalho.

---

### 🔹 Etapa 13: Automação com CI/CD (GitLab CI/CD & Runner Local)
**Objetivo:** Praticar integração contínua (CI) e entrega contínua (CD) usando o GitLab, experimentando tanto os runners em nuvem quanto um GitLab Runner instalado na própria máquina local (Windows).
- [ ] Criar o arquivo `.gitlab-ci.yml` na raiz com os estágios:
  - `lint` / `type-check`: validação estática do código TypeScript.
  - `build`: compilação da aplicação React e Electron.
  - `package`: geração automática do `.exe` do instalador como artefato de download.
- [ ] Instalar e registrar o **GitLab Runner local (Windows)** para executar a pipeline usando o hardware da própria máquina sem consumir minutos da cota do GitLab.
- [ ] Testar a pipeline disparando um `git push`.
- **Validação:** Visualizar o pipeline verde no GitLab e baixar o `.exe` gerado automaticamente pela esteira de CI/CD.
