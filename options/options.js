document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('options-form').addEventListener('submit', saveOptions);

function saveOptions(e) {
  e.preventDefault();
  const apiKey = document.getElementById('api-key').value;
  const appearance = document.getElementById('appearance').value;
  
  browser.storage.sync.set({
    apiKey: apiKey,
    appearance: appearance
  }).then(() => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    status.style.backgroundColor = '#4CAF50';
    status.style.color = 'white';
    status.style.padding = '10px';
    status.style.marginTop = '10px';
    status.style.borderRadius = '4px';
    setTimeout(() => {
      status.textContent = '';
      status.style.backgroundColor = '';
      status.style.color = '';
      status.style.padding = '';
      status.style.marginTop = '';
      status.style.borderRadius = '';
    }, 3000);
  }).catch(error => {
    const status = document.getElementById('status');
    status.textContent = 'Error saving options: ' + error.message;
    status.style.backgroundColor = '#f44336';
    status.style.color = 'white';
    status.style.padding = '10px';
    status.style.marginTop = '10px';
    status.style.borderRadius = '4px';
  });
}

function restoreOptions() {
  browser.storage.sync.get(['apiKey', 'appearance']).then((result) => {
    document.getElementById('api-key').value = result.apiKey || '';
    document.getElementById('appearance').value = result.appearance || 'system';
    console.log('Restored options:', result);
  }).catch(error => {
    console.error('Error restoring options:', error);
  });
}

// Apply the selected appearance theme
function applyAppearance(appearance) {
  if (appearance === 'system') {
    document.body.classList.remove('light', 'dark');
  } else {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(appearance);
  }
}

// Listen for changes in the appearance setting
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.appearance) {
    applyAppearance(changes.appearance.newValue);
  }
});

// Apply the initial appearance
browser.storage.sync.get('appearance').then((result) => {
  applyAppearance(result.appearance || 'system');
});

// Error handling
window.addEventListener('error', function(event) {
  console.error('Caught error:', event.error);
});
