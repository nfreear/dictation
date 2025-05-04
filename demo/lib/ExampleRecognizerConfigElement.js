// Import for side-effects.
import 'MyElements';

const { customElements, HTMLElement } = window;

/**
 * Update and store the configuration for the example recognizer app.
 */
export class ExampleRecognizerConfigElement extends HTMLElement {
  get _form () { return this.querySelector('form'); }
  get _elements () { return this._form.elements; }
  get _showButton () { return this._elements.showButton; }
  get _storageElements () { return this.querySelectorAll('my-local-storage'); }

  connectedCallback () {
    console.assert(this._elements.length === 4, '<form>.elements - Expecting a different number!');
    console.assert(this._storageElements.length === 2, '<my-local-storage> - Expecting a different number!');

    this._initializeValuesFromUrl();

    this._form.addEventListener('submit', (ev) => this._onSubmitEvent(ev));
    this._showButton.addEventListener('click', (ev) => this._onShowButtonClickEvent(ev));

    console.debug('example-recognizer-config:', this._elements, [this]);
  }

  _onSubmitEvent (ev) {
    ev.preventDefault();

    this._storageElements.forEach((elem) => elem.store());

    console.debug('submit:', ev.target.elements, ev);
  }

  _onShowButtonClickEvent (ev) {
    ev.preventDefault();
    const pressed = this._showButton.getAttribute('aria-pressed') === 'true';
    this._showButton.setAttribute('aria-pressed', !pressed);
    this._elements.key.type = pressed ? 'password' : 'text';

    console.debug('showButton - click:', pressed, ev);
  }

  _param (regex, def = null) {
    const matches = window.location.href.match(regex);
    return matches ? matches[1] : def;
  }

  _initializeValuesFromUrl () {
    const key = this._param(/key=(\w+)/);
    const region = this._param(/region=([a-z]+)/);

    if (key) {
      this._elements.key.value = key;
    }
    if (region) {
      this._elements.region.value = region;
    }
  }
}

customElements.define('example-recognizer-config', ExampleRecognizerConfigElement);
