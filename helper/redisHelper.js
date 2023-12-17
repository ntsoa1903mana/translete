const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

// Handle Supabase connection errors
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    console.error('Supabase Error: User is signed out.');
  }
});

console.log('Supabase connection established!');

async function saveUserId(senderId, value) {
  try {
    const { data, error } = await supabase
      .from('user_data')
      .upsert([{ id: senderId, value }]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error occurred while saving user ID in Supabase:', error);
    throw error;
  }
}

async function getUserId(senderId) {
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('value')
      .eq('id', senderId);

    if (error) {
      throw error;
    }

    const value = data ? data[0]?.value : '';
    return value || '';
  } catch (error) {
    console.error('Error occurred while fetching user ID from Supabase:', error);
    throw error;
  }
}

async function getUsername(senderId) {
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('value')
      .eq('id', senderId);

    if (error) {
      throw error;
    }

    const username = data ? data[0]?.value : '';
    return username || '';
  } catch (error) {
    console.error('Error occurred while fetching username from Supabase:', error);
    throw error;
  }
}

module.exports = {
  saveUserId,
  getUserId,
  getUsername,
};
