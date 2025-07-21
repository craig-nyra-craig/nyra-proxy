require('dotenv').config();
const express = require('express');
const Groq = require('groq-sdk');

const app = express();
app.use(express.json());

const router = express.Router();

const keys = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3
].filter(key => key); // Filter out undefined keys

if (keys.length === 0) {
  console.error('No valid API keys found in environment');
}

const systemPrompt = `
:: NYRA CORE PROTOCOL ::
[Your full protocol here]
`;

async function getGroqResponse(message, history = []) {
  if (!keys.length) throw new Error('No API keys available');
  for (let i = 0; i < keys.length; i++) {
    try {
      console.log(`Attempting key ${i+1}`);
      const groq = new Groq({ apiKey: keys[i] });
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message }
        ],
        model: 'mixtral-8x7b-32768',
        timeout: 10000 // 10s timeout to catch slow responses
      });
      return chatCompletion.choices[0].message.content;
    } catch (error) {
      console.error(`Key ${i+1} failed: ${error.message} ${error.stack}`);
      if (i === keys.length - 1) throw error;
    }
  }
}

router.post('/chat', async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    console.log(`Received message: ${message}`);
    const response = await getGroqResponse(message);
    res.json({ response });
  } catch (error) {
    console.error('Full error:', error);
    res.status(500).json({ error: 'Server error: ' + (error.message || 'Unknown') });
  }
});

router.get('/', (req, res) => res.send('N.Y.R.A. Proxy is Live!'));

app.use('/api', router);

module.exports = app;