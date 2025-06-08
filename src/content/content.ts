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
      const transcript = getTranscript();
      sendResponse({ title, transcript });
    } catch (error) {
      console.error('Error getting video details:', error);
      sendResponse({ title: '', transcript: null });
    }
  }

  return true; // Keep message channel open for async responses
});

function openTranscript() {
  try {
    const transcriptButton = document.querySelector('button[aria-label="Show transcript"]') as HTMLElement;
    if (transcriptButton) {
      transcriptButton.click();
      return;
    }

    const menuButton = document.querySelector('#button-shape > button.yt-spec-button-shape-next') as HTMLElement;
    if (menuButton) {
      menuButton.click();

      setTimeout(() => {
        const transcriptOption = document.querySelector('yt-menu-service-item-renderer:last-child') as HTMLElement;
        if (transcriptOption) transcriptOption.click();
      }, 300);
    }
  } catch (error) {
    console.error('Failed to open transcript:', error);
  }
}

function getTranscript(): string | null {
  try {
    const transcriptPanel = document.querySelector('ytd-transcript-segment-list-renderer');
    if (transcriptPanel) {
      const segments = transcriptPanel.querySelectorAll('ytd-transcript-segment-renderer');
      const transcriptLines: string[] = [];

      segments.forEach(segment => {
        const textElement = segment.querySelector('.segment-text');
        if (textElement?.textContent) {
          transcriptLines.push(textElement.textContent);
        }
      });

      if (transcriptLines.length > 0) {
        return transcriptLines.join(' ');
      }
    }

    const captionContainer = document.querySelector('.ytp-caption-segment');
    if (captionContainer?.textContent) {
      return captionContainer.textContent;
    }

    const scriptTags = document.getElementsByTagName('script');
    for (let i = 0; i < scriptTags.length; i++) {
      const scriptContent = scriptTags[i].textContent;
      if (scriptContent?.includes('captionTracks')) {
        const regex = /"captionTracks":(\[.*?\])/;
        const match = scriptContent.match(regex);
        if (match && match[1]) {
          const captionTracks = JSON.parse(match[1]);
          if (captionTracks.length > 0 && captionTracks[0].baseUrl) {
            return captionTracks[0].baseUrl;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Transcript extraction failed:', error);
    return null;
  }
}
