import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";
import { Avatar } from "./Avatar";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { avatarAppConfig } from "../utility/config";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPaperPlane,
  FaVolumeMute,
} from "react-icons/fa";
import ScreenshotDrawer from "./ScreenshotDrawer";
import MessageDrawer from "./MessageDrawer";

const AppContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: ${({ isAvatarSessionStarted }) => (isAvatarSessionStarted ? "100%" : "0%")};
  height: ${({ isAvatarSessionStarted }) => (isAvatarSessionStarted ? "100%" : "0%")};
  z-index: 1000; 
  background: rgba(0, 0, 0, 0.4);
  padding: ${({ isAvatarSessionStarted }) => (isAvatarSessionStarted ? "20px" : "0px")};

  @media (max-width: 768px) {
    padding: ${({ isAvatarSessionStarted }) => (isAvatarSessionStarted ? "5px" : "0px")};
  }
`;

const DemoVideoContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: calc(100vh - 100px);
  margin-top: 45px; // Add margin to lower the position
`;

const HiddenWrapper = styled.div`
  display: ${(props) => (props.show ? "flex" : "none")};
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const VideoContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: calc(100vh - 100px);
`;

// Add crossOrigin attribute to the video element
const StyledVideo = styled.video.attrs(() => ({
  crossOrigin: "anonymous",
}))`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 28px 28px 0 0;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
`;

const UploadOverlay = styled.div`
  position: absolute;
  display: ${(props) => (props.show ? "flex" : "none")};
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #fff;
  gap: 10px;
`;

const UploadButton = styled.label`
  display: none;
  align-items: center;
  justify-content: center;
  padding: 12px;
  margin: 10px 0;
  border: none;
  border-radius: 6px;
  background-color: #28a745;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #218838;
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    transform: translateY(-3px);
  }

  input {
    display: none;
  }

  svg {
    margin-right: 8px;
  }
`;

const ChatContainer = styled.div`
  width: 100%;
  display: flex;
  padding: 10px;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  z-index: 12;
  flex-direction: row-reverse;
  gap: 10px;
`;

const ChatInput = styled.textarea`
  flex: 1;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 12px;
  resize: none;
  font-size: 14px;
  box-sizing: border-box;
  height: 50px;
  margin-right: 10px;
`;

const SendButton = styled.button`
  padding: 12px;
  border: none;
  border-radius: 6px;
  background-color: #007bff;
  color: white;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #0056b3;
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    transform: translateY(-3px);
  }
`;

const StopSpeakingButton = styled(SendButton)`
  background-color: #dc3545; /* Red color */
  
  &:hover {
    background-color: #c82333; /* Darker red on hover */
  }
`;


const AvatarContainer = styled.div`
  z-index: 10;
  position: absolute;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: 40%;
  height: 95%;
  // justify-content: flex-end;
`;

const MessageList = styled.div`
  width: 100%;
  min-width: 400px;
  // height: 75%;
  padding: 10px;
  box-sizing: border-box;
  overflow-y: scroll;
  max-height: 35%;
  z-index: 99;
  &::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  @media (max-width: 768px) {
    display: none; // Hide full message list below 768px
  }
`;

const Message = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;

  ${(props) =>
    props.isQuestion
      ? "justify-content: flex-start;"
      : "justify-content: flex-end;"}

  span {
    background: ${(props) => (props.isQuestion ? "#ffffff" : "#007bff")};
    color: ${(props) => (props.isQuestion ? "#000" : "#ffffff")};
    border-radius: 8px;
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    padding: 10px;
    max-width: 60%;
    word-wrap: break-word;
  }
`;
const StopButton = styled.button`
  padding: 12px;
  border: none;
  border-radius: 6px;
  background-color: #dc3545;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  z-index: 9999;

  &:hover {
    background-color: #c82333;
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    transform: translateY(-3px);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  z-index: 1001;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #c82333;
  }
