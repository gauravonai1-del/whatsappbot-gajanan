import express from "express";
import { handleWhatsAppMessage } from "./whatsapp-handler.js";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3002;

// Webhook GET (Twilio validation)
app.get("/webhook", (req, res) => {
  console.log("✅ GET /webhook received (Twilio validation)");
  res.status(200).send("OK");
});

// Webhook POST (incoming messages)
app.post("/webhook", async (req, res) => {
  try {
    console.log("📨 POST /webhook received");
    console.log("Body:", req.body);

    const incomingMessage = req.body.Body;
    const senderPhoneNumber = req.body.From;

    if (!incomingMessage || !senderPhoneNumber) {
      console.warn("⚠️ Missing message or phone number");
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`📱 Message from ${senderPhoneNumber}: ${incomingMessage}`);

    // Handle the message
    await handleWhatsAppMessage(incomingMessage, senderPhoneNumber);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Knowledge base search endpoint
app.post("/api/search-knowledge", async (req, res) => {
  try {
    const { query, language } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        answer: "No query provided",
        language: language || 'english'
      });
    }

    console.log(`🔍 Searching for: "${query}" (Language: ${language})`);

    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!supabaseUrl || !supabaseKey || !groqApiKey) {
      console.error("❌ Missing Supabase or Groq credentials");
      return res.status(500).json({
        success: false,
        answer: language === 'marathi' 
          ? 'तांत्रिक त्रुटी। कृपया पुन्हा प्रयत्न करा।'
          : 'Technical error. Please try again.',
        language: language || 'english'
      });
    }

    // Fetch transcripts from Supabase
    console.log("📡 Fetching from Supabase...");
    const transcriptResponse = await fetch(
      `${supabaseUrl}/rest/v1/transcripts?select=*`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!transcriptResponse.ok) {
      throw new Error("Failed to fetch from Supabase");
    }

    const transcripts = await transcriptResponse.json();
    console.log(`✅ Fetched ${transcripts.length} transcripts`);

    // Build context
    let context = "";
    for (const transcript of transcripts) {
      context += `\n\n--- ${transcript.title || 'Document'} ---\n${transcript.content}`;
    }

    if (!context.trim()) {
      console.warn("⚠️ No transcript content found");
      return res.status(200).json({
        success: false,
        answer: language === 'marathi'
          ? 'हा विषय आमच्या ज्ञान संग्रहात उपलब्ध नाही। कृपया White Gold Trust ने दस्तऐवजित केलेल्या विषयांबद्दल विचारा।'
          : 'This topic is not available in our knowledge base. Please ask about topics documented by White Gold Trust.',
        language: language || 'english'
      });
    }

    // Build Groq prompt
    const systemPrompt = language === 'marathi'
      ? 'तू एक कृषी सहायक आहेस। White Gold Trust के द्वारा प्रदान किये गए दस्तावेजों के आधार पर प्रश्नों के उत्तर दो। केवल मराठी में उत्तर दो। अगर उत्तर ज्ञान संग्रह में नहीं है, तो "उपलब्ध नहीं" कहो।'
      : 'You are an agricultural assistant. Answer questions based on the documents provided by White Gold Trust. Answer only in English. If the answer is not in the knowledge base, say "Not available".';

    const userPrompt = `${context}\n\nप्रश्न / Question: ${query}\n\nउत्तर दो / Answer:`;

    console.log("🤖 Calling Groq API...");

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!groqResponse.ok) {
      const groqError = await groqResponse.text();
      console.error("❌ Groq error:", groqError);
      throw new Error("Groq API error");
    }

    const groqData = await groqResponse.json();
    const answer = groqData.choices[0]?.message?.content || "No response";

    console.log(`✅ Got answer: ${answer.substring(0, 50)}...`);

    res.status(200).json({
      success: true,
      answer: answer,
      language: language || 'english'
    });

  } catch (error) {
    console.error("❌ Search error:", error.message);
    res.status(500).json({
      success: false,
      answer: "Error processing query",
      language: "english"
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Webhook ready at POST /webhook`);
  console.log(`✅ Search endpoint ready at POST /api/search-knowledge`);
});