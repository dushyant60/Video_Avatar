# Azure Avatar Demo

Welcome to the Azure Avatar Demo! This project showcases the integration of Azure AI's Text-to-Speech Avatar feature into a ReactJS application. With this application, you can bring lifelike synthetic talking avatars to your projects.

## Demo

[Watch the Demo Video](https://drive.google.com/file/d/13liFTedLCbXuRmWskauEBDct70rtL4PL/view?usp=sharing)

Click the link above to watch a demo of the Azure Avatar in action!

## Home Screen

![Main Screenshot](./public/Avatar_SS.png)

*Add a screenshot of your application here to give users a visual overview of what to expect.*

## NOTICE

Microsoft is now retiring Azure TURN services. Azure TTS avatar was using Azure TURN services for communication. I have added a script to install coturn on an Ubuntu instance. Execute `installCoturn.sh` to set up your own TURN server.

Refer to this medium link for more details: [Azure Avatar TTS Update](https://raokarthik83.medium.com/azure-avatar-tts-update-migrating-from-azure-turn-to-coturn-14b6ac86d60c)

## Getting Started

Follow these steps to set up and run the application locally:

### Prerequisites

- Node.js and npm installed on your machine.
- An Azure account with access to the necessary services.

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/dushyant60/Video_Avatar/tree/main
   cd Frontend
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**

   Create a `.env` file in the root of your project and add the following environment variables:

   ```plaintext
   REACT_APP_COG_SVC_REGION=your-region
   REACT_APP_COG_SVC_SUB_KEY=your-subscription-key
   REACT_APP_VOICE_NAME=your-voice-name
   REACT_APP_AVATAR_CHARACTER=your-avatar-character
   REACT_APP_AVATAR_STYLE=your-avatar-style
   REACT_APP_AVATAR_BACKGROUND_COLOR=your-avatar-background-color
   REACT_APP_AZURE_OPENAI_ENDPOINT=your-openai-endpoint
   REACT_APP_AZURE_OPENAI_KEY=your-openai-key
   ```

4. **Start the Application:**

   ```bash
   npm start
   ```

   The application will be accessible at [http://localhost:3000](http://localhost:3000) in your web browser.

## Tech Stack

- **ReactJS**: A JavaScript library for building user interfaces.
- **Azure Cognitive Services**: Used for text-to-speech and other AI capabilities.
- **Styled-components**: For styling React components.
- **WebRTC**: For real-time communication capabilities.

## Configuration

Make sure to configure the necessary API keys and settings in the `.env` file before running the application.

## Feedback and Issues

If you encounter any issues or have feedback, please open an issue. We welcome your contributions and suggestions!

## License

This project is licensed under the MIT License.

Happy coding!