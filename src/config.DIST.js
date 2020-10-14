/**
 * Microsoft speech service configuration.
 *
 * 1. Copy and rename this file to: "directline-config.js" (!)
 * 2. Add your speech subscription key below.
 * 3. Edit the 'region' as needed.
 *
 * @WARNING Edit the other settings at your own risk!
 */

export function getDictationRecognizerConfig () {
  return {
    key: '__EDIT_ME__', // << Add your subscription key <<
    region: 'westeurope',
    lang: 'en-GB',
    format: 'detailed', // Was: OutputFormat.Detailed,
    mode: 'dictation',
    initialSilenceTimeoutMs: 5 * 1000,
    endSilenceTimeoutMs: 5 * 1000,
    audioLogging: false,
    stopStatusRegex: '(NOT__EndOfDictation|InitialSilenceTimeout)',
    normalize: true,
    separator: ' ' // A space.
  };
}
