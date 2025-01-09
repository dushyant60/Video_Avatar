import "./Avatar.css";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import {
  createAvatarSynthesizer,
  createWebRTCConnection,
  makeBackgroundTransparent,
} from "../utility/Utility";
import { avatarAppConfig } from "../utility/config";
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { startSession } from "../utility/sessionutils";
import { FaStop } from "react-icons/fa";
import { UserInfoForm } from "./UserInfoForm";

export const Avatar = forwardRef(
  (
    {
      externalMessage,
      onDemoComplete,
      onDemoStart,
      onDemoEnd,
      onSessionStart,
      onSaveUserInfo,
      onSessionEnd,
    },
    ref // The ref passed from the parent component
  ) => {
  const [avatarSynthesizer, setAvatarSynthesizer] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [responseText, setResponseText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [showFormDelay, setShowFormDelay] = useState(false);
  const [userInfo, setUserInfo] = useState(null);


  const myAvatarVideoEleRef = useRef();
  const myAvatarAudioEleRef = useRef();
  const videoCanvasRef = useRef(null);

  
  useEffect(() => {
    if (isConnected && !isLoading) {
      const timer = setTimeout(() => {
        setShowFormDelay(true);
      }, 4000); // 2 seconds delay
  
      return () => clearTimeout(timer); // Cleanup timer if component unmounts
    } else {
      setShowFormDelay(false); // Hide form while loading or if not connected
    }
  }, [isConnected, isLoading]);

  const handleSaveUserInfo = (data) => {
    if (!userInfo) {
    setUserInfo(data);
    onSaveUserInfo(data);
    setShowForm(false);
    setShowOptions(true); // Show options after form submission
    onSessionStart();
    // console.log("User Info Saved:", data);
  
    // Extract first name from the full name (assuming 'data.name' contains the full name)
    const username = data.name ? data.name.split(' ')[0] : "User"; // Default to "User" if name is not provided
  
    if (avatarSynthesizer) {
      const message = `Hello ${username}! I'm here to help you explore the Nissan Magnite. You can choose to view a **comprehensive demo**, or feel free to **ask me any questions** you might have. Please select 'Demo' or 'Continue' to proceed.`;
      avatarSynthesizer
        .speakTextAsync(message)
        .then((result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log("Options message synthesized.");
          } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
            const cancellationDetails = SpeechSDK.CancellationDetails.fromResult(result);
            if (cancellationDetails.reason === SpeechSDK.CancellationReason.Error) {
              console.error(cancellationDetails.errorDetails);
            }
          }
        })
        .catch((error) => {
          console.error("Error synthesizing options message:", error);
          avatarSynthesizer.close();
        });
    }
  }
  };

  const {
    iceUrl,
    iceUsername,
    iceCredential,
    azureSpeechServiceKey,
    azureSpeechServiceRegion,
  } = avatarAppConfig;

  const introductionMessage = "Hello! I am your virtual assistant! Please fill in your details. To Continue for Demo!";
  const continuationMessage = "You can ask me anything regarding the Nissan Magnite.";

  useEffect(() => {
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

   // Ref functions
   const stopSpeaking = () => {
    if (avatarSynthesizer) {
      avatarSynthesizer
        .stopSpeakingAsync()
        .then(() => {
          console.log("Stopped speaking.");
        })
        .catch((error) => console.error(error));
    }
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    stopSpeaking,
    stopSession,
  }));
  

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
    setIsLoading(false);
    setShowForm(true); // Ensure form is visible again
    setShowFormDelay(false); // Reset form delay
    setUserInfo(null); // Clear user info
    setIsVideoVisible(false); // Hide video and canvas
    // Reset any other states that might affect the initial UI
  };;

  const startAvatarSession = () => {
    startSession(setIsLoading, setIsConnected, setAvatarSynthesizer, handleOnTrack);
    setIsVideoVisible(true);
    onSessionStart();
  };

  const introduceAvatar = () => {
    if (avatarSynthesizer) {
      avatarSynthesizer
        .speakTextAsync(introductionMessage)
        .then((result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            // setShowOptions(true);
          } else {
            if (result.reason === SpeechSDK.ResultReason.Canceled) {
              const cancellationDetails = SpeechSDK.CancellationDetails.fromResult(result);
              if (cancellationDetails.reason === SpeechSDK.CancellationReason.Error) {
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
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log("Speech and avatar synthesized to video stream.");
          } else {
            if (result.reason === SpeechSDK.ResultReason.Canceled) {
              const cancellationDetails = SpeechSDK.CancellationDetails.fromResult(result);
              if (cancellationDetails.reason === SpeechSDK.CancellationReason.Error) {
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
    onDemoStart();

    // Extract the first name from userInfo.name
  const username = userInfo.name ? userInfo.name.split(' ')[0] : "User"; // Default to "User" if name is not provided

    if (avatarSynthesizer) {
      avatarSynthesizer
        .speakTextAsync(`Hii ${username}!, Welcome to the Nissan Magnite experience! Now, if you’re looking for a compact SUV that outshines its rivals, you’re in the right place. First off, the design—bold, sporty, and unmistakable. The LED headlights and signature V-motion grille give it a commanding look that’s pure Nissan. And unlike others in this range, the Magnite’s compact build is perfect for the city, while still being spacious for weekend getaways. Inside, you’ll find high-quality materials, a digital instrument cluster, and a best-in-class 8-inch touchscreen with Android Auto and Apple CarPlay. Nissan has prioritized your comfort with generous legroom and headroom, ambient lighting, and seating for five. It’s premium all the way.When it comes to safety, the Magnite is in a league of its own. ABS, EBD, multiple airbags, and the option of a 360-degree surround-view camera give you unmatched peace of mind. Other SUVs at this price? They can’t quite match that.And under the hood, it’s all about power and efficiency. The 1.0-liter turbocharged engine gives you the thrill you want with the fuel economy you need. It’s designed for pure driving pleasure, without compromise. Simply put, the Nissan Magnite offers what other SUVs in this range can’t—a superior blend of style, comfort, tech, and power. It’s not just an SUV; it’s a statement.!`)
        .then((result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log("Demo message synthesized to video stream.");
          } else {
            if (result.reason === SpeechSDK.ResultReason.Canceled) {
              const cancellationDetails = SpeechSDK.CancellationDetails.fromResult(result);
              if (cancellationDetails.reason === SpeechSDK.CancellationReason.Error) {
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
    onDemoEnd();
    onDemoComplete();
    if (avatarSynthesizer) {
      avatarSynthesizer
        .stopSpeakingAsync()
        .then(() => {
          setTimeout(() => {
            avatarSynthesizer
              .speakTextAsync(continuationMessage)
              .then((result) => {
                if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                  console.log("Continuation message synthesized.");
                } else {
                  if (result.reason === SpeechSDK.ResultReason.Canceled) {
                    const cancellationDetails = SpeechSDK.CancellationDetails.fromResult(result);
                    if (cancellationDetails.reason === SpeechSDK.CancellationReason.Error) {
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
    onDemoComplete();
    if (avatarSynthesizer) {
      avatarSynthesizer
        .speakTextAsync(continuationMessage)
        .then((result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log("Continuation message synthesized.");
          } else {
            if (result.reason === SpeechSDK.ResultReason.Canceled) {
              const cancellationDetails = SpeechSDK.CancellationDetails.fromResult(result);
              if (cancellationDetails.reason === SpeechSDK.CancellationReason.Error) {
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
      {/* {showTooltip && (
        <div className="tooltip">
          Let's explore Nissan cars with a new avatar experience!
        </div>
      )} */}

{showForm && showFormDelay && <UserInfoForm onSave={handleSaveUserInfo} />}

      <>
        {!isConnected && !isLoading && (
          <div className="chat-bot-icon" onClick={startAvatarSession}>
            <img src="/avatarIcon.png" alt="Chat Bot" className="chat-bot-image" />
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

        {isVideoVisible && (
          <div className="avatar-card">
            <div className="avatar-video-wrapper">
              <video ref={myAvatarVideoEleRef} className="avatar-video"></video>
              <canvas ref={videoCanvasRef} className="video-canvas"></canvas>
              <audio ref={myAvatarAudioEleRef}></audio>
            </div>
          </div>
        )}
      </>
    </div>
  );
}
);