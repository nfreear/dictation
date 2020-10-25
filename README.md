[![Test status][ci-badge]][ci]

# @ndf/speech-dictation-test

__Work-in-progress!__

A dictation-mode speech recognizer _ponyfill_ compatible with [WebChat][]
that gives the user time to think and stutter (_stammer_)!

> Mastering '`endSilenceTimeoutMs`' in Microsoft [Speech SDK][sdk] dictation mode!

_(08-Oct-2020)_

## Ponyfill

See [Integrating with Cognitive Services Speech Services][bot-speech].

```javascript
const asrPonyfill = await createDictationRecognizerPonyfill({ region, key });

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

The key lines in `createDictationRecognizerPonyfill` to force dictation mode,
and enable the setting of `initialSilenceTimeoutMs` and `endSilenceTimeoutMs`:

```javascript
const initialSilenceTimeoutMs = 5 * 1000;
const endSilenceTimeoutMs = 5 * 1000;
// Scroll to right!
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

 * [Gist: `speech-sdk.dictate.js.html`][gist];
 * [Bug: '_Can i set silence duration at end of speech ?_' (#131)][b-131];
 * [Bug: '_... I need to lengthen the dictation / "Listening" timeout_' (#3466)][b-3466]
 * [GitHub: Microsoft/cognitive-services-speech-sdk-js][sdk];
 * [GitHub: @compulim/web-speech-cognitive-services `../create...Ponyfill.js`][comp-ponyfill];
 * [GitHub: @compulim/react-dictate-button `../Composer.js`][dict-btn-recog];

---

[gist]: https://gist.github.com/nfreear/f875994f45c97518cd8c42c786998c84
[b-131]: https://github.com/Azure-Samples/cognitive-services-speech-sdk/issues/131
[b-3466]: https://github.com/microsoft/BotFramework-WebChat/issues/3466
[sdk]: https://github.com/microsoft/cognitive-services-speech-sdk-js
[webchat]: https://github.com/Microsoft/BotFramework-WebChat
[bot-speech]: https://github.com/Microsoft/BotFramework-WebChat/blob/master/docs/SPEECH.md#integrating-web-chat-into-your-page

[comp-speech]: https://github.com/compulim/web-speech-cognitive-services
[comp-ponyfill]: https://github.com/compulim/web-speech-cognitive-services/blob/master/packages/component/src/SpeechServices/SpeechToText/createSpeechRecognitionPonyfill.js
[dict-btn]: https://github.com/compulim/react-dictate-button
[dict-btn-recog]: https://github.com/compulim/react-dictate-button/blob/v1.2.2/packages/component/src/Composer.js#L134

[ci]: https://github.com/nfreear/dictation/actions "Test status ~ 'Node CI'"
[ci-badge]: https://github.com/nfreear/dictation/workflows/Node%20CI/badge.svg
