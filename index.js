/**
 * The API.
 *
 * @license MIT.
 * @copyright © 2020 Nick Freear.
 */

export { createDictationRecognizerPonyfill, DEFAULTS } from './src/createDictationRecognizerPonyfill.js';

export { getDictationRecognizerConfig } from './src/config.DIST.js';

export { ActionPhraseRecognizer } from './src/actionPhraseRecognizer.js';

export { fireMockActionsEvent } from './test/fireMockActionsEvent.js';

/** @DEPRECATED */
// export { SpeechRecognition, setDictationRecognizerConfig } from './dictation-recognizer.js';
