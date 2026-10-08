import { useState } from 'react';
import { Header } from './components/Header';
import { MarketStall } from './components/MarketStall';
import { ShoppingPanels } from './components/ShoppingPanels';
import { TherapistPanel } from './components/TherapistPanel';
import { VoiceControls } from './components/VoiceControls';
import { useGame } from './hooks/useGame';
import { useSpeech } from './hooks/useSpeech';

export default function App() {
  const { state, challenge, choose, reset } = useGame();
  const speech = useSpeech(state.mensaje);
  const [therapistOpen, setTherapistOpen] = useState(false);
  return (
    <>
      <a className="skip-link" href="#mercado">
        Ir a los productos
      </a>
      <div className="market-app">
        <Header challenge={challenge} />
        <main className="market-layout">
          <MarketStall
            state={state}
            choose={choose}
            reset={reset}
            speech={speech}
          />
          <ShoppingPanels
            state={state}
            challenge={challenge}
            openTherapist={() => setTherapistOpen(true)}
          />
        </main>
        <VoiceControls speech={speech} />
        <footer className="credits">
          Pictogramas: Sergio Palao ·{' '}
          <a href="https://arasaac.org" target="_blank" rel="noreferrer">
            ARASAAC
          </a>{' '}
          · Gobierno de Aragón · CC BY-NC-SA
        </footer>
      </div>
      <TherapistPanel
        open={therapistOpen}
        close={() => setTherapistOpen(false)}
        state={state}
        reset={reset}
      />
    </>
  );
}
