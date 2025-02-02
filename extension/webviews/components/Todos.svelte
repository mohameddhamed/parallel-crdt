<script lang="ts">
  import { onMount } from "svelte";
  import type { User } from "../types";

    let text = "";
    let todos : Array<{text : string; completed : boolean}> = [];
    export let user : User;
    export let accessToken : string;

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

        const response = await fetch(`${apiBaseUrl}todo`, {
            headers : {
                authorization : `Bearer ${accessToken}`
            }
        })
        const payload = await response.json();
        todos = payload.todos
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
    on:submit|preventDefault={ async () => {
        const response = await fetch(`${apiBaseUrl}todo`, {
            method : 'POST',
            body : JSON.stringify({
                text,
            }),
            headers : {
                'content-type' : 'application/json',
                authorization : `Bearer ${accessToken}`
            }
        })
        const {todo} = await response.json();
        todos = [todo, ...todos]
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