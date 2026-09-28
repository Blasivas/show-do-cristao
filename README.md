# 🔥 Show do Cristão

Aplicativo desktop de quiz bíblico interativo desenvolvido para a **Igreja Presbiteriana do Brasil (IPB)**, criado para ser usado em gincanas e eventos de auditório com duas equipes competindo em tempo real.

---

## 🎯 Sobre o Projeto

O **Show do Cristão** é um aplicativo instalável para Windows que permite ao apresentador de uma gincana conduzir um quiz bíblico com:

- **Mural de perguntas** estilo game show, onde as equipes escolhem o número da pergunta.
- **Cronômetro regressivo** configurável por pergunta.
- **Pontuação secreta** acumulada em segundo plano, revelada apenas ao final para gerar suspense.
- **Regra de roubo**: se uma equipe errar, a adversária pode tentar e ganhar **50% dos pontos**.
- **Tela de pódio** com revelação dramática do placar e confetes para a equipe campeã.

---

## 🛠️ Stack Tecnológica

| Tecnologia | Função |
|---|---|
| **React 18 + TypeScript** | Interface do usuário e componentes |
| **Vite** | Empacotador rápido para desenvolvimento e build |
| **Tailwind CSS** | Estilização com paleta institucional da IPB |
| **Electron** | Janela nativa do Windows (sem navegador) |
| **Node.js** | Acesso ao sistema de arquivos local |
| **electron-builder** | Geração do instalador `.exe` para Windows |

---

## 🎨 Identidade Visual

A paleta de cores é inspirada na identidade oficial da **Igreja Presbiteriana do Brasil**:

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

```
show-do-cristao/
├── docs/                        # Documentação do projeto
│   └── plano-desenvolvimento.md # Roteiro completo de todas as etapas
├── electron/                    # Processo principal do Electron (janela nativa)
│   ├── main.ts
│   └── preload.ts
├── src/
│   ├── assets/
│   │   ├── audio/               # Efeitos sonoros do quiz
│   │   └── images/              # Logos e imagens
│   ├── components/              # Componentes reutilizáveis
│   ├── data/                    # Banco de perguntas padrão (JSON)
│   ├── pages/                   # Telas do aplicativo
│   ├── services/                # Serviços (áudio, armazenamento local)
│   ├── types/                   # Interfaces TypeScript
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Como Executar em Desenvolvimento

### Pré-requisitos
- [Node.js 20+](https://nodejs.org/) instalado

### Instalação
```bash
# Clone o repositório
git clone https://github.com/Blasivas/show-do-cristao.git
cd show-do-cristao

# Instale as dependências
npm install

# Rode em modo de desenvolvimento (navegador)
npm run dev
```

---

## 📋 Regras do Jogo

1. O apresentador configura os nomes das equipes, o tempo do cronômetro e se o "roubo de pergunta" está ativo.
2. O mural exibe os números das perguntas disponíveis. A equipe da vez escolhe um número.
3. A pergunta é exibida com 4 alternativas (A, B, C, D) e o cronômetro inicia.
4. O apresentador valida a resposta:
   - ✅ **Acerto:** A equipe ganha **100%** dos pontos da questão.
   - ❌ **Erro + Roubo ativo:** A equipe adversária pode tentar e, se acertar, ganha **50%** dos pontos.
   - ❌ **Erro sem Roubo:** Ninguém pontua.
5. A pontuação é **mantida em segredo** até o encerramento da gincana.
6. Ao final, o placar é revelado dramaticamente com animação de confetes para a equipe vencedora.

---

## 📊 Pontuação por Dificuldade

| Nível | Pontos (Acerto direto) | Pontos (Roubo) |
|---|---|---|
| 🟢 Fácil | 10 pts | 5 pts |
| 🟡 Médio | 20 pts | 10 pts |
| 🔴 Difícil | 30 pts | 15 pts |

---

## 📖 Documentação

- [Roteiro de Desenvolvimento](./docs/plano-desenvolvimento.md) — Plano completo com todas as etapas, checklists e critérios de validação.

---

## 📅 Status de Desenvolvimento

> Projeto em desenvolvimento ativo. Veja o [plano de desenvolvimento](./docs/plano-desenvolvimento.md) para acompanhar o progresso de cada etapa.

| Etapa | Status |
|---|---|
| 0 — Ambiente & Estrutura de Pastas | ✅ Concluído |
| 1 — Ecossistema Base (React + Vite + Tailwind + IPB) | ✅ Concluído |
| 2 — Integração com Electron | 🔄 Próxima |
| 3 — Modelagem de Dados & Perguntas | ⏳ Pendente |
| 4 — Cadastro de Perguntas (CRUD) | ⏳ Pendente |
| 5 — Configuração da Partida | ⏳ Pendente |
| 6 — Mural de Perguntas | ⏳ Pendente |
| 7 — Tela de Pergunta & Cronômetro | ⏳ Pendente |
| 8 — Motor de Jogo & Pontuação Secreta | ⏳ Pendente |
| 9 — Pódio & Revelação Final | ⏳ Pendente |
| 10 — Efeitos Audiovisuais & Tela Cheia | ⏳ Pendente |
| 11 — Testes Integrados | ⏳ Pendente |
| 12 — Geração do Instalador `.exe` | ⏳ Pendente |
| 13 — CI/CD com GitLab Runner | ⏳ Pendente |

---

## 📄 Licença

Projeto desenvolvido para uso interno da Igreja Presbiteriana do Brasil.
