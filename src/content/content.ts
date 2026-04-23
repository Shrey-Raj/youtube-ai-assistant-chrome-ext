chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log("DEBUG: Content script received message:", message.type);

  if (
    message.type === "GET_VIDEO_DETAILS" ||
    message.type === "GET_TRANSCRIPT"
  ) {
    const title = document.title.replace(" - YouTube", "");

    getTranscriptWithRetry().then((transcript) => {
      // console.log(
      //   "DEBUG: Final transcript result to send:",
      //   transcript ? transcript.substring(0, 50) + "..." : "NULL",
      // );
      sendResponse({ title, transcript });
    });
    return true;
  }

  if (message.type === "OPEN_TRANSCRIPT") {
    openTranscript();
    return true;
  }
});

async function getTranscript(): Promise<string | null> {
  try {
    // console.log("DEBUG: Attempting to extract transcript...");

    let segments = document.querySelectorAll('transcript-segment-view-model');
    if (segments.length > 0) {
      // console.log("DEBUG: Found transcript-segment-view-model elements.");
      const textParts: string[] = [];
      for (const seg of segments) {
        const textSpan = seg.querySelector('span[class*="ytAttributeDistinguished"]');
        if (textSpan) {
          const text = textSpan.textContent?.trim();
          if (text) textParts.push(text);
        } else {
          // fallback: remove timestamp div
          const clone = seg.cloneNode(true) as Element;
          const ts = clone.querySelector('.ytTranscriptSegmentViewModelDateTimeStamp');
          if (ts) ts.remove();
          const remaining = clone.textContent?.trim();
          if (remaining) textParts.push(remaining);
        }
      }
      if (textParts.length) {
        const result = textParts.join(" ").replace(/\s+/g, " ").trim();
        // console.log(`Extracted ${textParts.length} segments (modern), length ${result.length}`);
        return result;
      }
    }

    // Strategy 2: Look for classic ytd-transcript-segment-renderer with .segment.text
    segments = document.querySelectorAll('ytd-transcript-segment-renderer');
    if (segments.length === 0) {
      // Also try fallback selector for any element with class 'segment' and role button
      segments = document.querySelectorAll('.segment[role="button"], .segment-text');
    }

    if (segments.length === 0) {
      // console.log("DEBUG: No transcript segments found.");
      return null;
    }

    // console.log(`DEBUG: Found ${segments.length} segment elements.`);
    const textParts: string[] = [];

    for (const seg of segments) {
      // Try multiple possible text containers
      let textElem = seg.querySelector('yt-formatted-string.segment.text, .segment-text, .text');
      if (!textElem) {
        // If the segment itself contains direct text (no nested element)
        textElem = seg;
      }
      let raw = textElem?.textContent?.trim() || "";
      // Remove leading timestamp if present (e.g., "0:01 ")
      raw = raw.replace(/^\d+:\d+\s*/, '');
      if (raw) textParts.push(raw);
    }

    if (textParts.length === 0) {
      // console.log("DEBUG: No text extracted from segments.");
      return null;
    }

    const result = textParts.join(" ").replace(/\s+/g, " ").trim();
    // console.log(`Extracted ${textParts.length} segments, length ${result.length}`);
    return result;
  } catch (err) {
    console.error("DEBUG: getTranscript error:", err);
    return null;
  }
}


async function getTranscriptWithRetry(maxRetries = 5): Promise<string | null> {
  let transcript = await getTranscript();
  if (transcript) return transcript;

  // console.log("DEBUG: No immediate transcript, starting UI interaction...");

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await openTranscriptAsync();
      
      const pollStart = Date.now();
      while (Date.now() - pollStart < 3000) {
        transcript = await getTranscript();
        if (transcript) {
          // console.log(`DEBUG: Transcript found after polling in attempt ${attempt + 1}`);
          return transcript;
        }
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      
      // console.log(`DEBUG: Attempt ${attempt + 1} polling timed out.`);
    } catch (error) {
      console.error(`DEBUG: Attempt ${attempt + 1} crashed:`, error);
    }
  }

  return null;
}

function openTranscriptAsync(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const transcriptPanel = document.querySelector(
        "ytd-transcript-segment-list-renderer",
      );
      if (transcriptPanel) {
        // console.log("Transcript panel already open");
        resolve();
        return;
      }

      const transcriptButton = document.querySelector(
        'button[aria-label="Show transcript"]',
      ) as HTMLElement;
      if (transcriptButton) {
        // console.log("Clicking transcript button");
        transcriptButton.click();
        setTimeout(() => resolve(), 800);
        return;
      }

      const menuButton = document.querySelector(
        "#button-shape > button.yt-spec-button-shape-next",
      ) as HTMLElement;
      if (menuButton) {
        // console.log("Opening menu to find transcript");
        menuButton.click();

        setTimeout(() => {
          const transcriptOption = document.querySelector(
            "yt-menu-service-item-renderer:last-child",
          ) as HTMLElement;
          if (transcriptOption) {
            // console.log("Clicking transcript option from menu");
            transcriptOption.click();
            resolve();
          } else {
            reject(new Error("Transcript option not found in menu"));
          }
        }, 300);
      } else {
        reject(new Error("No transcript controls found"));
      }
    } catch (error) {
      reject(error);
    }
  });
}

function openTranscript() {
  openTranscriptAsync().catch((error) => {
    console.error("Failed to open transcript:", error);
  });
}