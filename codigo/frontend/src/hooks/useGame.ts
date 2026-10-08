import { useReducer } from 'react';
import { market } from '../data/market';
import { chooseProduct, startGame, type GameState } from '../domain/game';

type Event =
  | { type: 'choose'; id: number; now: number }
  | { type: 'reset'; state: GameState };
function reducer(state: GameState, event: Event): GameState {
  return event.type === 'choose'
    ? chooseProduct(market, state, event.id, event.now)
    : event.state;
}
export function useGame() {
  // Almuerzo corresponde a la referencia; los dos escenarios siguen disponibles.
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    startGame(market, 1),
  );
  return {
    state,
    challenge: market.retos[state.reto_idx],
    choose: (id: number) => dispatch({ type: 'choose', id, now: Date.now() }),
    reset: (index = state.reto_idx) =>
      dispatch({ type: 'reset', state: startGame(market, index) }),
  };
}
