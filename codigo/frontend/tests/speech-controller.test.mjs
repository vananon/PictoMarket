import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSpeechController,
  spanishVoices,
} from '../src/audio/speech-controller.mjs';

const local = {
  name: 'Español local',
  lang: 'es-PE',
  voiceURI: 'es-pe',
  localService: true,
};
const remote = {
  name: 'Español en línea',
  lang: 'es-MX',
  voiceURI: 'es-mx',
  localService: false,
};
const english = {
  name: 'English',
  lang: 'en-US',
  voiceURI: 'en-us',
  localService: true,
};
class Utterance {
  constructor(text) {
    this.text = text;
  }
}
function setup(options = {}) {
  const spoken = [];
  const timers = new Map();
  let cancellations = 0;
  const synth = {
    getVoices: () => [english, remote, local],
    speak: (utterance) => spoken.push(utterance),
    cancel: () => {
      cancellations++;
      spoken.at(-1)?.onerror?.({ error: 'canceled' });
    },
  };
  const controller = createSpeechController({
    synth,
    Utterance,
    schedule: (callback) => {
      const id = Symbol();
      timers.set(id, callback);
      return id;
    },
    unschedule: (id) => timers.delete(id),
    ...options,
  });
  controller.update({ id: '1', text: 'Busca leche.' });
  return {
    controller,
    synth,
    spoken,
    timers,
    get cancellations() {
      return cancellations;
    },
  };
}
test('solo voces españolas; preferencia por voces locales', () => {
  assert.deepEqual(spanishVoices(setup().synth), [local, remote]);
  assert.deepEqual(spanishVoices(undefined), []);
});
test('arranque y actualización silenciosos aun con enabled guardado', () => {
  const s = setup({ settings: { enabled: true } });
  s.controller.update({ id: '2', text: 'Busca pan.' });
  assert.equal(s.spoken.length, 0);
  assert.equal(s.controller.snapshot().settings.enabled, false);
});
test('activación explícita, ritmo y volumen originales', () => {
  const s = setup();
  s.controller.enable();
  assert.equal(s.spoken.length, 1);
  assert.equal(s.spoken[0].voice, local);
  assert.equal(s.spoken[0].rate, 0.9);
  assert.equal(s.spoken[0].volume, 0.8);
  s.spoken[0].onstart();
  assert.equal(s.timers.size, 0);
  assert.equal(s.controller.snapshot().status.code, 'speaking');
});
test('mismo ID no habla de nuevo al terminar ni al renderizar', () => {
  const s = setup();
  s.controller.enable();
  s.spoken[0].onend();
  s.controller.update({ id: '1', text: 'Busca leche.' });
  assert.equal(s.spoken.length, 1);
});
test('nueva decisión cancela; callbacks atrasados no alteran estado', () => {
  const s = setup();
  s.controller.enable();
  const previous = s.spoken[0];
  s.controller.update({ id: '2', text: 'Ahora busca pan.' });
  previous.onend();
  previous.onerror({ error: 'canceled' });
  assert.equal(s.cancellations, 1);
  assert.equal(s.spoken.length, 2);
  assert.equal(s.controller.snapshot().status.message_id, '2');
  assert.equal(s.controller.snapshot().status.code, 'queued');
});
test('repetir es explícito y no acumula cola', () => {
  const s = setup();
  s.controller.enable();
  s.controller.repeat();
  assert.equal(s.spoken.length, 2);
  assert.equal(s.cancellations, 1);
});
test('silenciar impide futuras lecturas; activar lee la última', () => {
  const s = setup();
  s.controller.enable();
  s.controller.disable();
  s.controller.update({ id: '2', text: 'Busca pan.' });
  s.controller.repeat();
  assert.equal(s.spoken.length, 1);
  s.controller.enable();
  assert.equal(s.spoken.at(-1).text, 'Busca pan.');
});
test('detener no desactiva las instrucciones futuras', () => {
  const s = setup();
  s.controller.enable();
  s.controller.stop();
  s.controller.update({ id: '1', text: 'Busca leche.' });
  assert.equal(s.spoken.length, 1);
  s.controller.update({ id: '2', text: 'Busca pan.' });
  assert.equal(s.spoken.length, 2);
});
test('configurar cancela sin repetir y conserva preferencias', () => {
  const s = setup();
  s.controller.enable();
  s.controller.configure({
    rate: 0.75,
    volume: 0.3,
    voiceURI: remote.voiceURI,
  });
  assert.equal(s.spoken.length, 1);
  s.controller.repeat();
  assert.equal(s.spoken.at(-1).voice, remote);
  assert.equal(s.spoken.at(-1).rate, 0.75);
  assert.equal(s.spoken.at(-1).volume, 0.3);
});
test('preferencias inválidas se acotan', () => {
  const s = setup({ settings: { rate: -1, volume: 10 } });
  assert.equal(s.controller.snapshot().settings.rate, 0.75);
  assert.equal(s.controller.snapshot().settings.volume, 1);
  s.controller.configure({ rate: 'nan', volume: 'nan' });
  assert.equal(s.controller.snapshot().settings.rate, 0.9);
  assert.equal(s.controller.snapshot().settings.volume, 0.8);
});
test('sin voz española no se usa inglés; voces tardías permiten activar', () => {
  let voices = [english];
  const s = setup({
    synth: {
      getVoices: () => voices,
      speak: (u) => voices.push(u),
      cancel() {},
    },
  });
  s.controller.enable();
  assert.equal(s.controller.snapshot().status.code, 'no_voice');
  assert.equal(s.controller.snapshot().settings.enabled, false);
  voices = [local];
  s.controller.enable();
  assert.equal(s.controller.snapshot().settings.enabled, true);
});
test('sin API no rompe la aplicación', () => {
  const s = setup({ synth: undefined, Utterance: undefined });
  s.controller.enable();
  s.controller.repeat();
  assert.equal(s.controller.snapshot().status.code, 'unsupported');
});
test('bloqueo de autoplay requiere repetir; mismo ID no reintenta', () => {
  const s = setup();
  s.controller.enable();
  s.spoken[0].onerror({ error: 'not-allowed' });
  s.controller.update({ id: '1', text: 'Busca leche.' });
  assert.equal(s.spoken.length, 1);
  assert.equal(s.controller.snapshot().status.code, 'blocked');
  s.controller.repeat();
  assert.equal(s.spoken.length, 2);
});
test('timeout de cinco segundos libera lectura pendiente', () => {
  const s = setup();
  s.controller.enable();
  [...s.timers.values()][0]();
  assert.equal(s.controller.snapshot().status.code, 'blocked');
  assert.equal(s.timers.size, 0);
  assert.equal(s.controller.snapshot().speaking, false);
});
test('motor que arroja un error se recupera sin romper UI', () => {
  const s = setup({
    synth: {
      getVoices: () => [local],
      speak() {
        throw new Error('No disponible');
      },
      cancel() {},
    },
  });
  s.controller.enable();
  assert.equal(s.controller.snapshot().status.code, 'error');
  assert.equal(s.controller.snapshot().speaking, false);
});
test('no lee con pestaña oculta; volver no reproduce automáticamente', () => {
  let visible = true;
  const s = setup({ isVisible: () => visible });
  s.controller.enable();
  visible = false;
  s.controller.update({ id: '2', text: 'Busca pan.' });
  assert.equal(s.spoken.length, 1);
  assert.equal(s.controller.snapshot().status.code, 'stopped');
  visible = true;
  s.controller.repeat();
  assert.equal(s.spoken.at(-1).text, 'Busca pan.');
});
test('desmontar cancela timers y bloquea futuras emisiones', () => {
  const s = setup();
  s.controller.enable();
  s.controller.destroy();
  s.controller.update({ id: '2', text: 'Busca pan.' });
  s.controller.repeat();
  assert.equal(s.spoken.length, 1);
  assert.equal(s.timers.size, 0);
  assert.equal(s.cancellations, 1);
});
