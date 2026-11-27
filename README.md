# 🔥 Show do Cristão

Aplicativo desktop de quiz bíblico interativo desenvolvido para a **Igreja Presbiteriana do Brasil (IPB)**, criado para ser usado em gincanas e eventos de auditório com equipes (de 2 a 4) competindo em tempo real.

---

## 🎯 Sobre o Projeto

O **Show do Cristão** é um aplicativo instalável para Windows que permite ao apresentador de uma gincana conduzir um quiz bíblico com:

- **Mural de perguntas** estilo game show, onde as equipes escolhem o número da pergunta.
- **Cronômetro regressivo por pergunta** (ex.: 10 segundos), apenas indicativo — o apresentador decide o resultado.
- **Pontuação secreta** acumulada em segundo plano, revelada apenas ao final para gerar suspense.
- **Regra de roubo**: se uma equipe errar, outra equipe pode tentar e ganhar **50% dos pontos**.
- **Cadastro de perguntas** dentro do app (criar, editar, excluir, importar e exportar), salvas em um arquivo JSON simples e editável.
- **Tela de pódio** com revelação dramática do placar e confetes para a equipe campeã.
- **Funcionamento 100% offline**, pensado para locais sem internet (uso em notebook espelhado na TV).

O projeto está em desenvolvimento. O cadastro, o menu, a configuração, o mural e a tela da pergunta estão implementados. A Etapa 8 prevê a opção de desfazer uma jogada e o salvamento automático. O instalador está previsto na Etapa 12.

---

## 🛠️ Stack Tecnológica

| Tecnologia | Função |
|---|---|
| **React 18 + TypeScript** | Interface do usuário e componentes |
| **Vite 8** | Empacotador rápido para desenvolvimento e build |
| **Tailwind CSS 4** | Estilização com paleta institucional da IPB |
| **Electron** | Janela nativa do Windows (sem navegador) |
| **Node.js** | Acesso ao sistema de arquivos local |
| **Vitest** | Testes unitários (regras do jogo, perguntas e armazenamento) |
| **electron-builder** *(Etapa 12)* | Geração do instalador `.exe` para Windows |

---

## 🎨 Identidade Visual

O design do **Show do Cristão** segue a metáfora visual de uma **Bíblia Sagrada aberta sobre o púlpito**, com páginas em bifólio (duas páginas espelhadas), tipografia clássica serifada, versículos numerados com rubricas carmesim (`§ 1.`), encadernação de couro com relevo dourado e animação tridimensional de virada de folha com áudio de folhear papel bíblia sintetizado offline via Web Audio API.

A especificação completa das fontes, paleta de cores e componentes está documentada em [`docs/identidade-visual.md`](docs/identidade-visual.md).

Na configuração da gincana, os estandartes das quatro equipes acompanham o tema da página. A Etapa 5.2 aplica fundos suavemente coloridos em verde, âmbar, carmesim e azul no modo claro, com nomes escuros e campos brancos/marfim; numeração, legendas e setas também recebem versões para cada tema. A alternância de tema preserva os nomes e a ordem das equipes.

A **Etapa 5.3** refina a Bíblia fechada do menu inicial: couro marrom escuro com granulação fina, dourado envelhecido, lombada, bloco de páginas e contracapa com espessura. O livro fica em leve perspectiva e acompanha o mouse com inclinação suave, reflexo e sombra, retornando ao repouso quando o ponteiro sai da área. A textura e o volume são produzidos localmente com SVG e CSS 3D, para manter o funcionamento offline. O acompanhamento do mouse é suspenso durante as transições e diálogos, no uso do teclado e quando a redução de movimento está ativa.

A **Etapa 5.4** unifica o livro aberto das telas **Perguntas** e **Configuração da gincana**: mesma estrutura, dimensões, margens, encadernação, fitilho, cabeçalho e rodapé. A barra superior segue **Voltar → título → ações da função → ação principal → tema**. **Nova pergunta** e **Iniciar gincana** ocupam o mesmo canto superior direito e usam o mesmo acabamento; filtros e paginação ficam dentro do livro de perguntas. As ferramentas de pasta, importação, exportação e restauração continuam próprias do cadastro.

