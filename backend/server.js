// Twilio WhatsApp AI Auto-Reply Bot - backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const Twilio = require('twilio');

dotenv.config();

const {
  PORT = 4000,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM,
  OPENAI_API_KEY,
  BUSINESS_NAME = 'Local Business',
  BUSINESS_WEBSITE_URL = 'https://example.com'
} = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.warn('TWILIO credentials missing. Fill .env from .env.example');
}
if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY missing. Fill .env from .env.example');
}

const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('frontend'));

// In-memory store (demo)
let INTENTS = [
  { name: 'greeting', patterns: ['hi','hello','hey'], reply: 'Hello 👋! How can I help you today?' },
  { name: 'price', patterns: ['price','fees','cost'], reply: 'Our pricing depends on the service. Which service are you looking for?' },
  { name: 'timing', patterns: ['open','time','hours','timing'], reply: 'We are open 10:00 AM to 8:00 PM (Mon-Sat).' },
  { name: 'appointment', patterns: ['book','appointment','slot'], reply: 'Share your preferred date and time and we will confirm.' }
];
let MESSAGE_LOG = [];

// Utility: simple intent detection
function detectIntent(text) {
  const lower = (text || '').toLowerCase();
  for (const intent of INTENTS) {
    for (const p of intent.patterns) {
      if (p && lower.includes(p.toLowerCase())) return intent;
    }
  }
  return null;
}

// Simple sentiment (demo)
function simpleSentiment(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('bad') || t.includes('not') || t.includes('worst') || t.includes('cancel')) return 'negative';
  if (t.includes('thanks') || t.includes('thank') || t.includes('great') || t.includes('good')) return 'positive';
  return 'neutral';
}

// AI fallback using OpenAI Chat Completions (gpt-4o-mini or gpt-4o)
async function aiReply(message) {
  if (!OPENAI_API_KEY) return "Sorry, I'm unable to answer right now.";
  const systemPrompt = `You are an assistant for ${BUSINESS_NAME}. Be friendly and concise (1-2 sentences). Website: ${BUSINESS_WEBSITE_URL}`;
  try {
    const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.4,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': 'Bearer ' + OPENAI_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    return (resp.data.choices && resp.data.choices[0].message.content) ? resp.data.choices[0].message.content.trim() : "Sorry, couldn't generate a reply.";
  } catch (err) {
    console.error('OpenAI error', err.message || err);
    return "Sorry, I'm having trouble answering right now.";
  }
}

// Send WhatsApp message via Twilio
async function sendWhatsApp(to, text) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    console.warn('Twilio config missing, cannot send message.');
    return;
  }
  try {
    await client.messages.create({
      to,
      from: TWILIO_WHATSAPP_FROM,
      body: text
    });
  } catch (err) {
    console.error('Twilio send error', err.message || err);
  }
}

// Twilio webhook for incoming messages
app.post('/webhook/twilio', async (req, res) => {
  try {
    const from = req.body.From; // whatsapp:+1234567890
    const body = req.body.Body || '';
    console.log('Incoming:', from, body);
    MESSAGE_LOG.push({ ts: Date.now(), from, body });

    // 1. Intent detection
    const intent = detectIntent(body);
    if (intent) {
      const reply = intent.reply;
      MESSAGE_LOG.push({ ts: Date.now(), to: from, body: reply });
      await sendWhatsApp(from, reply);
      return res.send('<Response></Response>');
    }

    // 2. Fallback to AI
    const sentiment = simpleSentiment(body);
    const ai = await aiReply(body + " (sentiment: " + sentiment + ")");
    MESSAGE_LOG.push({ ts: Date.now(), to: from, body: ai });
    await sendWhatsApp(from, ai);
    res.send('<Response></Response>');
  } catch (err) {
    console.error('webhook error', err);
    res.status(500).send('Error');
  }
});

// Dashboard APIs
app.get('/api/config', (req, res) => {
  res.json({
    businessName: BUSINESS_NAME,
    website: BUSINESS_WEBSITE_URL,
    intents: INTENTS,
    logs: MESSAGE_LOG.slice(-200)
  });
});

app.post('/api/config/intents', (req, res) => {
  const { intents } = req.body;
  if (!Array.isArray(intents)) return res.status(400).json({ error: 'intents must be array' });
  INTENTS = intents;
  res.json({ success: true, intents: INTENTS });
});

app.get('/api/logs', (req, res) => {
  res.json(MESSAGE_LOG);
});

app.post('/api/send_test', async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'to and message required' });
  await sendWhatsApp(to, message);
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.sendFile(require('path').join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
