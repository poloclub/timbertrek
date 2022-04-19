<script lang="ts">
  import d3 from '../../utils/d3-import';
  import type { SearchStoreValue } from '../../stores';
  import { getSearchStoreDefaultValue } from '../../stores';
  import type { Writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import { SearchPanel } from './SearchPanel';
  import type { HierarchyJSON } from '../TimberTypes';

  import closeIcon from '../../imgs/icon-close.svg?raw';
  import thumbLeftIcon from '../../imgs/icon-range-thumb-left.svg?raw';
  import thumbRightIcon from '../../imgs/icon-range-thumb-right.svg?raw';
  import downIcon from '../../imgs/icon-caret-down.svg?raw';
  import refreshIcon from '../../imgs/icon-refresh.svg?raw';

  // Component variables
  export let data: HierarchyJSON | null = null;
  export let searchStore: Writable<SearchStoreValue> | null = null;
  export let width = 650;

  let component: HTMLElement | null = null;
  let mounted = false;
  let initialized = false;
  let searchPanel: SearchPanel | null = null;

  let searchStoreValue = getSearchStoreDefaultValue();
  let depthWithDetails = new Set<number>([]);

  enum RefreshLocation {
    Accuracy,
    Height,
    MinSample,
    Depth,
    AllFeatures
  }

  const formatter = d3.format(',.3f');
  const sampleFormatter = d3.format('d');

  onMount(() => {
    mounted = true;
  });

  const searchUpdated = () => {
    searchPanel = searchPanel;
  };

  const closeClicked = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    searchStoreValue.shown = false;
    searchStore?.set(searchStoreValue);
  };

  const detailClicked = (e: MouseEvent, depth: number) => {
    e.stopPropagation();
    e.preventDefault();

    const button = e.currentTarget as HTMLElement;
    const preDetail = button.dataset.detail!;

    if (preDetail === 'false') {
      button.dataset.detail = 'true';
      depthWithDetails.add(depth);
    } else {
      button.dataset.detail = 'false';
      depthWithDetails.delete(depth);
    }
    depthWithDetails = depthWithDetails;
  };

  const refreshClicked = (
    e: MouseEvent,
    location: RefreshLocation,
    depth: number | null = null
  ) => {
    if (searchPanel === null) return;

    e.preventDefault();

    switch (location) {
      case RefreshLocation.Accuracy: {
        searchPanel.refreshAccuracy();
        break;
      }

      case RefreshLocation.MinSample: {
        searchPanel.refreshMinSample();
        break;
      }

      case RefreshLocation.Depth: {
        if (depth !== null) {
          searchPanel.refreshDepth(depth);
        }
        break;
      }

      case RefreshLocation.AllFeatures: {
        searchPanel.refreshAllFeatures();
        break;
      }

      case RefreshLocation.Height: {
        searchPanel.refreshHeight();
        break;
      }

      default: {
        console.warn('Unexpected case for refreshClicked()');
      }
    }
  };

  const initView = () => {
    initialized = true;

    if (searchStore && component && data) {
      searchStore.subscribe(value => {
        searchStoreValue = value;
      });
      searchPanel = new SearchPanel(
        component,
        data,
        searchUpdated,
        searchStore
      );
    }
  };

  $: data && searchStore && mounted && !initialized && component && initView();
</script>

<style lang="scss">
  @import './SearchPanel.scss';
</style>

<div
  class="search-panel"
  style={`max-height: ${width}px;`}
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
      <div class="row-title">
        <span>Accuracy</span>
        <div class="title-icons">
          <span
            class="title-icon refresh-button"
            title="Reset the filter"
            on:click={e => refreshClicked(e, RefreshLocation.Accuracy)}
          >
            {@html refreshIcon}
          </span>
        </div>
      </div>
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
                <span class="thumb-label-span"
                  >{formatter(searchPanel?.curAccuracyLow)}</span
                >
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
                <span class="thumb-label-span"
                  >{formatter(searchPanel?.curAccuracyHigh)}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div class="feature-hist">
          <svg class="svg-accuracy" />
        </div>
      </div>
    </div>

    <div class="row min-sample-row">
      <div class="row-title">
        <span>Minimum Leaf Sample</span>
        <div class="title-icons">
          <span
            class="title-icon refresh-button"
            title="Reset the filter"
            on:click={e => refreshClicked(e, RefreshLocation.MinSample)}
          >
            {@html refreshIcon}
          </span>
        </div>
      </div>
      <div class="min-sample-content">
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
                <span class="thumb-label-span"
                  >{sampleFormatter(searchPanel?.curMinSampleLow)}</span
                >
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
                <span class="thumb-label-span"
                  >{sampleFormatter(searchPanel?.curMinSampleHigh)}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div class="feature-hist">
          <svg class="svg-min-sample" />
        </div>
      </div>
    </div>

    <div class="row height-row">
      <div class="row-title">
        <span>Height</span>
        <div class="title-icons">
          <span
            class="title-icon refresh-button"
            title="Reset the filter"
            on:click={e => refreshClicked(e, RefreshLocation.Height)}
          >
            {@html refreshIcon}
          </span>
        </div>
      </div>
      <div class="height-content">
        <div class="feature-hist">
          <svg class="svg-height" />
        </div>
        <div class="height-checkboxes" />
      </div>
    </div>

    {#if data}
      <div
        class="row level-row level-row-all"
        id="level-row-0"
        class:show-detail={depthWithDetails.has(0)}
      >
        <div class="row-title">
          <span>Features</span>
          <div class="title-icons">
            <span
              class="title-icon refresh-button"
              title="Reset the filter"
              on:click={e => refreshClicked(e, RefreshLocation.AllFeatures)}
            >
              {@html refreshIcon}
            </span>

            <span
              class="title-icon detail-button"
              title="Show details"
              data-detail="false"
              on:click={e => detailClicked(e, 0)}
            >
              {@html downIcon}
            </span>
          </div>
        </div>
        <div class="level-summary">
          {searchStoreValue.curAllFeatures.size ===
          Object.keys(data?.featureMap).length
            ? 'Include all features'
            : `Include ${searchStoreValue.curAllFeatures.size} out of ${
                Object.keys(data?.featureMap).length
              } features`}
        </div>
        <div class="level-content" />
      </div>
    {/if}

    {#each [...searchStoreValue.curDepthFeatures.keys()] as depth}
      <div
        class="row level-row"
        id={`level-row-${depth}`}
        class:show-detail={depthWithDetails.has(depth)}
      >
        <div class="row-title">
          <span>{`Depth ${depth}`}</span>
          <div class="title-icons">
            <span
              class="title-icon refresh-button"
              title="Reset the filter"
              on:click={e => refreshClicked(e, RefreshLocation.Depth, depth)}
            >
              {@html refreshIcon}
            </span>

            <span
              class="title-icon detail-button"
              title="Show details"
              data-detail="false"
              on:click={e => detailClicked(e, depth)}
            >
              {@html downIcon}
            </span>
          </div>
        </div>
        <div class="level-summary">
          {searchStoreValue.curDepthFeatures.get(depth)?.size ===
          Object.keys(data?.featureMap).length
            ? 'Include all features'
            : `Include ${
                searchStoreValue.curDepthFeatures.get(depth)?.size
              } out of ${Object.keys(data?.featureMap).length} features`}
        </div>
        <div class="level-content" />
      </div>
    {/each}
  </div>
</div>
