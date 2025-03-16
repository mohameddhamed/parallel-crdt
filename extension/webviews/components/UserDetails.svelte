<script lang="ts">
  import { onMount } from "svelte";
  import type { User } from "../types";

  let addSessionUser = "";
  let addSessionRoom = "";
  export let user: User;
  export let roomName: string;
  export let userName: string;
  export let isOwner: boolean;

  const addSession = async (user: string, room: string, isOwner = false) => {
    tsvscode.postMessage({
      type: "start-session",
      value: { user, room, isOwner },
    });
  };

  onMount(async () => {
    // window.addEventListener("message", async (e) => {
    //   let message = e.data;
    //   console.log(message);
    //   switch (message.type) {
    //     case "new-todo":
    //       addSession(message.value);
    //   }
    // });
    tsvscode.postMessage({ type: "get-token", value: undefined });
    tsvscode.postMessage({ type: "get-userName", value: undefined });

    // const response = await fetch(`${apiBaseUrl}todo`, {
    //   headers: {
    //     authorization: `Bearer ${accessToken}`,
    //   },
    // });
    // const payload = await response.json();
    // todos = payload.todos;
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
