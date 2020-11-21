/**
 * Tell a speech recognizer to return "stop" or "action" phrase results immediately.
 *
 * @author Nick Freear, 23-October-2020.
 */

export class ActionPhraseRecognizer {
  constructor (incomingEventName, target = window) {
    this.eventName = incomingEventName;
    this.target = target;

    this._resetDictionary();

    this.target.addEventListener(this.eventName, ev => this._handleIncomingEvent(ev));

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

    console.debug(this.constructor.name, 'Incoming event:', activity, ev);

    // IF activity contains "suggested actions",
    // THEN add to dictionary.

    const ACTIONS = activity.suggestedActions && activity.suggestedActions.actions.length
      ? activity.suggestedActions.actions
      : null;

    if (activity.type === 'message' && ACTIONS) {
      const actionPhrases = ACTIONS.map(action => action.title);

      this.addToDictionary(actionPhrases);
    }
  }
}
