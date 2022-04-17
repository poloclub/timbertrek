cp -r ./dist/.vercel ./
pnpm run build
cp -r ./.vercel ./dist/.vercel
vercel dist