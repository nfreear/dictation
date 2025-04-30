/**
 * Example of using the native Web Api SpeechRecognition class.
 *
 * @author NDF, 13-Oct-2020.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#Examples
 */

// import { SPEECH_RECOGNITION_EVENTS } from './speech-recognition-base.js';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

const grammar = '#JSGF V1.0; grammar colors; public <color> = aqua | azure | beige | bisque | black | blue | brown | chocolate | coral | crimson | cyan | fuchsia | ghostwhite | gold | goldenrod | gray | green | indigo | ivory | khaki | lavender | lime | linen | magenta | maroon | moccasin | navy | olive | orange | orchid | peru | pink | plum | purple | red | salmon | sienna | silver | snow | tan | teal | thistle | tomato | turquoise | violet | white | yellow ;';

export const SPEECH_RECOGNITION_EVENTS =
'audioend,audiostart,end,error,nomatch,result,soundend,soundstart,speechend,speechstart,start'.split(',');

export function webApiSpeechRecogDemo () {
  console.warn('Web API - Speech Recognition demo.');

  const recognition = new SpeechRecognition();
  const speechRecognitionList = new SpeechGrammarList();
  speechRecognitionList.addFromString(grammar, 1);

  recognition.grammars = speechRecognitionList;
  recognition.continuous = false;
  recognition.lang = 'en-GB';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const diagnostic = document.querySelector('.output');
  const bg = document.querySelector('html');

  document.body.onclick = (ev) => {
    recognition.start();

    console.log('Ready to receive a color command.', ev);
  };

  recognition.onresult = (event) => {
    console.warn('onresult:', event);

    const color = event.results[0][0].transcript;

    diagnostic.textContent = 'Result received: ' + color;
    bg.style.backgroundColor = color;
  };

  SPEECH_RECOGNITION_EVENTS.forEach(evName => {
    recognition.addEventListener(evName, ev => console.debug('Event:', evName, ev));
  });
}

export default webApiSpeechRecogDemo;

/*
Events sequence:

17:02:34.125  ~~ Event: start
17:02:34.324  ~~ Event: audiostart
17:02:35.067  ~~ Event: soundstart
17:02:35.067  ~~ Event: speechstart
17:02:36.090  ~~ Event: speechend
17:02:36.090  ~~ Event: soundend
17:02:36.090  ~~ Event: audioend
17:02:36.264  ~~ Event: result
17:02:36.264  ~~ Event: end
*/
