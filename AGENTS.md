# Instruções para assistentes de código

## Regras do projeto
- **Nunca fazer `git commit` ou `git push` sem autorização explícita do usuário.** Ao concluir uma etapa, apresentar o resumo das mudanças e aguardar a validação.
- Antes de alterar código em uma nova etapa, apresentar a proposta e os "Pontos a validar" e aguardar aprovação.
- O roteiro, as decisões tomadas (D1, D2, …) e os pontos em aberto ficam em `docs/plano-desenvolvimento.md`. Mantê-lo e o `README.md` atualizados a cada etapa.
- Toda a comunicação e a documentação são em português.

## Ambiente
- Node.js 24 LTS via nvm-windows (mínimo 22.12, exigido pelo Electron).
- Novas dependências: fixar a versão exata e preferir versões publicadas há mais de 7 dias.

## Comandos de verificação
- `npm test`: testes unitários (Vitest)
- `npm run typecheck`: tipagem TypeScript
- `npm run build`: build de produção (React + Electron)
- `npm run dev`: janela do Electron; `npm run dev:web`: somente navegador; `npm start`: abre o build de produção

## Observações
- Ao rodar o Electron a partir do Devin Desktop, remover a variável `ELECTRON_RUN_AS_NODE` herdada do ambiente.
- A ferramenta de edição pode corromper emojis (🟩/🔹) em títulos do plano; conferir com `grep` por `\xEF\xBF\xBD` após editar.
