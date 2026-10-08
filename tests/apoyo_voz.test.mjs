import assert from "node:assert/strict";
import test from "node:test";
import render, { createSpeechController, spanishVoices } from "../codigo/frontend/apoyo_voz.mjs";

const local = { name: "Español local", lang: "es-PE", voiceURI: "es-pe", localService: true };
const remote = { name: "Español en línea", lang: "es-MX", voiceURI: "es-mx", localService: false };
const english = { name: "English", lang: "en-US", voiceURI: "en-us", localService: true };
const first = { id: "1", text: "Busca leche." };
const next = { id: "2", text: "Ahora busca pan." };

class Emitter {
  listeners = new Map();
  addEventListener(name, fn) { this.listeners.set(name, fn); }
  removeEventListener(name, fn) {
    if (this.listeners.get(name) === fn) this.listeners.delete(name);
  }
}
class Synth extends Emitter {
  constructor(voices = [english, remote, local]) { super(); this.voices = voices; }
  spoken = [];
  cancellations = 0;
  getVoices() { return this.voices; }
  speak(utterance) { this.spoken.push(utterance); }
  cancel() {
    this.cancellations++;
    this.spoken.at(-1)?.onerror?.({ error: "canceled" });
  }
}
class Utterance { constructor(text) { this.text = text; } }

function setup(options = {}) {
  const synth = options.synth ?? new Synth();
  const events = [];
  const timers = new Map();
  let tick = 0;
  const controller = createSpeechController({
    synth, Utterance, onStatus: (event) => events.push(event),
    schedule: (fn) => { timers.set(++tick, fn); return tick; },
    unschedule: (id) => timers.delete(id),
    ...options,
  });
  controller.update(first);
  return { controller, synth, events, timers };
}

test("solo voces españolas; preferir una voz del dispositivo", () => {
  assert.deepEqual(spanishVoices(new Synth()), [local, remote]);
  assert.deepEqual(spanishVoices(undefined), []);
});

test("la carga y los reruns no hablan antes de activar", () => {
  const { controller, synth } = setup({ settings: { enabled: true } });
  controller.update(first);
  controller.update(next);
  assert.equal(synth.spoken.length, 0);
  assert.equal(controller.snapshot().settings.enabled, false);
});

test("activar habla una vez en español, con volumen y ritmo tranquilos", () => {
  const { controller, synth, timers } = setup();
  controller.enable();
  const utterance = synth.spoken[0];
  assert.equal(utterance.text, first.text);
  assert.equal(utterance.voice, local);
  assert.equal(utterance.lang, "es-PE");
  assert.equal(utterance.volume, 0.8);
  assert.equal(utterance.rate, 0.9);
  utterance.onstart();
  assert.equal(timers.size, 0);
  assert.equal(controller.snapshot().status.code, "speaking");
});

test("onstart/onend y el mismo id no vuelven a emitir la voz", () => {
  const { controller, synth } = setup();
  controller.enable();
  synth.spoken[0].onstart();
  controller.update({ ...first });
  synth.spoken[0].onend();
  controller.update({ ...first });
  assert.equal(synth.spoken.length, 1);
  assert.equal(controller.snapshot().status.code, "ended");
});

test("una nueva decisión cancela la anterior e ignora callbacks atrasados", () => {
  const { controller, synth } = setup();
  controller.enable();
  const previous = synth.spoken[0];
  controller.update(next);
  assert.equal(synth.cancellations, 1);
  assert.equal(synth.spoken.length, 2);
  previous.onend();
  previous.onerror({ error: "canceled" });
  assert.equal(controller.snapshot().status.message_id, next.id);
  assert.equal(controller.snapshot().status.code, "queued");
});

test("repetir es explícito y no acumula frases", () => {
  const { controller, synth } = setup();
  controller.enable();
  controller.repeat();
  assert.equal(synth.spoken.length, 2);
  assert.equal(synth.cancellations, 1);
  assert.equal(synth.spoken[1].text, first.text);
});

test("silenciar cancela y las decisiones siguientes siguen sin audio", () => {
  const { controller, synth } = setup();
  controller.enable();
  controller.disable();
  controller.update(next);
  controller.repeat();
  assert.equal(synth.spoken.length, 1);
  assert.equal(synth.cancellations, 1);
  controller.enable();
  assert.equal(synth.spoken.at(-1).text, next.text);
});

test("detener no silencia las futuras instrucciones", () => {
  const { controller, synth } = setup();
  controller.enable();
  controller.stop();
  controller.update(first);
  assert.equal(synth.spoken.length, 1);
  controller.update(next);
  assert.equal(synth.spoken.length, 2);
});

test("cambiar ajustes detiene, no repite y usa los valores al repetir", () => {
  const { controller, synth } = setup();
  controller.enable();
  controller.configure({ volume: 0.3, rate: 0.75, voiceURI: remote.voiceURI });
  assert.equal(synth.spoken.length, 1);
  controller.repeat();
  assert.equal(synth.spoken.at(-1).voice, remote);
  assert.equal(synth.spoken.at(-1).volume, 0.3);
  assert.equal(synth.spoken.at(-1).rate, 0.75);
});

test("preferencias inválidas se acotan", () => {
  const { controller } = setup({ settings: { volume: 10, rate: -1 } });
  assert.equal(controller.snapshot().settings.volume, 1);
  assert.equal(controller.snapshot().settings.rate, 0.75);
  controller.configure({ volume: "nan", rate: "nan" });
  assert.equal(controller.snapshot().settings.volume, 0.8);
  assert.equal(controller.snapshot().settings.rate, 0.9);
});

