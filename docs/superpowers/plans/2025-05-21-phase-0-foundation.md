# Phase 0: Foundation — Implementation Plan

**Goal:** Scaffold the MarkdownWarriorPreview VS Code extension project with Vite+Svelte webview, build pipeline, and working bi-directional communication bridge.

**Architecture:** TypeScript extension host bundled with esbuild, Svelte 5 webview bundled with Vite, postMessage bridge connecting both sides.

**Tech Stack:** TypeScript, Svelte 5, Vite, esbuild, VS Code Extension API

---

### Task 1: Initialize Extension Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.vscodeignore`
- Create: `.gitignore`
- Create: `src/extension/extension.ts`

- [ ] **Step 1: Initialize npm project**

```bash
npm init -y
```

- [ ] **Step 2: Install extension host dependencies**

```bash
npm install --save-dev @types/vscode typescript esbuild @vscode/vsce
```

- [ ] **Step 3: Create package.json extension manifest**

Replace the generated `package.json` with:

```json
{
  "name": "markdown-warrior-preview",
  "displayName": "MarkdownWarriorPreview",
  "description": "A modern, beautiful markdown preview with presentation mode for VS Code",
  "version": "0.0.1",
  "publisher": "your-publisher-id",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onLanguage:markdown"
  ],
  "main": "./dist/extension/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "markdownWarrior.openPreview",
        "title": "Markdown Warrior: Open Preview",
        "icon": "$(open-preview)"
      }
    ],
    "menus": {
      "editor/title": [
        {
          "when": "resourceLangId == markdown",
          "command": "markdownWarrior.openPreview",
          "group": "navigation"
        }
      ]
    },
    "configuration": {
      "title": "Markdown Warrior Preview",
      "properties": {
        "markdownWarrior.scrollSync": {
          "type": "boolean",
          "default": true,
          "description": "Enable two-way scroll sync between editor and preview"
        },
        "markdownWarrior.fontSize": {
          "type": "number",
          "default": 16,
          "description": "Font size in preview (px)"
        },
        "markdownWarrior.lineHeight": {
          "type": "number",
          "default": 1.6,
          "description": "Line height in preview"
        },
        "markdownWarrior.showTOC": {
          "type": "boolean",
          "default": true,
          "description": "Show table of contents sidebar"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run build",
    "build": "npm run build:extension && npm run build:webview",
    "build:extension": "esbuild src/extension/extension.ts --bundle --outfile=dist/extension/extension.js --external:vscode --format=cjs --platform=node",
    "build:webview": "vite build",
    "watch:extension": "esbuild src/extension/extension.ts --bundle --outfile=dist/extension/extension.js --external:vscode --format=cjs --platform=node --watch",
    "dev": "concurrently \"npm run watch:extension\" \"vite build --watch\""
  },
  "devDependencies": {}
}
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/extension/**/*"],
  "exclude": ["node_modules", "dist", "src/webview"]
}
```

- [ ] **Step 5: Create .vscodeignore**

```
.vscode/**
node_modules/**
src/**
docs/**
.kiro/**
*.ts
!dist/**
vite.config.ts
tsconfig*.json
.gitignore
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
dist/
*.vsix
.vscode-test/
```

- [ ] **Step 7: Create minimal extension entry point**

Create `src/extension/extension.ts`:

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    'markdownWarrior.openPreview',
    () => {
      vscode.window.showInformationMessage('MarkdownWarriorPreview activated!');
    }
  );

  context.subscriptions.push(command);
}

export function deactivate() {}
```

- [ ] **Step 8: Build and verify extension compiles**

```bash
npx esbuild src/extension/extension.ts --bundle --outfile=dist/extension/extension.js --external:vscode --format=cjs --platform=node
```

Expected: `dist/extension/extension.js` created, no errors.

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: initialize extension project scaffold"
```

---

### Task 2: Setup Svelte Webview with Vite

**Files:**
- Create: `src/webview/main.ts`
- Create: `src/webview/App.svelte`
- Create: `src/webview/index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.webview.json`

- [ ] **Step 1: Install webview dependencies**

```bash
npm install --save-dev svelte @sveltejs/vite-plugin-svelte vite concurrently
npm install --save-dev @tsconfig/svelte
```

- [ ] **Step 2: Create tsconfig.webview.json**

```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "outDir": "dist/webview",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/webview/**/*", "src/webview/**/*.svelte"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'dist/webview',
    rollupOptions: {
      input: resolve(__dirname, 'src/webview/index.html'),
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    emptyOutDir: true,
  },
});
```

- [ ] **Step 4: Create src/webview/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Markdown Warrior Preview</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: Create src/webview/main.ts**

