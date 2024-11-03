import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const VideoPickerContainer = styled.div`
//   margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const VideoSelect = styled.select`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
`;

const VideoPicker = ({ onSelect }) => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetch('http://localhost:7000/list-videos/')
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
        <option value="" disabled>Select a pre-uploaded video</option>
        {videos.map((video) => (
          <option key={video.name} value={video.url}>{video.name}</option>
        ))}
      </VideoSelect>
    </VideoPickerContainer>
  );
};

VideoPicker.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

export default VideoPicker;