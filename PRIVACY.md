# Privacy Policy for ChatGPT Custom Prompts

**Last Updated:** October 23, 2025

## Overview

ChatGPT Custom Prompts is a Chrome extension that helps you send selected text to your custom ChatGPT assistant with configurable prompts and keyboard shortcuts. This privacy policy explains how the extension handles your data.

## Data Collection and Storage

### What Data We Collect

The extension stores the following data **locally on your device** using Chrome's sync storage:

- **Extension Configuration**: Your custom GPT URL, context menu title, and action settings
- **Custom Actions**: Action titles, prompts, keyboard shortcuts, and enabled/disabled states
- **Extension Preferences**: Auto-submit setting, "Run All" feature toggle, and shortcut configurations

### Where Data is Stored

All configuration data is stored using Chrome's `chrome.storage.sync` API, which:
- Syncs across your Chrome browsers when signed into the same Google account
- Is controlled entirely by you through your Google account settings
- Can be cleared at any time through the extension's options page or Chrome settings

### Data We DO NOT Collect

- We do not collect, transmit, or store any personal information
- We do not track your browsing history
- We do not collect analytics or usage statistics
- We do not send any data to external servers (except as described below)

## Data Sharing and Third Parties

### ChatGPT Integration

When you use the extension to send text to ChatGPT:
- Selected text is sent directly to ChatGPT.com in your browser
- This interaction is governed by OpenAI's privacy policy
- We do not intercept, store, or have access to this data
- The extension acts only as a convenience tool to automate text insertion

### No Third-Party Sharing

We do not share, sell, or transmit your data to any third parties. The extension operates entirely within your browser.

## Permissions Explained

The extension requests the following Chrome permissions:

- **`contextMenus`**: Creates right-click menu options for quick access to your custom prompts
- **`tabs`**: Opens and focuses ChatGPT tabs when you trigger an action
- **`scripting`**: Inserts your selected text into the ChatGPT interface
- **`activeTab`**: Reads selected text from the current webpage
- **`storage`**: Saves your extension configuration and preferences
- **`<all_urls>` (Content Script)**: Required for keyboard shortcuts to work on all websites

These permissions are used solely for the extension's core functionality and not for any data collection.

## Data Security

- All data remains on your device or in your Google Chrome sync storage
- No data is transmitted to our servers (we don't have any servers)
- Configuration data is only accessible to you through Chrome's sync mechanism

## Your Rights and Control

You have complete control over your data:

- **Export Configuration**: Use the "Export JSON" feature to backup your settings
- **Import Configuration**: Restore settings from a previously exported file
- **Delete Data**: Uninstalling the extension removes all locally stored data
- **Modify Data**: Change any settings through the extension's options page at any time

## Children's Privacy

This extension does not knowingly collect any information from children under 13. The extension is a productivity tool intended for general audiences.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. Any changes will be posted in this document with an updated "Last Updated" date.

## Open Source

This extension is open source and licensed under the MIT License. You can review the complete source code at:
https://github.com/keithfry/chatgpt-query-extension

## Contact

For questions or concerns about this privacy policy, please:
- Open an issue on GitHub: https://github.com/keithfry/chatgpt-query-extension/issues
- Review the source code to understand exactly how the extension works

## Consent

By installing and using ChatGPT Custom Prompts, you consent to this privacy policy.
