import d3 from './d3-import';
import type { Icon } from './my-types';
// import type { SvelteComponent } from 'svelte';

/**
 * Round a number to a given decimal.
 * @param {number} num Number to round
 * @param {number} decimal Decimal place
 * @returns number
 */
export const round = (num: number, decimal: number) => {
  return Math.round((num + Number.EPSILON) * 10 ** decimal) / 10 ** decimal;
};

/**
 * Get a random number between [min, max], inclusive
 * @param {number} min Min value
 * @param {number} max Max value
 * @returns number
 */
export const random = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

/**
 * Pre-process the svg string to replace fill, stroke, color settings
 * @param {string} svgString
 * @param {string[]} resetColors A list of colors to reset to currentcolor
 * @returns {string}
 */
export const preProcessSVG = (svgString: string, resetColors = []) => {
  let newString = svgString
    .replaceAll('black', 'currentcolor')
    .replaceAll('fill:none', 'fill:currentcolor')
    .replaceAll('stroke:none', 'fill:currentcolor');

  resetColors.forEach((c) => {
    newString = newString.replaceAll(c, 'currentcolor');
  });

  return newString;
};

/**
 * Dynamically bind SVG files as inline SVG strings in this component
 * @param {HTMLElement} component Current component
 * @param {Icon[]} iconList A list of icon mappings (class => icon string)
 */
export const bindInlineSVG = (component: HTMLElement, iconList: Icon[]) => {
  iconList.forEach((d) => {
    d3.select(component)
      .selectAll(`.svg-icon.${d.class}`)
      .each((_, i, g) => {
        const ele = d3.select(g[i]);
        let html = ele.html();
        html = html.concat(' ', preProcessSVG(d.svg));
        ele.html(html);
      });
  });
};

/**
 * Download a JSON file
 * @param {any} object
 * @param {HTMLElement | null} [dlAnchorElem]
 * @param {string} [fileName]
 */
export const downloadJSON = (
  object: object,
  dlAnchorElem: HTMLElement | null = null,
  fileName = 'download.json'
) => {
  const dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(object));

  // Create dlAnchor if it is not given
  let myDlAnchorElem = dlAnchorElem;
  let needToRemoveAnchor = false;

  if (dlAnchorElem === null) {
    myDlAnchorElem = document.createElement('a');
    myDlAnchorElem.style.display = 'none';
    needToRemoveAnchor = true;
  }

  myDlAnchorElem?.setAttribute('href', dataStr);
  myDlAnchorElem?.setAttribute('download', `${fileName}`);
  myDlAnchorElem?.click();

  if (needToRemoveAnchor) {
    myDlAnchorElem?.remove();
  }
};

/**
 * Download a text file
 * @param {string} textString
 * @param {HTMLElement | null} [dlAnchorElem]
 * @param {string} [fileName]
 */
export const downloadText = (
  textString: string,
  dlAnchorElem: HTMLElement | null,
  fileName = 'download.json'
) => {
  const dataStr =
    'data:text/plain;charset=utf-8,' + encodeURIComponent(textString);

  // Create dlAnchor if it is not given
  let myDlAnchorElem = dlAnchorElem;
  let needToRemoveAnchor = false;

  if (dlAnchorElem === null) {
    myDlAnchorElem = document.createElement('a');
    myDlAnchorElem.style.display = 'none';
    needToRemoveAnchor = true;
  }

  myDlAnchorElem?.setAttribute('href', dataStr);
  myDlAnchorElem?.setAttribute('download', `${fileName}`);
  myDlAnchorElem?.click();

  if (needToRemoveAnchor) {
    myDlAnchorElem?.remove();
  }
};
