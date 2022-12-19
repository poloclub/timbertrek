import numpy as np
import re
import random
import html
import base64
import pkgutil

from tqdm import tqdm
from collections import deque
from IPython.display import display_html
from json import dump, load, dumps


def transform_trie(trie):
    """Deep copy and transform the trie.

    Args:
        trie (dict): The original trie

    Returns:
        dict: A deep copy of the transformed trie.
    """

    # Hit the terminal node
    if "objective" in trie:
        # Only keep one metric from the tree
        return {"acc": round(trie["objective"], 5)}

    sub_dict = {}
    for k in trie:
        sub_dict[k] = transform_trie(trie[k])

    return sub_dict


def get_flat_metrics(trie, metrics, metric_name="objective"):
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


def get_tree_depths(trie, tree_depth=0, metric_name="objective"):
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
            get_tree_depths(trie[k], tree_depth=tree_depth + 1, metric_name=metric_name)
        )

    return tree_depths


def get_hierarchy_dict(trie, metric="objective"):
    """Get the hierarchy dictionary form the original trie.

    Args:
        trie (dict): Original trie
        metric (str): Termination key. Also keep this value in the hierarchy
            dict.

    Returns:
        dict: Transformed trie in a strict hierarchy structure
    """

    value_map = {"-2": 1, "-1": -1}

    def get_sub_trie(subtrie, feature, direction):

        # Hit the terminal node
        if metric in subtrie:
            return {
                # Leaf node
                "f": "_",
                "d": direction,
                "s": round(subtrie[metric], 5),
            }

        sub_dict = {"f": feature, "c": []}

        for k in subtrie:
            cur_name = k.split(" ")

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
            new_feature = " ".join(temp_feature_list)

            sub_dict["c"].append(get_sub_trie(subtrie[k], new_feature, new_direction))

        # Here the feature name discards split position, so we need to combine
        # their leaves into the same 'c' list
        new_sub_dict = {"f": feature, "c": []}

        for k in sub_dict["c"]:
            is_duplicate = False
            for p in new_sub_dict["c"]:
                if k["f"] == p["f"]:
                    p["c"].extend(k["c"])
                    is_duplicate = True
                    break

            if not is_duplicate:
                new_sub_dict["c"].append(k)

        return new_sub_dict

    subtrie = {"f": "root", "c": []}
    direction = []

    for k in trie:
        # For the first level, the key only contains the feature id
        subtrie["c"].append(get_sub_trie(trie[k], k, direction))

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
        feature_name = re.sub(r"(.*):.*", r"\1", item)
        feature_value = re.sub(r".*:(.*)", r"\1", item)

        # Translate the feature name into a more readable format
        feature_type = feature_description_map[feature_name]["type"]
        feature_short = feature_description_map[feature_name]["short"]
        feature_name = feature_description_map[feature_name]["info"]

        if feature_type == "is":
            feature_value = "is " + feature_value
            feature_map[i] = [feature_name, feature_value, feature_short]
        elif feature_type == "count":
            feature_value = re.sub(r"([>=<])(.*)", r"\1 \2", feature_value)
            feature_map[i] = [feature_name, feature_value, feature_short]
        elif feature_type == "yes":
            feature_value = ""
            feature_map[i] = [feature_name, feature_value, feature_short]

    return feature_map


