# MVP Plan for justsayit Firefox Extension

## 1. Set up the basic extension structure
- Create manifest.json
- Add icon files
- Create background script
- Create popup HTML and JS

## 2. Implement basic UI
- Design a simple popup with a toggle button for recording
- Create CSS for styling

## 3. Implement recording functionality
- Add audio recording capability
- Handle recording start/stop
- Update icon based on recording state

## 4. Implement text field focus detection
- Detect when a text input field has focus
- Show an alert if no text field is focused when trying to record

## 5. Implement audio to text conversion
- Set up communication with OpenAI Whisper API
- Convert recorded audio to text

## 6. Implement text insertion
- Insert converted text into the focused text field

## 7. Create options page
- Allow users to set OpenAI API key and base URL
- Implement Appearance option (System/Light/Dark)
- Create logic to apply the selected appearance theme
- Implement secure storage for API key using browser.storage.sync
- Add input validation and sanitization for API key

## 8. Implement secure API key handling
- Use API key only in background scripts
- Ensure all API calls use HTTPS
- Implement error handling for API key issues

## 9. Add error handling and user feedback
- Provide user feedback for various scenarios (e.g., API errors, no internet connection, API key issues)

## 9. Test and debug
- Test on various websites
- Fix any bugs or issues

## 10. Prepare for distribution
- Update README with usage instructions
- Package the extension for submission to Firefox Add-ons

## Decisions Made:
1. We will use vanilla JavaScript for the extension development.
2. The extension will have an Appearance option that defaults to 'System' but can be set to 'light' or 'dark'.

## Remaining Questions to Address:
1. Are there any specific browser permissions we should be aware of, other than the obvious ones like audio recording and accessing the current tab?

## Potential Additional Features:
1. Language Selection: Allow users to choose the language for speech recognition.
2. Punctuation Commands: Implement voice commands for adding punctuation.
3. Text Formatting: Add voice commands for basic text formatting (bold, italic, etc.).
4. Undo/Redo: Implement undo/redo functionality for voice input.
5. Custom Wake Words: Allow users to set custom wake words to start/stop recording.
6. Continuous Recording Mode: Add an option for continuous recording with automatic pauses.
7. Text Preview: Show a preview of the transcribed text before inserting it.
8. Keyboard Shortcuts: Add customizable keyboard shortcuts for main functions.
9. Voice Command Mode: Implement a set of voice commands for controlling the extension.
10. Privacy Mode: Add an option to temporarily disable the extension on certain websites.

These features can be prioritized and implemented in future iterations based on user feedback and development resources.
