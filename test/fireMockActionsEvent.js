/**
 * Fire a mock event to add some "stop phrases".
 *
 * @author NDF, 25-October-2020.
 */

const Event = window.Event;

export const EVENT_INCOMING_ACT = 'webchat:incoming_activity';

const MOCK_ACTIVITY = {
	"type": "DIRECT_LINE/INCOMING_ACTIVITY",
	"payload": {
		"activity": {
			"type": "message",
			"id": "IoI4T6rQGVzGDUzVdWI2bo-p|0000009",
			"timestamp": "2020-10-25T09:58:19.8993613Z",
			"channelId": "directline",
			"from": {
				"id": "rich-g-disability-form-bot-0",
				"name": "rich-g-disability-form-bot-0",
				"role": "bot"
			},
			"conversation": {
				"id": "IoI4T6rQGVzGDUzVdWI2bo-p"
			},
			"locale": "en-GB",
			"text": "Would you like to watch a short video about how we support students with additional needs?",
			"speak": "Would you like to watch a short video about how we support students with additional needs?. \nSay:\n \"Watch the video\", or \"No thanks\".",
			"inputHint": "expectingInput",
			"suggestedActions": {
				"actions": [
					{
						"type": "imBack",
						"title": "Watch the video",
						"value": "Watch the video"
					},
					{
						"type": "imBack",
						"title": "No thanks",
						"value": "No thanks"
					},

					{
						"type": "imBack",
						"title": "Play video",
						"value": "Play video"
					},
					{
						"type": "imBack",
						"title": "Move on",
						"value": "Move on"
					}
				]
			},
			"replyToId": "IoI4T6rQGVzGDUzVdWI2bo-p|0000003"
		}
	}
};

export function fireMockActionsEvent () {
	const event = new Event(EVENT_INCOMING_ACT);

  event.data = MOCK_ACTIVITY.payload.activity;
  window.dispatchEvent(event);

	console.debug('dispatchEvent:', event);
}
