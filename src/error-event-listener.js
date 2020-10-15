
const CustomEvent = window.CustomEvent;

export const AUDIO_SOURCE_ERROR_EVENT = 'audioSourceError';

// https://github.com/microsoft/cognitive-services-speech-sdk-js/blob/master/src/common.browser/ConsoleLoggingListener.ts#L6
export class MyErrorEventListener /* implements IEventListener<PlatformEvent> */ {
  onEvent (event) {
    if (event.name.includes('Error')) {
      console.warn('ERROR:', event.error, event);

      // 'AudioSourceErrorEvent'
      if (event.error.includes('microphone initialization: NotAllowedError')) {
        const EV = new CustomEvent(AUDIO_SOURCE_ERROR_EVENT, { detail: { event, micNotAllowed: true } });
        window.dispatchEvent(EV);
      }
    } else {
      // Non-error, e.g. 'AudioStreamNodeAttachedEvent' etc.
      console.debug('Event:', event);
    }
  }
}
