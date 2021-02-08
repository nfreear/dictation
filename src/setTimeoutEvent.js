/**
 * Dispatch and handle a speech recognition "set timeout" event.
 *
 * @copyright © 2020 Nick Freear.
 * @author Nick Freear, 05-February-2021.
 */

const Event = window.Event;

export const EVENT_SET_TIMEOUT = 'recognition:set_timeout';

// Example :~ "Set recognition timeout to 2.5 seconds"
const TIMEOUT_PHRASE_REGEX = /(?:Set )?recognition time(?: )?out (?:too?\.? )?(\d+\.?\d?)(?: seconds)?/i;

export function dispatchSetTimeoutEvent (TEXT, target = window) {
  const matches = TEXT.match(TIMEOUT_PHRASE_REGEX);

  if (matches) {
    const endSilenceTimeoutMs = matches[1] * 1000;
    const timeoutEvent = new Event(EVENT_SET_TIMEOUT);
    timeoutEvent.data = { endSilenceTimeoutMs, text: TEXT };

    target.dispatchEvent(timeoutEvent);

    console.debug('Dispatch setTimeout event:', timeoutEvent);
  }
}

export function handleSetTimeoutEvent (callbackFunc, target = window) {
  target.addEventListener(EVENT_SET_TIMEOUT, ev => {
    const DATA = ev.data;

    callbackFunc(ev);

    // Was: PRIV.setTimeoutEvent = ev;

    console.debug('Received setTimeout event:', callbackFunc, DATA, ev);
  });
}
