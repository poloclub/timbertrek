<script lang="ts">
  import { onMount } from 'svelte';
  import TimberTrek from '../timber/Timber.svelte';
  import Youtube from './Youtube.svelte';
  import { fade, fly } from 'svelte/transition';

  import iconLogo from '../../imgs/timbertrek-logo-light.svg?raw';
  import iconRocket from '../../imgs/icon-rocket.svg?raw';
  import iconNote from '../../imgs/icon-note.svg?raw';
  import iconGT from '../../imgs/logo-gt.svg?raw';
  import iconFujitsu from '../../imgs/logo-fujitsu.svg?raw';
  import iconDuke from '../../imgs/logo-duke.svg?raw';
  import iconUBC from '../../imgs/logo-ubc.svg?raw';
  import iconCopy from '../../imgs/icon-copy.svg?raw';
  import text from './ArticleText.yml';

  let component: HTMLElement | null = null;
  let currentPlayer = null;
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
      <span><span class="tool-name">TimberTrek</span>?</span>

      <!-- <span>What is TimberTrek?</span>
      <span class="svg-icon logo-icon">{@html iconLogo}</span> -->
    </h2>

    {#each text.tool as p}
      <p>{@html p}</p>
    {/each}

    <h2 id="usage">How to Use <span class="tool-name">TimberTrek</span>?</h2>
    <p>{@html text.usage.p1}</p>
    <p>
      {@html text.usage.p2}(click the
      <span class="svg-icon note-icon">{@html iconNote}</span> button to create sticky
      cells).
    </p>

    <div class="jupyter-demo">
      {#if showIFrame}
        <iframe
          title="Jupyter notebook"
          src="https://poloclub.github.io/timbertrek/notebook/retro/notebooks/?path=campas.ipynb"
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
            alt="Jupyter notebook place holder"
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

    <h2 id="usage">
      What Can I do with <span class="tool-name">TimberTrek</span>?
    </h2>
    <p>{@html text.tutorial.p1}</p>

    {#each text.tutorial.items as item, i}
      <h4 id={item.id}>{item.name}</h4>
      <p>{@html item.descriptions[0]}</p>
      <div class="video" class:wide-video={false}>
        <video autoplay loop muted playsinline>
          <source src={`${import.meta.env.BASE_URL}video/${item.id}.mp4`} />
          <track kind="captions" />
        </video>
        <div class="figure-caption">
          Video {i + 1}. {@html item.caption}
        </div>
      </div>
      {#each item.descriptions.slice(1) as p}
        <p>{@html p}</p>
      {/each}
    {/each}

    <h2 id="youtube-video">Demo Video</h2>

    <ul class="video-list">
      {#each text.youtubeTimes as time, i}
        <li class="video-link" on:click={currentPlayer.play(time.startTime)}>
          {time.name}
          <small>{time.timestamp}</small>
        </li>
      {/each}
    </ul>

    <div class="youtube-video">
      <Youtube
        videoId="3eGqTmsStJM"
        playerId="demo_video"
        bind:this={currentPlayer}
      />
    </div>

    <h2 id="usage">
      How is <span class="tool-name" style="margin-right: 8px;">TimberTrek</span
      > Developed?
    </h2>
    <p>{@html text.development}</p>

    <h2 id="team">Who Developed <span class="tool-name">TimberTrek</span>?</h2>
    <p>{@html text.team}</p>

    <h2 id="contribute">How Can I Contribute?</h2>
    <p>{@html text.contribute[0]}</p>
    <p>{@html text.contribute[1]}</p>

    <h2 id="cite">How can I learn more about TimberTrek?</h2>

    <p>{@html text.cite['intro']}</p>
    <div class="bibtex-block">
      {@html text.cite['bibtex']}
      <div class="block-overlay">
        <span class="svg-icon">{@html iconCopy}</span>
        <span>Click to copy</span>
      </div>
    </div>
  </div>

  <div class="article-footer">
    <div class="footer-main">
      <div class="footer-logo">
        <a target="_blank" href="https://www.gatech.edu/">
          <div class="svg-logo" title="Georgia Tech">
            {@html iconGT}
          </div>
        </a>

        <a target="_blank" href="https://www.duke.edu/">
          <div class="svg-logo" title="Duke University">
            {@html iconDuke}
          </div>
        </a>

        <a
          target="_blank"
          href="https://www.fujitsu.com/global/about/research/"
        >
          <div class="svg-logo" title="Fujitsu Lab">
            {@html iconFujitsu}
          </div>
        </a>

        <a target="_blank" href="https://www.ubc.ca/">
          <div class="svg-logo" title="The University of British Columbia">
            {@html iconUBC}
          </div>
        </a>
      </div>
    </div>
  </div>
</div>