def build_tree_map(trie, tree_map, tree_strings=[], objective="acc"):
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
        new_count = tree_map["count"] + 1
        tree_map["map"][new_count] = [tree_strings, trie[objective]]
        tree_map["count"] = new_count
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
            for j, s in enumerate(cur_string_split):
                formated_cur_feature = cur_feature
                formated_cur_feature += "t" if j == 0 else "f"
                cur_features = pre_features + [formated_cur_feature]
                if s == "-1" or s == "-2":
                    # We hit a decision node, add this decision rule chain
                    decision_rules.add((tuple(cur_features), "+" if s == "-2" else "-"))
                else:
                    working_queue.append([s, cur_features])

        elif len(cur_string_split) == 4:
            # Case 2: there are four values: the first two correspond to the cur item
            # and the last two correspond to the next item in the queue
            for j, s in enumerate(cur_string_split[:2]):

                formated_cur_feature = cur_feature
                formated_cur_feature += "t" if j == 0 else "f"
                cur_features = pre_features + [formated_cur_feature]

                if s == "-1" or s == "-2":
                    decision_rules.add((tuple(cur_features), "+" if s == "-2" else "-"))
                else:
                    working_queue.append([s, cur_features])

            # Load the next item in the queue
            cur_feature, pre_features = working_queue.popleft()

            for j, s in enumerate(cur_string_split[2:]):

                formated_cur_feature = cur_feature
                formated_cur_feature += "t" if j == 0 else "f"
                cur_features = pre_features + [formated_cur_feature]

                if s == "-1" or s == "-2":
                    decision_rules.add((tuple(cur_features), "+" if s == "-2" else "-"))
                else:
                    working_queue.append([s, cur_features])

        elif len(cur_string_split) == 6:
            # Case 3: there are six values: the first two correspond to the cur item
            # and the last four correspond to the next two items in the queue
            for j, s in enumerate(cur_string_split[:2]):

                formated_cur_feature = cur_feature
                formated_cur_feature += "t" if j == 0 else "f"
                cur_features = pre_features + [formated_cur_feature]

                if s == "-1" or s == "-2":
                    decision_rules.add((tuple(cur_features), "+" if s == "-2" else "-"))
                else:
                    working_queue.append([s, cur_features])

            # Load the next item in the queue
            cur_feature, pre_features = working_queue.popleft()

            for j, s in enumerate(cur_string_split[2:4]):

                formated_cur_feature = cur_feature
                formated_cur_feature += "t" if j == 0 else "f"
                cur_features = pre_features + [formated_cur_feature]

                if s == "-1" or s == "-2":
                    decision_rules.add((tuple(cur_features), "+" if s == "-2" else "-"))
                else:
                    working_queue.append([s, cur_features])

            # Load the next item in the queue
            cur_feature, pre_features = working_queue.popleft()

            for j, s in enumerate(cur_string_split[4:]):

                formated_cur_feature = cur_feature
                formated_cur_feature += "t" if j == 0 else "f"
                cur_features = pre_features + [formated_cur_feature]

                if s == "-1" or s == "-2":
                    decision_rules.add((tuple(cur_features), "+" if s == "-2" else "-"))
                else:
                    working_queue.append([s, cur_features])

        else:
            raise ValueError("Error: encounter string size either 2 nor 4 nor 6")

        i += 1

    return decision_rules


