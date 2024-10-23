import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Avatar } from './Avatar'; // Import Avatar component
import { callAzureOpenAI } from './Utility'; // Import utility function
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { avatarAppConfig } from './config'; // Import configuration
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';


// Styled component for the main container
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #bfbfbf;
  position: relative;
  padding: 20px;
`;

// Styled component for the container holding the video
const VideoContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: calc(100vh - 100px);
`;

// Styled component for the video element
const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 28px 28px 0 0;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
`;

// Styled component for the upload overlay
const UploadOverlay = styled.div`
  position: absolute;
  display: ${(props) => (props.show ? 'flex' : 'none')};
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #fff;
`;

// Styled component for the upload button
const UploadButton = styled.label`
  display: flex;
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

// Styled component for the chat container
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

// Styled component for the chat input
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

// Styled component for the send button
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

// Styled component for the avatar container
const AvatarContainer = styled.div`
  z-index: 10;
  position: absolute;
  bottom: 0px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 40%;
  height: 99%;
  justify-content: flex-end;
`;

// Styled component for the message container
const MessageList = styled.div`
  width: 80%;
  padding: 20px;
  box-sizing: border-box;
  // height: 25vh;
  overflow-y: scroll;

  /* Hide scrollbar for Webkit browsers */
  &::-webkit-scrollbar {
    width: 0px;
    background: transparent; /* Optional: just to avoid memory usage :) */
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
`;

const Message = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;

  ${(props) => (props.isQuestion ? 'justify-content: flex-start;' : 'justify-content: flex-end;')}

  span {
    background: ${(props) => (props.isQuestion ? '#ffffff' : '#007bff')};
    color: ${(props) => (props.isQuestion ? '#000' : '#ffffff')};
    border-radius: 8px;
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    padding: 10px;
    max-width: 60%;
    word-wrap: break-word;
  }
`;

// Styled component for the screenshot thumbnails
const ScreenshotContainer = styled.div`
  display: ${(props) => (props.show ? 'flex' : 'none')};
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  background-color: #f1f1f1;
  border-radius: 8px;
  margin-top: 20px;
  position: absolute;
  bottom: 120px;  
`;

// Styled component for individual screenshot thumbnails
const ScreenshotThumbnail = styled.div`
  width: 150px;
  height: 100px;
  background-size: cover;
  background-position: center;
  border-radius: 8px;
`;  

const App = () => {
  const [videoSrc, setVideoSrc] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [status, setStatus] = useState('');
  const [screenshots, setScreenshots] = useState([]); 
  const [messages, setMessages] = useState([]); // Store messages as an array of objects
  const videoRef = useRef();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const speechRecognizerRef = useRef(null);


  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setStatus('Video loaded. You can now enter a prompt.');
    }
  };

  const captureFrame = () => {
    if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg').split(',')[1]; // Base64 encoded frame
    }
  };

  const parseResponse = (response) => {
    let formattedResponse = response
      .replace(/[#*]/g, '') // Remove # and *
      .replace(/\[doc.*?\]/g, '') // Remove [doc1], [doc2], ... 
      .replace(/-\s/g, ' ') // Replace dash-space with HTML list item
      .replace(/\n/g, ' ') // Replace newline with HTML break

    return formattedResponse;
  }

  const handleSend = async (prompt = userPrompt) => {
    if (!videoRef.current || videoRef.current.ended) {
      setStatus('No video playing. Please upload a video.');
      return;
    }

    if (!prompt) {
      setStatus('User prompt is empty. Please enter a question.');
      return;
    }

    const capturedFrame = captureFrame();
    const currentMessage = `Q: ${prompt}`;

    setStatus('Sending data...');
    setMessages([...messages, { type: 'question', text: prompt }]);
    setScreenshots([...screenshots, capturedFrame]);

    try {
      const response = await fetch('http://localhost:7000/analyze/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ frame: capturedFrame, prompt }),
      });

      const data = await response.json();
      const cleanMessage = parseResponse(data.message);
      setStatus(cleanMessage);
      setMessages([...messages, { type: 'question', text: prompt }, { type: 'answer', text: cleanMessage }]);
    } catch (error) {
      setStatus('Error sending data.');
      console.error('Error:', error);
    }

    setUserPrompt(''); // Clear the input field after sending
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleMicrophoneClick = () => {
    if (isMicrophoneActive) {
      speechRecognizerRef.current.stopContinuousRecognitionAsync();
      setIsMicrophoneActive(false);
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
            handleSend(recognizedText); // Auto-send the recognized text
          }
        }
      };

      speechRecognizerRef.current.canceled = (s, e) => {
        if (e.reason === SpeechSDK.CancellationReason.Error) {
          console.error(`Error: ${e.errorDetails}`);
        }
        setIsMicrophoneActive(false);
      };

      speechRecognizerRef.current.startContinuousRecognitionAsync();
      setIsMicrophoneActive(true);
    }
  };

  return (
    <AppContainer>
      <VideoContainer>
        <StyledVideo ref={videoRef} src={videoSrc} controls muted />
        <UploadOverlay show={!videoSrc}>
          <UploadButton>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-upload"
              viewBox="0 0 16 16"
            >
              <path d="M.5 9.9a.5.5 0 0 1 .5.1.5.5 0 0 1 .1.5v4.9A2 2 0 0 0 2 16h12a2 2 0 0 0 2-2-.5.5 0 0 1 .5-.5.5.5 0 0 1 .5.5A2.5 2.5 0 0 1-14 17H2a2.5 2.5 0 0 1-2.5-2.5V10a.5.5 0 0 1 .5-.5zM7.646.854a.5.5 0 0 1 .708 0L11.5 4a.5.5 0 0 1-.707.707L8 1.707V10.5a.5.5 0 0 1-1 0V1.707L4.207 4.707a.5.5 0 1 1-.707-.707L7.646.854z" />
            </svg>
            Upload Video
            <input type="file" accept="video/*" onChange={handleVideoUpload} />
          </UploadButton>
        </UploadOverlay>
        <AvatarContainer>
          <MessageList>
            {messages.map((msg, index) => (
              <Message key={index} isQuestion={msg.type === 'question'}>
                <span dangerouslySetInnerHTML={{ __html: msg.type === 'question' ? `Q: ${msg.text}` : `A: ${msg.text}` }} />
              </Message>
            ))}
          </MessageList>
          <Avatar externalMessage={status} /> {/* Avatar component to speak the response */}
        </AvatarContainer>
      </VideoContainer>
      <ChatContainer>
        <ChatInput
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="Enter your question here..."
          onKeyPress={handleKeyPress}
        />
        <SendButton onClick={() => handleSend(userPrompt)}>Send</SendButton>
        <SendButton onClick={handleMicrophoneClick}>
          {isMicrophoneActive ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </SendButton>
      </ChatContainer>

      <ScreenshotContainer show={screenshots.length > 0}>
        {screenshots.map((screenshot, index) => (
          <ScreenshotThumbnail
            key={index}
            style={{ backgroundImage: `url(data:image/jpeg;base64,${screenshot})` }}
          />
        ))}
      </ScreenshotContainer>
    </AppContainer>
  );
};

export default App;