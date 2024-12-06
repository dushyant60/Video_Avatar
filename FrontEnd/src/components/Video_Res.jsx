import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { Avatar } from './Avatar';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { avatarAppConfig } from './config';
import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane, FaStopCircle, FaVideoSlash } from 'react-icons/fa';
import VideoPicker from './VideoPicker'; // Import the new component
import ScreenshotDrawer from './ScreenshotDrawer';
import Caption from './Caption';
import MessageDrawer from './MessageDrawer';
const AppContainer = styled.div`
  // display: flex;
  // flex-direction: column;
  // align-items: center;
  height: 100vh;
  width: 100vw;
  background: url('/CBRE_bg.jpg') no-repeat center center;
  background-size: cover;
  position: relative;
  padding: 20px;
  overflow: hidden;

   @media (max-width: 768px) {
    padding: 5px; // Hide full message list below 768px
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
  display: ${props => (props.show ? 'flex' : 'none')};
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
  crossOrigin: 'anonymous'
}))`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 28px 28px 0 0;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);

`;
 
const UploadOverlay = styled.div`
  position: absolute;
  display: ${props => (props.show ? 'flex' : 'none')};
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #fff;
  gap:10px;
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
  min-width:400px;
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
 
  ${props => props.isQuestion ? 'justify-content: flex-start;' : 'justify-content: flex-end;'}
 
  span {
    background: ${props => props.isQuestion ? '#ffffff' : '#007bff'};
    color: ${props => props.isQuestion ? '#000' : '#ffffff'};
    border-radius: 8px;
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    padding: 10px;
    max-width: 60%;
    word-wrap: break-word;
  }
`;
 
// const ScreenshotContainer = styled.div`
//   display: ${props => props.show ? 'flex' : 'none'};
//   flex-wrap: wrap;
//   gap: 10px;
//   padding: 10px;
//   background-color: #f1f1f1;
//   border-radius: 8px;
//   margin-top: 20px;
//   position: absolute;
//   bottom: 120px;  
// `;
 
// const ScreenshotThumbnail = styled.div`
//   width: 150px;
//   height: 100px;
//   background-size: cover;
//   background-position: center;
//   border-radius: 8px;
// `;

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
 
