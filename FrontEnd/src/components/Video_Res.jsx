import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { Avatar } from "./Avatar";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { avatarAppConfig } from "../utility/config";
import { ConversationLogger } from "../utility/conversationLogger";
import { InsightsGenerator } from "../utility/insightsGenerator";
import { AppContainer, DemoVideoContainer, HiddenWrapper, VideoContainer, StyledVideo, ChatContainer, ChatInput, SendButton, StopSpeakingButton, AvatarContainer, MessageList, Message, StopButton, CloseButton } from "./styledComponents";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPaperPlane,
  FaVolumeMute,
} from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import ScreenshotDrawer from "./ScreenshotDrawer";
import MessageDrawer from "./MessageDrawer";

const Video_Res = () => {
  const [userId, setUserId] = useState(null); // State to store User ID
  const [mobile, setMobile] = useState(); // State to store mobile number
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
  const [isSessionStopped, setIsSessionStopped] = useState(false);
  const [conversationLogger, setConversationLogger] = useState(null);
  const isFirstMessage = useRef(true); // To track first message
  const [isAvatarSessionStarted, setAvatarSessionStarted] = useState(false);
  const avatarRef = useRef(); //Stop Spaking Avatar

  //Stop Spaking Avatar
  const handleStopSpeaking = () => {
    if (avatarRef.current) {
      avatarRef.current.stopSpeaking();
    }
  };

  const handleStopSession = async () => {
    // Stop video playback
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reset playback to the start
    }
  
    // Stop avatar session
    if (avatarRef.current) {
      avatarRef.current.stopSession();
    }
  
    // Stop microphone/speech recognition if active
    if (speechRecognizerRef.current) {
      speechRecognizerRef.current.stopContinuousRecognitionAsync(
        () => {
          console.log("Speech recognition stopped.");
        },
        (err) => {
          console.error("Error stopping speech recognition:", err);
        }
      );
      speechRecognizerRef.current = null; // Clean up reference
    }
    // Reset demo video
    if (demoVideoRef.current) {
      demoVideoRef.current.pause();
      demoVideoRef.current.currentTime = 0; // Reset playback
    }
    // Reset application state
    setIsSessionStopped(true);
    setAvatarSessionStarted(false);
    setIsDemoRunning(false);
    setShowHiddenContent(false);
    setUserPrompt("");
    setMessages([]);
    setScreenshots([]);
    setStatus("");
    setConversationId(uuidv4()); // Reset conversation ID

    if (conversationLogger) {
      // Log session end
      conversationLogger.addEntry({
        type: 'session_end',
        content: 'Session ended by user',
        metadata: {
          totalMessages: messages.length,
          duration: (new Date() - new Date(conversationLogger.startTime)) / 1000, // duration in seconds
          endTime: new Date().toISOString()
        }
      });
      
      try {
        // Add the conversation ended message to the existing messages
        const updatedMessages = [...messages, {
            role: "user",
            content: [
                {
                    type: "text",
                    text: "|END|"
                }
            ]
        }];
        const openAiResponse = await fetch(
          avatarAppConfig.conversationApiUrl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              conversation_id: conversationId,
              messages: updatedMessages, // Send the entire conversation history
            }),
          }
        );
  
        const openAiData = await openAiResponse.json();
        let carRecommendation;
        
        try {
          // Access the correct path in the response
          const assistantMessage = openAiData.choices[0].messages.find(
            msg => msg.role === "assistant"
          ).content;
          
          // Remove the markdown code block syntax and parse the JSON
          const jsonString = assistantMessage.replace(/```json\n|\n```/g, '');
          carRecommendation = JSON.parse(jsonString);
        } catch (e) {
          console.error('Failed to parse OpenAI response as JSON:', e);
          carRecommendation = {
            car_name: "Nissan Magnite",
            car_model: "MT TEKNA",
            color: "Grey",
            fuel_type: "Petrol",
            transmission: "Manual"
          };
        }
  
      // Use config for recommendation API
      await axios.post(avatarAppConfig.recommendationDbApiUrl, {
        user_id: userId,
        mobile: mobile,
        recommendation: carRecommendation
      });
  
        console.log('Recommendation sent successfully:', carRecommendation);
  
      } catch (error) {
        console.error('Error in recommendation process:', error);
      }
    
  }
    // Reset everything
    isFirstMessage.current = true; // Reset first message flag
    setConversationLogger(null);
    // Optionally restore scrolling if locked
    document.body.style.overflow = "auto";
  };

  useEffect(() => {
    if (isAvatarSessionStarted) {
      document.body.style.overflow = "hidden"; // Disable scrolling
      window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top smoothly
      
    } else {
      document.body.style.overflow = "auto"; // Enable scrolling
    }
  }, [isAvatarSessionStarted]);

    // Download logs function
    // const downloadConversationLogs = async() => {
    //   if (conversationLogger) {
    //     const logs = conversationLogger.getFormattedLog();
        
    //     const blob = new Blob([JSON.stringify(logs, null, 2)], { 
    //       type: 'application/json' 
    //     });
    //     const url = URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = `conversation_${conversationId}_${new Date().toISOString()}.json`;
    //     document.body.appendChild(a);
    //     a.click();
    //     document.body.removeChild(a);
    //     URL.revokeObjectURL(url);
    //   }
    // };

  const handleSaveUserInfo = (userInfo) => {
// First log the incoming data to debug
console.log("Received userInfo:", userInfo);

// Update conversationId with user name and mobile
const updatedConversationId = `${conversationId}+${userInfo.name}+${userInfo.mobile}`;
setConversationId(updatedConversationId);
console.log("Updated Conversation ID:", updatedConversationId);

// Only set userId if it exists in userInfo and current userId is not set
if (userInfo.userId && !userId) {
  console.log("Setting User ID:", userInfo.userId);
  setUserId(userInfo.userId);
}
setMobile(userInfo.mobile); // Update state with mobile number
console.log("Mobile Number Saved:", userInfo.mobile);

// Log the entire userInfo object
console.log("User Info Saved:", userInfo);
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

        // Initialize logger on first message
        if (isFirstMessage.current) {
          const logger = new ConversationLogger(conversationId);
          setConversationLogger(logger);
          isFirstMessage.current = false;
          
          // Log session start
          logger.addEntry({
            type: 'session_start',
            content: 'Conversation started',
            metadata: {
              videoSource: videoRef.current.src,
              timestamp: new Date().toISOString()
            }
          });
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

      // Log user message
      conversationLogger?.addEntry({
        type: 'user_message',
        content: prompt,
        metadata: {
          videoTimestamp: videoRef.current?.currentTime || 0,
          frameCapture: !!capturedFrame
        }
      });

    try {
      const response = await fetch(
        avatarAppConfig.conversationApiUrl,
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

           // Log API response
           conversationLogger?.addEntry({
            type: 'api_response',
            content: cleanMessage,
            metadata: {
              videoTimestamp: videoRef.current?.currentTime || 0,
              responseTime: new Date().toISOString()
            }
          });

      const newAssistantMessage = {
        role: "assistant",
        content: [{ type: "text", text: cleanMessage }],
      };
      const finalMessages = [...updatedMessages, newAssistantMessage];
      setMessages(finalMessages);
    } catch (error) {

        // Log error
        conversationLogger?.addEntry({
          type: 'error',
          content: error.message,
          metadata: {
            videoTimestamp: videoRef.current?.currentTime || 0,
            errorTime: new Date().toISOString()
          }
        });
  
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
        avatarAppConfig.cogSvcSubKey,
        avatarAppConfig.cogSvcRegion
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

  return (
    <AppContainer  isAvatarSessionStarted={isAvatarSessionStarted}>
     {/* Add download button only if conversation has started */}
     {/* {!isFirstMessage.current && (
        <button 
          onClick={downloadConversationLogs}
          style={{
            position: 'absolute',
            top: '20px',
            right: '100px',
            zIndex: 1002,
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Download Conversation
        </button>
      )} */}
      <CloseButton onClick={handleStopSession}><IoClose style={{height:"26px", width:"26px"}}/></CloseButton>
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
