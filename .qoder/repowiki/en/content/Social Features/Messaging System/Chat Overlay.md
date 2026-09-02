# Chat Overlay

<cite>
**Referenced Files in This Document**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [ChatOverlay.test.tsx](file://src/components/ChatOverlay.test.tsx)
- [ChatsListView.tsx](file://src/components/ChatsListView.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [supabase.ts](file://src/services/backend/supabase.ts)
- [realtime.test.ts](file://src/services/backend/realtime.test.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
The ChatOverlay component provides inline messaging functionality within product pages and user profiles. It enables users to initiate conversations directly from context-rich surfaces without navigating away, supporting real-time message delivery, attachment handling, and seamless integration with the main chat system.

## Project Structure
The chat feature spans multiple layers:
- UI layer: ChatOverlay and related views
- Context/state: AppContext for global chat state
- Services: Supabase client and realtime subscriptions
- Data models: Types and mappers for messages and chats

```mermaid
graph TB
A["Product/Profile Pages"] --> B["ChatOverlay"]
B --> C["AppContext"]
C --> D["Supabase Client"]
D --> E["Realtime Subscriptions"]
E --> F["Message Queue (Offline)"]
B --> G["ChatsListView"]
```

**Diagram sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [ChatsListView.tsx](file://src/components/ChatsListView.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [supabase.ts](file://src/services/backend/supabase.ts)

**Section sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [ChatsListView.tsx](file://src/components/ChatsListView.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [supabase.ts](file://src/services/backend/supabase.ts)

## Core Components
- ChatOverlay: Floating panel that opens/closes, renders conversation, input, and attachments
- ChatsListView: List of active conversations; used to switch between threads
- AppContext: Centralized state for current chat, unread counts, and offline queue
- Supabase service: Realtime subscriptions and persistence for messages

Key responsibilities:
- Open/close transitions and focus management
- Message composition with validation
- Attachment upload and preview
- Realtime send/receive and error handling
- Offline queuing and retry logic

**Section sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [ChatsListView.tsx](file://src/components/ChatsListView.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [supabase.ts](file://src/services/backend/supabase.ts)

## Architecture Overview
The overlay integrates with the main chat system via a shared context and realtime channel. Messages flow through a consistent pipeline: compose -> validate -> enqueue -> send -> persist -> broadcast.

```mermaid
sequenceDiagram
participant U as "User"
participant O as "ChatOverlay"
participant C as "AppContext"
participant S as "Supabase Service"
participant R as "Realtime Channel"
U->>O : Open overlay
O->>C : Set active chat/thread
C->>S : Subscribe to thread
S-->>R : Join channel
R-->>C : New messages
C-->>O : Update message list
U->>O : Send message
O->>O : Validate input
O->>C : Enqueue if offline
C->>S : Persist message
S-->>R : Broadcast to participants
R-->>O : Render bubble
```

**Diagram sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [supabase.ts](file://src/services/backend/supabase.ts)

## Detailed Component Analysis

### ChatOverlay Behavior: Open/Close and Focus
- Triggered from product/profile pages via a floating action button or inline link
- Opens with an animated panel anchored to the viewport edge
- Closes via explicit close button, backdrop click, or Escape key
- Focus moves into the input area on open; returns focus to trigger on close
- Respects reduced motion preferences

```mermaid
flowchart TD
Start(["Open Request"]) --> CheckAuth{"User authenticated?"}
CheckAuth --> |No| ShowLogin["Show auth prompt"]
CheckAuth --> |Yes| InitThread["Initialize or load thread"]
InitThread --> Render["Render overlay"]
Render --> InputFocus["Focus input"]
InputFocus --> WaitInput["Wait for input"]
WaitInput --> CloseTrigger{"Close triggered?"}
CloseTrigger --> |Yes| ReturnFocus["Return focus to trigger"]
CloseTrigger --> |No| WaitInput
```

**Diagram sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)

**Section sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)

### Message Composition and Validation
- Supports text, mentions, and rich formatting where applicable
- Validates length limits, prohibited content, and attachment constraints
- Provides inline error feedback and disables send while invalid
- Auto-expands textarea up to a maximum height

```mermaid
flowchart TD
Compose["User composes message"] --> Validate["Validate text and attachments"]
Validate --> Valid{"Valid?"}
Valid --> |No| ShowError["Show inline error"]
Valid --> |Yes| Enqueue["Enqueue for send"]
Enqueue --> Send["Send via service"]
Send --> Ack{"Delivery acknowledged?"}
Ack --> |Yes| Clear["Clear input"]
Ack --> |No| Retry["Queue and retry later"]
```

**Diagram sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)

**Section sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)

### Real-Time Message Delivery
- Subscribes to thread-specific channels for live updates
- Renders incoming messages immediately with optimistic UI
- Handles ordering, deduplication, and presence indicators
- Displays typing indicators and read receipts where supported

```mermaid
sequenceDiagram
participant O as "ChatOverlay"
participant C as "AppContext"
participant S as "Supabase Service"
participant R as "Realtime Channel"
O->>C : Subscribe to thread
C->>S : Create subscription
S-->>R : Listen for events
R-->>C : On new message
C-->>O : Append message
O->>O : Scroll to bottom
```

**Diagram sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [supabase.ts](file://src/services/backend/supabase.ts)

**Section sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [supabase.ts](file://src/services/backend/supabase.ts)

### Chat Bubble Rendering
- Differentiates sender vs recipient with distinct styles
- Shows timestamps, status indicators (sent/delivered/read), and media previews
- Supports inline links, safe rendering, and truncation for long messages
- Implements virtualization for large histories

```mermaid
classDiagram
class Message {
+string id
+string threadId
+string senderId
+string body
+Attachment[] attachments
+timestamp createdAt
+enum status
}
class Attachment {
+string url
+string type
+number size
}
Message "1" --> "*" Attachment : "has"
```

**Diagram sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)

**Section sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)

### Attachment Handling
- Accepts images, documents, and other supported types
- Validates MIME types, size limits, and naming rules
- Uploads via secure service endpoint; shows progress and error states
- Generates thumbnails and lazy-loads heavy media

```mermaid
flowchart TD
Pick["Pick file(s)"] --> Validate["Validate type/size"]
Validate --> |Invalid| Error["Show error"]
Validate --> |Valid| Upload["Upload to storage"]
Upload --> Progress["Show progress"]
Progress --> Success{"Upload success?"}
Success --> |Yes| Attach["Attach to message"]
Success --> |No| Retry["Retry or fallback"]
```

**Diagram sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)

**Section sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)

### Integration with Main Chat System
- Shares thread IDs and message model with ChatsListView
- Syncs unread counts and last message preview across views
- Ensures continuity when switching between overlay and full chat view

```mermaid
graph LR
A["Product/Profile Page"] --> B["ChatOverlay"]
B --> C["AppContext"]
C --> D["ChatsListView"]
C --> E["Supabase Service"]
```

**Diagram sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [ChatsListView.tsx](file://src/components/ChatsListView.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)

**Section sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [ChatsListView.tsx](file://src/components/ChatsListView.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)

### Sending/Receiving Mechanisms and Error Handling
- Optimistic sends update UI immediately; server acknowledgment finalizes state
- Network failures queue messages locally and retry with exponential backoff
- Server errors surface actionable messages; failed attachments show retry controls
- Idempotent sends prevent duplicates on reconnect

```mermaid
flowchart TD
Send["Send message"] --> Try["Attempt send"]
Try --> Ok{"Success?"}
Ok --> |Yes| Confirm["Mark delivered/read"]
Ok --> |No| Queue["Queue for retry"]
Queue --> Backoff["Backoff delay"]
Backoff --> Try
```

**Diagram sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [supabase.ts](file://src/services/backend/supabase.ts)

**Section sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [supabase.ts](file://src/services/backend/supabase.ts)

### Offline Message Queuing
- Persists unsent messages to local storage or IndexedDB
- Replays queued messages upon reconnection
- Marks items as pending until acknowledged by server

```mermaid
stateDiagram-v2
[*] --> Idle
Idle --> Sending : "send()"
Sending --> Success : "acknowledged"
Sending --> Failed : "error"
Failed --> Queued : "enqueue"
Queued --> Sending : "reconnect & retry"
Success --> Idle
```

**Diagram sources**
- [AppContext.tsx](file://src/context/AppContext.tsx)

**Section sources**
- [AppContext.tsx](file://src/context/AppContext.tsx)

### Accessibility Features and Keyboard Navigation
- Full keyboard support: Tab order, Enter to send, Escape to close
- Screen reader labels for buttons, inputs, and status
- High contrast and scalable text support
- Focus trapping inside overlay when open

```mermaid
flowchart TD
Open["Open overlay"] --> Trap["Trap focus"]
Trap --> Nav["Navigate with Tab/Shift+Tab"]
Nav --> Actions{"Action?"}
Actions --> |Send| Send["Enter to send"]
Actions --> |Close| Close["Escape to close"]
Close --> Release["Release focus"]
```

**Diagram sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)

**Section sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)

### Mobile Responsiveness
- Adapts to small screens with full-screen modal behavior
- Touch-friendly targets and swipe-to-dismiss gestures
- Safe area insets for notched devices
- Optimized media loading for cellular networks

```mermaid
graph TB
M["Mobile Viewport"] --> A["Full-screen overlay"]
A --> B["Touch actions"]
A --> C["Optimized media"]
```

**Diagram sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)

**Section sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)

## Dependency Analysis
- ChatOverlay depends on AppContext for thread state and queue
- AppContext depends on Supabase service for persistence and realtime
- ChatsListView shares thread/message data via AppContext
- Tests verify interactions and edge cases for robustness

```mermaid
graph LR
ChatOverlay["ChatOverlay.tsx"] --> AppContext["AppContext.tsx"]
AppContext --> Supabase["supabase.ts"]
ChatsListView["ChatsListView.tsx"] --> AppContext
```

**Diagram sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [ChatsListView.tsx](file://src/components/ChatsListView.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [supabase.ts](file://src/services/backend/supabase.ts)

**Section sources**
- [ChatOverlay.tsx](file://src/components/ChatOverlay.tsx)
- [ChatsListView.tsx](file://src/components/ChatsListView.tsx)
- [AppContext.tsx](file://src/context/AppContext.tsx)
- [supabase.ts](file://src/services/backend/supabase.ts)

## Performance Considerations
- Virtualize message lists to handle long histories efficiently
- Debounce input changes and auto-resize calculations
- Lazy-load attachments and use responsive image formats
- Batch realtime updates to minimize re-renders
- Use optimistic UI to improve perceived performance

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Messages stuck in pending: check network connectivity and retry queue
- Realtime not updating: verify channel subscription and permissions
- Attachments failing: validate MIME types and storage quotas
- Overlay not closing: ensure focus trap release and event listeners

**Section sources**
- [ChatOverlay.test.tsx](file://src/components/ChatOverlay.test.tsx)
- [realtime.test.ts](file://src/services/backend/realtime.test.ts)

## Conclusion
The ChatOverlay delivers a seamless inline messaging experience integrated with the main chat system. It supports robust composition, validation, attachments, real-time delivery, offline queuing, accessibility, and mobile responsiveness, ensuring reliable communication across contexts.