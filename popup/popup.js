let isRecording = false;

document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggle-recording');
  const statusMessage = document.createElement('p');
  statusMessage.id = 'status-message';
  document.body.appendChild(statusMessage);

  const transcriptionResult = document.createElement('p');
  transcriptionResult.id = 'transcription-result';
  document.body.appendChild(transcriptionResult);

  const recordingsList = document.createElement('ul');
  recordingsList.id = 'recordings-list';
  document.body.appendChild(recordingsList);

  // Fetch and display saved recordings
  browser.runtime.sendMessage({ action: "getAllRecordings" })
    .then(recordings => {
      // Sort recordings by timestamp, most recent first
      recordings.sort((a, b) => b.timestamp - a.timestamp);
      
      recordings.forEach((recording, index) => {
        const li = document.createElement('li');
        const recordingDate = new Date(recording.timestamp);
        const transcriptionPreview = recording.transcription ? recording.transcription.split(' ').slice(0, 5).join(' ') + '...' : 'No transcription available';
        
        li.innerHTML = `
          <div class="recording-info">
            <span class="recording-number">${index + 1}.</span>
            <span class="recording-preview">${transcriptionPreview}</span>
          </div>
          <div class="recording-actions">
            <button class="play-btn" data-id="${recording.id}" title="Play">▶️</button>
            <button class="copy-btn" data-id="${recording.id}" title="Copy Transcription">📋</button>
            <button class="delete-btn" data-id="${recording.id}" title="Delete">🗑️</button>
          </div>
        `;
        recordingsList.appendChild(li);
      });

      // Add event listeners for play and delete buttons
      recordingsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('play-btn')) {
          const recordingId = e.target.getAttribute('data-id');
          togglePlayback(recordingId);
        } else if (e.target.classList.contains('copy-btn')) {
          const recordingId = e.target.getAttribute('data-id');
          copyTranscription(recordingId);
        } else if (e.target.classList.contains('delete-btn')) {
          const recordingId = e.target.getAttribute('data-id');
          confirmDelete(recordingId);
        }
      });

      function copyTranscription(recordingId) {
        browser.runtime.sendMessage({ action: "getRecording", recordingId: recordingId })
          .then(response => {
            if (response && response.transcription) {
              navigator.clipboard.writeText(response.transcription).then(() => {
                alert('Transcription copied to clipboard!');
              }).catch(err => {
                console.error('Failed to copy text: ', err);
              });
            } else {
              console.error("Failed to get transcription");
            }
          })
          .catch(error => {
            console.error("Error fetching recording:", error);
          });
      }
    })
    .catch(error => {
      console.error("Error fetching recordings:", error);
    });

let audioContext;
let currentSource;
let isPlaying = false;

function togglePlayback(recordingId) {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (isPlaying) {
    stopPlayback();
  } else {
    browser.runtime.sendMessage({ action: "getRecording", recordingId: recordingId })
      .then(response => {
        if (response && response.blob) {
          playAudioBlob(response.blob, recordingId);
        } else {
          console.error("Failed to get recording blob");
        }
      })
      .catch(error => {
        console.error("Error fetching recording:", error);
      });
  }
}

function playAudioBlob(blob, recordingId) {
  const fileReader = new FileReader();

  fileReader.onload = function(event) {
    const arrayBuffer = event.target.result;
    audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
      currentSource = audioContext.createBufferSource();
      currentSource.buffer = audioBuffer;
      currentSource.connect(audioContext.destination);
      currentSource.onended = () => stopPlayback(recordingId);
      currentSource.start();
      isPlaying = true;
      updatePlayButtonState(recordingId);
    });
  };

  fileReader.readAsArrayBuffer(blob);
}

function stopPlayback(recordingId) {
  if (currentSource) {
    currentSource.stop();
    currentSource.disconnect();
    currentSource = null;
  }
  isPlaying = false;
  updatePlayButtonState(recordingId);
}

function updatePlayButtonState(playingRecordingId) {
  const playButtons = document.querySelectorAll('.play-btn');
  playButtons.forEach(button => {
    const recordingId = button.getAttribute('data-id');
    button.textContent = (isPlaying && recordingId === playingRecordingId) ? '⏹️' : '▶️';
  });
}

function confirmDelete(recordingId) {
  const dialog = document.createElement('div');
  dialog.id = 'confirmation-dialog';
  dialog.innerHTML = `
    <div id="confirmation-dialog-content">
      <p>Are you sure you want to delete this recording?</p>
      <button id="confirm-yes">Yes</button>
      <button id="confirm-no">No</button>
    </div>
  `;
  document.body.appendChild(dialog);

  document.getElementById('confirm-yes').addEventListener('click', () => {
    deleteRecording(recordingId);
    document.body.removeChild(dialog);
  });

  document.getElementById('confirm-no').addEventListener('click', () => {
    document.body.removeChild(dialog);
  });
}

function deleteRecording(recordingId) {
  browser.runtime.sendMessage({ action: "deleteRecording", recordingId: recordingId })
    .then(response => {
      if (response.success) {
        // Refresh the entire popup window
        window.location.reload();
      } else {
        console.error('Failed to delete recording:', response.error);
      }
    });
}
  
  // Get initial recording state
  browser.runtime.sendMessage({ action: "getRecordingState" }, (response) => {
    if (response && response.isRecording !== undefined) {
      isRecording = response.isRecording;
      updateButtonState();
    } else {
      console.error("Invalid response from background script:", response);
      // Set a default state or show an error message to the user
      isRecording = false;
      updateButtonState();
      statusMessage.textContent = "Error: Couldn't get recording state";
      statusMessage.style.color = 'red';
    }
  });

  toggleButton.addEventListener('click', function() {
    browser.runtime.sendMessage({ action: "toggleRecording" })
      .then((response) => {
        console.log("[Popup] Toggle recording response:", response);
        if (response && response.isRecording !== undefined) {
          isRecording = response.isRecording;
          console.log("[Popup] Recording state changed. isRecording:", isRecording);
          updateButtonState();
          statusMessage.textContent = isRecording ? "Recording..." : "Recording stopped.";
          statusMessage.style.color = isRecording ? 'green' : 'black';
          
          if (!isRecording && response.transcription) {
            transcriptionResult.textContent = `Transcription: ${response.transcription}`;
            // Send transcription to content script to insert into active element
            browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
              browser.tabs.sendMessage(tabs[0].id, {
                action: "insertTranscription",
                text: response.transcription
              });
            });
          }
        } else if (response && response.error) {
          console.error("[Popup] Error toggling recording:", response.error);
          statusMessage.textContent = `Error: ${response.error}`;
          statusMessage.style.color = 'red';
        } else {
          throw new Error("Invalid response from background script");
        }
      })
      .catch((error) => {
        console.error("[Popup] Error in toggle recording:", error);
        statusMessage.textContent = "Error: " + error.message;
        statusMessage.style.color = 'red';
        // Reset recording state on error
        isRecording = false;
        updateButtonState();
      });
  });
});

function updateButtonState() {
  const toggleButton = document.getElementById('toggle-recording');
  console.log("[Popup] Updating button state. isRecording:", isRecording);
  toggleButton.textContent = isRecording ? "Stop Recording" : "Start Recording";
  toggleButton.style.backgroundColor = isRecording ? "#ff4444" : "#4CAF50";
  console.log("[Popup] Button background color set to:", toggleButton.style.backgroundColor);
}


