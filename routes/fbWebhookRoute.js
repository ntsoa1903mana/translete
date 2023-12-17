const express = require('express');
const router = express.Router();
require('dotenv').config();
const { saveUserId, getUserId, getUsername } = require('../helper/redisHelper');
const translateString = require('../helper/transLet');
const { sendMessage } = require('../helper/messengerApi');

router.post('/', async (req, res) => {
  try {
    const { entry } = req.body;

    if (!entry || entry.length === 0 || !entry[0].messaging || entry[0].messaging.length === 0) {
      return res.status(200).send('OK');
    }

    const { sender: { id: senderId }, message } = entry[0].messaging[0];

    if (message && message.text) {
      const { text: query } = message;

      const anaranaRegex = /^anarana\s+([^\s]+)$/i;
      const match = query.match(anaranaRegex);

      if (match) {
        const username = match[1];

        try {
          // Save the senderId and username in Redis
          await saveUserId(senderId, username);

          const nameMessage = `Hey ${username}👋, voici les conditions pour utiliser Ahy Translate :\n\nVotre message doit contenir *fr ou toutes les combinaisons possibles.\n*fr = *français, ce qui signifie que vous souhaitez le traduire en français.`;
          const exampleMessage = 'Exemple de message : Comment envoyer des messages sur Ahy Translate. *en\nRéponse : How to send messages on Ahy Translate.\n\nExemples abrégés :\nMadagascar (MG) 🇲🇬\nFrance (FR) 🇫🇷\nAnglais (EN) 🇺🇸';

          console.log('User ID and username saved in Redis.');
          await sendMessage(senderId, nameMessage);
          await sendMessage(senderId, exampleMessage);

          return res.status(200).send('OK');
        } catch (err) {
          console.error('Error saving user ID and username in Redis:', err);
          return res.status(500).send('Internal Server Error');
        }
      }

      try {
        const userId = await getUserId(senderId);

        if (userId) {
          const [queryWithoutLang, translateTo] = query.split('*');

          if (translateTo) {
            const translation = await translateString(queryWithoutLang, translateTo);
            await sendMessage(senderId, translation);
          } else {
            const exampleMessage = 'Exemple de message : Comment envoyer des messages sur Ahy Translate. *en\nRéponse : How to send messages on Ahy Translate.\n\nExemples abrégés :\nMadagascar (MG) 🇲🇬\nFrance (FR) 🇫🇷\nAnglais (EN) 🇺🇸';
            await sendMessage(senderId, exampleMessage);
          }
        } else {
          const welcomeMessage = 'Hey, Pour la première fois sur nos services, envoyez-nous votre prénom écrit juste (Anarana votre prénom). Ex: Anarana Mana)';
          await sendMessage(senderId, welcomeMessage);
        }
      } catch (err) {
        console.error('Error retrieving user ID from Redis:', err);
        return res.status(500).send('Internal Server Error');
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }

  return res.status(200).send('OK');
});

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