```typescript
import App from './App.svelte';
import { mount } from 'svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
```

- [ ] **Step 6: Create src/webview/App.svelte**

```svelte
<script lang="ts">
  let message = $state('MarkdownWarriorPreview — Webview Ready');
</script>

<main>
  <h1>{message}</h1>
  <p>Webview is connected and running.</p>
</main>

<style>
  main {
    font-family: var(--vscode-font-family, sans-serif);
    color: var(--vscode-editor-foreground, #333);
    background: var(--vscode-editor-background, #fff);
    padding: 20px;
    min-height: 100vh;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
</style>
```

- [ ] **Step 7: Build webview and verify**

```bash
npx vite build
```

Expected: `dist/webview/` created with `index.html` and `assets/` folder.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: setup Svelte webview with Vite build"
```

---

### Task 3: Connect Extension Host to Webview

**Files:**
- Create: `src/extension/preview-provider.ts`
- Modify: `src/extension/extension.ts`

- [ ] **Step 1: Create preview-provider.ts**

Create `src/extension/preview-provider.ts`:

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class PreviewProvider {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private readonly extensionUri: vscode.Uri) {}

  public show(editor: vscode.TextEditor) {
    const column = vscode.ViewColumn.Beside;

    if (this.panel) {
      this.panel.reveal(column);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'markdownWarriorPreview',
        'Markdown Warrior Preview',
        column,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview'),
            ...(vscode.workspace.workspaceFolders?.map(f => f.uri) || []),
          ],
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    }

    this.panel.webview.html = this.getWebviewContent(this.panel.webview);
  }

  private getWebviewContent(webview: vscode.Webview): string {
    const distPath = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview');

    const htmlPath = vscode.Uri.joinPath(distPath, 'index.html');
    let html = fs.readFileSync(htmlPath.fsPath, 'utf-8');

    // Replace relative paths with webview URIs
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distPath, 'assets', 'main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distPath, 'assets', 'main.css')
    );

    const nonce = getNonce();

    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `img-src ${webview.cspSource} https: data:`,
      `font-src ${webview.cspSource}`,
    ].join('; ');

    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>Markdown Warrior Preview</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;

    return html;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
```

- [ ] **Step 2: Update extension.ts to use PreviewProvider**

Replace `src/extension/extension.ts`:

```typescript
import * as vscode from 'vscode';
import { PreviewProvider } from './preview-provider';

export function activate(context: vscode.ExtensionContext) {
  const previewProvider = new PreviewProvider(context.extensionUri);

  const command = vscode.commands.registerCommand(
    'markdownWarrior.openPreview',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        previewProvider.show(editor);
      } else {
        vscode.window.showWarningMessage('Open a Markdown file first.');
      }
    }
  );

  context.subscriptions.push(command);
}

export function deactivate() {}
```

- [ ] **Step 3: Update vite.config.ts for proper output naming**

Replace `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'dist/webview',
    rollupOptions: {
      input: resolve(__dirname, 'src/webview/index.html'),
      output: {
        entryFileNames: 'assets/main.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/main.[ext]',
      },
    },
    emptyOutDir: true,
  },
});
```

- [ ] **Step 4: Build both and verify**

```bash
npm run build:extension && npx vite build
```

Expected: Both `dist/extension/extension.js` and `dist/webview/` exist without errors.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: connect extension host to Svelte webview panel"
```

---

### Task 4: Implement Message Bridge (Typed Bi-directional Communication)

**Files:**
- Create: `src/shared/messages.ts`
- Create: `src/webview/lib/message-bridge.ts`
- Modify: `src/extension/preview-provider.ts`
- Modify: `src/webview/App.svelte`

- [ ] **Step 1: Create shared message types**

Create `src/shared/messages.ts`:

```typescript
// Messages from Extension Host → Webview
export type HostToWebviewMessage =
  | { type: 'update'; html: string; sourceMap: SourceMapEntry[] }
  | { type: 'scrollTo'; line: number }
  | { type: 'themeChanged' }
  | { type: 'configChanged'; config: PreviewConfig };

// Messages from Webview → Extension Host
export type WebviewToHostMessage =
  | { type: 'openExternal'; url: string }
  | { type: 'openFile'; path: string }
  | { type: 'scrollSync'; line: number }
  | { type: 'checkboxToggle'; line: number; checked: boolean }
  | { type: 'ready' };

export interface SourceMapEntry {
  line: number;
  offset: number;
}

