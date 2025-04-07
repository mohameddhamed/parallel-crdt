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
          const { peer, insertions, deletions } = message.value;
          peerChanges[peer] = { insertions, deletions };
          peerChanges = { ...peerChanges }; // Trigger reactivity
          break;
      }
    });
    tsvscode.postMessage({ type: "get-token", value: undefined });
    tsvscode.postMessage({ type: "get-userName", value: undefined });
  });
</script>

<h1>Parallel Code</h1>
{#if loading}
  <h1>Loading</h1>
{:else if user}
  {#if page == "Todo"}
    <pre>{JSON.stringify(user, null, 2)}</pre>
    <UserDetails
      {ongoingSession}
      {user}
      {roomName}
      {userName}
      {isOwner}
      {updateThisSession}
    />
    <ul>
      {#each peerNames as peer (peer)}
        <li>
          {peer}
          {#if peerChanges[peer]}
            (+{peerChanges[peer].insertions} -{peerChanges[peer].deletions})
          {/if}
          <div class="button-group">
            <button on:click={() => revertPeerChanges(peer)}
              >Get Peer Change Count</button
            >
            <button on:click={() => revertChanges()}
              >Revert Changes & Sync</button
            >
          </div>
        </li>
      {/each}
    </ul>
    <button
      on:click={() => {
        user = null;
        accessToken = "";
        tsvscode.postMessage({ type: "logout", value: undefined });
      }}
    >
      Logout
    </button>
    <button
      on:click={() => {
        page = "Contact";
      }}>Go to Contact</button
    >
  {:else}
    <h1>Contact Page</h1>
    <button
      on:click={() => {
        page = "Todo";
      }}>Go to Todos</button
    >
  {/if}
{:else}
  <h1>no user is logged in</h1>
  <button
    on:click={() => {
      tsvscode.postMessage({ type: "authenticate", value: undefined });
    }}
  >
    Login
  </button>
{/if}

<style>
  h1 {
    background-color: aliceblue;
    color: black;
  }
  .complete {
    background-color: green;
    color: white;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 5px 0;
  }
  .button-group {
    display: inline-flex;
    gap: 8px;
  }
  button {
    padding: 4px 8px;
    border-radius: 4px;
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    cursor: pointer;
  }
  button:hover {
    background-color: var(--vscode-button-hoverBackground);
  }
</style>
