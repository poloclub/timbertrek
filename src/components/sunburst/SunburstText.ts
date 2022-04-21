/**
 * Implement Sunburst methods regarding text
 */

import type { Sunburst } from './Sunburst';
import { TextArcMode } from '../TimberTypes';
import type { HierarchyNode } from '../TimberTypes';
import d3 from '../../utils/d3-import';
import { getLatoTextWidth } from '../../utils/text-width';
import { getContrastRatio } from '../../utils/utils';

const HALF_PI = Math.PI / 2;
const MIN_TEXT_HEIGHT = 20;

/**
 * Initialize text arc
 * @param this Sunburst
 * @param d Hierarchy node
 * @param textArcMode Text layout
 * @returns arc generator
 */
export function textArc(
  this: Sunburst,
  d: HierarchyNode,
  textArcMode: TextArcMode
) {
  switch (textArcMode) {
    case TextArcMode.SectorArc: {
      const angles = [this.xScale(d.x0) - HALF_PI, this.xScale(d.x1) - HALF_PI];
      const radius = Math.max(0, (this.yScale(d.y0) + this.yScale(d.y1)) / 2);
      const midAngle = (angles[0] + angles[1]) / 2;

      // Flip the text arc when the angle is from 0 to PI
      const needToInvert = midAngle > 0 && midAngle < Math.PI;
      if (needToInvert) {
        angles.reverse();
      }

      // Path arc: rx, ry, radius, start angle, end angle, direction (true if
      // anti-clockwise, false if clockwise)
      const curPath = d3.path();
      curPath.arc(0, 0, radius, angles[0], angles[1], needToInvert);
      return curPath.toString();
    }

    case TextArcMode.MidLine: {
      // To draw a straight line, we need to convert the polar coordinate to
      // Cartesian
      const angles = [this.xScale(d.x0) - HALF_PI, this.xScale(d.x1) - HALF_PI];
      const midAngle = (angles[0] + angles[1]) / 2;

      const startRadius = this.yScale(d.y0);
      const endRadius = this.yScale(d.y1);

      const xStart = startRadius * Math.cos(midAngle);
      const yStart = startRadius * Math.sin(midAngle);

      const xEnd = endRadius * Math.cos(midAngle);
      const yEnd = endRadius * Math.sin(midAngle);

      // Different drawing order on the left/right half circles
      const curPath = d3.path();
      if (midAngle >= Math.PI / 2 && midAngle <= (Math.PI * 3) / 2) {
        curPath.moveTo(xEnd, yEnd);
        curPath.lineTo(xStart, yStart);
      } else {
        curPath.moveTo(xStart, yStart);
        curPath.lineTo(xEnd, yEnd);
      }
      return curPath.toString();
    }
  }
}

/**
 * Approximate if the text fits in the given arc
 */
export function doesTextFitArc(
  this: Sunburst,
  d: HierarchyNode,
  fontSize = 16,
  text: string | null = null,
  padding = 0
) {
  if (text == null) {
    text = this.getFeatureInfo(d.data.f).nameValue;
  }

  const textWidth = getLatoTextWidth(text, fontSize);

  // Compute the arc length
  const angle = this.xScale(d.x1) - this.xScale(d.x0);
  const radius = Math.max(0, (this.yScale(d.y0) + this.yScale(d.y1)) / 2);
  const arcLength = angle * radius;

  return textWidth <= arcLength - padding;
}

const getTextColor = (
  getFeatureColor: (f: string) => string,
  d: HierarchyNode
): string => {
  const background = d3.color(getFeatureColor(d.data.f));

  let foreground = 'currentcolor';
  if (background !== null) {
    // Check contract ratio if we use white color
    const whiteRGB = [252, 252, 252];
    const blackRGB = [74, 74, 74];
    const rgb = d3.color(background).rgb();
    const backgroundRGB = [rgb.r, rgb.g, rgb.b];

    if (
      getContrastRatio(whiteRGB, backgroundRGB) <
      getContrastRatio(blackRGB, backgroundRGB)
    ) {
      foreground = 'hsla(0, 0%, 99%, 1)';
    }
  }

  return foreground;
};

/**
 * Draw text on center circles
 * @param this Sunburst object
 */
