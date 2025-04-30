/**
 * Fire a mock Chat-bot "activity" event to add some "stop phrases".
 *
 * @author Nick Freear, 25-October-2020.
 */

import { EVENT_INCOMING_ACT } from '../index.js';

const { Event } = window;

// Was: export const EVENT_INCOMING_ACT = 'webchat:incoming_activity';

const MOCK_ACTIVITY = {
  type: 'DIRECT_LINE/INCOMING_ACTIVITY',
  payload: {
    activity: {
      type: 'message',
      id: 'IoI4T6rQGVzGDUzVdWI2bo-p|0000009',
      timestamp: '2020-10-25T09:58:19.8993613Z',
      channelId: 'directline',
      from: {
        id: 'rich-g-disability-form-bot-0',
        name: 'rich-g-disability-form-bot-0',
        role: 'bot'
      },
      conversation: {
        id: 'IoI4T6rQGVzGDUzVdWI2bo-p'
      },
      locale: 'en-GB',
      text: 'Would you like to watch a short video about how we support students with additional needs?',
      speak: 'Would you like to watch a short video about how we support students with additional needs?. \nSay:\n "Watch the video", or "No thanks".',
      inputHint: 'expectingInput',
      suggestedActions: {
        actions: [
          {
            type: 'imBack',
            title: 'Watch the video',
            value: 'Watch the video'
          },

          {
            type: 'imBack',
            title: 'Yes',
            value: 'Yes'
          }, {
            type: 'imBack',
            title: 'No', // Was: 'No thanks'
            value: 'No'
          },

          {
            type: 'imBack',
            title: 'Play video',
            value: 'Play video'
          },
          {
            type: 'imBack',
            title: 'Move on',
            value: 'Move on'
          }
        ]
      },
      replyToId: 'IoI4T6rQGVzGDUzVdWI2bo-p|0000003'
    }
  }
};

export default function fireMockActionsEvent () {
  const event = new Event(EVENT_INCOMING_ACT);

  event.data = MOCK_ACTIVITY.payload.activity;
  window.dispatchEvent(event);

  const ACTIONS = MOCK_ACTIVITY.payload.activity.suggestedActions.actions.map(act => act.title);

  console.debug('fireMockActionsEvent:', event);

  return ACTIONS;
}
