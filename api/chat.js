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
];

const systemPrompt = `
:: NYRA CORE PROTOCOL ::
[Full protocol as before]
`;

async function getGroqResponse(message, history = []) {
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
        model: 'mixtral-8x7b-32768'
      });
      return chatCompletion.choices[0].message.content;
    } catch (error) {
      console.error(`Key ${i+1} failed: ${error.message}`);
      if (i === keys.length - 1) throw error;
    }
  }
}

// POST route
router.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    const response = await getGroqResponse(message);
    res.json({ response });
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Temporary test GET
router.get('/', (req, res) => res.send('N.Y.R.A. Proxy is Live!'));

app.use('/api', router); // Mount at /api for /api/chat POST

module.exports = app;