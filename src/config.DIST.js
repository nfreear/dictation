/**
 * Microsoft speech service configuration
 *
 * 1. Copy and rename this file to: "directline-config.js" (!)
 * 2. Add your speech subscription key below.
 * 3. Edit the 'region' to match the subscription key.
 *
 * @WARNING Edit the other settings at your own risk!
 *
 * @see https://github.com/nfreear/dictation/blob/main/src/createDictationRecognizerPonyfill.js#L42-L57
 */

// Refer to 'DEFAULTS' :~ ./src/createDictationRecognizerPonyfill.js#L42-L57
export function getDictationRecognizerConfig () {
  return {
    subscriptionKey: param(/[?&]key=(\w+)/, '__EDIT_ME__'), // << Add your subscription key <<
    region: param(/region=(\w+)/, 'westeurope'),
    lang: param(/lang=([\w-]+)/, 'en-GB')
    /*
    format: 'detailed', // Was: OutputFormat.Detailed,
    mode: 'dictation',
    initialSilenceTimeoutMs: param(/initialSilenceTimeoutMs=(\d+)/, 5 * 1000),
    endSilenceTimeoutMs: param(/endSilenceTimeoutMs=(\d+)/, 5 * 1000),
    audioLogging: false,
    stopStatusRegex: '(NOT__EndOfDictation|InitialSilenceTimeout)', // NOT_ to disable!
    normalize: true, // Text normalization.
    separator: ' ' // A space.
    */
  };
}

function param (regex, def = null) {
  const matches = window.location.href.match(regex);
  return matches ? matches[1] : def;
}