test("sin voz española no se sustituye por voz inglesa", () => {
  const { controller, synth } = setup({ synth: new Synth([english]) });
  controller.enable();
  assert.equal(synth.spoken.length, 0);
  assert.equal(controller.snapshot().settings.enabled, false);
  assert.equal(controller.snapshot().status.code, "no_voice");
  synth.voices.push(local);
  controller.enable();
  assert.equal(synth.spoken[0].voice, local);
});

test("API no disponible permite continuar sin audio", () => {
  const { controller } = setup({ synth: undefined, Utterance: undefined });
  controller.enable();
  controller.repeat();
  assert.equal(controller.snapshot().supported, false);
  assert.equal(controller.snapshot().status.code, "unsupported");
});

test("el bloqueo de autoplay se informa y requiere reintento explícito", () => {
  const { controller, synth } = setup();
  controller.enable();
  synth.spoken[0].onerror({ error: "not-allowed" });
  controller.update(first);
  assert.equal(controller.snapshot().status.code, "blocked");
  assert.equal(synth.spoken.length, 1);
  controller.repeat();
  assert.equal(synth.spoken.length, 2);
});

test("si la voz nunca empieza se libera el estado pendiente", () => {
  const { controller, synth, timers } = setup();
  controller.enable();
  [...timers.values()][0]();
  assert.equal(controller.snapshot().status.code, "blocked");
  assert.equal(controller.snapshot().speaking, false);
  assert.equal(synth.cancellations, 1);
  assert.equal(timers.size, 0);
});

test("un fallo del motor no rompe el controlador", () => {
  const synth = new Synth();
  synth.speak = () => { throw new Error("Motor no disponible"); };
  const { controller } = setup({ synth });
  controller.enable();
  assert.equal(controller.snapshot().status.code, "error");
  assert.equal(controller.snapshot().speaking, false);
});

test("no hablar mientras la pestaña está oculta", () => {
  let visible = true;
  const { controller, synth } = setup({ isVisible: () => visible });
  controller.enable();
  visible = false;
  controller.update(next);
  assert.equal(synth.spoken.length, 1);
  assert.equal(controller.snapshot().status.code, "stopped");
  assert.equal(controller.snapshot().status.message_id, next.id);
  visible = true;
  controller.repeat();
  assert.equal(synth.spoken.at(-1).text, next.text);
});

test("desmontar cancela y evita emisiones futuras", () => {
  const { controller, synth, timers } = setup();
  controller.enable();
  controller.destroy();
  controller.update(next);
  controller.repeat();
  assert.equal(synth.cancellations, 1);
  assert.equal(synth.spoken.length, 1);
  assert.equal(timers.size, 0);
});

function domSetup(supported = true) {
  const elements = new Map();
  const document = new Emitter();
  document.hidden = false;
  document.createElement = () => ({ value: "", textContent: "" });
  const root = {
    ownerDocument: document, isConnected: true,
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, {
        value: "", textContent: "", disabled: false, attrs: {},
        setAttribute(name, value) { this.attrs[name] = value; },
        replaceChildren(...children) { this.children = children; },
      });
      return elements.get(selector);
    },
  };
  const environment = new Emitter();
  const synth = new Synth();
  if (supported) {
    environment.speechSynthesis = synth;
    environment.SpeechSynthesisUtterance = Utterance;
  }
  globalThis.window = environment;
  const states = [];
  const component = { parentElement: root, data: { message: first },
    setStateValue: (name, value) => states.push({ name, value }) };
  return { root, component, elements, synth, document, environment, states };
}

test("controles y estado persisten sin cancelar por un rerun CCv2", async () => {
  const { root, component, elements, synth, states, document } = domSetup();
  const cleanup = render(component);
  assert.equal(elements.get("#activar").textContent, "Activar voz");
  elements.get("#activar").onclick();
  assert.equal(elements.get("#activar").textContent, "Silenciar voz");
  assert.equal(elements.get("#repetir").disabled, false);
  synth.spoken[0].onstart();
  cleanup();
  const nextCleanup = render(component);
  await Promise.resolve();
  assert.equal(synth.spoken.length, 1);
  assert.equal(synth.cancellations, 0);
  assert.ok(states.some((s) => s.name === "ajustes" && s.value.enabled));
  document.hidden = true;
  document.listeners.get("visibilitychange")();
  assert.equal(synth.cancellations, 1);
  root.isConnected = false;
  nextCleanup();
  await Promise.resolve();
  assert.equal(document.listeners.size, 0);
});

test("las voces que aparecen después actualizan el selector", async () => {
  const { root, component, elements, synth } = domSetup();
  synth.voices = [];
  const cleanup = render(component);
  assert.equal(elements.get("#activar").disabled, true);
  synth.voices = [local];
  synth.listeners.get("voiceschanged")();
  assert.equal(elements.get("#activar").disabled, false);
  assert.equal(elements.get("#voz").children.length, 1);
  root.isConnected = false;
  cleanup();
  await Promise.resolve();
});

test("navegador sin soporte muestra una alternativa visual", async () => {
  const { root, component, elements, document } = domSetup(false);
  const cleanup = render(component);
  assert.equal(elements.get("#activar").disabled, true);
  assert.match(elements.get("#estado").textContent, /pictogramas y el texto/);
  document.hidden = true;
  document.listeners.get("visibilitychange")();
  assert.match(elements.get("#estado").textContent, /pictogramas y el texto/);
  root.isConnected = false;
  cleanup();
  await Promise.resolve();
});
