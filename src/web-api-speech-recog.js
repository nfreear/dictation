/**
 * Example of using the native Web Api SpeechRecognition class.
 *
 * @author NDF, 13-Oct-2020.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#Examples
 */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

const grammar = '#JSGF V1.0; grammar colors; public <color> = aqua | azure | beige | bisque | black | blue | brown | chocolate | coral | crimson | cyan | fuchsia | ghostwhite | gold | goldenrod | gray | green | indigo | ivory | khaki | lavender | lime | linen | magenta | maroon | moccasin | navy | olive | orange | orchid | peru | pink | plum | purple | red | salmon | sienna | silver | snow | tan | teal | thistle | tomato | turquoise | violet | white | yellow ;';

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
    console.warn('onresult:', event, JSON.stringify(event.results, null, '\t'));

    const color = event.results[0][0].transcript;

    diagnostic.textContent = 'Result received: ' + color;
    bg.style.backgroundColor = color;
  };
}
