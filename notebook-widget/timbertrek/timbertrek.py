import numpy as np
import pandas as pd
import random
import html
import base64
import pkgutil

from IPython.display import display_html
from copy import deepcopy
from json import dump, load, dumps


def _make_html():
    """
    Function to create an HTML string to bundle GAM Changer's html, css, and js.
    We use base64 to encode the js so that we can use inline defer for <script>

    We add another script to pass Python data as inline json, and dispatch an
    event to transfer the data

    Args:
        ebm: Trained EBM model. ExplainableBoostingClassifier or
            ExplainableBoostingRegressor object.
        x_test: Sample features. 2D np.ndarray or pd.DataFrame with dimension [n, k]:
            n samples and k features.
        y_test: Sample labels. 1D np.ndarray or pd.Series with size = n samples.
        resort_categorical: Whether to sort the levels in categorical variable
            by increasing order if all levels can be converted to numbers.

    Return:
        HTML code with deferred JS code in base64 format
    """
    # HTML template for GAM Changer widget
    html_top = """<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>TimberTrek</title><style>html{font-size:16px;-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-webkit-text-size-adjust:100%;-moz-text-size-adjust:100%}html,body{position:relative;width:100%;height:100%}body{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen-Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif;color:#4a4a4a;font-size:1em;font-weight:400;line-height:1.5}*,:after,:before{box-sizing:inherit}a{color:#0064c8;text-decoration:none}a:hover{text-decoration:underline}a:visited{color:#0050a0}label{display:block}input,button,select,textarea{font-family:inherit;font-size:inherit;-webkit-padding:.4em 0;padding:.4em;margin:0 0 .5em;box-sizing:border-box;border:1px solid #ccc;border-radius:2px}input:disabled{color:#ccc}button{color:#333;background-color:#f4f4f4;outline:none}button:disabled{color:#999}button:not(:disabled):active{background-color:#ddd}button:focus{border-color:#666}</style><script type="module" crossorigin src="/assets/timbertrek.js"></script>"""
    html_bottom = """</head><body></body></html>"""

    # Read the bundled JS file
    js_string = pkgutil.get_data(__name__, "timbertrek.js")
    # js_b = bytes(js_string, encoding='utf-8')

    # Encode the JS & CSS with base 64
    js_base64 = base64.b64encode(js_string).decode("utf-8")

    # Generate the model and sample data
    data_json = load(open("data.json", "r"))

    # Pass the data to GAM Changer using message event
    # data_json = dumps({"model": model_data, "sample": sample_data})

    # Pass data into JS by using another script to dispatch an event
    messenger_js = """
        (function() {{
            let data = {data};
            let event = new Event('timbertrekData');
            event.data = data;
            console.log('before');
            console.log(data);
            document.dispatchEvent(event);
        }}())
    """.format(
        data=data_json
    )
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


def visualize():
    """
    Render GAM Changer in the output cell.

    Args:
        ebm: Trained EBM model. ExplainableBoostingClassifier or
            ExplainableBoostingRegressor object.
        x_test: Sample features. 2D np.ndarray or pd.DataFrame with dimension [n, k]:
            n samples and k features.
        y_test: Sample labels. 1D np.ndarray or pd.Series with size = n samples.
        resort_categorical: Whether to sort the levels in categorical variable
            by increasing order if all levels can be converted to numbers.
    """
    html_str = _make_html()

    # Randomly generate an ID for the iframe to avoid collision
    iframe_id = "timbertrek-iframe-" + str(int(random.random() * 1e8))

    iframe = """
        <iframe
            srcdoc="{}"
            frameBorder="0"
            width="100%"
            height="800px"
            id="{}">
        </iframe>
    """.format(
        html_str, iframe_id
    )

    # Display the iframe
    display_html(iframe, raw=True)
