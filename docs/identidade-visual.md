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

### 3.6 Modo Noturno ("Códice Noturno")

Para ambientes escuros ou projeção com luz apagada, o aplicativo conta com o **Códice Noturno**, ativado pelo botão Sol ☀️ / Lua 🌙:

| Elemento | Modo Claro (Papel Marfim - Padrão) | Modo Noturno (Códice Noturno) |
| :--- | :--- | :--- |
| **Páginas do Livro** | Marfim suave `#faf7f0` | Carvão/café profundo `#18130e` |
| **Texto dos Versículos** | Grafite bíblico `#1c1917` | Marfim dourado `#ede6d8` / `#faf7f0` |
| **Rubricas de Versículo** | Carmesim clássico `#8b1e1e` | Carmesim luminoso `#f87171` |
| **Alternativas (Comum)** | Fundo `#ffffff/80`, borda `#e2d8c6` | Fundo `#221a14/90`, borda `#382618` |
| **Alternativa Correta** | Fundo `#fef3c7`, borda `#fbbf24` | Fundo `#341d13`, borda `#f59e0b` |
| **Ambiente Externo** | Madeira de púlpito `#241610` | Ébano profundo `#120905` |
| **Formulários & Modais** | Fundo marfim `#faf6ee` | Fundo códice `#1a1410` |

---

## 4. Estrutura e Componentes da Interface Bíblica

### 4.1 O Livro Aberto (Bifólio)
- **Proporção:** 2 páginas espelhadas divididas por um vinco central sombreado (medianiz).
- **Margens:** Medianiz interna com margem generosa para respiração do texto; margens externas com espaço para glosas (botões de edição rápida).
- **Cabeçalho Canônico:** Cada página tem o título do capítulo no topo com filete duplo dourado e ornamento central.
- **Rodapé Canônico:** Numeração das folhas em algarismos romanos ou arábicos tradicionais e marcadores de fitilho para navegação rápida.

### 4.2 Animação 3D & Áudio de Folhear
- **Virada de Folha 3D:** Transformação tridimensional com centro de rotação na medianiz. A Etapa 5.5 refina a direção visual com uma folha completa, frente e verso, curvatura discreta e sombra projetada; os critérios estão na seção 4.6.
- **Som de Papel Bíblia:** Síntese sonora em tempo real via Web Audio API (filtro passa-faixa com envelope exponencial suave de ruído branco), funcionando 100% offline sem nenhum arquivo de áudio pesado.

### 4.3 Ferramentas e Ações
- As ações de controle (Voltar, Nova pergunta, Iniciar gincana, Importar, Exportar, Restaurar, Pasta e Tema) são organizadas em uma barra superior discreta, com tamanhos, bordas, tipografia e acabamento consistentes nos dois temas. As ferramentas exibidas correspondem à função de cada tela.
- Os modais de edição e criação de perguntas assumem a forma de uma **"Ficha de Escriba / Caderno Canônico"**, mantendo a mesma estética de papel bíblia e encadernação de couro.

### 4.4 Bíblia Fechada no Menu Inicial — Etapa 5.3

Direção aprovada em 14/11/2026 (D41–D43), implementada e conferida nos dois temas em 1280×720 e 1920×1080, com validação do usuário na aplicação atualizada:

