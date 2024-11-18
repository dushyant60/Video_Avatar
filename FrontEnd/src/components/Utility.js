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
// export const createWebRTCConnection = (iceServerUrl, iceServerUsername, iceServerCredential) => {
//   return new RTCPeerConnection({
//     iceServers: [{
//       urls: [iceServerUrl],
//       username: iceServerUsername,
//       credential: iceServerCredential
//     }]
//   });
// };

// const iceServersList = [ 
//   { urls: 'stun:stun.l.google.com:19302' }, 

//   { urls: 'stun:stun1.l.google.com:19302' }, 

//   { urls: 'stun:stun2.l.google.com:19302' }, 

//   { urls: 'stun:stun3.l.google.com:19302' }, 

//   { urls: 'stun:stun4.l.google.com:19302' },  

// ]; 
// let currentServerIndex = 0; 

// export const createWebRTCConnection = () => { 
//   const iceServers = [iceServersList[currentServerIndex]]; 
//   currentServerIndex = (currentServerIndex + 1) % iceServersList.length; 
//   return new RTCPeerConnection({ iceServers }); 
// }

// export const createWebRTCConnection = () => {
// const iceServers = [
//     { 
//       urls: 'turn:20.244.84.44:3478?transport=udp',
//       username: 'turnonelogica',
//       credential: 'Onelogica@123'
//     },
// ];
//   return new RTCPeerConnection({ iceServers });
// };

/**
 * Fetch ICE server configuration dynamically from the Speech Service.
 * @returns {Promise<Object>} ICE server configuration.
 */
const fetchDynamicIceServerConfig = async () => {
  const url = `https://${cogSvcRegion}.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": cogSvcSubKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ICE server info: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      urls: [data.Urls],
      username: data.Username,
      credential: data.Password
      ,
    };
  } catch (error) {
    console.error("Error fetching ICE server:", error);
    throw error;
  }
};

/**
 * Create a new WebRTC PeerConnection dynamically using ICE server info.
 * @returns {Promise<RTCPeerConnection>} A new WebRTC PeerConnection instance.
 */
export const createWebRTCConnection = async () => {
  try {
    const iceServerConfig = await fetchDynamicIceServerConfig();
    
    const peerConnection = new RTCPeerConnection({
      iceServers: [iceServerConfig],
    });

    // Optional: Monitor connection state
    peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === "failed") {
        console.error("ICE Connection failed");
        // Optionally handle reconnection
      }
    };

    return peerConnection;
  } catch (error) {
    console.error("Failed to create WebRTC connection:", error);
    throw error;
  }
};


/**
 * Create an avatar synthesizer using Microsoft Speech SDK.
 * @returns {SpeechSDK.AvatarSynthesizer} - The created avatar synthesizer.
 */
export const createAvatarSynthesizer = () => {
  const speechSynthesisConfig = SpeechSDK.SpeechConfig.fromSubscription(cogSvcSubKey, cogSvcRegion);
  speechSynthesisConfig.speechSynthesisVoiceName = voiceName;

  const videoFormat = new SpeechSDK.AvatarVideoFormat();
  videoFormat.setCropRange(new SpeechSDK.Coordinate(700, 0), new SpeechSDK.Coordinate(1220, 1080)); // Full HD

  const avatarConfig = new SpeechSDK.AvatarConfig(avatarCharacter, avatarStyle, videoFormat);
  avatarConfig.backgroundColor = avatarBackgroundColor;

  const avatarSynthesizer = new SpeechSDK.AvatarSynthesizer(speechSynthesisConfig, avatarConfig);

  avatarSynthesizer.avatarEventReceived = (s, e) => {
    const offsetMessage = e.offset === 0 ? "" : `, offset from session start: ${e.offset / 10000}ms.`;
    // console.log(`[${new Date().toISOString()}] Event received: ${e.description}${offsetMessage}`);
  };

  return avatarSynthesizer;
};

/**
 * Make the background of a video transparent by processing its frames using Web Worker if supported.
 * @param {HTMLVideoElement} videoElement - Video element to process.
 * @param {HTMLCanvasElement} canvasElement - Canvas element to draw processed frames.
 */
export const makeBackgroundTransparent = (videoElement, canvasElement) => {
  // Check if OffscreenCanvas is supported
  if (typeof canvasElement.transferControlToOffscreen === 'function' && !canvasElement.getContext) {
    const offscreen = canvasElement.transferControlToOffscreen();
    const worker = new Worker(new URL('./worker.js', import.meta.url));

    worker.postMessage({
      type: 'init',
      canvas: offscreen,
      width: canvasElement.width,
      height: canvasElement.height,
    }, [offscreen]);

    const frameProcessor = () => {
      worker.postMessage({
        type: 'drawFrame',
        videoElement: videoElement
      });
      requestAnimationFrame(frameProcessor);
    };

    frameProcessor();
  } else {
    // Fallback if OffscreenCanvas is not supported
    const context = canvasElement.getContext('2d');

    const greenThreshold = (r, g, b, threshold) => {
      return g > threshold && r < 180 && b < 180;
    };

    const smoothEdges = (data, width, height) => {
      const newData = new Uint8ClampedArray(data);

      const getIndex = (x, y) => (y * width + x) * 4;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = getIndex(x, y);

          if (data[idx + 3] === 0) {
            // Making surrounding pixels semi-transparent to smoothen edges
            newData[getIndex(x - 1, y) + 3] = Math.min(newData[getIndex(x - 1, y) + 3], 128);
            newData[getIndex(x + 1, y) + 3] = Math.min(newData[getIndex(x + 1, y) + 3], 128);
            newData[getIndex(x, y - 1) + 3] = Math.min(newData[getIndex(x, y - 1) + 3], 128);
            newData[getIndex(x, y + 1) + 3] = Math.min(newData[getIndex(x, y + 1) + 3], 128);
          }
        }
      }

      return newData;
    };

    const processFrame = () => {
      context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      const frame = context.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const data = frame.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (greenThreshold(r, g, b, 150)) {
          data[i + 3] = 0; // Set alpha to 0 to make it transparent
        }
      }

      const smoothedData = smoothEdges(data, canvasElement.width, canvasElement.height);
      frame.data.set(smoothedData);
      context.putImageData(frame, 0, 0);

      requestAnimationFrame(processFrame);
    };

    processFrame();
  }
};

/**
 * Start speech recognition using Microsoft Speech SDK.
 * @param {function} onResult - Callback function for recognized text.
 */
let isRecognitionStarted = false;

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