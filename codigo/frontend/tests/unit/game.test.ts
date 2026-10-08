import { describe, expect, it } from 'vitest';
import source from '../../../../datos/escenarios.json';
import {
  agentPolicy,
  chooseProduct,
  createMessage,
  startGame,
  validateData,
  visualEntropy,
  voiceText,
  type MarketData,
} from '../../src/domain/game';
const data: MarketData = source;

describe('contrato y transiciones del juego', () => {
  it('valida los dos retos y los precios oficiales', () => {
    expect(() => validateData(data)).not.toThrow();
    expect(data.catalogo[8655].precio).toBe(3);
    expect(data.retos[1].presupuesto).toBe(8);
    const invalid = structuredClone(data);
    invalid.retos[1].presupuesto = 1;
    expect(() => validateData(invalid)).toThrow('Presupuesto insuficiente');
  });
  it('conserva todos los productos, aleatoriza sin mutar el JSON', () => {
    const state = startGame(data, 1, 100);
    expect(state.productos_visibles).toHaveLength(10);
    expect(new Set(state.productos_visibles).size).toBe(10);
    expect(state.items_restantes).toEqual([8655, 2503, 2594, 2446]);
    expect(state.monedas).toBe(8);
    expect(state.log_eventos).toEqual([]);
    state.items_restantes.pop();
    expect(data.retos[1].lista_correcta).toHaveLength(4);
  });
  it('usa identidades nuevas y conserva el texto español sin emojis', () => {
    expect(voiceText('MIRA 👉 AQUÍ ESTÁ PLÁTANO 🥛')).toBe(
      'mira aquí está plátano',
    );
    expect(voiceText('CHAMPU\u0301 [COMPRAR]')).toBe('champú comprar');
    expect(createMessage('pista', 'Busca leche').id).not.toBe(
      createMessage('pista', 'Busca leche').id,
    );
  });
  it('conserva política a0–a3 y permite cualquier producto pendiente', () => {
    const state = startGame(data);
    expect(agentPolicy(state, 2462)).toBe('a0');
    expect(agentPolicy(state, 2618)).toBe('a1');
    expect(agentPolicy({ ...state, intentos_fallidos: 1 }, 2618)).toBe('a2');
    expect(agentPolicy({ ...state, intentos_fallidos: 3 }, 2618)).toBe('a3');
  });
  it('es pura; resta el precio una sola vez y registra el estado previo', () => {
    const state = startGame(data, 0, 100);
    const next = chooseProduct(data, state, 2445, 400);
    expect(state.items_en_carrito).toEqual([]);
    expect(state.monedas).toBe(6);
    expect(next.items_en_carrito).toEqual([2445]);
    expect(next.monedas).toBe(4);
    expect(next.log_eventos[0]).toMatchObject({
      t_ms: 300,
      accion_agente: 'a0',
      item_objetivo: 2445,
      recompensa: null,
    });
    expect(next.log_eventos[0].estado_s.items_en_carrito).toEqual([]);
    expect(chooseProduct(data, next, 2445)).toBe(next);
    expect(chooseProduct(data, next, 999999)).toBe(next);
  });
  it('escala las tres pistas, elimina un distractor y no cobra errores', () => {
    let state = startGame(data, 0, 100);
    state = chooseProduct(data, state, 2618, 200);
    expect(state.nivel_pista).toBe(1);
    state = chooseProduct(data, state, 2964, 300);
    expect(state.nivel_pista).toBe(2);
    expect(state.productos_visibles).not.toContain(2964);
    expect(state.log_eventos[1].distractor_eliminado).toBe(2964);
    state = chooseProduct(data, state, 2699, 400);
    expect(state.nivel_pista).toBe(3);
    expect(state.monedas).toBe(6);
    expect(state.errores_totales).toBe(3);
    expect(state.mensaje.texto_voz).toContain('leche');
    expect(state.log_eventos.map((e) => e.accion_agente)).toEqual([
      'a1',
      'a2',
      'a3',
    ]);
    expect(state.log_eventos[1].entropia_despues).toBeLessThan(
      state.log_eventos[1].entropia_antes,
    );
    state = chooseProduct(data, state, 2445);
    expect(state.intentos_fallidos).toBe(0);
    expect(state.nivel_pista).toBe(0);
  });
  it('sin distractores pasa de a2 a a3', () => {
    const state = {
      ...startGame(data),
      productos_visibles: [2445, 2494, 2462],
      intentos_fallidos: 1,
      items_en_carrito: [2494],
      items_restantes: [2445, 2462],
    };
    // Caso de política con catálogo modificado: visible no pertenece a la lista ni a distractores.
    const variant = structuredClone(data);
    variant.retos[0].distractores = [];
    const next = chooseProduct(
      variant,
      { ...state, productos_visibles: [2445, 2618, 2462] },
      2618,
    );
    expect(next.log_eventos[0].accion_agente).toBe('a3');
    expect(next.log_eventos[0].distractor_eliminado).toBeNull();
  });
  it.each([0, 1])(
    'completa el reto %i sin saldo negativo, ignora clics al terminar y reinicia',
    (index) => {
      let state = startGame(data, index);
      for (const id of data.retos[index].lista_correcta)
        state = chooseProduct(data, state, id);
      expect(state.items_restantes).toEqual([]);
      expect(state.monedas).toBeGreaterThanOrEqual(0);
      expect(state.mensaje.texto_voz).toContain('compraste todo');
      expect(
        chooseProduct(data, state, data.retos[index].distractores[0]),
      ).toBe(state);
      const reset = startGame(data, index);
      expect(reset.mensaje.id).not.toBe(state.mensaje.id);
      expect(reset.log_eventos).toEqual([]);
    },
  );
  it('entropía visual compatible con la implementación original', () => {
    expect(visualEntropy(0)).toBe(0);
    expect(visualEntropy(8)).toBe(3);
    expect(visualEntropy(9)).toBe(3.17);
  });
});
