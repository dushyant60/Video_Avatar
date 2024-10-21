// Import necessary dependencies
import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Avatar } from './Avatar';
import { callAzureOpenAI } from './Utility';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #f0f0f0;
  position: relative;
  padding: 20px;
`;

const VideoContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: calc(100vh - 100px);
`;

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 28px 28px 0 0;
`;

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
  bottom: 80px;
  right: 20px;
`;

const App = () => {
  const [videoSrc, setVideoSrc] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [status, setStatus] = useState('');
  const videoRef = useRef();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setStatus('Video loaded. You can now enter a prompt.');
    }
  };

  const captureFrame = () => {
    if(videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg').split(',')[1]; // Base64 encoded frame
    }
  };

  const handleSend = async () => {
    if (!videoRef.current || videoRef.current.ended) {
      setStatus('No video playing. Please upload a video.');
      return;
    }

    if (!userPrompt) {
      setStatus('User prompt is empty. Please enter a question.');
      return;
    }

    const capturedFrame = captureFrame();

    setStatus('Sending data...');

    try {
      const response = await fetch('http://localhost:7000/analyze/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ frame: capturedFrame, prompt: userPrompt }),
      });

      const data = await response.json();
      setStatus(data.message);

    } catch (error) {
      setStatus('Error sending data.');
      console.error('Error:', error);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <AppContainer>
      <VideoContainer>
        <StyledVideo ref={videoRef} src={videoSrc} controls muted  />
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
              <path d="M.5 9.9a.5.5 0 0 1 .5.1.5.5 0 0 1 .1.5v4.9A2 2 0 0 0 2 16h12a2 2 0 0 0 2-2-.5.5 0 0 1 .5-.5.5.5 0 0 1 .5.5A2.5 2.5 0 0 1 14 17H2a2.5 2.5 0 0 1-2.5-2.5V10a.5.5 0 0 1 .5-.5zM7.646.854a.5.5 0 0 1 .708 0L11.5 4a.5.5 0 0 1-.707.707L8 1.707V10.5a.5.5 0 0 1-1 0V1.707L4.207 4.707a.5.5 0 1 1-.707-.707L7.646.854z" />
            </svg>
            Upload Video
            <input type="file" accept="video/*" onChange={handleVideoUpload}  />
          </UploadButton>
        </UploadOverlay>
      </VideoContainer>
      <ChatContainer>
        <ChatInput
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="Enter your question here..."
          onKeyPress={handleKeyPress}
        />
        <SendButton onClick={handleSend}>Send</SendButton>
      </ChatContainer>
      <AvatarContainer>
        <Avatar externalMessage={status} />
      </AvatarContainer>
    </AppContainer>
  );
};

export default App;