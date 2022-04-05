import type { Writable } from 'svelte/store';
import { tick } from 'svelte';
import d3 from '../../utils/d3-import';
import { round } from '../../utils/utils';
import { config } from '../../config';
import type { SearchStoreValue } from '../../stores';
import { getSearchStoreDefaultValue } from '../../stores';
import type { HierarchyJSON, Point, TreeNode } from '../TimberTypes';

const formatter = d3.format(',.3~f');
const LEFT_THUMB_ID = 'slider-left-thumb';
const RIGHT_THUMB_ID = 'slider-right-thumb';
const PANEL_WIDTH = 268;
const PANEL_H_GAP = 16;
const THUMB_WIDTH = 8;
const TICK_HEIGHTS = {
  default: 6,
  original: 6 * 1.8
};

/**
 * Class to handle events in the toolbar
 */
export class SearchPanel {
  component: HTMLElement;
  accuracyRow: d3.Selection<d3.BaseType, unknown, null, undefined>;
  accuracySVG: d3.Selection<d3.BaseType, unknown, null, undefined> | null =
    null;

  heightRow: d3.Selection<d3.BaseType, unknown, null, undefined>;
  heightSVG: d3.Selection<d3.BaseType, unknown, null, undefined> | null = null;

  data: HierarchyJSON;
  treeMapMap: Map<number, [TreeNode, number, number]>;
  accuracyDensities: Point[];
  heightDensities: Point[];

  accuracyXScale: d3.ScaleLinear<number, number, never>;
  accuracyYScale: d3.ScaleLinear<number, number, never>;
  densityClip: d3.Selection<SVGRectElement, unknown, null, undefined> | null;

  heightXScale: d3.ScaleBand<number>;
  heightYScale: d3.ScaleLinear<number, number, never>;

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
    this.heightRow = d3.select(component).select('.height-row');

    // Initialize the accuracy row (will be updated in processData())
    this.curAccuracyLow = 0;
    this.curAccuracyHigh = 1;
    this.accuracyLow = 0;
    this.accuracyHigh = 1;

    // Process the input data
    this.data = data;

    // Convert treeMap into a real Map
    this.treeMapMap = new Map<number, [TreeNode, number, number]>();
    Object.keys(data.treeMap).forEach(k => {
      this.treeMapMap.set(+k, data.treeMap[+k] as [TreeNode, number, number]);
    });

    const result = this.#processData();
    this.accuracyDensities = result.accuracyDensities;
    this.heightDensities = result.heightDensities;

    // Put placeholder in the scales
    this.accuracyXScale = d3.scaleLinear();
    this.accuracyYScale = d3.scaleLinear();
    this.densityClip = null;

    // Initialize the accuracy svg
    this.accuracySVG = this.#initAccuracySVG();
    this.#initSlider();

    // Put placeholder in the scales
    this.heightXScale = d3.scaleBand<number>();
    this.heightYScale = d3.scaleLinear();

    // Initialize the height svg
    this.heightSVG = this.#initHeightSVG();
    this.#initHeightCheckboxes();

    // Initialize the depth rows
    this.#initDepthRows();
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
    this.curAccuracyLow = accuracyDensities[0].x;
    this.curAccuracyHigh = accuracyDensities.slice(-1)[0].x;
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

    // (3) Identify features used at each depth for each tree
    const treeDepthFeaturesMap = new Map<number, Map<number, Set<number>>>();
    for (const [treeID, v] of this.treeMapMap) {
      const curDepthFeatures = new Map<number, Set<number>>();
      const curTree = d3.hierarchy(v[0], d => d.c);
      curTree.each(d => {
        if (d.data.f[0] !== '+' && d.data.f[0] !== '-') {
          if (!curDepthFeatures.has(d.depth + 1)) {
            curDepthFeatures.set(d.depth + 1, new Set([parseInt(d.data.f[0])]));
          } else {
            curDepthFeatures.get(d.depth + 1)!.add(parseInt(d.data.f[0]));
          }
        }
      });
      treeDepthFeaturesMap.set(treeID, curDepthFeatures);
    }

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

