import type { Writable } from 'svelte/store';
import d3 from '../../utils/d3-import';
import { config } from '../../config';
import type { SearchStoreValue } from '../../stores';
import { getSearchStoreDefaultValue } from '../../stores';
import type { HierarchyJSON, Point } from '../TimberTypes';

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

  data: HierarchyJSON;
  accuracyDensities: Point[];
  heightDensities: Point[];

  accuracyXScale: d3.ScaleLinear<number, number, never>;
  accuracyYScale: d3.ScaleLinear<number, number, never>;
  densityClip: d3.Selection<SVGRectElement, unknown, null, undefined> | null;

  searchStore: Writable<SearchStoreValue>;
  searchStoreValue: SearchStoreValue;

  curAccuracyLow: number;
  curAccuracyHigh: number;
  accuracyLow: number;
  accuracyHigh: number;

  searchUpdated: () => void;

  constructor(
    component: HTMLElement,
    data: HierarchyJSON,
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

    // Initialize the accuracy row (will be updated in processData())
    this.curAccuracyLow = 0;
    this.curAccuracyHigh = 1;
    this.accuracyLow = 0;
    this.accuracyHigh = 1;

    // Process the input data
    this.data = data;
    const result = this.#processData();
    this.accuracyDensities = result.accuracyDensities;
    this.heightDensities = result.heightDensities;

    console.log(this.accuracyDensities, this.heightDensities);

    // Put placeholder in the scales
    this.accuracyXScale = d3.scaleLinear();
    this.accuracyYScale = d3.scaleLinear();
    this.densityClip = null;

    this.accuracySVG = this.#initAccuracySVG();
    this.#initSlider();
  }

  /**
   * Process the raw data
   * (1) Create accuracy distribution
   * (2) Create tree height distribution
   */
  #processData() {
    // (1) Identify the accuracy distribution
    const accuracies: number[] = [];
    for (const treeID in this.data.treeMap) {
      accuracies.push(this.data.treeMap[treeID][2]);
    }

    const count = accuracies.length;
    const binNum = 50;
    const bins = d3.bin().thresholds(binNum)(accuracies);

    // Compute the density in each bin
    const accuracyDensities: Point[] = [];
    bins.forEach(b => {
      accuracyDensities.push({
        x: b.x0 === undefined ? 0 : b.x0,
        y: b.length / count
      });
    });

    // Add start and end to make sure the path starts and ends at 0
    const densityGap = accuracyDensities[1].x - accuracyDensities[0].x;
    accuracyDensities.unshift({
      x: accuracyDensities[0].x - densityGap,
      y: 0
    });
    accuracyDensities.push({
      x: accuracyDensities.slice(-1)[0].x + densityGap,
      y: 0
    });

    // Update the accuracy min and max
    this.curAccuracyLow = accuracyDensities[0].x - densityGap;
    this.curAccuracyHigh = accuracyDensities.slice(-1)[0].x + densityGap;
    this.accuracyLow = this.curAccuracyLow;
    this.accuracyHigh = this.curAccuracyHigh;

    // (2) Identify tree heights
    const treeHeightMap = new Map<number, number>();
    const ruleRoot = d3.hierarchy(this.data.trie, d => d.c);
    ruleRoot.eachBefore(d => {
      if (d.data.t !== undefined) {
        const treeID = d.data.t;
        if (!treeHeightMap.has(treeID)) {
          treeHeightMap.set(treeID, d.depth);
        } else {
          treeHeightMap.set(
            treeID,
            Math.max(treeHeightMap.get(treeID)!, d.depth)
          );
        }
      }
    });

    const heightCountMap = new Map<number, number>();
    Array.from(treeHeightMap.values()).forEach(h => {
      if (heightCountMap.has(h)) {
        heightCountMap.set(h, heightCountMap.get(h)! + 1);
      } else {
        heightCountMap.set(h, 1);
      }
    });

    // Compute the density for each height value
    const heightDensities: Point[] = [];
    heightCountMap.forEach((v, k) => {
      heightDensities.push({
        x: k,
        y: v / count
      });
    });

    return { accuracyDensities, heightDensities };
  }

  /**
   * Draw the SVG for the accuracy slider
   */
  #initAccuracySVG() {
    const width = PANEL_WIDTH - PANEL_H_GAP * 2;
    const histHeight = 55;
    const vGap = 15;
    const height = histHeight + vGap;

    const accuracySVG = this.accuracyRow
      .select('.svg-accuracy')
      .attr('width', width)
      .attr('height', height);

    // Offset the range thumb to align with the track
    const padding = {
      top: 0,
      left: THUMB_WIDTH,
      right: THUMB_WIDTH,
      bottom: 0,
      histTop: 2
    };

    const totalWidth = width - padding.left - padding.right;

    // Draw a bounding box for this density plot
    accuracySVG
      .append('g')
      .attr('class', 'border-group')
      .attr('transform', `translate(${0}, ${padding.top})`)
      .append('rect')
      .attr('width', width)
      .attr('height', histHeight - padding.top)
      .style('fill', 'none')
      .style('stroke', config.colors['gray-300']);

    // Add density plot
    const histGroup = accuracySVG
      .append('g')
      .attr('class', 'hist-group')
      .attr('transform', `translate(${THUMB_WIDTH}, ${padding.top})`);

    // Create the axis scales
    this.accuracyXScale = d3
      .scaleLinear()
      .domain([
        this.accuracyDensities[0].x,
        this.accuracyDensities.slice(-1)[0].x
      ])
      .range([0, totalWidth]);

    const maxDensity = Math.max(...this.accuracyDensities.map(d => d.y));
    this.accuracyYScale = d3
      .scaleLinear()
      .domain([0, maxDensity])
      .range([histHeight - padding.bottom - padding.top, padding.histTop]);

    const curve = d3
      .line<Point>()
      .curve(d3.curveBasis)
      .x(d => this.accuracyXScale(d.x))
      .y(d => this.accuracyYScale(d.y));

    // Draw the area curve
    const underArea = histGroup
      .append('path')
      .attr('class', 'area-path')
      .datum(this.accuracyDensities)
      .attr('d', curve);

    const upperArea = underArea.clone(true).classed('selected', true);

    // Create a clip path
    this.densityClip = histGroup
      .append('clipPath')
      .attr('id', 'accuracy-density-clip')
      .append('rect')
      .style('fill', 'hsla(100, 50%, 50%, 0.1)')
      .attr('x', this.accuracyXScale(this.curAccuracyLow))
      .attr(
        'width',
        this.accuracyXScale(this.curAccuracyHigh) -
          this.accuracyXScale(this.curAccuracyLow)
      )
      .attr('height', histHeight);

    upperArea.attr('clip-path', 'url(#accuracy-density-clip)');

    return accuracySVG;
  }

  /**
   * Initialize the slider.
   */
  #initSlider() {
    // Move two range thumbs to the left and right ends
    this.#moveThumb(LEFT_THUMB_ID, this.curAccuracyLow);
    this.#moveThumb(RIGHT_THUMB_ID, this.curAccuracyHigh);

    // Register event listeners
    this.accuracyRow
      .select(`#${LEFT_THUMB_ID}`)
      .on('mousedown', e => this.#mouseDownHandler(e as MouseEvent));
    this.accuracyRow
      .select(`#${RIGHT_THUMB_ID}`)
      .on('mousedown', e => this.#mouseDownHandler(e as MouseEvent));

    this.#syncRangeTrack();
  }

  /**
   * Move the specified thumb to the given value on the slider.
   * @param{string} thumbID The ID of the thumb element.
   * @param{number} value The target value to move the thumb to.
   */
  #moveThumb(thumbID: string, value: number) {
    // Make sure we are only moving within the range of the state.feature value
    value = Math.min(Math.max(value, this.accuracyLow), this.accuracyHigh);

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
    let xPos =
      ((value - this.accuracyLow) / (this.accuracyHigh - this.accuracyLow)) *
      trackWidth;

    // Need to offset the xPos based on the thumb type
    // Also register different values based on the thumb type
    switch (thumbID) {
      case 'slider-left-thumb':
        xPos -= THUMB_WIDTH;
        this.curAccuracyLow = value;
        // updateRangeAnnotation(component, state);
        // syncFeature(state);
        break;

      case 'slider-right-thumb':
        this.curAccuracyHigh = value;
        // updateRangeAnnotation(component, state);
        // syncFeature(state);
        break;

      default:
        console.warn('Unknown thumb type in moveThumb()');
        break;
    }

    // syncTooltips(component, state);
    thumb.style('left', `${xPos}px`);
    this.#syncRangeTrack();
    // state.stateUpdated(stateChangeKey);
  }

  /**
   * Handling the mousedown event for thumbs on the slider.
   * @param e Event
   */
  #mouseDownHandler(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const thumb = e.target as HTMLElement;
    if (thumb === null || !thumb.id.includes('thumb')) {
      return;
    }

    const track = thumb.parentNode as HTMLElement;
    const trackWidth = track.getBoundingClientRect().width;
    thumb.focus();

    const localHideAnnotation = () => {};

    // showAnnotation(component, state, 'range');
    // localHideAnnotation = () => hideAnnotation(component, state, 'range');

    const mouseMoveHandler = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const deltaX = e.pageX - track.getBoundingClientRect().x;
      const newValue =
        this.accuracyLow +
        ((this.accuracyHigh - this.accuracyLow) * deltaX) / trackWidth;

      this.#moveThumb(thumb.id, newValue);
    };

    const mouseUpHandler = () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      document.body.style.cursor = 'default';
      thumb.blur();
      localHideAnnotation();
    };

    // Listen to mouse move on the whole page (users can drag outside of the
    // thumb, track, or even TimberTrek!)
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    document.body.style.cursor = 'grabbing';
  }

  /**
   * Sync the background range track with the current min & max range
   */
  #syncRangeTrack() {
    const leftThumb = this.accuracyRow.select('#slider-left-thumb');
    const rightThumb = this.accuracyRow.select('#slider-right-thumb');

    const leftThumbLeft = parseFloat(leftThumb.style('left'));
    const rightThumbLeft = parseFloat(rightThumb.style('left'));
    const rangeWidth = rightThumbLeft - leftThumbLeft;

    this.accuracyRow
      .select('.track .range-track')
      .style('left', `${leftThumbLeft + THUMB_WIDTH}px`)
      .style('width', `${rangeWidth}px`);

    // Move the clip in the density plot
    if (this.densityClip !== null) {
      this.densityClip
        .attr('x', this.accuracyXScale(this.curAccuracyLow))
        .attr(
          'width',
          this.accuracyXScale(this.curAccuracyHigh) -
            this.accuracyXScale(this.curAccuracyLow)
        );
    }
  }
}
