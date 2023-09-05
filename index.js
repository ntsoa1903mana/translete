//index.js
const { sendMessage } = require('./helper/messengerApi.js'); 
const Redis = require('ioredis');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const redis = new Redis(process.env.REDIS_URL);

// Add this function to fetch the username from Redis
async function getUsername(senderId) {
  try {
    const username = await redis.get(senderId); // Assuming you store the username using senderId as the key in Redis
    return username || ''; // Return an empty string if username is not found
  } catch (error) {
    console.error('Error occurred while fetching username from Redis:', error);
    throw error;
  }
}

// Inside the '/send-messages' route handler
app.post('/send-messages', async (req, res) => {
  try {
    // Fetch all senderId keys from Redis
    redis.keys('*', async (err, senderIdKeys) => {
      if (err) {
        console.error('Error occurred while fetching senderIds from Redis:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }

      const senderIdsToProcess = senderIdKeys.slice(0, 10); // Limit to 10 users for concurrent processing

      const sendMessagesPromises = senderIdsToProcess.map(async (senderId) => {
        // Fetch the message associated with this senderId from the request body
        const message = req.body.message; // Assuming the message is stored under the 'message' key in the request body

        if (message) {
          // Fetch the username from Redis for the current senderId
          const username = await getUsername(senderId);

          // Replace (username) placeholder with the actual username
          const modifiedMessage = message.replace('(username)', username);

          try {
            const result = await sendMessage(senderId, modifiedMessage);

            if (result === 1) {
              console.log(`Message sent successfully to senderId: ${senderId}`);
            } else {
              console.error(`Failed to send message to senderId: ${senderId}`);
            }
          } catch (error) {
            console.error(`Error occurred while sending message to senderId: ${senderId}`, error);
          }
        } else {
          console.error(`No message found in the request body for senderId: ${senderId}`);
        }
      });

      // Use Promise.all to execute all sendMessagesPromises concurrently
      await Promise.all(sendMessagesPromises);

      res.status(200).json({ success: true, message: 'Messages sent successfully' });
    });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
  console.log(`Path ${req.path} with Method ${req.method}`);
  next();
});

const homeRoute = require('./routes/homeRoute');
const fbWebhookRoute = require('./routes/fbWebhookRoute');

app.use('/', homeRoute.router);
app.use('/facebook', fbWebhookRoute.router);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
