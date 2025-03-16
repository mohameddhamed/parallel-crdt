<script lang="ts">
  import { onMount } from "svelte";
  import type { User } from "../types";

  let addSessionUser = "";
  let addSessionRoom = "";
  export let user: User;
  export let roomName: string;
  export let userName: string;
  export let isOwner: boolean;

  const endSession = async () => {
    console.log("End Session post message in UserDetails");
    tsvscode.postMessage({ type: "end-session", value: undefined });
  };
  const addSession = async (user: string, room: string, isOwner = false) => {
    tsvscode.postMessage({
      type: "start-session",
      value: { user, room, isOwner },
    });
  };

  onMount(async () => {
    tsvscode.postMessage({ type: "get-token", value: undefined });
    tsvscode.postMessage({ type: "get-userName", value: undefined });
  });
</script>

<div>
  Hello {user.name} ({isOwner ? "Owner" : "Guest"}) in room {roomName}
  and user {userName}
</div>
<form
  on:submit|preventDefault={async () => {
    addSession(addSessionUser, addSessionRoom);
    addSessionUser = "";
    addSessionRoom = "";
  }}
>
  <input bind:value={addSessionUser} placeholder="Username" />
  <input bind:value={addSessionRoom} placeholder="Room Name" />
  <div class="button-container">
    <button
      type="button"
      on:click={async () => {
        await addSession(addSessionUser, addSessionRoom);
        addSessionUser = "";
        addSessionRoom = "";
      }}
    >
      Join Session
    </button>
    <button
      type="button"
      on:click={async () => {
        await addSession(addSessionUser, addSessionRoom, true);
        addSessionUser = "";
        addSessionRoom = "";
      }}
    >
      Start Session
    </button>
  </div>
  <button
    type="button"
    on:click={async () => {
      console.log("End Session clicked in UserDetails");
      await endSession();
    }}
  >
    End Session
  </button>
</form>

<style>
  h1 {
    background-color: aliceblue;
    color: black;
  }
  .complete {
    background-color: green;
    color: white;
  }
  .button-container {
    display: flex;
    gap: 10px; /* Adjust the gap between buttons as needed */
  }
</style>
