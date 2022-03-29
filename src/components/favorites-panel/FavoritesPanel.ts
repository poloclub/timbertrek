import type { FavoritesStoreValue } from '../../stores';
import type { FavPinnedTree } from '../TimberTypes';
import { downloadJSON } from '../../utils/utils';

export const downloadClicked = (
  e: MouseEvent,
  favoritesStoreValue: FavoritesStoreValue
) => {
  e.stopPropagation();
  e.preventDefault();

  // Clean up the tree object
  const favTrees = JSON.parse(
    JSON.stringify(favoritesStoreValue.favTrees)
  ) as FavPinnedTree[];

  const outputTrees: object[] = [];

  favTrees.forEach(d => {
    delete d.getFeatureColor;
    delete d.pinnedTreeUpdated;
    delete d.pinnedTree.isPinned;
    delete d.pinnedTree.isFav;
    delete d.pinnedTree.jiggle;
    delete d.pinnedTree.x;
    delete d.pinnedTree.y;
    delete d.pinnedTree.startPos;

    outputTrees.push(d.pinnedTree);
  });

  downloadJSON(outputTrees, null, 'favorite-trees.json');
};