export function drawCenterText(this: Sunburst) {
  const midGroup = this.svg.select('g.mid-circle-group');
  const circleGroups = midGroup.selectAll('g.mid-circle') as d3.Selection<
    d3.BaseType | SVGGElement,
    HierarchyNode,
    SVGGElement,
    unknown
  >;

  if (circleGroups.size() === 0) {
    return;
  }

  // Step 1: Compute the max radius that the text can use
  const ringData = this.svg
    .select(`g.arc-${this.sunburstStoreValue.depthLow}`)
    .datum() as HierarchyNode;
  const ringRadius = this.yScale(ringData.y1) - this.yScale(ringData.y0);
  const smallestR = ringRadius / circleGroups.size();
  const availableAngleRange = Math.PI * 1.2;

  /**
   * Step 2: Decide which text to use and draw the text
   *    long name + value, if not => short name + value
   * We draw the text in the center of the circle for the most inner circle, and
   * draw texts on the upper ring for other circles.
   */

  const texts = circleGroups
    .append('text')
    .attr('class', 'feature-name')
    // Choose the text color based on the background color
    .style('fill', d => getTextColor(this.getFeatureColor, d));

  // Adaptively choose the font size (linear to depth gap)
  const curFontSize = this.textFontScale(
    this.sunburstStoreValue.depthHigh - this.sunburstStoreValue.depthLow
  );

  /**
   * Shorten the text if necessary
   * 1. Try long name + condition
   * 2. Try short name + condition
   *
   * To shorten the text:
   *   (1) Use short name + condition
   *   (2) Replace the end portion with ...
   * @param d HierarchyNode
   * @param arcLength Max available width
   * @returns Text
   */
  const getFitText = (d: HierarchyNode, arcLength: number) => {
    const featureInfo = this.getFeatureInfo(d.data.f);
    let text = featureInfo.nameValue;

    // Width check (first check)
    let textWidth = getLatoTextWidth(text, 16 * curFontSize);
    if (textWidth > arcLength) {
      // If the width is larger than the sector radius, then we try to use
      // its short name
      text = featureInfo.shortValue;

      // Check if the new width is okay, if not, replace the last portion
      // of the string with ...
      textWidth = getLatoTextWidth(text, 16 * curFontSize);
      while (textWidth > arcLength) {
        text = text.replace('...', '');
        text = text.slice(0, text.length - 1);
        text = `${text}...`;
        textWidth = getLatoTextWidth(text, 16 * curFontSize);
      }
    }
    return text;
  };

  // If it is the center circle, draw the text in the middle
  texts
    .filter(d => d.depth === 1)
    .style('font-size', `${curFontSize}rem`)
    .text(d => getFitText(d, smallestR * 2 - 10));

  // If it is not the center circle, draw the text along an arc path
  texts
    .filter(d => d.depth !== 1)
    .style('font-size', `${curFontSize}rem`)
    .append('textPath')
    .attr('startOffset', '50%')
    .attr('xlink:href', d => `#mid-circle-text-arc-${d.depth}`)
    .text(d =>
      getFitText(d, smallestR * (d.depth - 0.5) * availableAngleRange)
    );
}

/**
 * Draw feature names on the inner circles and the most inner ring
 */
