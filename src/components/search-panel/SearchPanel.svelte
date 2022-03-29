<script lang="ts">
  import type { SearchStoreValue } from '../../stores';
  import { getSearchStoreDefaultValue } from '../../stores';
  import type { Writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import closeIcon from '../../imgs/icon-close.svg?raw';

  // Component variables
  export let searchStore: Writable<SearchStoreValue> | null = null;

  let component: HTMLElement | null = null;
  let mounted = false;
  let initialized = false;

  let searchStoreValue = getSearchStoreDefaultValue();

  onMount(() => {
    mounted = true;
  });

  const initView = () => {
    initialized = true;

    if (searchStore) {
      searchStore.subscribe(value => {
        searchStoreValue = value;
      });
    }
  };

  const closeClicked = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    searchStoreValue.shown = false;
    searchStore?.set(searchStoreValue);
  };

  $: searchStoreValue && mounted && !initialized && initView();
</script>

<style lang="scss">
  @import './SearchPanel.scss';
</style>

<div
  class="search-panel"
  bind:this={component}
  class:shown={searchStoreValue.shown}
>
  <div class="header">
    <div class="header-title">
      <div class="title">Search Trees</div>
      <div class="icons">
        <div class="svg-icon close-icon" on:click={closeClicked}>
          {@html closeIcon}
        </div>
      </div>
    </div>
  </div>

  <div class="search-list">
    <div class="row accuracy-row">
      <div class="row-title">Accuracy</div>
      <div class="accuracy-content">Content</div>
    </div>
  </div>
</div>
