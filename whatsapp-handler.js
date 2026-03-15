import twilio from "twilio";

export async function handleWhatsAppMessage(message, phoneNumber) {
  try {
    console.log(`💬 Processing message from ${phoneNumber}: ${message}`);

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = "+14155238886";  // Hardcode for testing

    console.log(`🔍 Credentials check: SID=${accountSid ? "✅" : "❌"}, Token=${authToken ? "✅" : "❌"}, Phone=${twilioPhone ? "✅" : "❌"}`);

    if (!accountSid || !authToken || !twilioPhone) {
      console.error("❌ Missing Twilio credentials:", { accountSid: !!accountSid, authToken: !!authToken, twilioPhone: !!twilioPhone });
      return;
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Search knowledge base
    console.log(`🔍 Searching knowledge base for: "${message}"`);
    
    const response = await fetch("/api/search-knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: message,
        language: "marathi",
      }),
    });

    const data = await response.json();
    console.log(`📊 Search result:`, data);

    let replyMessage = "क्षमा करें, मुझे समझ नहीं आया। कृपया दोबारा पूछें।";

    if (data.success && data.answer) {
      replyMessage = `💡 ${data.answer}`;
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