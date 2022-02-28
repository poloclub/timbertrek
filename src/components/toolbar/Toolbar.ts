import type { Writable } from 'svelte/store';
import type { AppearanceStoreValue, SunburstStoreValue } from 'src/stores';

/**
 * Class to handle events in the toolbar
 */
export class ToolbarEventHandler {
  appearanceStore: Writable<AppearanceStoreValue>;
  appearanceStoreValue: AppearanceStoreValue;

  sunburstStore: Writable<SunburstStoreValue>;
  sunburstStoreValue: SunburstStoreValue;

  handlerUpdated: () => void;

  constructor(
    handlerUpdated: () => void,
    appearanceStore: Writable<AppearanceStoreValue>,
    sunburstStore: Writable<SunburstStoreValue>
  ) {
    // We need to use this function to tell the component that the handler
    // object is updated
    this.handlerUpdated = handlerUpdated;

    // Appearance button store bonding
    this.appearanceStore = appearanceStore;
    this.appearanceStore.subscribe(value => {
      this.appearanceStoreValue = value;
      this.handlerUpdated();
    });

    // Sunburst store bonding
    this.sunburstStore = sunburstStore;
    this.sunburstStore.subscribe(value => {
      this.sunburstStoreValue = value;
      this.handlerUpdated();
    });
  }

  /**
   * Handler for appearance button clicking event
   */
  appearanceClicked = () => {
    this.appearanceStoreValue.shown = !this.appearanceStoreValue.shown;
    this.appearanceStore.set(this.appearanceStoreValue);
  };

  /**
   * Handler for depth box clicking event
   * @param depth Depth number
   */
  depthBoxClicked = (depth: number) => {
    console.log(depth);
  };
}
