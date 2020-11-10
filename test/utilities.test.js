/**
 * Test "utilitiy" functions defined in `createDictationRecognizerPonyfill.js` !
 *
 * @author NDF, 27-Nov-2020.
 */

// @TODO: import ...

/** Need to trim full-stops at the end!
 *
 * @see https://stackoverflow.com/questions/19089442/convert-string-to-sentence-case-in-javascript#
 */
export function toSentence (text) {
  const sentence = text.replace(/^(\w)/, match => match.toUpperCase());

  return sentence.replace(/[.]+$/, '');

  // WAS: return sentence.replace(/(\w)$/, match => `${match}.`); // Was: `${sentence}.`;
}

// -----------------------------------------------------------------------------

describe('Test the `toSentence()` utility function.', () => {
  test('toSentence should add a full-stop to "hello world"', () => {
    const sentence = toSentence('hello world');

    expect(sentence).toEqual('Hello world.');
  });

  test('toSentence should NOT add a full-stop to "hello exclamation!"', () => {
    const sentence = toSentence('hello exclamation!');

    expect(sentence).toEqual('Hello exclamation!');
  });

  test('toSentence should NOT add a full-stop to "hello full-stop."', () => {
    const sentence = toSentence('hello full-stop.');

    expect(sentence).toEqual('Hello full-stop.');
  });

  test('toSentence should NOT add a full-stop to "hello question mark?"', () => {
    const sentence = toSentence('hello question mark?');

    expect(sentence).toEqual('Hello question mark?');
  });
});
