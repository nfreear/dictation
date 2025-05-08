// @ts-check

// import 'ms-cognitive-speech-sdk';
// import { createAdaptiveRecognizerPonyfill, getAdaptiveRecognizerConfig } from 'adaptive-speech-recognizer';
import fireMockActionsEvent from 'fireMockActionsEvent';
import webApiSpeechRecogDemo from 'webApiSpeechRecogDemo';

const { customElements, HTMLElement } = window;

/**
 * A demo application of the dictation-mode speech recognizer.
 *
 * @license MIT.
 * @copyright © 2020 Nick Freear.
 * @author Nick Freear, 09-October-2020.
 */
export class ExampleRecognizerAppElement extends HTMLElement {
  get _form () { return this.querySelector('form'); }
  get _elements () { return this._form.elements; }
  get _storageElems () { return this.querySelectorAll('my-local-storage'); }
  get _SpeechSDK () { return window.SpeechSDK; }
  get _sdkVersion () { return this._options.sdkVersion; }
  get _microphoneErrorRegex () { return /microphone initialization: NotAllowedError/; }

  async connectedCallback () {
    console.assert(this._elements.length === 6, '<form>.elements - Expecting a different number!');
    console.assert(this._storageElems.length === 2, '<my-local-storage> - Expecting a different number!');

    this._useWebApi = this._param(/webapi=(true)/);

    if (this._useWebApi) {
      webApiSpeechRecogDemo();
    } else {
      await this._runExampleApp();
    }

    console.debug('example-recognizer-app:', this._elements, [this]);
  }

  async _runExampleApp () {
    await import('ms-cognitive-speech-sdk');
    const { createAdaptiveRecognizerPonyfill, getAdaptiveRecognizerConfig } = await import('adaptive-speech-recognizer');

    const options = getAdaptiveRecognizerConfig(); // WAS: getDictationRecognizerConfig();

    if (!options.subscriptionKey || /_/.test(options.subscriptionKey)) {
      this.dataset.state = 'error';
      this.dataset.errorType = 'config-error';
      this._updateLog('ERROR: Expecting a URL parameter `?key=AZURE_SPEECH_SUBSCRIPTION_KEY`.');
      throw new Error('ERROR: Expecting a URL parameter `?key=AZURE_SPEECH_SUBSCRIPTION_KEY`.');
    }

    this._ponyfill = createAdaptiveRecognizerPonyfill(options); // WAS: createDictationRecognizerPonyfill(options);

    this._recognizer = new this._ponyfill.SpeechRecognition();

    this._recognizer.getConfiguration().then((opt) => this._onConfiguration(opt));
    this._recognizer.onresult = (ev) => this._onresult(ev);
    this._recognizer.onend = (ev) => this._onend(ev);
    this._recognizer.onstart = (ev) => this._onstart(ev);
    this._recognizer.onerror = (ev) => this._onerror(ev);

    this._form.addEventListener('submit', (ev) => this._onFormSubmitEvent(ev));
    this._form.addEventListener('reset', (ev) => this._onFormResetEvent(ev));

    console.debug('Ponyfill:', this._ponyfill);
  }

  /* FORM events.
  */

  _onFormSubmitEvent (ev) {
    ev.preventDefault();
    this._onButtonStart();

    console.debug('Recognizer start button clicked');

    this._recognizer.start();

    // setTimeout(() => enumMediaDevices(), 5000);
  }

  _onFormResetEvent (ev) {
    ev.preventDefault();
    console.debug('Recognizer stop button clicked');

    this._recognizer.stop(() => this._onRecognitionStop());
  }

  /* Recognizer events.
  */

  _onConfiguration (OPT) {
    this._options = OPT;
    this._elements.options.value = 'Options: ' + JSON.stringify(OPT, null, 2); // Was: '\t';

    if (OPT.actionPhrasesEnable) {
      const actionList = fireMockActionsEvent();

      this._elements.actions.value = `Suggested actions: <q>${actionList.join('</q>, <q>')}</q>`;
    }

    this._elements.sdkVersion.value = `Speech SDK ${this._sdkVersion}`;
    this.dataset.speechSdkVersion = this._sdkVersion;

    console.debug('SpeechSDK:', this._sdkVersion, this._SpeechSDK);
  }

  _onresult (ev) {
    const firstResult = ev.results[0];
    // Was: const TEXT = ev._data.results[0][0].transcript;
    const { confidence, transcript } = firstResult[0];
    const { isFinal } = firstResult;
    const { source } = ev.data;

    console.warn('Result event:', confidence, ev);

    this.dataset.confidence = confidence;
    this._elements.result.value = transcript; // Or: RESULT.value!
    this._updateLog(`Result := ${transcript} (${source})`);

    if (isFinal) {
      this._onRecognitionStop();
    } else {
      this.dataset.recognizerState = 'started';
      // Was: this._onRecognitionStart();
    }
  }

  _onend (ev) {
    console.warn('End event:', ev);
    this._updateLog('> End.');

    this._onRecognitionStop();
  }

  _onstart (ev) {
    console.debug('Start event:', ev);
    this._updateLog('> Start');
    this.dataset.recognizerState = 'started';
  }

  _onerror (ev) {
    const { error } = ev.data;

    console.error('>> ERROR:', error, ev);

    this._onRecognitionStop();

    // Was: document.body!
    this.classList.add('recognizer-error');
    this.dataset.recognizerState = 'error';
    this.dataset.errorType = 'recognizer-error';
    this.dataset.errorDetail = error; // to string?

    if (this._microphoneErrorRegex.test(error)) {
      this.dataset.warning = 'microphone-blocked';
      this._updateLog('> Warning: microphone blocked.');
    }
  }

  _onButtonStart () {
    this._elements.startButton.disabled = true;
    this._elements.stopButton.disabled = false;
    this._elements.stopButton.focus();
  }

  _onRecognitionStop () {
    this._elements.stopButton.disabled = true;
    this._elements.startButton.disabled = false;
    this._elements.startButton.focus();

    this.dataset.recognizerState = 'stopped';

    console.warn('onRecognitionStop:', this.dataset);
  }

  _param (regex, def = null) {
    const matches = window.location.href.match(regex);
    return matches ? matches[1] : def;
  }

  _updateLog (value) {
    this._elements.log.value += `${value}\n`;
  }
}

customElements.define('example-recognizer-app', ExampleRecognizerAppElement);

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
