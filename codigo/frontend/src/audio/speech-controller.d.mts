export interface SpeechSettings {
  enabled: boolean;
  volume: number;
  rate: number;
  voiceURI: string;
}
export interface SpeechStatus {
  code: string;
  message_id: string | null;
  detail?: string;
}
export interface SpeechSnapshot {
  supported: boolean;
  settings: SpeechSettings;
  status: SpeechStatus;
  speaking: boolean;
  attemptedId: string | null;
}
export interface SpeechController {
  update(message: { id: string; text: string }): void;
  enable(): void;
  disable(): void;
  repeat(): void;
  stop(): void;
  configure(settings: Partial<SpeechSettings>): void;
  snapshot(): SpeechSnapshot;
  destroy(): void;
}
export function spanishVoices(synth?: SpeechSynthesis): SpeechSynthesisVoice[];
export function createSpeechController(options: {
  synth?: SpeechSynthesis;
  Utterance?: typeof SpeechSynthesisUtterance;
  settings?: Partial<SpeechSettings>;
  onStatus?: (status: SpeechStatus) => void;
  isVisible?: () => boolean;
}): SpeechController;
