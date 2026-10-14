// Web Speech Synthesis (TTS) & Recognition (STT) Utility for LFHP Labs

export interface VoiceSettings {
  rate: number; // 0.5 to 2.0 (default: 1.0)
  pitch: number; // 0.5 to 2.0 (default: 1.0)
  volume: number; // 0 to 1.0 (default: 1.0)
  voiceURI?: string;
  autoSpeak: boolean;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  autoSpeak: false,
};

const SETTINGS_STORAGE_KEY = 'lfhp_voice_settings_v1';

export class SpeechService {
  private static settings: VoiceSettings = DEFAULT_SETTINGS;
  private static voices: SpeechSynthesisVoice[] = [];
  private static isInitialized = false;
  private static activeUtterance: SpeechSynthesisUtterance | null = null;
  private static listeners: Set<(isSpeaking: boolean) => void> = new Set();
  private static currentlySpeaking = false;

  public static init(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;
    this.isInitialized = true;

    // Load saved settings
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore
    }

    // Load voices
    if ('speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private static loadVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
  }

  public static getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
    }
    return this.voices;
  }

  public static getPreferredVoice(): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (voices.length === 0) return null;

    if (this.settings.voiceURI) {
      const match = voices.find(v => v.voiceURI === this.settings.voiceURI);
      if (match) return match;
    }

    // Prefer high quality English voices
    const preferredNames = [
      'Google US English',
      'Google UK English Female',
      'Microsoft Jenny Online (Natural)',
      'Microsoft Guy Online (Natural)',
      'Samantha',
      'Daniel',
      'Karen',
      'Victoria',
    ];

    for (const name of preferredNames) {
      const found = voices.find(v => v.name.includes(name) || v.voiceURI.includes(name));
      if (found) return found;
    }

    // Fallback: any English voice
    const enVoice = voices.find(v => v.lang.startsWith('en') && (v.localService || v.name.includes('Natural') || v.name.includes('Google')));
    if (enVoice) return enVoice;

    return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
  }

  public static getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  public static updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore
    }
  }

  public static subscribeSpeakingState(callback: (isSpeaking: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentlySpeaking);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static setSpeakingState(speaking: boolean): void {
    this.currentlySpeaking = speaking;
    this.listeners.forEach(cb => cb(speaking));
  }

  public static isSpeaking(): boolean {
    return this.currentlySpeaking;
  }

  public static stopSpeaking(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      this.activeUtterance = null;
      this.setSpeakingState(false);
    } catch {
      // Ignore
    }
  }

  /**
   * Speak welcome announcement when a student logs into LFHP labs
   * Voice announces: "Welcome <studentName> to LFHP labs"
   */
  public static speakWelcome(studentName: string): Promise<void> {
    const cleanName = (studentName || 'Student').trim();
    const welcomeMessage = `Welcome ${cleanName} to LFHP labs. Your Linux virtual environment and AI frontend mentor are ready.`;
    return this.speakText(welcomeMessage, { rate: 1.0, pitch: 1.05 });
  }

  /**
   * Cleans markdown and code formatting so speech sounds smooth & natural
   */
  public static cleanTextForSpeech(text: string): string {
    return text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, 'Code example provided in the chat window.')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove markdown bold/italics
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Remove links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove list dashes and numbers
      .replace(/^\s*[-*•]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove hashes for headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove excess whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Speak any given text with Web Speech Synthesis
   */
  public static speakText(
    rawText: string,
    options?: { rate?: number; pitch?: number; volume?: number; onEnd?: () => void }
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      const text = this.cleanTextForSpeech(rawText);
      if (!text) {
        resolve();
        return;
      }

      this.stopSpeaking();

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        const preferredVoice = this.getPreferredVoice();
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.rate = options?.rate ?? this.settings.rate;
        utterance.pitch = options?.pitch ?? this.settings.pitch;
        utterance.volume = options?.volume ?? this.settings.volume;

        utterance.onstart = () => {
          this.setSpeakingState(true);
        };

        utterance.onend = () => {
          this.activeUtterance = null;
          this.setSpeakingState(false);
          options?.onEnd?.();
          resolve();
        };

        utterance.onerror = () => {
          this.activeUtterance = null;
          this.setSpeakingState(false);
          resolve();
        };

        this.activeUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Speech synthesis error:', err);
        this.setSpeakingState(false);
        resolve();
      }
    });
  }

  /**
   * Check if Speech Recognition (Voice Input) is supported in current browser
   */
  public static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Create Speech Recognition instance for microphone voice input
   */
  public static createSpeechRecognizer(
    onResult: (transcript: string) => void,
    onError?: (error: any) => void,
    onEnd?: () => void
  ): any {
    if (!this.isSpeechRecognitionSupported()) return null;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResult(finalTranscript);
      }
    };

    if (onError) recognition.onerror = onError;
    if (onEnd) recognition.onend = onEnd;

    return recognition;
  }
}
