# 🔥 Show do Cristão

Aplicativo desktop de quiz bíblico interativo desenvolvido para a **Igreja Presbiteriana do Brasil (IPB)**, criado para ser usado em gincanas e eventos de auditório com duas equipes competindo em tempo real.

---

## 🎯 Sobre o Projeto

O **Show do Cristão** é um aplicativo instalável para Windows que permite ao apresentador de uma gincana conduzir um quiz bíblico com:

- **Mural de perguntas** estilo game show, onde as equipes escolhem o número da pergunta.
- **Cronômetro regressivo por pergunta** (ex.: 10 segundos), apenas indicativo — o apresentador decide o resultado.
- **Pontuação secreta** acumulada em segundo plano, revelada apenas ao final para gerar suspense.
- **Regra de roubo**: se uma equipe errar, a adversária pode tentar e ganhar **50% dos pontos**.
- **Tela de pódio** com revelação dramática do placar e confetes para a equipe campeã.
- **Funcionamento 100% offline**, pensado para locais sem internet (uso em notebook espelhado na TV).

---

## 🛠️ Stack Tecnológica

| Tecnologia | Função |
|---|---|
| **React 18 + TypeScript** | Interface do usuário e componentes |
| **Vite 8** | Empacotador rápido para desenvolvimento e build |
| **Tailwind CSS 4** | Estilização com paleta institucional da IPB |
| **Electron** | Janela nativa do Windows (sem navegador) |
| **Node.js** | Acesso ao sistema de arquivos local |
| **Vitest** *(Etapa 3)* | Testes unitários do motor de regras |
| **electron-builder** *(Etapa 12)* | Geração do instalador `.exe` para Windows |

---

## 🎨 Identidade Visual

A paleta de cores é inspirada na identidade oficial da **Igreja Presbiteriana do Brasil** e fica definida no bloco `@theme` do `src/index.css` (usada como classes, ex.: `bg-ipb-darkest`, ou como variáveis CSS, ex.: `var(--color-ipb-darkest)`):

| Token | Hex | Uso |
|---|---|---|
| `ipb-darkest` | `#082517` | Fundo principal (projeção) |
| `ipb-dark` | `#0d5131` | Verde solene institucional |
| `ipb-primary` | `#1b6b45` | Verde principal |
| `ipb-medium` | `#3c816a` | Verde folha (portal oficial IPB) |
| `ipb-glow` | `#38af00` | Verde sarça ardente (destaque) |
| `gold` | `#eab308` | Dourado (símbolo e celebração) |

---

## 📁 Estrutura do Projeto

Estrutura planejada (itens marcados com `*` ainda serão criados nas próximas etapas):

```
show-do-cristao/
├── docs/                        # Documentação do projeto
│   └── plano-desenvolvimento.md # Roteiro completo de todas as etapas
├── electron/                    # Processo principal do Electron (janela nativa)
│   ├── main.ts                  # Janela, ciclo de vida, tela cheia e segurança
│   └── preload.ts               # Ponte segura entre o Electron e o React
├── src/
│   ├── assets/
│   │   ├── audio/               # Efeitos sonoros do quiz
│   │   └── images/              # Logos e imagens
│   ├── components/              # Componentes reutilizáveis
│   ├── data/                    # Banco de perguntas padrão (defaultQuestions.json)
│   ├── game/                    # * Motor de regras (funções puras + testes) — Etapa 3
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
| `npm run dev:web` | Abre o app apenas no navegador (`http://localhost:5173`), útil para testes rápidos |
| `npm run build` | Valida o TypeScript e gera o build de produção (`dist/` e `dist-electron/`) |
| `npm start` | Abre o build de produção na janela do Electron (rodar `npm run build` antes) |

### Atalhos da janela

| Tecla | Ação |
|---|---|
| `F11` | Entra/sai da tela cheia |
| `Esc` | Sai da tela cheia |

---

## 📋 Regras do Jogo

1. O apresentador configura os nomes das equipes, o tempo do cronômetro por pergunta e se o "roubo de pergunta" está ativo.
2. O mural exibe os números das perguntas disponíveis. A equipe da vez escolhe um número.
3. A pergunta é exibida com 4 alternativas (A, B, C, D) e o cronômetro inicia.
4. O cronômetro é **apenas indicativo**: ao chegar a zero ele sinaliza "Tempo esgotado", mas não conta como erro automaticamente.
5. O apresentador valida a resposta:
   - ✅ **Acerto:** A equipe ganha **100%** dos pontos da questão.
   - ❌ **Erro + Roubo ativo:** A equipe adversária pode tentar e, se acertar, ganha **50%** dos pontos.
   - ❌ **Erro sem Roubo:** Ninguém pontua.
6. A resposta correta só é revelada depois da decisão final da pergunta (inclusive após o roubo).
7. A pontuação é **mantida em segredo** até o encerramento da gincana.
8. Ao final, o placar é revelado dramaticamente com animação de confetes para a equipe vencedora.

> Algumas regras ainda estão em definição (ex.: de quem é a vez após um roubo, se o cronômetro reinicia no roubo). Veja os "Pontos a validar" no [plano de desenvolvimento](./docs/plano-desenvolvimento.md).

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

> Projeto em desenvolvimento ativo. Veja o [plano de desenvolvimento](./docs/plano-desenvolvimento.md) para acompanhar o progresso de cada etapa.

| Etapa | Status |
|---|---|
| 0 — Ambiente & Estrutura de Pastas | ✅ Concluído |
| 1 — Ecossistema Base (React + Vite + Tailwind + IPB) | ✅ Concluído |
| 2 — Integração com Electron (segurança, F11, offline) | ✅ Concluído |
| 2.1 — Migração do Tailwind CSS 3 → 4 | ✅ Concluído |
| 2.2 — Atualização do Vite 6 → 8 | ✅ Concluído |
| 3 — Modelagem de Dados, Motor de Regras & Perguntas | 🔄 Próxima |
| 4 — Armazenamento Local & Cadastro de Perguntas (CRUD) | ⏳ Pendente |
| 5 — Estado Global, Navegação & Configuração da Partida | ⏳ Pendente |
| 6 — Mural de Perguntas | ⏳ Pendente |
| 7 — Tela de Pergunta, Cronômetro & Controles do Apresentador | ⏳ Pendente |
| 8 — Pontuação Secreta, Roubo, Desfazer & Salvamento Automático | ⏳ Pendente |
| 9 — Pódio & Revelação Final | ⏳ Pendente |
| 10 — Efeitos Audiovisuais & Ajustes de Projeção | ⏳ Pendente |
| 11 — Qualidade: Lint, Testes Automatizados & Integrados | ⏳ Pendente |
| 12 — Geração do Instalador `.exe` | ⏳ Pendente |
| 13 — CI/CD (GitHub Actions e/ou GitLab) | ⏳ Pendente |

---

## 📄 Licença

Projeto desenvolvido para uso interno da Igreja Presbiteriana do Brasil.