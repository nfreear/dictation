/**
 * @DEPRECATED
 *
 * Speech / `DictationRecognizer` class.
 *
 * @author NDF, 09-October-2020.
 *
 * @see https://docs.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/?view=azure-node-latest
 * @see https://github.com/microsoft/cognitive-services-speech-sdk-js
 */

// import arrayToMap from './dictation/arrayToMap.js';

// import { BOT_DISPATCH_EVENT } from './bot-event.js';
// import { EventTarget } from './dictation/event-target-shim.js';
// Was: import { getDictationRecognizerConfig } from './directline-config.js';

const { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason, CancellationReason, OutputFormat } = window.SpeechSDK;

export const BOT_DISPATCH_EVENT = 'admins:botdispatch';

const Event = window.Event;
const EventTarget = window.EventTarget;
const ErrorEvent = window.ErrorEvent;
// const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent || Event;

const CUSTOM_EVENT = '_custom';
// const STOP_TIMEOUT_MS = 3000;

export const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

// ----------------------------------------------------

/* class SpeechRecognitionEvent {
  constructor(type, { data, emma, interpretation, resultIndex, results } = {}) {
    this.data = data;
    this.emma = emma; // (Obsolete.)
    this.interpretation = interpretation; // (Obsolete.)
    this.resultIndex = resultIndex;
    this.results = results;
    this.type = type;
  }
} */

export class SpeechRecognitionEvent extends Event { // Extend, or not??
  constructor (type, data = null) {
    super(...arguments);

    data = data || {};

    this.emma = null; // Readonly; XML; Obsolete.
    this.interpretation = null; // Readonly; Obsolete.
    this.resultIndex = data.resultIndex || 0;
    this.results = data.results || null; // { length: 0 }; // SpeechRecognitionResultList.

    // this.type = type;
  }
}

const DEFAULT_CONFIDENCE = 0.951111;

// https://github.com/compulim/web-speech-cognitive-services/blob/master/packages/component/src/SpeechServices/SpeechToText/cognitiveServiceEventResultToWebSpeechRecognitionResultList.js
export function getWebSpeechRecognitionResultList (transcript, isFinal = true, confidence = DEFAULT_CONFIDENCE) {
  /* const resultList = arrayToMap([
    [
      { transcript, confidence }
    ]
  ],
  { isFinal: true }); */

  const resultList = [
    [
      { confidence, transcript }
    ]
  ];
  // FIX :~ 'isFinal' hangs off the inner result!
  resultList[0].isFinal = isFinal;

  console.debug('resultList:', JSON.stringify(resultList, null, '\t'), resultList);

  return resultList;
}

// @see https://github.com/compulim/web-speech-cognitive-services/blob/master/packages/component/src/SpeechServices/SpeechToText/createSpeechRecognitionPonyfill.js
export function serializeRecognitionResult ({ duration, errorDetails, json, offset, properties, reason, resultId, text }) {
  return {
    duration,
    errorDetails,
    json: JSON.parse(json),
    offset,
    properties,
    reason,
    resultId,
    text
  };
}

// ----------------------------------------------------

// WAS: export class MyErrorEventListener {}

// WAS: export const DEFAULTS = {};

// ----------------------------------------------------

let privRecogConfig = null;
let privDispatcher = null;

// Call me before instantiating the
export function setDictationRecognizerConfig (OPT, dispatcher) {
  privRecogConfig = OPT;
  privDispatcher = dispatcher;
  console.debug('setDictationRecognizerConfig, delayed?', OPT, dispatcher);
}

export class SpeechRecognition extends EventTarget {
// export class DictationRecognizer extends EventTarget { // SpeechRecognitionBase {
  constructor (OPT = null) {
    super(...arguments);

    OPT = OPT || privRecogConfig;

    if (!OPT) throw new Error(`Fail in DictationRecognizer constructor. No options: ${OPT}`);

    // Web API compatibility (crude!)
    this.continuous = false;
    this.grammars = new SpeechGrammarList(); // {length: 0}
    this.interimResults = false;
    this.lang = '';
    this.maxAlternatives = 1;

    // Internal use.
    this.recognizer = null;
    this.OPT = {};
    this._reset();
    this.initialize(OPT);
  }

  _reset () {
    this.started = false;
    this.finalResultSent = false;
    this.lastOffset = null;
    this.interims = []; // Hypotheses.
    this.BUFFER = []; // Final text.
  }

