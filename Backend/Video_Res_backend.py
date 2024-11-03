from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from azure.storage.blob import BlobServiceClient
import os
from dotenv import load_dotenv
import httpx
 
load_dotenv(".env")
app = FastAPI()
 
# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# Azure Blob Storage configurations
AZURE_BLOB_CONNECTION_STRING = os.getenv("AZURE_BLOB_CONNECTION_STRING")
CONTAINER_NAME = os.getenv("AZURE_BLOB_CONTAINER_NAME")
DIRECTORY_NAME = "videos_nissan/"
 
# API Endpoint for analysis
API_ENDPOINT = os.getenv("API_ENDPOINT")
 
# Initialize BlobServiceClient
blob_service_client = BlobServiceClient.from_connection_string(AZURE_BLOB_CONNECTION_STRING)
 
@app.get("/list-videos/")
async def list_videos():
    try:
        # Get container client
        container_client = blob_service_client.get_container_client(CONTAINER_NAME)
        # List blobs in the container with the specified directory
        blobs = container_client.list_blobs(name_starts_with=DIRECTORY_NAME)
        video_urls = []
 
        for blob in blobs:
            blob_client = container_client.get_blob_client(blob.name)
            blob_url = blob_client.url
            video_urls.append({"name": blob.name, "url": blob_url})
 
        return {"videos": video_urls}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.post("/analyze/")
async def analyze(request: Request):
    data = await request.json()
    frame = data.get('frame')
    user_prompt = data.get('prompt', "")
    conversation_id = data.get('conversation_id')
    messages = data.get('messages', [])
 
    if not frame:
        raise HTTPException(status_code=400, detail="No frame received")
    if not user_prompt:
        raise HTTPException(status_code=400, detail="No user prompt provided")
    if not conversation_id:
        raise HTTPException(status_code=400, detail="No conversation_id provided")
    if not messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    print(user_prompt)
    print(messages)
    description = await analyze_frames_with_gpt(frame, user_prompt, messages[:-1], conversation_id)
    return {"message": description, "frame": frame}
 
async def analyze_frames_with_gpt(frame, user_prompt, messages, conversation_id):
    SYSTEM_PROMPT = 'Based on the images and the knowledge store data that you have, answer user queries.'
 
    image_content = {
        "type": "image_url",
        "image_url": {
            "url": f"data:image/jpeg;base64,{frame}",
            "detail": "low"
        }
    }
 
    # messages.append({"role": "system", "content": SYSTEM_PROMPT})
    messages.append({"role": "user", "content": [image_content,{"type":"text","text":user_prompt}]})
    print(messages)
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                API_ENDPOINT,
                json={
                    "conversation_id": conversation_id,
                    "messages": messages
                },
                timeout=90.0
            )
            response.raise_for_status()
            response_data = response.json()
 
            if response_data and response_data.get('choices'):
                bot_message = response_data['choices'][0]['messages'][1]['content']
                return bot_message
            else:
                return f"Unexpected response structure: {response_data}"
        except httpx.TimeoutException:
            return "Request timed out. The server took too long to respond."
        except httpx.HTTPStatusError as e:
            return f"HTTP error occurred: {e.response.status_code} - {e.response.text}"
        except httpx.RequestError as e:
            return f"An error occurred while requesting: {str(e)}"
        except Exception as e:
            return f"An unexpected error occurred: {str(e)}"
 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=7000)