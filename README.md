# 🌾 WhatsApp Farming Bot - Marathi Agriculture Assistant

A WhatsApp bot that answers farming questions in Marathi using AI.

## What It Does

- 📱 Farmers text questions on WhatsApp
- 🤖 AI (Groq) finds answers from farming transcripts
- 📚 Works in Marathi, Roman Marathi, and English
- ✅ Deployed and working

## Example Questions

**Farmer asks (Marathi):**
```
संत्रा बागेत पहिलं पाणी कसे द्यावं?
```

**Bot replies:**
```
💡 उत्तर:
संत्र्याच्या बागामध्ये पाणी देण्याची वेळ...
[detailed answer in Marathi]
```

## Technology

- **WhatsApp:** Twilio
- **AI Brain:** Groq (llama-3.3-70b-versatile model)
- **Database:** Supabase
- **Server:** Node.js on Railway
- **Language:** Marathi + Roman Marathi + English

## What Knowledge It Has

✅ Citrus (संत्रा/मोसंबी)
✅ Turmeric (हळद)
✅ Ginger (अद्रक)
✅ Summer Bajra
✅ Summer Crops

## How It Works
```
Farmer texts WhatsApp
    ↓
Twilio receives message
    ↓
Node.js server processes
    ↓
Detect language (Marathi/Roman/English)
    ↓
Search Supabase transcripts with Groq AI
    ↓
Generate answer in detected language
    ↓
Send reply back on WhatsApp
```

## Setup (For Developers)

### Required
- Node.js 18+
- Twilio account
- Groq API key
- Supabase account
- Railway account

### Environment Variables

Create `.env` file:
```
TWILIO_ACCOUNT_SID=your_value
TWILIO_AUTH_TOKEN=your_value
TWILIO_PHONE=+14155238886
GROQ_API_KEY=your_value
SUPABASE_URL=your_value
SUPABASE_KEY=your_value
PORT=3002
```

### Install & Run
```bash
npm install
npm start
```

## Adding More Knowledge

1. Record farming session (audio)
2. Transcribe to text (Marathi)
3. Upload to Supabase `transcripts` table
4. Bot automatically learns

## File Structure
```
whatsappbot_Groq/
├── server.js                 (Main server)
├── whatsapp-handler.js       (Message processing)
├── package.json              (Dependencies)
├── README.md                 (This file)
└── .env                      (Secrets - don't share)
```

## Future Ideas

- Add voice messages
- Image-based crop disease detection
- SMS support for non-WhatsApp users
- More languages (Hindi, Tamil, Kannada)
- Analytics dashboard

## Author

**Gaurav S Shelke**  
🔗 LinkedIn: @gauravon.ai  
🌾 Engineer by day, Farmer on weekends  
📍 Pune, India

## License

MIT - You can use this code freely

---

**Built with ❤️ for Indian farmers**