  /**
   * @see https://docs.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/speechconfig?view=azure-node-latest
   * @see https://github.com/microsoft/cognitive-services-speech-sdk-js/blob/master/src/sdk/SpeechConfig.ts
   */
  initialize (OPT = null) {
    // Was: OPT = OPT || getDictationRecognizerConfig();

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
    // WAS: audioConfig.events.attachListener(new MyErrorEventListener()); // TODO: 'this' does NOT work ?!

    this.recognizer = new SpeechRecognizer(speechConfig, audioConfig);
    this.OPT = OPT;
    this.lang = OPT.lang;

    // Setup lifecycle event handlers.
    this.sessionStarted();
    this.recognizing();
    this.recognized();
    this.sessionStopped();
    this.canceled();

    console.debug(`${this.constructor.name}:`, this, privDispatcher);

    return OPT;
  }

  // Start continuous speech recognition
  start () {
    this._reset();

    this.recognizer.startContinuousRecognitionAsync(() => {
      // Was: this._dispatchEvent('start', null, null, 'start');

      this.started = true;
    },
    (error) => this._handleError(error, 'start'));
  }

  // Stop continuous speech recognition
  stop () {
    if (this.started) {
      this.recognizer.stopContinuousRecognitionAsync(() => {
        // Hack: just mock these events?
        /* this._dispatchEvent('speechend', null, null, 'stop');
        this._dispatchEvent('soundend');
        this._dispatchEvent('audioend'); */

        // this._dispatchEvent('end', null, null, 'stop'); // Event is not 'stop' !!

        this.started = false;
      },
      (error) => this._handleError(error, 'stop'));
    }
  }

  abort () {
    console.warn('Not implemented: \'abort()\'');
  }

  // ----------------------------------------------------
  // Private lifecycle event handlers.
  /*
  17:02:34.125  ~~ Event: start
  17:02:34.324  ~~ Event: audiostart
  17:02:35.067  ~~ Event: soundstart
  17:02:35.067  ~~ Event: speechstart
  17:02:36.090  ~~ Event: speechend
  17:02:36.090  ~~ Event: soundend
  17:02:36.090  ~~ Event: audioend
  17:02:36.264  ~~ Event: result
  17:02:36.264  ~~ Event: end */