const App = () => {
  const [videoSrc, setVideoSrc] = useState('https://isamblobstorage.blob.core.windows.net/isamfilecotainer/videos_nissan/CBRE_Video.mp4');
  const [userPrompt, setUserPrompt] = useState('');
  const [status, setStatus] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [messages, setMessages] = useState([]);
  const [recognizedText, setRecognizedText] = useState('');
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [showHiddenContent, setShowHiddenContent] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [conversationId, setConversationId] = useState(uuidv4());
  const videoRef = useRef(null);
  const demoVideoRef = useRef(null);
  const speechRecognizerRef = useRef(null);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);

  const toggleMessageDrawer = () => {
    setIsMessageDrawerOpen(!isMessageDrawerOpen);
  };


  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };


 
  const handleVideoUpload = event => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setStatus('Video loaded. You can now enter a prompt.');
      // setConversationId(uuidv4());
      // setMessages([]);
      // setScreenshots([]);
    }
  };
 
  const handleVideoSelect = (url) => {
    setVideoSrc(url);
    setStatus('Video loaded. You can now enter a prompt.');
    // setConversationId(uuidv4());
    // setMessages([]);
    // setScreenshots([]);
  };
 
  const handleStopVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setVideoSrc('');
    setStatus('Video stopped. You can select another video.');
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
      return canvas.toDataURL('image/jpeg').split(',')[1];
    }
  };
 
  const parseResponse = response => {
    return response
      .replace(/[#*]/g, '')
      .replace(/\[doc.*?\]/g, '')
      .replace(/-\s/g, ' ')
      .replace(/\n/g, ' ');
  };
 
  const handleSend = async (prompt = userPrompt) => {
    if (!videoRef.current || videoRef.current.ended) {
      setStatus('No video playing. Please upload a video.');
      return;
    }
 
    if (!prompt.trim()) {
      setStatus('User prompt is empty. Please enter a question.');
      return;
    }
 
    const capturedFrame = captureFrame();
    // setStatus('Sending data...');
    const newUserMessage = { role: 'user', content: [{'type':'text','text':prompt}]};
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
 
    const updatedChatHistory = [...messages, newUserMessage];
    setScreenshots([...screenshots, capturedFrame]);
 
    try {
      const response = await fetch('https://web-dpxjzr3ghqbg4-docker-dev-version.azurewebsites.net/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frame: capturedFrame,
          prompt,
          conversation_id: conversationId,
          messages: updatedChatHistory
        }),
      });
 
      const data = await response.json();
      const cleanMessage = parseResponse(data.message);
      setStatus(cleanMessage);

      const newAssistantMessage = { role: 'assistant', content: [{'type':'text','text':cleanMessage}] };
      const finalMessages = [...updatedMessages, newAssistantMessage];
      setMessages(finalMessages);
 
    } catch (error) {
      setStatus('Error sending data.');
      console.error('Error:', error);
    }
 
    setUserPrompt('');
  };
 
  const handleKeyPress = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
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
            console.error('Error stopping recognition:', err);
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
      speechRecognizerRef.current = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
  
      speechRecognizerRef.current.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const recognizedText = e.result.text.trim();
          if (recognizedText) {
            setUserPrompt(recognizedText);
            handleSend(recognizedText);
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
          console.error('Error starting recognition:', err);
          setIsMicrophoneActive(false);
        }
      );
    }
  };
 
  const handleDemoComplete = () => {
    setShowHiddenContent(true);
  };
 
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
    <AppContainer>
      <VideoContainer>
        {isDemoRunning && (
          <DemoVideoContainer>
            <video ref={demoVideoRef} autoPlay muted style={{ borderRadius: "20px", width: "100%", height: "calc(100vh - 100px)", objectFit: "cover" }}>
              <source src="https://isamblobstorage.blob.core.windows.net/isamfilecotainer/videos_nissan/CBRE_Video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </DemoVideoContainer>
        )}
        <HiddenWrapper show={showHiddenContent}>
          <StyledVideo ref={videoRef} src={videoSrc} loop controls controlsList='nofullscreen' autoPlay muted crossOrigin="anonymous"/>

          {/* <UploadOverlay show={!videoSrc}>
            <UploadButton>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-upload"
                viewBox="0 0 16 16"
              >
                <path d="M.5 9.9a.5.5 0 0 1 .5.1.5.5 0 0 1 .1.5v4.9A2 2 0 0 0 2 16h12a2 2 0 0 0 2-2-.5.5 0 0 1 .5-.5.5.5 0 0 1 .5.5A2.5 2.5 0 0 1-14 17H2a2.5 2.5 0 0 1-2.5-2.5V10a.5.5 0 0 1 .5-.5zm7.646-.854a.5.5 0 0 1 .708 0L11.5 4a.5.5 0 0 1-.707.707L8 1.707V10.5a.5.5 0 0 1-1 0V1.707L4.207 4.707a.5.5 0 1 1-.707-.707L7.646.854z" />
              </svg>
              Upload Video
              <input type="file" accept="video/*" onChange={handleVideoUpload} />
            </UploadButton>
            <VideoPicker onSelect={handleVideoSelect} /> Integrate the VideoPicker component
          </UploadOverlay> */}
        </HiddenWrapper>
        <AvatarContainer>
      <MessageList>
        {messages.map((msg, index) => (
          <Message key={index} isQuestion={msg.role === 'user'}>
            <span dangerouslySetInnerHTML={{ __html: msg.role === 'user' ? ` ${msg.content[0].text}` : ` ${msg.content[0].text}` }} />
          </Message>
        ))}
      </MessageList>

      <Avatar externalMessage={status} onDemoComplete={handleDemoComplete} onDemoStart={handleDemoStart} onDemoEnd={handleDemoEnd} />
      </AvatarContainer>
         
      </VideoContainer>

      <HiddenWrapper show={showHiddenContent}>
        <ChatContainer>
          <ChatInput
            value={userPrompt}
            onChange={e => setUserPrompt(e.target.value)}
            placeholder="Enter your question here..."
            onKeyPress={handleKeyPress}
          />
          <SendButton onClick={() => handleSend(userPrompt)}> <FaPaperPlane /> </SendButton>
          <SendButton onClick={handleMicrophoneClick}>
            {isMicrophoneActive ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </SendButton>
          {/* {videoSrc && <StopButton onClick={handleStopVideo}><FaVideoSlash/></StopButton>} */}
        </ChatContainer>
        <ScreenshotDrawer
          screenshots={screenshots}
          open={isDrawerOpen}
          toggleDrawer={toggleDrawer}
        />
        {/* <ScreenshotContainer show={screenshots.length > 0}>
          {screenshots.map((screenshot, index) => (
            <ScreenshotThumbnail
              key={index}
              style={{ backgroundImage: `url(data:image/jpeg;base64,${screenshot})` }}
            />
          ))}
        </ScreenshotContainer> */}

<MessageDrawer
  messages={messages}
  open={isMessageDrawerOpen}
  toggleDrawer={toggleMessageDrawer}
/>

        
      </HiddenWrapper>
    </AppContainer>
  );
};
 
export default App;

 