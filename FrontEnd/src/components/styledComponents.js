// FrontEnd/src/components/styledComponents.js
import styled from "styled-components";

export const AppContainer = styled.div`
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

// Add other styled components here
export const DemoVideoContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: calc(100vh - 100px);
  margin-top: 45px; // Add margin to lower the position
`;

export const HiddenWrapper = styled.div`
  display: ${(props) => (props.show ? "flex" : "none")};
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
`;

export const VideoContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: calc(100vh - 100px);
`;

export const StyledVideo = styled.video.attrs(() => ({
  crossOrigin: "anonymous",
}))`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 28px 28px 0 0;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
`;

export const UploadOverlay = styled.div`
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

export const UploadButton = styled.label`
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

export const ChatContainer = styled.div`
  width: 100%;
  display: flex;
  padding: 10px;
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  z-index: 12;
  flex-direction: row-reverse;
  gap: 10px;
`;

export const ChatInput = styled.textarea`
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

export const SendButton = styled.button`
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

export const StopSpeakingButton = styled(SendButton)`
  background-color: #dc3545; /* Red color */
  
  &:hover {
    background-color: #c82333; /* Darker red on hover */
  }
`;

export const AvatarContainer = styled.div`
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

export const MessageList = styled.div`
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

export const Message = styled.div`
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

export const StopButton = styled.button`
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

export const CloseButton = styled.button`
  position: absolute;
  top: 50px;
  right: 50px;
  // padding: 5px;
  // heigth: 100%;
  // width:100%;
  background-color: #dc3545;
  color: white;
  border: 1px solid white;
  border-radius: 50%;
  cursor: pointer;
  z-index: 1001;
  transition: background-color 0.3s ease;
   box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #c82333;
  }
`;