<script>
    // we must to prepare code and remove html, body, head directives
    import './chota.scss';
</script> 

<style global>
    :global(input:invalid) {
        border: 2px red solid;
    }
    :global(.text-bold) {
        font-weight: bold;
    }
    :global(.click-pointer) {
        cursor:pointer;
    }
    :global(.menu-points) {
        list-style: none;
        margin-bottom: 1rem;
    }
    :global(.menu-wrapper) {
        padding: 0px;
    }
</style>