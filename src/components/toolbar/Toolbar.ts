import type { Writable } from 'svelte/store';
import {
  AppearanceStoreValue,
  SunburstStoreValue,
  SunburstAction
} from '../../stores';

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
   * Case 1: number < low: it only happens during zoom, move low
   * Case 2: number > high: move high
   * Case 3: number between low and high: move high
   * Case 4: number = low or number = high: do nothing
   * @param depth Depth number
   */
  depthBoxClicked = (depth: number) => {
    if (depth < this.sunburstStoreValue.depthLow) {
      // Case 1
      this.sunburstStoreValue.depthLow = depth;
      this.sunburstStoreValue.action = SunburstAction.DepthChanged;
      this.sunburstStore.set(this.sunburstStoreValue);
    } else if (depth > this.sunburstStoreValue.depthHigh) {
      // Case 2
      this.sunburstStoreValue.depthHigh = depth;
      this.sunburstStoreValue.action = SunburstAction.DepthChanged;
      this.sunburstStore.set(this.sunburstStoreValue);
    } else if (
      this.sunburstStoreValue.depthLow < depth &&
      depth < this.sunburstStoreValue.depthHigh
    ) {
      // Case 3
      this.sunburstStoreValue.depthHigh = depth;
      this.sunburstStoreValue.action = SunburstAction.DepthChanged;
      this.sunburstStore.set(this.sunburstStoreValue);
    } else if (
      this.sunburstStoreValue.depthLow === depth ||
      this.sunburstStoreValue.depthHigh === depth
    ) {
      // Case 4
      // pass
    } else {
      console.error('Unknown case in depthBoxClicked()');
    }
  };
}
