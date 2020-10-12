/**
 * A demo application of the `DictationRecognizer`.
 *
 * @author NDF, 09-October-2020.
 */

import {
  DictationRecognizer, DEFAULTS as DEF,
  AUDIO_SOURCE_ERROR_EVENT
} from './dictation-recognizer.js';

const OPT = {
  key: param(/[?&]key=(\w+)/, '__EDIT_ME__'),
  region: param(/region=(\w+)/, 'westeurope'),
  lang: param(/lang=([\w-]+)/, 'en-GB'),
  mode: param(/mode=(conversation|dictation)/, DEF.mode),
  initialSilenceTimeoutMs: param(/initialSilenceTimeoutMs=(\d+)/, 5 * 1000),
  endSilenceTimeoutMs: param(/endSilenceTimeoutMs=(\d+)/, 5 * 1000),
  audioLogging: param(/audioLogging=(enable|true)/i, false),
  format: param(/format=(simple|detailed)/, DEF.format),
  stopStatusRegex: DEF.stopStatusRegex,

  separator: ' '
};

const REC_START_BUTTON = document.querySelector('#recognizer-start-button');
const REC_STOP_BUTTON = document.querySelector('#recognizer-stop-button');

const SDK_SCRIPT = document.querySelector('script[ src *= ".speech.sdk." ]');

const LOG = document.querySelector('#log');
const RESULT = document.querySelector('#result');
const PRE_OPT = document.querySelector('#options');

const recognizer = new DictationRecognizer();

recognizer.initialize(OPT);

PRE_OPT.textContent = 'Options: ' + JSON.stringify(OPT, null, 2); // Was: '\t'

// Need to call each of 'recognizing', 'recognized' and 'sessionStopped' !

recognizer.recognizing((e, TEXT) => {
  RESULT.textContent = TEXT; // Or: RESULT.value!
  LOG.textContent += `Recognizing := ${TEXT}\n`;

  onRecognitionStart();
});

recognizer.recognized((e, TEXT, status) => {
  console.warn('>> Recognized:', e, TEXT, status);

  // if (TEXT) {
  RESULT.value = recognizer.getRecognizedText();
  LOG.textContent += `>Recognized := ${recognizer.getRecognizedText()} (${status})\n`;
  // }
});

recognizer.sessionStopped((e, TEXT) => {
  RESULT.value = TEXT;
  // Was: RESULT.innerHTML = `Result :~ <q>${TEXT}</q>`;
  LOG.textContent += '>Session end.\n';

  onRecognitionStop();
});

// ----------------------------------------------------
// Button events.

REC_START_BUTTON.addEventListener('click', async (ev) => {
  ev.preventDefault();
  onButtonStart();

  console.debug('Recognizer start button clicked');

  recognizer.startRecognition(() => {});

  // setTimeout(() => enumMediaDevices(), 5000);
});

REC_STOP_BUTTON.addEventListener('click', ev => {
  ev.preventDefault();

  console.debug('Recognizer stop button clicked');

  recognizer.stopRecognition(() => onRecognitionStop());
});

window.addEventListener(AUDIO_SOURCE_ERROR_EVENT, ev => {
  console.error('>>>> ERROR:', ev.detail.event.error, ev);

  onRecognitionStop();

  document.body.classList.add('recognizer-error');
  document.body.setAttribute('data-error', ev.detail.event.error);

  if (ev.detail.micNotAllowed) {
    LOG.textContent = '> Warning: microphone blocked.';
  }
});

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
