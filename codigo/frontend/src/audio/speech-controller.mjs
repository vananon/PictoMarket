// Controlador de voz independiente de React. Migrado del componente original.
const clamp = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(max, Math.max(min, number))
    : fallback;
};

export function spanishVoices(synth) {
  try {
    return synth
      .getVoices()
      .filter((voice) => /^es(?:[-_]|$)/i.test(voice.lang))
      .sort((a, b) => {
        const score = (v) =>
          (v.localService ? 100 : 0) +
          (/^es[-_]PE$/i.test(v.lang) ? 20 : 0) +
          (/^es[-_](MX|US|AR|CL|CO)$/i.test(v.lang) ? 10 : 0);
        return score(b) - score(a) || a.name.localeCompare(b.name);
      });
  } catch {
    return [];
  }
}

// Núcleo sin DOM: se prueba con SpeechSynthesis simulado, sin producir sonido.
export function createSpeechController({
  synth,
  Utterance,
  settings = {},
  onStatus = () => {},
  isVisible = () => true,
  schedule = setTimeout,
  unschedule = clearTimeout,
}) {
  const supported = Boolean(synth && Utterance);
  const preferences = {
    enabled: false, // Toda instancia nueva requiere un gesto explícito.
    volume: clamp(settings.volume, 0, 1, 0.8),
    rate: clamp(settings.rate, 0.75, 1, 0.9),
    voiceURI: typeof settings.voiceURI === 'string' ? settings.voiceURI : '',
  };
  let message = null;
  let attemptedId = null;
  let active = null;
  let timer = null;
  let destroyed = false;
  let status = {
    code: supported ? 'disabled' : 'unsupported',
    message_id: null,
  };

  function publish(code, detail = '') {
    status = { code, message_id: message?.id ?? null, detail };
    onStatus({ ...status });
  }

  function cancel() {
    if (timer !== null) unschedule(timer);
    timer = null;
    const previous = active;
    active = null; // Invalidar callbacks antes de cancelar la voz anterior.
    if (previous) synth.cancel();
  }

  function speak() {
    if (destroyed || !preferences.enabled || !message?.text) return;
    if (!isVisible()) {
      publish('stopped');
      return;
    }
    const voices = spanishVoices(synth);
    const voice =
      voices.find((v) => v.voiceURI === preferences.voiceURI) ?? voices[0];
    if (!voice) {
      publish('no_voice');
      return;
    }
    attemptedId = message.id;
    cancel();
    const utterance = new Utterance(message.text);
    active = utterance; // Mantener una referencia hasta onend/onerror.
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.volume = preferences.volume;
    utterance.rate = preferences.rate;
    let started = false;
    utterance.onstart = () => {
      if (active !== utterance) return;
      started = true;
      if (timer !== null) unschedule(timer);
      timer = null;
      publish('speaking');
    };
    utterance.onend = () => {
      if (active !== utterance) return;
      active = null;
      if (timer !== null) unschedule(timer);
      timer = null;
      publish('ended');
    };
    utterance.onerror = (event) => {
      if (active !== utterance) return;
      active = null;
      if (timer !== null) unschedule(timer);
      timer = null;
      publish(event.error === 'not-allowed' ? 'blocked' : 'error', event.error);
    };
    publish('queued');
    timer = schedule(() => {
      if (active !== utterance || started) return;
      cancel();
      publish('blocked');
    }, 5000);
    try {
      synth.speak(utterance);
    } catch {
      cancel();
      publish('error');
    }
  }

  return {
    update(next) {
      if (
        destroyed ||
        !next ||
        typeof next.id !== 'string' ||
        typeof next.text !== 'string'
      )
        return;
      if (message?.id === next.id) return; // Un rerun no es una nueva instrucción.
      cancel();
      message = { id: next.id, text: next.text };
      if (preferences.enabled) speak();
    },
    enable() {
      if (destroyed || !supported) return;
      if (!spanishVoices(synth).length) {
        publish('no_voice');
        return;
      }
      preferences.enabled = true;
      speak(); // Se llama directamente desde el clic para respetar permisos.
    },
    disable() {
      preferences.enabled = false;
      cancel();
      publish('disabled');
    },
    repeat() {
      if (preferences.enabled) speak();
    },
    stop() {
      cancel();
      publish('stopped');
    },
    configure(next) {
      preferences.volume = clamp(next.volume ?? preferences.volume, 0, 1, 0.8);
      preferences.rate = clamp(next.rate ?? preferences.rate, 0.75, 1, 0.9);
      preferences.voiceURI =
        typeof next.voiceURI === 'string'
          ? next.voiceURI
          : preferences.voiceURI;
      cancel();
      publish('configured'); // Cambiar ajustes no vuelve a leer el mensaje.
    },
    snapshot() {
      return {
        supported,
        settings: { ...preferences },
        status: { ...status },
        speaking: active !== null,
        attemptedId,
      };
    },
    destroy() {
      destroyed = true;
      cancel();
    },
  };
}
