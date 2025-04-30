/**
 * @version 1.34.0
 */

import 'https://unpkg.com/microsoft-cognitiveservices-speech-sdk@1.34.0/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle-min.js';
// import 'ms-cognitive-speech-sdk';

const {
  AudioConfig, MicAudioSource,
  SpeechConfig, SpeechRecognizer, ResultReason, CancellationReason, OutputFormat
} = window.SpeechSDK;

export {
  AudioConfig, MicAudioSource,
  SpeechConfig, SpeechRecognizer, ResultReason, CancellationReason, OutputFormat
};
