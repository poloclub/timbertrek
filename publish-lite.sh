conda activate gam
cd lite
rm -rf _output/*
rm -rf output
jupyter lite build --contents content --output-dir output
rm -r ../gh-page/notebook/
mkdir ../gh-page/notebook/
cp -r output/* ../gh-page/notebook
rm -rf output
cd ..
# cd _output
# git add --all
# git commit -m "$(git log '--format=format:%H' master -1)"
# git push origin gh-pages