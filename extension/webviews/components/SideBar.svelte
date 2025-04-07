<script lang="ts">
  import { onMount } from "svelte";
  import UserDetails from "./UserDetails.svelte";
  import type { User } from "../types";

  let removedPeerName = "";
  let roomName = "";
  let peerName = "";
  let userName = "";
  let isOwner = false;
  let peerNames: string[] = [];
  let accessToken = "";
  let user: User | null = null;
  let loading = true;
  let page: "Todo" | "Contact" = tsvscode.getState()?.page || "Todo";
  let ongoingSession: "true" | "false" =
    tsvscode.getState()?.ongoingSession || "false";

  // Store peer change summaries (e.g., { "peer1": { insertions: 52, deletions: 38 } })
  let peerChanges: {
    [peer: string]: { insertions: number; deletions: number };
  } = {};

  $: peerChanges = peerChanges;

  function updatePeerChanges(
    peer: string,
    changes: { insertions: number; deletions: number }
  ) {
    peerChanges = {
      ...peerChanges,
      [peer]: changes, // This creates a new object
    };
  }

  $: {
    tsvscode.setState({ page, ongoingSession });
  }
  const updateThisSession = (value: "true" | "false") => {
    ongoingSession = value;
    if (ongoingSession === "false") {
      peerNames = [];
      peerChanges = {}; // Clear change summaries when session ends
    }
  };

  // Request change summary for a specific peer
  function requestPeerChanges(peer: string) {
    tsvscode.postMessage({ type: "getPeerChanges", value: peer });
  }

  // Revert changes made by a specific peer
  function revertChanges() {
    tsvscode.postMessage({ type: "revertChanges", value: undefined });
  }
  // Revert changes made by a specific peer
  function revertPeerChanges(peer: string) {
    tsvscode.postMessage({ type: "revertPeerChanges", value: peer });
  }

  // Request change summaries for all peers when peerNames updates
  $: if (peerNames.length > 0) {
    peerNames.forEach((peer) => requestPeerChanges(peer));
  }

  onMount(async () => {
    window.addEventListener("message", async (e) => {
      let message = e.data;
      console.log(message);
      switch (message.type) {
        case "token":
          accessToken = message.value;
          const response = await fetch(`${apiBaseUrl}me`, {
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
          });
          console.log("the response is, ", response);
          const data = await response.json();
          user = data.user;
          loading = false;
          break;
        case "userName":
          console.log("Sidebar userName", message.value);
          userName = message.value.userName;
          isOwner = message.value.isOwner;
          peerNames = message.value.peerNames;
          roomName = message.value.roomName;
          break;
        case "sessionAdded2":
          console.log("Sidebar session added 2", message.value);
          userName = message.value.userName;
          isOwner = message.value.isOwner;
          peerNames = message.value.peerNames;
          roomName = message.value.roomName;
          break;
        case "sessionRemoved":
          console.log("Sidebar session Removed, remaining: ", message.value);
          removedPeerName = message.value;
          const index = peerNames.indexOf(removedPeerName);
          if (index > -1) {
            console.log("removing peer", removedPeerName);
            peerNames = peerNames.filter((name) => name !== removedPeerName);
            console.log("remaining peers", peerNames);
          }
          if (peerNames.length < 1) {
            updateThisSession("false");
          }
          break;
        case "peerAdded":
          console.log("Sidebar peer added", message.value);
          peerName = message.value;
          peerNames = [...peerNames, message.value];
          break;
        case "peerChanges":
          // Update peerChanges with the received summary
          console.log(
            "Sidebar peer changes insertions, deletions",
            message.value
          );
          const { peer, insertions, deletions } = message.value;
          updatePeerChanges(peer, { insertions, deletions });
          break;
      }
    });
    tsvscode.postMessage({ type: "get-token", value: undefined });
    tsvscode.postMessage({ type: "get-userName", value: undefined });
  });
</script>

