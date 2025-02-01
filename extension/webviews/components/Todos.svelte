<script lang="ts">
  import { onMount } from "svelte";
  import type { User } from "../types";

    let text = "";
    let todos : Array<{text : string; completed : boolean}> = [];
    export let user : User;

    onMount(async () => {
        window.addEventListener("message", async (e) => {
            let message = e.data;
            console.log(message);
            switch (message.type) {

            case "new-todo": 
                todos = [{text: message.value, completed: false}, ...todos]
            }    
        })
        tsvscode.postMessage({type: 'get-token', value: undefined})
    })


</script>
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
<div>
    Hello {user.name}
</div>
<form
    on:submit|preventDefault={() => {
        todos = [{text, completed: false}, ...todos]
        text = ''
    }}
    >
    <input bind:value={text}/>
</form>
<ul>
    {#each todos as todo (todo.text)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <li 
            class:complete={todo.completed} 
            on:click={() => {
            todo.completed = !todo.completed; 
            }}>
            {todo.text}
        </li>
    {/each}
</ul>
<button on:click={() => {
    tsvscode.postMessage({ type: 'onInfo', value : "Posting Info" });
}}>
    Post Info from External component
</button>
<button on:click={() => {
    tsvscode.postMessage({ type: 'onError', value : "Posting Error" });
}}>
    Post Error same here
</button>