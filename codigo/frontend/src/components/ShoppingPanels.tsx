import {
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronRight,
  ClipboardList,
  ShoppingCart,
} from 'lucide-react';
import { market } from '../data/market';
import type { Challenge, GameState } from '../domain/game';
import { Pictogram } from './Pictogram';
import { Coin } from './MarketStall';

export function ShoppingPanels({
  state,
  challenge,
  openTherapist,
}: {
  state: GameState;
  challenge: Challenge;
  openTherapist: () => void;
}) {
  const target = state.items_restantes[0];
  return (
    <aside className="shopping-sidebar" aria-label="Mi compra">
      <section
        className="paper-panel list-panel"
        aria-labelledby="list-heading"
      >
        <div className="panel-heading">
          <h2 id="list-heading">
            <ClipboardList aria-hidden="true" />
            Mi lista
          </h2>
          <span
            className="progress-counter"
            aria-label={`${state.items_en_carrito.length} de ${challenge.lista_correcta.length} productos comprados`}
          >
            {state.items_en_carrito.length} / {challenge.lista_correcta.length}
          </span>
        </div>
        <ul className="shopping-list">
          {challenge.lista_correcta.map((id) => {
            const done = state.items_en_carrito.includes(id);
            return (
              <li
                key={id}
                className={`list-item ${done ? 'done' : ''} ${id === target ? 'current' : ''}`}
                aria-current={id === target ? 'step' : undefined}
              >
                {done && (
                  <span className="check-badge" aria-label="Comprado">
                    <Check aria-hidden="true" />
                  </span>
                )}
                {id === target && <span className="now-badge">AHORA</span>}
                <Pictogram id={id} />
                <span>{market.catalogo[id].nombre}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <section
        className="paper-panel wallet-panel"
        aria-labelledby="wallet-heading"
      >
        <h2 id="wallet-heading">
          <Coin />
          Mi billetera
        </h2>
        <div className="wallet-coins" aria-hidden="true">
          {Array.from({ length: challenge.presupuesto }, (_, index) => (
            <Coin key={index} spent={index >= state.monedas} />
          ))}
        </div>
        <p className="wallet-count" aria-live="polite">
          Tengo <strong>{state.monedas}</strong> de {challenge.presupuesto}{' '}
          monedas
        </p>
      </section>
      <section
        className="paper-panel cart-panel"
        aria-labelledby="cart-heading"
      >
        <h2 id="cart-heading">
          <ShoppingCart aria-hidden="true" />
          Mi carrito
        </h2>
        {state.items_en_carrito.length ? (
          <ul className="cart-items">
            {state.items_en_carrito.map((id) => (
              <li key={id}>
                <Pictogram id={id} />
                <span>{market.catalogo[id].nombre}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-cart">
            <ShoppingCart aria-hidden="true" />
            <p>
              Tu carrito está vacío.
              <br />
              <span>¡Vamos a llenarlo!</span>
            </p>
          </div>
        )}
      </section>
      <button className="therapist-button" onClick={openTherapist}>
        <span className="therapist-avatar" aria-hidden="true">
          👩🏻‍⚕️
        </span>
        <ChartNoAxesColumnIncreasing aria-hidden="true" />
        <span>Panel del terapeuta</span>
        <ChevronRight aria-hidden="true" />
      </button>
    </aside>
  );
}
