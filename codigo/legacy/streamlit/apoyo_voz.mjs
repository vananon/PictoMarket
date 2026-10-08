// El estado de reproducción pertenece a cada instancia, no a la página global.
const instances = new WeakMap();

const clamp = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

export function spanishVoices(synth) {
  try {
    return synth.getVoices().filter((voice) => /^es(?:[-_]|$)/i.test(voice.lang))
      .sort((a, b) => {
        const score = (v) => (v.localService ? 100 : 0)
          + (/^es[-_]PE$/i.test(v.lang) ? 20 : 0)
          + (/^es[-_](MX|US|AR|CL|CO)$/i.test(v.lang) ? 10 : 0);
        return score(b) - score(a) || a.name.localeCompare(b.name);
      });
  } catch {
    return [];
  }
}

// Núcleo sin DOM: se prueba con SpeechSynthesis simulado, sin producir sonido.
export function createSpeechController({
  synth, Utterance, settings = {}, onStatus = () => {},
  isVisible = () => true, schedule = setTimeout, unschedule = clearTimeout,
}) {
  const supported = Boolean(synth && Utterance);
  const preferences = {
    enabled: false, // Toda instancia nueva requiere un gesto explícito.
    volume: clamp(settings.volume, 0, 1, 0.8),
    rate: clamp(settings.rate, 0.75, 1, 0.9),
    voiceURI: typeof settings.voiceURI === "string" ? settings.voiceURI : "",
  };
  let message = null;
  let attemptedId = null;
  let active = null;
  let timer = null;
  let destroyed = false;
  let status = { code: supported ? "disabled" : "unsupported", message_id: null };

  function publish(code, detail = "") {
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
      publish("stopped");
      return;
    }
    const voices = spanishVoices(synth);
    const voice = voices.find((v) => v.voiceURI === preferences.voiceURI) ?? voices[0];
    if (!voice) {
      publish("no_voice");
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
      publish("speaking");
    };
    utterance.onend = () => {
      if (active !== utterance) return;
      active = null;
      if (timer !== null) unschedule(timer);
      timer = null;
      publish("ended");
    };
    utterance.onerror = (event) => {
      if (active !== utterance) return;
      active = null;
      if (timer !== null) unschedule(timer);
      timer = null;
      publish(event.error === "not-allowed" ? "blocked" : "error", event.error);
    };
    publish("queued");
    timer = schedule(() => {
      if (active !== utterance || started) return;
      cancel();
      publish("blocked");
    }, 5000);
    try {
      synth.speak(utterance);
    } catch {
      cancel();
      publish("error");
    }
  }

  return {
    update(next) {
      if (destroyed || !next || typeof next.id !== "string" || typeof next.text !== "string") return;
      if (message?.id === next.id) return; // Un rerun no es una nueva instrucción.
      cancel();
      message = { id: next.id, text: next.text };
      if (preferences.enabled) speak();
    },
    enable() {
      if (destroyed || !supported) return;
      if (!spanishVoices(synth).length) {
        publish("no_voice");
        return;
      }
      preferences.enabled = true;
      speak(); // Se llama directamente desde el clic para respetar permisos.
    },
    disable() {
      preferences.enabled = false;
      cancel();
      publish("disabled");
    },
    repeat() {
      if (preferences.enabled) speak();
    },
    stop() {
      cancel();
      publish("stopped");
    },
    configure(next) {
      preferences.volume = clamp(next.volume ?? preferences.volume, 0, 1, 0.8);
      preferences.rate = clamp(next.rate ?? preferences.rate, 0.75, 1, 0.9);
      preferences.voiceURI = typeof next.voiceURI === "string" ? next.voiceURI : preferences.voiceURI;
      cancel();
      publish("configured"); // Cambiar ajustes no vuelve a leer el mensaje.
    },
    snapshot() {
      return { supported, settings: { ...preferences }, status: { ...status },
        speaking: active !== null, attemptedId };
    },
    destroy() {
      destroyed = true;
      cancel();
    },
  };
}

const labels = {
  disabled: "La voz está apagada. Pulsa «Activar voz» para escuchar las instrucciones.",
  unsupported: "Este navegador no permite leer en voz alta. Puedes seguir usando los pictogramas y el texto.",
  no_voice: "No hay una voz en español disponible. Instala una voz en español o prueba otro navegador.",
  queued: "Preparando la voz…",
  speaking: "Leyendo la instrucción…",
  ended: "Puedes repetir la instrucción cuando lo necesites.",
  stopped: "Lectura detenida. Puedes repetir la instrucción.",
  configured: "Ajustes guardados. Pulsa «Repetir instrucción» para escucharlos.",
  blocked: "El navegador no inició la voz. Pulsa «Repetir instrucción» para intentarlo de nuevo.",
  error: "No se pudo reproducir la voz. Puedes repetir o continuar sin audio.",
};

