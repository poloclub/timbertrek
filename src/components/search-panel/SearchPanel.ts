import type { Writable } from 'svelte/store';
import d3 from '../../utils/d3-import';
import { config } from '../../config';
import type { SearchStoreValue } from '../../stores';
import { getSearchStoreDefaultValue } from '../../stores';

const LEFT_THUMB_ID = 'slider-left-thumb';
const RIGHT_THUMB_ID = 'slider-right-thumb';
const PANEL_WIDTH = 268;
const PANEL_H_GAP = 16;
const THUMB_WIDTH = 8;

/**
 * Class to handle events in the toolbar
 */
export class SearchPanel {
  component: HTMLElement;
  accuracyRow: d3.Selection<d3.BaseType, unknown, null, undefined>;
  accuracySVG: d3.Selection<d3.BaseType, unknown, null, undefined>;

  searchStore: Writable<SearchStoreValue>;
  searchStoreValue: SearchStoreValue;

  curAccuracyLow: number;
  curAccuracyHigh: number;

  searchUpdated: () => void;

  constructor(
    component: HTMLElement,
    searchUpdated: () => void,
    searchStore: Writable<SearchStoreValue>
  ) {
    this.component = component;

    // We need to use this function to tell the component that the handler
    // object is updated
    this.searchUpdated = searchUpdated;

    // Search store binding
    this.searchStore = searchStore;
    this.searchStoreValue = getSearchStoreDefaultValue();
    this.searchStore.subscribe(value => {
      this.searchStoreValue = value;
      this.searchUpdated();
    });

    // Bind different sub elements as D3 selections
    this.accuracyRow = d3.select(component).select('.accuracy-row');

    // Initialize the accuracy row
    this.curAccuracyLow = 0;
    this.curAccuracyHigh = 1;

    this.accuracySVG = this.#initAccuracySVG();
    this.#initSlider();
  }

  /**
   * Draw the SVG for the accuracy slider
   */
  #initAccuracySVG() {
    const width = PANEL_WIDTH - PANEL_H_GAP * 2;
    const histHeight = 90;
    const vGap = 15;
    const height = histHeight + vGap;

    const accuracySVG = this.accuracyRow
      .select('.svg-accuracy')
      .attr('width', width)
      .attr('height', height);

    // Offset the range thumb to align with the track
    const thumbWidth = (
      this.accuracyRow.select('#slider-left-thumb').node() as HTMLElement
    ).offsetWidth;

    const padding = {
      top: 0,
      left: thumbWidth,
      right: thumbWidth,
      bottom: 0,
      histTop: 2
    };

    // Draw a bounding box for this density plot
    accuracySVG
      .append('g')
      .attr('class', 'border-group')
      .attr('transform', `translate(${0}, ${padding.top})`)
      .append('rect')
      .attr('width', width)
      .attr('height', histHeight - padding.top)
      .style('fill', 'none')
      .style('stroke', config.colors['gray-200']);

    return accuracySVG;
  }

  /**
   * Initialize the slider.
   */
  #initSlider() {
    // Move two range thumbs to the left and right ends
    this.#moveThumb(LEFT_THUMB_ID, this.curAccuracyLow);
    this.#moveThumb(RIGHT_THUMB_ID, this.curAccuracyHigh);

    // // Register event listeners
    // d3.select(component)
    //   .select(`#${leftThumbID}`)
    //   .on('mousedown', e => mouseDownHandler(e, component, state));

    // d3.select(component)
    //   .select(`#${rightThumbID}`)
    //   .on('mousedown', e => mouseDownHandler(e, component, state));

    // syncRangeTrack(component, state);
  }

  /**
   * Move the specified thumb to the given value on the slider.
   * @param{string} thumbID The ID of the thumb element.
   * @param{number} value The target value to move the thumb to.
   */
  #moveThumb(thumbID: string, value: number) {
    // Make sure we are only moving within the range of the state.feature value
    value = Math.min(Math.max(value, 0), 1);

    // Special rules based on the thumb type
    switch (thumbID) {
      case 'slider-left-thumb':
        value = Math.min(this.curAccuracyHigh, value);
        break;

      case 'slider-right-thumb':
        value = Math.max(this.curAccuracyLow, value);
        break;

      default:
        console.warn('Unknown thumb type in moveThumb()');
        break;
    }

    // Save the current value to the HTML element
    const thumb = this.accuracyRow
      .select(`#${thumbID}`)
      .attr('data-curValue', value);

    // Compute the position to move the thumb to
    const trackWidth = PANEL_WIDTH - 2 * PANEL_H_GAP - 2 * THUMB_WIDTH;
    let xPos = value * trackWidth;

    // Need to offset the xPos based on the thumb type
    // Also register different values based on the thumb type
    switch (thumbID) {
      case 'slider-left-thumb':
        xPos -= THUMB_WIDTH;
        this.curAccuracyLow = value;
        // syncTicks(state);
        // syncRangeTrack(component, state);
        // updateRangeAnnotation(component, state);
        // syncFeature(state);
        break;

      case 'slider-right-thumb':
        this.curAccuracyHigh = value;
        // syncTicks(state);
        // syncRangeTrack(component, state);
        // updateRangeAnnotation(component, state);
        // syncFeature(state);
        break;

      default:
        console.warn('Unknown thumb type in moveThumb()');
        break;
    }

    // syncTooltips(component, state);
    thumb.style('left', `${xPos}px`);
    // state.stateUpdated(stateChangeKey);
  }
}
