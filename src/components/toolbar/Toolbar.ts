import type { Writable } from 'svelte/store';
import d3 from '../../utils/d3-import';
// import { config } from '../../config';
import { getContrastRatio } from '../../utils/utils';
import type {
  FavoritesStoreValue,
  SunburstStoreValue,
  SearchStoreValue
} from '../../stores';
import {
  getFavoritesStoreDefaultValue,
  getSunburstStoreDefaultValue,
  getSearchStoreDefaultValue
} from '../../stores';
import { SunburstAction } from '../../stores';

/**
 * Class to handle events in the toolbar
 */
export class ToolbarEventHandler {
  favoritesStore: Writable<FavoritesStoreValue>;
  favoritesStoreValue: FavoritesStoreValue;

  searchStore: Writable<SearchStoreValue>;
  searchStoreValue: SearchStoreValue;

  sunburstStore: Writable<SunburstStoreValue>;
  sunburstStoreValue: SunburstStoreValue;

  handlerUpdated: () => void;

  constructor(
    handlerUpdated: () => void,
    favoritesStore: Writable<FavoritesStoreValue>,
    sunburstStore: Writable<SunburstStoreValue>,
    searchStore: Writable<SearchStoreValue>
  ) {
    // We need to use this function to tell the component that the handler
    // object is updated
    this.handlerUpdated = handlerUpdated;

    // Favorites button store binding
    this.favoritesStore = favoritesStore;
    this.favoritesStoreValue = getFavoritesStoreDefaultValue();
    this.favoritesStore.subscribe(value => {
      this.favoritesStoreValue = value;
      this.handlerUpdated();
    });

    // Sunburst store binding
    this.sunburstStore = sunburstStore;
    this.sunburstStoreValue = getSunburstStoreDefaultValue();
    this.sunburstStore.subscribe(value => {
      this.sunburstStoreValue = value;
      this.handlerUpdated();
    });

    // Search store binding
    this.searchStore = searchStore;
    this.searchStoreValue = getSearchStoreDefaultValue();
    this.searchStore.subscribe(value => {
      this.searchStoreValue = value;
      this.handlerUpdated();
    });
  }

  /**
   * Handler for favorites button clicking event
   */
  favoritesClicked = () => {
    this.favoritesStoreValue.shown = !this.favoritesStoreValue.shown;
    this.favoritesStore.set(this.favoritesStoreValue);

    // Hide the search panel if it is shown
    if (this.favoritesStoreValue.shown && this.searchStoreValue.shown) {
      this.searchStoreValue.shown = false;
      this.searchStore.set(this.searchStoreValue);
    }
  };

  /**
   * Handler for favorites button clicking event
   */
  searchClicked = () => {
    this.searchStoreValue.shown = !this.searchStoreValue.shown;
    this.searchStore.set(this.searchStoreValue);

    // Hide the fav panel if it is shown
    if (this.searchStoreValue.shown && this.favoritesStoreValue.shown) {
      this.favoritesStoreValue.shown = false;
      this.favoritesStore.set(this.favoritesStoreValue);
    }
  };

  /**
   * Handler for depth box clicking event
   * Case 1: number < low: it only happens during zoom, do nothing
   * Case 2: number > high: move high
   * Case 3: number between low and high: move high
   * Case 4: number = low or number = high: do nothing
   * @param depth Depth number
   */
  depthBoxClicked = (depth: number) => {
    if (depth < this.sunburstStoreValue.depthLow) {
      // Case 1
      // pass
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

  /**
   * Get the CSS style string for the depth box (background color and color)
   * @param depth Depth number (starting from 1)
   */
  getDepthBoxStyle = (depth: number) => {
    const background = this.sunburstStoreValue.depthColors[depth - 1];
    let foreground = 'inherit';

    if (background === null || background === '') {
      // background = config.colors['gray-50'];
      return '';
    } else {
      // Check the color contrast for the text color
      const whiteRGB = [252, 252, 252];
      const blackRGB = [74, 74, 74];

      const rgb = d3.color(background)!.rgb();
      const backgroundRGB = [rgb.r, rgb.g, rgb.b];

      if (
        getContrastRatio(whiteRGB, backgroundRGB) <
        getContrastRatio(blackRGB, backgroundRGB)
      ) {
        foreground = 'hsla(0, 0%, 99%, 1)';
      }
    }

    return `
    background-color: ${background}; color: ${foreground}; border: none;
    `;
  };
}
