const express = require('express');
const router = express.Router();
require('dotenv').config();
const { saveUserId, getUserId, getUsername } = require('../helper/redisHelper');
const translateString = require('../helper/transLet');
const { sendMessage } = require('../helper/messengerApi');
// Function to count the number of words in a string
function countWords(str) {
  return str.split(/\s+/).filter(Boolean).length;
}
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

        if (command === '0000' && username) {
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
            const userLanguage = query.split('*')[1];
            const transleteTo = query.split('*')[2];

            const query1 = query.split('*')[0];
            // Log the word count
            const wordCount = countWords(query1);
            console.log(`Word Count: ${wordCount}`);

            // Check if a valid target language code is found
            if (transleteTo) {
              // Check if the message contains more than 500 words
              if (wordCount <= 100) {
                // Perform translation here
                const translation = await translateString(query1, transleteTo, userLanguage);
                // Send the translation as a response
                await sendMessage(senderId, translation);
              } else {
                await sendMessage(senderId, "Désolé, pour le moment je ne suis pas autorisé à traduire des messages plus longs que 100 mots.");
              }
            } else {
              const username = await getUsername(senderId);
              // Handle invalid translation request
              const correctRequest = `Hey ${username}👋, voici les conditions pour utiliser Ahy Translate :
votre message doit contenir *en*fr ou toutes les combinaisons possibles.\n
*en*fr = *anglais*français, ce qui signifie que votre message est en anglais et que vous souhaitez le traduire en français. Vous pouvez simplement le rédiger en suivant le format *source*destination.\n`;
              const exempleMessage = `Exemple de message : Comment envoyer des messages sur Ahy Translate. *fr*en
Réponse : How to send messages on Ahy Translate.

Exemples abrégés :
  Madagascar (MG) 🇲🇬
  France (FR) 🇫🇷
  Anglais (EN) 🇺🇸\n
Pour plus d'exemples d'abréviations internationales de pays, je vous invite à envoyer un message à Ahy Bots.
Cliquez ici : facebook.com/AhyBots`;
              // Use Promise.all to send them concurrently
              await Promise.all([                
                sendMessage(senderId, correctRequest),
                sendMessage(senderId, exempleMessage),
              ]);    

            }
          } else {
            const mess = `Hey, Pour la première fois sur nos services, envoyez-nous votre prénom écrit juste (0000 votre prénom).`
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