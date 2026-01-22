# Network Tracker Chrome Extension

A powerful Developer Tool extension to monitor, filter, and analyze network requests (`fetch` & `XHR`) directly within the page context. Includes a floating UI overlay for real-time tracking without opening DevTools.

![Network Tracker Icon](public/icon.png)

## Features

- **Real-time Monitoring**: Intercepts and logs `fetch` and `XMLHttpRequest` events.
- **In-Page Overlay**: Floating, non-intrusive UI to view network activity while browsing.
- **Smart Filtering**: Configure specific URL patterns (e.g., `*api*`, `*example.com*`) to track.
- **Deep Property Extraction**: Automatically extract and display specific JSON fields from request/response bodies (e.g., `data.id`, `user.token`) in the list view.
- **Resilient Parsing**: Handles "dirty" JSON (e.g., JSON followed by garbage characters) gracefully.
- **Accessibility**: High-contrast UI designed to be visible on any background.

## Installation (User)

1. Go to the [Releases](../../releases) page and download `network-tracker-extension.zip`.
2. Unzip the file.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** (top right toggle).
5. Click **Load unpacked** and select the unzipped folder.

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install
```

### Building

To build the extension for production (outputs to `dist/`):

```bash
npm run build
```

This will:

1. Compile TypeScript.
2. Build the React app with Vite.
3. Bundle the Content Script and Injection Hook.
4. Copy assets and generating manifest.

### Local Development

To run in watch mode:

```bash
npm run dev
```

To run linting:

```bash
npm run lint
```

_Note: You still need to reload the extension in `chrome://extensions` heavily during development as content scripts don't always hot-reload perfectly depending on the context._

## Architecture

- **Manifest V3**: Uses the latest Chrome Extensions API.
- **React 19**: UI built with modern React.
- **Vite**: Fast build tool and bundler.
- **TailwindCSS 4**: for styling.
- **Shadow DOM**: The overlay UI is encapsulated in a Shadow Root to prevent style conflicts with the host page.
- **Main World Injection**: Injects a `hook.js` script into the main page context to monkey-patch `window.fetch` and `XMLHttpRequest`.

## Configuration

1. Click the extension icon in the toolbar.
2. Clicking **Add New Page**.
3. Set a **Page URL Pattern** (e.g., `*localhost*` or `*`).
4. Add **Tracking Rules**:
   - `URL Pattern`: Glob pattern for API endpoints (e.g. `*/api/v1/*`).
   - `Req. Prop` (Optional): JSON path to track in request body (e.g. `data.id`).
   - `Res. Prop` (Optional): JSON path to track in response body.
5. Save and refresh the target page.

## Release

This repository uses GitHub Actions to automatically build and release the extension.

- Push to `master` triggers a release.
- The workflow parses `package.json` version.
- A new GitHub Release is created with the zipped extension.
