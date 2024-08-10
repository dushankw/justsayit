let isRecording = false;
let apiKey = '';
let recorder = null;
let db;

// Open IndexedDB
const dbName = "RecordingsDB";
const request = indexedDB.open(dbName, 1);

request.onerror = function(event) {
  console.error("IndexedDB error:", event.target.error);
};

request.onsuccess = function(event) {
  db = event.target.result;
  console.log("IndexedDB opened successfully");
};

request.onupgradeneeded = function(event) {
  db = event.target.result;
  const objectStore = db.createObjectStore("recordings", { keyPath: "id", autoIncrement: true });
  console.log("Object store created");
};

function saveRecording(blob, transcription) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["recordings"], "readwrite");
    const objectStore = transaction.objectStore("recordings");
    const request = objectStore.add({ 
      blob: blob, 
      transcription: transcription, 
      timestamp: new Date()
    });

    request.onsuccess = function(event) {
      console.log("Recording saved successfully");
      resolve(event.target.result);
    };

    request.onerror = function(event) {
      console.error("Error saving recording:", event.target.error);
      reject(event.target.error);
    };
  });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleRecording") {
    toggleRecording().then(result => sendResponse(result));
    return true; // Indicates that we will send a response asynchronously
  } else if (message.action === "getRecordingState") {
    sendResponse({ isRecording });
  } else if (message.action === "getApiKey") {
    sendResponse({ apiKey });
  } else if (message.action === "transcribeAudio") {
    transcribeAudio(message.audioBlob).then(result => sendResponse(result));
    return true; // Indicates that we will send a response asynchronously
  }
});

function updateIcon() {
  const path = isRecording ? "icons/sayit-recording-32.png" : "icons/sayit-32.png";
  browser.browserAction.setIcon({ path });
}

async function toggleRecording() {
  console.log("[Background] Toggling recording. Current state:", isRecording);
  try {
    const tabs = await browser.tabs.query({active: true, currentWindow: true});
    if (tabs.length === 0) {
      throw new Error("No active tab found");
    }
    const tabId = tabs[0].id;

    // Inject content script if it hasn't been injected yet
    await injectContentScriptIfNeeded(tabId);

    if (!isRecording) {
      const response = await browser.tabs.sendMessage(tabId, { action: "startRecording" });
      console.log("[Background] Start recording response:", response);
      if (response === true) {
        isRecording = true;
        updateIcon();
        return { isRecording: true };
      } else {
        throw new Error("Failed to start recording");
      }
    } else {
      const audioBlob = await browser.tabs.sendMessage(tabId, { action: "stopRecording" });
      console.log("[Background] Stop recording response:", audioBlob);
      if (audioBlob instanceof Blob) {
        isRecording = false;
        updateIcon();
        // Transcribe the audio
        const transcription = await transcribeAudio(audioBlob);
        // Save the recording locally
        try {
          const id = await saveRecording(audioBlob, transcription);
          console.log("[Background] Recording stopped, audio blob saved with ID:", id);
          return { isRecording: false, recordingId: id, transcription: transcription };
        } catch (error) {
          console.error("[Background] Error saving recording:", error);
          throw new Error("Failed to save recording");
        }
      } else {
        throw new Error("Invalid response when stopping recording");
      }
    }
  } catch (err) {
    console.error("[Background] Error toggling recording:", err);
    return { isRecording: isRecording, error: err.message };
  }
}

async function injectContentScriptIfNeeded(tabId) {
  try {
    await browser.tabs.sendMessage(tabId, { action: "ping" });
  } catch (error) {
    // If the content script is not injected, this will throw an error
    console.log("[Background] Content script not found, injecting...");
    await browser.tabs.executeScript(tabId, { file: "/content.js" });
  }
}

// Load the API key from storage
function loadApiKey() {
  browser.storage.sync.get('apiKey').then((result) => {
    apiKey = result.apiKey || '';
  });
}

// Listen for changes in the API key
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.apiKey) {
    apiKey = changes.apiKey.newValue;
  }
});

// Initial load of API key
loadApiKey();

function getAllRecordings() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["recordings"], "readonly");
    const objectStore = transaction.objectStore("recordings");
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
      resolve(event.target.result);
    };

    request.onerror = function(event) {
      console.error("Error retrieving recordings:", event.target.error);
      reject(event.target.error);
    };
  });
}

// Add a new message listener for retrieving and deleting recordings
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getAllRecordings") {
    getAllRecordings().then(recordings => sendResponse(recordings));
    return true; // Indicates that we will send a response asynchronously
  } else if (message.action === "deleteRecording") {
    deleteRecording(message.recordingId).then(result => sendResponse(result));
    return true; // Indicates that we will send a response asynchronously
  } else if (message.action === "getRecording") {
    getRecording(message.recordingId).then(result => sendResponse(result));
    return true; // Indicates that we will send a response asynchronously
  }
});

function getRecording(recordingId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["recordings"], "readonly");
    const objectStore = transaction.objectStore("recordings");
    const request = objectStore.get(parseInt(recordingId));

    request.onsuccess = function(event) {
      const recording = event.target.result;
      if (recording) {
        resolve({ blob: recording.blob, transcription: recording.transcription });
      } else {
        reject(new Error("Recording not found"));
      }
    };

    request.onerror = function(event) {
      console.error("Error retrieving recording:", event.target.error);
      reject(event.target.error);
    };
  });
}

function deleteRecording(recordingId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["recordings"], "readwrite");
    const objectStore = transaction.objectStore("recordings");
    const request = objectStore.delete(parseInt(recordingId));

    request.onsuccess = function(event) {
      console.log("Recording deleted successfully");
      resolve({ success: true });
    };

    request.onerror = function(event) {
      console.error("Error deleting recording:", event.target.error);
      reject({ success: false, error: event.target.error });
    };
  });
}


async function transcribeAudio(audioBlob) {
  if (!apiKey) {
    throw new Error("API key not set");
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-1");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}