    heightDensities.sort((a, b) => a.x - b.x);

    // Store the tree height map in the store
    this.searchStoreValue.treeHeightMap = treeHeightMap;
    this.searchStoreValue.treeDepthFeaturesMap = treeDepthFeaturesMap;
    this.searchStore.set(this.searchStoreValue);

    return { accuracyDensities, heightDensities };
  }

  /**
   * Draw the SVG for the accuracy slider
   */
  #initAccuracySVG() {
    const width = PANEL_WIDTH - PANEL_H_GAP * 2;
    const tickHeight = 30;
    const histHeight = 55;
    const vGap = 15;
    const height = histHeight + vGap + tickHeight;

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

    // Initialize the ticks below the slider
    const tickGroup = accuracySVG
      .append('g')
      .attr('class', 'tick-group')
      .attr('transform', `translate(${THUMB_WIDTH}, ${histHeight + vGap})`);

    const tickBackGroup = tickGroup
      .append('g')
      .attr('class', 'tick-back-group');

    const tickTopGroup = tickGroup.append('g').attr('class', 'tick-top-group');

    const tickCount = 30;
    const tickArray = [];
    const accuracyGap =
      this.accuracyDensities[1].x - this.accuracyDensities[0].x;
    const trueAccuracyLow = this.accuracyLow + accuracyGap;
    const trueAccuracyHigh = this.accuracyHigh;
    for (let i = 0; i <= tickCount; i++) {
      tickArray.push(
        trueAccuracyLow + ((trueAccuracyHigh - trueAccuracyLow) * i) / tickCount
      );
    }

    tickTopGroup
      .selectAll('g.tick')
      .data(tickArray)
      .join('g')
      .attr('class', 'tick')
      .attr('transform', d => `translate(${this.accuracyXScale(d)}, 0)`)
      .append('line')
      .attr('y2', TICK_HEIGHTS.default);

    // Initialize the style
    this.#syncTicks();

    // Add labels for the min and max value
    tickBackGroup
      .append('text')
      .attr('class', 'label-min-value')
      .attr('x', -4)
      .attr('y', TICK_HEIGHTS.default * 2.2)
      .style('text-anchor', 'start')
      .style('dominant-baseline', 'hanging')
      .style('font-size', '0.9em')
      .style('fill', config.colors['gray-500'])
      .text(formatter(this.accuracyLow));

    tickBackGroup
      .append('text')
      .attr('class', 'label-max-value')
      .attr('x', totalWidth + 4)
      .attr('y', TICK_HEIGHTS.default * 2.2)
      .style('text-anchor', 'end')
      .style('dominant-baseline', 'hanging')
      .style('font-size', '0.9em')
      .style('fill', config.colors['gray-500'])
      .text(formatter(this.accuracyHigh));

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
    value = round(value, 3);

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
        this.searchStoreValue.curAccuracyLow = this.curAccuracyLow;
        break;

      case 'slider-right-thumb':
        this.curAccuracyHigh = value;
        this.searchStoreValue.curAccuracyHigh = this.curAccuracyHigh;
        break;

      default:
        console.warn('Unknown thumb type in moveThumb()');
        break;
    }

    this.searchStore.set(this.searchStoreValue);

    // syncTooltips(component, state);
    thumb.style('left', `${xPos}px`);
    this.#syncRangeTrack();
    this.#syncTicks();
    this.searchUpdated();
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

  /**
   * Sync up ticks with the current min & max range
   */
  #syncTicks() {
    if (this.accuracySVG === null) return;

    const topTicks = this.accuracySVG
      .select('g.tick-top-group')
      .selectAll('g.tick') as d3.Selection<
      SVGGElement,
      number,
      SVGGElement,
      unknown
    >;

    topTicks
      .filter(d => d >= this.curAccuracyLow && d <= this.curAccuracyHigh)
      .classed('out-range', false);

    topTicks
      .filter(d => d < this.curAccuracyLow || d > this.curAccuracyHigh)
      .classed('out-range', true);

    if (this.curAccuracyHigh === this.curAccuracyLow) {
      this.accuracySVG
        .select('g.tick-top-group')
        .selectAll('g.tick')
        .classed('out-range', true);
    }
  }

  /**
   * Reset the filter for the accuracy row
   */
  refreshAccuracy = () => {
    this.#moveThumb('slider-left-thumb', this.accuracyLow);
    this.#moveThumb('slider-right-thumb', this.accuracyHigh);
  };

  /**
   * Draw the SVG for the height row
   */
  #initHeightSVG() {
    const width = PANEL_WIDTH - PANEL_H_GAP * 2;
    const tickHeight = 0;
    const histHeight = 55;
    const vGap = 0;
    const height = histHeight + vGap + tickHeight;

    const heightSVG = this.heightRow
      .select('.svg-height')
      .attr('width', width)
      .attr('height', height);

    // Offset the range thumb to align with the track
    const padding = {
      top: 0,
      left: THUMB_WIDTH,
      right: THUMB_WIDTH,
      bottom: 0,
      histTop: 20
    };

    const totalWidth = width - padding.left - padding.right;

    // Draw a bounding box for this density plot
    heightSVG
      .append('g')
      .attr('class', 'border-group')
      .attr('transform', `translate(${0}, ${padding.top})`)
      .append('rect')
      .attr('width', width)
      .attr('height', histHeight - padding.top)
      .style('fill', 'none')
      .style('stroke', config.colors['gray-300']);

    // Add density plot
    const histGroup = heightSVG
      .append('g')
      .attr('class', 'hist-group')
      .attr('transform', `translate(${THUMB_WIDTH}, ${padding.top})`);

    // Create the axis scales
    this.heightXScale = d3
      .scaleBand<number>()
      .domain(this.heightDensities.map(d => d.x))
      .range([0, totalWidth])
      .paddingInner(0.35);

    const maxDensity = Math.max(...this.heightDensities.map(d => d.y));
    this.heightYScale = d3
      .scaleLinear()
      .domain([0, maxDensity])
      .range([histHeight - padding.bottom - padding.top, padding.histTop]);

    // Draw the area bars
    const barGroups = histGroup
      .selectAll('g.bar')
      .data(this.heightDensities)
      .join('g')
      .attr('class', 'bar selected')
      .attr('id', d => `bar-${d.x}`)
      .attr('transform', d => `translate(${this.heightXScale(d.x)}, ${0})`);

    barGroups
      .append('rect')
      .attr('x', 0)
      .attr('y', d => this.heightYScale(d.y))
      .attr('width', this.heightXScale.bandwidth())
      .attr('height', d => this.heightYScale(0) - this.heightYScale(d.y));

    // Add text on top of the bar
    const texts = barGroups
      .append('text')
      .attr('x', this.heightXScale.bandwidth() / 2)
      .attr('y', d => this.heightYScale(d.y) - 5);

    texts.append('tspan').text(d => `(${d3.format('.0%')(d.y)})`);

    barGroups
      .append('title')
      .text(d => `Height: ${d.x} (${d3.format('.4%')(d.y)})`);

    // Also update the search store
    this.searchStoreValue.curHeightRange = new Set<number>(
      this.heightXScale.domain()
    );
    this.searchStore.set(this.searchStoreValue);

    return heightSVG;
  }

  /**
   * Initialize check boxes under the height svg
   */
  #initHeightCheckboxes() {
    const checkboxes = d3.select(this.component).select('.height-checkboxes');

    this.heightDensities.forEach(d => {
      checkboxes
        .append('label')
        .attr('class', 'height-checkbox-label')
        .attr('for', `height-checkbox-${d.x}`)
        .text(d.x)
        .style(
          'left',
          `${
            this.heightXScale(d.x)! + this.heightXScale.bandwidth() / 2 + 13
          }px`
        );

      // Init checkbox
      const curCheckbox = checkboxes
        .append('input')
        .attr('type', 'checkbox')
        .property('checked', true)
        .attr('class', 'height-checkbox')
        .attr('id', `height-checkbox-${d.x}`)
        .style(
          'left',
          `${this.heightXScale(d.x)! + this.heightXScale.bandwidth() / 2 - 4}px`
        );

      // Bind event listeners
      curCheckbox.on('change', e =>
        this.#heightCheckboxChanged(e as Event, d.x)
      );
    });
  }

  /**
   * Event handler for height check boxes
   */
  #heightCheckboxChanged(e: Event, x: number) {
    e.preventDefault();

    // Change bar color
    const checkbox = e.target as HTMLInputElement;
    this.heightSVG?.select(`#bar-${x}`).classed('selected', checkbox.checked);

    // Trigger filtering in sunburst
    if (checkbox.checked) {
      this.searchStoreValue.curHeightRange.add(x);
    } else {
      this.searchStoreValue.curHeightRange.delete(x);
    }
    this.searchStore.set(this.searchStoreValue);
  }

  /**
   * Reset the filter for the height row
   */
  refreshHeight = () => {
    console.log('refreshing height');

    for (const h of this.heightXScale.domain()) {
      const curCheckbox = d3
        .select(this.component)
        .select(`#height-checkbox-${h}`);

      // Check unchecked checkboxes
      if (!curCheckbox.property('checked')) {
        this.heightSVG?.select(`#bar-${h}`).classed('selected', true);
        curCheckbox.property('checked', true);
        this.searchStoreValue.curHeightRange.add(h);
      }
    }

    this.searchStore.set(this.searchStoreValue);
  };

  /**
   * Initialize depth rows
   */
  async #initDepthRows() {
    await tick();

    for (const depth of this.searchStoreValue.curDepthFeatures.keys()) {
      this.#initDepthCheckboxes(depth);
    }
  }

  /**
   * Event handler for height check boxes
   */
  #depthCheckboxChanged(e: Event, depth: number, f: number) {
    e.preventDefault();

    const checkbox = e.target as HTMLInputElement;

    // Trigger filtering in sunburst
    const curFeatureIDs = this.searchStoreValue.curDepthFeatures.get(depth);
    if (curFeatureIDs === undefined) {
      console.error(`Unknown depth ${depth}`);
      return;
    }

    if (checkbox.checked) {
      curFeatureIDs.add(f);
    } else {
      curFeatureIDs.delete(f);
    }

    this.searchStoreValue.curDepthFeatures.set(depth, curFeatureIDs);
    this.searchStore.set(this.searchStoreValue);
  }

  /**
   * Initialize check boxes for one depth row
   */
  #initDepthCheckboxes(depth: number) {
    const checkboxes = d3
      .select(this.component)
      .select(`#level-row-${depth} .level-content`);

    this.searchStoreValue.featureOrder.forEach(f => {
      const label = checkboxes
        .append('label')
        .attr('class', 'depth-checkbox-label')
        .attr('id', `depth-check-box-label-${depth}-${f}`);

      // Init checkbox
      const checkbox = label
        .append('input')
        .attr('type', 'checkbox')
        .property('checked', true)
        .attr('class', 'depth-checkbox');

      // Add feature label
      let featureInfo = this.searchStoreValue.featureMap.get(f);
      if (featureInfo === undefined) {
        featureInfo = ['', '', ''];
        console.error(`Cannot find feature ${f} in featureMap`);
      }

      label.append('span').text(`${featureInfo[2]} ${featureInfo[1]}`);
      label.attr(
        'title',
        `Show/hide trees using ${featureInfo[0]} ${featureInfo[1]} at depth ${depth}`
      );

      // Change checkbox color
      let boxColor = 'initial';
      const featureColor = this.searchStoreValue.getFeatureColor?.(String(f));
      if (featureColor !== undefined) {
        boxColor = featureColor;
      }
      checkbox.style('accent-color', boxColor);

      // Bind event listeners
      checkbox.on('change', e =>
        this.#depthCheckboxChanged(e as Event, depth, f)
      );
    });
  }

  /**
   * Reset the filter for the depth row
   */
  refreshDepth = (depth: number) => {
    console.log('refreshing depth', depth);
  };
}
