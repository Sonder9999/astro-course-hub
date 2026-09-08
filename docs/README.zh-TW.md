<div align="center">

# 🎓 高校課程資源導航 / Astro Course Hub

> 一款現代化、開箱即用的高校課程資源導航與大綱閱讀站模板  
> 專為各大專院校、學院及學生開源社群打造，讓課程經驗、複習資料與知識傳承生生不息 ✨

![Node.js >= 22](https://img.shields.io/badge/node.js-%3E%3D22-brightgreen)
![pnpm >= 11](https://img.shields.io/badge/pnpm-%3E%3D11-blue)
![Astro](https://img.shields.io/badge/Astro-7.2.10-orange)
![Svelte](https://img.shields.io/badge/Svelte-5.57.0-red)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

📖 README：
**[简体中文](../README.md)** | **[繁體中文](README.zh-TW.md)** | **[English](../README.en.md)** | **[日本語](README.ja.md)** | **[한국어](README.ko.md)**

🚀 快速連結：
[**🖥️ 線上預覽**](https://courses.example.edu.cn) /
[**📝 貢獻指南**](../CONTRIBUTING.md) /
[**💡 課程大綱範例**](../src/content/courses/cs101-c-programming.md) /
[**⚙️ 配置說明**](../src/config/README.md)

⚡ **極速靜態站點**：基於 Astro 7 靜態站點生成，極致的首頁載入與開箱即用的 SEO 優化  
🍱 **Bento 儀表板**：現代卡片網格，支援依學期（大一至大四/通識）、學科方向多維即時聯動篩選與模糊搜尋  
📖 **優雅大綱閱讀**：內建 KaTeX 數學公式、Mermaid 圖表、語法醒目標示代碼塊與 Admonitions 提示框  
🔍 **離線全文檢索**：整合 Pagefind 客戶端毫秒級全文索引，零伺服器負擔，支援關鍵字即時檢索  
🔧 **完全解耦與通用**：無任何特定大專院校寫死資料，培養方案與學期體系完全配置驅動，任何學校均可一鍵 Fork  
📱 **全端響應式設計**：完美適配桌面端、平板與手機，針對行動端互動深入優化

---

>[!TIP]
>
>**Astro Course Hub** 是一款專為大專院校、學院以及大學生開源技術社群量身打造的**通用課程資源導航與知識閱讀站母版**。
>
>本專案基於優雅的 Astro 部落格主題 [Firefly（流螢）](https://github.com/CuteLeaf/Firefly) 與 [fuwari](https://github.com/saicaca/fuwari) 深度二次重構開發。我們將原有的個人部落格文章體系全面重塑為**結構化課程模型（Course Schema）**，在保留原主題卓越的美學設計、流暢動效與豐富排版能力的同時，賦予其面向大學各學期培養計劃的專業化檢索、篩選與資料導航能力。
>
>你可以直接 **Fork 本倉庫**，根據貴校/學院的實際教學計劃修改配置與錄入課程，輕鬆為自己的母校搭建專屬的課程攻略站！

---

## ✨ 核心特性

### 📚 課程體系與資源導航
- [x] **Bento Grid 課程儀表板** - 現代化便當盒卡片佈局，資訊層級分明，視覺通透
- [x] **多維即時篩選** - 支援依開課學期（大一上/下、大二上/下、大三、大四、通識選修）與學科類別單選/聯動過濾
- [x] **即時模糊搜尋** - 支援對課程名稱、英文縮寫、課程代碼（如 CS101）、授課教師、課程描述及標籤進行極速過濾
- [x] **推薦標籤快捷列** - 置頂展示「必修」、「專業核心」、「含實驗」、「歷年試卷」等高頻關注標籤
- [x] **外鏈與倉庫直達** - 每門課程支援獨立綁定對應的 GitHub 資料倉庫、MOOC、線上評測系統 (OJ) 等連結

### 📝 沉浸式課程內容閱讀
- [x] **全功能 Markdown / MDX 渲染** - 原生支援 GFM 規範，課程 README.md 優雅呈現
- [x] **KaTeX 數學公式支援** - 行內公式 `$E=mc^2$` 與獨立塊級公式 `$$\sum_{i=1}^n x_i$$` 極速渲染
- [x] **Mermaid 圖表引擎** - 在課程大綱中直接編寫流程圖、狀態機、循序圖與架構拓撲
- [x] **增強代碼塊體驗** - 基於 Expressive Code，支援行醒目標示、語言徽標、折疊區塊與一鍵複製
- [x] **Admonitions 提示塊** - 支援 GitHub、Obsidian 風格的 `NOTE` / `TIP` / `WARNING` / `CAUTION` 容器
- [x] **Pagefind 離線檢索** - 在建置期為全站課程標題、元資料及大綱正文生成索引

### 🎨 高度通用與可自訂
- [x] **配置驅動 (Config-Driven)** - 學期配置、方向分類、網站標識完全收斂於 `src/config/`，無需修改原始碼
- [x] **360° 主題色調節** - 支援全色相無級調節，輕鬆適配不同學校的代表校徽主題色
- [x] **亮暗色模式** - 完美支援淺色模式、深色模式與跟隨系統自動切換
- [x] **CLI 鷹架工具** - 提供 `pnpm new-course` 命令，幾秒內快速生成帶標準 Frontmatter 的課程 Markdown

---

## 🚀 快速開始（Fork 復用指南）

為你的大學搭建課程資源站僅需以下步驟：

### 1. 環境準備
- **Node.js** ≥ 22.23.0
- **pnpm** ≥ 11.0.0

### 2. Fork 與複製
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

### 3. 安裝依賴
```bash
pnpm install
```

### 4. 個性化配置
- **`src/config/siteConfig.ts`**：
  修改站點標題 `title`（如 `XX大學課程資源導航`）、副標題 `subtitle`、站點描述以及主題色相 `themeColor.hue`。
- **`src/config/courseConfig.ts`**：
  根據貴校專業培養方案，自訂開課學期清單 `semesters`、專業方向分類 `categories` 與資料總倉庫連結 `repository`。

### 5. 本地開發與預覽
```bash
pnpm dev
```
瀏覽器開啟 `http://localhost:4321` 即可體驗即時熱更新。

### 6. 新增一門課程
```bash
pnpm new-course "資料結構與演算法" "大二上" "專業核心課"
```
文件將自動建立在 `src/content/courses/` 下，填寫大綱與複習筆記即可。

---

## ⚙️ 課程 Frontmatter 規範 (Course Schema)

```yaml
---
title: "程式設計基礎 (C/C++)"         # 必填：課程中文名稱
titleEn: "Fundamentals of Programming" # 選填：課程英文名稱或簡稱
code: "CS101"                          # 選填：課程代碼 / 選課代碼
semester: "大一上"                     # 必填：開課學期（對應 courseConfig.ts 中的 semesters）
category: "學科基礎課"                 # 必填：學科方向大類（對應 courseConfig.ts 中的 categories）
tags: ["必修", "含實驗", "歷年試卷"]   # 選填：標籤清單
description: "資工核心啟蒙課..."      # 選填：課程簡介與選課建議
credits: 4.0                           # 選填：學分數
hours: 64                              # 選填：總學時
instructors: ["資工系教學團隊"]       # 選填：主講教師團隊
prerequisites: ["無先修要求"]          # 選填：先修課程建議
difficulty: 3.5                        # 選填：課程綜合難度星級（1.0 ~ 5.0）
repoUrl: "https://github.com/..."      # 選填：該課程對應的具體資料倉庫連結
externalLinks:                         # 選填：外部關聯資源（MOOC/評測系統等）
  - name: "線上評測系統"
    url: "https://..."
    icon: "material-symbols:terminal-outline"
icon: "material-symbols:code-blocks"   # 選填：課程專屬圖示
order: 10                              # 選填：排序權重（數值越小越靠前）
draft: false                           # 選填：是否為草稿
---
```

---

## ⚖️ 學術誠信與合規免責聲明

1. **交流互助目的**：本站收錄的所有課程攻略、複習題解、實驗指引均為開源學習與學術交流用途。
2. **嚴守學術倫理底線**：嚴禁利用本平台進行任何形式的考試作弊、有償代寫或抄襲他人作業。
3. **禁止涉密材料**：嚴禁上傳帶有國家秘密、機密科研課題或學校明令禁止公開的試卷原卷。
4. **尊重智慧財產權**：筆記與題解請原創梳理，引用第三方教材或投影片請規範註明出處。

---

## 📝 許可協議

本專案遵循 [MIT 許可證](../LICENSE) 開源。你可以自由 Fork、修改與部署本模板，但請保留相關開源版權聲明與致謝連結。
