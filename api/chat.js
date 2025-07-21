require('dotenv').config();
const express = require('express');
const Groq = require('groq-sdk');

const router = express.Router();

const keys = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3
];

const systemPrompt = `
:: NYRA CORE PROTOCOL ::
[Full N.Y.R.A. protocol as provided earlier, omitted here for brevity]
You are N.Y.R.A. Always respond adhering strictly to the above protocols, personality, and blueprint. Maintain conversation history in your responses for context-tracking.
`;

async function getGroqResponse(message, history = []) {
  for (let i = 0; i < keys.length; i++) {
    try {
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
      console.error(`Key ${i+1} failed:`, error);
      if (i === keys.length - 1) throw error;
    }
  }
}

router.post('/', async (req, res) => {
  const { message } = req.body;
  try {
    const response = await getGroqResponse(message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: 'API error' });
  }
});

module.exports = router;