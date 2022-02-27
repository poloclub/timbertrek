<script lang='ts'>
  import type { getAppearanceStore, AppearanceStoreValue } from 'src/stores';
  import { onMount } from 'svelte';

  // Component variables
  export let appearanceStore: ReturnType<typeof getAppearanceStore> = null;

  let component: HTMLElement | null = null;
  let mounted = false;
  let appearanceStoreValue: AppearanceStoreValue = {
    shown: false
  };

  onMount(() => {
    mounted = true;
  });

  const initView = () => {
    // Subscribe the store
    appearanceStore.subscribe(value => {
      appearanceStoreValue = value;
    });
  };

  $: appearanceStore && initView();
</script>

<style lang='scss'>
  @import './AppearancePanel.scss';
</style>

<div class='appearance-panel'
  bind:this={component}
  class:shown={appearanceStoreValue.shown}>
  <div class='header'>Appearance</div>
</div>