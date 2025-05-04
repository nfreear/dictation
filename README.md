[![Test status][ci-badge]][ci]
[![NPM Version][npm-badge]][npm]
[![PAS 901:2025][pas-badge]][pas]

# adaptive-speech-recognizer

An adaptive dictation-mode speech recognizer _ponyfill_ compatible with [WebChat][] that gives the user time to think and stutter (_stammer_)!

> Mastering '`endSilenceTimeoutMs`' in Microsoft [Speech SDK][sdk] dictation mode!

_(08-Oct-2020)_

## Basic usage

```js
import 'ms-cognitive-speech-sdk';
import createAdaptiveRecognizerPonyfill from 'adaptive-speech-recognizer';

const ponyfill = createAdaptiveRecognizerPonyfill({
  subscriptionKey,
  region,
  endSilenceTimeoutMs
});

const recognizer = new ponyfill.SpeechRecognition();
recognizer.start();
```

## Ponyfill

See [Integrating with Cognitive Services Speech Services][bot-speech].

```javascript
import { createAdaptiveRecognizerPonyfill } from 'adaptive-speech-recognizer';

const asrPonyfill = await createAdaptiveRecognizerPonyfill({ region, key });

// ... Combine speech synthesis from default
// 'createCognitiveServicesSpeechServicesPonyfillFactory()' ...

renderWebChat(
  {
    directLine: createDirectLine({ ... }),
    // ...
    webSpeechPonyfillFactory: await createCustomHybridPonyfill({ ... })
  },
  document.getElementById('webchat')
);
```

## Dictation mode

The [key lines in `createCognitiveRecognizer`][key] to force dictation mode, and enable the setting of `initialSilenceTimeoutMs` and `endSilenceTimeoutMs`:

```javascript
const initialSilenceTimeoutMs = 5 * 1000;
const endSilenceTimeoutMs = 5 * 1000;
// Scroll to right! → →
const url = `wss://${region}.stt.speech.microsoft.com/speech/recognition/dictation/cognitiveservices/v1?initialSilenceTimeoutMs=${initialSilenceTimeoutMs || ''}&endSilenceTimeoutMs=${endSilenceTimeoutMs}&`;
const urlObj = new URL(url);

const speechConfig = SpeechConfig.fromEndpoint(urlObj, subscriptionKey);

speechConfig.enableDictation();

// ...

const recognizer = new SpeechRecognizer(speechConfig, audioConfig);
```

## Usage

```
npm install
npm start
npm test
```

## Useful links

 * [PAS 901:2025 Vocal accessibility in system design. Code of practice][pas]
 * [Gist: `speech-sdk.dictate.js.html`][gist];
 * [Bug: '_Can i set silence duration at end of speech ?_' (#131)][b-131];
 * [Bug: '_... I need to lengthen the dictation / "Listening" timeout_' (#3466)][b-3466]
 * [GitHub: Microsoft/cognitive-services-speech-sdk-js][sdk];
 * [GitHub: @compulim/web-speech-cognitive-services `../create...Ponyfill.js`][comp-ponyfill];
 * [GitHub: @compulim/react-dictate-button `../Composer.js`][dict-btn-recog];

## Credit

Developed in [IET][] at [The Open University][ou] for the [ADMINS][] project, funded by [Microsoft][ms].

---
<!-- © 2020 Nick Freear. -->

[c]: https://www.open.ac.uk/copyright "Copyright © The Open University (IET)."
[ou]: http://www.open.ac.uk "The Open University"
[iet]: https://iet.open.ac.uk/ "Institute of Educational Technology, at The Open University."
[admins]: https://iet.open.ac.uk/projects/admins
  "ADMINS in IET: Assistants to the Disclosure and Management of Information about Needs and Support"
[ms]: https://microsoft.com/en-gb/ai/ai-for-accessibility-projects#:~:text=ADMINS
  "Microsoft 'AI for Accessibility' projects, including ADMINS"

[pas]: https://knowledge.bsigroup.com/products/vocal-accessibility-in-system-design-code-of-practice
  "PAS 901:2025 Vocal accessibility in system design. Code of practice"
[pas-badge]: https://img.shields.io/badge/PAS-901%3A2025-teal
[doi]: https://dx.doi.org/10.3403/30458829
  "DOI: 10.3403/30458829"
[eu]: https://www.en-standard.eu/pas-901-2025-vocal-accessibility-in-system-design-code-of-practice/

[key]: https://github.com/nfreear/dictation/blob/main/src/createDictationRecognizerPonyfill.js#L527-L540
  "'createCognitiveRecognizer()' function, lines 527-540"

[gist]: https://gist.github.com/nfreear/f875994f45c97518cd8c42c786998c84
[b-131]: https://github.com/Azure-Samples/cognitive-services-speech-sdk/issues/131
[b-3466]: https://github.com/microsoft/BotFramework-WebChat/issues/3466
[b-502]: https://github.com/Azure-Samples/cognitive-services-speech-sdk/issues/502
  "Minimum/Maximum values for InitialSilence and EndSilence timeouts for java SDK (#502) (2020)"
[sdk]: https://github.com/microsoft/cognitive-services-speech-sdk-js
[webchat]: https://github.com/Microsoft/BotFramework-WebChat
[bot-speech]: https://github.com/Microsoft/BotFramework-WebChat/blob/master/docs/SPEECH.md#integrating-web-chat-into-your-page

[comp-speech]: https://github.com/compulim/web-speech-cognitive-services
[comp-ponyfill]: https://github.com/compulim/web-speech-cognitive-services/blob/master/packages/component/src/SpeechServices/SpeechToText/createSpeechRecognitionPonyfill.js
[dict-btn]: https://github.com/compulim/react-dictate-button
[dict-btn-recog]: https://github.com/compulim/react-dictate-button/blob/v1.2.2/packages/component/src/Composer.js#L134

[ci]: https://github.com/nfreear/dictation/actions "Test status ~ 'Node CI'"
[ci-badge]: https://github.com/nfreear/dictation/workflows/Node%20CI/badge.svg
[npm]: https://www.npmjs.com/package/adaptive-speech-recognizer
[npm-badge]: https://img.shields.io/npm/v/adaptive-speech-recognizer
