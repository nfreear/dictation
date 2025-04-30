/**
 * A demo application of the dictation-mode speech recognizer.
 *
 * @license MIT.
 * @copyright © 2020 Nick Freear.
 * @author Nick Freear, 09-October-2020.
 */

// @ts-check

import {
  createAdaptiveRecognizerPonyfill, getAdaptiveRecognizerConfig, fireMockActionsEvent
} from 'adaptive-speech-recog';
import { webApiSpeechRecogDemo } from 'web-speech-recog';

const USE_WEB_API = param(/webapi=(true)/);

const FORM = document.querySelector('#exampleAppForm');
const FORM_EL = FORM.elements;

export default function exampleApp () {
  console.debug('Form:', FORM_EL, FORM);

  console.debug('SpeechSDK:', window.SpeechSDK);

  if (USE_WEB_API) {
    webApiSpeechRecogDemo();
  } else {
    runExampleApp();
  }
}

export function runExampleApp () {
  const options = getAdaptiveRecognizerConfig(); // WAS: getDictationRecognizerConfig();

  if (!options.subscriptionKey || /_/.test(options.subscriptionKey)) {
    document.body.className += 'error config-error';
    updateLog('ERROR: Expecting a URL parameter `?key=AZURE_SPEECH_SUBSCRIPTION_KEY`.');
    throw new Error('ERROR: Expecting a URL parameter `?key=AZURE_SPEECH_SUBSCRIPTION_KEY`.');
  }

  const ponyfill = createAdaptiveRecognizerPonyfill(options); // WAS: createDictationRecognizerPonyfill(options);

  const recognizer = new ponyfill.SpeechRecognition();

  console.debug('Ponyfill:', ponyfill);

  recognizer.getConfiguration().then(OPT => {
    FORM_EL.options.textContent = 'Options: ' + JSON.stringify(OPT, null, 2); // Was: '\t';

    if (OPT.actionPhrasesEnable) {
      const actionList = fireMockActionsEvent();

      FORM_EL.actions.value = `Suggested actions: <q>${actionList.join('</q>, <q>')}</q>`;
    }

    FORM_EL.sdkVersion.value = `Speech SDK ${OPT.sdkVersion}`;
  });

  // recognizer.addEventListener('result', ev => console.warn('Event: result.', ev));

  recognizer.onresult = (ev) => {
    const firstResult = ev.results[0];
    const TEXT = firstResult[0].transcript;
    // Was: const TEXT = ev._data.results[0][0].transcript;
    const confidence = firstResult[0].confidence;
    const isFinal = firstResult.isFinal;
    const SOURCE = ev.data.source;

    console.warn('Result event:', confidence, ev);

    FORM_EL.result.value = TEXT; // Or: RESULT.value!
    updateLog(`Result := ${TEXT} (${SOURCE})`);

    if (isFinal) {
      onRecognitionStop();
    } else {
      onRecognitionStart();
    }
  };

  recognizer.onend = (ev) => {
    console.warn('End event:', ev);
    updateLog('> End.');

    onRecognitionStop();
  };

  recognizer.onstart = (ev) => {
    console.debug('Start event:', ev);
    updateLog('> Start');
  };

  recognizer.onerror = (ev) => {
    const { error } = ev.data;

    console.error('>> ERROR:', error, ev);

    onRecognitionStop();

    document.body.classList.add('recognizer-error');
    document.body.setAttribute('data-error', error);

    if (/microphone initialization: NotAllowedError/.test(error)) {
      updateLog('> Warning: microphone blocked.');
    }
  };

  // ----------------------------------------------------
  // Button events.

  FORM.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    onButtonStart();

    console.debug('Recognizer start button clicked');

    recognizer.start();

    // setTimeout(() => enumMediaDevices(), 5000);
  });

  FORM.addEventListener('reset', (ev) => {
    ev.preventDefault();

    console.debug('Recognizer stop button clicked');

    recognizer.stop(() => onRecognitionStop());
  });

  function updateLog (value) {
    FORM_EL.log.value += `${value}\n`;
  }
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
  FORM_EL.startButton.disabled = true;
  FORM_EL.stopButton.disabled = false;
  FORM_EL.stopButton.focus();
  /* REC_START_BUTTON.disabled = true;
  REC_STOP_BUTTON.disabled = false;
  REC_STOP_BUTTON.focus(); */
}

function onRecognitionStart () {
  document.body.classList.add('recognizer-started');
  document.body.classList.remove('recognizer-stopped');
}

function onRecognitionStop () {
  FORM_EL.stopButton.disabled = true;
  FORM_EL.startButton.disbled = false;
  FORM_EL.startButton.focus();
  /* REC_STOP_BUTTON.disabled = true;
  REC_START_BUTTON.disabled = false;
  REC_START_BUTTON.focus(); */

  document.body.classList.add('recognizer-stopped');
  document.body.classList.remove('recognizer-started');

  console.warn('onRecognitionStop:', document.body, document.body.classList);
}

// ----------------------------------------------------
// Error handling ??

/* SDK_SCRIPT.addEventListener('error', ev => {
  console.error('SDK error:', ev);
}); */

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