<h1 class="title" style="padding-left: 15px;">Parallel Code</h1>
{#if loading}
  <div class="loading">
    <div class="spinner"></div>
    <span>Loading...</span>
  </div>
{:else if user}
  <div class="container">
    {#if page === "Todo"}
      <UserDetails
        {ongoingSession}
        {user}
        {roomName}
        {userName}
        {isOwner}
        {updateThisSession}
      />

      {#if peerNames.length > 0}
        <div class="section">
          <h2 class="section-title">Connected Peers</h2>
          <ul class="peer-list">
            {#each peerNames as peer (peer)}
              <li class="peer-item">
                <div class="peer-info">
                  <span class="peer-name">{peer}</span>
                  {#if peerChanges[peer]}
                    <span class="peer-changes">
                      <span class="insertions"
                        >+{peerChanges[peer].insertions}</span
                      >
                      <span class="deletions"
                        >-{peerChanges[peer].deletions}</span
                      >
                    </span>
                  {/if}
                </div>
                <button
                  class="secondary-button"
                  style="width: 100px; text-align: center;"
                  on:click={() => revertPeerChanges(peer)}
                >
                  Get Changes
                </button>
              </li>
            {/each}
          </ul>

          <div class="action-bar">
            <button class="primary-button" on:click={() => revertChanges()}>
              <span class="icon">↺</span> Revert Changes & Sync
            </button>
          </div>
        </div>
      {/if}

      <div class="footer">
        <!-- <button
          class="nav-button"
          on:click={() => {
            page = "Contact";
          }}
        >
          Contact
        </button> -->
        <button
          class="danger-button"
          on:click={() => {
            user = null;
            accessToken = "";
            tsvscode.postMessage({ type: "logout", value: undefined });
          }}
        >
          Logout
        </button>
      </div>
    {:else}
      <div class="contact-page">
        <h2 class="section-title">Contact</h2>
        <!-- Contact page content here -->
        <button
          class="nav-button"
          on:click={() => {
            page = "Todo";
          }}
        >
          Back to Dashboard
        </button>
      </div>
    {/if}
  </div>
{:else}
  <div class="login-container">
    <div class="login-message">
      <h2>Welcome to Parallel Code</h2>
      <p>Login to start collaborating with your team</p>
    </div>
    <button
      class="login-button"
      on:click={() => {
        tsvscode.postMessage({ type: "authenticate", value: undefined });
      }}
    >
      Sign In
    </button>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: var(--vscode-font-family);
  }

  .title {
    margin-top: 20px;
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0 0 16px 0;
    padding: 8px 0;
    border-bottom: 1px solid var(--vscode-panel-border);
    color: var(--vscode-foreground);
  }

  .container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .section {
    margin: 16px 0;
  }

  .section-title {
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    margin: 0 0 8px 0;
    color: var(--vscode-descriptionForeground);
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100px;
    gap: 12px;
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

  .peer-list {
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    overflow: hidden;
  }

  .peer-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .peer-item:last-child {
    border-bottom: none;
  }

  .peer-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .peer-name {
    font-weight: 500;
  }

  .peer-changes {
    font-size: 0.85rem;
    color: var(--vscode-descriptionForeground);
  }

  .insertions {
    color: var(--vscode-gitDecoration-addedResourceForeground, #2ea043);
    margin-right: 4px;
  }

  .deletions {
    color: var(--vscode-gitDecoration-deletedResourceForeground, #f85149);
  }

  .action-bar {
    display: flex;
    margin-top: 12px;
    justify-content: flex-end;
  }

  .footer {
    margin-top: auto;
    padding-top: 16px;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid var(--vscode-panel-border);
  }

  .login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    text-align: center;
    gap: 24px;
  }

  .login-message {
    color: var(--vscode-foreground);
  }

  .login-message h2 {
    font-size: 1.2rem;
    margin-bottom: 8px;
  }

  .login-message p {
    opacity: 0.8;
  }

  button {
    padding: 6px 12px;
    border: none;
    border-radius: 2px;
    font-size: 0.9rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    font-size: 0.8rem;
    padding: 4px 8px;
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

  .nav-button {
    background-color: transparent;
    color: var(--vscode-textLink-foreground);
  }

  .nav-button:hover {
    text-decoration: underline;
  }

  .login-button {
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    padding: 8px 16px;
  }

  .login-button:hover {
    background-color: var(--vscode-button-hoverBackground);
  }

  .icon {
    margin-right: 4px;
  }

  .contact-page {
    padding: 16px 0;
  }
</style>
