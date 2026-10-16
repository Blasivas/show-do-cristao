import { useState } from 'react';
import { Flame, Play, Settings, BookOpen } from 'lucide-react';
import QuestionManager from '@/pages/QuestionManager';

export default function App() {
  const [contadorTeste, setContadorTeste] = useState(0);
  const [screen, setScreen] = useState<'demo' | 'questions'>('demo');

  if (screen === 'questions') return <QuestionManager onBack={() => setScreen('demo')} />;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#1a100b] via-[#140b07] to-[#0d0704] text-[#faf7f0] flex flex-col justify-between p-6 md:p-8 font-serif select-none">
      {/* Barra Superior Institucional Púlpito IPB */}
      <header className="flex items-center justify-between border-b-2 border-[#3d281a] pb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#8b1e1e] to-[#591313] flex items-center justify-center text-amber-200 shadow-md border border-[#c5a059]/40">
            <Flame className="w-6 h-6 fill-current text-amber-300" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-widest text-amber-100 uppercase flex items-center gap-2">
              Show do Cristão
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#c5a059]/40 bg-[#2d1d13] text-amber-300 font-bold">
                IPB
              </span>
            </h1>
            <p className="text-xs text-amber-200/60 font-serif">
              Igreja Presbiteriana do Brasil • Gincana de Auditório
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-amber-200/70 font-serif">
          <BookOpen className="w-4 h-4 text-[#d4af37]" />
          <span>Cânon Sagrado Oficial</span>
        </div>
      </header>

      {/* Conteúdo Central Nobre Bíblico */}
      <main className="flex-1 flex flex-col items-center justify-center text-center my-8 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c5a059]/40 bg-[#241710] text-amber-300 text-xs font-serif font-bold mb-6 shadow-sm">
          <span className="text-sm">✟</span>
          Identidade Visual: Bíblia Sagrada & Cânon de Escriba
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-amber-100 tracking-wider mb-3 uppercase drop-shadow-md">
          A Grande Gincana Bíblica
        </h2>

        <p className="text-sm md:text-base text-amber-200/80 max-w-xl mb-8 leading-relaxed font-serif">
          Aplicativo oficial para auditório e projeção na igreja, com pontuação secreta, cronômetro regressivo e suporte a equipes competindo no conhecimento das Sagradas Escrituras.
        </p>

        {/* Demonstração dos Estandartes das Equipes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
          {/* Estandarte Equipe Sarça Verde */}
          <div className="rounded-2xl border-2 border-[#166534]/50 bg-gradient-to-br from-[#0c2417] to-[#081910] p-6 text-left shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-emerald-400">
                ● Equipe I
              </span>
              <span className="text-xs font-serif font-bold tracking-widest text-emerald-300/80">
                SARÇA VERDE
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-100 mb-1 font-serif">0 TALENTOS</div>
            <p className="text-xs text-emerald-200/60 font-serif">
              Estandarte com o verde solene institucional da IPB
            </p>
          </div>

          {/* Estandarte Equipe Chama Dourada */}
          <div className="rounded-2xl border-2 border-[#b45309]/50 bg-gradient-to-br from-[#2a1708] to-[#1a0f05] p-6 text-left shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-amber-400">
                ● Equipe II
              </span>
              <span className="text-xs font-serif font-bold tracking-widest text-amber-300/80">
                CHAMA DOURADA
              </span>
            </div>
            <div className="text-3xl font-black text-amber-100 mb-1 font-serif">0 TALENTOS</div>
            <p className="text-xs text-amber-200/60 font-serif">
              Estandarte com o ouro da revelação e sabedoria
            </p>
          </div>
        </div>

        {/* Ações Centrais */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setScreen('questions')}
            className="flex items-center gap-2.5 bg-gradient-to-r from-[#8b1e1e] to-[#a62424] hover:brightness-110 text-amber-50 font-serif font-bold py-3 px-8 rounded-xl shadow-xl border border-amber-400/40 transition-all hover:scale-102 active:scale-98 text-sm"
          >
            <BookOpen className="w-5 h-5 text-amber-300" />
            Abrir o Livro de Perguntas (Cânon)
          </button>
          <button 
            onClick={() => setContadorTeste(prev => prev + 1)}
            className="flex items-center gap-2 border border-[#c5a059]/40 bg-[#241710] hover:bg-[#332014] text-amber-200 font-serif font-semibold py-3 px-6 rounded-xl transition-all hover:scale-102 active:scale-98 text-sm shadow-md"
          >
            <Play className="w-4 h-4 text-emerald-400 fill-current" />
            Testar Cliques ({contadorTeste})
          </button>
        </div>
      </main>

      {/* Rodapé Púlpito */}
      <footer className="flex flex-wrap items-center justify-between text-xs font-serif text-amber-200/60 border-t border-[#3d281a] pt-4">
        <div>Estilo: Bíblia Sagrada Edição Canônica • v1.0.0</div>
        <div className="flex items-center gap-2">
          <span>Pronto para a Etapa 5 (Configuração da Partida)</span>
          <Settings className="w-3.5 h-3.5 text-amber-400" />
        </div>
      </footer>
    </div>
  );
}
