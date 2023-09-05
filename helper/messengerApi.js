const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config();

// Create a new instance of NodeCache
const tokenCache = new NodeCache();

// Function to get the cached token
const getCachedToken = () => {
  const cachedToken = tokenCache.get('TOKEN');
  if (cachedToken) {
    return cachedToken;
  }
  // If not cached, retrieve from process.env and cache it
  const TOKEN = process.env.TOKEN;
  tokenCache.set('TOKEN', TOKEN);
  return TOKEN;
};

// Function to get the cached page ID
const getCachedPageID = () => {
  const cachedPageID = tokenCache.get('PAGE_ID');
  if (cachedPageID) {
    return cachedPageID;
  }
  // If not cached, retrieve from process.env and cache it
  const PAGE_ID = process.env.PAGE_ID;
  tokenCache.set('PAGE_ID', PAGE_ID);
  return PAGE_ID;
};

// Create a single HTTP client instance and reuse it
const apiClient = axios.create({
  baseURL: 'https://graph.facebook.com/v11.0/',
});

// Set the access token in the client instance's defaults by calling getCachedToken()
apiClient.defaults.params = {
  access_token: getCachedToken(),
};

const sendMessage = async (senderId, message) => {
  try {
    await apiClient.post(`${getCachedPageID()}/messages`, {
      recipient: { id: senderId },
      messaging_type: 'RESPONSE',
      message: { text: message },
    });

    return 1;
  } catch (error) {
    console.error('Error occurred while sending message:', error);
    return 0;
  }
};

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

async function sendVoiceMessage(senderId, audioBuffer) {
  try {
    const url = `https://graph.facebook.com/v12.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    
    const formData = {
      recipient: {
        id: senderId,
      },
      message: {
        attachment: {
          type: 'audio',
          payload: {},
        },
      },
      filedata: audioBuffer, // Attach the audioBuffer as filedata
    };

    await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Voice message sent successfully to', senderId);
  } catch (error) {
    console.error('Error sending voice message:', error);
    throw error;
  }
}


module.exports = {
  sendMessage,
  sendVoiceMessage,
};
