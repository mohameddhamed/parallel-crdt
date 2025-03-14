<script lang="ts">
  import { onMount } from "svelte";
  import type { User } from "../types";

  let text = "";
  let todos: Array<{ text: string; completed: boolean; id: number }> = [];
  export let user: User;
  export let accessToken: string;
  export let roomName: string;
  export let userName: string;
  export let isOwner: boolean;

  const addTodo = async (t: string) => {
    text = t;
    const response = await fetch(`${apiBaseUrl}todo`, {
      method: "POST",
      body: JSON.stringify({
        text,
      }),
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
    });
    const { todo } = await response.json();
    todos = [todo, ...todos];
  };

  onMount(async () => {
    window.addEventListener("message", async (e) => {
      let message = e.data;
      console.log(message);
      switch (message.type) {
        case "new-todo":
          addTodo(message.value);
      }
    });
    tsvscode.postMessage({ type: "get-token", value: undefined });
    tsvscode.postMessage({ type: "get-userName", value: undefined });

    const response = await fetch(`${apiBaseUrl}todo`, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    const payload = await response.json();
    todos = payload.todos;
  });
</script>

<div>
  Hello {user.name} ({isOwner ? "Owner" : "Guest"}) in room {roomName}
  and user {userName}
</div>
<form
  on:submit|preventDefault={async () => {
    addTodo(text);
    text = "";
  }}
>
  <input bind:value={text} />
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
</style>
