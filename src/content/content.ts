chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TRANSCRIPT') {
    try {
      const transcript = getTranscript();
      sendResponse({ transcript });
    } catch (error) {
      console.error('Transcript error:', error);
      sendResponse({ transcript: null });
    }
  }

  if (message.type === 'OPEN_TRANSCRIPT') {
    openTranscript();
  }

  if (message.type === 'GET_VIDEO_DETAILS') {
    try {
      const title = document.title.replace(' - YouTube', '');
      // Try to get transcript, if not available, attempt to open transcript panel
      getTranscriptWithRetry()
        .then(transcript => {
          sendResponse({ title, transcript });
        })
        .catch(error => {
          console.error('Error getting video details:', error);
          sendResponse({ title, transcript: null });
        });
    } catch (error) {
      console.error('Error getting video details:', error);
      sendResponse({ title: '', transcript: null });
    }
    return true; // Keep message channel open for async response
  }

  return true; // Keep message channel open for async responses
});

async function getTranscriptWithRetry(maxRetries = 3): Promise<string | null> {
  // First, try to get existing transcript
  let transcript = getTranscript();
  if (transcript) {
    console.log('Transcript found immediately');
    return transcript;
  }

  // If no transcript found, try to open transcript panel and wait
  console.log('No transcript found, attempting to open transcript panel...');
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try to open transcript
      await openTranscriptAsync();
      
      // Wait a bit for content to load
      await new Promise(resolve => setTimeout(resolve, 1000 + (attempt * 500)));
      
      // Try to get transcript again
      transcript = getTranscript();
      if (transcript) {
        console.log(`Transcript found after attempt ${attempt + 1}`);
        return transcript;
      }
    } catch (error) {
      console.error(`Transcript attempt ${attempt + 1} failed:`, error);
    }
  }

  console.log('Failed to get transcript after all attempts');
  return null;
}

function openTranscriptAsync(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // First, check if transcript is already open
      const transcriptPanel = document.querySelector('ytd-transcript-segment-list-renderer');
      if (transcriptPanel) {
        console.log('Transcript panel already open');
        resolve();
        return;
      }

      // Try to find and click the transcript button
      const transcriptButton = document.querySelector('button[aria-label="Show transcript"]') as HTMLElement;
      if (transcriptButton) {
        console.log('Clicking transcript button');
        transcriptButton.click();
        resolve();
        return;
      }

      // Try the menu approach
      const menuButton = document.querySelector('#button-shape > button.yt-spec-button-shape-next') as HTMLElement;
      if (menuButton) {
        console.log('Opening menu to find transcript');
        menuButton.click();

        setTimeout(() => {
          const transcriptOption = document.querySelector('yt-menu-service-item-renderer:last-child') as HTMLElement;
          if (transcriptOption) {
            console.log('Clicking transcript option from menu');
            transcriptOption.click();
            resolve();
          } else {
            reject(new Error('Transcript option not found in menu'));
          }
        }, 300);
      } else {
        reject(new Error('No transcript controls found'));
      }
    } catch (error) {
      reject(error);
    }
  });
}

function openTranscript() {
  openTranscriptAsync().catch(error => {
    console.error('Failed to open transcript:', error);
  });
}

function getTranscript(): string | null {
  try {
    // Method 1: Check for open transcript panel
    const transcriptPanel = document.querySelector('ytd-transcript-segment-list-renderer');
    if (transcriptPanel) {
      const segments = transcriptPanel.querySelectorAll('ytd-transcript-segment-renderer');
      const transcriptLines: string[] = [];

      segments.forEach(segment => {
        const textElement = segment.querySelector('.segment-text');
        if (textElement?.textContent) {
          transcriptLines.push(textElement.textContent.trim());
        }
      });

      if (transcriptLines.length > 0) {
        console.log(`Found transcript with ${transcriptLines.length} segments`);
        return transcriptLines.join(' ');
      }
    }

    // Method 2: Check for live captions
    const captionContainer = document.querySelector('.ytp-caption-segment');
    if (captionContainer?.textContent) {
      console.log('Found live caption text');
      return captionContainer.textContent;
    }

    // Method 3: Extract from page data (fallback)
    const scriptTags = document.getElementsByTagName('script');
    for (let i = 0; i < scriptTags.length; i++) {
      const scriptContent = scriptTags[i].textContent;
      if (scriptContent?.includes('captionTracks')) {
        const regex = /"captionTracks":(\[.*?\])/;
        const match = scriptContent.match(regex);
        if (match && match[1]) {
          try {
            const captionTracks = JSON.parse(match[1]);
            if (captionTracks.length > 0 && captionTracks[0].baseUrl) {
              console.log('Found caption track URL in page data');
              return captionTracks[0].baseUrl;
            }
          } catch (parseError) {
            console.error('Error parsing caption tracks:', parseError);
          }
        }
      }
    }

    console.log('No transcript found using any method');
    return null;
  } catch (error) {
    console.error('Transcript extraction failed:', error);
    return null;
  }
}