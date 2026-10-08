import { useEffect, useRef } from 'react';
import {
  ChartNoAxesColumnIncreasing,
  Download,
  RotateCcw,
  X,
} from 'lucide-react';
import { market } from '../data/market';
import { agentState, objectiveWords, type GameState } from '../domain/game';

export function TherapistPanel({
  open,
  close,
  state,
  reset,
}: {
  open: boolean;
  close: () => void;
  state: GameState;
  reset: (index?: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  function exportEvents() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              escenario: market.retos[state.reto_idx].id_reto,
              estado: agentState(state),
              monedas: state.monedas,
              errores_totales: state.errores_totales,
              log_eventos: state.log_eventos,
            },
            null,
            2,
          ),
        ],
        { type: 'application/json' },
      ),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `pictomarket-${market.retos[state.reto_idx].id_reto}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <dialog
      ref={dialog}
      className="therapist-dialog"
      aria-labelledby="therapist-heading"
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="dialog-content">
        <header className="dialog-heading">
          <div>
            <span className="eyebrow">ACOMPAÑAMIENTO</span>
            <h2 id="therapist-heading">
              <ChartNoAxesColumnIncreasing aria-hidden="true" />
              Panel del terapeuta
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={close}
            aria-label="Cerrar panel del terapeuta"
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <p className="panel-description">
          Configura la actividad y revisa las decisiones de apoyo de esta
          sesión.
        </p>
        <label className="scenario-label">
          Escenario de compra
          <select
            value={state.reto_idx}
            onChange={(event) => reset(Number(event.target.value))}
          >
            {market.retos.map((challenge, index) => (
              <option key={challenge.id_reto} value={index}>
                {objectiveWords(challenge).join(' ').toLowerCase()} · nivel{' '}
                {challenge.nivel}
              </option>
            ))}
          </select>
        </label>
        <div className="therapist-stats">
          <div>
            <strong>
              {state.items_en_carrito.length} /{' '}
              {market.retos[state.reto_idx].lista_correcta.length}
            </strong>
            <span>Productos comprados</span>
          </div>
          <div>
            <strong>{state.errores_totales}</strong>
            <span>Errores totales</span>
          </div>
          <div>
            <strong>{state.nivel_pista} / 3</strong>
            <span>Nivel de pista</span>
          </div>
        </div>
        <div className="therapist-actions">
          <button className="soft-button" onClick={() => reset()}>
            <RotateCcw aria-hidden="true" />
            Reiniciar escenario
          </button>
          <button className="primary-button" onClick={exportEvents}>
            <Download aria-hidden="true" />
            Exportar sesión JSON
          </button>
        </div>
        <p className="fine-print">
          Reiniciar o cambiar de escenario borra el progreso y los eventos
          actuales, pero conserva los ajustes de voz. Exporta primero si
          necesitas guardarlos.
        </p>
        <details className="debug-details">
          <summary>Estado actual del agente</summary>
          <pre>{JSON.stringify(agentState(state), null, 2)}</pre>
        </details>
        <details className="debug-details">
          <summary>Registro de eventos ({state.log_eventos.length})</summary>
          <pre>{JSON.stringify(state.log_eventos, null, 2)}</pre>
        </details>
        <p className="fine-print">
          Política pedagógica por reglas a0–a3. Sin ID3, entrenamiento ni
          backend. Los datos solo viven en la memoria de esta pestaña.
        </p>
      </div>
    </dialog>
  );
}
