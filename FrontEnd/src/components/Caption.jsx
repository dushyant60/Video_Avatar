import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const CaptionContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  font-size: 20px;
  color: white;
  background: rgba(0, 0, 0, 0.6);
  padding: 10px;
  border-radius: 8px;
  font-family: 'Arial', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 99;

  @media (min-width: 768px) {
    display: none;
  }
`;

const Caption = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentLine, setCurrentLine] = useState(0);

  useEffect(() => {
    const lines = text.split('undefined').filter(line => line.trim() !== '');
    setCurrentLine(0); // Reset current line index
    setDisplayedText(''); // Clear displayed text

    if (lines.length > 0) {
      const interval = setInterval(() => {
        setDisplayedText(lines[currentLine]);
        setCurrentLine(prev => prev + 1);
        if (currentLine >= lines.length - 1) {
          clearInterval(interval);
        }
      }, 2000); // Adjust delay between lines

      return () => clearInterval(interval);
    }
  }, [currentLine, text]);

  return <CaptionContainer>{displayedText}</CaptionContainer>;
};

export default Caption;