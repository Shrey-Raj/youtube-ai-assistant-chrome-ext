import { GoogleGenerativeAI } from '@google/generative-ai';

const getApiKey = async (): Promise<string> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
      resolve(result.geminiApiKey || 'AIzaSyAX2NRmgSvVQroJya3OD-deGYdHV2WG4SI');
    });
  });
};

export const getVideoSummary = async (
  videoId: string,
  videoTitle: string,
  transcript: string | null
): Promise<string> => {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      return 'Please set your Gemini API key in extension settings';
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    
    // Handle different transcript scenarios
    let prompt;
    if (transcript) {
      if (transcript.startsWith('http')) {
        // Transcript URL needs to be fetched
        prompt = `Generate a summary for the YouTube video "${videoTitle}" (ID: ${videoId}) using its transcript.`;
      } else {
        // Direct transcript text
        prompt = `Generate a comprehensive summary of this YouTube video transcript:
        
        Video Title: ${videoTitle}
        Video ID: ${videoId}
        
        Transcript:
        ${transcript.substring(0, 30000)}`; // Limit to Gemini's token count
      }
    } else {
      // Fallback to title-based summary
      prompt = `Generate a summary for the YouTube video titled "${videoTitle}" (ID: ${videoId}) based on its title.`;
    }
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error('Summary error:', error);
    return 'Failed to generate summary. Transcript might be unavailable.';
  }
};

export const chatWithVideo = async (
  videoId: string,
  videoTitle: string,
  transcript: string | null,
  history: Array<{role: string, content: string}>
): Promise<string> => {
  try {
    const apiKey = await getApiKey();
    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      return 'Please set your Gemini API key first';
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
    
    // Create context prompt
    let context = `You're answering questions about a YouTube video.\nTitle: ${videoTitle}\nID: ${videoId}`;
    
    if (transcript && !transcript.startsWith('http')) {
      context += `\nTranscript Excerpt: ${transcript.substring(0, 10000)}`;
    }
    
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: context }]
        },
        ...history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      ],
      generationConfig: { maxOutputTokens: 1000 }
    });
    
    const lastMessage = history[history.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    return result.response.text();
  } catch (error) {
    console.error('Chat error:', error);
    return "I'm having trouble answering that. Please try again.";
  }
};