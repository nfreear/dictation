/**
 * Export `SpeechSDK` globals.
 * @see https://www.npmjs.com/package/microsoft-cognitiveservices-speech-sdk
 */
// import 'ms-cognitive-speech-sdk'

console.assert(window.SpeechSDK, '"SpeechSDK" global is missing!');

const {
  AudioConfig, MicAudioSource,
  SpeechConfig, SpeechRecognizer, ResultReason, CancellationReason, OutputFormat
} = window.SpeechSDK;

export {
  AudioConfig, MicAudioSource,
  SpeechConfig, SpeechRecognizer, ResultReason, CancellationReason, OutputFormat
};