function mountRuntime(root, component, environment) {
  const synth = environment.speechSynthesis;
  const controls = Object.fromEntries(
    ["activar", "repetir", "detener", "voz", "velocidad", "volumen", "volumen_valor", "estado"]
      .map((id) => [id, root.querySelector(`#${id}`)]),
  );
  const runtime = { bridge: component, generation: 0 };
  const document = root.ownerDocument;
  const controller = createSpeechController({
    synth,
    Utterance: environment.SpeechSynthesisUtterance,
    settings: component.data?.settings,
    isVisible: () => !document.hidden,
    onStatus: (status) => {
      runtime.render();
      runtime.bridge.setStateValue("reproduccion", { ...status, at_ms: Date.now() });
    },
  });
  runtime.controller = controller;

  runtime.render = () => {
    const { supported, settings, status, speaking } = controller.snapshot();
    const voices = supported ? spanishVoices(synth) : [];
    controls.activar.disabled = !supported || !voices.length;
    controls.activar.textContent = settings.enabled ? "Silenciar voz" : "Activar voz";
    controls.activar.setAttribute("aria-pressed", String(settings.enabled));
    controls.repetir.disabled = !settings.enabled || !voices.length;
    controls.detener.disabled = !speaking;
    controls.velocidad.disabled = !supported;
    controls.volumen.disabled = !supported;
    controls.voz.disabled = !voices.length;
    // Evitar reconstruir el selector si la lista no cambió (conserva el foco).
    const voiceKey = JSON.stringify(voices.map((v) => [v.voiceURI, v.localService]));
    if (runtime.voiceKey !== voiceKey) {
      runtime.voiceKey = voiceKey;
      controls.voz.replaceChildren(...voices.map((voice) => {
        const option = document.createElement("option");
        option.value = voice.voiceURI;
        option.textContent = `${voice.name} (${voice.lang}, ${voice.localService ? "dispositivo" : "en línea"})`;
        return option;
      }));
    }
    const selected = voices.find((v) => v.voiceURI === settings.voiceURI) ?? voices[0];
    if (selected) controls.voz.value = selected.voiceURI;
    controls.velocidad.value = String(settings.rate);
    controls.volumen.value = String(settings.volume);
    controls.volumen_valor.textContent = `${Math.round(settings.volume * 100)} %`;
    const code = !supported ? "unsupported" : !voices.length ? "no_voice"
      : !settings.enabled ? "disabled" : status.code;
    controls.estado.textContent = labels[code] ?? labels.error;
  };

  const saveSettings = () => {
    runtime.render();
    runtime.bridge.setStateValue("ajustes", controller.snapshot().settings);
  };
  controls.activar.onclick = () => {
    if (controller.snapshot().settings.enabled) controller.disable();
    else controller.enable();
    saveSettings();
  };
  controls.repetir.onclick = () => controller.repeat();
  controls.detener.onclick = () => controller.stop();
  controls.voz.onchange = () => {
    controller.configure({ voiceURI: controls.voz.value });
    saveSettings();
  };
  controls.velocidad.onchange = () => {
    controller.configure({ rate: controls.velocidad.value });
    saveSettings();
  };
  controls.volumen.oninput = () => {
    controls.volumen_valor.textContent = `${Math.round(Number(controls.volumen.value) * 100)} %`;
  };
  controls.volumen.onchange = () => {
    controller.configure({ volume: controls.volumen.value });
    saveSettings();
  };
  const onVisibility = () => { if (document.hidden) controller.stop(); };
  const onPageHide = () => controller.stop();
  const onVoices = () => runtime.render();
  synth?.addEventListener("voiceschanged", onVoices);
  document.addEventListener("visibilitychange", onVisibility);
  environment.addEventListener("pagehide", onPageHide);
  runtime.destroy = () => {
    controller.destroy();
    synth?.removeEventListener("voiceschanged", onVoices);
    document.removeEventListener("visibilitychange", onVisibility);
    environment.removeEventListener("pagehide", onPageHide);
    for (const control of Object.values(controls)) {
      control.onclick = control.onchange = control.oninput = null;
    }
  };
  return runtime;
}

export default function (component) {
  const { parentElement, data } = component;
  let runtime = instances.get(parentElement);
  if (!runtime) {
    runtime = mountRuntime(parentElement, component, window);
    instances.set(parentElement, runtime);
  }
  runtime.bridge = component;
  const generation = ++runtime.generation;
  runtime.controller.update(data?.message);
  runtime.render();
  return () => {
    // CCv2 también puede limpiar al actualizar props. Solo destruir al desmontar,
    // no interrumpir una frase por el rerun que produce su evento onstart.
    queueMicrotask(() => {
      const connected = parentElement.host?.isConnected ?? parentElement.isConnected;
      if (runtime.generation !== generation || connected) return;
      runtime.destroy();
      instances.delete(parentElement);
    });
  };
}
