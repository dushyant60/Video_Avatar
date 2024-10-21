import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { avatarAppConfig } from "./config";

// Destructure configuration values
const {
  cogSvcRegion,
  cogSvcSubKey,
  voiceName,
  avatarCharacter,
  avatarStyle,
  avatarBackgroundColor,
  azureOpenAIEndpoint,
  azureOpenAIKey,
  azureSpeechServiceKey,
  azureSpeechServiceRegion
} = avatarAppConfig;

/**
 * Create a new WebRTC connection with specified ICE server details.
 * @param {string} iceServerUrl - ICE server URL.
 * @param {string} iceServerUsername - ICE server username.
 * @param {string} iceServerCredential - ICE server credential.
 * @returns {RTCPeerConnection} - The created RTCPeerConnection.
 */
export const createWebRTCConnection = (iceServerUrl, iceServerUsername, iceServerCredential) => {
  return new RTCPeerConnection({
    iceServers: [{
      urls: [iceServerUrl],
      username: iceServerUsername,
      credential: iceServerCredential
    }]
  });
};

/**
 * Create an avatar synthesizer using Microsoft Speech SDK.
 * @returns {SpeechSDK.AvatarSynthesizer} - The created avatar synthesizer.
 */
export const createAvatarSynthesizer = () => {
  const speechSynthesisConfig = SpeechSDK.SpeechConfig.fromSubscription(cogSvcSubKey, cogSvcRegion);
  speechSynthesisConfig.speechSynthesisVoiceName = voiceName;

  const videoFormat = new SpeechSDK.AvatarVideoFormat();
  videoFormat.setCropRange(new SpeechSDK.Coordinate(0, 0), new SpeechSDK.Coordinate(1920, 1080)); // Full HD

  const avatarConfig = new SpeechSDK.AvatarConfig(avatarCharacter, avatarStyle, videoFormat);
  avatarConfig.backgroundColor = avatarBackgroundColor;

  const avatarSynthesizer = new SpeechSDK.AvatarSynthesizer(speechSynthesisConfig, avatarConfig);

  avatarSynthesizer.avatarEventReceived = (s, e) => {
    const offsetMessage = e.offset === 0 ? "" : `, offset from session start: ${e.offset / 10000}ms.`;
    console.log(`[${new Date().toISOString()}] Event received: ${e.description}${offsetMessage}`);
  };

  return avatarSynthesizer;
};

/**
 * Make the background of a video transparent by processing its frames.
 * @param {HTMLVideoElement} videoElement - Video element to process.
 * @param {HTMLCanvasElement} canvasElement - Canvas element to draw processed frames.
 * @param {CanvasRenderingContext2D} context - Canvas context.
 */
export const makeBackgroundTransparent = (videoElement, canvasElement, context) => {
  const frameProcessor = () => {
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    const frame = context.getImageData(0, 0, canvasElement.width, canvasElement.height);

    for (let i = 0; i < frame.data.length / 4; i++) {
      const r = frame.data[i * 4];
      const g = frame.data[i * 4 + 1];
      const b = frame.data[i * 4 + 2];

      // Assuming green screen background
      if (g > 150 && r < 100 && b < 100) {
        frame.data[i * 4 + 3] = 0; // Set alpha to 0 to make it transparent
      }
    }

    context.putImageData(frame, 0, 0);
    requestAnimationFrame(frameProcessor);
  };

  frameProcessor();
};

// Generate a random UUID for session or conversation IDs
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Call Azure OpenAI API with user speech text.
 * @param {string} userSpeechText - Speech text from the user.
 * @returns {Promise<string>} - Response text from Azure OpenAI.
 */
export const callAzureOpenAI = async (userSpeechText) => {
  const fallbackText = "नमस्ते, मैं एआई असिस्टेंट हूं आपकी मदद कैसे करें";
  try {
    const conversationId = generateUUID();
    const response = await fetch(`${azureOpenAIEndpoint}/api/conversatio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        messages: [{ role: 'user', content: userSpeechText }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].messages.find(message => message.role === 'assistant')?.content || fallbackText;
    return content;
  } catch (error) {
    console.error("API call failed:", error);
    return fallbackText;
  }
};

let isRecognitionStarted = false;

/**
 * Start speech recognition using Microsoft Speech SDK.
 * @param {function} onResult - Callback function for recognized text.
 */
export const startSpeechRecognition = (onResult) => {
  if (isRecognitionStarted) return;

  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(azureSpeechServiceKey, azureSpeechServiceRegion);
  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  recognizer.recognized = (s, e) => {
    if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
      onResult(e.result.text);
    } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
      console.log("No speech could be recognized.");
    } else if (e.result.reason === SpeechSDK.ResultReason.Canceled) {
      const cancellationDetails = SpeechSDK.CancellationDetails.fromResult(e.result);
      console.error(`Speech Recognition canceled: ${cancellationDetails.reason}`);
      if (cancellationDetails.reason === SpeechSDK.CancellationReason.Error) {
        console.error(cancellationDetails.errorDetails);
      }
    }
  };

  recognizer.startContinuousRecognitionAsync();
  isRecognitionStarted = true;

  recognizer.recognitionCanceled = () => {
    isRecognitionStarted = false;
  };
};