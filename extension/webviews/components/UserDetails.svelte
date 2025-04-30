<script lang="ts">
  import { onMount } from "svelte";
  import type { User } from "../types";

  let addSessionRoom = "";
  let addSessionPassword = "";
  let addSessionIpAddress = "";
  export let ongoingSession: "true" | "false" = "false";
  export let user: User;
  export let roomName: string;
  export let userName: string;
  export let isOwner: boolean;
  export let updateThisSession: (value: "true" | "false") => void;
  export let isStartingSession: boolean;
  export let errorMessage: string | null;
  export let setStartingSession: (value: boolean) => void;
  let addSessionUser = user.name;

  // Validation error states
  let usernameError: string | null = null;
  let roomError: string | null = null;
  let passwordError: string | null = null;
  let ipAddressError: string | null = null;

  // Validation functions
  function validateUsername(username: string): string | null {
    if (!username || username.trim().length < 3) {
      return "Username must be at least 3 characters";
    }
    return null;
  }

  function validateRoom(room: string): string | null {
    if (!room || room.trim().length < 3) {
      return "Room name must be at least 3 characters";
    }
    return null;
  }

  function validatePassword(password: string): string | null {
    if (!password || password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;
  }

  function validateIpAddress(ipAddress: string): string | null {
    if (ipAddress === "localhost") return null;
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ipAddress)) {
      return "Invalid IP address format (e.g., 192.168.0.1)";
    }
    const parts = ipAddress.split(".").map(Number);
    if (parts.some((part) => part < 0 || part > 255)) {
      return "IP address parts must be between 0 and 255";
    }
    return null;
  }

  const endSession = async () => {
    console.log("End Session post message in UserDetails");
    tsvscode.postMessage({ type: "end-session", value: undefined });
  };

  const addSession = (
    user: string,
    room: string,
    password: string,
    ipAddress: string,
    isOwner = false
  ) => {
    tsvscode.postMessage({
      type: "start-session",
      value: { user, room, isOwner, password, ipAddress },
    });
  };

  onMount(async () => {
    tsvscode.postMessage({ type: "get-token", value: undefined });
    tsvscode.postMessage({ type: "get-userName", value: undefined });
  });
</script>

