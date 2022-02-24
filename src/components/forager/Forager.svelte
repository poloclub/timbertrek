<script lang='ts'>
  import {onMount} from 'svelte';
  import Sunburst from '../sunburst/Sunburst.svelte';
  import d3 from '../../utils/d3-import';

  let component: HTMLElement | null = null;

  // Load the data and pass to child components
  let data: object | null | undefined = null;

  const initData = async () => {
    // Init the model
    data = await d3.json('/data/compas_0.01_0.05.json');
  };

  initData();

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
        Identify accurate decision trees that reflect human knowledge
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
