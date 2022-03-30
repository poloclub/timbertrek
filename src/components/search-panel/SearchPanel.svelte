<script lang="ts">
  import d3 from '../../utils/d3-import';
  import type { SearchStoreValue } from '../../stores';
  import { getSearchStoreDefaultValue } from '../../stores';
  import type { Writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import { SearchPanel } from './SearchPanel';
  import closeIcon from '../../imgs/icon-close.svg?raw';
  import thumbLeftIcon from '../../imgs/icon-range-thumb-left.svg?raw';
  import thumbRightIcon from '../../imgs/icon-range-thumb-right.svg?raw';

  // Component variables
  export let searchStore: Writable<SearchStoreValue> | null = null;

  let component: HTMLElement | null = null;
  let mounted = false;
  let initialized = false;
  let searchPanel: SearchPanel | null = null;

  let searchStoreValue = getSearchStoreDefaultValue();

  const formatter = d3.format(',.2~f');

  onMount(() => {
    mounted = true;
  });

  const searchUpdated = () => {
    searchPanel = searchPanel;
  };

  const initView = () => {
    initialized = true;

    if (searchStore && component) {
      searchStore.subscribe(value => {
        searchStoreValue = value;
      });
      searchPanel = new SearchPanel(component, searchUpdated, searchStore);
    }
  };

  const closeClicked = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    searchStoreValue.shown = false;
    searchStore?.set(searchStoreValue);
  };

  $: searchStore && mounted && !initialized && component && initView();
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
      <div class="accuracy-content">
        <div
          class="feature-slider"
          on:click={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div class="track">
            <div class="range-track" />
            <div
              id="slider-left-thumb"
              tabindex="-1"
              style="left: 0px"
              class="svg-icon icon-range-thumb-left thumb"
            >
              {@html thumbLeftIcon}
              <div class="thumb-label thumb-label-left">
                <span class="thumb-label-span">{formatter(0)}</span>
              </div>
            </div>
            <div
              id="slider-right-thumb"
              tabindex="-1"
              style="left: 0px"
              class="svg-icon icon-range-thumb-right thumb"
            >
              {@html thumbRightIcon}
              <div class="thumb-label thumb-label-right">
                <span class="thumb-label-span">{formatter(1)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="feature-hist">
          <svg class="svg-accuracy" />
        </div>
      </div>
    </div>
  </div>
</div>
