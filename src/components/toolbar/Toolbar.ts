import type { Writable } from 'svelte/store';
import type { AppearanceStoreValue } from 'src/stores';

/**
 * Class to handle events in the toolbar
 */
export class ToolbarEventHandler {
  appearanceStore: Writable<AppearanceStoreValue>;
  appearanceStoreValue: AppearanceStoreValue;
  handlerUpdated: () => void;

  constructor(
    handlerUpdated: () => void,
    appearanceStore: Writable<AppearanceStoreValue>
  ) {
    // We need to use this function to tell the component that the handler
    // object is updated
    this.handlerUpdated = handlerUpdated;

    // Appearance button
    this.appearanceStore = appearanceStore;
    this.appearanceStore.subscribe(value => {
      this.appearanceStoreValue = value;
    });
  }

  /**
   * Handle appearance button clicked
   */
  appearanceClicked = () => {
    this.appearanceStoreValue.shown = !this.appearanceStoreValue.shown;
    this.appearanceStore.set(this.appearanceStoreValue);

    this.handlerUpdated();
  };
}
