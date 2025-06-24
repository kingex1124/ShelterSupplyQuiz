# GitHub Pages 部署說明

1. 將專案 push 到 GitHub。
2. 安裝 gh-pages 套件：
   ```
   npm install gh-pages --save-dev
   ```
3. 修改 package.json，加入 homepage 與 deploy scripts。
4. 執行：
   ```
   npm run deploy
   ```
5. 到 GitHub 設定 gh-pages 分支為 Pages 來源。
