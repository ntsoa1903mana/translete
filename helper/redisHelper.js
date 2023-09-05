const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

// Handle Redis connection errors
redis.on('error', (err) => {
  console.error('Redis Error:', err);
});

console.log('Redis connection established!');

async function saveUserId(senderId, value) {
  try {
    await redis.set(senderId, value);
  } catch (error) {
    console.error('Error occurred while saving user ID in Redis:', error);
    throw error;
  }
}

async function getUserId(senderId) {
  try {
    const value = await redis.get(senderId);
    return value || '';
  } catch (error) {
    console.error('Error occurred while fetching user ID from Redis:', error);
    throw error;
  }
}

async function getUsername(senderId) {
  try {
    const username = await redis.get(senderId) || '';
    return username;
  } catch (error) {
    console.error('Error occurred while fetching username from Redis:', error);
    throw error;
  }
}

module.exports = {
  saveUserId,
  getUserId,
  getUsername,
};

