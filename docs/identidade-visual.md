# Identidade Visual & Design System • Show do Cristão

> **Conceito Central:** *Bíblia Sagrada Edição de Luxo / Livro Sagrado Encadernado*  
> Uma experiência visual imersiva, reverente e solene, inspirada na tradição presbiteriana e na estética de Bíblias de estudo clássicas encadernadas em couro nobre, com páginas de papel bíblia marfim, capitulares ornamentadas, rubricas canônicas e douração de corte.

---

## 1. Filosofia de Design

O **Show do Cristão** adota a metáfora visual de uma **Bíblia Sagrada aberta sobre o púlpito**. Em vez de interfaces genéricas de aplicativos modernos ou dashboards de produtividade ("Tech Bento"), toda a interação do usuário acontece folheando as páginas de um livro vivo:

- **Reverência e Tradição:** Tons de pergaminho, couro nobre, carmesim bíblico e douração suave.
- **Autenticidade Editorial:** Diagramação em bifólio (páginas esquerda e direita espelhadas), numeração de versículos (`§ 1.` / expoentes), capitulares (*drop caps*) e vinhetas clássicas.
- **Tátil e Imersivo:** Efeito 3D tridimensional de virada de página e som analógico suave de folhear papel bíblia (sintetizado offline via Web Audio API).
- **Legibilidade Superior:** Contraste harmonioso com fundo marfim suave (`#faf7f0`) e tinta grafite profundo (`#1c1917`), evitando fadiga visual durante leituras e gincanas de auditório prolongadas.

---

## 2. Tipografia

A tipografia é o coração da identidade bíblica, estabelecendo a nobreza de cada passagem e versículo.

### 2.1 Famílias Tipográficas

| Papel | Família / Fallbacks | Uso Principal |
| :--- | :--- | :--- |
| **Serifada Clássica (Primária)** | `"Palatino Linotype", "Book Antiqua", Palatino, "Baskerville", Georgia, serif` | Títulos canônicos, cabeçalhos de capítulos, texto sagrado dos versículos (perguntas), alternativas de resposta e capitulares. |
| **Sans-serif Funcional (Apoio)** | `Roboto, system-ui, -apple-system, sans-serif` | Badges de pontos, botões utilitários de sistema (arquivos, backup, modal técnico) e contadores rápidos. |
| **Monospaçada Discreta** | `ui-monospace, "Courier New", monospace` | Identificadores de sistema (`perguntas.json`), atalhos e códigos técnicos. |

### 2.2 Hierarquia & Escala Tipográfica

- **Título do Livro / Cabeçalho Superior:** Versaletes (*Small Caps*), `font-serif tracking-widest uppercase`, tamanho `13px` a `16px`, tom sépia escuro com vinheta ornamental (`❦` ou `✟`).
- **Capitular de Abertura (*Drop Cap*):** Fonte serifada clássica em caixa-alta, tamanho `42px` a `56px`, cor carmesim bíblico (`#8b1e1e`), ocupando 2 a 3 linhas de altura no Prólogo.
- **Enunciado do Versículo (Pergunta):** `font-serif text-[15px] leading-relaxed font-medium text-[#1c1917]`.
- **Identificador de Versículo:** Símbolo `§` ou número de versículo em negrito versalete, na cor carmesim ou ouro velho (`#991b1b` / `#b45309`).
- **Alternativas de Resposta:** `font-serif text-[13px]`, letras capitais (**A**, **B**, **C**, **D**) em medalhões circulares de bronze/ouro envelhecido.
- **Rubricas de Resposta Correta:** Destaque sutil com filete esmeralda ou carmesim suave e ícone de selo de confirmação.

---

## 3. Paleta de Cores e Tokens Visuais

```
      [Capa de Couro Profundo]
         #1c100b / #2a1810
                │
    ┌───────────┴───────────┐
    ▼                       ▼
[Página Esquerda]       [Página Direita]
#faf7f0 (Marfim Bíblia) #faf7f0 (Marfim Bíblia)
    │                       │
    └───────────┬───────────┘
                ▼
        [Medianiz / Lombada]
      Sombra Côncava Suave
```

### 3.1 Papel e Folhas (Páginas do Livro)

| Token / Variável | Valor Hex | Descrição / Uso |
| :--- | :--- | :--- |
| **Papel Bíblia Nobre** | `#faf7f0` | Fundo principal das páginas internas (leitura suave e sem brilho agressivo). |
| **Pergaminho Sutil** | `#f3ede2` | Fundo de destaque para notas de rodapé, citações e cabeçalhos de folha. |
| **Borda do Bloco de Folhas** | `#e8dfce` | Delimitação externa das páginas simulando corte de papel encorpado. |
| **Medianiz (Costura Central)** | `linear-gradient(to right, ...)` | Sombra tridimensional côncava que simula a profundidade da dobra do livro aberto. |
| **Douração de Corte** | `#c5a059` / `#d4af37` | Filetes duplos, molduras decorativas e cantoneiras clássicas de luxo. |

