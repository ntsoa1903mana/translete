const translate = require('node-google-translate-skidz');

async function translateString(text, translateTo, userLanguage) {
  try {
    console.log('translateTo:', translateTo);
    console.log('userlanguage:', userLanguage);
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
