/**
 * Example of declaring a class INSIDE a function declaration!
 *
 * Definition of function 'createDictationRecognizerPonyfill()'
 *
 * @author NDF, 17-Oct-2020.
 *
 * @see https://wicg.github.io/speech-api/#speechreco-section
 * @see https://github.com/compulim/web-speech-cognitive-services/blob/master/packages/component/src/SpeechServices/SpeechToText/createSpeechRecognitionPonyfill.js
 */

// import { AudioConfig, SpeechConfig, OutputFormat, ResultReason, SpeechRecognizer } from 'SpeechSDK'; // window.SpeechSdk;

const {
  SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason, CancellationReason, OutputFormat
} = window.SpeechSDK;

const Event = window.Event;
const ErrorEvent = window.ErrorEvent;
const EventTarget = window.EventTarget;

const DUMMY_CONFIDENCE = 0.951111;
const CUSTOM_EVENT = '_custom';

export class SpeechGrammarList {} // window.SpeechGrammarList

export class SpeechRecognitionEvent extends Event {
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

export const DEFAULTS = {
  key: null, // Azure speech subscription key.
  region: 'westeurope',
  lang: 'en-US',
  mode: 'dictation',
  initialSilenceTimeoutMs: 5 * 1000,
  endSilenceTimeoutMs: 5 * 1000,
  // audioLogging: false,
  format: 'detailed',
  stopStatusRegex: '(NOT__EndOfDictation|InitialSilenceTimeout)',
  normalize: true, // Text normalization.
  separator: ' ',

  url: null, // Derived!
  urlObj: null
};

function serializeRecognitionResult ({ duration, errorDetails, json, offset, properties, reason, resultId, text }) {
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

// https://github.com/compulim/web-speech-cognitive-services/blob/master/packages/component/src/SpeechServices/SpeechToText/cognitiveServiceEventResultToWebSpeechRecognitionResultList.js
export function getWebSpeechRecognitionResultList (transcript, isFinal = true, confidence = DUMMY_CONFIDENCE) {
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

// https://stackoverflow.com/questions/19089442/convert-string-to-sentence-case-in-javascript#
function toSentence (text) {
  const sentence = text.replace(/^(\w)/, match => match.toUpperCase());

  return `${sentence}.`;
}

// ------------------------------------------------------------------

function createSpeechRecognitionFromRecognizer (createRecognizer, options) {
  // ...

  class SpeechRecognition extends EventTarget {
    constructor () {
      super();

      this._continuous = false;
      this._interimResults = false;
      this._lang =
        typeof window !== 'undefined'
          ? window.document.documentElement.getAttribute('lang') || window.navigator.language
          : 'en-US';
      this._grammars = null; // new SpeechGrammarList();
      this._maxAlternatives = 1;

      const PRIV = this.priv = {
        OPT: null,
        recognizer: null,
        // ..!
        started: null,
        finalResultSent: null,
        lastOffset: null,
        interims: null,
        BUFFER: null
      };

      PRIV.reset = () => {
        PRIV.started = false;
        PRIV.finalResultSent = false;
        PRIV.lastOffset = null;
        PRIV.interims = []; // Hypotheses.
        PRIV.BUFFER = []; // Final text.

        console.debug('PRIV.reset()', this);
      };

      PRIV.getInterimText = () => PRIV.interims.join(PRIV.OPT.separator);

      PRIV.getRecognizedText = () => {
        const TEXT = PRIV.BUFFER.length ? PRIV.BUFFER.join(PRIV.OPT.separator) : PRIV.getInterimText();

        const result = this._config.normalize ? toSentence(TEXT) : TEXT;

        return result === '.' ? '' : result;
      };
    }

    /** 'this.priv.initialize()' is defined inside 'getConfiguration' !
    */
    async getConfiguration () {
      const PRIV = this.priv;

      const promise = new Promise((resolve, reject) => {
        PRIV.initialize = async () => {
          if (!PRIV.recognizer) {
            const { recognizer, OPT } = await createRecognizer(options);

            PRIV.OPT = OPT;
            PRIV.recognizer = recognizer;

            console.debug(this.constructor.name, '(DICT). Initialize:', this);
          }
          /* this.priv.OPT = OPT;
          this.priv.recognizer = recognizer;
          // this.priv.reset(); */

          resolve(PRIV.OPT);

          return PRIV.recognizer;
        };
      });
      return promise;
    }

    /* get _config () {
      return this.priv.OPT;
    } */

    get continuous () {
      return this._continuous;
    }

    set continuous (value) {
      this._continuous = value;
    }

    get grammars () {
      return this._grammars;
    }

    set grammars (value) {
      if (value instanceof SpeechGrammarList) {
        this._grammars = value;
      } else {
        throw new Error('The provided value is not of type \'SpeechGrammarList\'');
      }
    }

    get interimResults () {
      return this._interimResults;
    }

    set interimResults (value) {
      this._interimResults = value;
    }

    get maxAlternatives () {
      return this._maxAlternatives;
    }

    set maxAlternatives (value) {
      this._maxAlternatives = value;
    }

    get lang () {
      return this._lang;
    }

    set lang (value) {
      this._lang = value;
    }

    abort () {
      console.warn('Not implemented: \'abort()\'');
    }

    start () {
      this._startOnce().catch(error => {
        this._dispatchEvent('error', { error }, 'start');
        // this._dispatchEvent(new ErrorEvent('error', { error: err, message: err && (err.stack || err.message) }));
      });
    }

    // Stop continuous speech recognition.
    stop () {
      if (this.priv.started) {
        this.priv.recognizer.stopContinuousRecognitionAsync(async () => {
          // Hack: just mock these events?
          this._dispatchEvent('speechend', null, null, 'stop');
          this._dispatchEvent('soundend');
          this._dispatchEvent('audioend');

          this._dispatchEvent('end', null, null, 'stop'); // Event is not 'stop' !!

          this.priv.started = false;
        },
        (error) => this._dispatchEvent('error', { error }, 'stop'));
      }
    }

    // ------------------------------------------------------------------

    async _startOnce () {
      const recognizer = await this.priv.initialize();

      /* if (!this.priv.recognizer) {
        // TODO: [P2] Should check if recognition is active, we should not start recognition twice
        const { recognizer, OPT } = await createRecognizer(options);

        this.priv.initialize(recognizer, OPT);
      } */
      this.priv.reset();

      try {
        // { errorDetails, offset, reason, sessionId }
        recognizer.canceled = (_sender, recEvent) => {
          const { reason } = recEvent;
          if (reason === CancellationReason.Error) {
            console.error('CANCELED: Error.', recEvent);
            console.debug('CANCELED: Did you update the subscription info?');

            this._dispatchEvent('error', recEvent, null, 'canceled');
          } else {
            this._dispatchEvent(CUSTOM_EVENT, null, recEvent, 'canceled');
          }
        };

        // { offset, result, sessionId }
        recognizer.recognized = (_s, recEvent) => {
          const PRIV = this.priv;
          const { result } = recEvent;
          const TEXT = result.text || '<>';
          const RES = serializeRecognitionResult(result);
          const nReason = result.reason;
          const strReason = ResultReason[result.reason] || 'Unknown';
          // const res = JSON.parse(e.privResult.privJson);
          const recogStatus = RES.json.RecognitionStatus;
          const source = `recognized.${strReason}.${recogStatus}`;

          const STATUS_REGEX = new RegExp(PRIV.OPT.stopStatusRegex);
          const hasStopStatus = STATUS_REGEX.test(recogStatus);

          console.debug(`Recognized event. Status: ${source}, "${TEXT}"`, hasStopStatus, RES);

          if (nReason === ResultReason.NoMatch && hasStopStatus) {
            this.stop();

            if (!PRIV.finalResultSent && TEXT) {
              this._dispatchResultEvent(recEvent, true, source);
              PRIV.finalResultSent = true;
            }

            // We don't see 'RecognizedSpeech' in dictation mode ?!
          } else if (nReason === ResultReason.RecognizedSpeech) {
            // console.debug('Recognized event. Reason:', strReason, TEXT, recogStatus, RES);

            PRIV.BUFFER.push(TEXT);

            /** @NOTE We purposefully "downgrade" a 'recognized' result to an interim result !!
            */
            this._dispatchResultEvent(recEvent, false, source);

            /* if (!PRIV.finalResultSent) {
              this._dispatchResultEvent(recEvent, true, source);
              PRIV.finalResultSent = true;
            */
          } else {
            // console.debug('Recognized event. Reason:', strReason, recogStatus, RES);

            this._dispatchEvent(CUSTOM_EVENT, null, recEvent, source);
          }
        }; // End: recognized => {}.

        // { offset, result, sessionId }
        recognizer.recognizing = (_s, recEvent) => {
          const PRIV = this.priv;
          const { result } = recEvent;
          const TEXT = result.text;
          const RES = serializeRecognitionResult(result);

          console.debug(`RECOGNIZING: Text="${TEXT}"`, RES);

          const IDX = PRIV.interims.length - 1;
          const SEARCH = `${PRIV.interims[IDX]}`; // Space after / No space after ??
          const contains = IDX >= 0 && TEXT.indexOf(SEARCH) === 0;
          const offsetsMatch = result.offset === PRIV.lastOffset;

          if (contains || offsetsMatch) {
            // Replace the entry in the buffer!
            PRIV.interims[IDX] = TEXT;
          } else {
            PRIV.interims.push(TEXT);
          }

          PRIV.lastOffset = result.offset;

          this._dispatchResultEvent(recEvent, false, 'recognizing');
        }; // End: recognizing => {}

        recognizer.sessionStarted = (_s, { sessionId }) => {
          this._dispatchEvent('start', null, { sessionId }, 'sessionStarted');

          this._dispatchEvent('audiostart', null, null, 'sessionStarted');
          this._dispatchEvent('soundstart');
          this._dispatchEvent('speechstart');

          this.priv.started = true;
        };

        recognizer.sessionStopped = (_s, recEvent) => {
          const PRIV = this.priv;
          // ( "sessionStopped" is never fired, probably because we are using startContinuousRecognitionAsync instead of recognizeOnceAsync.)
          this.stop();

          const TEXT = PRIV.getRecognizedText();

          console.debug(`\n>> Session stopped event. Result: "${TEXT}"`, recEvent, _s);

          if (!PRIV.finalResultSent && TEXT) {
            this._dispatchResultEvent(recEvent, true, 'sessionStopped');
            PRIV.finalResultSent = true;
          }
        };

        /* recognizer.speechStartDetected = (_s, { offset, sessionId }) => {
          console.debug('DICT. speechStartDetected:', sessionId);
        };

        recognizer.speechEndDetected = (_s, { sessionId }) => {
          // "speechEndDetected" is never fired, probably because we are using startContinuousRecognitionAsync instead of recognizeOnceAsync.
          // Update: "speechEndDetected" is fired for DLSpeech.listenOnceAsync()
          console.debug('DICT. speechEndDetected:', sessionId);
        }; */

        // Even though there is no "start" event emitted, we will still emit "end" event
        // This is mainly for "microphone blocked" story.
        // this._dispatchEvent(new SpeechRecognitionEvent('end'));

        // detachAudioConfigEvent();

        recognizer.startContinuousRecognitionAsync(() => {
          // Was: this._dispatchEvent('start', null, null, 'start');

          this.priv.started = true;
        },
        (error) => {
          this._dispatchEvent('error', { error }, null, 'start');
        });
      } catch (err) {
        // Logging out the erorr because Speech SDK would fail silently.
        console.error(err);

        throw err;
      } finally {
        console.debug('DICT. And finally!');
        // unprepare();
        // recognizer.dispose();
      }
    } // End: _startOnce().

    // ------------------------------------------------------------------

    _dispatchEvent (eventName, data = null, recognizerEvent = null, source = null) {
      let event;

      // console.debug('_dispatchEvent:', arguments);

      if (eventName === 'error') {
        const error = data ? data.error : 'Unknown';
        // const { error } = data;
        event = new ErrorEvent('error', { error, message: error && (error.stack || error.message), data });
        console.error('ERROR:', data, recognizerEvent, source);
      } else {
        event = new SpeechRecognitionEvent(eventName, data);
      }

      if (recognizerEvent || source) {
        event.data = { recognizerEvent, source };
      }

      // console.debug('_dispatchEvent 2:', event);

      try {
        this.dispatchEvent(event);

        const onEvent = `on${eventName}`;
        if (this[onEvent] && typeof this[onEvent] === 'function') {
          this[onEvent](event); // await?
        }
      } catch (err) {
        console.error('ERROR?', err, this);
      }

      console.debug('Recognition event fired:', eventName, event);
    }

    _dispatchResultEvent (origEvent, isFinal, source) {
      const PRIV = this.priv;
      console.debug('_dispatchResultEvent:', origEvent, isFinal, source);

      const transcript = isFinal ? PRIV.getRecognizedText() : PRIV.getInterimText();
      const data = {
        resultIndex: 0,
        results: getWebSpeechRecognitionResultList(transcript, isFinal) // [[{ transcript, confidence: null }]],
      };

      console.debug('_dispatchResultEvent (2):', origEvent, data, source);

      this._dispatchEvent('result', data, origEvent, source);
    }
  } // End: class SpeechRecognition.

  return SpeechRecognition;
}

// ------------------------------------------------------------------

function createCognitiveRecognizer (options) {
  // Extend options with the defaults.
  const OPT = { ...DEFAULTS, ...options };

  // wss://westeurope.stt.speech.microsoft.com/speech/recognition/dictation/cognitiveservices/v1?language=en-GB&format=simple&Ocp-Apim-Subscription-Key=__EDIT_ME__&X-ConnectionId=__X__
  OPT.url = `wss://${OPT.region}.stt.speech.microsoft.com/speech/recognition/${OPT.mode}/cognitiveservices/v1?initialSilenceTimeoutMs=${OPT.initialSilenceTimeoutMs || ''}&endSilenceTimeoutMs=${OPT.endSilenceTimeoutMs || ''}&`;
  OPT.urlObj = new URL(OPT.url);

  const speechConfig = SpeechConfig.fromEndpoint(OPT.urlObj, OPT.key);
  // NOT: const speechConfig = SpeechConfig.fromSubscription(KEY, REGION);

  speechConfig.enableDictation();
  speechConfig.speechRecognitionLanguage = OPT.lang;
  speechConfig.outputFormat = OPT.format === 'detailed' ? OutputFormat.Detailed : OutputFormat.Simple;

  const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
  // WAS: audioConfig.events.attachListener(new MyErrorEventListener()); // TODO: 'this' does NOT work ?!

  const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

  console.debug('createCognitiveRecognizer:', OPT, recognizer);

  return { recognizer, OPT };
}

// ------------------------------------------------------------------

export function createDictationRecognizerPonyfill (options) {
  // const recognizer = createCognitiveRecognizer(options);

  const SpeechRecognition = createSpeechRecognitionFromRecognizer(createCognitiveRecognizer, options);

  return {
    SpeechGrammarList,
    SpeechRecognition
    // getConfiguration: () => _OPT
  };
}

export default createDictationRecognizerPonyfill;
