/**
 * Microsoft speech service configuration (DEFAULTS.)
 *
 * 1. Copy and rename this file to: "directline-config.js" (!)
 * 2. Add your speech subscription key below.
 * 3. Edit the 'region' as needed.
 *
 * @WARNING Edit the other settings at your own risk!
 */

export function getDictationRecognizerConfig () {
  return {
    key: param(/[?&]key=(\w+)/, '__EDIT_ME__'), // << Add your subscription key <<
    region: 'westeurope',
    lang: 'en-GB',
    format: 'detailed', // Was: OutputFormat.Detailed,
    mode: 'dictation',
    initialSilenceTimeoutMs: 5 * 1000,
    endSilenceTimeoutMs: 5 * 1000,
    audioLogging: false,
    stopStatusRegex: '(NOT__EndOfDictation|InitialSilenceTimeout)',
    normalize: true, // Text normalization.
    separator: ' ' // A space.
  };
}

function param (regex, def = null) {
  const matches = window.location.href.match(regex);
  return matches ? matches[1] : def;
}
