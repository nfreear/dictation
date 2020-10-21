/**
 * A demo application of the `DictationRecognizer`.
 *
 * @author NDF, 09-October-2020.
 */

import { getDictationRecognizerConfig } from './config.DIST.js';
// Was: import { getDictationRecognizerConfig } from './directline-config.js';
import { createDictationRecognizerPonyfill } from './createDictationRecognizerPonyfill.js';
// import { SpeechRecognition, setDictationRecognizerConfig } from './dictation-recognizer.js';
import { webApiSpeechRecogDemo } from './web-api-speech-recog.js';

const USE_WEB_API = param(/webapi=(true)/);

/* const OPT = {
  key: param(/[?&]key=(\w+)/, '__EDIT_ME__'),
  region: param(/region=(\w+)/, 'westeurope'),
  lang: param(/lang=([\w-]+)/, 'en-GB'),
  mode: param(/mode=(conversation|dictation)/, DEF.mode),
  initialSilenceTimeoutMs: param(/initialSilenceTimeoutMs=(\d+)/, 5 * 1000),
  endSilenceTimeoutMs: param(/endSilenceTimeoutMs=(\d+)/, 5 * 1000),
  audioLogging: param(/audioLogging=(enable|true)/i, false),
  format: param(/format=(simple|detailed)/, DEF.format),
  stopStatusRegex: DEF.stopStatusRegex,
  normalize: true,

  separator: ' '
}; */

const REC_START_BUTTON = document.querySelector('#recognizer-start-button');
const REC_STOP_BUTTON = document.querySelector('#recognizer-stop-button');

const SDK_SCRIPT = document.querySelector('script[ src *= ".speech.sdk." ]');

const LOG = document.querySelector('#log');
const RESULT = document.querySelector('#result');
const PRE_OPT = document.querySelector('#options');

if (USE_WEB_API) {
  webApiSpeechRecogDemo();
} else {
  exampleApp();
}

export function exampleApp () {
  const options = getDictationRecognizerConfig();

  if (!options.key || /_/.test(options.key)) {
    document.body.className += 'error config-error';
    LOG.textContent = 'ERROR: Expecting a URL parameter `?key=AZURE_SPEECH_SUBSCRIPTION_KEY`.';
    throw new Error('ERROR: Expecting a URL parameter `?key=AZURE_SPEECH_SUBSCRIPTION_KEY`.');
  }

  const ponyfill = createDictationRecognizerPonyfill(options);

  const recognizer = new ponyfill.SpeechRecognition();

  // setDictationRecognizerConfig(options);
  // const recognizer = new SpeechRecognition();
  // const recognizer = new DictationRecognizer();

  // Was: recognizer.initialize(OPT);
  // const OPT = ponyfill.getConfiguration();

  recognizer.getConfiguration().then(OPT => {
    PRE_OPT.textContent = 'Options: ' + JSON.stringify(OPT, null, 2); // Was: '\t';
  });

  // recognizer.addEventListener('result', ev => console.warn('Event: result.', ev));

  recognizer.onresult = (ev) => {
    const TEXT = ev.results[0][0].transcript;
    // Was: const TEXT = ev._data.results[0][0].transcript;
    const isFinal = ev.results[0].isFinal;
    const SOURCE = ev.data.source;

    console.warn('Result event:', ev);

    RESULT.textContent = TEXT; // Or: RESULT.value!
    LOG.textContent += `Result := ${TEXT} (${SOURCE})\n`;

    if (isFinal) {
      onRecognitionStop();
    } else {
      onRecognitionStart();
    }
  };

  recognizer.onend = (ev) => {
    console.warn('End event:', ev);
    LOG.textContent += '> End.\n';

    onRecognitionStop();
  };

  recognizer.onstart = ev => {
    console.debug('Start event:', ev);
    LOG.textContent += '> Start\n';
  };

  recognizer.onerror = ev => {
    const ERROR = ev.data.error;

    console.error('>> ERROR:', ERROR, ev);

    onRecognitionStop();

    document.body.classList.add('recognizer-error');
    document.body.setAttribute('data-error', ERROR);

    if (/microphone initialization: NotAllowedError/.test(ERROR)) {
      LOG.textContent = '> Warning: microphone blocked.';
    }
  };

  // ----------------------------------------------------
  // Button events.

  REC_START_BUTTON.addEventListener('click', async (ev) => {
    ev.preventDefault();
    onButtonStart();

    console.debug('Recognizer start button clicked');

    recognizer.start();

    // setTimeout(() => enumMediaDevices(), 5000);
  });

  REC_STOP_BUTTON.addEventListener('click', ev => {
    ev.preventDefault();

    console.debug('Recognizer stop button clicked');

    recognizer.stop(() => onRecognitionStop());
  });
}

// ----------------------------------------------------

/* window.addEventListener(AUDIO_SOURCE_ERROR_EVENT, ev => {
  console.error('>>>> ERROR:', ev.detail.event.error, ev);

  onRecognitionStop();

  document.body.classList.add('recognizer-error');
  document.body.setAttribute('data-error', ev.detail.event.error);

  if (ev.detail.micNotAllowed) {
    LOG.textContent = '> Warning: microphone blocked.';
  }
}); */

function onButtonStart () {
  REC_START_BUTTON.disabled = true;
  REC_STOP_BUTTON.disabled = false;
  REC_STOP_BUTTON.focus();
}

function onRecognitionStart () {
  document.body.classList.add('recognizer-started');
  document.body.classList.remove('recognizer-stopped');
}

function onRecognitionStop () {
  REC_STOP_BUTTON.disabled = true;
  REC_START_BUTTON.disabled = false;
  REC_START_BUTTON.focus();

  document.body.classList.add('recognizer-stopped');
  document.body.classList.remove('recognizer-started');

  console.warn('onRecognitionStop:', document.body, document.body.classList);
}

// ----------------------------------------------------
// Error handling ??

SDK_SCRIPT.addEventListener('error', ev => {
  console.error('SDK error:', ev);
});

// -----------------------------------------------------

export function enumMediaDevices () {
  navigator.mediaDevices.enumerateDevices()
    .then(function (devices) {
      /* devices.forEach(function(device) {
        console.log(device.kind + ": " + device.label +
              " id = " + device.deviceId);
      }); */
      console.warn('Devices:', devices);
    })
    .catch(err => console.error('ERROR:', err));
}

// ----------------------------------------------------

function param (regex, def = null) {
  const matches = window.location.href.match(regex);
  return matches ? matches[1] : def;
}
