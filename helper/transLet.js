const translate = require('node-google-translate-skidz');
const langdetect = require('langdetect');

async function translateString(text, translateTo) {
  try {
    // Automatically detect the user's language
    const userLanguage = langdetect.detectOne(text);

    console.log('translateTo:', translateTo);
    console.log('userLanguage:', userLanguage);

    const translated = await translate({
      text,
      source: userLanguage,
      target: translateTo,
    });

    const translation = translated.translation; // Get the translation data
    return translation; // Return the translated text
  } catch (error) {
    console.error('Translation error:', error);
    throw error; // Re-throw the error if translation fails
  }
}

module.exports = translateString; // Export the translateString function
