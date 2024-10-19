import "./Avatar.css";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { createAvatarSynthesizer, createWebRTCConnection } from "./Utility";
import { avatarAppConfig } from "./config";
import { useState, useRef, useEffect } from "react";
import { FaPlug, FaTimes, FaMicrophone, FaMicrophoneSlash, FaStop } from 'react-icons/fa';

export const Avatar = ({ externalMessage }) => {
  const [avatarSynthesizer, setAvatarSynthesizer] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [responseText, setResponseText] = useState("");
  const myAvatarVideoEleRef = useRef(null);
  const myAvatarAudioEleRef = useRef(null);
  const [microphoneButtonText, setMicrophoneButtonText] = useState("Start Microphone");
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const speechRecognizerRef = useRef(null);
  const iceUrl = avatarAppConfig.iceUrl;
  const iceUsername = avatarAppConfig.iceUsername;
  const iceCredential = avatarAppConfig.iceCredential;
  let previousAnimationFrameTimestamp = 0;

  useEffect(() => {
    if (externalMessage) {
      handleSpeechRecognitionResult(externalMessage);
    }
  }, [externalMessage]);

  const handleOnTrack = (event) => {
    const { current: videoElement } = myAvatarVideoEleRef;
    const { current: audioElement } = myAvatarAudioEleRef;
  
    if (event.track.kind === 'video') {
      if (!videoElement) {
        console.error('Video element is not available.');
        return;
      }
  
      console.log('Received video track');
      videoElement.srcObject = event.streams[0];
      videoElement.autoplay = true;
      videoElement.playsInline = true;
  
      videoElement.addEventListener('play', () => {
        window.requestAnimationFrame(makeBackgroundTransparent);
      });
    } else if (event.track.kind === 'audio') {
      if (!audioElement) {
        console.error('Audio element is not available.');
        return;
      }
  
      console.log('Received audio track');
      audioElement.srcObject = event.streams[0];
      audioElement.autoplay = true;
      audioElement.muted = true;
    }
  };

const makeBackgroundTransparent = (timestamp) => {
  if (timestamp - previousAnimationFrameTimestamp > 33) {
    const video = myAvatarVideoEleRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      window.requestAnimationFrame(makeBackgroundTransparent);
      return;
    }

    const canvas = document.getElementById('canvas');
    const canvasContext = canvas.getContext('2d');
    const tmpCanvas = document.createElement('canvas');
    const tmpCanvasContext = tmpCanvas.getContext('2d', { willReadFrequently: true });

    tmpCanvas.width = video.videoWidth;
    tmpCanvas.height = video.videoHeight;

    tmpCanvasContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const frame = tmpCanvasContext.getImageData(0, 0, video.videoWidth, video.videoHeight);

    for (let i = 0; i < frame.data.length / 4; i++) {
      let r = frame.data[i * 4 + 0];
      let g = frame.data[i * 4 + 1];
      let b = frame.data[i * 4 + 2];
      let a = frame.data[i * 4 + 3];

      if (g > 100 && g > r && g > b && (g - Math.max(r, b)) > 45) {
        frame.data[i * 4 + 3] = 0;
      } else {
        frame.data[i * 4] = r * 1.1;
        frame.data[i * 4 + 2] = b * 1.1;
      }
    }

    canvasContext.putImageData(frame, 0, 0);
    previousAnimationFrameTimestamp = timestamp;
  }
  window.requestAnimationFrame(makeBackgroundTransparent);
};

  const stopSpeaking = () => {
    if (avatarSynthesizer) {
      avatarSynthesizer.stopSpeakingAsync().then(() => {
        console.log("Stop speaking request sent.");
      }).catch((error) => console.error(error));
    }
  };

  const stopSession = () => {
    if (avatarSynthesizer) {
      avatarSynthesizer.stopSpeakingAsync().then(() => {
        console.log("Stop speaking request sent.");
        avatarSynthesizer.close();
      }).catch((error) => console.error(error));
    }
  };

  const startSession = () => {
    const peerConnection = createWebRTCConnection(iceUrl, iceUsername, iceCredential);
    peerConnection.ontrack = handleOnTrack;
    peerConnection.addTransceiver('video', { direction: 'sendrecv' });
    peerConnection.addTransceiver('audio', { direction: 'sendrecv' });

    const avatarSynthesizerInstance = createAvatarSynthesizer();
    setAvatarSynthesizer(avatarSynthesizerInstance);

    peerConnection.oniceconnectionstatechange = (e) => {
      if (peerConnection.iceConnectionState === 'connected') {
        console.log("Connected to Azure Avatar service");
      } else if (peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'failed') {
        console.log("Azure Avatar service Disconnected");
      }
    };

    avatarSynthesizerInstance.startAvatarAsync(peerConnection).then(() => {
      console.log("Avatar started.");
    }).catch((error) => {
      console.error("Avatar failed to start. Error: " + error);
    });
  };

  const cleanText = (text) => {
    return text.replace(/[*_~`]/g, '').replace(/\[doc\d+\]/g, ''); // Add more patterns as needed
  };

  const handleSpeechRecognitionResult = async (userQuery) => {
    console.log("Speech recognition", userQuery);
    setRecognizedText(userQuery);
    const response = userQuery; // Directly use the external message as the response
    console.log(`Response from OpenAI: ${response}`);
    const cleanedResponse = cleanText(response);
    setResponseText(cleanedResponse);

    if (avatarSynthesizer) {
      const audioPlayer = myAvatarAudioEleRef.current;
      audioPlayer.muted = false;
      avatarSynthesizer.speakTextAsync(cleanedResponse).then((result) => {
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          console.log("Speech and avatar synthesized to video stream.");
        } else {
          console.error("Unable to speak. Result ID: " + result.resultId);
          if (result.reason === SpeechSDK.ResultReason.Canceled) {
            const cancellationDetails = SpeechSDK.CancellationDetails.fromResult(result);
            console.error(cancellationDetails.reason);
            if (cancellationDetails.reason === SpeechSDK.CancellationReason.Error) {
              console.error(cancellationDetails.errorDetails);
            }
          }
        }
      }).catch((error) => {
        console.error("Error synthesizing speech:", error);
        avatarSynthesizer.close();
      });
    }
  };

  const handleMicrophoneClick = () => {
    if (isMicrophoneActive) {
      setMicrophoneButtonText("Stopping...");
      speechRecognizerRef.current.stopContinuousRecognitionAsync(
        () => {
          setMicrophoneButtonText("Start Microphone");
          setIsMicrophoneActive(false);
        },
        (err) => {
          console.log("Failed to stop continuous recognition:", err);
          setMicrophoneButtonText("Start Microphone");
          setIsMicrophoneActive(false);
        }
      );
      return;
    }

    setMicrophoneButtonText("Starting...");
    speechRecognizerRef.current = new SpeechSDK.SpeechRecognizer(
      SpeechSDK.SpeechConfig.fromSubscription(avatarAppConfig.azureSpeechServiceKey, avatarAppConfig.azureSpeechServiceRegion),
      SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
    );

    speechRecognizerRef.current.recognized = async (s, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        let userQuery = e.result.text.trim();
        if (userQuery === '') return;

        setMicrophoneButtonText("Stopping...");
        speechRecognizerRef.current.stopContinuousRecognitionAsync(
          () => {
            setMicrophoneButtonText("Start Microphone");
            setIsMicrophoneActive(false);
          },
          (err) => {
            console.log("Failed to stop continuous recognition:", err);
            setMicrophoneButtonText("Start Microphone");
            setIsMicrophoneActive(false);
          }
        );

        handleSpeechRecognitionResult(userQuery);
      }
    };

    speechRecognizerRef.current.startContinuousRecognitionAsync(
      () => {
        setMicrophoneButtonText("Stop Microphone");
        setIsMicrophoneActive(true);
      },
      (err) => {
        console.log("Failed to start continuous recognition:", err);
        setMicrophoneButtonText("Start Microphone");
        setIsMicrophoneActive(false);
      }
    );
  };

  return (
    <div className="avatar-container">
      <div className="avatar-card">
        <div className="avatar-video-wrapper">
          <video ref={myAvatarVideoEleRef} className="avatar-video"></video>
          <canvas id="canvas" className="avatar-video"></canvas>
          <audio ref={myAvatarAudioEleRef}></audio>

          <div className="avatar-controls">
            <button className="btn connect-btn" onClick={startSession}>
              <FaPlug /> Connect
            </button>
            <button className="btn disconnect-btn" onClick={stopSession}>
              <FaTimes /> Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};