A **Etapa 5.5** refina a passagem das folhas do cadastro: virada completa sobre a lombada, com frente e verso, leve curvatura e sombras acompanhando o papel. O conteúdo seguinte é revelado por baixo, mantendo o texto da folha em movimento. A animação dura aproximadamente 650 ms, com movimento inverso ao voltar; setas, teclado e seletor de folhas são preservados, e a redução de movimento utiliza paginação sem giro.

A **Etapa 5.6** coordena a abertura da Bíblia em uma progressão de aproximadamente 800 ms: inclinação, capa, deslocamento e sombras acompanham o mesmo movimento. O livro se ajusta gradualmente à posição e ao tamanho das páginas de Perguntas ou Configuração, revelando o conteúdo suavemente; o retorno acompanha o caminho inverso. A navegação termina com a animação, e a redução de movimento continua respeitada.

---

## 📁 Estrutura do Projeto

Estrutura do projeto:

```
show-do-cristao/
├── docs/                        # Documentação do projeto
│   ├── identidade-visual.md     # Guia oficial de cores, tipografia e layout da Bíblia
│   └── plano-desenvolvimento.md # Roteiro completo de todas as etapas e decisões
├── electron/                    # Processo principal do Electron (janela nativa)
│   ├── main.ts                  # Janela, ciclo de vida, tela cheia e segurança
│   ├── preload.ts               # Ponte segura entre o Electron e o React
│   └── questionsIpc.ts          # Leitura/gravação do arquivo de perguntas, importar/exportar
├── scripts/
│   └── test-electron.mjs         # Regressão no Electron de produção com dados temporários
├── src/
│   ├── assets/
│   │   ├── audio/               # Efeitos sonoros do quiz
│   │   └── images/              # Logos e imagens
│   ├── components/              # Componentes reutilizáveis
│   ├── data/                    # Perguntas padrão (perguntas.json), copiadas na primeira abertura
│   ├── game/                    # Motor de regras e leitura das perguntas (funções puras + testes)
│   ├── pages/                   # Telas do aplicativo
│   ├── services/                # Serviços (áudio, armazenamento local)
│   ├── types/                   # Interfaces TypeScript
│   ├── App.tsx
│   ├── index.css                # Estilos globais e tema do Tailwind (@theme)
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Como Executar em Desenvolvimento

### Pré-requisitos
- [Node.js 22.12+](https://nodejs.org/) instalado (exigido pelo Electron)

### Instalação
```bash
# Clone o repositório
git clone https://github.com/Blasivas/show-do-cristao.git
cd show-do-cristao

# Instale as dependências
npm install

