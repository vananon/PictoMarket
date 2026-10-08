import { StrictMode } from 'react';
import { fireEvent, render, screen, within, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';

const voice = {
  name: 'Español local',
  lang: 'es-PE',
  voiceURI: 'local',
  localService: true,
};
class FakeUtterance {
  constructor(public text: string) {}
}
function fakeSpeech(initialVoices = [voice]) {
  const events = new EventTarget();
  return Object.assign(events, {
    getVoices: vi.fn(() => initialVoices),
    speak: vi.fn(),
    cancel: vi.fn(),
  });
}
let synth: ReturnType<typeof fakeSpeech>;
beforeEach(() => {
  synth = fakeSpeech();
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
});
function mount() {
  return render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
function buy(name: string) {
  fireEvent.click(
    screen.getByRole('button', { name: new RegExp(`^${name},`) }),
  );
}

describe('frontend React y apoyo de voz', () => {
  it('presenta almuerzo, todos los productos y saldo real sin autoplay', () => {
    mount();
    expect(screen.getByText('ALMUERZO')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-product-id]')).toHaveLength(10);
    expect(screen.getByText(/Tengo/)).toHaveTextContent('Tengo 8 de 8 monedas');
    expect(synth.speak).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Activar voz' })).toBeEnabled();
  });
  it('doble montaje de StrictMode no habla; activar, comprar y abrir panel no duplican voz', () => {
    const view = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Activar voz' }));
    expect(synth.speak).toHaveBeenCalledTimes(1);
    buy('PECHUGA DE POLLO');
    expect(synth.speak).toHaveBeenCalledTimes(2);
    expect(synth.speak.mock.calls[1][0].text).toContain('papa');
    fireEvent.click(
      screen.getByRole('button', { name: 'Panel del terapeuta' }),
    );
    expect(synth.speak).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(synth.cancel).toHaveBeenCalled();
  });
  it('repetir, detener y silenciar conservan carrito y monedas', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Activar voz' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Repetir instrucción' }),
    );
    expect(synth.speak).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Detener' }));
    fireEvent.click(screen.getByRole('button', { name: 'Silenciar voz' }));
    buy('PECHUGA DE POLLO');
    expect(synth.speak).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/Tengo/)).toHaveTextContent('Tengo 5 de 8 monedas');
  });
  it('las tres pistas resaltan categoría y producto correcto', () => {
    mount();
    buy('JABÓN');
    buy('CHAMPÚ');
    buy('DENTÍFRICO');
    expect(
      document.querySelector('[data-product-id="2699"]'),
    ).not.toBeInTheDocument();
    expect(document.querySelector('[data-product-id="8655"]')).toHaveClass(
      'target-hint',
    );
    expect(screen.getByText(/Tengo/)).toHaveTextContent('Tengo 8 de 8 monedas');
  });
  it('completa la compra, actualiza lista y cambia al otro escenario', () => {
    mount();
    for (const name of ['PECHUGA DE POLLO', 'PAPA', 'TOMATE', 'LECHUGA'])
      buy(name);
    expect(
      screen.getByRole('heading', { name: '¡Lo lograste!' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tengo/)).toHaveTextContent('Tengo 2 de 8 monedas');
    expect(
      screen.getByLabelText('4 de 4 productos comprados'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Otra compra' }));
    expect(screen.getByText('DESAYUNO')).toBeInTheDocument();
    expect(screen.getByText(/Tengo/)).toHaveTextContent('Tengo 6 de 6 monedas');
  });
  it('reiniciar y cambiar escenario conservan ajustes de voz', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Activar voz' }));
    fireEvent.change(screen.getByLabelText('Velocidad'), {
      target: { value: '0.75' },
    });
    expect(synth.speak).toHaveBeenCalledTimes(1);
    fireEvent.click(
      screen.getByRole('button', { name: 'Panel del terapeuta' }),
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Reiniciar escenario' }),
    );
    expect(synth.speak.mock.calls.at(-1)?.[0].rate).toBe(0.75);
    fireEvent.change(within(dialog).getByLabelText('Escenario de compra'), {
      target: { value: '0' },
    });
    expect(synth.speak.mock.calls.at(-1)?.[0].text).toContain('leche');
    expect(
      screen.getByRole('button', { name: 'Silenciar voz' }),
    ).toBeInTheDocument();
  });
  it('sin API o voces mantiene funcionamiento visual y ofrece ayuda', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    vi.stubGlobal('SpeechSynthesisUtterance', undefined);
    mount();
    expect(screen.getByRole('button', { name: 'Activar voz' })).toBeDisabled();
    expect(screen.getByText(/Este navegador no permite/)).toBeInTheDocument();
    buy('PECHUGA DE POLLO');
    expect(screen.getByText(/Tengo/)).toHaveTextContent('Tengo 5 de 8 monedas');
  });
  it('voces tardías habilitan activar sin leer automáticamente', () => {
    synth.getVoices.mockReturnValue([]);
    mount();
    expect(screen.getByRole('button', { name: 'Activar voz' })).toBeDisabled();
    synth.getVoices.mockReturnValue([voice]);
    act(() => synth.dispatchEvent(new Event('voiceschanged')));
    expect(screen.getByRole('button', { name: 'Activar voz' })).toBeEnabled();
    expect(synth.speak).not.toHaveBeenCalled();
  });
});
