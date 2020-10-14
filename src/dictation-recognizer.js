/**
 * Speech / `DictationRecognizer` class.
 *
 * @author NDF, 09-October-2020.
 *
 * @see https://docs.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/?view=azure-node-latest
 * @see https://github.com/microsoft/cognitive-services-speech-sdk-js
 */

import { getDictationRecognizerConfig } from './directline-config.js';
// import { SpeechRecognitionBase } from './speech-recognition-base.js';

// export const SRB = new SpeechRecognitionBase();

const { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason, CancellationReason, OutputFormat } = window.SpeechSDK;
const CustomEvent = window.CustomEvent;
const Event = window.Event;
const EventTarget = window.EventTarget;
// const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent || Event;

const CUSTOM_EVENT = '_custom';
const STOP_TIMEOUT_MS = 800;

export const AUDIO_SOURCE_ERROR_EVENT = 'audioSourceError';

export const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

// ----------------------------------------------------

export class SpeechRecognitionEventBase extends Event {
  constructor (name, data = null) {
    super(...arguments);

    data = data || {};

    this.emma = null; // Readonly; XML; Obsolete.
    this.interpretation = null; // Readonly; Obsolete.
    this.resultIndex = data.resultIndex || 0;
    this.results = data.results || null; // { length: 0 }; // SpeechRecognitionResultList.
  }
}

// https://github.com/compulim/web-speech-cognitive-services/blob/master/packages/component/src/SpeechServices/SpeechToText/cognitiveServiceEventResultToWebSpeechRecognitionResultList.js
export function getWebSpeechRecognitionResultList (transcript, isFinal = true, confidence = 0.95) {
  const resultList = [
    [
      { confidence, transcript }
    ]
  ];

  resultList.isFinal = isFinal;

  return resultList;
}

// ----------------------------------------------------

