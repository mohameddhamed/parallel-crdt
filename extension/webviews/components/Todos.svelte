<script lang="ts">
  import { onMount } from "svelte";
  import type { User } from "../types";

  let text = "";
  let todos: Array<{ text: string; completed: boolean; id: number }> = [];
  export let user: User;
  export let accessToken: string;
  export let roomName: string;
  export let peerName: string;
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
          // todos = [{text: message.value, completed: false}, ...todos]
          addTodo(message.value);
      }
    });
    tsvscode.postMessage({ type: "get-token", value: undefined });
    tsvscode.postMessage({ type: "get-room", value: undefined });
    tsvscode.postMessage({ type: "get-peer", value: undefined });
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
  with peer {peerName}
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
<ul>
  {#each todos as todo (todo.id)}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <li
      class:complete={todo.completed}
      on:click={async () => {
        todo.completed = !todo.completed;
        const response = await fetch(`${apiBaseUrl}todo`, {
          method: "PUT",
          body: JSON.stringify({
            id: todo.id,
          }),
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${accessToken}`,
          },
        });
        // const {todo} = await response.json();
      }}
    >
      {todo.text}
    </li>
  {/each}
</ul>

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
