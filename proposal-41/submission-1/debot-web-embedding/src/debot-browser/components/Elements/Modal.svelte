<script>
	import { getContext, onMount } from "svelte";
	import { fade } from "svelte/transition";

	//Context
	const { closeModal } = getContext("app_functions");

	let previousScrollSpot = { x: 0, y: 0 };

	onMount(() => {
	  previousScrollSpot.x = window.pageXOffset;
	  previousScrollSpot.y = window.pageYOffset;
	  window.scrollTo(0, 0);
	  return () => {
	    window.scrollTo(previousScrollSpot.x, previousScrollSpot.y);
	  };
	});
</script>

<style>
	.modal-background {
		position: fixed;
		background-size: cover;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0.8;
		z-index: 30;
		background-color: var(--debot-browser-color-grey);
	}

	.modal {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: absolute;
		overflow: visible;
		left: 50%;
		transform: translate(-50%, 0px);
		padding: 2rem;
		margin: 2rem 0;
		background: var(--debot-browser-bg-color);
		box-shadow: var(--debot-browser-color-darkGrey);
		-webkit-box-shadow: var(--debot-browser-color-darkGrey);
		-moz-box-shadow: var(--debot-browser-color-darkGrey);
		border-radius: 1rem;
		z-index: 60;
	}
</style>

<div
	in:fade={{ duration: 200 }}
	out:fade={{ duration: 200 }}
	class="modal-background"
	on:click={() => closeModal()} />
<div in:fade={{ duration: 200 }} out:fade={{ duration: 200 }} class="modal">
	<slot />
</div>
