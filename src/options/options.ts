// Options page functionality
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settingsForm') as HTMLFormElement;
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
  const testBtn = document.getElementById('testBtn') as HTMLButtonElement;
  const statusDiv = document.getElementById('status') as HTMLDivElement;

  // Load saved settings
  loadSettings();

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings();
  });

  // Test API key
  testBtn.addEventListener('click', () => {
    testApiKey();
  });

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['geminiApiKey']);
      if (result.geminiApiKey) {
        apiKeyInput.value = result.geminiApiKey;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function saveSettings() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({ geminiApiKey: apiKey });
      showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showStatus('Error saving settings. Please try again.', 'error');
    }
  }

  async function testApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter an API key first', 'error');
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    
    try {
      // Import Gemini AI library dynamically
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      
      // Test with a simple prompt
      const result = await model.generateContent('Say "API key is working" if you can read this.');
      const response = result.response.text();
      
      if (response) {
        showStatus('✅ API key is working correctly!', 'success');
      } else {
        showStatus('❌ API key test failed - no response received', 'error');
      }
    } catch (error: any) {
      console.error('API key test error:', error);
      
      if (error.message?.includes('API_KEY_INVALID')) {
        showStatus('❌ Invalid API key. Please check your key and try again.', 'error');
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        showStatus('❌ API key lacks required permissions. Please check your Google AI Studio settings.', 'error');
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        showStatus('❌ API quota exceeded. Please check your usage limits.', 'error');
      } else {
        showStatus(`❌ API key test failed: ${error.message || 'Unknown error'}`, 'error');
      }
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Test API Key';
    }
  }

  function showStatus(message: string, type: 'success' | 'error') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  }
});