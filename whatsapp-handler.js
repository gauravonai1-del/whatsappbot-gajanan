import twilio from "twilio";

// Roman Marathi to Devanagari conversion map
const romanToDevanagariMap = {
  // Common words
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

  // Common phrases
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
  'ke baag': 'चे बाग',
  'kab dena': 'कधी देणे',
};

// Language detection
function detectLanguage(text) {
  if (!text) return 'unknown';

  // Check for Devanagari script (Marathi script)
  const devanagariRegex = /[\u0900-\u097F]/g;
  if (devanagariRegex.test(text)) {
    console.log('🔤 Detected: Marathi (Devanagari script)');
    return 'marathi-script';
  }

  // Check for Roman Marathi patterns
  const romanMarathiPatterns = [
    /\bka\b/i,      // का
    /\bkaise\b/i,   // कसे
    /\bkonta\b/i,   // कोणता
    /\bgheu\b/i,    // घेऊ
    /\bpani\b/i,    // पाणी
    /\bbaag\b/i,    // बाग
    /\bkab\b/i,     // कधी
    /\bdena\b/i,    // देणे
    /\bkarna\b/i,   // करणे
    /\bchahiye\b/i,
  ];

  const hasRomanMarathiWords = romanMarathiPatterns.some(pattern => pattern.test(text));
  
  if (hasRomanMarathiWords && /^[a-zA-Z\s?]*$/.test(text)) {
    console.log('🔤 Detected: Roman Marathi');
    return 'roman-marathi';
  }

  // Default to English
  console.log('🔤 Detected: English');
  return 'english';
}

// Convert Roman Marathi to Devanagari
function romanToDevanagari(text) {
  if (!text) return text;

  let result = text.toLowerCase();

  // Multi-character patterns first (longer matches first)
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

// Format Marathi answer
function formatMarathiAnswer(answer) {
  if (!answer || answer.trim() === '') {
    return 'मला समजत नाही। कृपया दोबारा विचारा।';
  }

  // Ensure pure Marathi formatting
  let formatted = answer
    .replace(/मुझे/g, 'मला')
    .replace(/समझ नहीं/g, 'समजत नाही')
    .replace(/कृपया/g, 'कृपया');

  return `💡 📌 उत्तर:\n${formatted}`;
}

// Format English answer
function formatEnglishAnswer(answer) {
  if (!answer || answer.trim() === '') {
    return "I don't understand. Please ask again.";
  }

  return `💡 📌 Answer:\n${answer}`;
}

export async function handleWhatsAppMessage(message, phoneNumber) {
  try {
    console.log(`💬 Processing message from ${phoneNumber}: ${message}`);
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = "+14155238886";
    
    console.log(`🔍 Credentials check: SID=${accountSid ? "✅" : "❌"}, Token=${authToken ? "✅" : "❌"}, Phone=${twilioPhone ? "✅" : "❌"}`);
    
    if (!accountSid || !authToken || !twilioPhone) {
      console.error("❌ Missing Twilio credentials:", { accountSid: !!accountSid, authToken: !!authToken, twilioPhone: !!twilioPhone });
      return;
    }

    // Detect input language
    const detectedLanguage = detectLanguage(message);
    
    // Process message based on language
    let searchQuery = message;
    let responseLanguage = 'english';

    if (detectedLanguage === 'marathi-script') {
      // Marathi script input → search in Marathi
      searchQuery = message;
      responseLanguage = 'marathi';
      console.log(`✅ Marathi script detected: "${message}"`);
    } else if (detectedLanguage === 'roman-marathi') {
      // Roman Marathi input → convert to Devanagari → search in Marathi
      searchQuery = romanToDevanagari(message);
      responseLanguage = 'marathi';
      console.log(`🔄 Roman Marathi converted: "${message}" → "${searchQuery}"`);
    } else {
      // English input → search in English
      searchQuery = message;
      responseLanguage = 'english';
      console.log(`✅ English detected: "${message}"`);
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);
    
    // Search knowledge base
    console.log(`🔍 Searching knowledge base for: "${searchQuery}" (Language: ${responseLanguage})`);
    
    const response = await fetch("http://127.0.0.1:3002/api/search-knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: searchQuery,
        language: responseLanguage,
        detectedLanguage: detectedLanguage,
      }),
    });

    const data = await response.json();
    console.log(`📊 Search result:`, data);

    // Format response based on detected language
    let replyMessage;
    
    if (data.success && data.answer && data.answer.trim()) {
      if (responseLanguage === 'marathi') {
        replyMessage = formatMarathiAnswer(data.answer);
      } else {
        replyMessage = formatEnglishAnswer(data.answer);
      }
    } else {
      // No answer found - use appropriate error message
      if (responseLanguage === 'marathi') {
        replyMessage = 'मला समजत नाही। कृपया दोबारा विचारा।';
      } else {
        replyMessage = "I don't understand. Please ask again.";
      }
    }

    // Send reply via Twilio
    console.log(`📤 Sending reply to ${phoneNumber}...`);
    
    const messageResult = await client.messages.create({
      from: `whatsapp:${twilioPhone}`,
      to: `whatsapp:${phoneNumber}`,
      body: replyMessage,
    });

    console.log(`✅ Message sent! SID: ${messageResult.sid}`);

  } catch (error) {
    console.error(`❌ Error in handleWhatsAppMessage:`, error.message);
    console.error(`Full error:`, error);
  }
}