### 3.2 Tinta e Tipografia

| Token / Variável | Valor Hex | Descrição / Uso |
| :--- | :--- | :--- |
| **Tinta Grafite Bíblico** | `#1c1917` | Cor primária para enunciados de perguntas e textos de leitura. |
| **Tinta Sépia Antiga** | `#443831` | Alternativas de respostas não selecionadas e subtítulos secundários. |
| **Tinta Atenuada (Glosa)** | `#786b62` | Referências bíblicas, dados informativos e notas marginais. |
| **Rubrica Canônica (Carmesim)** | `#991b1b` / `#8b1e1e` | Números de versículos, títulos sagrados, destaque de dificuldade difícil e avisos. |

### 3.3 Encadernação & Ambiente Externo

| Token / Variável | Valor Hex | Descrição / Uso |
| :--- | :--- | :--- |
| **Couro Café Imperial** | `#1c120c` | Fundo da capa do livro e textura de encadernação de mesa de púlpito. |
| **Couro Borda & Lombada** | `#2d1d13` | Contornos da capa de couro e suporte lateral do livro. |
| **Couro Verde IPB Solene** | `#0a2215` | Variante institucional solene (verde histórico da IPB). |
| **Madeira de Púlpito** | `#120c08` | Fundo da aplicação atrás do livro aberto com iluminação focal central. |

### 3.4 Marcadores de Cetim (Fitilhos)

| Token / Variável | Valor Hex | Descrição / Uso |
| :--- | :--- | :--- |
| **Fitilho Rubro** | `#881337` com ponta dourada | Marcador de fita de cetim vermelho suspenso entre as folhas. |
| **Fitilho Dourado** | `#b45309` com reflexo âmbar | Marcador de fita de cetim secundário para salto de capítulos. |

### 3.5 Dificuldades Canônicas (Talentos & Dificuldade)

- **Fácil (10 Pontos):** Selo esmeralda clássico (`#166534` / fundo `#ecfdf5` suave).
- **Médio (20 Pontos):** Selo ouro velho / âmbar (`#854d0e` / fundo `#fefce8` suave).
- **Difícil (30 Pontos):** Selo rubi carmesim (`#991b1b` / fundo `#fef2f2` suave).

---

## 4. Estrutura e Componentes da Interface Bíblica

### 4.1 O Livro Aberto (Bifólio)
- **Proporção:** 2 páginas espelhadas divididas por um vinco central sombreado (medianiz).
- **Margens:** Medianiz interna com margem generosa para respiração do texto; margens externas com espaço para glosas (botões de edição rápida).
- **Cabeçalho Canônico:** Cada página tem o título do capítulo no topo com filete duplo dourado e ornamento central.
- **Rodapé Canônico:** Numeração das folhas em algarismos romanos ou arábicos tradicionais e marcadores de fitilho para navegação rápida.

### 4.2 Animação 3D & Áudio de Folhear
- **Virada de Folha 3D:** Transformação tridimensional (`perspective(1400px) rotateY(...)`) com centro de rotação na medianiz.
- **Som de Papel Bíblia:** Síntese sonora em tempo real via Web Audio API (filtro passa-faixa com envelope exponencial suave de ruído branco), funcionando 100% offline sem nenhum arquivo de áudio pesado.

### 4.3 Ferramentas e Ações
- As ações de controle (Voltar, Nova Pergunta, Importar, Exportar, Restaurar, Pasta) são esculpidas em uma barra de ferramentas superior discreta em tom de encadernação/couro, com botões de acabamento metálico bronze/dourado escovado.
- Os modais de edição e criação de perguntas assumem a forma de uma **"Ficha de Escriba / Caderno Canônico"**, mantendo a mesma estética de papel bíblia e encadernação de couro.

---

## 5. Diretrizes de Implementação

1. **Descarte do Tech Bento:** Toda a aplicação adota exclusivamente a identidade visual da Bíblia Sagrada. Não há alternador de estilos ou modo bento.
2. **Cores Fixas de Livro:** O design de livro bíblico possui contraste e luminosidade próprios (fundo marfim suave com ambiente escuro de púlpito), garantindo excelente visualização tanto em telas de notebook quanto em projeção de igreja.
3. **Preservação de Código:** Nenhuma alteração no motor de jogo ([`src/game/engine.ts`](file:///c:/Users/Matheus/Desktop/show%20do%20crist%C3%A3o/src/game/engine.ts)), no armazenamento ([`src/services/questionStorage.ts`](file:///c:/Users/Matheus/Desktop/show%20do%20crist%C3%A3o/src/services/questionStorage.ts)) ou nos testes automatizados.
