chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Summary & Chat extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_VIDEO_DATA') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      if (tab?.id && tab.url?.includes('youtube.com/watch')) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            files: ['content.js'], // Make sure this matches the build output name
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error('Script injection failed:', chrome.runtime.lastError.message);
              sendResponse({ videoId: null, videoTitle: '', transcript: null });
              return;
            }

            chrome.tabs.sendMessage(
              tab.id as number,
              { type: 'GET_VIDEO_DETAILS' },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.error('Message error:', chrome.runtime.lastError.message);
                  sendResponse({ videoId: null, videoTitle: '', transcript: null });
                  return;
                }

                const urlParams = new URL(tab.url!).searchParams;
                const videoId = urlParams.get('v');

                sendResponse({
                  videoId,
                  videoTitle: response?.title || '',
                  transcript: response?.transcript || null,
                });
              }
            );
          }
        );

        return true; // keep channel open
      }

      // Not on a YouTube watch page
      sendResponse({ videoId: null, videoTitle: '', transcript: null });
    });

    return true; // asynchronous
  }
});
