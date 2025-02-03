<script lang="ts">
  import { onMount } from "svelte";
  import Todos from "./Todos.svelte";
  import type { User } from "../types";

    let accessToken = ''
    let user : User | null = null;
    let loading = true;
    let page : 'Todo' | 'Contact' = tsvscode.getState()?.page || 'Todo'

    $: {
        tsvscode.setState({page});
    }

    onMount(async () => {
        window.addEventListener("message", async (e) => {
            let message = e.data;
            console.log(message);
            switch (message.type) {

            
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
    {#if page == 'Todo' }
    <pre>{JSON.stringify(user, null, 2)}</pre>
    <Todos user={user} {accessToken}/> 
    <button on:click={() => {
        user = null;
        accessToken = '';
        tsvscode.postMessage({type: 'logout', value: undefined})
    }}>
        Logout
    </button>
    <button on:click={() => {
        page = 'Contact'
    }}>Go to Contact</button>
    {:else}
    <h1>Contact Page</h1>
    <button on:click={() => {
        page = 'Todo'
    }}>Go to Todos</button>
        
    {/if}
{:else}
    <h1>no user is logged in</h1>
    <button on:click={() => {
        tsvscode.postMessage({type: 'authenticate', value: undefined})
    }}>
        Login
    </button>
{/if}