import React from 'react';
import styled from 'styled-components';

const DrawerContainer = styled.div`
  position: fixed;
  top: 0;
  left: ${props => (props.open ? '0' : '-100%')};
  width: 175px;
  height: 100%;
  background-color: #fff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
  overflow-x: hidden;
  transition: left 0.1s ease-in-out;
  z-index: 1000;
`;

const DrawerToggle = styled.button`
  position: fixed;
  top: 14%;
  left: ${props => (props.open ? '175px' : '0')};
  transform: translateY(-50%);
  background-color: #007bff;
  color: white;
  padding: 7px;
  border: none;
  border-radius: 0 5px 5px 0;
  cursor: pointer;
  z-index: 1001;
  transition: left 0.1s ease-in-out;

  &:after {
    content: '${props => (props.open ? '<' : '>')}';
    font-size: 20px;
  }
`;

const ScreenshotThumbnail = styled.div`
  width: 150px;
  height: 100px;
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  margin: 10px;
`;

const ScreenshotDrawer = ({ screenshots, open, toggleDrawer }) => (
  <>
    <DrawerToggle open={open} onClick={toggleDrawer} />
    <DrawerContainer open={open}>
      {screenshots.map((screenshot, index) => (
        <ScreenshotThumbnail
          key={index}
          style={{ backgroundImage: `url(data:image/jpeg;base64,${screenshot})` }}
        />
      ))}
    </DrawerContainer>
  </>
);

export default ScreenshotDrawer;