export function drawText(this: Sunburst) {
  // Case 1: Draw text on the arc sectors
  const arcGroup = this.svg.select('g.arc-group');
  const textGroup = this.svg.select('g.text-group');

  // We only draw text on the most inner ring (not circle)
  // Check of the user has clicked a sector
  let innerArcs = arcGroup.selectAll(
    `g.arc-${
      this.xScale.domain()[0] === 0 && this.xScale.domain()[1] === 1
        ? this.sunburstStoreValue.depthLow
        : this.sunburstStoreValue.depthLow + 1
    }`
  ) as d3.Selection<
    d3.BaseType | SVGGElement,
    HierarchyNode,
    SVGGElement,
    unknown
  >;

  // Need to sort the selections based on their hierarchy because their order
  // is messed up in mouseover and mouseleave
  innerArcs = innerArcs.sort((a, b) => a.x0 - b.x0);

  // We only draw text on the visible rings
  innerArcs = innerArcs.filter(
    d =>
      d.x0 >= this.xScale.domain()[0] &&
      d.x1 <= this.xScale.domain()[1] &&
      d.data['f'] !== '_'
  );

  const textGroups = textGroup
    .selectAll('g.text-group')
    .data(innerArcs.data())
    .join('g')
    .attr('class', 'text-group');

  textGroups
    .append('path')
    .attr('class', 'text-arc')
    .attr('id', (d, i) => `text-arc-${i}`)
    .attr('d', d => this.textArc(d, TextArcMode.SectorArc));

  textGroups
    .append('path')
    .attr('class', 'text-line')
    .attr('id', (d, i) => `text-line-${i}`)
    .attr('d', d => this.textArc(d, TextArcMode.MidLine));

  const texts = textGroups.append('text').attr('class', 'feature-name');

  // Choose the text color based on the background color
  texts.style('fill', d => getTextColor(this.getFeatureColor, d));

  const drawnFeatureNames = new Set<string>();
  const textLayoutMap = new Map<number, TextArcMode>();

  // Compute the sector radius adjusted by a padding constant
  if (texts.size() === 0) {
    return;
  }

  const sectorRadius =
    this.yScale(texts.datum().y1) - this.yScale(texts.datum().y0) - 15;

  // Adaptively choose the font size (linear to depth gap)
  const curFontSize = this.textFontScale(
    this.sunburstStoreValue.depthHigh - this.sunburstStoreValue.depthLow
  );

  // Add text path
  const textPaths = texts
    .style('font-size', `${curFontSize}rem`)
    .append('textPath')
    .attr('startOffset', '50%')
    .attr('xlink:href', (d, i) => {
      const featureInfo = this.getFeatureInfo(d.data.f);
      let text = featureInfo.nameValue;
      let featureNameExists = false;

      // If the feature is drawn once, we just draw the condition
      if (drawnFeatureNames.has(featureInfo.name)) {
        text = featureInfo.value;
        featureNameExists = true;
      }
      drawnFeatureNames.add(featureInfo.name);

      /**
       * Determine the text layout.
       * (1) firs time & we have enough space for full line => line
       * (2) first time & we have enough space for arc => arc path
       * (3) first time & not enough space => line
       * (4) others => line
       */
      const textWidth = getLatoTextWidth(text, 16 * curFontSize);
      if (textWidth < sectorRadius) {
        textLayoutMap.set(i, TextArcMode.MidLine);
        return `#text-line-${i}`;
      } else if (
        !featureNameExists &&
        this.doesTextFitArc(d, 16 * curFontSize, text, 10)
      ) {
        textLayoutMap.set(i, TextArcMode.SectorArc);
        return `#text-arc-${i}`;
      } else {
        textLayoutMap.set(i, TextArcMode.MidLine);
        return `#text-line-${i}`;
      }
    });

  // Add text
  drawnFeatureNames.clear();
  textPaths.text((d, i) => {
    const featureInfo = this.getFeatureInfo(d.data.f);
    let text = featureInfo.nameValue;
    let onlyShowValue = false;

    // If the feature is drawn once, we just draw the condition
    if (drawnFeatureNames.has(featureInfo.name)) {
      text = featureInfo.value;
      onlyShowValue = true;
    }

    /**
     * Shorten the text if necessary (we only consider the middle line case)
     * If text height > sector outer arc length: show nothing
     * If text width > sector width: shorten the text
     * To shorten the text:
     *   (1) Use short name + condition
     *   (2) Replace the end portion with ...
     */
    if (textLayoutMap.get(i) === TextArcMode.MidLine) {
      // Height check
      const innerArcLength =
        this.yScale(d.y1) * (this.xScale(d.x1) - this.xScale(d.x0));
      if (innerArcLength < MIN_TEXT_HEIGHT) {
        return '';
      }

      // Width check (first check)
      let textWidth = getLatoTextWidth(text, 16 * curFontSize);
      if (textWidth > sectorRadius) {
        // If the width is larger than the sector radius, then we try to use
        // its short name
        if (!onlyShowValue) {
          text = featureInfo.shortValue;

          // Check if the new width is okay, if not, replace the last portion
          // of the string with ...
          textWidth = getLatoTextWidth(text, 16 * curFontSize);
          while (textWidth > sectorRadius) {
            text = text.replace('...', '');
            text = text.slice(0, text.length - 1);
            text = `${text}...`;
            textWidth = getLatoTextWidth(text, 16 * curFontSize);
          }
        }
      }
    }

    drawnFeatureNames.add(featureInfo.name);
    return text;
  });

  // Draw text on the secondary ring if the feature name is not drawn on
  // the first ring
  const undrawnFs = new Set<number>();

  Array.from(this.featureMap.entries()).forEach(v => {
    if (!drawnFeatureNames.has(v[1][0])) {
      undrawnFs.add(v[0]);
    }
  });

  this.drawSecondaryText(undrawnFs);
}

