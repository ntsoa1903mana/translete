const express = require('express');
const router = express.Router();
require('dotenv').config();
const { saveUserId, getUserId, getUsername } = require('../helper/redisHelper');
const translateString = require('../helper/transLet');
const { sendMessage } = require('../helper/messengerApi');

router.post('/', async (req, res) => {
  try {
    const { entry } = req.body;

    if (entry && entry.length > 0 && entry[0].messaging && entry[0].messaging.length > 0) {
      const { sender: { id: senderId }, message } = entry[0].messaging[0];

      if (message && message.text) {
        const { text: query } = message;
        console.log(`${senderId}`);

        // Split the message by space to extract the username
        const [command, username] = query.split(' ');

        if (command === 'Anarana' && username) {
          // If the user sends '0000' followed by a username, save the senderId and username in Redis
          try {
            await saveUserId(senderId, username);
            console.log('User ID and username saved in Redis.');
          } catch (err) {
            console.error('Error saving user ID and username in Redis:', err);
          }
        }

        // Check if the senderId exists in Redis
        try {
          const userId = await getUserId(senderId);

          if (userId) {
            // SenderId exists in Redis, proceed with the translation logic

            // Extract the target language code from the message, e.g., "hi.mg"
            const transleteTo = query.split('*')[1];

            const query1 = query.split('*')[0];

            // Check if a valid target language code is found
            if (transleteTo) {
              // Perform translation here
              const translation = await translateString(query1, transleteTo);
              // Send the translation as a response
              await sendMessage(senderId, translation);
            } else {
              const username = await getUsername(senderId);
              // Handle invalid translation request
              const correctRequest = `Hey ${username}👋, voici les conditions pour utiliser Ahy Translate :
votre message doit contenir *fr ou toutes les combinaisons possibles.\n
*fr = *français, ce qui signifie que vous souhaitez le traduire en français.`;
              const exempleMessage = `Exemple de message : Comment envoyer des messages sur Ahy Translate. *en
Réponse : How to send messages on Ahy Translate.

Exemples abrégés :
  Madagascar (MG) 🇲🇬
  France (FR) 🇫🇷
  Anglais (EN) 🇺🇸`;
              // Use Promise.all to send them concurrently
              await sendMessage(senderId, correctRequest);
              sendMessage(senderId, exempleMessage);
            }
          } else {
            const mess = `Hey, Pour la première fois sur nos services, envoyez-nous votre prénom écrit juste (Anarana votre prénom). Ex: Anarana Mana)`
            await sendMessage(senderId, mess);
          }
        } catch (err) {
          console.error('Error retrieving user ID from Redis:', err);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }

  res.status(200).send('OK');
});

// Handle GET requests for verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

module.exports = {
  router,
};
