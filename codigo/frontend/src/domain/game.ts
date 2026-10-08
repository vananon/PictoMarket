export interface Product {
  nombre: string;
  categoria: string;
  conservacion: string;
  precio: number;
}
export interface Challenge {
  id_reto: string;
  nivel: number;
  objetivo: string;
  presupuesto: number;
  lista_correcta: number[];
  distractores: number[];
}
export interface MarketData {
  _fuente: string;
  url_pictograma: string;
  catalogo: Record<string, Product>;
  categorias: Record<string, { nombre: string; icono: string; color: string }>;
  retos: Challenge[];
}
export interface Message {
  id: string;
  tipo: 'inicio' | 'exito' | 'pista';
  texto: string;
  texto_voz: string;
}
export interface AgentState {
  items_restantes: number[];
  items_en_carrito: number[];
  intentos_fallidos: number;
  nivel_pista: number;
}
export type AgentAction = 'a0' | 'a1' | 'a2' | 'a3';
export interface GameEvent {
  escenario_id: string;
  t_ms: number;
  item_objetivo: number;
  item_tocado: number;
  correcto: boolean;
  estado_s: AgentState;
  accion_agente: AgentAction;
  distractor_eliminado: number | null;
  entropia_antes: number;
  entropia_despues: number;
  recompensa: null;
}
export interface GameState extends AgentState {
  reto_idx: number;
  productos_visibles: number[];
  monedas: number;
  errores_totales: number;
  t_ultimo_evento: number;
  log_eventos: GameEvent[];
  mensaje: Message;
}

