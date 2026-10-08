import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { market, pictogramUrl } from '../data/market';

export function Pictogram({ id }: { id: number }) {
  const [failed, setFailed] = useState(false);
  const product = market.catalogo[id];
  return failed ? (
    <span className="pictogram-fallback" role="img" aria-label={product.nombre}>
      <ImageOff aria-hidden="true" />
      <span>{product.nombre}</span>
    </span>
  ) : (
    <img
      className="pictogram"
      src={pictogramUrl(id)}
      alt=""
      onError={() => setFailed(true)}
      draggable="false"
    />
  );
}
