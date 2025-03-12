<script lang="ts">
  import { onMount } from "svelte";
  import Todos from "./Todos.svelte";
  import type { User } from "../types";

  let roomName = "";
  let peerName = "";
  let userName = "";
  let accessToken = "";
  let user: User | null = null;
  let loading = true;
  let page: "Todo" | "Contact" = tsvscode.getState()?.page || "Todo";

  $: {
    tsvscode.setState({ page });
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
        case "peerName":
          console.log("Sidebar peerName", message.value);
          peerName = message.value;
          break;
        case "roomName":
          console.log("Sidebar roomName", message.value);
          roomName = message.value;
          break;
        case "sessionAdded2":
          console.log("Sidebar session added 2", message.value);
          userName = message.value;
          break;
        case "sessionAdded":
          console.log("Sidebar session added", message.value);
          roomName = message.value;
          break;
        case "peerAdded":
          console.log("Sidebar peer added", message.value);
          peerName = message.value;
          break;
      }
    });
    tsvscode.postMessage({ type: "get-token", value: undefined });
    tsvscode.postMessage({ type: "get-room", value: undefined });
    tsvscode.postMessage({ type: "get-peer", value: undefined });
    tsvscode.postMessage({ type: "get-userName", value: undefined });
  });
</script>

<h1>SideBar from Svelte 2</h1>
{#if loading}
  <h1>Loading</h1>
{:else if user}
  {#if page == "Todo"}
    <pre>{JSON.stringify(user, null, 2)}</pre>
    <Todos {user} {accessToken} {roomName} {peerName} {userName} />
    <button
      on:click={() => {
        tsvscode.postMessage({ type: "onInfo", value: "Posting Info" });
      }}
    >
      Join Session
    </button>
    <button
      on:click={() => {
        tsvscode.postMessage({ type: "onError", value: "Posting Error" });
      }}
    >
      Start Session
    </button>
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
