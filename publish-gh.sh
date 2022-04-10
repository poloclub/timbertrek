cd gh-page
git add --all
git commit -m "Deploy $(git log '--format=format:%H' master -1)"
git push origin gh-pages
cd ..