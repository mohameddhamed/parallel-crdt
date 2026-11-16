# Parallel CRDT

[![CI](https://github.com/mohameddhamed/parallel-crdt/actions/workflows/ci.yml/badge.svg)](https://github.com/mohameddhamed/parallel-crdt/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A real-time, peer-to-peer collaborative text editing extension for Visual Studio Code powered by Conflict-Free Replicated Data Types (CRDTs) using Yjs and WebSockets. Provides mathematically guaranteed eventual consistency, peer awareness decorations, and selective undo history tracking.

---

## Architectural Architecture

```
                       VS Code Local Editor (Peer A)
                                     │
               ┌─────────────────────┴─────────────────────┐
               ▼                                           ▼
      VS Code TextDocument                     Yjs CRDT Model (Y.Doc)
     (Local Cursor & Edits)                   (Item & Struct Store)
               │                                           │
               ▼                                           ▼
   DocumentListener / Decorator               RelativePosition Tracker
               │                               (Selective Undo Coordinate)
               ▼                                           │
      Connector Client                                     │
               │                                           │
               └─────────────────────┬─────────────────────┘
                                     │
                        WebSocket Wire Protocol (Binary)
                        - Step 1: SyncStep1 (State Vector)
                        - Step 2: SyncStep2 (Missing CRDT Items)
                        - Step 3: Incremental Item Updates
                                     │
                                     ▼
                    Central Coordination Relay & State Store
                                     │
                        WebSocket Wire Protocol (Binary)
                                     │
                                     ▼
                       VS Code Remote Editor (Peer B)
                        - Integrates Remote Updates
                        - Conflict-free Convergence
                        - Peer Cursor Decorations
```

---

## Key Systems & Concurrency Highlights

### 1. CRDT State Convergence & Mathematical Guarantees
- **State Vector Synchronization:** When a client connects or reconnects, peers exchange a compact State Vector representing the latest clock sequence per client ID. Missing updates are computed as delta slices and transmitted as binary encoded payloads.
- **Commutativity & Idempotency:** CRDT update operations can arrive out-of-order, be duplicated, or be merged in batches without resulting in diverging editor states. Every peer converges to the identical character sequence regardless of network latency.

### 2. Selective Undo & Coordinate Drift Trade-offs
A critical challenge in collaborative text editing is **Selective Undo**:
- If Peer A edits line 10, Peer B inserts 5 lines above line 10, and Peer A presses Undo:
  - Naive absolute index tracking (`offset: 100`) undos edits at corrupted offsets because Peer B shifted the character buffer.
  - Coordinate drift is resolved using **`Y.RelativePosition`**: positions are anchored to unique CRDT item identifiers `(client, clock)` rather than linear array offsets.
  - Undoing an action generates an inverse CRDT item that is pushed to the document, ensuring that only the specific peer's mutations are reverted without disturbing concurrent edits from other collaborators.

### 3. Editor Awareness & Remote Presence
- Synchronizes peer selections and cursor positions across active editor instances.
- Renders non-intrusive VS Code text editor decorations (custom highlight spans and hover tags displaying collaborator identities).

---

## Workspace Structure

```
parallel-crdt/
├── extension/             # VS Code extension client implementation
│   ├── src/
│   │   ├── connection/    # WebSocket connector & authentication
│   │   ├── document/      # TextDocument event listeners & synchronization
│   │   ├── editor/        # Custom decorations & peer cursor management
│   │   ├── file/          # Yjs file store & CRDT buffer management
│   │   ├── peer/          # Peer connection state & awareness protocol
│   │   └── session/       # Active session & workspace state
│   └── webviews/          # Sidebar UI components (Svelte)
├── api/                   # Backend coordination service & OAuth provider
└── testing/               # Integration tests & harness utilities
    └── test-utils/        # Automated test specs and mock environments
```

---

## Building and Running

### Prerequisites
- Node.js 18 or 20
- pnpm or npm

### Installation
```bash
# Clone repository
git clone https://github.com/mohameddhamed/parallel-crdt.git
cd parallel-crdt

# Install dependencies in extension and api
cd extension && npm install
cd ../api && npm install
cd ../testing/test-utils && npm install
```

### Run Tests
```bash
cd testing/test-utils
npm test
```

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