`;

const Video_Res = () => {
  const [videoSrc, setVideoSrc] = useState(
    "https://isamblobstorage.blob.core.windows.net/isamfilecotainer/videos_nissan/2021 Nissan Magnite.mp4"
  );
  const [userPrompt, setUserPrompt] = useState("");
  const [status, setStatus] = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [showHiddenContent, setShowHiddenContent] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [conversationId, setConversationId] = useState(uuidv4());
  const videoRef = useRef(null);
  const [prefetchedVideo, setPrefetchedVideo] = useState(null); // For storing the preloaded Blob URL
  const demoVideoRef = useRef(null);
  const speechRecognizerRef = useRef(null);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);

  const [isAvatarSessionStarted, setAvatarSessionStarted] = useState(false);
  const avatarRef = useRef(); //Stop Spaking Avatar


  //Stop Spaking Avatar
  const handleStopSpeaking = () => {
    if (avatarRef.current) {
      avatarRef.current.stopSpeaking();
    }
  };

  useEffect(() => {
    if (isAvatarSessionStarted) {
      document.body.style.overflow = "hidden"; // Disable scrolling
      window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top smoothly
    } else {
      document.body.style.overflow = "auto"; // Enable scrolling
    }
  }, [isAvatarSessionStarted]);

  const handleSaveUserInfo = (userInfo) => {
    // Update conversationId with user name and mobile
    const updatedConversationId = `${conversationId}+${userInfo.name}+${userInfo.mobile}`;
    setConversationId(updatedConversationId);
    console.log("Updated Conversation ID:", updatedConversationId);
  };

  useEffect(() => {
    // Handle session start or other side effects
  }, [conversationId]);

  const toggleMessageDrawer = () => {
    setIsMessageDrawerOpen(!isMessageDrawerOpen);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
      return canvas.toDataURL("image/jpeg").split(",")[1];
    }
  };

  const parseResponse = (response) => {
    return response
      .replace(/[#*]/g, "")
      .replace(/\[doc.*?\]/g, "")
      .replace(/-\s/g, " ")
      .replace(/\n/g, " ");
  };

  const handleSend = async (prompt = userPrompt) => {
    if (!videoRef.current || videoRef.current.ended) {
      setStatus("No video playing. Please upload a video.");
      return;
    }

    if (!prompt.trim()) {
      setStatus("User prompt is empty. Please enter a question.");
      return;
    }

    const capturedFrame = captureFrame();
    // setStatus('Sending data...');
    const newUserMessage = {
      role: "user",
      content: [{ type: "text", text: prompt }],
    };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    const updatedChatHistory = [...messages, newUserMessage];
    setScreenshots([...screenshots, capturedFrame]);

    try {
      const response = await fetch(
        "https://web-dpxjzr3ghqbg4-docker-dev-version.azurewebsites.net/api/conversation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            frame: capturedFrame,
            prompt,
            conversation_id: conversationId,
            messages: updatedChatHistory,
          }),
        }
      );

      const data = await response.json();
      const cleanMessage = parseResponse(data.message);
      setStatus(cleanMessage);

      const newAssistantMessage = {
        role: "assistant",
        content: [{ type: "text", text: cleanMessage }],
      };
      const finalMessages = [...updatedMessages, newAssistantMessage];
      setMessages(finalMessages);
    } catch (error) {
      setStatus("Error sending data.");
      console.error("Error:", error);
    }

    setUserPrompt("");
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleMicrophoneClick = () => {
    if (isMicrophoneActive) {
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.stopContinuousRecognitionAsync(
          () => {
            setIsMicrophoneActive(false);
          },
          (err) => {
            console.error("Error stopping recognition:", err);
            setIsMicrophoneActive(false);
          }
        );
      }
    } else {
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        avatarAppConfig.azureSpeechServiceKey,
        avatarAppConfig.azureSpeechServiceRegion
      );
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      speechRecognizerRef.current = new SpeechSDK.SpeechRecognizer(
        speechConfig,
        audioConfig
      );
  
      speechRecognizerRef.current.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const recognizedText = e.result.text.trim();
          if (recognizedText) {
            setUserPrompt(recognizedText);
            handleSend(recognizedText);
  
            // Auto stop microphone when a phrase is recognized
            speechRecognizerRef.current.stopContinuousRecognitionAsync(
              () => {
                setIsMicrophoneActive(false);
              },
              (err) => {
                console.error("Error stopping recognition:", err);
                setIsMicrophoneActive(false);
              }
            );
          }
        }
      };
  
      speechRecognizerRef.current.canceled = (s, e) => {
        if (e.reason === SpeechSDK.CancellationReason.Error) {
          console.error(`Error: ${e.errorDetails}`);
        }
        setIsMicrophoneActive(false);
      };
  
      speechRecognizerRef.current.startContinuousRecognitionAsync(
        () => {
          setIsMicrophoneActive(true);
        },
        (err) => {
          console.error("Error starting recognition:", err);
          setIsMicrophoneActive(false);
        }
      );
    }
  };

  const handleDemoComplete = () => {
    setShowHiddenContent(true);
  };

  // Prefetch the video when the component mounts
  useEffect(() => {
    const prefetchVideo = async () => {
      const videoUrl = 'https://isamblobstorage.blob.core.windows.net/isamfilecotainer/videos_nissan/CBRE_Video.mp4';
      try {
        const response = await fetch(videoUrl); // Fetch the video
        const videoBlob = await response.blob(); // Convert it to a Blob
        const videoBlobUrl = URL.createObjectURL(videoBlob); // Create a local Blob URL
        setPrefetchedVideo(videoBlobUrl); // Store the Blob URL
      } catch (error) {
        console.error('Failed to prefetch the video:', error);
      }
    };

    prefetchVideo();
  }, []);

  const handleDemoStart = () => {
    setIsDemoRunning(true);
    if (demoVideoRef.current) {
      demoVideoRef.current.play();
    }
  };

  const handleDemoEnd = () => {
    if (demoVideoRef.current) {
      demoVideoRef.current.pause();
      demoVideoRef.current.currentTime = 0;
    }
    setIsDemoRunning(false);
  };

  useEffect(() => {
    if (isDemoRunning && demoVideoRef.current) {
      demoVideoRef.current.play();
    }
  }, [isDemoRunning]);

  const handleQuit = () => {
    // Reset all states
    setAvatarSessionStarted(false);
    setMessages([]);
    setUserPrompt("");
    setVideoSrc(
      "https://isamblobstorage.blob.core.windows.net/isamfilecotainer/videos_nissan/2021 Nissan Magnite.mp4"
    );
    setScreenshots([]);
    setStatus("");
    setIsDemoRunning(false);
    setShowHiddenContent(false);
  
    // Clean up microphone if active
    if (speechRecognizerRef.current) {
      speechRecognizerRef.current.stopContinuousRecognitionAsync();
      speechRecognizerRef.current = null;
    }
  };
  

  return (
    <AppContainer  isAvatarSessionStarted={isAvatarSessionStarted}>
      {/* <CloseButton onClick={handleQuit}>Close</CloseButton> */}
      <VideoContainer>
        {isDemoRunning && (
          <DemoVideoContainer>
            <video
              ref={demoVideoRef}
              autoPlay
              muted
              style={{
                borderRadius: "20px",
                width: "100%",
                height: "calc(100vh - 100px)",
                objectFit: "cover",
              }}
            >
              <source
                src="https://isamblobstorage.blob.core.windows.net/isamfilecotainer/videos_nissan/2021 Nissan Magnite.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </DemoVideoContainer>
        )}
        <HiddenWrapper show={showHiddenContent}>
          <StyledVideo
            ref={videoRef}
            src={videoSrc}
            loop
            controls
            controlsList="nofullscreen"
            autoPlay
            muted
          />
        </HiddenWrapper>
        <AvatarContainer>
          <MessageList>
            {messages.map((msg, index) => (
              <Message key={index} isQuestion={msg.role === "user"}>
                <span
                  dangerouslySetInnerHTML={{
                    __html:
                      msg.role === "user"
                        ? ` ${msg.content[0].text}`
                        : ` ${msg.content[0].text}`,
                  }}
                />
              </Message>
            ))}
          </MessageList>
          <Avatar
            ref={avatarRef} 
            externalMessage={status}
            onDemoComplete={handleDemoComplete}
            onDemoStart={handleDemoStart}
            onDemoEnd={handleDemoEnd}
            onSessionStart={() => setAvatarSessionStarted(true)} 
            onSessionEnd={() => setAvatarSessionStarted(false)}
            onSaveUserInfo={handleSaveUserInfo}
          />
        </AvatarContainer>
      </VideoContainer>

      <HiddenWrapper show={showHiddenContent}>
        <ChatContainer>
          <ChatInput
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Enter your question here..."
            onKeyPress={handleKeyPress}
          />
          <SendButton onClick={() => handleSend(userPrompt)}>
            {" "}
            <FaPaperPlane />{" "}
          </SendButton>
          <SendButton onClick={handleMicrophoneClick}>
            {isMicrophoneActive ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </SendButton>
          <StopSpeakingButton onClick={handleStopSpeaking}>
        <FaVolumeMute />
        </StopSpeakingButton>
        </ChatContainer>
        <ScreenshotDrawer
          screenshots={screenshots}
          open={isDrawerOpen}
          toggleDrawer={toggleDrawer}
        />
        <MessageDrawer
          messages={messages}
          open={isMessageDrawerOpen}
          toggleDrawer={toggleMessageDrawer}
        />
      </HiddenWrapper>
    </AppContainer>
  );
};

export default Video_Res;
