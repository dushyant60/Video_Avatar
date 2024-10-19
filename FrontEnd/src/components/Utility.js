import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { avatarAppConfig } from "./config";

const { cogSvcRegion, cogSvcSubKey, voiceName, avatarCharacter, avatarStyle, avatarBackgroundColor, azureOpenAIEndpoint, azureOpenAIKey, azureSpeechServiceKey, azureSpeechServiceRegion } = avatarAppConfig;

export const createWebRTCConnection = (iceServerUrl, iceServerUsername, iceServerCredential) => {
    return new RTCPeerConnection({
        iceServers: [{
            urls: [iceServerUrl],
            username: iceServerUsername,
            credential: iceServerCredential
        }]
    });
};

export const createAvatarSynthesizer = () => {
    const speechSynthesisConfig = SpeechSDK.SpeechConfig.fromSubscription(cogSvcSubKey, cogSvcRegion);
    speechSynthesisConfig.speechSynthesisVoiceName = voiceName;

    const videoFormat = new SpeechSDK.AvatarVideoFormat();
    videoFormat.setCropRange(new SpeechSDK.Coordinate(600, 50), new SpeechSDK.Coordinate(1320, 1080));

    const avatarConfig = new SpeechSDK.AvatarConfig(avatarCharacter, avatarStyle, videoFormat);
    avatarConfig.backgroundColor = avatarBackgroundColor;
    const avatarSynthesizer = new SpeechSDK.AvatarSynthesizer(speechSynthesisConfig, avatarConfig);

    avatarSynthesizer.avatarEventReceived = (s, e) => {
        const offsetMessage = e.offset === 0 ? "" : `, offset from session start: ${e.offset / 10000}ms.`;
        console.log(`[${new Date().toISOString()}] Event received: ${e.description}${offsetMessage}`);
    };

    return avatarSynthesizer;
};

export const makeBackgroundTransparent = (videoElement, canvasElement, context) => {
  const frameProcessor = () => {
      // Draw the current frame from the video element to the temporary canvas
      context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      const frame = context.getImageData(0, 0, canvasElement.width, canvasElement.height);

      for (let i = 0; i < frame.data.length / 4; i++) {
          const r = frame.data[i * 4 + 0];
          const g = frame.data[i * 4 + 1];
          const b = frame.data[i * 4 + 2];

          // Assuming the green screen background
          if (g > 150 && r < 100 && b < 100) {
              frame.data[i * 4 + 3] = 0; // Set alpha to 0 to make it transparent
          }
      }

      // Put the processed frame back to the canvas
      canvasElement.getContext('2d').putImageData(frame, 0, 0);
      requestAnimationFrame(frameProcessor);
  };

  frameProcessor();
};

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

export const callAzureOpenAI = async (userSpeechText) => {
    const fallbackText = "नमस्ते, मैं एआई असिस्टेंट हूं आपकी मदद कैसे करें";
    try {
      const conversationId = generateUUID(); // Generate a random UUID for the conversation ID

      const response = await fetch(`https://web-dpxjzr3ghqbg4-docker-testversion.azurewebsites.net/api/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId, // Use the generated conversation ID
          messages: [
            {
              role: 'user',
              content: userSpeechText // Include the user's message
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Extract and return the specific content from the API response
      const content = data.choices[0].messages.find(message => message.role === 'assistant')?.content || fallbackText;
      return content;
    } catch (error) {
      console.error("API call failed:", error);
      return fallbackText;
    }
};

let isRecognitionStarted = false;

export const startSpeechRecognition = (onResult) => {
    console.log('Start recognition', onResult);
    if (isRecognitionStarted) return; // Prevent starting recognition if it's already running

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

    // Set the flag to true once recognition starts
    isRecognitionStarted = true;

    recognizer.recognitionCanceled = () => {
        isRecognitionStarted = false;
    };
};