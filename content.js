let mediaRecorder = null;
let audioChunks = [];

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startRecording") {
    startRecording().then(sendResponse);
    return true;
  } else if (message.action === "stopRecording") {
    stopRecording().then(sendResponse);
    return true;
  } else if (message.action === "ping") {
    sendResponse(true);
    return true;
  }
});

async function startRecording() {
  try {
    console.log("Requesting audio permission");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Audio permission granted");
    
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", event => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("start", () => {
      console.log("MediaRecorder started");
    });

    mediaRecorder.addEventListener("error", (event) => {
      console.error("MediaRecorder error:", event.error);
    });

    mediaRecorder.start();
    return true;
  } catch (err) {
    console.error("Error starting recording:", err.name, err.message);
    return false;
  }
}

function stopRecording() {
  return new Promise((resolve) => {
    mediaRecorder.addEventListener("stop", () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      resolve(audioBlob);
    });
    mediaRecorder.stop();
  });
}

function insertTextAtCursor(text) {
  const activeElement = document.activeElement;
  if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    const value = activeElement.value;
    activeElement.value = value.slice(0, start) + text + value.slice(end);
    activeElement.selectionStart = activeElement.selectionEnd = start + text.length;

    // Simulate user input events
    simulateUserInput(activeElement);
  } else if (activeElement.isContentEditable) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.selectNodeContents(textNode);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    // Simulate user input events
    simulateUserInput(activeElement);
  }
}

// New function to simulate user input events
function simulateUserInput(element) {
  // Simulate input event
  const inputEvent = new Event('input', { bubbles: true, cancelable: true });
  element.dispatchEvent(inputEvent);

  // Simulate keypress event
  const keypressEvent = new KeyboardEvent('keypress', { 
    key: 'a', 
    code: 'KeyA',
    which: 65,
    keyCode: 65,
    bubbles: true, 
    cancelable: true 
  });
  element.dispatchEvent(keypressEvent);

  // Simulate keydown event
  const keydownEvent = new KeyboardEvent('keydown', { 
    key: 'a', 
    code: 'KeyA',
    which: 65,
    keyCode: 65,
    bubbles: true, 
    cancelable: true 
  });
  element.dispatchEvent(keydownEvent);

  // Simulate keyup event
  const keyupEvent = new KeyboardEvent('keyup', { 
    key: 'a', 
    code: 'KeyA',
    which: 65,
    keyCode: 65,
    bubbles: true, 
    cancelable: true 
  });
  element.dispatchEvent(keyupEvent);

  // Simulate change event
  const changeEvent = new Event('change', { bubbles: true, cancelable: true });
  element.dispatchEvent(changeEvent);
}

// Listen for transcription results from the background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "insertTranscription") {
    insertTextAtCursor(message.text);
    sendResponse(true);
    return true;
  }
});
