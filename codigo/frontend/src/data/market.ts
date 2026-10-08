import source from '../../../../datos/escenarios.json';
import { validateData, type MarketData } from '../domain/game';

// Única fuente de catálogo, precios y retos. No hay una copia de datos en React.
export const market: MarketData = source;
validateData(market);
export const publicAsset = (path: string) =>
  `${import.meta.env.BASE_URL}${path}`;
export const pictogramUrl = (id: number) => publicAsset(`pictograms/${id}.png`);