def get_hierarchy_tree(tree_strings):
    """Convert a tree string to a hierarchy dict

    Each level in the hierarchy dict has two properties:
        'f': ['3'] means current feature name is 3
        'f': ['+', 300, 200] means current prediction is positive, there are
            300 sample meeting the condition, and 200 of them are correctly
            classified
        'c': [nodes]

    This function only populates 'f' as a single element list, need to call
    another function to compute # of samples and accuracy at leaf nodes

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

        if len(cur_string_split) % 2 != 0:
            raise ValueError("Error: current string size is not even.")

        # The string can have even number of values: the first two correspond to
        # the current item, and the second two correspond to the next item in
        # the queue, and the next two corresponds to the next item in the queue...
        sub_tree["f"] = [cur_feature]
        sub_tree["c"] = []

        for s in cur_string_split[:2]:
            if s == "-1" or s == "-2":
                # We hit a decision node, add a leaf to this branch
                sub_tree["c"].append({"f": ["+"] if s == "-2" else ["-"]})
            else:
                new_sub_tree = {}
                sub_tree["c"].append(new_sub_tree)
                working_queue.append([s, new_sub_tree])

        # Index for the next pair
        pair_i = 2
        while pair_i < len(cur_string_split):
            # Load the next item in the queue
            cur_feature, sub_tree = working_queue.popleft()
            sub_tree["f"] = [cur_feature]
            sub_tree["c"] = []

            for s in cur_string_split[pair_i : pair_i + 2]:
                if s == "-1" or s == "-2":
                    # We hit a decision node, add a leaf to this branch
                    sub_tree["c"].append({"f": ["+"] if s == "-2" else ["-"]})
                else:
                    new_sub_tree = {}
                    sub_tree["c"].append(new_sub_tree)
                    working_queue.append([s, new_sub_tree])

            pair_i += 2

        i += 1

    return tree_dict


def get_decision_rule_hierarchy_dict(trie, keep_position=True):
    """Generate and format decision rules as a hierarchy dict from the original
        trie.

    Args:
        trie (dict): Original trie
        keep_position (bool, optional): Whether to keep the position of each
            feature (left or right). Defaults to True.

    Returns:
        dict: Hierarchy dict
    """
    trie_copy = transform_trie(trie)

    # Step 1: build a dictionary to map tree ID to its string description
    tree_map = {"count": 0, "map": {}}
    build_tree_map(trie_copy, tree_map)

    # Step 2: build a temporary dictionary to map string to tree ID
    string_to_id_map = {}
    for k in tree_map["map"]:
        string_to_id_map[tuple(tree_map["map"][k][0])] = k

    decision_rule_hierarchy = {"f": "root", "c": []}

    for i in tree_map["map"]:
        cur_string = tree_map["map"][i][0]
        if len(cur_string) <= 1:
            # Skip this subtrie if the root is a decision
            continue

        all_rules = get_decision_rules(cur_string)

        # Iterate the set and build the hierarchy dict
        for rule in all_rules:
            cur_dict = decision_rule_hierarchy

            for f in rule[0]:
                cur_feature = f if keep_position else re.sub(r"(\d*)[tf]", r"\1", f)

                is_exist = False
                for item in cur_dict["c"]:
                    if item["f"] == cur_feature:
                        cur_dict = item
                        is_exist = True
                        break

                if not is_exist:
                    new_item = {"f": cur_feature, "c": []}
                    cur_dict["c"].append(new_item)
                    cur_dict = new_item
                    is_exist = True

            # Hit the end of the rule, add this tree to the children list
            # If keep_position = False, need to avoid adding duplicate trees
            existing_trees = set()
            for c in cur_dict["c"]:
                if c["f"] == "_":
                    existing_trees.add(c["t"])

            if i not in existing_trees:
                cur_dict["c"].append({"f": "_", "t": i})

    return decision_rule_hierarchy, tree_map


def get_all_tree_ids(node):
    """Get all tree ids used in a hierarchy dict

    Args:
        node (dict): Hierarchy dict

    Returns:
        [int]: All tree IDs
    """

    if node["f"] == "_":
        return [node["t"]]

    cur_tree_ids = []

    for c in node["c"]:
        cur_tree_ids.extend(get_all_tree_ids(c))

    return cur_tree_ids


def get_tree_map_hierarchy(tree_map):
    """Convert tree map's string encoding to a hierarchy dict

    Args:
        tree_map (dict): Tree map generated by build_tree_map()

    Returns:
        dict: Same format as the tree_map, but with string encodings replaced
            with hierarchy dict
    """
    new_tree_map = {}

    for i in tree_map["map"]:
        if len(tree_map["map"][i][0]) <= 1:
            # Skip this subtrie if the root is a decision
            continue
        tree_hierarchy = get_hierarchy_tree(tree_map["map"][i][0])
        new_tree_map[i] = [tree_hierarchy, tree_map["map"][i][1]]

    return new_tree_map


def count_leaf_samples(root, x_all, y_all):
    """Count the number of samples and accuracy in each leaf node of the given
        decision tree

    Args:
        root(dict): The root node of the tree
        x_all(np.array): Data sample values
        y_all(np.array): Data labels
    """

    y_pred = np.array([root["f"][0] + "l" + "0" for _ in range(x_all.shape[0])]).astype(
        object
    )
    total_correct_num = 0

    # Use a queue for BFS
    working_queue = deque()
    working_queue.append([root, "l", 0])

    while len(working_queue) > 0:
        cur_node, cur_dir, cur_dep = working_queue.popleft()

        # cur_labels is [label_for_true, label_for_false]
        cur_labels = []
        dirs = ["l", "r"]

        for (i, child) in enumerate(cur_node["c"]):
            cur_label = child["f"][0]
            cur_labels.append(cur_label)

            # Add the children to the queue if it not a leaf node
            if child["f"][0] != "+" and child["f"][0] != "-":
                working_queue.append([child, dirs[i], cur_dep + 1])

        # Iterate through all samples and to assign labels
        cur_feature_index = cur_node["f"][0]

        # True left (first), false right (second)
        true_indexes = np.where(
            np.logical_and(
                x_all[:, int(cur_feature_index)] == 1,
                y_pred == cur_feature_index + cur_dir + str(cur_dep),
            )
        )[0]
        y_pred[list(true_indexes)] = cur_labels[0] + "l" + str(cur_dep + 1)

        false_indexes = np.where(
            np.logical_and(
                x_all[:, int(cur_feature_index)] == 0,
                y_pred == cur_feature_index + cur_dir + str(cur_dep),
            )
        )[0]
        y_pred[list(false_indexes)] = cur_labels[1] + "r" + str(cur_dep + 1)

        cur_node["f"] = [cur_node["f"][0], len(true_indexes) + len(false_indexes), -1]

        # Update the sample # in the original tree on every node
        # Also compute the # of correctly classified samples on leaf node (
        # keep it as 0 for non-leaf nodes)
        if cur_labels[0] == "+" or cur_labels[0] == "-":
            # Compute the # of correctly classified samples
            cur_pred = 1 if cur_labels[0] == "+" else 0
            correct_num = int(np.sum(y_all[true_indexes] == cur_pred))

            cur_node["c"][0]["f"] = [
                cur_node["c"][0]["f"][0],
                len(true_indexes),
                correct_num,
            ]

            # Accumulate the number for total accuracy
            total_correct_num += correct_num

        if cur_labels[1] == "+" or cur_labels[1] == "-":
            cur_pred = 1 if cur_labels[1] == "+" else 0
            correct_num = int(np.sum(y_all[false_indexes] == cur_pred))

            cur_node["c"][1]["f"] = [
                cur_node["c"][1]["f"][0],
                len(false_indexes),
                correct_num,
            ]

            # Accumulate the number for total accuracy
            total_correct_num += correct_num

    # Return the accuracy of this tree
    return round(total_correct_num / len(y_all), 5)


def transform_trie_to_rules(
    trie, data_df, feature_names=None, feature_description=None
):
    """Transform Rashomon trie json string to hierarchical rules for TimberTrek

    Args:
        trie (str): Rashomon trie json
        data_df (pd.DataFrame): Dataframe of the dataset to compute tree accuracies
        feature_names ([str]): A list of feature names. Each name has format like
            'age:<26'. If it is not given, uses the data frame hearders as feature
            names.
        feature_description (dict): A dictionary that maps feature name to their
            descriptions. If it is not given, original feature names will be
            used (might be hard for readers to understand).

    Returns:
        A string of json object of the hierarchical decision rules
    """

    if feature_names is None:
        feature_names = data_df.columns.tolist()

    if feature_description is None:
        feature_description = {}
        for f in feature_names:
            name = re.sub(r"(.*):.*", r"\1", f)
            if name not in feature_description:
                feature_description[name] = {
                    "info": name,
                    "type": "count",
                    "short": name,
                }

    # Construct trees
    decision_rule_hierarchy, tree_map = get_decision_rule_hierarchy_dict(
        trie, keep_position=False
    )
    new_tree_map = get_tree_map_hierarchy(tree_map)

    # Count samples and accuracies of trees in place
    # Extract the x data from the dataframe (here we use all data to evaluate)
    x_all = data_df.to_numpy()[:, 0 : data_df.shape[1] - 1]
    y_all = data_df.to_numpy()[:, data_df.shape[1] - 1]

    for tid in tqdm(
        new_tree_map, desc=f"Generating decision paths from {len(new_tree_map)} trees"
    ):
        cur_tree = new_tree_map[tid]
        cur_acc = count_leaf_samples(cur_tree[0], x_all, y_all)
        cur_tree.append(cur_acc)

    # Get the feature encodings
    feature_map = get_feature_map(feature_names, feature_description)

    decision_rule_hierarchy_dict = {}
    decision_rule_hierarchy_dict["trie"] = decision_rule_hierarchy
    decision_rule_hierarchy_dict["featureMap"] = feature_map
    decision_rule_hierarchy_dict["treeMap"] = new_tree_map

    return decision_rule_hierarchy_dict


def _make_html(decision_paths, width):
    """
    Function to create an HTML string to bundle TimberTrek's html, css, and js.
    We use base64 to encode the js so that we can use inline defer for <script>

    We add another script to pass Python data as inline json, and dispatch an
    event to transfer the data

    Args:
        decision_paths(dict): Decision paths in a hierarchical dict
        width(int): Width of the main visualization window

    Return:
        HTML code with deferred JS code in base64 format
    """
    # HTML template for TimberTrek widget
    html_top = """<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>TimberTrek</title><style>html{font-size:16px;-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-webkit-text-size-adjust:100%;-moz-text-size-adjust:100%}html,body{position:relative;width:100%;height:100%}body{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen-Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif;color:#4a4a4a;font-size:1em;font-weight:400;line-height:1.5}*,:after,:before{box-sizing:inherit}a{color:#0064c8;text-decoration:none}a:hover{text-decoration:underline}a:visited{color:#0050a0}label{display:block}input,button,select,textarea{font-family:inherit;font-size:inherit;-webkit-padding:.4em 0;padding:.4em;margin:0 0 .5em;box-sizing:border-box;border:1px solid #ccc;border-radius:2px}input:disabled{color:#ccc}button{color:#333;background-color:#f4f4f4;outline:none}button:disabled{color:#999}button:not(:disabled):active{background-color:#ddd}button:focus{border-color:#666}</style>"""
    html_bottom = """</head><body></body></html>"""

    # Read the bundled JS file
    js_b = pkgutil.get_data(__name__, "timbertrek.js")

    # Read local JS file (for development only)
    # with open("./timbertrek.js", "r") as fp:
    #     js_string = fp.read()
    # js_b = bytes(js_string, encoding="utf-8")

    # Encode the JS & CSS with base 64
    js_base64 = base64.b64encode(js_b).decode("utf-8")

    # Convert json dict to string
    data_json = dumps(decision_paths)

    # Pass data into JS by using another script to dispatch an event
    messenger_js = f"""
        (function() {{
            const event = new Event('timbertrekData');
            event.data = {data_json};
            event.width = {width};
            document.dispatchEvent(event);
        }}())
    """
    messenger_js = messenger_js.encode()
    messenger_js_base64 = base64.b64encode(messenger_js).decode("utf-8")

    # Inject the JS to the html template
    html_str = (
        html_top
        + """<script defer src='data:text/javascript;base64,{}'></script>""".format(
            js_base64
        )
        + """<script defer src='data:text/javascript;base64,{}'></script>""".format(
            messenger_js_base64
        )
        + html_bottom
    )

    return html.escape(html_str)


def visualize(decision_paths, width=500, height=650):
    """
    Render TimberTrek in the output cell.

    Args:
        decision_paths(dict): Decision paths in a hierarchical dict
        width(int): Width of the main visualization window
        height(int): Height of the whole window

    Return:
        HTML code with deferred JS code in base64 format
    """

    # Simple validations
    assert isinstance(decision_paths, dict), "`decision_paths` has to be a dictionary."
    assert "trie" in decision_paths, "decision_paths` is not valid (no `trie` key)."
    assert (
        "featureMap" in decision_paths
    ), "decision_paths` is not valid (no `featureMap` key)."
    assert (
        "treeMap" in decision_paths
    ), "decision_paths` is not valid (no `treeMap` key)."

    html_str = _make_html(decision_paths, width)

    # Randomly generate an ID for the iframe to avoid collision
    iframe_id = "timbertrek-iframe-" + str(int(random.random() * 1e8))

    iframe = f"""
        <iframe
            srcdoc="{html_str}"
            frameBorder="0"
            width="100%"
            height="{height}px"
            id="{iframe_id}">
        </iframe>
    """

    # Display the iframe
    display_html(iframe, raw=True)
