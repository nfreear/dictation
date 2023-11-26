/**
 * The API.
 *
 * @license MIT.
 * @copyright © 2020 Nick Freear.
 */

export { createDictationRecognizerPonyfill, DEFAULTS } from './createDictationRecognizerPonyfill.js';

export { getDictationRecognizerConfig } from './config.DIST.js';

export { ActionPhraseRecognizer } from './actionPhraseRecognizer.js';

export { fireMockActionsEvent } from '../test/fireMockActionsEvent.js';

/** @DEPRECATED */
// export { SpeechRecognition, setDictationRecognizerConfig } from './dictation-recognizer.js';
