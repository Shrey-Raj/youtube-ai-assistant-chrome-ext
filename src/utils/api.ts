import { GoogleGenerativeAI } from '@google/generative-ai';
import { getStoredSummary, storeSummary, getStoredChat, storeChat } from './storage';

const getApiKey = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
      resolve(result.geminiApiKey || null);
    });
  });
};

export const getVideoSummary = async (
  videoId: string,
  videoTitle: string,
  transcript: string | null
): Promise<string> => {
  try {
    // Check if summary is already cached
    const cachedSummary = await getStoredSummary(videoId);
    if (cachedSummary) {
      console.log('Using cached summary for video:', videoId);
      return cachedSummary;
    }

    const apiKey = await getApiKey();
    if (!apiKey) {
      return 'Please set your Gemini API key in extension settings. Click the settings icon in the top right corner.';
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
    const summary = result.response.text();
    
    // Store the summary for future use
    await storeSummary(videoId, videoTitle, summary);
    console.log('Generated and cached new summary for video:', videoId);
    
    return summary;
  } catch (error: any) {
    console.error('Summary error:', error);
    
    if (error.message?.includes('API_KEY_INVALID')) {
      return 'Invalid API key. Please check your Gemini API key in extension settings.';
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      return 'API key lacks required permissions. Please check your Google AI Studio settings.';
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      return 'API quota exceeded. Please check your usage limits in Google AI Studio.';
    }
    
    return 'Failed to generate summary. Please check your API key and try again.';
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
    if (!apiKey) {
      return 'Please set your Gemini API key in extension settings first. Click the settings icon in the top right corner.';
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
    const response = result.response.text();
    
    // Store the updated conversation
    const updatedHistory = [...history, { role: 'model', content: response }];
    await storeChat(videoId, videoTitle, updatedHistory);
    console.log('Updated chat history for video:', videoId);
    
    return response;
  } catch (error: any) {
    console.error('Chat error:', error);
    
    if (error.message?.includes('API_KEY_INVALID')) {
      return 'Invalid API key. Please check your Gemini API key in extension settings.';
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      return 'API key lacks required permissions. Please check your Google AI Studio settings.';
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      return 'API quota exceeded. Please check your usage limits in Google AI Studio.';
    }
    
    return "I'm having trouble answering that. Please check your API key and try again.";
  }
};