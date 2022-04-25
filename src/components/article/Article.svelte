<script lang="ts">
  import { onMount } from 'svelte';
  import TimberTrek from '../timber/Timber.svelte';
  import { fade, fly } from 'svelte/transition';

  import iconLogo from '../../imgs/timbertrek-logo-light.svg?raw';
  import iconRocket from '../../imgs/icon-rocket.svg?raw';
  import iconNote from '../../imgs/icon-note.svg?raw';
  import text from './ArticleText.yml';

  let component: HTMLElement | null = null;
  let curDataset = 'compas';
  let timbertrekTransitioning = false;
  let showIFrame = false;

  const datasets = ['compas', 'fico', 'car evaluation', 'my own set'];

  const optionClicked = (dataset: string) => {
    timbertrekTransitioning = true;
    curDataset = dataset;
  };

  onMount(() => {
    //pass
  });

  // <!-- src="https://xiaohk.github.io/timbertrek/notebook/retro/notebooks/?path=campas.ipynb" -->
</script>

<style lang="scss">
  @import './Article.scss';
</style>

<svelte:head>
  <!-- <script
    id="MathJax-script"
    async
    src={`${import.meta.env.BASE_URL}data/mathjax/tex-chtml.js`}></script> -->
  <script
    id="MathJax-script"
    async
    src="https://cdn.jsdelivr.net/npm/mathjax@3.2/es5/tex-mml-chtml.js"></script>
</svelte:head>

<div class="article-page">
  <div class="main-app" bind:this={component} tabindex="-1">
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

  <div class="article">
    <h2 id="tool">
      <span>What is </span>
      <span class="svg-icon logo-icon">{@html iconLogo}</span>
      <span>TimberTrek?</span>

      <!-- <span>What is TimberTrek?</span>
      <span class="svg-icon logo-icon">{@html iconLogo}</span> -->
    </h2>

    {#each text.tool as p}
      <p>{@html p}</p>
    {/each}

    <h2 id="usage">How to Use TimberTrek?</h2>
    <p>{@html text.usage.p1}</p>
    <p>
      {@html text.usage.p2}(click the
      <span class="svg-icon note-icon">{@html iconNote}</span> button to create sticky
      cells).
    </p>

    <div class="jupyter-demo">
      {#if showIFrame}
        <iframe
          src="https://xiaohk.github.io/timbertrek/notebook/retro/notebooks/?path=campas.ipynb"
          width="100%"
          height="100%"
        />
      {:else}
        <div
          class="demo-placeholder"
          on:click={() => {
            showIFrame = true;
          }}
        >
          <div class="mask" />
          <img
            src={`${import.meta.env.BASE_URL}data/jupyter-placeholder.png`}
          />
          <div
            class="button"
            on:click={() => {
              showIFrame = true;
            }}
          >
            <span class="svg-icon">{@html iconRocket}</span>Launch Jupyter
            Notebook
          </div>
        </div>
      {/if}
    </div>

    <h2 id="usage">What Can I do with TimberTrek?</h2>
    <p>{@html text.tutorial.p1}</p>

    {#each text.tutorial.items as item}
      <h4 id={item.id}>{item.name}</h4>
      {#each item.descriptions as p}
        <p>{@html p}</p>
      {/each}
    {/each}

    <h2 id="usage">How is TimberTrek Developed?</h2>
    <p>{@html text.development}</p>
  </div>
</div>