<div class="user-details">
  <div class="user-header">
    <div class="user-info">
      <span class="username">{user.name}</span>
      <span class="badge {isOwner ? 'owner' : 'guest'}">
        {isOwner ? "Owner" : "Guest"}
      </span>
    </div>
    <div class="session-info">
      <div class="info-item">
        <span class="label">Room:</span>
        <span class="value">{roomName}</span>
      </div>
      <div class="info-item">
        <span class="label">User:</span>
        <span class="value">{userName}</span>
      </div>
    </div>
  </div>

  {#if isStartingSession}
    <div class="loading">
      <div class="spinner"></div>
      <span>Starting session...</span>
      <button
        class="danger-button"
        on:click={async () => {
          await endSession();
          setStartingSession(false);
        }}
      >
        Abort
      </button>
    </div>
  {:else if ongoingSession === "false"}
    <div class="session-form">
      {#if errorMessage}
        <div class="error-message">{errorMessage}</div>
      {/if}
      <h3>Start or Join a Session</h3>
      <form on:submit|preventDefault>
        <div class="form-grid">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              bind:value={addSessionUser}
              placeholder="Enter username"
            />
            {#if usernameError}
              <div class="error-message">{usernameError}</div>
            {/if}
          </div>
          <div class="form-group">
            <label for="roomname">Room Name</label>
            <input
              id="roomname"
              bind:value={addSessionRoom}
              placeholder="Enter room name"
            />
            {#if roomError}
              <div class="error-message">{roomError}</div>
            {/if}
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              bind:value={addSessionPassword}
              placeholder="Enter password"
            />
            {#if passwordError}
              <div class="error-message">{passwordError}</div>
            {/if}
          </div>
          <div class="form-group">
            <label for="ipaddress">IP Address</label>
            <input
              id="ipaddress"
              bind:value={addSessionIpAddress}
              placeholder="Enter IP address"
            />
            {#if ipAddressError}
              <div class="error-message">{ipAddressError}</div>
            {/if}
          </div>
        </div>
        <div class="session-actions">
          <button
            class="primary-button"
            type="button"
            disabled={isStartingSession}
            on:click={() => {
              usernameError = validateUsername(addSessionUser);
              roomError = validateRoom(addSessionRoom);
              passwordError = validatePassword(addSessionPassword);
              ipAddressError = validateIpAddress(addSessionIpAddress);

              if (
                usernameError ||
                roomError ||
                passwordError ||
                ipAddressError
              ) {
                return;
              }

              setStartingSession(true);
              addSession(
                addSessionUser,
                addSessionRoom,
                addSessionPassword,
                addSessionIpAddress,
                true
              );
              addSessionUser = "";
              addSessionRoom = "";
              addSessionPassword = "";
              addSessionIpAddress = "";
            }}
          >
            <span class="icon">✚</span> Start New Session
          </button>
          <button
            class="secondary-button"
            type="button"
            disabled={isStartingSession}
            on:click={() => {
              usernameError = validateUsername(addSessionUser);
              roomError = validateRoom(addSessionRoom);
              passwordError = validatePassword(addSessionPassword);
              ipAddressError = validateIpAddress(addSessionIpAddress);

              if (
                usernameError ||
                roomError ||
                passwordError ||
                ipAddressError
              ) {
                return;
              }

              setStartingSession(true);
              addSession(
                addSessionUser,
                addSessionRoom,
                addSessionPassword,
                addSessionIpAddress
              );
              addSessionUser = "";
              addSessionRoom = "";
              addSessionPassword = "";
              addSessionIpAddress = "";
            }}
          >
            <span class="icon">↗</span> Join Existing Session
          </button>
        </div>
      </form>
    </div>
  {:else}
    <div class="active-session">
      <div class="status-badge active">Session Active</div>
      <button
        class="danger-button full-width"
        type="button"
        on:click={async () => {
          updateThisSession("false");
          console.log("End Session clicked in UserDetails");
          await endSession();
        }}
      >
        <span class="icon">✖</span> End Session
      </button>
    </div>
  {/if}
</div>

<style>
  .user-details {
    padding: 12px;
    border-radius: 4px;
    background-color: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    margin-bottom: 16px;
  }

  .user-header {
    margin-bottom: 16px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .username {
    font-weight: 600;
    font-size: 1rem;
  }

  .badge {
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 10px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .owner {
    background-color: var(--vscode-statusBarItem-prominentBackground, #2ea043);
    color: var(--vscode-statusBarItem-prominentForeground, white);
  }

  .guest {
    background-color: var(--vscode-statusBarItem-warningBackground, #d29922);
    color: var(--vscode-statusBarItem-warningForeground, white);
  }

  .session-info {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 0.85rem;
    color: var(--vscode-descriptionForeground);
  }

  .info-item {
    display: flex;
    gap: 4px;
  }

  .label {
    font-weight: 500;
  }

  .session-form {
    margin-top: 16px;
  }

  .session-form h3 {
    font-size: 0.9rem;
    margin: 0 0 12px 0;
    color: var(--vscode-foreground);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  label {
    font-size: 0.8rem;
    color: var(--vscode-descriptionForeground);
  }

  input {
    padding: 6px 8px;
    border-radius: 2px;
    border: 1px solid var(--vscode-input-border, transparent);
    background-color: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-size: 0.9rem;
    width: 100%;
  }

  input:focus {
    outline: 1px solid var(--vscode-focusBorder);
  }

  .session-actions {
    display: flex;
    gap: 8px;
  }

  .active-session {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    padding: 8px 0;
  }

  .status-badge {
    font-size: 0.8rem;
    padding: 4px 10px;
    border-radius: 12px;
    font-weight: 500;
  }

  .status-badge.active {
    background-color: var(--vscode-statusBarItem-prominentBackground, #2ea043);
    color: var(--vscode-statusBarItem-prominentForeground, white);
  }

  .primary-button,
  .secondary-button,
  .danger-button {
    padding: 6px 12px;
    border: none;
    border-radius: 2px;
    font-size: 0.9rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    flex: 1;
  }

  .primary-button {
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }

  .primary-button:hover {
    background-color: var(--vscode-button-hoverBackground);
  }

  .secondary-button {
    background-color: var(
      --vscode-button-secondaryBackground,
      rgba(255, 255, 255, 0.1)
    );
    color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
  }

  .secondary-button:hover {
    background-color: var(
      --vscode-button-secondaryHoverBackground,
      rgba(255, 255, 255, 0.2)
    );
  }

  .danger-button {
    background-color: var(--vscode-errorForeground, #f85149);
    color: white;
  }

  .danger-button:hover {
    opacity: 0.9;
  }

  .full-width {
    width: 100%;
  }

  .icon {
    font-size: 0.9rem;
  }

  .error-message {
    color: var(--vscode-errorForeground, #f85149);
    margin-bottom: 10px;
    font-size: 0.85rem;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--vscode-editor-foreground);
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
