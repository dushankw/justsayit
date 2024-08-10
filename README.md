# justsayit - webextension that enables voice typing

justsayit allows users to use their voice to enter text into any field that has focus.

- the extension works on any website

## Install

As it's not in the Firefox extensions store yet, you need to load it locally.

Run this to open it in firefox:

```shell
./scripts/test_extension.sh
```

Then add your OpenAI API key to settings.

## Recording voice

The justsayit webext icon toggles recording on and off.
When recording, the icon is a red colour. When not recording it is greyscale.

justsayit only switches to recording mode if user focus is in a text input field. If no field that could receive the text has focus a popup message is shown explaining what happened and what is required from the user.

## Converting to text

When recording stops, the audio is converted to text via an OpenAI Whisper API call. This defaults to OpenAI's endpoint but users may update the endpoint in Options to point to another location.

The text returned is then written into the text input field that has focus.

## How to Access the Options Page

To access the options page for the justsayit extension:

1. Open Firefox and click on the menu icon (three horizontal lines) in the top-right corner.
2. Select "Add-ons and Themes" from the menu.
3. In the left sidebar, click on "Extensions".
4. Find "justsayit" in the list of installed extensions.
5. Click on the three-dot menu next to the justsayit extension.
6. Select "Options" from the dropdown menu.

Alternatively, you can access the options page directly by entering this URL in your Firefox address bar:

# Implementation

## Options

Users are able to update the following options:

Option | Default | Description
--- | --- | ---
OPENAI_API_KEY    | | Your OpenAI API key (stored securely)
OPENAI_BASE_URL   | https://api.openai.com/v1/audio/transcriptions | The base URL for OpenAI API calls
Appearance | System | The appearance theme (System/Light/Dark)

## Security

- The OpenAI API key is stored securely using the browser's built-in secure storage mechanism.
- The API key is never exposed in client-side code and is only used in background scripts.
- All API calls are made using HTTPS to ensure data security.

## Potential Future Features

We are considering implementing the following features in future updates:

1. Language Selection: Choose the language for speech recognition.
2. Punctuation Commands: Use voice commands for adding punctuation.
3. Text Formatting: Voice commands for basic text formatting (bold, italic, etc.).
4. Undo/Redo: Undo/redo functionality for voice input.
5. Custom Wake Words: Set custom wake words to start/stop recording.
6. Continuous Recording Mode: Option for continuous recording with automatic pauses.
7. Text Preview: Preview transcribed text before inserting.
8. Keyboard Shortcuts: Customizable keyboard shortcuts for main functions.
9. Voice Command Mode: Set of voice commands for controlling the extension.
10. Privacy Mode: Temporarily disable the extension on certain websites.

These features are subject to change based on user feedback and development priorities.


```
about:addons
```

Then find "justsayit" in the list and click on "Preferences" or "Options".

In the options page, you can set your OpenAI API key and choose your preferred appearance theme.
