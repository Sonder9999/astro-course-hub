<div align="center">

# 🎓 大学講義リソースナビゲーション / Astro Course Hub

> モダンですぐに使える大学講義リソースナビゲーション＆シラバス閲覧サイトテンプレート  
> 各大学、学部、学生オープンソースコミュニティ向けに設計され、学習ノウハウや過去問資料を未来へ継承 ✨

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

🚀 クイックリンク：
[**🖥️ ライブデモ**](https://courses.example.edu.cn) /
[**📝 コントリビューションガイド**](../CONTRIBUTING.md) /
[**💡 講義シラバスの例**](../src/content/courses/cs101-c-programming.md) /
[**⚙️ 設定ドキュメント**](../src/config/README.md)

⚡ **超高速な静的サイト生成**：Astro 7 による高速な初期表示と標準の SEO 最適化  
🍱 **Bento ダッシュボード**：学期・専攻カテゴリ別のリアルタイム多次元フィルター＆あいまい検索  
📖 **シームレスなシラバス閲覧**：KaTeX 数式、Mermaid チャート、コードハイライト、Admonition 警告ボックスを完備  
🔍 **オフライン全文検索**：Pagefind によるクライアント側ミリ秒単位の全文検索  
🔧 **完全な汎用性**：特定大学への依存なし、設定ファイルのみでカリキュラムを自由にカスタマイズ可能  
📱 **レスポンシブデザイン**：デスクトップ、タブレット、スマートフォンに最適化

---

>[!TIP]
>
>**Astro Course Hub** は、大学や学生エンジニアコミュニティ向けに設計された**オープンソースの大学講義リソースナビゲーション母艦テンプレート**です。
>
>美しい Astro テーマ [Firefly](https://github.com/CuteLeaf/Firefly) および [fuwari](https://github.com/saicaca/fuwari) をベースに大幅にリファクタリングされました。個人ブログの Post モデルを**構造化された講義モデル（Course Schema）**へ刷新し、洗練されたデザインを維持したまま、大学の学期カリキュラムに沿った検索・閲覧機能を提供します。
>
>本リポジトリを **Fork** し、自分の大学のシラバスや学期制度に合わせて設定を変更するだけで、独自の講義ナビゲーションサイトを簡単に開設できます！

---

## ✨ 主な機能

- [x] **Bento Grid ダッシュボード** - 洗練されたカードグリッド表示
- [x] **多次元リアルタイムフィルター** - 開講学期（1年〜4年/教養など）および専攻カテゴリごとの即時絞り込み
- [x] **高速あいまい検索** - 講義名、講義コード（例: CS101）、担当教員、概要、タグによる即時検索
- [x] **Markdown / MDX シラバス閲覧** - GFM 準拠、講義ごとの README.md を美しく表示
- [x] **KaTeX 数式レンダリング** - インライン数式 `$E=mc^2$` やブロック数式に対応
- [x] **Mermaid チャート** - フローチャートやシステム構成図を直接記述可能
- [x] **Expressive Code** - 行強調、言語バッジ、折りたたみ機能を備えたコードブロック
- [x] **Pagefind オフライン検索** - サーバー不要の超高速インデックス検索
- [x] **360° テーマカラー調整** - 大学のスクールカラーに合わせた自由な色調整

---

## 🚀 クイックスタート（Fork ガイド）

1. **リポジトリを Fork してクローン**
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```
2. **依存関係のインストール**
   ```bash
   pnpm install
   ```
3. **大学カリキュラムとサイト設定のカスタマイズ**
   - `src/config/siteConfig.ts`：大学名・サイト名、説明文、テーマカラーを設定
   - `src/config/courseConfig.ts`：学期一覧（`semesters`）、専攻カテゴリ（`categories`）を設定
4. **開発サーバーの起動**
   ```bash
   pnpm dev
   ```
5. **講義ページの追加**
   ```bash
   pnpm new-course "データ構造とアルゴリズム" "大二上" "専門コア"
   ```

---

## ⚙️ 講義 Frontmatter 仕様 (Course Schema)

```yaml
---
title: "プログラミング基礎 (C/C++)"
titleEn: "Fundamentals of Programming"
code: "CS101"
semester: "大一上"
category: "基礎科目"
tags: ["必修", "実験あり", "過去問あり"]
description: "コンピュータサイエンスの入門講義..."
credits: 4.0
hours: 64
instructors: ["情報科学専攻教員チーム"]
prerequisites: ["事前知識不要"]
difficulty: 3.5
repoUrl: "https://github.com/..."
externalLinks:
  - name: "オンラインジャッジ演習"
    url: "https://..."
    icon: "material-symbols:terminal-outline"
icon: "material-symbols:code-blocks"
order: 10
draft: false
---
```

---

## ⚖️ 学術倫理と免責事項

1. **学習支援目的**：本サイト上の講義ノートや解説は、学生同士の学習相互支援を目的としています。
2. **学術倫理の遵守**：本プラットフォームを利用した試験での不正行為や課題の盗用・代行は厳禁です。
3. **機密情報の禁止**：学外秘とされる非公開の試験問題や機密研究情報の投稿は固く禁じられています。
4. **著作権への配慮**：引用元を明記し、第三者の著作権を尊重してください。

---

## 📝 ライセンス

本プロジェクトは [MIT ライセンス](../LICENSE) のもとで公開されています。
