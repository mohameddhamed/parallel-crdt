<script lang="ts">
  import { onMount } from "svelte";
  import UserDetails from "./UserDetails.svelte";
  import type { User } from "../types";

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

  $: {
    tsvscode.setState({ page, ongoingSession });
  }
  const updateThisSession = (value: "true" | "false") => {
    ongoingSession = value;
  };

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
        case "peerAdded":
          console.log("Sidebar peer added", message.value);
          peerName = message.value;
          peerNames = [...peerNames, message.value];
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
</style>
