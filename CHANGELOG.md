# Changelog

All notable changes to ChatGPT Custom Prompts extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2025-10-31

### Changed
- Import/Export button labels changed from "Import/Export JSON" to "Import/Export Settings"
- Added explanatory note "Settings are saved as .json files" positioned to the right of buttons
- Improved layout to better utilize horizontal space on desktop while maintaining mobile responsiveness

### Improved
- User-friendly terminology for non-technical users
- Clearer understanding of what import/export functionality does

## [2.2.0] - 2025-10-31

### Changed
- Prompt input field in options page changed from single-line to multiline textarea
- Textarea defaults to 2 rows and is vertically expandable for longer prompts

### Improved
- User experience when creating and editing action prompts
- Better support for complex, multi-line prompt templates

## [2.1.1] - 2025-10-26

### Added
- Config version tracking system
- Automatic configuration migration between versions
- Version field added to configuration schema

### Changed
- Improved configuration management with versioning support
- Enhanced backward compatibility for config updates

## [2.1.0] - 2025-10-25

### Changed
- Default configuration now starts empty instead of pre-populated
- Enhanced user experience for first-time setup
- Streamlined initial configuration process

### Improved
- User onboarding experience
- Configuration clarity for new users

## [2.0.3] - 2025-10-25

### Added
- Custom extension icons (16px, 24px, 48px, 128px)
- Chrome Web Store submission package
- Privacy Policy documentation (PRIVACY.md)
- Source images for icon design
- Build system organization
- Chrome Web Store screenshots

### Changed
- Extension description updated for clarity
- Rebranded to "ChatGPT Custom Prompts"

### Removed
- Personal custom prompt files (`my-custom-prompt.txt`)
- Old version history from README
- Example configuration references

## [2.0.2] - 2025-10-23

### Added
- MIT License for open source distribution
- Required field validation for action title and prompt fields

### Changed
- Notification banners now fixed to top of viewport (always visible)
- Cleaned up README documentation
- Removed "Configuration" subtitle from options page
- Updated export filename to `chatgpt-actions-config.json`

### Removed
- Upgrade guides from README
- Default configuration examples from documentation

### Fixed
- Banner positioning for better visibility during scrolling

## [2.0.1] - 2025-10-23

### Added
- Required field validation for action configuration
- Slide-down animations for better UX

### Changed
- Rebranded extension from "Job Search GPT Actions" to "ChatGPT Actions"
- Improved options page header design
- Cleaner notification banner styling
- Export filename changed to `chatgpt-actions-config.json`

### Fixed
- Notification banners now stay at top of viewport

## [2.0.0] - 2025-10-23

### Added
- **Full Configuration UI**: Options page for all settings
- **Custom Actions**: Add, edit, remove, and reorder actions without code changes
- **Custom Keyboard Shortcuts**: Assign any keyboard shortcut to any action
- **Mac Compatibility**: Keyboard shortcuts using `e.code` for cross-platform support
- **Configurable Context Menu**: Customize right-click menu title
- **Run All Actions**: Optional feature to execute all actions in parallel
  - Enable/disable toggle
  - Configurable keyboard shortcut
- **Import/Export**: Backup and share configurations via JSON
- **Dynamic Menus**: Context menus rebuild automatically from configuration
- **Parallel Tab Creation**: Run All creates tabs efficiently while preserving order
- **Keyboard Shortcut Content Script**: Page-level shortcut handling for all URLs
- **Automatic Migration**: Seamless upgrade from v1.6.0 hardcoded configuration

### Changed
- Configuration now stored in `chrome.storage.sync` instead of code
- Moved from hardcoded actions to fully dynamic system
- Improved keyboard shortcut handling for reliability

### Breaking Changes
- Configuration must be done through options page (no more code editing)
- Existing v1.6.0 users will have config automatically migrated on first run
