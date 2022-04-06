#!/usr/bin/env python

"""The setup script."""

from json import load
from setuptools import setup, find_packages
from pathlib import Path
from pathlib import Path


def _fetchVersion():
    HERE = Path(__file__).parent.parent.resolve()

    for settings in HERE.rglob("package.json"):
        try:
            with settings.open() as f:
                version = load(f)["version"]
                return (
                    version.replace("-alpha.", "a")
                    .replace("-beta.", "b")
                    .replace("-rc.", "rc")
                )
        except FileNotFoundError:
            pass

    raise FileNotFoundError(f"Could not find package.json under dir {HERE!s}")


with open("README.md") as readme_file:
    readme = readme_file.read()

requirements = ["numpy", "pandas", "html", "ipython"]

test_requirements = []

setup(
    author="Jay Wang",
    author_email="jayw@zijie.wang",
    python_requires=">=3.6",
    classifiers=[
        "Development Status :: 2 - Pre-Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Natural Language :: English",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
    ],
    description="A Python package to run TimberTrek in your computation notebooks.",
    install_requires=requirements,
    license="MIT license",
    long_description=readme,
    include_package_data=True,
    keywords="timbertrek",
    name="timbertrek",
    packages=find_packages(include=["timbertrek", "timbertrek.*"]),
    test_suite="tests",
    tests_require=test_requirements,
    url="https://github.com/xiaohk/timbertrek",
    version=_fetchVersion(),
    zip_safe=False,
)
