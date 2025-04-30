/**
 * Export `SpeechSDK` globals.
 * @see https://www.npmjs.com/package/microsoft-cognitiveservices-speech-sdk
 */
import 'ms-cognitive-speech-sdk';

const {
  AudioConfig, MicAudioSource,
  SpeechConfig, SpeechRecognizer, ResultReason, CancellationReason, OutputFormat
} = window.SpeechSDK;

export {
  AudioConfig, MicAudioSource,
  SpeechConfig, SpeechRecognizer, ResultReason, CancellationReason, OutputFormat
};
