import { useState } from 'react';
import { Flame, Play, Settings, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  const [contadorTeste, setContadorTeste] = useState(0);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-ipb-darkest via-ipb-dark to-ipb-darkest flex flex-col justify-between p-8">
      {/* Barra Superior Institucional */}
      <header className="flex items-center justify-between border-b border-ipb-medium/30 pb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-ipb-primary flex items-center justify-center border-2 border-gold shadow-glow-gold">
            <Flame className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white uppercase flex items-center gap-2">
              Show do Cristão
              <span className="text-xs px-2 py-0.5 rounded bg-ipb-medium text-white font-normal">IPB</span>
            </h1>
            <p className="text-xs text-ipb-light">Igreja Presbiteriana do Brasil — Gincana Bíblica</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-ipb-light">
            <BookOpen className="w-4 h-4 text-gold" />
            <span>Edição Especial de Auditório</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Central de Boas-Vindas e Demonstração da Paleta */}
      <main className="flex-1 flex flex-col items-center justify-center text-center my-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ipb-primary/40 border border-gold/40 text-gold-light text-sm mb-6 animate-pulse">
          <Sparkles className="w-4 h-4" />
          Identidade Visual IPB Ativada (Verde Solene, Dourado & Branco)
        </div>

        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-md">
          A GRANDE GINCANA BÍBLICA
        </h2>

        <p className="text-lg text-emerald-100/80 max-w-2xl mb-8">
          Ambiente base configurado com sucesso! Teste abaixo a interação dos componentes do React e as cores temáticas das duas equipes.
        </p>

        {/* Demonstração dos Cards das Equipes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-8">
          {/* Card Equipe Verde (Sarça Ardente) */}
          <div className="bg-ipb-primary/30 border-2 border-emerald-400/50 rounded-2xl p-6 shadow-card-dark flex flex-col items-center">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1">Equipe 1</div>
            <h3 className="text-2xl font-black text-white mb-2">SARÇA VERDE</h3>
            <div className="text-3xl font-bold text-emerald-300">0 pts</div>
            <span className="text-xs text-emerald-400/70 mt-2">Paleta Institucional Verde</span>
          </div>

          {/* Card Equipe Dourada (Chama do Altar) */}
          <div className="bg-amber-950/30 border-2 border-gold/50 rounded-2xl p-6 shadow-card-dark flex flex-col items-center">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">Equipe 2</div>
            <h3 className="text-2xl font-black text-white mb-2">CHAMA DOURADA</h3>
            <div className="text-3xl font-bold text-gold">0 pts</div>
            <span className="text-xs text-amber-400/70 mt-2">Paleta Dourada da Sarça</span>
          </div>
        </div>

        {/* Botão de Teste de Interatividade React */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setContadorTeste(prev => prev + 1)}
            className="flex items-center gap-2 bg-gradient-to-r from-ipb-medium to-ipb-primary hover:from-ipb-primary hover:to-ipb-dark text-white font-bold py-3 px-8 rounded-xl border border-ipb-light/40 shadow-glow-green transition-all transform hover:scale-105 active:scale-95"
          >
            <Play className="w-5 h-5 text-gold fill-gold" />
            Testar Interatividade (Cliques: {contadorTeste})
          </button>
        </div>
      </main>

      {/* Rodapé Informativo */}
      <footer className="flex items-center justify-between text-xs text-ipb-light/60 border-t border-ipb-medium/20 pt-4">
        <div>Etapa 1 Concluída: React + Vite + Tailwind + TypeScript</div>
        <div className="flex items-center gap-2">
          <span>Pronto para integrar com Electron</span>
          <Settings className="w-3.5 h-3.5" />
        </div>
      </footer>
    </div>
  );
}
