<script lang="ts">
    let todos : Array<{text : string; completed : boolean}> = [];
    let text = '';

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
<h1>SideBar from Svelte</h1>
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