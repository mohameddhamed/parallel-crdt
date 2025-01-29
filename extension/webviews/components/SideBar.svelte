<script lang="ts">
  import { onMount } from "svelte";

    let accessToken = ''
    let todos : Array<{text : string; completed : boolean}> = [];
    let text = '';
    let user : {id : number; name : string} | null = null;
    let loading = true;

    onMount(async () => {
        window.addEventListener("message", async (e) => {
            let message = e.data;
            console.log(message);
            switch (message.type) {

            case "new-todo": 
                todos = [{text: message.value, completed: false}, ...todos]
            
            case "token": 
                accessToken = message.value;
                const response = await fetch(`${apiBaseUrl}me`, {
                    headers : {
                        authorization : `Bearer ${accessToken}`
                    }
                })
                console.log("the response is, ", response)
                const data = await response.json();
                user = data.user;
                loading = false;
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
<h1>SideBar from Svelte 2</h1>
{#if loading}
    <h1>Loading</h1>
{:else if user}
    <pre>{JSON.stringify(user, null, 2)}</pre>
{:else}
    <h1>no user is logged in</h1>
{/if}
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
    Post Info
</button>
<button on:click={() => {
    tsvscode.postMessage({ type: 'onError', value : "Posting Error" });
}}>
    Post Error
</button>