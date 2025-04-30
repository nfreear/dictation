/**
 * The API.
 *
 * @license MIT.
 * @copyright © 2020 Nick Freear.
 */

import { createDictationRecognizerPonyfill, DEFAULTS } from './src/createDictationRecognizerPonyfill.js';

import { getDictationRecognizerConfig, EVENT_INCOMING_ACT } from './src/config.DIST.js';

export { ActionPhraseRecognizer } from './src/actionPhraseRecognizer.js';

export const createAdaptiveRecognizerPonyfill = createDictationRecognizerPonyfill;
export const getAdaptiveRecognizerConfig = getDictationRecognizerConfig;

export { createDictationRecognizerPonyfill, getDictationRecognizerConfig, DEFAULTS, EVENT_INCOMING_ACT };

export default createAdaptiveRecognizerPonyfill;

/** @DEPRECATED */
// export { SpeechRecognition, setDictationRecognizerConfig } from './dictation-recognizer.js';