export interface PreviewConfig {
  fontSize: number;
  lineHeight: number;
  scrollSync: boolean;
  showTOC: boolean;
}
```

- [ ] **Step 2: Create webview message bridge**

Create `src/webview/lib/message-bridge.ts`:

```typescript
import type { HostToWebviewMessage, WebviewToHostMessage } from '../../shared/messages';

declare function acquireVsCodeApi(): {
  postMessage(message: WebviewToHostMessage): void;
  getState(): any;
  setState(state: any): void;
};

const vscode = acquireVsCodeApi();

export function postMessage(message: WebviewToHostMessage): void {
  vscode.postMessage(message);
}

export function onMessage(handler: (message: HostToWebviewMessage) => void): void {
  window.addEventListener('message', (event) => {
    handler(event.data as HostToWebviewMessage);
  });
}

export function getState<T>(): T | undefined {
  return vscode.getState() as T | undefined;
}

export function setState<T>(state: T): void {
  vscode.setState(state);
}
```

- [ ] **Step 3: Add message handling to preview-provider.ts**

Add to `PreviewProvider` class in `src/extension/preview-provider.ts`, after `this.panel.webview.html = ...`:

```typescript
    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      (message: WebviewToHostMessage) => {
        switch (message.type) {
          case 'ready':
            this.updateContent(editor);
            break;
          case 'openExternal':
            if (message.url.startsWith('https://') || message.url.startsWith('http://')) {
              vscode.env.openExternal(vscode.Uri.parse(message.url));
            }
            break;
          case 'openFile':
            const uri = vscode.Uri.file(message.path);
            vscode.workspace.openTextDocument(uri).then(doc => {
              vscode.window.showTextDocument(doc);
            });
            break;
          case 'scrollSync':
            // Will be implemented in Phase v0.1
            break;
          case 'checkboxToggle':
            // Will be implemented in Phase v0.2
            break;
        }
      },
      undefined,
      []
    );
```

Add the import at the top:
```typescript
import type { WebviewToHostMessage } from '../shared/messages';
```

Add the `updateContent` method:
```typescript
  private updateContent(editor: vscode.TextEditor) {
    if (!this.panel) return;
    const text = editor.document.getText();
    this.panel.webview.postMessage({
      type: 'update',
      html: `<div class="markdown-body"><p>${text.substring(0, 200)}...</p></div>`,
      sourceMap: [],
    });
  }
```

- [ ] **Step 4: Update App.svelte to use message bridge**

Replace `src/webview/App.svelte`:

```svelte
<script lang="ts">
  import { onMessage, postMessage } from './lib/message-bridge';

  let html = $state('<p>Loading preview...</p>');

  onMessage((message) => {
    switch (message.type) {
      case 'update':
        html = message.html;
        break;
      case 'scrollTo':
        // Will be implemented in Phase v0.1
        break;
    }
  });

  // Notify host that webview is ready
  postMessage({ type: 'ready' });
</script>

<main>
  <div class="markdown-body">
    {@html html}
  </div>
</main>

<style>
  main {
    font-family: var(--vscode-font-family, sans-serif);
    color: var(--vscode-editor-foreground, #333);
    background: var(--vscode-editor-background, #fff);
    padding: 20px;
    min-height: 100vh;
  }

  :global(.markdown-body) {
    max-width: 800px;
    margin: 0 auto;
  }
</style>
```

- [ ] **Step 5: Build and verify**

```bash
npm run build:extension && npx vite build
```

Expected: No errors. Both sides compile with shared types.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: implement typed bi-directional message bridge"
```

---

### Task 5: Add Development Workflow (launch.json + watch mode)

**Files:**
- Create: `.vscode/launch.json`
- Create: `.vscode/tasks.json`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Create .vscode/launch.json**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "preLaunchTask": "npm: build"
    }
  ]
}
```

- [ ] **Step 2: Create .vscode/tasks.json**

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "npm",
      "script": "build",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "problemMatcher": ["$tsc"]
    }
  ]
}
```

- [ ] **Step 3: Install concurrently**

```bash
npm install --save-dev concurrently
```

- [ ] **Step 4: Verify dev workflow**

```bash
npm run build
```

Expected: Both extension and webview build successfully. `dist/` contains both `extension/` and `webview/` folders.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add development workflow (launch config + build tasks)"
```

---

## Phase 0 Complete Checklist

After all tasks:
- [ ] `npm run build` succeeds without errors
- [ ] Extension activates in Extension Development Host (F5)
- [ ] Command "Markdown Warrior: Open Preview" appears in command palette
- [ ] Webview panel opens beside editor when command is run on .md file
- [ ] Webview shows "Loading preview..." then raw text content
- [ ] Message bridge works (ready → update cycle)
- [ ] All code committed to git
