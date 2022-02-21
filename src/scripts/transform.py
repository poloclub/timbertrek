import numpy as np
import re

from json import load, dump
from matplotlib import pyplot as plt


def transform_trie(trie):
    """Deep copy and transform the trie.

    Args:
        trie (dict): The original trie

    Returns:
        dict: A deep copy of the transformed trie.
    """

    # Hit the terminal node
    if 'objective' in trie:
        # Only keep one metric from the tree
        return {'acc': round(trie['objective'], 5)}

    sub_dict = {}
    for k in trie:
        sub_dict[k] = transform_trie(trie[k])

    return sub_dict


def get_flat_metrics(trie, metrics, metric_name='objective'):
    """Get a flat list of terminal nodes.

    Args:
        trie (dict): Original trie
        metrics (list): Existing metrics
        metric_name (str, optional): Termination key. Defaults to 'objective'.
    """

    if metric_name in trie:
        metrics.append(trie)
        return

    for k in trie:
        get_flat_metrics(trie[k], metrics, metric_name)


def get_tree_depths(trie, tree_depth=0, metric_name='objective'):
    """Get a flat list of terminal nodes.

    Args:
        trie (dict): Original trie
        tree_depth (int, optional): Defaults to 0.
        metric_name (str, optional): Termination key. Defaults to 'objective'.

    Returns:
        list: a list of tree depths
    """

    if metric_name in trie:
        return [tree_depth]

    tree_depths = []

    for k in trie:
        tree_depths.extend(
            get_tree_depths(
                trie[k],
                tree_depth=tree_depth + 1,
                metric_name=metric_name
            )
        )

    return tree_depths


def get_hierarchy_dict(trie, metric='objective'):
    """Get the hierarchy dictionary form the original trie.

    Args:
        trie (dict): Original trie
        metric (str): Termination key. Also keep this value in the hierarchy
            dict.

    Returns:
        dict: Transformed trie in a strict hierarchy structure
    """

    value_map = {
        '-2': 1,
        '-1': -1
    }

    def get_sub_trie(subtrie, feature, direction):

        # Hit the terminal node
        if metric in subtrie:
            return {
                # Leaf node
                'f': '_',
                'd': direction,
                's': round(subtrie[metric], 5)
            }

        sub_dict = {
            'f': feature,
            'c': []
        }

        for k in subtrie:
            cur_name = k.split(' ')

            # Aggregate the direction based on k
            # -1: negative, 0: split, 1: positive
            new_direction = [d for d in direction]
            temp_feature_list = []

            # There are two cases here: length 2: split one, length 4: split two
            for i in range(len(cur_name)):
                if cur_name[i] in value_map:
                    new_direction.append(value_map[cur_name[i]])
                else:
                    new_direction.append(0)
                    # Current string encodes a feature id
                    temp_feature_list.append(cur_name[i])

            # Convert the feature list to a flat string
            new_feature = ' '.join(temp_feature_list)

            sub_dict['c'].append(get_sub_trie(
                subtrie[k], new_feature, new_direction))

        # Here the feature name discards split position, so we need to combine
        # their leaves into the same 'c' list
        new_sub_dict = {
            'f': feature,
            'c': []
        }

        for k in sub_dict['c']:
            is_duplicate = False
            for p in new_sub_dict['c']:
                if k['f'] == p['f']:
                    p['c'].extend(k['c'])
                    is_duplicate = True
                    break

            if not is_duplicate:
                new_sub_dict['c'].append(k)

        return new_sub_dict

    subtrie = {
        'f': 'root',
        'c': []
    }
    direction = []

    for k in trie:
        # For the first level, the key only contains the feature id
        subtrie['c'].append(get_sub_trie(trie[k], k, direction))

    return subtrie


def get_feature_map(feature_header, feature_description_map):
    """Generate a feature map that maps the feature id number to their feature
    definition. It also transform the feature name into a more readable format.

    Args:
        feature_header (list): _description_
        feature_description_map (dict): Dictionary map feature name to {
            'info': a readable short description
            'type': a string from ['is', 'count', 'yes']
        }

    Returns:
        dict: A feature map
    """

    feature_map = {}

    for (i, item) in enumerate(feature_header):
        feature_name = re.sub(r'(.*):.*', r'\1', item)
        feature_value = re.sub(r'.*:(.*)', r'\1', item)

        # Translate the feature name into a more readable format
        feature_type = feature_description_map[feature_name]['type']
        feature_name = feature_description_map[feature_name]['info']

        if feature_type == 'is':
            feature_value = 'is ' + feature_value
            feature_map[i] = [feature_name, feature_value]
        elif feature_type == 'count':
            feature_value = re.sub(r'([>=<])(.*)', r'\1\2', feature_value)
            feature_map[i] = [feature_name, feature_value]
        elif feature_type == 'yes':
            feature_value = ''
            feature_map[i] = [feature_name, feature_value]

    return feature_map
