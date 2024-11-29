import { createAvatarSynthesizer, createWebRTCConnection } from "./Utility";

export const startSession = async (setIsLoading, setIsConnected, setAvatarSynthesizer, handleOnTrack) => {
  setIsLoading(true); // Indicate the session is starting

  try {
    // Wait for the WebRTC connection to be established
    const peerConnection = await createWebRTCConnection();
    const avatarSynthesizerInstance = createAvatarSynthesizer();

    setAvatarSynthesizer(avatarSynthesizerInstance);

    // Handle incoming media streams
    peerConnection.ontrack = handleOnTrack;
    peerConnection.addTransceiver("video", { direction: "sendrecv" });
    peerConnection.addTransceiver("audio", { direction: "sendrecv" });

    // Monitor ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection.iceConnectionState;
      console.log(`ICE connection state: ${state}`);

      if (state === "connected") {
        setIsConnected(true);
        setIsLoading(false);
      } else if (state === "failed" || state === "disconnected") {
        setIsConnected(false);
        setIsLoading(false);
      }
    };

    // Start the avatar session asynchronously
    await avatarSynthesizerInstance.startAvatarAsync(peerConnection);
    console.log("Avatar started.");
  } catch (error) {
    console.error("Error starting session:", error);
    setIsLoading(false);
  }
};