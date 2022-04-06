"""An interactive visualization tool to help you explore Rashomon set of sparse decision trees."""

import json
from pathlib import Path


def _fetchVersion():
    HERE = Path(__file__).parent.parent.parent.resolve()

    for settings in HERE.rglob("package.json"):
        try:
            with settings.open() as f:
                version = json.load(f)["version"]
                return (
                    version.replace("-alpha.", "a")
                    .replace("-beta.", "b")
                    .replace("-rc.", "rc")
                )
        except FileNotFoundError:
            pass

    raise FileNotFoundError(f"Could not find package.json under dir {HERE!s}")


__author__ = """Jay Wang"""
__email__ = "jayw@zijie.wang"
__version__ = _fetchVersion()

from timbertrek.timbertrek import *
