require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function test() {
  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // switched to free-tier accessible model
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello' }
      ]
    });

    console.log(resp.choices[0].message.content);
  } catch (err) {
    console.error('OpenAI Error:', err.response?.data || err.message);
  }
}

test();