<script lang="ts">
  import { onMount } from 'svelte';
  import TimberTrek from '../timber/Timber.svelte';
  import { fade, fly } from 'svelte/transition';

  let component: HTMLElement | null = null;
  let curDataset = 'compas';
  let timbertrekTransitioning = false;

  const datasets = ['compas', 'fico', 'car evaluation', 'my own set'];

  const optionClicked = (dataset: string) => {
    timbertrekTransitioning = true;
    curDataset = dataset;
  };

  onMount(() => {
    // console.log('mounted!');
  });
</script>

<style lang="scss">
  @import './Article.scss';
</style>

<div class="article-page">
  <div class="main-app" bind:this={component}>
    <div class="timbertrek-app">
      {#key curDataset}
        <div
          class="timbertrek-wrapper"
          out:fly={{ x: -300, duration: 300 }}
          in:fly={{ x: 300, duration: 300 }}
          on:introstart={() => {
            timbertrekTransitioning = true;
          }}
          on:introend={() => {
            timbertrekTransitioning = false;
          }}
        >
          <TimberTrek
            notebookMode={false}
            {curDataset}
            {timbertrekTransitioning}
          />
        </div>
      {/key}
    </div>

    <div class="dataset-options">
      <span class="option-title">Choose a Rashomon set:</span>
      <div class="options">
        {#each datasets as name, i}
          <span
            class="option"
            class:selected={name === curDataset}
            on:click={() => optionClicked(name)}
            data-text={name}
          >
            {name}
          </span>
        {/each}
      </div>
    </div>
  </div>
</div>
