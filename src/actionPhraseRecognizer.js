/**
 * ADMINS chat-bot.
 *
 * @copyright © 2020 The Open University (IET-LTT).
 */

/**
 * Tell a speech recognizer to return "stop" or "action" phrase results immediately.
 *
 * @copyright © 2020 Nick Freear.
 * @author Nick Freear, 23-October-2020.
 */

export const ACTION_DEFAULTS = {
  eventName: null,
  eventTarget: window,
  initialActionPhrases: []
  /** @IDEA trimPhrases: ['please', 'thanks', 'thank you'] */
};

export class ActionPhraseRecognizer {
  constructor (options = {}) {
    const _OPT = this.OPT = { ...ACTION_DEFAULTS, ...options };

    this._resetDictionary();
    if (_OPT.initialActionPhrases) {
      this.addToDictionary(_OPT.initialActionPhrases);
    }

    const TARGET = _OPT.eventTarget;
    const EVENT = _OPT.eventName;

    TARGET.addEventListener(EVENT, ev => this._handleIncomingEvent(ev));

    console.debug(this.constructor.name, this);
  }

  _resetDictionary () {
    this.stopPhraseDictionary = [];
  }

  addToDictionary (actionPhrases = []) {
    actionPhrases.forEach(action => {
      this.stopPhraseDictionary.push(this._normalizeText(action));
    });

    console.debug(this.constructor.name, 'Phrases added:', actionPhrases.length, this.stopPhraseDictionary);
  }

  found (transcript) {
    const boolFound = this._caseInsensitiveEqual(transcript);

    console.debug(this.constructor.name, 'Should send final result?', boolFound, transcript);

    return boolFound;
  }

  _normalizeText (text) {
    return text.replace(/\.+$/, '').toLowerCase();
  }

  _caseInsensitiveEqual (text) {
    const phrase = this._normalizeText(text);

    return this.stopPhraseDictionary.find(it => it === phrase);
  }

  _handleIncomingEvent (ev) {
    // ( event.data = action.payload.activity )
    const activity = ev.data;

    // console.debug(this.constructor.name, 'Incoming event:', activity, ev);

    // IF activity contains "suggested actions",
    // THEN add to dictionary.

    const IS_ACTIVITY = activity.type && /(message|event)/.test(activity.type);
    const ACTIONS = activity.suggestedActions && activity.suggestedActions.actions.length
      ? activity.suggestedActions.actions
      : null;

    if (IS_ACTIVITY && ACTIONS) {
      const actionPhrases = ACTIONS.map(action => action.title);

      this.addToDictionary(actionPhrases);
    }
  }
}