- **Material:** couro marrom escuro com granulação fina, vincos discretos e douração envelhecida com aparência de relevo. A textura é procedural e local, produzida com SVG e CSS.
- **Volume:** capa, contracapa, lombada arredondada e bloco de páginas com corte dourado formam um livro com espessura visível. A pose de repouso fica levemente inclinada em perspectiva de três quartos, mantendo a leitura do título e dos controles.
- **Interação:** sobre a área da Bíblia, o ponteiro provoca uma inclinação suave de até ±5° em relação à pose de repouso, com reflexo e sombra acompanhando o movimento. Ao sair da área, o livro retorna suavemente ao repouso; não há balanço automático contínuo.
- **Estabilidade:** o cálculo do ponteiro usa uma área que não é transformada junto com o livro. A inclinação e o giro de abertura/fechamento ficam em camadas separadas, para evitar oscilações e facilitar os cliques nos botões.
- **Acessibilidade e navegação:** o acompanhamento do mouse é suspenso em diálogos, na navegação por teclado, em dispositivos de ponteiro impreciso e quando a redução de movimento está ativa; a perspectiva estática do livro continua visível. Durante a abertura e o fechamento, a Bíblia fica frontal para sincronizar o giro da capa. A redução de movimento também elimina as transições 3D de abertura e fechamento. Os elementos de textura e iluminação não interceptam cliques.
- **Temas e offline:** o acabamento conserva a identidade de couro e ouro nos modos Claro e Noturno, com iluminação e sombras adequadas ao ambiente. O menu usa recursos locais e não requer uma biblioteca 3D adicional.

### 4.5 Layout Único do Livro Aberto — Etapa 5.4

Direção aprovada em 14/11/2026 (D44–D45), implementada e conferida nas duas telas, nos dois temas e em 1280×720 e 1920×1080; a validação visual do usuário na aplicação atualizada permanece pendente:

- **Estrutura compartilhada:** Perguntas e Configuração da gincana usam o mesmo quadro de livro aberto, com dimensões, encadernação, sombras, fitilho, medianiz e rodapé comuns. Os componentes `OpenBookLayout` e `BookPage` concentram essa estrutura e recebem o conteúdo de cada função.
- **Cabeçalho:** organização comum **Voltar → título da tela → ações da função → ação principal → tema**. Botões de mesma importância compartilham altura, borda, tipografia, foco e estados desabilitados; `BookToolbarButton` padroniza as ferramentas em ícones.
- **Ações principais:** **Nova pergunta** e **Iniciar gincana** ocupam o mesmo canto superior direito e têm o mesmo acabamento. O resumo da partida permanece dentro da página de configuração.
- **Ferramentas contextuais:** pasta, importar, exportar e restaurar pertencem ao cadastro de perguntas. Filtros de dificuldade e paginação ficam dentro do livro, em uma faixa organizada para essas funções.
- **Páginas e conteúdo:** os cabeçalhos, margens e rodapés das páginas seguem o mesmo padrão, com o corpo adaptado a cada conteúdo. O cadastro mantém quatro perguntas por página e oito por folha aberta; a configuração acomoda de duas a quatro equipes e os parâmetros da partida.
- **Continuidade de uso:** a unificação mantém a navegação atual, a virada de folhas e os fluxos de erro, restauração e salvamento. Os estados selecionados e desabilitados devem ser identificáveis nos dois temas.

### 4.6 Virada Realista das Folhas — Etapa 5.5

Direção aprovada em 20/11/2026 (D46–D47), implementada e conferida nas fases de frente e verso do avanço e retorno, nos dois temas e em 1280×720 e 1920×1080. A validação visual do usuário na aplicação atualizada permanece pendente:

- **Movimento da folha:** no avanço, a folha direita atravessa a lombada em aproximadamente 180° e pousa à esquerda; no retorno, a folha esquerda faz o caminho inverso. O quadro do livro e seus controles permanecem estáveis.
- **Frente e verso:** o conteúdo da folha em movimento é preservado em cada face, mantendo a leitura na orientação correta. O próximo conteúdo é revelado por baixo, sem substituição brusca de texto no meio do giro.
- **Papel e profundidade:** uma curvatura discreta nas bordas, luz sobre a superfície e sombra projetada acompanham a posição da folha. A intensidade do acabamento respeita o papel marfim do modo Claro e a paleta do modo Noturno.
- **Ritmo:** duração inicial de aproximadamente 650 ms, com início suave, passagem mais rápida pelo centro e acomodação no final. A volta utiliza a mesma sequência em sentido inverso.
- **Navegação e acessibilidade:** setas, teclado e seletor de folhas continuam disponíveis, com proteção contra movimentos sobrepostos. Cópias visuais da animação ficam sem interação e ocultas para tecnologias assistivas. A preferência de redução de movimento utiliza paginação sem giro.
- **Continuidade:** filtros, alterações no banco e saída da tela encerram a animação com segurança. O cadastro mantém quatro perguntas por página, e a configuração da gincana conserva as páginas fixas e a estrutura compartilhada da Etapa 5.4.

