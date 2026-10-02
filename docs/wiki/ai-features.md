# AI and Text Generation

<!-- Maintained by Tidewiki. Edits are kept on later updates; wrap text in tidewiki:keep markers to freeze it. -->

The application provides AI-powered features for generating diagrams from natural language descriptions and converting between text-based diagram formats. These capabilities are integrated through the "Text-to-Diagram" (TTD) dialog system, which combines chat-based AI interaction with diagram preview and conversion.

## Overview

The AI and text generation system has two main entry points:

1. **Text-to-Diagram (TTD) Chat** — An AI-powered chat interface where users describe diagrams in natural language, and an LLM generates Mermaid diagram syntax [`packages/excalidraw/components/TTDDialog/TextToDiagram.tsx:1-50`](../../packages/excalidraw/components/TTDDialog/TextToDiagram.tsx#L1-L50)

2. **Mermaid-to-Excalidraw Conversion** — A manual editor for Mermaid diagram syntax with real-time conversion to Excalidraw elements and live preview [`packages/excalidraw/components/TTDDialog/MermaidToExcalidraw.tsx:63-127`](../../packages/excalidraw/components/TTDDialog/MermaidToExcalidraw.tsx#L63-L127)

Both features are accessible through a tabbed dialog opened via the TTDDialogTrigger in the UI menu.

## Text-to-Diagram Chat Interface

### Chat Panel and Messaging

The chat interface displays a conversation history between the user and an AI assistant. [`packages/excalidraw/components/TTDDialog/Chat/ChatInterface.tsx:17-54`](../../packages/excalidraw/components/TTDDialog/Chat/ChatInterface.tsx#L17-L54) Messages are rendered via `ChatMessage` components that handle rendering user prompts, assistant responses, errors, and action buttons.

**Message Types** [`packages/excalidraw/components/TTDDialog/types.ts:26-39`](../../packages/excalidraw/components/TTDDialog/types.ts#L26-L39):
- `user` — User-submitted prompts
- `assistant` — AI-generated Mermaid diagram code
- `warning` — System messages about rate limits or errors

The chat input textarea auto-expands up to 120px maximum height and supports Shift+Enter for multi-line input, with Ctrl/Cmd+Enter to submit [`packages/excalidraw/components/TTDDialog/Chat/ChatInterface.tsx:88-95`](../../packages/excalidraw/components/TTDDialog/Chat/ChatInterface.tsx#L88-L95).

### Chat Message Actions

Assistant messages support several actions when not generating [`packages/excalidraw/components/TTDDialog/Chat/ChatMessage.tsx:168-215`](../../packages/excalidraw/components/TTDDialog/Chat/ChatMessage.tsx#L168-L215):

- **Insert** — Add the generated diagram to the canvas
- **View as Mermaid** — Switch to the Mermaid editor tab to edit the diagram syntax
- **Delete** — Remove the message from history
- **Retry** — For network errors only, with a 5-second cooldown between retries [`packages/excalidraw/components/TTDDialog/Chat/ChatMessage.tsx:33-59`](../../packages/excalidraw/components/TTDDialog/Chat/ChatMessage.tsx#L33-L59)
- **AI Repair** — Request the AI to fix a parse error (only when the error is on the last message) [`packages/excalidraw/components/TTDDialog/Chat/ChatMessage.tsx:131-155`](../../packages/excalidraw/components/TTDDialog/Chat/ChatMessage.tsx#L131-L155)

### Chat History and Persistence

Chat conversations are automatically saved and can be restored. [`packages/excalidraw/components/TTDDialog/useTTDChatStorage.ts:35-192`](../../packages/excalidraw/components/TTDDialog/useTTDChatStorage.ts#L35-L192) The `useTTDChatStorage` hook manages loading, saving, and deleting chats using a provided `TTDPersistenceAdapter`. Saved chats are kept as a rolling window of up to 10 conversations, sorted by timestamp descending [`packages/excalidraw/components/TTDDialog/useTTDChatStorage.ts:129-134`](../../packages/excalidraw/components/TTDDialog/useTTDChatStorage.ts#L129-L134).

A history menu accessed via a button in the chat panel header allows users to switch between saved chats, create new conversations, and delete old ones [`packages/excalidraw/components/TTDDialog/Chat/ChatHistoryMenu.tsx:24-87`](../../packages/excalidraw/components/TTDDialog/Chat/ChatHistoryMenu.tsx#L24-L87).

## Text Generation Flow

### Generation and Streaming

The `useTextGeneration` hook orchestrates text generation by calling a user-provided `onTextSubmit` callback. [`packages/excalidraw/components/TTDDialog/hooks/useTextGeneration.ts:26-224`](../../packages/excalidraw/components/TTDDialog/hooks/useTextGeneration.ts#L26-L224) The callback receives an array of chat messages (limited to the last 3 prior messages plus the current user prompt) and streaming callbacks.

**Streaming Response Handling**:
1. `onStreamCreated` — Called when the stream begins
2. `onChunk` — Called for each text delta received
3. Chunks are accumulated into the assistant message content in real-time
4. The message `isGenerating` flag controls UI states (input disabled, send button shows stop icon)

**Error Handling**:
- Network errors (status 429, 500, etc.) are caught and set as `errorType: "network"` [`packages/excalidraw/components/TTDDialog/hooks/useTextGeneration.ts:171-191`](../../packages/excalidraw/components/TTDDialog/hooks/useTextGeneration.ts#L171-L191)
- Parse errors occur when the generated response fails Mermaid validation; these are set as `errorType: "parse"` [`packages/excalidraw/components/TTDDialog/hooks/useTextGeneration.ts:193-203`](../../packages/excalidraw/components/TTDDialog/hooks/useTextGeneration.ts#L193-L203)
- Rate limit remaining is tracked and the chat input is disabled when the limit reaches zero [`packages/excalidraw/components/TTDDialog/hooks/useTextGeneration.ts:143-169`](../../packages/excalidraw/components/TTDDialog/hooks/useTextGeneration.ts#L143-L169)

### TTDStreamFetch Utility

The `TTDStreamFetch` function handles Server-Sent Events (SSE) streaming from the backend. [`packages/excalidraw/components/TTDDialog/utils/TTDStreamFetch.ts:84-224`](../../packages/excalidraw/components/TTDDialog/utils/TTDStreamFetch.ts#L84-L224) It parses SSE-formatted messages, extracts rate limit headers (`X-Ratelimit-Limit`, `X-Ratelimit-Remaining`), and returns a structured response containing the full generated text or an error.

## Mermaid Diagram Conversion

### Live Preview Rendering

The `useMermaidRenderer` hook manages rendering Mermaid diagrams to an Excalidraw canvas preview. [`packages/excalidraw/components/TTDDialog/hooks/useMermaidRenderer.ts:28-213`](../../packages/excalidraw/components/TTDDialog/hooks/useMermaidRenderer.ts#L28-L213) It throttles rendering based on performance: fast renders (< 100ms) use a 300ms throttle, while slower renders use a 3000ms throttle to avoid excessive redraws during streaming.

The hook performs two key operations:
1. **Streaming render** — As the AI generates Mermaid code, validate the syntax and render incrementally
2. **Final flush** — After generation completes, force a final render of the complete diagram

### Mermaid Validation

The `isValidMermaidSyntax` function performs lightweight client-side validation by checking [`packages/excalidraw/components/TTDDialog/utils/mermaidValidation.ts:1-41`](../../packages/excalidraw/components/TTDDialog/utils/mermaidValidation.ts#L1-L41):
- Balanced brackets `[]`, braces `{}`, and parentheses `()`
- No incomplete patterns at the end of the last line (dangling arrows, colons, etc.)

This allows the renderer to skip rendering attempts on incomplete streaming content.

### Conversion and Canvas Export

The `convertMermaidToExcalidraw` function calls the Mermaid-to-Excalidraw library to parse diagram syntax and generates Excalidraw elements. [`packages/excalidraw/components/TTDDialog/common.ts:43-131`](../../packages/excalidraw/components/TTDDialog/common.ts#L43-L131) It includes a fallback mechanism: if parsing fails with double quotes in the input, it retries with single quotes normalized, keeping the original error for accurate line number reporting in error messages [`packages/excalidraw/components/TTDDialog/common.ts:73-95`](../../packages/excalidraw/components/TTDDialog/common.ts#L73-L95).

Once elements are generated, they are exported to a canvas for preview using the application's export utilities.

## Error Recovery and Auto-Fix

### Error Detection

Mermaid parsing errors are categorized [`packages/excalidraw/components/TTDDialog/utils/mermaidError.ts:1-62`](../../packages/excalidraw/components/TTDDialog/utils/mermaidError.ts#L1-L62):
- **Parse errors** — Syntax issues detected by the Mermaid parser
- **Inactive participant errors** — Runtime errors in sequence diagrams (trying to deactivate an already-inactive participant)
- **Lexical errors** — Unrecognized characters

### Auto-Fix Candidates

The `getMermaidAutoFixCandidates` function generates repair suggestions for auto-fixable errors. [`packages/excalidraw/components/TTDDialog/utils/mermaidAutoFix.ts:114-175`](../../packages/excalidraw/components/TTDDialog/utils/mermaidAutoFix.ts#L114-L175) Common fixes include:

- Stripping trailing tokens after shape definitions [`packages/excalidraw/components/TTDDialog/utils/mermaidAutoFix.ts:33-49`](../../packages/excalidraw/components/TTDDialog/utils/mermaidAutoFix.ts#L33-L49)
- Removing extra arrowheads in edge labels (e.g., `-->|label|>` → `-->|label|`) [`packages/excalidraw/components/TTDDialog/utils/mermaidAutoFix.ts:51-55`](../../packages/excalidraw/components/TTDDialog/utils/mermaidAutoFix.ts#L51-L55)
- Appending missing `end` statements for subgraphs [`packages/excalidraw/components/TTDDialog/utils/mermaidAutoFix.ts:98-109`](../../packages/excalidraw/components/TTDDialog/utils/mermaidAutoFix.ts#L98-L109)
- Removing invalid deactivate commands in sequence diagrams [`packages/excalidraw/components/TTDDialog/utils/mermaidAutoFix.ts:60-96`](../../packages/excalidraw/components/TTDDialog/utils/mermaidAutoFix.ts#L60-L96)
- Normalizing smart quotes to straight quotes [`packages/excalidraw/components/TTDDialog/utils/mermaidAutoFix.ts:111-112`](../../packages/excalidraw/components/TTDDialog/utils/mermaidAutoFix.ts#L111-L112)

In the Mermaid-to-Excalidraw tab, the system attempts to validate candidates up to a maximum depth of 4 iterations and 30 candidates, offering an "Apply auto-fix" button if a valid candidate is found [`packages/excalidraw/components/TTDDialog/MermaidToExcalidraw.tsx:135-215`](../../packages/excalidraw/components/TTDDialog/MermaidToExcalidraw.tsx#L135-L215).

### AI Repair Flow

When a parse error occurs in the chat, users can request "AI Repair" to ask the assistant to fix the Mermaid syntax. This constructs a repair prompt containing the original diagram and error message and re-submits it as a generation request. [`packages/excalidraw/components/TTDDialog/TextToDiagram.tsx:133-144`](../../packages/excalidraw/components/TTDDialog/TextToDiagram.tsx#L133-L144)

## Rate Limiting and Warnings

Rate limit information is tracked in atoms and displayed in the chat panel header. [`packages/excalidraw/components/TTDDialog/TTDContext.tsx:7`](../../packages/excalidraw/components/TTDDialog/TTDContext.tsx#L7) When the remaining count reaches zero or a 429 response is received, a warning message is added to the chat and the input is disabled [`packages/excalidraw/components/TTDDialog/hooks/useTextGeneration.ts:143-169`](../../packages/excalidraw/components/TTDDialog/hooks/useTextGeneration.ts#L143-L169).

Two warning types are supported [`packages/excalidraw/components/TTDDialog/types.ts:35-37`](../../packages/excalidraw/components/TTDDialog/types.ts#L35-L37):
- `messageLimitExceeded` — Daily hard limit on messages
- `rateLimitExceeded` — General 429 rate limit

## Chat State Management

### Jotai Atoms

The chat state is managed using Jotai atoms [`packages/excalidraw/components/TTDDialog/TTDContext.tsx:1-17`](../../packages/excalidraw/components/TTDDialog/TTDContext.tsx#L1-L17):
- `chatHistoryAtom` — Current chat history (id, messages, current prompt)
- `errorAtom` — Current error for display
- `showPreviewAtom` — Whether to show the preview panel
- `rateLimitsAtom` — Rate limit information from the API

### Chat Utils

Utility functions provide immutable updates to chat history [`packages/excalidraw/components/TTDDialog/utils/chat.ts:1-92`](../../packages/excalidraw/components/TTDDialog/utils/chat.ts#L1-L92):
- `addMessages()` — Appends messages with auto-generated IDs and timestamps
- `updateAssistantContent()` — Updates the last assistant message
- `getLastAssistantMessage()` — Retrieves the most recent AI response
- `removeLastAssistantMessage()` — Removes the last assistant message (used when a 429 error occurs)
- `getMessagesForLLM()` — Converts chat history to the format expected by the LLM API

## Mermaid Syntax Highlighting

The Mermaid tab uses CodeMirror with a lightweight custom language definition [`packages/excalidraw/components/TTDDialog/mermaid-lang-lite.ts:1-82`](../../packages/excalidraw/components/TTDDialog/mermaid-lang-lite.ts#L1-L82) that highlights:
- Keywords (flowchart, graph, sequenceDiagram, direction, etc.)
- Strings with double or single quotes
- Comments (%%...)
- Operators (arrows: -->, --->, etc.)
- Node IDs and numbers

The editor supports Cmd/Ctrl+Enter for keyboard submission and Cmd/Shift+Z for redo on all platforms [`packages/excalidraw/components/TTDDialog/CodeMirrorEditor.tsx:140-202`](../../packages/excalidraw/components/TTDDialog/CodeMirrorEditor.tsx#L140-L202).

## Insertion into Canvas

The `insertToEditor` function adds generated Excalidraw elements to the canvas at the center, scales them to fit if needed, and optionally saves the Mermaid definition to local storage for recovery. [`packages/excalidraw/components/TTDDialog/common.ts:139-170`](../../packages/excalidraw/components/TTDDialog/common.ts#L139-L170) After insertion, the dialog closes automatically.
