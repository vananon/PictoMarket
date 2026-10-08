import { CookingPot, House, ShoppingCart, Sunrise } from 'lucide-react';
import { publicAsset } from '../data/market';
import { objectiveWords, type Challenge } from '../domain/game';

export function Header({ challenge }: { challenge: Challenge }) {
  const words = objectiveWords(challenge);
  return (
    <header className="topbar">
      <a
        className="brand"
        href="#mercado"
        aria-label="PictoMarket, ir al mercado"
      >
        <span className="brand-cart">
          <ShoppingCart aria-hidden="true" />
          <span aria-hidden="true">🍎</span>
        </span>
        <span>
          PICTO<span className="brand-accent">MARKET</span>
        </span>
      </a>
      <div
        className="objective"
        aria-label={`Objetivo: ${words.join(' ').toLowerCase()}`}
      >
        {words.map((word, index) => {
          const Icon =
            index === 0
              ? ShoppingCart
              : index === 1
                ? House
                : word === 'DESAYUNO'
                  ? Sunrise
                  : CookingPot;
          return (
            <span
              className={`objective-chip ${index === 0 ? 'primary-chip' : ''}`}
              key={word}
            >
              <Icon aria-hidden="true" />
              {word}
            </span>
          );
        })}
      </div>
      <img
        className="partner-logo"
        src={publicAsset('art/kallpa.webp')}
        alt="Kallpa Asociación"
      />
    </header>
  );
}
