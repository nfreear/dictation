/**
 * DESIGN. Example of declaring a class INSIDE a function declaration!
 *
 * Definition of function 'createDictationRecognizerPonyfill()'
 *
 * @author Nick Freear, 17-Oct-2020.
 *
 * @see https://wicg.github.io/speech-api/#speechreco-section
 * @see https://github.com/compulim/web-speech-cognitive-services/blob/master/packages/component/src/SpeechServices/SpeechToText/createSpeechRecognitionPonyfill.js
 */

// import { AudioConfig, SpeechConfig, OutputFormat, ResultReason, SpeechRecognizer } from 'SpeechSDK'; // window.SpeechSdk;

const EventTarget = window.EventTarget;

export class SpeechGrammarList {}      // window.SpeechGrammarList
export class SpeechRecognitionEvent {} // window.SpeechRecognitionEvent;

class SpeechRecognizer {}      // Azure Speech SDK.

export interface Ponyfill { // BotFramework-WebChat
  SpeechGrammarList: SpeechGrammarList,
  SpeechRecognition: SpeechRecognition,
  speechSynthesis?: SpeechSynthesis,
  SpeechSynthesisUtterance?: SpeechSynthesisUtterance,
  getRecognizerInstance?: ()=>{} // Promise?
}

export enum AzureRegion {
  eastus = 'eastus',
  westus = 'westus',
  // ...
  westeurope = 'westeurope',
  eastasia = 'eastasia',
  southeastasia = 'southeastasia'
}

export enum RecognitionMode {
  conversation = 'conversation',
  dictation = 'dictation'
}

export enum BcpLanguageTag { // IETF BCP 47 language tag (https://tools.ietf.org/rfc/bcp/bcp47.html)
  en_US = 'en-US',
  en_GB = 'en-GB',
  fr_FR = 'fr-FR',
  // ...
  zh_CN = 'zh-CN',
}

export type MilliSeconds = number;

export interface DictationOptions {
  authorizationKey?: string,
  subscriptionKey?: string,
  region: AzureRegion|string,
  lang?:  BcpLanguageTag|string,
  // ...
  format?: string, // Enum: OutputFormat.Detailed (SDK)
  mode?: RecognitionMode,
  initialSilenceTimeoutMs?: MilliSeconds,
  endSilenceTimeoutMs?:     MilliSeconds,
  audioLogging?: boolean,
  stopStatusRegex?: string, // I.e. '(NOT__EndOfDictation|InitialSilenceTimeout)',
  normalize?: string,       // Text normalization.
  separator?: string,       // Space (' ')

  uri?: string,
  urlObj?: URL,
}

function createSpeechRecognitionFromRecognizer (recognizer: SpeechRecognizer): SpeechRecognition {

  class SpeechRecognition extends EventTarget {
    // ** TODO ...! <<<< **
  }

  // Error: "Type .. is missing the following properties ... continuous, grammars ..."
  return SpeechRecognition;
}

function createCognitiveRecognizer (options: DictationOptions): SpeechRecognizer {
  // ...

  const recognizer = new SpeechRecognizer();

  return recognizer;
}

export function createDictationRecognizerPonyfill (options: DictationOptions): Ponyfill {
  const recognizer = createCognitiveRecognizer(options);

  const SpeechRecognition = createSpeechRecognitionFromRecognizer(recognizer);

  return {
    SpeechGrammarList,
    SpeechRecognition
  }
}

export default createDictationRecognizerPonyfill;