// https://github.com/microsoft/cognitive-services-speech-sdk-js/blob/master/src/common.browser/ConsoleLoggingListener.ts#L6
export class MyErrorEventListener /* implements IEventListener<PlatformEvent> */ {
  onEvent (event) {
    if (event.name.includes('Error')) {
      console.warn('ERROR:', event.error, event);

      // 'AudioSourceErrorEvent'
      if (event.error.includes('microphone initialization: NotAllowedError')) {
        const EV = new CustomEvent(AUDIO_SOURCE_ERROR_EVENT, { detail: { event, micNotAllowed: true } });
        window.dispatchEvent(EV);
      }
    } else {
      // Non-error, e.g. 'AudioStreamNodeAttachedEvent' etc.
      // console.debug('Event:', event);
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

  normalize: true,
  separator: ' '

  // appId: '90605e10-09b4-11eb-88f2-25c0a50f0bd0', // Custom command App.
};

// ----------------------------------------------------

export class DictationRecognizer extends EventTarget { // SpeechRecognitionBase {
  constructor () {
    super(...arguments);

    // Web API compatibility.
    this.continuous = false;
    this.grammars = new SpeechGrammarList(); // {length: 0}
    this.interimResults = false;
    this.lang = '';
    this.maxAlternatives = 1;

    // Internal use.
    this.recognizer = null;
    this.OPT = {};
    this._reset();
    this.initialize();
  }

  _reset () {
    this.started = false;
    this.lastOffset = null;
    this.interims = []; // Hypotheses.
    this.BUFFER = []; // Final text.
  }

  /**
   * @see https://docs.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/speechconfig?view=azure-node-latest
   * @see https://github.com/microsoft/cognitive-services-speech-sdk-js/blob/master/src/sdk/SpeechConfig.ts
   */
  initialize (OPT = null) {
    OPT = OPT || getDictationRecognizerConfig();

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
    audioConfig.events.attachListener(new MyErrorEventListener()); // TODO: 'this' does NOT work ?!

    this.recognizer = new SpeechRecognizer(speechConfig, audioConfig);
    this.OPT = OPT;
    this.lang = OPT.lang;

    // Setup lifecycle event handlers.
    this.recognizing();
    this.recognized();
    this.sessionStopped();
    this.canceled();

    console.debug(`${this.constructor.name}:`, this);

    return OPT;
  }

  // Start continuous speech recognition
  start () {
    this._reset();

    this.recognizer.startContinuousRecognitionAsync(() => {
      this._dispatchEvent('start', null, null, 'start');

      this.started = true;
    },
    (error) => this._handleError(error, 'start'));
  }

  // Stop continuous speech recognition
  stop () {
    if (this.started) {
      this.recognizer.stopContinuousRecognitionAsync(() => {
        this._dispatchEvent('end', null, null, 'stop'); // Not: 'stop' !!

        this.started = false;
      },
      (error) => this._handleError(error, 'stop'));
    }
  }

  recognizing (callbackFn = null) {
    this.recognizer.recognizing = (s, e) => { // 'Sender', 'Event'
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

      this._dispatchResultEvent(e, false, 'recognizing');
    };
  }

  recognized (callbackFn = null) {
    this.recognizer.recognized = (s, e) => {
      const nReason = e.result.reason;
      const strReason = ResultReason[nReason] || 'Unknown';
      const res = JSON.parse(e.privResult.privJson);
      const source = `recognized.${strReason}.${res.RecognitionStatus}`;

      const STATUS_REGEX = new RegExp(this.OPT.stopStatusRegex);

      if (nReason === ResultReason.NoMatch && STATUS_REGEX.test(res.RecognitionStatus)) {
        setTimeout(() => this.stop(), STOP_TIMEOUT_MS);
        // WAS: recognizer.stopContinuousRecognitionAsync();

        this._dispatchResultEvent(e, true, source);

        // We don't see 'RecognizedSpeech' in dictation mode!
      } else if (nReason === ResultReason.RecognizedSpeech) {
        const TEXT = e.getResult().getText();

        console.debug('Recognized event. Reason:', strReason, TEXT, res.RecognitionStatus, res, e, s);

        this.BUFFER.push(TEXT);

        this._dispatchResultEvent(e, true, source);
      } else {
        console.debug('Recognized event. Reason:', strReason, res.RecognitionStatus, res, e, s);

        this._dispatchEvent(CUSTOM_EVENT, null, e, source);
      }
    };
  }

  canceled () {
    this.recognizer.canceled = (s, e) => {
      console.warn(`CANCELED: Reason=${e.reason}`);

      if (e.reason === CancellationReason.Error) {
        console.error('CANCELED: Error.', e);
        console.warn('CANCELED: Did you update the subscription info?');

        this._handleError(e, 'canceled');
      } else {
        this._dispatchEvent(CUSTOM_EVENT, null, e, 'canceled');
      }

      this.stop(); // WAS: recognizer.stopContinuousRecognitionAsync();
    };
  }

  sessionStopped () {
    this.recognizer.sessionStopped = (s, e) => {
      this.stop(); // Was: recognizer.stopContinuousRecognitionAsync();

      console.debug(`\n>> Session stopped event. Result: "${this.getRecognizedText()}"`, e, s);

      this._dispatchResultEvent(e, true, 'sessionStopped');
    };
  }

  getInterimText () {
    return this.interims.join(this.OPT.separator);
  }

  getRecognizedText () {
    const TEXT = this.BUFFER.length ? this.BUFFER.join(this.OPT.separator) : this.getInterimText();

    return this.OPT.normalize ? this._toSentence(TEXT) : TEXT;
  }

  getConfiguration () {
    return this.OPT;
  }

  _toSentence (text) {
    const sentence = text.replace(/^(\w)/, match => match.toUpperCase());

    return `${sentence}.`;
  }

  // ----------------------------------------------------

  _dispatchEvent (eventName, data = null, recognizerEvent = null, source = null) {
    const event = new SpeechRecognitionEventBase(eventName, data);

    if (recognizerEvent || source) {
      event.data = {
        recognizerEvent, source
      };
    }

    /* if (data && data.results) {
      event.emma = data.emma;
      event.resultIndex = data.resultIndex;
      event.results = data.results;
      event._isFinal = data._isFinal
    } */

    this.dispatchEvent(event);

    const onEvent = `on${eventName}`;
    if (this[onEvent] && typeof this[onEvent] === 'function') {
      this[onEvent](event);
    }

    console.debug('Recognition event fired:', eventName, event);
  }

  _dispatchResultEvent (origEvent, isFinal, source) {
    const transcript = isFinal ? this.getRecognizedText() : this.getInterimText();
    const data = {
      // emma: null,
      // interpretation: null,
      resultIndex: 0,
      results: getWebSpeechRecognitionResultList(transcript, isFinal) // [[{ transcript, confidence: null }]],
      // _isFinal: isFinal
    };

    /// console.warn('_dispatchResultEvent:', data, source);

    this._dispatchEvent('result', data, origEvent, source);
  }

  _handleError (error, source) {
    console.error('Recognition ERROR fired:', source, error);

    this._dispatchEvent('error', { error }, null, source);
  }

  // ----------------------------------------------------

  /* _onEvent (ev) {
    if (ev.name.includes('Error')) {
      // console.warn('ERROR:', ev.error, ev);

      // 'AudioSourceErrorEvent'
      if (ev.error.includes('microphone initialization: NotAllowedError')) {
        // const EV = new CustomEvent(AUDIO_SOURCE_ERROR_EVENT, { detail: { event, micNotAllowed: true } });
        // window.dispatchEvent(EV);

        console.debug('onEvent:', this, ev);

        this._handleError(ev, 'AudioSourceErrorEvent');
      }
    } else {
      // Non-error, e.g. 'AudioStreamNodeAttachedEvent' etc.
      // console.debug('Event:', event);
    }
  } */
}

/* DictationRecognizer.prototype.onEvent = (ev) => {
  console.debug('onEvent (prototype):', this, ev);
}; */
