import numpy as np
import re

from collections import deque
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


def build_tree_map(trie, tree_map, tree_strings=[], objective='acc'):
    """
    Map each tree to a unique number

    Args:
        trie (dict): The original trie
        tree_map (dict): The dictionary that map tree id to a string
        tree_desc (string[]): a list of tree descriptions
        objective (string): name of the leaf node objective key
    """

    # Hit the terminal node
    if objective in trie:
        # Record this tree
        new_count = tree_map['count'] + 1
        tree_map['map'][new_count] = [tree_strings, trie[objective]]
        tree_map['count'] = new_count
        return

    for k in trie:
        new_tree_strings = [s for s in tree_strings]
        new_tree_strings.append(k)
        build_tree_map(trie[k], tree_map, new_tree_strings)

    return


def get_decision_rules(tree_strings):
    """Generate a set of decision rules used by a tree

    Args:
        tree_strings ([string]): Tree strings parsed form the trie

    Returns:
        set: A set of decision rules
    """
    working_queue = deque()

    # Each queue item is a list [feature_id, previous_feature_ids]
    working_queue.append([tree_strings[0], []])
    i = 1
    decision_rules = set()

    while len(working_queue) > 0:
        cur_feature, pre_features = working_queue.popleft()

        cur_string = tree_strings[i]
        cur_string_split = cur_string.split()

        if len(cur_string_split) == 2:
            # Case 1: there are two values
            cur_features = pre_features + [cur_feature]

            for s in cur_string_split:
                if s == '-1' or s == '-2':
                    # We hit a decision node, add this decision rule chain
                    decision_rules.add(
                        (tuple(cur_features), '+' if s == '-2' else '-'))
                else:
                    working_queue.append([s, cur_features])

        elif len(cur_string_split) == 4:
            # Case 2: there are four values: the first two correpond to the cur item
            # and the last two correpond to the next item in the queue
            cur_features = pre_features + [cur_feature]
            for s in cur_string_split[:2]:
                if s == '-1' or s == '-2':
                    decision_rules.add(tuple(cur_features))
                else:
                    working_queue.append([s, cur_features])

            # Load the next item in the queue
            cur_feature, pre_features = working_queue.popleft()
            cur_features = pre_features + [cur_feature]
            for s in cur_string_split[2:]:
                if s == '-1' or s == '-2':
                    decision_rules.add(tuple(cur_features))
                else:
                    working_queue.append([s, cur_features])

        else:
            print('Error: encounter string size either 2 or 4')

        i += 1

    return decision_rules


def get_hierarchy_tree(tree_strings):
    """Convert a tree string to a hierarchy dict

    Args:
        tree_strings ([string]): tree strings parsed from the trie
    """

    working_queue = deque()

    # Each queue item is a list [feature_id, previous_feature_ids]
    i = 1
    tree_dict = {}
    working_queue.append([tree_strings[0], tree_dict])

    while len(working_queue) > 0:
        cur_feature, sub_tree = working_queue.popleft()

        cur_string = tree_strings[i]
        cur_string_split = cur_string.split()

        if len(cur_string_split) == 2:
            # Case 1: there are two values
            sub_tree['f'] = cur_feature
            sub_tree['c'] = []

            for s in cur_string_split:
                if s == '-1' or s == '-2':
                    # We hit a decision node, add a leaf to this brank
                    sub_tree['c'].append({'f': '+' if s == '-2' else '-'})
                else:
                    new_sub_tree = {}
                    sub_tree['c'].append(new_sub_tree)
                    working_queue.append([s, new_sub_tree])

        elif len(cur_string_split) == 4:
            # Case 2: there are four values: the first two correpond to the cur item
            # and the last two correpond to the next item in the queue
            sub_tree['f'] = cur_feature
            sub_tree['c'] = []

            for s in cur_string_split[:2]:
                if s == '-1' or s == '-2':
                    # We hit a decision node, add a leaf to this brank
                    sub_tree['c'].append({'f': '+' if s == '-2' else '-'})
                else:
                    new_sub_tree = {}
                    sub_tree['c'].append(new_sub_tree)
                    working_queue.append([s, new_sub_tree])

            # Load the next item in the queue
            cur_feature, sub_tree = working_queue.popleft()
            sub_tree['f'] = cur_feature
            sub_tree['c'] = []

            for s in cur_string_split[2:]:
                if s == '-1' or s == '-2':
                    # We hit a decision node, add a leaf to this brank
                    sub_tree['c'].append({'f': '+' if s == '-2' else '-'})
                else:
                    new_sub_tree = {}
                    sub_tree['c'].append(new_sub_tree)
                    working_queue.append([s, new_sub_tree])

        else:
            print('Error: encounter string size either 2 or 4')

        i += 1

    return tree_dict
