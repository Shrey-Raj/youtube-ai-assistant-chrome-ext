export interface StoredSummary {
  videoId: string;
  videoTitle: string;
  summary: string;
  timestamp: number;
}

export interface StoredChat {
  videoId: string;
  videoTitle: string;
  messages: Array<{ role: string; content: string }>;
  timestamp: number;
}

export interface StorageData {
  summaries: { [videoId: string]: StoredSummary };
  chats: { [videoId: string]: StoredChat };
}

// Storage keys
const STORAGE_KEYS = {
  SUMMARIES: 'youtube_summaries',
  CHATS: 'youtube_chats'
};

// Cache duration (7 days in milliseconds)
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// Get all stored data
export const getStorageData = async (): Promise<StorageData> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.SUMMARIES, STORAGE_KEYS.CHATS], (result) => {
      resolve({
        summaries: result[STORAGE_KEYS.SUMMARIES] || {},
        chats: result[STORAGE_KEYS.CHATS] || {}
      });
    });
  });
};

// Summary storage functions
export const getStoredSummary = async (videoId: string): Promise<string | null> => {
  const data = await getStorageData();
  const stored = data.summaries[videoId];
  
  if (!stored) return null;
  
  // Check if cache is expired
  if (Date.now() - stored.timestamp > CACHE_DURATION) {
    await removeSummary(videoId);
    return null;
  }
  
  return stored.summary;
};

export const storeSummary = async (videoId: string, videoTitle: string, summary: string): Promise<void> => {
  const data = await getStorageData();
  
  data.summaries[videoId] = {
    videoId,
    videoTitle,
    summary,
    timestamp: Date.now()
  };
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.SUMMARIES]: data.summaries }, () => {
      resolve();
    });
  });
};

export const removeSummary = async (videoId: string): Promise<void> => {
  const data = await getStorageData();
  delete data.summaries[videoId];
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.SUMMARIES]: data.summaries }, () => {
      resolve();
    });
  });
};

// Chat storage functions
export const getStoredChat = async (videoId: string): Promise<Array<{ role: string; content: string }> | null> => {
  const data = await getStorageData();
  const stored = data.chats[videoId];
  
  if (!stored) return null;
  
  // Check if cache is expired
  if (Date.now() - stored.timestamp > CACHE_DURATION) {
    await removeChat(videoId);
    return null;
  }
  
  return stored.messages;
};

export const storeChat = async (
  videoId: string, 
  videoTitle: string, 
  messages: Array<{ role: string; content: string }>
): Promise<void> => {
  const data = await getStorageData();
  
  data.chats[videoId] = {
    videoId,
    videoTitle,
    messages,
    timestamp: Date.now()
  };
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.CHATS]: data.chats }, () => {
      resolve();
    });
  });
};

export const removeChat = async (videoId: string): Promise<void> => {
  const data = await getStorageData();
  delete data.chats[videoId];
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.CHATS]: data.chats }, () => {
      resolve();
    });
  });
};

// Clear all stored data
export const clearAllStorage = async (): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.remove([STORAGE_KEYS.SUMMARIES, STORAGE_KEYS.CHATS], () => {
      resolve();
    });
  });
};

// Get storage usage info
export const getStorageInfo = async (): Promise<{
  summaryCount: number;
  chatCount: number;
  totalSize: number;
}> => {
  const data = await getStorageData();
  
  return {
    summaryCount: Object.keys(data.summaries).length,
    chatCount: Object.keys(data.chats).length,
    totalSize: JSON.stringify(data).length
  };
};