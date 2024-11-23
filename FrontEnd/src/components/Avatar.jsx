import "./Avatar.css";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import {
  createAvatarSynthesizer,
  createWebRTCConnection,
  makeBackgroundTransparent,
} from "./Utility";
import { avatarAppConfig } from "./config";
import { useState, useRef, useEffect } from "react";
import { FaPlug, FaTimes, FaStop, FaCommentDots } from "react-icons/fa";


export const Avatar = ({
  externalMessage,
  onDemoComplete,
  onDemoStart,
  onDemoEnd,
}) => {
  const [avatarSynthesizer, setAvatarSynthesizer] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [responseText, setResponseText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const [showTooltip, setShowTooltip] = useState(true); // New tooltip state

  const myAvatarVideoEleRef = useRef();
  const myAvatarAudioEleRef = useRef();
  const videoCanvasRef = useRef(null);

  const {
    iceUrl,
    iceUsername,
    iceCredential,
    azureSpeechServiceKey,
    azureSpeechServiceRegion,
  } = avatarAppConfig;

  const introductionMessage =
    "Hello! I am your AI assistant. Would you like a demo of the Royal Enfield Bike or do you have any questions about it?";
  const demoMessage =
    "Welcome to the Royal Enfield Classic 350, where timeless design meets modern engineering. With its iconic teardrop tank, vintage chrome accents, and signature headlamp, the Classic 350 embodies motorcycling heritage. Powered by a refined 349cc J-series engine, it offers smooth performance, exceptional fuel efficiency, and unmatched riding comfort—ideal for both city commutes and open-road adventures. Safety is paramount, with dual-channel ABS, disc brakes, and a sturdy chassis ensuring a confident ride. Modern touches like a semi-digital cluster and turn-by-turn navigation seamlessly blend tradition with technology. The Royal Enfield Classic 350 isn’t just a motorcycle—it’s a legacy on wheels. Ride with purpose. Ride Royal";
  const continuationMessage =
    "You can ask me anything regarding Royal Enfield Classic 350.";

  useEffect(() => {
    // Hide tooltip after 10 seconds
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (externalMessage) {
      handleSpeechRecognitionResult(externalMessage);
    }
  }, [externalMessage]);

  useEffect(() => {
    if (isConnected) {
      introduceAvatar();
    }
  }, [isConnected]);

  const handleOnTrack = (event) => {
    if (event.track.kind === "video") {
      const videoElement = myAvatarVideoEleRef.current;
      const canvas = videoCanvasRef.current;

      videoElement.srcObject = event.streams[0];
      videoElement.autoplay = true;
      videoElement.playsInline = true;

      videoElement.addEventListener("loadedmetadata", () => {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
      });

      const context = canvas.getContext("2d", { willReadFrequently: true });

      videoElement.addEventListener("play", () => {
        makeBackgroundTransparent(videoElement, canvas, context);
      });
    } else if (event.track.kind === "audio") {
      const audioPlayer = myAvatarAudioEleRef.current;
      audioPlayer.srcObject = event.streams[0];
      audioPlayer.autoplay = true;
      audioPlayer.muted = false;

      audioPlayer.addEventListener("loadedmetadata", () => {
        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Audio playback failed: ", error);
          });
        }
      });
    }
  };

  const stopSpeaking = () => {
    if (avatarSynthesizer) {
      avatarSynthesizer
        .stopSpeakingAsync()
        .then(() => {
          console.log("Stop speaking request sent.");
        })
        .catch((error) => console.error(error));
    }
  };

  const stopSession = () => {
    if (avatarSynthesizer) {
      avatarSynthesizer
        .stopSpeakingAsync()
        .then(() => {
          avatarSynthesizer.close();
          resetState();
        })
        .catch((error) => console.error(error));
    } else {
      resetState();
    }
  };

  const resetState = () => {
    setAvatarSynthesizer(null);
    setRecognizedText("");
    setResponseText("");
    setIsConnected(false);
    setShowOptions(false);
    setIsDemoRunning(false);
    // Add any other state resets here if needed
  };

  // const startSession = () => {
  //   setIsLoading(true); // Indicate the session is starting
  
  //   const peerConnection = createWebRTCConnection();
  //   const avatarSynthesizerInstance = createAvatarSynthesizer();
  
  //   setAvatarSynthesizer(avatarSynthesizerInstance);
  
  //   peerConnection.ontrack = handleOnTrack; // Handle incoming media streams
  //   peerConnection.addTransceiver("video", { direction: "sendrecv" });
  //   peerConnection.addTransceiver("audio", { direction: "sendrecv" });
  
  //   peerConnection.oniceconnectionstatechange = () => {
  //     const state = peerConnection.iceConnectionState;
  //     console.log(`ICE connection state: ${state}`);
  
  //     if (state === "connected") {
  //       setIsConnected(true);
  //       setIsLoading(false);
  //     } else if (state === "failed" || state === "disconnected") {
  //       setIsConnected(false);
  //       setIsLoading(false);
  //     }
  //   };
  
  //   avatarSynthesizerInstance
  //     .startAvatarAsync(peerConnection)
  //     .then(() => console.log("Avatar started."))
  //     .catch((error) => {
  //       console.error("Avatar failed to start:", error);
  //       setIsLoading(false);
  //     });
  // };

  const startSession = async () => {
    setIsLoading(true); // Indicate the session is starting
    
    try {
      // Wait for the WebRTC connection to be established
      const peerConnection = await createWebRTCConnection();
      const avatarSynthesizerInstance = createAvatarSynthesizer();
      
      setAvatarSynthesizer(avatarSynthesizerInstance);
    
      // Handle incoming media streams
      peerConnection.ontrack = handleOnTrack;
      peerConnection.addTransceiver("video", { direction: "sendrecv" });
      peerConnection.addTransceiver("audio", { direction: "sendrecv" });
    
      // Monitor ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        console.log(`ICE connection state: ${state}`);
    
        if (state === "connected") {
          setIsConnected(true);
          setIsLoading(false);
        } else if (state === "failed" || state === "disconnected") {
          setIsConnected(false);
          setIsLoading(false);
        }
      };
    
      // Start the avatar session asynchronously
      await avatarSynthesizerInstance.startAvatarAsync(peerConnection);
      console.log("Avatar started.");
    } catch (error) {
      console.error("Error starting session:", error);
      setIsLoading(false);
    }
  };

  const introduceAvatar = () => {
    if (avatarSynthesizer) {
      avatarSynthesizer
        .speakTextAsync(introductionMessage)
        .then((result) => {
          if (
            result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted
          ) {
            setShowOptions(true);
          } else {
            if (result.reason === SpeechSDK.ResultReason.Canceled) {
              const cancellationDetails =
                SpeechSDK.CancellationDetails.fromResult(result);
              if (
                cancellationDetails.reason ===
                SpeechSDK.CancellationReason.Error
              ) {
                console.error(cancellationDetails.errorDetails);
              }
            }
          }
        })
        .catch((error) => {
          console.error("Error synthesizing speech:", error);
          avatarSynthesizer.close();
        });
    }
  };

  const cleanText = (text) => {
    return text.replace(/[*_~`]/g, "").replace(/\[doc\d+\]/g, "");
  };

  const handleSpeechRecognitionResult = async (userQuery) => {
    const response = userQuery;
    const cleanedResponse = cleanText(response);
    setResponseText(cleanedResponse);

    if (avatarSynthesizer) {
      const audioPlayer = myAvatarAudioEleRef.current;
      audioPlayer.muted = false;
      const playPromise = audioPlayer.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Audio playback failed: ", error);
        });
      }
      avatarSynthesizer
        .speakTextAsync(cleanedResponse)
        .then((result) => {
          if (
            result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted
          ) {
            console.log("Speech and avatar synthesized to video stream.");
          } else {
            if (result.reason === SpeechSDK.ResultReason.Canceled) {
              const cancellationDetails =
                SpeechSDK.CancellationDetails.fromResult(result);
              if (
                cancellationDetails.reason ===
                SpeechSDK.CancellationReason.Error
              ) {
                console.error(cancellationDetails.errorDetails);
              }
            }
          }
        })
        .catch((error) => {
          console.error("Error synthesizing speech:", error);
          avatarSynthesizer.close();
        });
    }
  };

  const handleDemoClick = () => {
    setShowOptions(false);
    setIsDemoRunning(true);
    document.querySelector(".avatar-card").classList.add("shrink");
    onDemoStart(); // Trigger demo start handler
    if (avatarSynthesizer) {
      avatarSynthesizer
        .speakTextAsync(demoMessage)
        .then((result) => {
          if (
            result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted
          ) {
            console.log("Demo message synthesized to video stream.");
          } else {
            if (result.reason === SpeechSDK.ResultReason.Canceled) {
              const cancellationDetails =
                SpeechSDK.CancellationDetails.fromResult(result);
              if (
                cancellationDetails.reason ===
                SpeechSDK.CancellationReason.Error
              ) {
                console.error(cancellationDetails.errorDetails);
              }
            }
          }
        })
        .catch((error) => {
          console.error("Error synthesizing demo:", error);
          avatarSynthesizer.close();
        });
    }
  };

  const handleEndDemoClick = () => {
    setIsDemoRunning(false);
    document.querySelector(".avatar-card").classList.add("shrink");
    onDemoEnd(); // Trigger demo end handler
    onDemoComplete();
    if (avatarSynthesizer) {
      avatarSynthesizer
        .stopSpeakingAsync()
        .then(() => {
          setTimeout(() => {
            avatarSynthesizer
              .speakTextAsync(continuationMessage)
              .then((result) => {
                if (
                  result.reason ===
                  SpeechSDK.ResultReason.SynthesizingAudioCompleted
                ) {
                  console.log("Continuation message synthesized.");
                } else {
                  if (result.reason === SpeechSDK.ResultReason.Canceled) {
                    const cancellationDetails =
                      SpeechSDK.CancellationDetails.fromResult(result);
                    if (
                      cancellationDetails.reason ===
                      SpeechSDK.CancellationReason.Error
                    ) {
                      console.error(cancellationDetails.errorDetails);
                    }
                  }
                }
              })
              .catch((error) => {
                console.error("Error synthesizing continuation:", error);
                avatarSynthesizer.close();
              });
          }, 1000);
        })
        .catch((error) => {
          console.error("Error stopping demo message:", error);
        });
    }
  };

  const handleContinueClick = () => {
    setShowOptions(false);
    setIsDemoRunning(false);
    document.querySelector(".avatar-card").classList.add("shrink");
    onDemoComplete(); // Ensure the video upload is shown first
    if (avatarSynthesizer) {
      avatarSynthesizer
        .speakTextAsync(continuationMessage)
        .then((result) => {
          if (
            result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted
          ) {
            console.log("Continuation message synthesized.");
          } else {
            if (result.reason === SpeechSDK.ResultReason.Canceled) {
              const cancellationDetails =
                SpeechSDK.CancellationDetails.fromResult(result);
              if (
                cancellationDetails.reason ===
                SpeechSDK.CancellationReason.Error
              ) {
                console.error(cancellationDetails.errorDetails);
              }
            }
          }
        })
        .catch((error) => {
          console.error("Error synthesizing continuation:", error);
          avatarSynthesizer.close();
        });
    }
  };

  return (
    <div className="avatar-container">
      {showTooltip && (
        <div className="tooltip">
          Let's explore Royal Enfield Bikes with a new avatar experience!
        </div>
      )}
      {!isConnected && !isLoading && (
        <div className="chat-bot-icon" onClick={startSession}>
          <img src="avatar__icon.png" alt="Chat Bot" className="chat-bot-image" />
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      {showOptions && (
        <div className="options">
          <button className="btn demo-btn" onClick={handleDemoClick}>
            Demo
          </button>
          <button className="btn continue-btn" onClick={handleContinueClick}>
            Continue
          </button>
        </div>
      )}
      {isDemoRunning && (
        <div className="end-demo">
          <button className="btn end-demo-btn" onClick={handleEndDemoClick}>
            End Demo
          </button>
        </div>
      )}
      <div className="avatar-card">
        <div className="avatar-video-wrapper">
          <video ref={myAvatarVideoEleRef} className="avatar-video"></video>
          <canvas ref={videoCanvasRef} className="video-canvas"></canvas>
          <audio ref={myAvatarAudioEleRef}></audio>
        </div>
      </div>
    </div>
  );
};
