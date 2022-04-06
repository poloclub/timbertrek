<script lang="ts">
  import { onMount } from 'svelte';
  import { Dropzone } from './Dropzone';
  import type { HierarchyJSON } from '../TimberTypes';

  import logoIcon from '../../imgs/timbertrek-logo.svg?raw';

  export let initDataFromDropzone: (dropzoneData: HierarchyJSON) => void;

  let component: HTMLElement | null = null;
  let inputElem: HTMLInputElement | null = null;
  let dropzone: Dropzone | null = null;
  let mounted = false;
  let initialized = false;

  onMount(() => {
    mounted = true;
  });

  const dropzoneUpdated = () => {
    dropzone = dropzone;
  };

  const initView = () => {
    if (mounted && component && inputElem) {
      dropzone = new Dropzone(
        component,
        inputElem,
        dropzoneUpdated,
        initDataFromDropzone
      );
      initialized = true;
    }
  };

  $: mounted &&
    component &&
    inputElem &&
    initDataFromDropzone &&
    !initialized &&
    initView();
</script>

<style type="scss">
  @import './Dropzone.scss';
</style>

<div class="dropzone-tab" bind:this={component}>
  <div
    class="dropzone"
    class:drag-over={dropzone?.isDragging}
    on:click={e => dropzone?.clickHandler()}
    on:dragenter={e => dropzone?.dragEnterHandler(e)}
    on:dragover={e => dropzone?.dragOverHandler(e)}
    on:dragleave={e => dropzone?.dragLeaveHandler(e)}
    on:drop={e => dropzone?.dropHandler(e)}
  >
    <div class="svg-icon">
      {@html logoIcon}
    </div>
    <div class="drop-message">
      Drop a Rashomon trie file (.json) here to start
    </div>

    <div
      class="help-message"
      on:click={e => {
        e.stopPropagation();
      }}
    >
      <a
        href="https://gist.github.com/xiaohk/875b5374840c66689eb42a4b8820c3b5"
        target="_blank">How to generate this file?</a
      >
    </div>

    <span class="error-message">
      {dropzone?.errorMessage}
    </span>

    <input
      accept="json"
      type="file"
      autocomplete="off"
      on:change={e => dropzone?.inputChanged(e)}
      on:click={e => dropzone?.inputClicked()}
      bind:this={inputElem}
      style="display: none;"
    />
  </div>
</div>
