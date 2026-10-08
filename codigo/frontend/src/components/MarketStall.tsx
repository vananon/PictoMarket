import { Check, ChevronRight, Sparkles, Volume2 } from 'lucide-react';
import { market, publicAsset } from '../data/market';
import type { GameState } from '../domain/game';
import type { SpeechSupport } from '../hooks/useSpeech';
import { Pictogram } from './Pictogram';

export function Coin({ spent = false }: { spent?: boolean }) {
  return <span className={`coin ${spent ? 'spent' : ''}`} aria-hidden="true" />;
}
function Instruction({
  state,
  speech,
}: {
  state: GameState;
  speech: SpeechSupport;
}) {
  const target = state.items_restantes[0];
  const name = target ? market.catalogo[target].nombre.toLowerCase() : '';
  const parts = name ? state.mensaje.texto.split(name) : [state.mensaje.texto];
  return (
    <div className={`instruction-board ${state.mensaje.tipo}`}>
      <div className="guide-portrait">
        <img src={publicAsset('art/guide.webp')} alt="" />
        <span aria-hidden="true">👋</span>
      </div>
      <div className="instruction-paper">
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="instruction-text"
        >
          {parts.map((part, index) => (
            <span key={index}>
              {index > 0 && <strong>{name}</strong>}
              {part}
            </span>
          ))}
        </p>
        <button
          className="speaker-button"
          aria-label={
            speech.snapshot.settings.enabled
              ? 'Escuchar instrucción'
              : 'Activar voz y escuchar instrucción'
          }
          disabled={!speech.snapshot.supported || !speech.voices.length}
          onClick={
            speech.snapshot.settings.enabled ? speech.repeat : speech.toggle
          }
        >
          <Volume2 aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
function ProductCard({
  id,
  state,
  choose,
}: {
  id: number;
  state: GameState;
  choose: (id: number) => void;
}) {
  const product = market.catalogo[id];
  const bought = state.items_en_carrito.includes(id);
  const target = state.items_restantes[0];
  const directHint = state.nivel_pista >= 3 && id === target;
  const categoryHint =
    !bought &&
    target &&
    state.nivel_pista >= 1 &&
    product.categoria === market.catalogo[target].categoria;
  return (
    <button
      className={`product-card ${bought ? 'bought' : ''} ${categoryHint ? 'category-hint' : ''} ${directHint ? 'target-hint' : ''}`}
      data-product-id={id}
      disabled={bought || !target}
      onClick={() => choose(id)}
      aria-label={`${product.nombre}, ${product.precio} ${product.precio === 1 ? 'moneda' : 'monedas'}${bought ? ', en el carrito' : ''}`}
    >
      {bought && (
        <span className="product-badge">
          <Check aria-hidden="true" />
          En el carrito
        </span>
      )}
      {directHint && (
        <span className="product-badge hint-badge">👇 ¡Este!</span>
      )}
      <span className="product-image">
        <Pictogram id={id} />
      </span>
      <span className="product-name">{product.nombre}</span>
      <span className="product-price">
        <Coin />
        {product.precio}
      </span>
      {categoryHint && !directHint && (
        <span
          className="category-dot"
          aria-label={`Pista: ${market.categorias[product.categoria].nombre}`}
        />
      )}
    </button>
  );
}
export function MarketStall({
  state,
  choose,
  reset,
  speech,
}: {
  state: GameState;
  choose: (id: number) => void;
  reset: (index?: number) => void;
  speech: SpeechSupport;
}) {
  const completed = !state.items_restantes.length;
  // Hasta cuatro tarjetas por estante: almuerzo tiene diez, la referencia nueve.
  // Distribuir 3 + 3 + 4 conserva todos los datos sin una cuarta fila casi vacía.
  const count = state.productos_visibles.length;
  const rowCount = Math.ceil(count / 4);
  const baseSize = Math.floor(count / rowCount);
  const extra = count % rowCount;
  const rows = Array.from({ length: rowCount }, (_, index) => {
    const start = index * baseSize + Math.max(0, index - (rowCount - extra));
    const size = baseSize + (index >= rowCount - extra ? 1 : 0);
    return state.productos_visibles.slice(start, start + size);
  });
  return (
    <section
      className="market-stall"
      id="mercado"
      tabIndex={-1}
      aria-label="Productos del mercado"
    >
      <Instruction state={state} speech={speech} />
      <div className="storefront">
        <img className="awning" src={publicAsset('art/awning.webp')} alt="" />
        <div className="shelves">
          {completed ? (
            <div
              className="celebration"
              role="region"
              aria-label="Compra completada"
            >
              <span className="celebration-icon" aria-hidden="true">
                🏆
              </span>
              <h1>¡Lo lograste!</h1>
              <p>Compraste todo lo de tu lista.</p>
              <div className="celebration-products">
                {state.items_en_carrito.map((id) => (
                  <div key={id}>
                    <Pictogram id={id} />
                    <span>{market.catalogo[id].nombre}</span>
                  </div>
                ))}
              </div>
              <button
                className="primary-button"
                onClick={() =>
                  reset((state.reto_idx + 1) % market.retos.length)
                }
              >
                Otra compra
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          ) : (
            rows.map((row, index) => {
              const categories = [
                ...new Set(row.map((id) => market.catalogo[id].categoria)),
              ];
              const singleCategory =
                categories.length === 1
                  ? market.categorias[categories[0]]
                  : null;
              const labels = [
                'ELIGE Y COMPRA',
                'SIGUE TU LISTA',
                'EN EL MERCADO',
                'MÁS PRODUCTOS',
              ];
              return (
                <div className="shelf-row" key={index}>
                  <h2 className="shelf-sign">
                    <span aria-hidden="true">
                      {singleCategory?.icono ?? (index === 0 ? '🍎' : '🛒')}
                    </span>
                    {singleCategory?.nombre ??
                      labels[index] ??
                      'ELIGE Y COMPRA'}
                  </h2>
                  <div
                    className={`shelf-products ${row.length === 4 ? 'four-products' : ''}`}
                  >
                    {row.map((id) => (
                      <ProductCard
                        key={id}
                        id={id}
                        state={state}
                        choose={choose}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="stall-bottom">
          <Sparkles aria-hidden="true" />
          ¡Toca un producto para comprarlo!
        </div>
      </div>
    </section>
  );
}
