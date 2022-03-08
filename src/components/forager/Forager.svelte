<script lang='ts'>
  import { onMount } from 'svelte';
  import { getAppearanceStore, getSunburstStore } from '../../stores';
  import Toolbar from '../toolbar/Toolbar.svelte';
  import Sunburst from '../sunburst/Sunburst.svelte';
  import AppearancePanel from '../appearance-panel/AppearancePanel.svelte';
  import d3 from '../../utils/d3-import';

  let component: HTMLElement | null = null;

  // Load the data and pass to child components
  let data: object | null | undefined = null;

  const initData = async () => {
    // Init the model
    data = await d3.json('/data/compas_rules_0.01_0.05.json');
  };

  initData();

  // Construct stores
  const appearanceStore = getAppearanceStore();
  const sunburstStore = getSunburstStore();

  onMount(() => {
    console.log('mounted!');
  });
</script>

<style lang='scss'>
  @import './Forager.scss';
</style>


<div class='forager' bind:this={component}>

  <div class='header'>

    <div class='logo'>
      <div class='logo-icon'>
        Forager
      </div>
      <div class='logo-tag'>
        Identifying accurate decision trees that align with human knowledge
      </div>
    </div>
  </div>

  <div class='content'>

    <div class='toolbar'>
      <Toolbar
        appearanceStore={appearanceStore}
        sunburstStore={sunburstStore}
      />
    </div>

    <div class='sunburst'>
      <Sunburst
        data={data}
        sunburstStore={sunburstStore}
      />
    </div>

  </div>

  <div class='sidebar'>
    <AppearancePanel
      appearanceStore={appearanceStore}
    />
  </div>
</div>
