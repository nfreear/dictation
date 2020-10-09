/**
 * SpeechDictation class.
 *
 * @author NDF, 09-October-2020.
 */

const { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason } = window.SpeechSDK;

// https://github.com/microsoft/cognitive-services-speech-sdk-js/blob/master/src/common.browser/ConsoleLoggingListener.ts#L6
export class MyErrorEventListener /* implements IEventListener<PlatformEvent> */ {
    /* public constructor(logLevelFilter: EventType = EventType.Warning) {
        this.privLogLevelFilter = logLevelFilter;
    }
    public onEvent = (event: PlatformEvent): void => {
    } */

    onEvent (event) {
      if (event.name.includes('Error')) {
        console.error('ERROR:', event.error, event);

        // 'AudioSourceErrorEvent'
        if (event.error.includes('microphone initialization: NotAllowedError')) {
          // ??
        }
      }
    }
}

// ----------------------------------------------------

export const DEFAULTS = {
  key:     '__EDIT_ME__',
  region:  'westeurope',
  lang:    'en-GB',
  format:  'detailed',
  mode:    'dictation',
  initialSilenceTimeoutMs: 5 * 1000,
  endSilenceTimeoutMs:     5 * 1000,

  separator: ' '

  // appId: '90605e10-09b4-11eb-88f2-25c0a50f0bd0', // Custom command App.
};

// ----------------------------------------------------

export class DictationRecognizer {
  constructor () {
    this.recognizer = null;
    this.BUFFER = [];
  }

  initialize (OPT = {}) {
    // wss://westeurope.stt.speech.microsoft.com/speech/recognition/dictation/cognitiveservices/v1?language=en-GB&format=simple&Ocp-Apim-Subscription-Key=__EDIT_ME__&X-ConnectionId=__X__
    OPT.url = `wss://${OPT.region}.stt.speech.microsoft.com/speech/recognition/${OPT.mode}/cognitiveservices/v1?initialSilenceTimeoutMs=${OPT.initialSilenceTimeoutMs}&endSilenceTimeoutMs=${OPT.endSilenceTimeoutMs}&format=${OPT.format}`;
    OPT.urlObj = new URL(OPT.url);

    const speechConfig = SpeechConfig.fromEndpoint(OPT.urlObj, OPT.key);
    // const speechConfig = SpeechConfig.fromSubscription(KEY, REGION);

    speechConfig.enableDictation();
    speechConfig.speechRecognitionLanguage = OPT.lang;

    const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
    audioConfig.events.attachListener(new MyErrorEventListener);

    const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

    console.debug('Recognizer:', recognizer, speechConfig, audioConfig, OPT);

    this.recognizer = recognizer;

    return OPT;
  }

  // Start continuous speech recognition
  startRecognition (callbackFn = null) {
    this.recognizer.startContinuousRecognitionAsync(() => {
      console.debug('Recognition started');

      if (callbackFn) { callbackFn(); }
    }, (err) => {
      console.error('>> Recognition start error:', `[${typeof err || 'XX'}]`, err);
    });
  }

  // Stop continuous speech recognition
  stopRecognition (callbackFn = null) {
    this.recognizer.stopContinuousRecognitionAsync(() => {
      console.debug('Recognition stopped');

      if (callbackFn) { callbackFn(); }

      /* document.body.classList.add('recognizer-stopped');
      document.body.classList.remove('recognizer-started'); */
    }, (err) => {
      console.error('Recognition stop error:', err)
    });
  }

  recognizing (callbackFn = null) {
    this.recognizer.recognizing = (s, e) => {
      const TEXT = e.result.text;

      console.log(`RECOGNIZING: Text="${TEXT}"`, e.result);
      // LOG.textContent += `Recognizing. Text := ${TEXT}\n`;

      const IDX = this.BUFFER.length - 1;
      const SEARCH = `${this.BUFFER[ IDX ]}`; // Space after / No space after ??
      const IS_INTERIM = IDX >= 0 && TEXT.indexOf(SEARCH) === 0;
      if (IS_INTERIM) {
        this.BUFFER[ IDX ] = TEXT; // Replace!
      } else {
        this.BUFFER.push(TEXT);
      }

      /* LOG.textContent += `Recognizing. Text := ${TEXT}\n`;

      document.body.classList.add('recognizer-started');
      document.body.classList.remove('recognizer-stopped'); */

      if (callbackFn) { callbackFn(e, TEXT); }
    };
  }

  recognized (callbackFn = null) {
    this.recognizer.recognized = (s, e) => {
      const REASON = ResultReason[ e.result.reason ] || 'Unknown';
      const res = JSON.parse(e.privResult.privJson);

      /* if (e.result.reason == ResultReason.RecognizedSpeech) {
        // Do something with the recognized text
        console.warn('Recognizer event. Reason:', REASON, e.getResult().getText(), e, s);
      } else { */
      console.warn('Recognized event. Reason:', REASON, res.RecognitionStatus, res, e, s);
      // }

      if (REASON === 'NoMatch' && res.RecognitionStatus === 'EndOfDictation') {
        this.stopRecognition();
        // recognizer.stopContinuousRecognitionAsync();
      }

      if (callbackFn) { callbackFn(e); }
    };
  }

  canceled (callbackFn = null) {
    this.recognizer.canceled = (s, e) => {
        console.log(`CANCELED: Reason=${e.reason}`);

        if (e.reason == CancellationReason.Error) {
            console.error(`"CANCELED: ErrorCode=${e.errorCode}`);
            console.warn(`"CANCELED: ErrorDetails=${e.errorDetails}`);
            console.warn("CANCELED: Did you update the subscription info?");
        }

        this.stopRecognition();
        // recognizer.stopContinuousRecognitionAsync();

        if (callbackFn) { callbackFn(e); }
      };
  }

  sessionStopped (callbackFn) {
    this.recognizer.sessionStopped = (s, e) => {
      console.log("\n    Session stopped event.", e, s);
      this.stopRecognition();
      // recognizer.stopContinuousRecognitionAsync();

      console.warn('Result:', this.BUFFER);

      /* RESULT.innerHTML = `Result :~ <q>${BUFFER.join(OPT.separator)}</q>`;

      document.body.classList.add('recognizer-stopped');
      document.body.classList.remove('recognizer-started'); */

      if (callbackFn) { callbackFn(e, this.BUFFER); }
    };
  }
}