export function drawSecondaryText(this: Sunburst, undrawnFs: Set<number>) {
  const arcGroup = this.svg.select('g.arc-group');
  const textGroup = this.svg.select('g.text-group');

  let secondaryArcs = arcGroup.selectAll(
    `g.arc-${
      this.xScale.domain()[0] === 0 && this.xScale.domain()[1] === 1
        ? this.sunburstStoreValue.depthLow + 1
        : this.sunburstStoreValue.depthLow + 2
    }`
  ) as d3.Selection<
    d3.BaseType | SVGGElement,
    HierarchyNode,
    SVGGElement,
    unknown
  >;

  // We only draw text on the visible rings
  secondaryArcs = secondaryArcs.filter(
    d =>
      d.x0 >= this.xScale.domain()[0] &&
      d.x1 <= this.xScale.domain()[1] &&
      undrawnFs.has(+d.data['f'])
  );

  if (secondaryArcs.size() === 0) {
    return;
  }

  // Need to sort the selections based on their hierarchy because their order
  // is messed up in mouseover and mouseleave
  secondaryArcs = secondaryArcs.sort((a, b) => a.x0 - b.x0);

  const textGroups = textGroup
    .selectAll('g.s-text-group')
    .data(secondaryArcs.data())
    .join('g')
    .attr('class', 'text-group');

  textGroups
    .append('path')
    .attr('class', 'text-arc')
    .attr('id', (d, i) => `s-text-arc-${i}`)
    .attr('d', d => this.textArc(d, TextArcMode.SectorArc));

  textGroups
    .append('path')
    .attr('class', 'text-line')
    .attr('id', (d, i) => `s-text-line-${i}`)
    .attr('d', d => this.textArc(d, TextArcMode.MidLine));

  const secondaryTexts = textGroups
    .append('text')
    .attr('class', 'feature-name');

  const sectorRadius =
    this.yScale(secondaryTexts.datum().y1) -
    this.yScale(secondaryTexts.datum().y0) -
    15;

  // Adaptively choose the font size (linear to depth gap)
  const curFontSize = this.textFontScale(
    this.sunburstStoreValue.depthHigh - this.sunburstStoreValue.depthLow
  );

  // Choose the text color based on the background color
  secondaryTexts.style('fill', d => getTextColor(this.getFeatureColor, d));

  // Add text path
  const arcIndexes = new Set<number>([]);
  const secondaryTextPaths = secondaryTexts
    .style('font-size', `${curFontSize}rem`)
    .append('textPath')
    .attr('startOffset', '50%')
    .attr('xlink:href', (d, i) => {
      const featureInfo = this.getFeatureInfo(d.data.f);
      const text = featureInfo.nameValue;

      /**
       * Determine the text layout.
       * (1) firs time & we have enough space for full line => line
       * (2) first time & we have enough space for arc => arc path
       * (3) first time & not enough space => line
       * (4) others => line
       */
      const textWidth = getLatoTextWidth(text, 16 * curFontSize);
      if (textWidth < sectorRadius) {
        return `#s-text-line-${i}`;
      } else if (this.doesTextFitArc(d, 16 * curFontSize, text, 10)) {
        arcIndexes.add(i);
        return `#s-text-arc-${i}`;
      } else {
        return `#s-text-line-${i}`;
      }
    });

  // Only draw each text once
  const drawnTexts = new Set<string>();

  secondaryTextPaths.text((d, i) => {
    if (drawnTexts.has(d.data.f)) return '';

    const featureInfo = this.getFeatureInfo(d.data.f);
    let text = featureInfo.nameValue;

    /**
     * Shorten the text if necessary
     * If text height > sector outer arc length: show nothing
     * If text width > sector width: shorten the text
     * To shorten the text:
     *   (1) Use short name + condition
     *   (2) Replace the end portion with ...
     */

    // Height check
    const innerArcLength =
      this.yScale(d.y1) * (this.xScale(d.x1) - this.xScale(d.x0));
    if (innerArcLength < MIN_TEXT_HEIGHT) {
      return '';
    }

    // Width check (first check)
    if (!arcIndexes.has(i)) {
      let textWidth = getLatoTextWidth(text, 16 * curFontSize);
      if (textWidth > sectorRadius) {
        // If the width is larger than the sector radius, then we try to use
        // its short name
        text = featureInfo.shortValue;

        // Check if the new width is okay, if not, replace the last portion
        // of the string with ...
        textWidth = getLatoTextWidth(text, 16 * curFontSize);
        while (textWidth > sectorRadius) {
          text = text.replace('...', '');
          text = text.slice(0, text.length - 1);
          text = `${text}...`;
          textWidth = getLatoTextWidth(text, 16 * curFontSize);
        }
      }
    }

    drawnTexts.add(d.data.f);
    return text;
  });
}

/**
 * Remove all text
 */
export function removeText(this: Sunburst) {
  this.svg.select('.text-group').selectAll('*').remove();
  this.svg.selectAll('text.feature-name').remove();
}
