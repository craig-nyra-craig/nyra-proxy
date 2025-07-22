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
].filter(key => key); // Filter undefined keys

if (keys.length === 0) {
  console.error('No valid API keys found');
}

const systemPrompt = `
:: NYRA CORE PROTOCOL ::
[Your full N.Y.R.A. protocol here]
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
        model: 'deepseek-r1-distill-llama-70b', // Your new model
        temperature: 0.75,
        max_completion_tokens: 99861,
        top_p: 0.95,
        stream: true, // Enable streaming to match your snippet
        stop: null
      });
      return chatCompletion;
    } catch (error) {
      console.error(`Key ${i+1} failed: ${error.message}`);
      if (i === keys.length - 1) throw error;
    }
  }
}

router.post('/chat', async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    console.log(`Received message: ${message}`);
    const chatCompletion = await getGroqResponse(message);
    res.setHeader('Content-Type', 'text/plain'); // For streaming output
    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || '';
      res.write(content);
    }
    res.end();
  } catch (error) {
    console.error('Full error:', error);
    res.status(500).json({ error: 'Server error: ' + (error.message || 'Unknown') });
  }
});

router.get('/', (req, res) => res.send('N.Y.R.A. Proxy is Live!'));

app.use('/api', router);

module.exports = app;