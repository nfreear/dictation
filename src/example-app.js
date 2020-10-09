/**
 *
 *
 * @author NDF, 09-October-2020.
 */

import { DictationRecognizer, DEFAULTS as DEF } from './dictation-recognizer.js';

const OPT = {
  key:    param(/[?&]key=(\w+)/, '__EDIT_ME__'),
  region: param(/region=(\w+)/, 'westeurope'),
  lang:   param(/lang=([\w-]+)/, 'en-GB'),
  mode:   param(/mode=(conversation|dictation)/, DEF.mode),
  initialSilenceTimeoutMs: param(/initialSilenceTimeoutMs=(\d+)/, 5 * 1000),
  endSilenceTimeoutMs: param(/endSilenceTimeoutMs=(\d+)/, 5 * 1000),
  format: param(/format=(simple|detailed)/, DEF.format),
  separator: ' ',

  appId: '90605e10-09b4-11eb-88f2-25c0a50f0bd0', // Custom command App.
};

const REC_START_BUTTON = document.querySelector('#recognizer-start-button');
const REC_STOP_BUTTON = document.querySelector('#recognizer-stop-button');

const SDK_SCRIPT = document.querySelector('script[ src *= ".speech.sdk." ]');

const LOG = document.querySelector('#log');
const RESULT = document.querySelector('#result');
const PRE_OPT = document.querySelector('#options');

const recognizer = new DictationRecognizer();

recognizer.initialize(OPT);

recognizer.recognizing((e, TEXT) => {
  LOG.textContent += `Recognizing. Text := ${TEXT}\n`;

  document.body.classList.add('recognizer-started');
  document.body.classList.remove('recognizer-stopped');
});

recognizer.sessionStopped((e, BUFFER) => {
  RESULT.innerHTML = `Result :~ <q>${BUFFER.join(OPT.separator)}</q>`;

  document.body.classList.add('recognizer-stopped');
  document.body.classList.remove('recognizer-started');
});

REC_START_BUTTON.addEventListener('click', async (ev) => {
  ev.preventDefault();

  ev.target.disabled = true;
  REC_STOP_BUTTON.disabled = false;

  console.debug('Recognizer start button clicked');

  // recognizer.startContinuousRecognitionAsync();
  recognizer.startRecognition();

  // setTimeout(() => enumMediaDevices(), 5000);
});

REC_STOP_BUTTON.addEventListener('click', ev => {
  ev.preventDefault();
  ev.target.disabled = true;
  REC_START_BUTTON.disabled = false;

  console.debug('Recognizer stop button clicked');

  recognizer.stopRecognition((e) => {
    document.body.classList.add('recognizer-stopped');
    document.body.classList.remove('recognizer-started');
  });
});

// ----------------------------------------------------
// Error handling ??

SDK_SCRIPT.addEventListener('error', ev => {
  console.error('SDK error:', ev);
});

// -----------------------------------------------------

function enumMediaDevices () {
  navigator.mediaDevices.enumerateDevices()
    .then(function(devices) {
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
  return matches ? matches[ 1 ] : def;
}