---

### 4.7 Abertura Contínua & Encaixe do Livro — Etapa 5.6

Direção aprovada em 20/11/2026 (D48–D49), implementada e conferida nas fases de início, meio, encaixe e fechamento dos dois destinos, nos dois temas e em 1280×720 e 1920×1080. O usuário validou o resultado na aplicação atualizada em 20/11/2026:

- **Progressão coordenada:** inclinação, capa, deslocamento e sombras acompanham a mesma abertura, com duração inicial de aproximadamente 800 ms. O movimento começa na pose visível da Bíblia, tem início suave e acomoda o livro ao final.
- **Continuidade de enquadramento:** o livro se ajusta gradualmente à posição e ao tamanho reais das páginas de Perguntas ou Configuração, evitando uma substituição brusca por outra geometria. O conteúdo surge suavemente enquanto o livro alcança o encaixe final; papel e fitilho permanecem alinhados durante essa revelação.
- **Conclusão e retorno:** a navegação é concluída quando a animação termina. Ao voltar ao menu, o livro percorre o caminho inverso, com fechamento coerente e liberação dos controles ao final.
- **Interação e acessibilidade:** o couro, o volume e a inclinação pelo mouse são preservados. Os controles ficam protegidos durante a transição; cliques repetidos, redimensionamento e mudanças da preferência de movimento devem encerrar ou ajustar a animação com segurança. A redução de movimento utiliza a navegação sem giro.
- **Temas e conferência:** abertura e fechamento foram verificados nos modos Claro e Noturno, em 1280×720 e 1920×1080, nos dois destinos, incluindo redimensionamento e o alinhamento do papel e do fitilho. O efeito usa recursos locais, sem novas dependências.

---

### 4.8 Mural de Perguntas — Etapa 6

- Ao iniciar a gincana, a folha direita da configuração vira sobre a lombada com a animação de folhear do cadastro. Ela revela a grade na mesma Bíblia aberta, mantendo a moldura, as margens e a lombada no lugar. Com redução de movimento, a passagem é direta.
- O mural segue a composição de um índice bíblico. As seções Perguntas fáceis, médias e difíceis usam os destaques verde, âmbar e carmesim. O título aparece uma vez, na primeira folha em que a seção começa. Cada pergunta ocupa uma linha clicável, com pontilhado e número à direita. Com 20 perguntas, os números 1 a 10 ficam à esquerda e 11 a 20 à direita.
- A linha respondida mantém o número em cores neutras, recebe o rótulo Respondida e fica desativada. O mural preserva o sigilo de quem acertou e da pontuação.
- A equipe da vez e o contador aparecem na mesma faixa interna usada no cadastro e na configuração. Para bancos maiores, as linhas rolam dentro de cada folha.
- Ao selecionar uma linha, a folha da pergunta parte da sua posição, inclina levemente e se amplia até o centro. O enunciado aparece ao longo da abertura de 460 ms. A redução de movimento abre a pergunta diretamente.

## 5. Diretrizes de Implementação

1. **Descarte do Tech Bento:** Toda a aplicação adota exclusivamente a identidade visual da Bíblia Sagrada.
2. **Alternância Claro/Escuro Sagrada:** O Modo Claro (Papel Marfim) é o padrão de fábrica. O Modo Noturno (Códice Noturno) preserva toda a atmosfera editorial clássica do livro sagrado, invertendo suavemente a luminosidade das páginas sem romper a imersão.
3. **Escopo das Mudanças Visuais:** Refinamentos de aparência e interação ficam nos componentes e estilos correspondentes, preservando o motor de jogo (`src/game/engine.ts`) e o armazenamento (`src/services/questionStorage.ts`). Os testes de regressão devem acompanhar os comportamentos visuais e de navegação aprovados.
