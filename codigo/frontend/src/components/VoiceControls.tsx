import { Settings2, Square, Volume2, VolumeX } from 'lucide-react';
import type { SpeechSupport } from '../hooks/useSpeech';

const labels: Record<string, string> = {
  disabled: 'Activa la voz para escuchar las instrucciones.',
  unsupported:
    'Este navegador no permite leer en voz alta. Puedes continuar con el texto y los pictogramas.',
  no_voice:
    'No hay voces en español. Instala una voz en tu dispositivo o prueba otro navegador.',
  queued: 'Preparando la voz…',
  speaking: 'Leyendo la instrucción…',
  ended: 'Puedes repetir cuando quieras.',
  stopped: 'Lectura detenida. Puedes repetirla.',
  configured: 'Ajustes guardados. Repite para escucharlos.',
  blocked: 'El navegador no inició la voz. Pulsa repetir para reintentarlo.',
  error: 'No se pudo leer. Puedes continuar sin audio.',
};
export function VoiceControls({ speech }: { speech: SpeechSupport }) {
  const { snapshot, voices } = speech;
  const canSpeak = snapshot.supported && voices.length > 0;
  const status = !snapshot.supported
    ? 'unsupported'
    : !voices.length
      ? 'no_voice'
      : !snapshot.settings.enabled
        ? 'disabled'
        : snapshot.status.code;
  return (
    <section className="voice-panel" aria-label="Apoyo de voz">
      <div className="voice-actions">
        <button
          className={`soft-button voice-toggle ${snapshot.settings.enabled ? 'enabled' : ''}`}
          onClick={speech.toggle}
          disabled={!canSpeak}
          aria-pressed={snapshot.settings.enabled}
        >
          {snapshot.settings.enabled ? (
            <VolumeX aria-hidden="true" />
          ) : (
            <Volume2 aria-hidden="true" />
          )}
          {snapshot.settings.enabled ? 'Silenciar voz' : 'Activar voz'}
        </button>
        <button
          className="soft-button"
          onClick={speech.repeat}
          disabled={!canSpeak || !snapshot.settings.enabled}
        >
          <Volume2 aria-hidden="true" />
          Repetir instrucción
        </button>
        <button
          className="soft-button"
          onClick={speech.stop}
          disabled={!snapshot.speaking}
        >
          <Square aria-hidden="true" />
          Detener
        </button>
      </div>
      <p className="voice-status" role="status">
        {labels[status] ?? labels.error}
      </p>
      <details className="voice-settings">
        <summary>
          <Settings2 aria-hidden="true" />
          Ajustes de voz
        </summary>
        <div className="settings-grid">
          <label>
            Voz en español
            <select
              disabled={!canSpeak}
              value={snapshot.settings.voiceURI || voices[0]?.voiceURI || ''}
              onChange={(event) =>
                speech.configure({ voiceURI: event.target.value })
              }
            >
              {!voices.length && <option value="">No disponible</option>}
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang},{' '}
                  {voice.localService ? 'dispositivo' : 'en línea'})
                </option>
              ))}
            </select>
          </label>
          <label>
            Velocidad
            <select
              disabled={!snapshot.supported}
              value={snapshot.settings.rate}
              onChange={(event) =>
                speech.configure({ rate: Number(event.target.value) })
              }
            >
              <option value="0.75">Lenta</option>
              <option value="0.9">Tranquila</option>
              <option value="1">Normal</option>
            </select>
          </label>
          <label>
            Volumen: {Math.round(snapshot.settings.volume * 100)} %
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={snapshot.settings.volume}
              disabled={!snapshot.supported}
              onChange={(event) =>
                speech.configure({ volume: Number(event.target.value) })
              }
            />
          </label>
        </div>
        <p className="fine-print">
          Sin micrófono. Las voces «en línea» pueden utilizar servicios del
          navegador y necesitan internet.
        </p>
      </details>
    </section>
  );
}
