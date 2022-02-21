<script lang='ts'>
  import {onMount} from 'svelte';
  import Sunburst from '../sunburst/Sunburst.svelte';
  import d3 from '../../utils/d3-import';

  let component: HTMLElement | null = null;

  // Load the data and pass to child components
  let data: object | null | undefined = null;

  const initData = async () => {
    // Init the model
    data = await d3.json('/data/campas.json');
  };

  initData();

  onMount(() => {
    console.log('mounted!');
  });
</script>

<style lang='scss'>
  @import './Finder.scss';
</style>


<div class='finder' bind:this={component}>

  <div class='header'>

    <div class='logo'>
      <div class='logo-icon'>
        Forager
      </div>
      <div class='logo-tag'>
        Identify accurate decision trees that reflect domain knowledge
      </div>
    </div>
  </div>

  <div class='content'>

    <div class='sunburst'>
      <Sunburst
        data={data}
      />
    </div>

    <!-- <div class='feature-list'>
    </div> -->

  </div>
</div>
