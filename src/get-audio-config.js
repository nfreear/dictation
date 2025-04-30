/**
 * Get an 'AudioConfig' instance -- add support for Safari.
 *
 * @see https://github.com/microsoft/BotFramework-WebChat/blob/master/packages/bundle/src/createCognitiveServicesSpeechServicesPonyfillFactory.js
 * @license (MIT)
 */

import { AudioConfig, MicAudioSource } from './SpeechSDK.js';

// WAS: An ugly (dangerous?) shim for Safari ...!!
/* if (!window.AudioContext && window.webkitAudioContext) {
  window.AudioContext = window.webkitAudioContext;
} */

let audioConfig = null;

export function getAudioConfig (audioInputDeviceId = null) {
  // WORKAROUND: We should prevent AudioContext object from being recreated because they may be blessed and UX-wise expensive to recreate.
  //             In Cognitive Services SDK, if they detect the "end" function is falsy, they will not call "end" but "suspend" instead.
  //             And on next recognition, they will re-use the AudioContext object.
  if (!audioConfig) {
    audioConfig = audioInputDeviceId
      ? AudioConfig.fromMicrophoneInput(audioInputDeviceId)
      : AudioConfig.fromDefaultMicrophoneInput();

    const source = audioConfig.privSource;

    // WORKAROUND: In Speech SDK 1.12.0-1.13.1, it dropped support of macOS/iOS Safari.
    //             This code is adopted from microsoft-cognitiveservices-speech-sdk/src/common.browser/MicAudioSource.ts.
    //             We will not need this code when using Speech SDK 1.14.0 or up.
    // TODO: [P1] #3575 Remove the following lines when bumping to Speech SDK 1.14.0 or higher
    source.createAudioContext = () => {
      if (!!source.privContext) { /* eslint-disable-line no-extra-boolean-cast */
        return;
      }

      const AudioContext = window.AudioContext || window.webkitAudioContext;

      if (typeof AudioContext === 'undefined') {
        throw new Error('Browser does not support Web Audio API (AudioContext/webkitAudioContext is not available).');
      }

      if (navigator.mediaDevices.getSupportedConstraints().sampleRate && MicAudioSource) {
        source.privContext = new AudioContext({ sampleRate: MicAudioSource.AUDIOFORMAT.samplesPerSec });
      } else {
        source.privContext = new AudioContext();
      }
    };

    // This piece of code is adopted from microsoft-cognitiveservices-speech-sdk/common.browser/MicAudioSource.ts.
    // Instead of closing the AudioContext, it will just suspend it. And the next time it is needed, it will be resumed (by the original code).
    source.destroyAudioContext = () => {
      if (!source.privContext) {
        return;
      }

      source.privRecorder.releaseMediaResources(source.privContext);
      source.privContext.state === 'running' && source.privContext.suspend();
    };
  }

  return audioConfig;
}
