/**
 * Speech / `DictationRecognizer` class.
 *
 * @author NDF, 09-October-2020.
 *
 * @see https://docs.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/?view=azure-node-latest
 * @see https://github.com/microsoft/cognitive-services-speech-sdk-js
 */

const { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason, CancellationReason, OutputFormat } = window.SpeechSDK;
const CustomEvent = window.CustomEvent;

export const AUDIO_SOURCE_ERROR_EVENT = 'audioSourceError';

// https://github.com/microsoft/cognitive-services-speech-sdk-js/blob/master/src/common.browser/ConsoleLoggingListener.ts#L6
export class MyErrorEventListener /* implements IEventListener<PlatformEvent> */ {
  onEvent (event) {
    if (event.name.includes('Error')) {
      console.warn('ERROR:', event.error, event);

      // 'AudioSourceErrorEvent'
      if (event.error.includes('microphone initialization: NotAllowedError')) {
        const EV = new CustomEvent(AUDIO_SOURCE_ERROR_EVENT, { detail: { event, micNotAllowed: true }});
        window.dispatchEvent(EV);
      }
    }
  }
}

// ----------------------------------------------------

export const DEFAULTS = {
  key: '__EDIT_ME__',
  region: 'westeurope',
  lang: 'en-GB',
  format: 'detailed', // Was: OutputFormat.Detailed,
  mode: 'dictation',
  initialSilenceTimeoutMs: 5 * 1000,
  endSilenceTimeoutMs: 5 * 1000,
  audioLogging: false,
  stopStatusRegex: '(NOT__EndOfDictation|InitialSilenceTimeout)',

  separator: ' '

  // appId: '90605e10-09b4-11eb-88f2-25c0a50f0bd0', // Custom command App.
};

// ----------------------------------------------------

export class DictationRecognizer {
  constructor () {
    this.recognizer = null;
    this.OPT = {};
    this.reset();
  }

  reset () {
    this.lastOffset = null;
    this.interims = []; // Hypotheses.
    this.BUFFER = []; // Final text.
  }

  /**
   * @see https://docs.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/speechconfig?view=azure-node-latest
   * @see https://github.com/microsoft/cognitive-services-speech-sdk-js/blob/master/src/sdk/SpeechConfig.ts
   */
  initialize (OPT = {}) {
    // wss://westeurope.stt.speech.microsoft.com/speech/recognition/dictation/cognitiveservices/v1?language=en-GB&format=simple&Ocp-Apim-Subscription-Key=__EDIT_ME__&X-ConnectionId=__X__
    OPT.url = `wss://${OPT.region}.stt.speech.microsoft.com/speech/recognition/${OPT.mode}/cognitiveservices/v1?initialSilenceTimeoutMs=${OPT.initialSilenceTimeoutMs || ''}&endSilenceTimeoutMs=${OPT.endSilenceTimeoutMs}&`; // format=${OPT.format}
    OPT.urlObj = new URL(OPT.url);

    const speechConfig = SpeechConfig.fromEndpoint(OPT.urlObj, OPT.key);
    // NOT: const speechConfig = SpeechConfig.fromSubscription(KEY, REGION);

    speechConfig.enableDictation();
    speechConfig.speechRecognitionLanguage = OPT.lang;
    speechConfig.outputFormat = OPT.format === 'detailed' ? OutputFormat.Detailed : OutputFormat.Simple;
    if (OPT.audioLogging) {
      speechConfig.enableAudioLogging();
    }

    const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
    audioConfig.events.attachListener(new MyErrorEventListener());

    const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

    this.recognizer = recognizer;
    this.OPT = OPT;

    console.debug(`${this.constructor.name}:`, this);

    return OPT;
  }

  // Start continuous speech recognition
  startRecognition (callbackFn = null) {
    this.reset();

    this.recognizer.startContinuousRecognitionAsync(() => {
      console.debug('Recognition started');

      if (callbackFn) { callbackFn('Recognition started'); }
    },
    (err) => {
      console.error('Recognition start error:', `[${typeof err || 'XX'}]`, err);
    });
  }

  // Stop continuous speech recognition
  stopRecognition (callbackFn = null) {
    this.recognizer.stopContinuousRecognitionAsync(() => {
      console.debug('Recognition stopped');

      if (callbackFn) { callbackFn('Recognition stopped'); }
    },
    (err) => {
      console.error('Recognition stop error:', err);
    });
  }

  recognizing (callbackFn = null) {
    this.recognizer.recognizing = (s, e) => {
      const TEXT = e.result.text;

      console.debug(`RECOGNIZING: Text="${TEXT}"`, e.result);

      const IDX = this.interims.length - 1;
      const SEARCH = `${this.interims[IDX]}`; // Space after / No space after ??
      const contains = IDX >= 0 && TEXT.indexOf(SEARCH) === 0;
      const offsetsMatch = e.result.offset === this.lastOffset;

      if (contains || offsetsMatch) {
        // Replace the entry in the buffer!
        this.interims[IDX] = TEXT;
      } else {
        this.interims.push(TEXT);
      }

      this.lastOffset = e.result.offset;

      if (callbackFn) { callbackFn(e, this.getInterimText()); }
    };
  }

  recognized (callbackFn = null) {
    this.recognizer.recognized = (s, e) => {
      const nReason = e.result.reason;
      const strReason = ResultReason[nReason] || 'Unknown';
      const res = JSON.parse(e.privResult.privJson);

      const STATUS_REGEX = new RegExp(this.OPT.stopStatusRegex);

      if (nReason === ResultReason.NoMatch && STATUS_REGEX.test(res.RecognitionStatus)) {
        this.stopRecognition(); // WAS: recognizer.stopContinuousRecognitionAsync();
      }

      // We don't see 'RecognizedSpeech' in dictation mode!
      if (nReason === ResultReason.RecognizedSpeech) {
        const TEXT = e.getResult().getText();

        console.warn('>> Recognized event. Reason:', strReason, TEXT, res.RecognitionStatus, res, e, s);

        this.BUFFER.push(TEXT);

        if (callbackFn) { callbackFn(e, this.getRecognizedText()); }
      } else {
        console.debug('Recognizer event. Reason:', strReason, res.RecognitionStatus, res, e, s);

        if (callbackFn) { callbackFn(e, null, res.RecognitionStatus); }
      }
    };
  }

  canceled (callbackFn = null) {
    this.recognizer.canceled = (s, e) => {
      console.warn(`CANCELED: Reason=${e.reason}`);

      if (e.reason === CancellationReason.Error) {
        console.error(`"CANCELED: ErrorCode=${e.errorCode}`);
        console.warn(`"CANCELED: ErrorDetails=${e.errorDetails}`);
        console.warn('CANCELED: Did you update the subscription info?');
      }

      this.stopRecognition(); // WAS: recognizer.stopContinuousRecognitionAsync();

      if (callbackFn) { callbackFn(e); }
    };
  }

  sessionStopped (callbackFn) {
    this.recognizer.sessionStopped = (s, e) => {
      this.stopRecognition(); // Was: recognizer.stopContinuousRecognitionAsync();

      console.debug(`\n>> Session stopped event. Result: "${this.getRecognizedText()}"`, e, s);

      if (callbackFn) { callbackFn(e, this.getRecognizedText()); }
    };
  }

  getInterimText () {
    return this.interims.join(this.OPT.separator);
  }

  getRecognizedText () {
    return this.BUFFER.length ? this.BUFFER.join(this.OPT.separator) : this.getInterimText();
  }
}