export function voiceText(text: string): string {
  return text
    .normalize('NFC')
    .replaceAll('_', ' ')
    .replace(/[^\p{L}\p{N}\s.,;:¡!¿?\-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
export function createMessage(
  tipo: Message['tipo'],
  texto: string,
  id = crypto.randomUUID(),
): Message {
  return { id, tipo, texto, texto_voz: voiceText(texto) };
}
export function objectiveWords(challenge: Challenge): string[] {
  return Array.from(
    challenge.objetivo.matchAll(/\[([^\]]+)\]/g),
    (match) => match[1],
  );
}
export function shuffle<T>(values: T[], random = Math.random): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function startGame(
  data: MarketData,
  index = 0,
  now = Date.now(),
): GameState {
  const challenge = data.retos[index];
  if (!challenge || !challenge.lista_correcta.length)
    throw new Error('El reto no existe o no tiene productos.');
  return {
    reto_idx: index,
    items_restantes: [...challenge.lista_correcta],
    items_en_carrito: [],
    intentos_fallidos: 0,
    nivel_pista: 0,
    productos_visibles: shuffle([
      ...challenge.lista_correcta,
      ...challenge.distractores,
    ]),
    monedas: challenge.presupuesto,
    errores_totales: 0,
    t_ultimo_evento: now,
    log_eventos: [],
    mensaje: createMessage(
      'inicio',
      `¡Hola! Vamos a ${objectiveWords(challenge).join(' ').toLowerCase()}. Busca: ${data.catalogo[challenge.lista_correcta[0]].nombre.toLowerCase()}.`,
    ),
  };
}
export function agentState(state: GameState): AgentState {
  return {
    items_restantes: [...state.items_restantes],
    items_en_carrito: [...state.items_en_carrito],
    intentos_fallidos: Math.min(state.intentos_fallidos, 3),
    nivel_pista: state.nivel_pista,
  };
}
export function agentPolicy(state: AgentState, product: number): AgentAction {
  if (state.items_restantes.includes(product)) return 'a0';
  if (state.intentos_fallidos === 0) return 'a1';
  if (state.intentos_fallidos === 1) return 'a2';
  return 'a3';
}
export function visualEntropy(count: number): number {
  return count > 0 ? Number(Math.log2(count).toFixed(3)) : 0;
}

// Transición pura: React solo presenta el resultado. No es un modelo ID3 entrenado.
export function chooseProduct(
  data: MarketData,
  state: GameState,
  product: number,
  now = Date.now(),
): GameState {
  const target = state.items_restantes[0];
  if (
    !target ||
    !state.productos_visibles.includes(product) ||
    state.items_en_carrito.includes(product)
  )
    return state;
  const challenge = data.retos[state.reto_idx];
  const before = agentState(state);
  let action = agentPolicy(before, product);
  const name = data.catalogo[product].nombre.toLowerCase();
  const next = {
    ...state,
    ...before,
    productos_visibles: [...state.productos_visibles],
    t_ultimo_evento: now,
  };
  let removed: number | null = null;
  if (action === 'a0') {
    next.items_restantes = state.items_restantes.filter((id) => id !== product);
    next.items_en_carrito = [...state.items_en_carrito, product];
    next.monedas -= data.catalogo[product].precio;
    next.intentos_fallidos = 0;
    next.nivel_pista = 0;
    const following = next.items_restantes[0];
    next.mensaje = createMessage(
      'exito',
      `¡Muy bien! ${name} va al carrito. ${following ? `Ahora busca: ${data.catalogo[following].nombre.toLowerCase()}.` : '¡Lo lograste! Compraste todo.'}`,
    );
  } else {
    next.intentos_fallidos = state.intentos_fallidos + 1;
    next.errores_totales++;
    const category = data.categorias[data.catalogo[target].categoria];
    if (action === 'a2') {
      const candidates = state.productos_visibles.filter((id) =>
        challenge.distractores.includes(id),
      );
      // Preferir el distractor tocado; de lo contrario retirar el primero visible.
      removed = candidates.includes(product)
        ? product
        : (candidates[0] ?? null);
      if (removed === null) action = 'a3';
      else
        next.productos_visibles = state.productos_visibles.filter(
          (id) => id !== removed,
        );
    }
    next.nivel_pista = Math.max(
      state.nivel_pista,
      { a1: 1, a2: 2, a3: 3 }[action],
    );
    const messages = {
      a1: `${name} no está en la lista. Busca en ${category.icono} ${category.nombre.toLowerCase()}.`,
      a2: 'Quité un producto para ayudarte. ¡Tú puedes!',
      a3: `Mira 👇 aquí está ${data.catalogo[target].nombre.toLowerCase()}.`,
    };
    next.mensaje = createMessage('pista', messages[action]);
  }
  next.log_eventos = [
    ...state.log_eventos,
    {
      escenario_id: challenge.id_reto,
      t_ms: Math.max(0, Math.trunc(now - state.t_ultimo_evento)),
      item_objetivo: target,
      item_tocado: product,
      correcto: action === 'a0',
      estado_s: before,
      accion_agente: action,
      distractor_eliminado: removed,
      entropia_antes: visualEntropy(state.productos_visibles.length),
      entropia_despues: visualEntropy(next.productos_visibles.length),
      recompensa: null,
    },
  ];
  return next;
}

export function validateData(data: MarketData): void {
  if (!data.retos.length) throw new Error('No hay retos de compra.');
  for (const challenge of data.retos) {
    const ids = [...challenge.lista_correcta, ...challenge.distractores];
    if (!challenge.lista_correcta.length || new Set(ids).size !== ids.length)
      throw new Error(`Reto inválido: ${challenge.id_reto}`);
    let cost = 0;
    for (const id of ids) {
      const product = data.catalogo[id];
      if (
        !product ||
        !data.categorias[product.categoria] ||
        !Number.isInteger(product.precio) ||
        product.precio < 0
      )
        throw new Error(`Producto inválido: ${id}`);
      if (challenge.lista_correcta.includes(id)) cost += product.precio;
    }
    if (cost > challenge.presupuesto)
      throw new Error(`Presupuesto insuficiente: ${challenge.id_reto}`);
  }
}