  sessionStarted () {
    this.recognizer.sessionStarted = (s, e) => {
      this._dispatchEvent('start', null, e, 'sessionStarted');

      this._dispatchEvent('audiostart', null, null, 'sessionStarted');
      this._dispatchEvent('soundstart');
      this._dispatchEvent('speechstart');

      this.started = true;
    };
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

      this._dispatchResultEvent(e, false, 'recognizing'); // Dispatch, or not ??

      // this._setSendBox(this.getInterimText(), true);
    };
  }

  recognized (callbackFn = null) {
    this.recognizer.recognized = (s, e) => {
      const TEXT = e.result.text;
      const nReason = e.result.reason;
      const strReason = ResultReason[nReason] || 'Unknown';
      const res = JSON.parse(e.privResult.privJson);
      const source = `recognized.${strReason}.${res.RecognitionStatus}`;

      const STATUS_REGEX = new RegExp(this.OPT.stopStatusRegex);

      if (nReason === ResultReason.NoMatch && STATUS_REGEX.test(res.RecognitionStatus)) {
        this.stop();
        // setTimeout(() => this.stop(), STOP_TIMEOUT_MS);
        // WAS: recognizer.stopContinuousRecognitionAsync();

        if (!this.finalResultSent && TEXT) {
          this._dispatchResultEvent(e, true, source);
          this.finalResultSent = true;
        }

        // We don't see 'RecognizedSpeech' in dictation mode ?!
      } else if (nReason === ResultReason.RecognizedSpeech) {
        const TEXT = e.getResult().getText();

        console.debug('Recognized event. Reason:', strReason, TEXT, res.RecognitionStatus, res, e, s);

        this.BUFFER.push(TEXT);

        if (!this.finalResultSent) {
          this._dispatchResultEvent(e, true, source);
          this.finalResultSent = true;
        }
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
      this.stop();
      const TEXT = this.getRecognizedText();
      // setTimeout(() => this.stop(), STOP_TIMEOUT_MS); // Was: recognizer.stopContinuousRecognitionAsync();

      console.debug(`\n>> Session stopped event. Result: "${TEXT}"`, e, s);

      if (!this.finalResultSent && TEXT) {
        this._dispatchResultEvent(e, true, 'sessionStopped');
        this.finalResultSent = true;
      }
    };
  }

  getInterimText () {
    return this.interims.join(this.OPT.separator);
  }

  getRecognizedText () {
    const TEXT = this.BUFFER.length ? this.BUFFER.join(this.OPT.separator) : this.getInterimText();

    const result = this.OPT.normalize ? this._toSentence(TEXT) : TEXT;

    return result === '.' ? '' : result;
  }

  getConfiguration () {
    return this.OPT;
  }

  // https://stackoverflow.com/questions/19089442/convert-string-to-sentence-case-in-javascript#
  _toSentence (text) {
    const sentence = text.replace(/^(\w)/, match => match.toUpperCase());

    return `${sentence}.`;
  }

  // ----------------------------------------------------
  // Event and error dispatchers.

  async _dispatchEvent (eventName, data = null, recognizerEvent = null, source = null) {
    let event;

    // console.debug('_dispatchEvent:', arguments);

    if (eventName === 'error') {
      const { error } = data;
      event = new ErrorEvent('error', { error, message: error && (error.stack || error.message), data });
    } else {
      event = new SpeechRecognitionEvent(eventName, data);
    }

    if (recognizerEvent || source) {
      event.data = {
        recognizerEvent, source
      };
    }

    // console.debug('_dispatchEvent 2:', event);

    try {
      this.dispatchEvent(event);

      const onEvent = `on${eventName}`;
      if (this[onEvent] && typeof this[onEvent] === 'function') {
        await this[onEvent](event);
      }
    } catch (err) { console.error('ERROR?', err, this); }

    console.debug('Recognition event fired:', eventName, event);
  }

  _dispatchResultEvent (origEvent, isFinal, source) {
    const transcript = isFinal ? this.getRecognizedText() : this.getInterimText();
    const data = {
      resultIndex: 0,
      results: getWebSpeechRecognitionResultList(transcript, isFinal) // [[{ transcript, confidence: null }]],
    };

    // this._stopDictate(isFinal);
    // setTimeout(() =>
    // this._setSendBox(transcript, isFinal);
    // , 10); // Was: 500
    // this._submitSendBox(transcript, isFinal);

    if (isFinal && transcript !== '.') {
      // Hack: just mock these events?
      this._dispatchEvent('speechend', null, null, '_dispatchResultEvent');
      this._dispatchEvent('soundend');
      this._dispatchEvent('audioend');
    }

    this._dispatchEvent('result', data, origEvent, source);

    if (isFinal && transcript !== '.') {
      this._dispatchEvent('end', null, null, '_dispatchResultEvent');
    }
  }

  // NOT used!
  /* _stopDictate (isFinal) {
    if (isFinal) {
      const ACTION = {
        type: 'WEB_CHAT/STOP_DICTATE'
      };

      const event = new Event(BOT_DISPATCH_EVENT);
      event.data = ACTION;
      window.dispatchEvent(event);

      console.debug('DICT. stopDictate:', ACTION);
    }
  }

  _setSendBox (transcript, isFinal) {
    if (isFinal) {
      const ACTION = {
        type: 'WEB_CHAT/SET_SEND_BOX',
        payload: { text: transcript }
      };

      const event = new Event(BOT_DISPATCH_EVENT);
      event.data = ACTION;
      window.dispatchEvent(event);

      console.debug('DICT. setSendBox:', ACTION);
    }
  }

  // https://github.com/microsoft/BotFramework-WebChat/blob/master/packages/core/src/actions/submitSendBox.js
  // https://github.com/microsoft/BotFramework-WebChat/blob/v4.10.1/packages/component/src/Dictation.js#L54
  _submitSendBox (transcript, isFinal, confidence = DEFAULT_CONFIDENCE) {
    if (isFinal) { // privDispatche &&
      const ACTION = {
        type: 'WEB_CHAT/SUBMIT_SEND_BOX',
        payload: {
          method: 'speech',
          channelData: {
            speech: { alternatives: [{ confidence, transcript }] }
          }
        }
      };

      const event = new Event(BOT_DISPATCH_EVENT);
      event.data = ACTION;
      // setTimeout(() =>
      window.dispatchEvent(event);
      // , 500);

      /* const $INPUT = document.querySelector('[ data-id="webchat-sendbox-input" ]');
      if ($INPUT) { $INPUT.textContent = transcript; } *-/

      console.warn('>> DICT. submitSendBox:', ACTION); // Was: , $INPUT)
    } else {
      console.debug('DICT. Not submitSendbox');
    }
  } */

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
