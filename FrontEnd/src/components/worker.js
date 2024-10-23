let canvas, context, width, height;

onmessage = (e) => {
  if (e.data.type === 'init') {
    canvas = e.data.canvas;
    width = e.data.width;
    height = e.data.height;
    context = canvas.getContext('2d');
  } else if (e.data.type === 'drawFrame') {
    const { videoElement } = e.data;
    context.drawImage(videoElement, 0, 0, width, height);
    const frame = context.getImageData(0, 0, width, height);
    processFrame(frame);
  } else if (e.data.type === 'processFrame') {
    const { frame } = e.data;
    processFrame(frame);
  }
};

const greenThreshold = (r, g, b, threshold) => {
  return g > threshold && r < 180 && b < 180;
};

const smoothEdges = (data, width, height) => {
  const newData = new Uint8ClampedArray(data);

  const getIndex = (x, y) => (y * width + x) * 4;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = getIndex(x, y);

      if (data[idx + 3] === 0) {
        // Making surrounding pixels semi-transparent to smoothen edges
        newData[getIndex(x - 1, y) + 3] = Math.min(newData[getIndex(x - 1, y) + 3], 128);
        newData[getIndex(x + 1, y) + 3] = Math.min(newData[getIndex(x + 1, y) + 3], 128);
        newData[getIndex(x, y - 1) + 3] = Math.min(newData[getIndex(x, y - 1) + 3], 128);
        newData[getIndex(x, y + 1) + 3] = Math.min(newData[getIndex(x, y + 1) + 3], 128);
      }
    }
  }

  return newData;
};

const processFrame = (frame) => {
  const data = frame.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (greenThreshold(r, g, b, 150)) {
      data[i + 3] = 0; // Set alpha to 0 to make it transparent
    }
  }

  const smoothedData = smoothEdges(data, width, height);
  frame.data.set(smoothedData);

  context.putImageData(frame, 0, 0);
};