npm i
npx tsc -b tsconfig.json && chmod +x ./bin/index.js tools/**/* && ./tools/postbuild.js
./tools/install.js