# TimberTrek <a href="https://poloclub.github.io/timbertrek/"><img align="right" src="src/imgs/timbertrek-logo-light.svg" height="38"></img></a>

[![Github Actions Status](https://github.com/poloclub/timbertrek/workflows/build/badge.svg)](https://github.com/poloclub/timbertrek/actions/workflows/build.yml)
[![license](https://img.shields.io/badge/License-MIT-success)](https://github.com/poloclub/timbertrek/blob/master/LICENSE)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/poloclub/timbertrek/master?urlpath=lab/tree/notebook-widget/example/campas.ipynb)
[![Lite](https://gist.githubusercontent.com/xiaohk/9b9f7c8fa162b2c3bc3251a5c9a799b2/raw/a7fca1d0a2d62c2b49f60c0217dffbd0fe404471/lite-badge-launch-small.svg)](https://poloclub.github.io/timbertrek/notebook)
[![pypi](https://img.shields.io/pypi/v/timbertrek?color=blue)](https://pypi.python.org/pypi/timbertrek)
[![arxiv badge](https://img.shields.io/badge/arXiv-2209.09227-red)](https://arxiv.org/abs/2209.09227)
[![DOI:10.1109/VIS54862.2022.00021](https://img.shields.io/badge/DOI-10.1109/VIS54862.2022.00021-blue)](https://doi.org/10.1109/VIS54862.2022.00021)

Curate decision trees that align with your knowledge and values!

<table>
  <tr>
    <td colspan="4"><a href="https://poloclub.github.io/timbertrek"><img src='https://i.imgur.com/t4qtPPX.png'></a></td>
  </tr>
  <tr></tr>
  <tr>
    <td><a href="https://poloclub.github.io/timbertrek">🚀 Live Demo</a></td>
    <td><a href="https://youtu.be/3eGqTmsStJM">📺 Demo Video</a></td>
    <td><a href="https://youtu.be/l1mr9z1TuAk">👨🏻‍🏫 Conference Talk</a></td>
    <td><a href="https://arxiv.org/abs/2209.09227">📖 Research Paper</a></td>
  </tr>
</table>

<!-- |<img src='https://i.imgur.com/t4qtPPX.png'>|
|:---:|
|<a href="https://youtu.be/3eGqTmsStJM">📺 Demo Video for "TimberTrek: Exploring and Curating Trustworthy Decision Trees with Interactive Visualization"| -->

## Web Demo

For a live web demo, visit: https://poloclub.github.io/timbertrek.

You can use the web demo to explore your own Rashomon Sets! You just need to choose the `my own set` tab below the tool and upload a JSON file containing all decision paths in your Rashomon Set.

Check out this [example notebook](https://github.com/ubc-systopia/treeFarms/blob/main/treefarms/tutorial.ipynb) to see how to generate the whole Rashomon Set and the JSON file.

## Notebook Demos

You can directly use TimberTrek in your favorite computational notebooks (e.g. Jupyter Notebook/Lab, Google Colab, and VS Code Notebook).

Check out three live notebook demos below.

|Jupyter Lite|Binder|Google Colab|
|:---:|:---:|:---:|
|[![Lite](https://gist.githubusercontent.com/xiaohk/9b9f7c8fa162b2c3bc3251a5c9a799b2/raw/a7fca1d0a2d62c2b49f60c0217dffbd0fe404471/lite-badge-launch-small.svg)](https://poloclub.github.io/timbertrek/notebook)|[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/poloclub/timbertrek/master?urlpath=lab/tree/notebook-widget/example/campas.ipynb)|[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1shCiDNCXy7-8XexJ65aMboZXxVBGhIZB?usp=sharing)|

## Install

To use TimberTrek in a notebook, you would need to install TimberTrek with `pip`:

```bash
pip install timbertrek
```

## Development

Clone or download this repository:

```bash
git clone git@github.com:poloclub/timbertrek.git
```

Install the dependencies:

```bash
npm install
```

Then run TimberTrek:

```
npm run dev
```

Navigate to localhost:3000. You should see TimberTrek running in your browser :)

## Credits

Led by <a href='https://zijie.wang/' target='_blank'>Jay Wang</a>, TimberTrek is a result of a collaboration between ML and visualization researchers from Georgia Tech, Duke University, Fujitsu Laboratories, and University of British Columbia. TimberTrek is created by <a href='https://zijie.wang/' target='_blank'>Jay Wang</a>, <a href='https://www.linkedin.com/in/chudizhong' target='_blank'>Chudi Zhong</a>, <a href='https://www.linkedin.com/in/rui-xin-8070181b9' target='_blank'>Rui Xin</a>, <a href='https://scholar.google.com/citations?user=9fY1WVIAAAAJ&hl=en' target='_blank'>Takuya Takagi</a>, <a href='https://users.cs.duke.edu/~zhichen/' target='_blank'>Zhi Chen</a>, <a href='' target='_blank'>Polo Chau</a>, <a href='https://users.cs.duke.edu/~cynthia/' target='_blank'>Cynthia Rudin</a>, and <a href='https://www.seltzer.com/margo/' target='_blank'>Margo Seltzer</a>.

## Citation

To learn more about TimberTrek, please read our [research paper](https://arxiv.org/abs/2209.09227) (published at [IEEE VIS 2022](https://ieeevis.org/year/2022/welcome)). To learn more about the algorithm to generate the whole Rashomon set of sparse decision trees, please read our [TreeFARMS paper](https://arxiv.org/abs/2209.08040) (published at NeurIPS'22). If you find TimberTrek useful for your research, please consider citing our paper. Thanks!

```bibTeX
@inproceedings{wangTimberTrekExploringCurating2022,
  title = {{{TimberTrek}}: {{Exploring}} and {{Curating Trustworthy Decision Trees}} with {{Interactive Visualization}}},
  booktitle = {2022 {{IEEE Visualization Conference}} ({{VIS}})},
  author = {Wang, Zijie J. and Zhong, Chudi and Xin, Rui and Takagi, Takuya and Chen, Zhi and Chau, Duen Horng and Rudin, Cynthia and Seltzer, Margo},
  year = {2022}
}
```

## License

The software is available under the [MIT License](https://github.com/poloclub/timbertrek/blob/master/LICENSE).

## Contact

If you have any questions, feel free to [open an issue](https://github.com/poloclub/timbertrek/issues/new) or contact [Jay Wang](https://zijie.wang).
