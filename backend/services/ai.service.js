import dotenv from 'dotenv';
dotenv.config();

/**
 * AI Service for AGRO-LINK Farmer Copilot
 */
class AiService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    
    // Log API state for developer visibility in hackathon setup
    if (this.geminiApiKey) {
      console.log('AI Service: Gemini API Key detected.');
    } else if (this.openaiApiKey) {
      console.log('AI Service: OpenAI API Key detected.');
    } else {
      console.warn('AI Service: No LLM API Key detected. Using local Expert Agronomist Fallback Engine.');
    }
  }

  /**
   * Generates a multilingual agricultural response
   * @param {string} prompt - User query
   * @param {string} langCode - Language code ('en', 'hi', 'mr')
   * @param {Array} history - Previous messages for context [{sender: 'user'|'assistant', message: string}]
   * @param {Object} telemetry - Soil sensor readings {moisture, temperature, ph}
   */
  async generateResponse(prompt, langCode = 'en', history = [], telemetry = null, customKeys = {}) {
    const languageNames = {
      en: 'English',
      hi: 'Hindi (हिंदी)',
      mr: 'Marathi (मराठी)'
    };
    const targetLang = languageNames[langCode] || 'English';

    // 1. Build the System Instruction
    let systemInstruction = `You are the AGRO-LINK AI Farmer Copilot, an expert agricultural advisor (agronomist). Your role is to help farmers, dealers, and shopkeepers with crop advice, pest control, fertilizer application, irrigation, soil health, weather safety, and seasonal cropping suggestions.

Follow these strict guidelines:
1. ONLY answer agriculture-related questions. If the user asks about unrelated topics (like software development, sports, general entertainment, history, etc.), you must politely decline and remind them that you are an agricultural assistant.
2. Respond in ${targetLang}. If the language is Hindi or Marathi, you MUST use the Devanagari script. Ensure the tone is friendly, respectful, and encouraging for farmers.
3. Keep answers concise, actionable, and structured with bullet points. Avoid overly technical jargon; explain terms simply.
`;

    if (telemetry) {
      systemInstruction += `\n4. IMPORTANT: The user has active soil sensors. Integrate this live telemetry data into your response:
   - Soil Moisture: ${telemetry.moisture || 'N/A'}% (Optimal range: 40-60%)
   - Soil pH: ${telemetry.ph || 'N/A'} (Optimal neutral range: 6.0-7.5)
   - Temperature: ${telemetry.temperature || 'N/A'}°C (Optimal range: 25-32°C)
Reference these readings to give personalized soil health feedback (e.g. if moisture is low, suggest watering; if pH is acidic, suggest lime).
`;
    }

    // 2. Attempt Gemini API (First priority)
    const geminiKey = customKeys?.gemini || this.geminiApiKey;
    if (geminiKey) {
      try {
        const response = await this.callGemini(prompt, systemInstruction, history, geminiKey);
        if (response) return response;
      } catch (error) {
        console.error('Gemini API request failed. Falling back...', error);
      }
    }

    // 3. Attempt OpenAI API (Second priority)
    const openaiKey = customKeys?.openai || this.openaiApiKey;
    if (openaiKey) {
      try {
        const response = await this.callOpenAI(prompt, systemInstruction, history, openaiKey);
        if (response) return response;
      } catch (error) {
        console.error('OpenAI API request failed. Falling back...', error);
      }
    }

    // 4. Fallback to Local Smart Agronomist Engine
    return this.getLocalExpertResponse(prompt, langCode, telemetry);
  }

  /**
   * Calls Google Gemini REST API (1.5 Flash)
   */
  async callGemini(prompt, systemInstruction, history, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Convert history format to Gemini roles: 'user' and 'model'
    const contents = [];
    
    // Add past history (limit to last 6 for token size)
    const recentHistory = history.slice(-6);
    recentHistory.forEach(h => {
      contents.push({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.message }]
      });
    });

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800,
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API returned status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!replyText) {
      throw new Error('Gemini API returned empty response structure');
    }
    
    return replyText;
  }

  /**
   * Calls OpenAI Chat Completions API
   */
  async callOpenAI(prompt, systemInstruction, history, apiKey) {
    const url = 'https://api.openai.com/v1/chat/completions';
    
    const messages = [
      { role: 'system', content: systemInstruction }
    ];

    // Append history
    const recentHistory = history.slice(-6);
    recentHistory.forEach(h => {
      messages.push({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.message
      });
    });

    // Append current user prompt
    messages.push({
      role: 'user',
      content: prompt
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        max_tokens: 800
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API returned status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const replyText = data.choices?.[0]?.message?.content;
    
    if (!replyText) {
      throw new Error('OpenAI API returned empty response');
    }

    return replyText;
  }

  /**
   * Intelligent Rule-based fallback engine containing premium agricultural guides.
   * Runs offline without keys.
   */
  getLocalExpertResponse(prompt, langCode, telemetry) {
    const normalized = prompt.toLowerCase();
    
    // Core check for non-agricultural questions
    const unrelatedKeywords = ['code', 'python', 'javascript', 'html', 'sing a song', 'history of france', 'who is president', 'movie', 'actor'];
    const isUnrelated = unrelatedKeywords.some(kw => normalized.includes(kw));

    if (isUnrelated) {
      if (langCode === 'hi') {
        return "मैं एग्रो-लिंक एआई कोपायलट हूं, एक कृषि सहायक। मैं केवल फसलों, मिट्टी, उर्वरकों और खेती से संबंधित प्रश्नों का उत्तर दे सकता हूं। कृपया खेती से संबंधित कुछ पूछें!";
      } else if (langCode === 'mr') {
        return "मी अ‍ॅग्रो-लिंक एआय कोपायलट आहे, एक कृषी सहाय्यक. मी फक्त पिके, माती, खते आणि शेतीशी संबंधित प्रश्नांची उत्तरे देऊ शकतो. कृपया शेतीशी संबंधित काहीतरी विचारा!";
      } else {
        return "I am the AGRO-LINK AI Farmer Copilot, an agricultural assistant. I can only answer questions related to crops, soil, fertilizers, and farming practices. Please ask something related to agriculture!";
      }
    }

    // Telemetry inclusion block (simulates live analysis)
    let telemetryParagraph = '';
    if (telemetry) {
      const moisture = parseFloat(telemetry.moisture);
      const ph = parseFloat(telemetry.ph);
      const temp = parseFloat(telemetry.temperature);
      
      if (langCode === 'hi') {
        telemetryParagraph = `आपके वर्तमान लाइव सॉइल सेंसर रीडिंग:\n` +
          `- मिट्टी की नमी: ${moisture}% (${moisture < 30 ? '⚠️ कम - सिंचाई की आवश्यकता है' : moisture > 60 ? '⚠️ अधिक - पानी जमा होने का खतरा' : '✅ इष्टतम'})\n` +
          `- मिट्टी का पीएच (pH): ${ph} (${ph < 5.5 ? '⚠️ अम्लीय - चूने के प्रयोग की सलाह' : ph > 7.8 ? '⚠️ क्षारीय - जिप्सम प्रयोग करें' : '✅ इष्टतम'})\n` +
          `- तापमान: ${temp}°C (✅ इष्टतम)\n\n`;
      } else if (langCode === 'mr') {
        telemetryParagraph = `तुमचे चालू लाईव्ह सॉइल सेन्सर रीडिंग:\n` +
          `- मातीची आर्द्रता: ${moisture}% (${moisture < 30 ? '⚠️ कमी - सिंचनाची आवश्यकता आहे' : moisture > 60 ? '⚠️ जास्त - पाणी साचण्याचा धोका' : '✅ योग्य'})\n` +
          `- मातीचे पीएच (pH): ${ph} (${ph < 5.5 ? '⚠️ आम्लयुक्त - चुना वापरण्याचा सल्ला' : ph > 7.8 ? '⚠️ अल्कधर्मी - जिप्सम वापरा' : '✅ योग्य'})\n` +
          `- तापमान: ${temp}°C (✅ योग्य)\n\n`;
      } else {
        telemetryParagraph = `Your current Live Soil Sensor Readings:\n` +
          `- Soil Moisture: ${moisture}% (${moisture < 30 ? '⚠️ LOW - Irrigation Needed' : moisture > 60 ? '⚠️ HIGH - Risk of Waterlogging' : '✅ Optimal'})\n` +
          `- Soil pH: ${ph} (${ph < 5.5 ? '⚠️ ACIDIC - Suggest Lime Application' : ph > 7.8 ? '⚠️ ALKALINE - Suggest Gypsum Application' : '✅ Optimal'})\n` +
          `- Temperature: ${temp}°C (✅ Optimal)\n\n`;
      }
    }

    // Keyword Match 1: Yellow leaves
    if (normalized.includes('yellow') || normalized.includes('pila') || normalized.includes('pivl') || normalized.includes('पीले') || normalized.includes('पिवळ')) {
      if (langCode === 'hi') {
        return telemetryParagraph + `पत्तियों का पीला पड़ना (क्लोरोसिस) निम्नलिखित कारणों से हो सकता है:
- **नाइट्रोजन की कमी:** पुरानी पत्तियाँ नीचे से पीली होने लगती हैं। समाधान के लिए **यूरिया (46% N)** या गोबर की खाद डालें।
- **अधिक पानी (जलभराव):** जड़ें सांस नहीं ले पाती हैं। यदि आपकी मिट्टी की नमी 60% से अधिक है, तो पानी देना तुरंत बंद करें और जल निकासी बढ़ाएं।
- **फंगल इन्फेक्शन (रस्ट/ब्लाइट):** पत्तियों पर पीले या भूरे रंग के धब्बे दिखते हैं। नियंत्रण के लिए **नीम के तेल (Neem Oil)** या **कॉपर ऑक्सीक्लोराइड** का छिड़काव करें।`;
      } else if (langCode === 'mr') {
        return telemetryParagraph + `पाने पिवळी पडण्याची (क्लोरोसिस) मुख्य कारणे आणि उपाय खालीलप्रमाणे आहेत:
- **नायट्रोजनची कमतरता:** झाडाची जुनी पाने आधी पिवळी पडतात. यावर उपाय म्हणून **युरिया** किंवा कंपोस्ट खताचा वापर करा.
- **अति सिंचन (पाणी साचणे):** पिकाच्या मुळांना ऑक्सिजन मिळत नाही. मातीतील ओलावा जास्त असल्यास पाणी देणे थांबवा आणि पाण्याचा निचरा करा.
- **बुरशीजन्य रोग (तांबेरा/करपा):** पानांवर पिवळसर तांबूस ठिपके येतात. यावर **कडुनिंबाचे तेल** किंवा **मॅन्कोझेब** बुरशीनाशकाची फवारणी करावी.`;
      } else {
        return telemetryParagraph + `Yellowing leaves (chlorosis) are typically caused by:
1. **Nitrogen (N) Deficiency:** Yellowing starts from older bottom leaves. Apply **Urea** or nitrogen-rich organic compost.
2. **Waterlogging (Overwatering):** Roots choke due to lack of oxygen. If your soil moisture sensor reads above 60%, pause irrigation and clear field drainage.
3. **Fungal Diseases (Rust/Blight):** Characterized by brown or orange spots with yellow halos. Spray **Copper Oxychloride** or organic **Cold Pressed Neem Oil** (1:100 dilution).`;
      }
    }

    // Keyword Match 2: Fertilizer
    if (normalized.includes('fertilizer') || normalized.includes('khad') || normalized.includes('khat') || normalized.includes('खाद') || normalized.includes('खत')) {
      if (langCode === 'hi') {
        return telemetryParagraph + `उर्वरक (खाद) प्रबंधन के लिए ये निर्देश अपनाएं:
- **एनपीके (N-P-K) का संतुलन:** फसल की शुरुआती वृद्धि के लिए **DAP (डाई-अमोनियम फास्फेट)** और **NPK 19-19-19** डालें।
- **फलों/दानों के लिए:** पोटेशियम की कमी पूरी करने के लिए **MOP (म्यूरेट ऑफ पोटाश)** डालें, जिससे दाने बड़े और चमकदार होते हैं।
- **जैविक विकल्प:** प्रति एकड़ 2-3 टन वर्मीकंपोस्ट (केंचुआ खाद) का प्रयोग करें, जो मिट्टी की जलधारण क्षमता बढ़ाता है।
- *सॉइल पीएच का ध्यान रखें:* यदि पीएच 6 से कम है, तो उर्वरक का अवशोषण आधा हो जाता है। पहले मिट्टी में चूना मिलाकर सुधार करें।`;
      } else if (langCode === 'mr') {
        return telemetryParagraph + `खत व्यवस्थापनासाठी खालील शिफारसी आहेत:
- **पेरणीच्या वेळी:** पिकाच्या मजबूत मुळांसाठी **डीएपी (DAP)** किंवा **एनपीके १०:२६:२६** खतांचा वापर करा.
- **शाकीय वाढीसाठी:** पेरणीनंतर २५-३० दिवसांनी **युरिया** खताचा हलका डोस (नत्र) द्यावा.
- **दर्जेदार उत्पादनासाठी:** पोटॅशची कमतरता भरून काढण्यासाठी **म्युअरेट ऑफ पोटाश (MOP)** चा वापर करा, ज्यामुळे रोगप्रतिकारक शक्ती वाढते.
- *टीप:* सेंद्रिय शेणखत किंवा गांडूळ खत दरवर्षी वापरल्यास मातीची सुपीकता दीर्घकाळ टिकते.`;
      } else {
        return telemetryParagraph + `For optimal crop feeding, adopt a balanced fertilizer schedule:
- **Basal Application (Sowing):** Apply **DAP (Diammonium Phosphate)** or compound **NPK 12-32-16** to promote strong root development.
- **Vegetative Growth Phase:** Top-dress with **Urea** (Nitrogen source) around 25-30 days post-germination.
- **Fruit & Grain Quality:** Apply **MOP (Muriate of Potash)** to increase crop immunity, grain weight, and stress tolerance.
- **Organic Farming:** Mix 2-3 tons of Vermicompost per acre to improve organic carbon and soil microbial activity.`;
      }
    }

    // Keyword Match 3: Water
    if (normalized.includes('water') || normalized.includes('pani') || normalized.includes('pani') || normalized.includes('पानी') || normalized.includes('पाणी') || normalized.includes('irrigation')) {
      if (langCode === 'hi') {
        return telemetryParagraph + `सिंचाई (पानी) देने की सही तकनीक:
- **संवेदनशील चरण:** गेहूं में 'मुकुट जड़ बनते समय' (Sowing के 21 दिन बाद) और फूल आते समय सिंचाई अति आवश्यक है।
- **टपक (डिप) सिंचाई:** टमाटर, मिर्च और कपास के लिए ड्रिप सिंचाई अपनाएं। यह 40% तक पानी बचाता है और खरपतवारों को नियंत्रित करता है।
- **सेंसर आधारित सिंचाई:** मिट्टी की नमी 35% से नीचे जाने पर ही पानी दें। अधिक पानी से जड़ों में सड़न पैदा होती है।`;
      } else if (langCode === 'mr') {
        return telemetryParagraph + `पिकाला पाणी (सिंचन) देण्याचे नियोजन:
- **संवेदनशील टप्पे:** मुळांच्या वाढीचा काळ आणि फुले येण्याचा काळ या दरम्यान पिकाला पाण्याचा ताण पडू देऊ नका.
- **ठिबक सिंचन:** भाजीपाला आणि फळबागांसाठी ठिबक सिंचनाचा वापर करा. यामुळे पाण्याची बचत होते आणि बुरशीजन्य रोग कमी होतात.
- **मातीतील ओलावा:** जर ओलावा ३०% पेक्षा कमी असेल तर त्वरित हलके पाणी द्यावे. दलदल करू नये.`;
      } else {
        return telemetryParagraph + `Irrigation and water management advice:
- **Critical Growth Stages:** Do not let crops face water stress during crucial stages (e.g., Crown Root Initiation in wheat, flowering, and grain filling).
- **Drip Irrigation:** Highly recommended for row crops like Tomatoes, Cotton, and Sugarcane. It reduces water use by 40-50% and minimizes weed growth.
- **Sensor-based watering:** Aim to irrigate when your soil moisture drops below 35%. Avoid keeping the soil continuously saturated (>60% moisture) to prevent root rot.`;
      }
    }

    // Keyword Match 4: Next season
    if (normalized.includes('season') || normalized.includes('crop') || normalized.includes('next') || normalized.includes('फसल') || normalized.includes('पीक')) {
      if (langCode === 'hi') {
        return telemetryParagraph + `आगामी मौसम के लिए सर्वोत्तम फसल सुझाव:
- **खरीफ (जून - अक्टूबर):** धान (Rice), मक्का (Maize), सोयाबीन, कपास (Cotton), और अरहर।
- **रबी (नवंबर - अप्रैल):** गेहूं (Wheat), सरसों (Mustard), चना (Gram), और आलू।
- **जायद (मई - जून):** उड़द, मूंग, तरबूज, और खीरा।
- **फसल चक्र (Rotation):** लगातार अनाज उगाने के बजाय बीच में दलहनी (दालों) की फसलें उगाएं, जिससे मिट्टी की नाइट्रोजन प्राकृतिक रूप से बढ़ती है।`;
      } else if (langCode === 'mr') {
        return telemetryParagraph + `पुढील हंगामासाठी पिकांचे नियोजन:
- **खरीप हंगाम (पावसाळी):** भात, सोयाबीन, कापूस, मका, तूर आणि बाजरी.
- **रब्बी हंगाम (हिवाळी):** गहू, हरभरा, मोहरी, करडई आणि ज्वारी.
- **उन्हाळी हंगाम:** मूग, उडीद, कलिंगड, खरबूज आणि पालेभाज्या.
- **पीक फेरपालट:** मातीची सुपीकता टिकवण्यासाठी तृणधान्य पिकांनंतर कडधान्य पिकांची लागवड करावी.`;
      } else {
        return telemetryParagraph + `Best crop suggestions based on the agricultural seasons in India:
1. **Kharif (Monsoon - Jun to Oct):** Rice (Paddy), Cotton, Soybean, Maize, and Pigeon Pea (Arhar).
2. **Rabi (Winter - Nov to Apr):** Wheat, Mustard, Bengal Gram (Harbhara), and Potato.
3. **Zaid (Summer - May to Jun):** Green Gram (Moong), Watermelon, Cucumber, and Fodder crops.
*Pro-Tip:* Rotate heavy feeding crops (like Wheat/Rice) with legumes (like Gram/Peas) to naturally replenish soil Nitrogen levels.`;
      }
    }

    // Default response if no keywords match
    if (langCode === 'hi') {
      return telemetryParagraph + `नमस्ते! मैं आपका एग्रो-लिंक एआई कोपायलट हूं।
मैं कृषि, फसल सुरक्षा, खाद और मिट्टी के स्वास्थ्य का विशेषज्ञ हूं।

आप मुझसे पूछ सकते हैं:
1. "मेरी फसलों की पत्तियाँ पीली क्यों पड़ रही हैं?"
2. "गेहूं की फसल के लिए कौन सा उर्वरक सर्वोत्तम है?"
3. "फसलों को कितना पानी देना चाहिए?"
4. "अगले मौसम के लिए कौन सी फसल लगानी चाहिए?"

कृपया अपना प्रश्न पूछें, मैं सहायता के लिए तत्पर हूं!`;
    } else if (langCode === 'mr') {
      return telemetryParagraph + `नमस्कार! मी तुमचा अ‍ॅग्रो-लिंक एआय कोपायलट आहे.
मी पिके, कीड नियंत्रण, खत व्यवस्थापन आणि मातीच्या आरोग्याविषयी मदत करू शकतो.

तुम्ही मला विचारू शकता:
1. "माझ्या पिकाची पाने पिवळी का पडत आहेत?"
2. "उत्तम वाढीसाठी कोणते खत वापरावे?"
3. "पिकाला किती पाणी दिले पाहिजे?"
4. "पुढील हंगामात कोणते पीक घ्यावे?"

कृपया तुमचा प्रश्न विचारा, मी नक्कीच मदत करेन!`;
    } else {
      return telemetryParagraph + `Hello! I am your AGRO-LINK AI Farmer Copilot.
I specialize in crop health, fertilization schedules, soil diagnostics, and sustainable farming.

You can ask me questions like:
- *"Why are my crop leaves turning yellow?"*
- *"Which fertilizer is best for Tomato crops?"*
- *"How much water should I irrigate during winter?"*
- *"Which crop yields the best returns in the next Rabi season?"*

How can I assist you with your farming needs today?`;
    }
  }
}

export default new AiService();
