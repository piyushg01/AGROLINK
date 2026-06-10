import CopilotChat from '../models/copilotChat.model.js';
import aiService from '../services/ai.service.js';

/**
 * Ask AI Farmer Copilot
 */
export const askCopilot = async (req, res) => {
  try {
    const { message, language, telemetry } = req.body;
    const userId = req.user.id;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const langCode = language || 'en';

    // 1. Get recent chat history for context (last 10 messages)
    const recentMessages = await CopilotChat.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Reverse messages to maintain chronological order
    const contextHistory = recentMessages.reverse().map(c => ({
      sender: c.sender,
      message: c.message
    }));

    // 2. Generate Response
    const customGeminiKey = req.headers['x-gemini-key'];
    const customOpenaiKey = req.headers['x-openai-key'];

    const responseText = await aiService.generateResponse(
      message.trim(),
      langCode,
      contextHistory,
      telemetry,
      { gemini: customGeminiKey, openai: customOpenaiKey }
    );

    // 3. Save User Message to MongoDB
    const userMessage = new CopilotChat({
      user: userId,
      message: message.trim(),
      sender: 'user',
      language: langCode
    });
    await userMessage.save();

    // 4. Save Assistant Response to MongoDB
    const assistantMessage = new CopilotChat({
      user: userId,
      message: responseText,
      sender: 'assistant',
      language: langCode
    });
    await assistantMessage.save();

    // 5. Return success and AI response
    res.json({
      success: true,
      response: responseText,
      userMessage,
      assistantMessage
    });
  } catch (error) {
    console.error('Error in AI Copilot Controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI Copilot request',
      error: error.message
    });
  }
};

/**
 * Get Chat History
 */
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await CopilotChat.find({ user: userId })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching AI history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI chat history',
      error: error.message
    });
  }
};

/**
 * Clear Chat History
 */
export const clearChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    await CopilotChat.deleteMany({ user: userId });

    res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing AI history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history',
      error: error.message
    });
  }
};
