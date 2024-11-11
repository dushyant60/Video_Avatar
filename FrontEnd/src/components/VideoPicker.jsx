import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const VideoPickerContainer = styled.div`
//   margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const VideoSelect = styled.select`
  padding: 10px;
  position: relative;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
  width: 100%; /* Ensures full width on smaller screens */
  max-width: 500px;
  margin-bottom: 50px;
  appearance: none;
  box-sizing: border-box;

  /* Apply width restriction to the options */
  option {
    white-space: nowrap; /* Prevents line wrapping for long options */
    overflow: hidden; /* Hides overflowing text */
    text-overflow: ellipsis; /* Adds an ellipsis for overflow */
    width: 100%; /* Ensures options match the width of the select box */
  }
`;


const VideoPicker = ({ onSelect }) => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetch('https://web-dpxjzr3ghqbg4-docker-dev-version.azurewebsites.net/list-videos')
      .then(response => response.json())
      .then(data => {
        setVideos(data.videos);
      })
      .catch(error => console.error('Error fetching videos:', error));
  }, []);

  const handleVideoSelect = (event) => {
    const selectedUrl = event.target.value;
    onSelect(selectedUrl);
  };

  return (
    <VideoPickerContainer>
      <VideoSelect onChange={handleVideoSelect} defaultValue="">
        <option style={{width:"50px"}} value="" disabled>Select a pre-uploaded video</option>
        {videos.map((video) => {
          const videoName = video.name.split('/').pop(); // Extract the video name
          return (
            <option key={video.name} value={video.url}>{videoName}</option>
          );
        })}
      </VideoSelect>
    </VideoPickerContainer>
  );
};

VideoPicker.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

export default VideoPicker;