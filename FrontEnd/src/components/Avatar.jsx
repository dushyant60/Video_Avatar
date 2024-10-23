import "./Avatar.css";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { createAvatarSynthesizer, createWebRTCConnection, makeBackgroundTransparent } from "./Utility";
import { avatarAppConfig } from "./config";
import { useState, useRef, useEffect } from "react";
import { FaPlug, FaTimes, FaStop } from 'react-icons/fa';

export const Avatar = ({ externalMessage, onDemoComplete }) => {
  // State hooks
  const [avatarSynthesizer, setAvatarSynthesizer] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [responseText, setResponseText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  // Refs for video and audio elements
  const myAvatarVideoEleRef = useRef();
  const myAvatarAudioEleRef = useRef();
  const videoCanvasRef = useRef(null);

  // Configuration settings from config file
  const { iceUrl, iceUsername, iceCredential, azureSpeechServiceKey, azureSpeechServiceRegion } = avatarAppConfig;

  // Predefined messages
  const introductionMessage = "Hello! I am your AI car assistant. Would you like a demo of the car or do you have any questions about it?";
  const demoMessage = "Welcome to the demo of the Nissan Magnite. This car offers an impressive combination of design, technology, and performance...";
  const continuationMessage = "Upload any video to ask about it, or just ask anything regarding Nissan cars.";

  // Effect hook for handling external messages
  useEffect(() => {
    if (externalMessage) {
      handleSpeechRecognitionResult(externalMessage);
    }
  }, [externalMessage]);

  // Effect hook for introducing avatar when connected
  useEffect(() => {
    if (isConnected) {
      introduceAvatar();
    }
  }, [isConnected]);

  // Handle video and audio track events
  const handleOnTrack = (event) => {
    console.log(`Received track of kind: ${event.track.kind}`);
    if (event.track.kind === 'video') {
      const videoElement = myAvatarVideoEleRef.current;
      const canvas = videoCanvasRef.current;

      videoElement.srcObject = event.streams[0];
      videoElement.autoplay = true;
      videoElement.playsInline = true;

      videoElement.addEventListener('loadedmetadata', () => {
        console.log("Video metadata loaded.");
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
      });

      const context = canvas.getContext('2d', { willReadFrequently: true });

      videoElement.addEventListener('play', () => {
        console.log("Video started playing.");
        makeBackgroundTransparent(videoElement, canvas, context);
      });
    } else if (event.track.kind === 'audio') {
      const audioPlayer = myAvatarAudioEleRef.current;
      audioPlayer.srcObject = event.streams[0];
      audioPlayer.autoplay = true;
      audioPlayer.muted = false; // Ensure audio is not muted
      console.log("Audio track added.");
      audioPlayer.addEventListener('loadedmetadata', () => {
        console.log("Audio metadata loaded.");
        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Audio playback failed: ", error);
            // Show some UI to indicate to the user to unmute or interact
          });
        }
      });
    }
  };

  // Function to stop the avatar from speaking
  const stopSpeaking = () => {
    if (avatarSynthesizer) {
      avatarSynthesizer.stopSpeakingAsync().then(() => {
        console.log("Stop speaking request sent.");
      }).catch((error) => console.error(error));
    }
  };

  // Function to stop the avatar session
  const stopSession = () => {
    if (avatarSynthesizer) {
      avatarSynthesizer.stopSpeakingAsync().then(() => {
        console.log("Stop speaking request sent.");
        avatarSynthesizer.close();
        setIsConnected(false);
        setShowOptions(false); // Hide options when session stops
      }).catch((error) => console.error(error));
    }
  };

  // Function to start the avatar session
  const startSession = () => {
    const peerConnection = createWebRTCConnection(iceUrl, iceUsername, iceCredential);
    peerConnection.ontrack = handleOnTrack;
    peerConnection.addTransceiver('video', { direction: 'sendrecv' });
    peerConnection.addTransceiver('audio', { direction: 'sendrecv' });

    const avatarSynthesizerInstance = createAvatarSynthesizer();
    setAvatarSynthesizer(avatarSynthesizerInstance);

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state: ${peerConnection.iceConnectionState}`);
      if (peerConnection.iceConnectionState === 'connected' && avatarSynthesizerInstance) {
        console.log("Connected to Azure Avatar service");
        setIsConnected(true);
      } else if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'disconnected') {
        console.log("Azure Avatar service Disconnected");
        setIsConnected(false);
      }
    };

    avatarSynthesizerInstance.startAvatarAsync(peerConnection).then(() => {
      console.log("Avatar started.");
    }).catch((error) => {
      console.error("Avatar failed to start. Error: " + error);
    });

    peerConnection.onicegatheringstatechange = () => {
      console.log(`ICE gathering state: ${peerConnection.iceGatheringState}`);
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state: ${peerConnection.connectionState}`);
      if (peerConnection.connectionState === 'connected') {
        console.log("WebRTC connection established.");
      } else if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        console.log("WebRTC connection failed or disconnected.");
      }
    };
  };

  // Function to introduce the avatar with a standard message
  const introduceAvatar = () => {
    console.log("Introducing Avatar...");
    if (avatarSynthesizer) {
      avatarSynthesizer.speakTextAsync(introductionMessage).then((result) => {
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          console.log("Introduction message synthesized to video stream.");
          setShowOptions(true); // Show options after introduction
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

  // Function to clean up the text received from the user
  const cleanText = (text) => {
    return text.replace(/[*_~`]/g, '').replace(/\[doc\d+\]/g, '');
  };

  // Function to handle speech recognition results
  const handleSpeechRecognitionResult = async (userQuery) => {
    console.log("Speech recognition", userQuery);
    setRecognizedText(userQuery);
    const response = userQuery;
    console.log(`Response from OpenAI: ${response}`);
    const cleanedResponse = cleanText(response);
    setResponseText(cleanedResponse);

    if (avatarSynthesizer) {
      const audioPlayer = myAvatarAudioEleRef.current;
      audioPlayer.muted = false;
      const playPromise = audioPlayer.play(); // Ensure audio plays
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Audio playback failed: ", error);
          // Show some UI to indicate to the user to unmute or interact
        });
      }
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

  // Handle demo button click
  const handleDemoClick = () => {
    setShowOptions(false); // Hide options
    setIsDemoRunning(true); // Mark demo as running
    if (avatarSynthesizer) {
      avatarSynthesizer.speakTextAsync(demoMessage).then((result) => {
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          console.log("Demo message synthesized to video stream.");
        } else {
          console.error("Unable to speak demo. Result ID: " + result.resultId);
          if (result.reason === SpeechSDK.ResultReason.Canceled) {
            const cancellationDetails = SpeechSDK.CancellationDetails.fromResult(result);
            console.error(cancellationDetails.reason);
            if (cancellationDetails.reason === SpeechSDK.CancellationReason.Error) {
              console.error(cancellationDetails.errorDetails);
            }
          }
        }
      }).catch((error) => {
        console.error("Error synthesizing demo:", error);
        avatarSynthesizer.close();
      });
    }
  };

  // Handle end demo button click
  const handleEndDemoClick = () => {
    setIsDemoRunning(false); // Mark demo as ended
    if (avatarSynthesizer) {
      setTimeout(() => {
        avatarSynthesizer.speakTextAsync(continuationMessage).then((result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log("Continuation message synthesized to video stream.");
            onDemoComplete(); // Notify parent component that demo has completed
          } else {
            console.error("Unable to speak continuation. Result ID: " + result.resultId);
            if (result.reason === SpeechSDK.ResultReason.Canceled) {
              const cancellationDetails = SpeechSDK.CancellationDetails.fromResult(result);
              console.error(cancellationDetails.reason);
              if (cancellationDetails.reason === SpeechSDK.CancellationReason.Error) {
                console.error(cancellationDetails.errorDetails);
              }
            }
          }
        }).catch((error) => {
          console.error("Error synthesizing continuation:", error);
          avatarSynthesizer.close();
        });
      }, 1000); // Delay of 1000 milliseconds (1 second)
    }
  };

  // Handle continue button click
  const handleContinueClick = () => {
    setShowOptions(false); // Hide options
    setIsDemoRunning(false); // Ensure demo is not marked as running
    if (avatarSynthesizer) {
      avatarSynthesizer.speakTextAsync(continuationMessage).then((result) => {
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          console.log("Continuation message synthesized to video stream.");
          onDemoComplete(); // Notify parent component that continuation has completed
        } else {
          console.error("Unable to speak continuation. Result ID: " + result.resultId);
          if (result.reason === SpeechSDK.ResultReason.Canceled) {
            const cancellationDetails = SpeechSDK.CancellationDetails.fromResult(result);
            console.error(cancellationDetails.reason);
            if (cancellationDetails.reason === SpeechSDK.CancellationReason.Error) {
              console.error(cancellationDetails.errorDetails);
            }
          }
        }
      }).catch((error) => {
        console.error("Error synthesizing continuation:", error);
        avatarSynthesizer.close();
      });
    }
  };

  return (
    <div className="avatar-container">
      <div className="avatar-card">
        <div className="avatar-video-wrapper">
          <video ref={myAvatarVideoEleRef} className="avatar-video" style={{ display: 'none' }}></video>
          <canvas ref={videoCanvasRef} className="video-canvas"></canvas>
          <audio ref={myAvatarAudioEleRef}></audio>
          <div className="avatar-controls">
            <button className="btn connect-btn" onClick={startSession} style={{ color: "black" }}>
              <FaPlug /> Connect
            </button>
            <button className="btn disconnect-btn" onClick={stopSession} style={{ color: "black" }}>
              <FaTimes /> Disconnect
            </button>
            {/* Additional controls (commented out) */}
            {/* <button className="btn stop-btn" onClick={stopSpeaking} style={{ color: "white" }}>
              <FaStop /> Stop Speaking
            </button> */}
          </div>
          {showOptions && (
            <div className="options">
              <button className="btn demo-btn" onClick={handleDemoClick} style={{ color: "white" }}>
                Demo
              </button>
              <button className="btn continue-btn" onClick={handleContinueClick} style={{ color: "white" }}>
                Continue
              </button>
            </div>
          )}
        </div>
        {isDemoRunning && (
          <div className="end-demo">
            <button className="btn end-demo-btn" onClick={handleEndDemoClick} style={{ color: "white" }}>
              End Demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};