# Rode em modo de desenvolvimento (janela nativa do Electron)
npm run dev
```

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Abre o app na janela nativa do Electron com recarregamento automático |
| `npm run build` | Valida o TypeScript e gera o build de produção (`dist/` e `dist-electron/`) |
| `npm start` | Abre o build de produção na janela do Electron (rodar `npm run build` antes) |
| `npm test` | Executa os testes unitários (Vitest) |
| `npm run test:electron` | Verifica os fluxos no Electron de produção com dados temporários; executar `npm run build` antes |
| `npm run test:watch` | Executa os testes em modo contínuo, rodando de novo a cada alteração |
| `npm run typecheck` | Verifica a tipagem do TypeScript sem gerar build |

### Verificação dos fluxos no Electron

```bash
npm run build
npm run test:electron
```

O teste abre o app com uma pasta de dados temporária e remove esse perfil ao terminar. A Bíblia do menu, o layout compartilhado entre cadastro e configuração, o mural e a pergunta ativa são conferidos em 1280×720 e 1920×1080. As falhas de leitura e gravação e as escolhas de arquivos são simuladas apenas no processo criado pelo teste. As perguntas reais do usuário são preservadas. Capturas dos fluxos ficam em `scratch/`, pasta ignorada pelo Git.

A preferência por redução de movimento é emulada nos testes para conferir tanto o acompanhamento do mouse quanto a navegação com movimento reduzido. Essa emulação afeta somente a janela de teste, sem alterar as configurações do Windows. Ao abrir o app normalmente, o menu respeita a preferência do sistema: a perspectiva estática permanece visível, mas a inclinação pelo mouse fica desativada quando a redução de movimento está ativa.

### Atalhos da janela

| Tecla | Ação |
|---|---|
| `F11` | Entra/sai da tela cheia |
| `Esc` | Sai da tela cheia |

O aplicativo permite uma única instância. Ao abri-lo novamente, a janela existente é trazida para frente; se estiver minimizada, ela é restaurada.

---

## ❓ Perguntas

As perguntas são gerenciadas pela tela **Perguntas** do app (o botão **Abrir pasta das perguntas** abre a pasta direto no Explorador de Arquivos) e ficam salvas em:

```
%APPDATA%\show-do-cristao\perguntas\perguntas.json
```

Na primeira abertura, o arquivo é criado com as perguntas padrão de `src/data/perguntas.json` (dados de teste). Ele também pode ser editado à mão ou substituído (ex.: por um arquivo gerado por IA), desde que siga o formato:

```json
[
  {
    "pergunta": "Quem construiu a arca?",
    "alternativas": ["Moisés", "Noé", "Abraão", "Davi"],
    "correta": "B",
    "dificuldade": "facil"
  }
]
```

- `correta`: letra da alternativa certa (`A`, `B`, `C` ou `D`).
- `dificuldade`: `facil`, `medio` ou `dificil` (acentos e maiúsculas são aceitos).
- As quatro alternativas devem ser diferentes. A comparação ignora acentos, maiúsculas e espaços no início ou fim do texto; essa regra vale também para arquivos importados ou editados à mão. Se uma pergunta for inválida, a importação inteira é recusada, sem alterar o banco atual.
- As perguntas são **ordenadas automaticamente**: primeiro as fáceis, depois as médias, depois as difíceis. Uma pergunta nova (ou que mudou de dificuldade) vai para o final do grupo da sua dificuldade.
- Se o arquivo tiver algum erro, o app mostra o problema e permite corrigi-lo, importar outro banco ou restaurar as perguntas padrão (guardando uma cópia do arquivo com erro). A gincana fica bloqueada até que o banco seja carregado corretamente; o app não troca silenciosamente as perguntas pelas de teste.
- Antes de substituir todas as perguntas (restaurar ou importar), o app guarda uma cópia `perguntas.backup-<data>-<id>.json` na mesma pasta. O identificador exclusivo evita colisões entre backups.
- As operações de gravação são executadas em sequência e usam arquivos temporários exclusivos. Backup e substituição fazem parte da mesma operação.
- A lista e o formulário só confirmam alterações após o arquivo ser salvo. Durante a gravação, o app mostra **Salvando…** e impede ações sobrepostas; em caso de falha, preserva o rascunho e permite tentar novamente.
- Ao editar ou excluir, a folha atual é mantida enquanto existir; se ela deixar de existir, o cadastro mostra a última folha válida. Substituir todo o banco ou restaurar o padrão volta à primeira folha.

Essas proteções foram implementadas na **Etapa 5.1**, antes do avanço para o mural.

---

## 📋 Regras do Jogo

1. Em uma única tela, o apresentador configura a quantidade e os nomes das equipes (2 a 4), a **ordem das equipes** (com os botões subir/descer; a primeira começa), o tempo do cronômetro por pergunta e se o "roubo de pergunta" está ativo.
2. A virada da folha revela o mural na mesma Bíblia aberta da configuração. O índice agrupa os números do cadastro por dificuldade, com uma pergunta por linha. A equipe da vez escolhe um número e a folha se abre para revelar o enunciado. As perguntas já respondidas continuam visíveis, esmaecidas e bloqueadas. As equipes **se revezam a cada pergunta** na ordem definida (A, B, C, A, B, C…).
3. A folha mostra as quatro alternativas (A, B, C, D). O apresentador marca a letra que a equipe disse em voz alta. A ampulheta começa ao fim da abertura da folha e fica oculta na configuração **Sem limite**.
4. Ao chegar a zero, a ampulheta sinaliza **Tempo esgotado**. A equipe ainda pode responder, e o apresentador pode marcar e confirmar a letra.
5. Ao clicar em **Confirmar resposta**, o aplicativo verifica a alternativa e mostra o resultado.
   - ✅ **Acerto:** A equipe ganha **100%** dos pontos da questão.
   - ❌ **Erro + Roubo ativo:** A **próxima equipe na ordem** recebe o tempo completo e três alternativas disponíveis. A letra que a primeira equipe errou fica apagada e bloqueada. Um acerto no roubo vale **50% dos pontos**. A próxima pergunta continua na ordem original de equipes.
   - ❌ **Erro sem Roubo:** Ninguém pontua.
6. Um erro aparece em vermelho com um X. A resposta correta é destacada em verde no fim da pergunta, inclusive após o único roubo permitido. Ao voltar ao mural após uma resposta confirmada, a pergunta fica esmaecida, marcada como **Respondida** e indisponível.
7. A pontuação é **mantida em segredo** até o encerramento da gincana.
8. Ao final, o placar é revelado dramaticamente com animação de confetes para a equipe vencedora.

Ao voltar ao mural, o resultado fica registrado no histórico da partida em andamento. A equipe da vez e a quantidade de perguntas disponíveis são atualizadas. [Plano de desenvolvimento](./docs/plano-desenvolvimento.md)

---

## 📊 Pontuação por Dificuldade

| Nível | Pontos (Acerto direto) | Pontos (Roubo) |
|---|---|---|
| 🟢 Fácil | 10 pts | 5 pts |
| 🟡 Médio | 20 pts | 10 pts |
| 🔴 Difícil | 30 pts | 15 pts |

---

## 📖 Documentação

- [Roteiro de Desenvolvimento](./docs/plano-desenvolvimento.md) — Plano completo com todas as etapas, checklists, critérios de validação, pontos a validar e registro de decisões.

---

## 📅 Status de Desenvolvimento

- ✅ **Etapa 0 a Etapa 4:** Infraestrutura base, Electron offline, regras puras e CRUD completo de perguntas.
- ✅ **Etapa 4.1 — concluída com pendência de validação visual:** Identidade visual Bíblia Sagrada (bifólio, virada 3D ancorada na medianiz, áudio de folhear páginas, modo claro/noturno e 4 versículos por página com distribuição harmônica). A melhoria de fluidez da animação foi implementada e conferida tecnicamente na Etapa 5.5; aguarda validação visual do usuário.
- ✅ **Etapa 5:** Estado global com Context + Reducer, transições de tela, tela inicial em Capa da Bíblia Fechada, animações 3D de abertura e fechamento da Bíblia com áudio sintetizado, fundo unificado nos modos Claro e Noturno, tela de Configuração da Partida em Bíblia Aberta (bifólio), seleção e ordenação de 2 a 4 equipes com estandartes visuais, tempo do cronômetro único e regra de roubo.
- ✅ **Etapa 5.1 — concluída tecnicamente, aguardando validação do usuário:** Gravação segura das perguntas, recuperação de erros do cadastro, validação consistente de alternativas, bloqueio de início com banco inválido e correção de paginação. Em 14/11/2026: 72 testes em 6 arquivos, tipagem, build e 14 cenários no Electron de produção aprovados. Alterações sem commit ou push.
- ✅ **Etapa 5.2 — concluída e validada pelo usuário:** Estandartes da configuração com fundos suavemente coloridos no modo claro e cores adequadas no noturno. Em 14/11/2026: 72 testes em 6 arquivos, tipagem, build e 15 cenários no Electron de produção aprovados, incluindo contraste dos nomes e identificações e preservação dos nomes e da ordem ao alternar o tema. Alterações sem commit ou push.
- ✅ **Etapa 5.3 — concluída e validada pelo usuário:** Bíblia 3D do menu inicial com couro marrom escuro, granulação fina, dourado envelhecido, espessura visível e movimento suave pelo mouse. Em 14/11/2026: 72 testes em 6 arquivos, tipagem, build e 19 cenários no Electron aprovados; capa conferida nos dois temas em 1280×720 e 1920×1080. Sem novas dependências, commit ou push.
- ✅ **Etapa 5.4 — concluída tecnicamente, aguardando validação do usuário:** Layout compartilhado do livro aberto para Perguntas e Configuração da gincana, com ferramentas contextuais e ações principais padronizadas no cabeçalho. Em 14/11/2026: 72 testes em 6 arquivos, tipagem, build e 20 cenários no Electron aprovados; as duas telas foram conferidas nos dois temas em 1280×720 e 1920×1080. Alterações sem commit ou push.
- ✅ **Etapa 5.5 — concluída tecnicamente, aguardando validação do usuário:** Virada completa das folhas do cadastro, com frente e verso, curvatura discreta, sombras e ritmo natural de aproximadamente 650 ms. Preserva a navegação atual e respeita a redução de movimento. Em 20/11/2026: 72 testes em 6 arquivos, tipagem, build e 24 cenários no Electron aprovados; 16 capturas conferidas nos dois temas em 1280×720 e 1920×1080, incluindo frente e verso no avanço e retorno. Sem novas dependências, commit ou push.
- ✅ **Etapa 5.6 — concluída e validada pelo usuário em 20/11/2026:** Abertura contínua da Bíblia e encaixe gradual nas telas de Perguntas e Configuração, com fechamento inverso coerente e alinhamento do papel e do fitilho. Em 20/11/2026: 72 testes em 6 arquivos, tipagem, build e 27 cenários no Electron aprovados; 32 capturas finais conferidas nos dois destinos e temas, em 1280×720 e 1920×1080, incluindo início, meio, encaixe e fechamento. Sem novas dependências. O usuário autorizou o commit consolidado das alterações acumuladas das Etapas 5.1 a 5.6, sem push.
- ✅ **Etapa 6 — concluída e validada em 27/11/2026:** Índice bíblico com uma linha por pergunta, um título por dificuldade, equipe da vez e bloqueio das perguntas respondidas. A folha da configuração vira para abrir o mural, e o enunciado se abre a partir da linha escolhida.
- ✅ **Etapa 7 — concluída e validada em 27/11/2026:** Tela da pergunta com ampulheta indicativa e verificação automática. O roubo tem três alternativas disponíveis, e as perguntas respondidas ficam bloqueadas no mural.
- 🔜 **Próximas etapas:** Etapas 8 a 13.

> Veja o [plano de desenvolvimento](./docs/plano-desenvolvimento.md) para acompanhar o progresso detalhado de cada etapa.

| Etapa | Status |
|---|---|
| 0 — Ambiente & Estrutura de Pastas | ✅ Concluído |
| 1 — Ecossistema Base (React + Vite + Tailwind + IPB) | ✅ Concluído |
| 2 — Integração com Electron (segurança, F11, offline) | ✅ Concluído |
| 2.1 — Migração do Tailwind CSS 3 → 4 | ✅ Concluído |
| 2.2 — Atualização do Vite 6 → 8 | ✅ Concluído |
| 3 — Modelagem de Dados, Motor de Regras & Perguntas | ✅ Concluído |
| 4 — Armazenamento Local & Cadastro de Perguntas (CRUD) | ✅ Concluído |
| 4.1 — Identidade Visual Bíblia Sagrada & Design System | ✅ Concluído; animação da 5.5 aguardando validação |
| 5 — Estado Global, Navegação & Configuração da Partida | ✅ Concluído |
| 5.1 — Gravação Segura das Perguntas & Recuperação de Erros | ✅ Concluído tecnicamente; aguardando validação |
| 5.2 — Tema dos Estandartes na Configuração | ✅ Concluído e validado pelo usuário |
| 5.3 — Bíblia 3D no Menu Inicial | ✅ Concluído e validado pelo usuário |
| 5.4 — Layout Único do Livro Aberto | ✅ Concluído tecnicamente; aguardando validação |
| 5.5 — Virada Realista das Folhas | ✅ Concluído tecnicamente; aguardando validação |
| 5.6 — Abertura Contínua & Encaixe do Livro | ✅ Concluído e validado pelo usuário |
| 6 — Mural de Perguntas | ✅ Concluído e validado |
| 7 — Tela de Pergunta, Cronômetro & Controles do Apresentador | ✅ Concluído e validado |
| 8 — Pontuação Secreta, Roubo, Desfazer & Salvamento Automático | ⏳ Pendente |
| 9 — Pódio & Revelação Final | ⏳ Pendente |
| 10 — Efeitos Audiovisuais & Ajustes de Projeção | ⏳ Pendente |
| 11 — Qualidade: Lint, Testes Automatizados & Integrados | ⏳ Pendente |
| 12 — Geração do Instalador `.exe` | ⏳ Pendente |
| 13 — CI/CD (GitHub Actions e/ou GitLab) | ⏳ Pendente |

---

## 📄 Licença

Projeto desenvolvido para uso interno da Igreja Presbiteriana do Brasil.
