import React from 'react';
import styled from 'styled-components';
import { FaUser, FaCommentDots, FaTimes } from 'react-icons/fa'; // Import FaTimes for the close button

const DrawerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
  transition: left 0.4s ease-in-out;
  z-index: 9999;

  @media (min-width: 768px) {
    display: none; // Hide full message list below 768px
  }
`;

const DrawerToggle = styled.button`
  position: fixed;
  top: 6%;
  left: 0;
  transform: translateY(-50%);
  background-color: #116600;
  color: white;
  padding: 7px;
  border: none;
   border-radius: 0 5px 5px 0;
  cursor: pointer;
  z-index: 1001;
  transition: left 0.1s ease-in-out;

  &:after {
    content: none;
  }
      @media (min-width: 768px) {
    display: none; // Hide full message list below 768px
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: #000;
  font-size: 20px;
  cursor: pointer;
`;

const MessageList = styled.div`
  padding: 10px;
  display: flex;
  flex-direction: column;
`;

const MessageContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  justify-content: ${props => (props.isUser ? 'flex-start' : 'flex-end')};
`;


const Message = styled.div`
  padding: 10px;
  background-color: ${props => (props.isUser ? '#f1f1f1' : '#007bff')};
  color: ${props => (props.isUser ? '#000' : '#fff')};
  border-radius: ${props => (props.isUser ? '15px 15px 15px 0px' : '15px 15px 0 15px')};
  max-width: 80%;
  order: 1;
`;

const MessageDrawer = ({ messages, open, toggleDrawer }) => (
  <>
    {!open && (
      <DrawerToggle onClick={toggleDrawer}>
        <FaCommentDots /> {/* Use the chat icon here */}
      </DrawerToggle>
    )}
    {open && (
      <DrawerContainer>
        <CloseButton onClick={toggleDrawer}>
          <FaTimes />
        </CloseButton>
        <MessageList>
          {messages.map((message, index) => (
            <MessageContainer key={index} isUser={message.role === 'user'}>
              {/* <MessageIcon isUser={message.role === 'user'}>
                {message.role === 'user' ? <FaUser /> : <FaCommentDots />}
              </MessageIcon> */}
              <Message isUser={message.role === 'user'}>
                {message.content[0].text}
              </Message>
            </MessageContainer>
          ))}
        </MessageList>
      </DrawerContainer>
    )}
  </>
);

export default MessageDrawer;