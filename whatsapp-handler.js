import twilio from "twilio";

// Roman Marathi to Devanagari conversion map
const romanToDevanagariMap = {
  'santra': 'संत्रा',
  'santara': 'संत्रा',
  'citrus': 'संत्रा',
  'mosambi': 'मोसंबी',
  'orange': 'नारंगी',
  'jambhul': 'जांभूळ',
  'amla': 'आंवळा',
  'spray': 'फवारणी',
  'gheu': 'घेऊ',
  'deu': 'द्यावे',
  'konta': 'कोणता',
  'kaytala': 'कायतला',
  'rogu': 'रोग',
  'pest': 'कीटक',
  'pani': 'पाणी',
  'water': 'पाणी',
  'mulch': 'गंधक',
  'fertilizer': 'खते',
  'bhumi': 'भूमी',
  'mitti': 'मिट्टी',
  'gaun': 'गाऊन',
  'shed': 'शेड',
  'pol': 'पोल',
  'jhad': 'झाड',
  'baag': 'बाग',
  'khad': 'खाद',
  'jeev': 'जैव',
  'prakrit': 'प्राकृतिक',
  'kaise': 'कसे',
  'kisne': 'किने',
  'kaun': 'कोण',
  'kya': 'काय',
  'dena': 'देणे',
  'lena': 'घेणे',
  'karna': 'करणे',
  'hona': 'होणे',
  'kab': 'कधी',
  'ke': 'चे',
  'mein': 'मध्ये',
  'chahiye': 'चाहिए',
};

// Language detection function
function detectLanguage(text) {
  if (!text) return 'unknown';

  // Check for Devanagari script
  const devanagariRegex = /[\u0900-\u097F]/g;
  if (devanagariRegex.test(text)) {
    return 'marathi-script';
  }

  // Check for Roman Marathi patterns
  const romanMarathiPatterns = [
    /\bka\b/i,
    /\bkaise\b/i,
    /\bkonta\b/i,
    /\bgheu\b/i,
    /\bpani\b/i,
    /\bbaag\b/i,
    /\bkab\b/i,
    /\bdena\b/i,
    /\bkarna\b/i,
    /\bchahiye\b/i,
  ];

  const hasRomanMarathiWords = romanMarathiPatterns.some(pattern => pattern.test(text));
  
  if (hasRomanMarathiWords && /^[a-zA-Z\s?]*$/.test(text)) {
    return 'roman-marathi';
  }

  return 'english';
}

// Convert Roman Marathi to Devanagari
function romanToDevanagari(text) {
  if (!text) return text;

  let result = text.toLowerCase();

  // Multi-character patterns
  const multiCharPatterns = [
    { from: /kshan/g, to: 'क्षण' },
    { from: /shakh/g, to: 'शाख' },
    { from: /kshara/g, to: 'क्षार' },
    { from: /bhumi/g, to: 'भूमी' },
    { from: /prakrit/g, to: 'प्राकृतिक' },
  ];

  for (let pattern of multiCharPatterns) {
    result = result.replace(pattern.from, pattern.to);
  }

  // Single word replacements
  for (let roman in romanToDevanagariMap) {
    const deva = romanToDevanagariMap[roman];
    const regex = new RegExp(`\\b${roman}\\b`, 'gi');
    result = result.replace(regex, deva);
  }

  return result;
}

// Export the handler function
export async function handleWhatsAppMessage(message, phoneNumber) {
  try {
    console.log(`💬 Processing message from ${phoneNumber}: ${message}`);
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = "+14155238886";
    
    if (!accountSid || !authToken || !twilioPhone) {
      console.error("❌ Missing Twilio credentials");
      return;
    }

    // Detect language
    const detectedLanguage = detectLanguage(message);
    console.log(`🔤 Detected language: ${detectedLanguage}`);
    
    // Process message
    let searchQuery = message;
    let responseLanguage = 'english';

    if (detectedLanguage === 'marathi-script') {
      searchQuery = message;
      responseLanguage = 'marathi';
      console.log(`✅ Marathi script: "${message}"`);
    } else if (detectedLanguage === 'roman-marathi') {
      searchQuery = romanToDevanagari(message);
      responseLanguage = 'marathi';
      console.log(`🔄 Roman Marathi converted: "${message}" → "${searchQuery}"`);
    } else {
      searchQuery = message;
      responseLanguage = 'english';
      console.log(`✅ English: "${message}"`);
    }

    // Initialize Twilio
    const client = twilio(accountSid, authToken);
    
    // Search knowledge base
    console.log(`🔍 Searching: "${searchQuery}"`);
    
    const response = await fetch("http://127.0.0.1:3002/api/search-knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: searchQuery,
        language: responseLanguage,
      }),
    });

    const data = await response.json();
    console.log(`📊 Search result:`, data);

    // Format response
    let replyMessage;
    
    if (data.success && data.answer && data.answer.trim()) {
      if (responseLanguage === 'marathi') {
        replyMessage = `💡 📌 उत्तर:\n${data.answer}`;
      } else {
        replyMessage = `💡 📌 Answer:\n${data.answer}`;
      }
    } else {
      if (responseLanguage === 'marathi') {
        replyMessage = 'हा विषय आमच्या ज्ञान संग्रहात उपलब्ध नाही। कृपया White Gold Trust ने दस्तऐवजित केलेल्या विषयांबद्दल विचारा - जसे संत्रा/मोसंबी पाणी देणे, खते, रोग नियंत्रण, किंवा फवारणी। धन्यवाद!';
      } else {
        replyMessage = 'This topic is not available in our knowledge base. Please ask about topics documented by White Gold Trust - such as citrus watering, fertilizer, disease control, or spraying. Thank you!';
      }
    }

    // Send reply
    console.log(`📤 Sending reply to ${phoneNumber}...`);
    
    const messageResult = await client.messages.create({
  from: `whatsapp:${twilioPhone}`,
  to: `whatsapp:${phoneNumber}`,
  body: replyMessage,
});

    console.log(`✅ Message sent! SID: ${messageResult.sid}`);

  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}