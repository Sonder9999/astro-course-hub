# 🤝 课程资料共建与贡献指南 (Contributing Guide)

感谢你关注并愿意为**开源高校课程资源导航站**贡献力量！

每一份选课经验、每一篇实验避坑攻略、每一道历年考题的思路解析，都将帮助后来的学弟学妹们在求知之路上少走弯路。正是无数同学的无私分享，才让高校的学术薪火代代相传 ✨

---

## 💡 你可以贡献什么？

无论是完善单门课程的细节，还是贡献整套课程资料，我们都非常欢迎：

1. **选课与避坑指南**：授课风格、平时点名/作业频率、考核权重比例、选课避雷建议。
2. **实验与大作业攻略**：实验环境搭建（如 VS Code/CLion/Vivado 配置）、典型报错踩坑、设计报告要点梳理。
3. **优质参考资料推荐**：B 站神仙网课、国内外名校公开课（如 CS61A/CS61B/CS144）、高质量教材或刷题题库链接。
4. **期末复习题型与回忆卷**：历年常考高频考点梳理、简答题重点背诵、往年回忆版大题思路解析。
5. **代码与功能改进**：为本模板增加实用特性、修复样式缺陷或优化检索性能。

---

## 📝 贡献课程资料的标准流程

### 第一步：Fork 本仓库
点击仓库右上角的 **Fork** 按钮，复制一份到你个人的 GitHub 账号下。

### 第二步：克隆并配置开发环境
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
pnpm install
pnpm dev
```
打开 `http://localhost:4321`，即可在本地一边编辑一边实时预览。

### 第三步：创建或编辑课程文档
你可以使用内置命令自动生成规范的课程 Markdown 模板：
```bash
pnpm new-course "编译原理" "大三上" "专业核心课"
```
文件将自动生成于 `src/content/courses/` 目录下（文件名采用拼音/英文 slug 规范）。

### 第四步：编写课程 Frontmatter 与正文
请参考以下规范完善 Frontmatter 元数据：
```yaml
---
title: "编译原理"
titleEn: "Principles of Compiler Design"
code: "CS302"
semester: "大三上"
category: "专业核心课"
tags: ["必修", "含实验", "大作业", "考研重点"]
description: "系统阐述词法分析、语法分析、语义分析、中间代码生成与代码优化的经典硬核课程。"
credits: 3.5
hours: 56
instructors: ["计算机系教学团队"]
prerequisites: ["程序设计基础", "数据结构与算法", "离散数学"]
difficulty: 4.5
repoUrl: "https://github.com/example-univ/compiler-lab"
externalLinks:
  - name: "哈工大陈鄞老师公开课"
    url: "https://www.bilibili.com/..."
    icon: "material-symbols:smart-display-outline"
icon: "material-symbols:terminal"
order: 25
draft: false
---
```

**建议的正文大纲结构：**
- `## 📖 课程概述与选课建议`（考核方式、给分风格、学时难度）
- `## 🧪 实验与大作业通关指南`（开发工具链、核心难点、代码规范提示）
- `## 📚 推荐教材与线上公开课`（经典参考书、名校公开课视频）
- `## 🎯 期末高频考点与复习题解`（知识点脉络、易错概念辨析）

### 第五步：本地校验与代码格式化
在提交代码前，请务必运行以下检查指令，确保无语法与格式错误：
```bash
# 执行静态语法与类型检查
pnpm check
pnpm type-check

# 自动格式化代码风格
pnpm format
```

### 第六步：提交并创建 Pull Request (PR)
提交 Commit 请遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：
```bash
git add .
git commit -m "docs: 补充大三上编译原理期末考点与实验环境搭建指南"
git push origin main
```
前往 GitHub 仓库页面，向主分支（`main` 或 `master`）发起 Pull Request，并在描述中简要说明你的修改要点。

---

## ⚖️ 学术诚信与合规红线（务必遵守）

为保护项目合规运行并维护健康的高校学术环境，所有贡献者必须恪守以下底线：

1. **坚决抵制学术不端**：
   - 严禁上传、求取或传播任何正在进行中的考试原题、当堂答案或有偿代写内容。
   - 大作业攻略仅限于讲解**实现思路、架构设计与采坑总结**，不提倡直接提供全套无注释的可直接抄袭源码。
2. **严禁上传涉密信息**：
   - 严禁上传含有国家秘密、涉及保密科研军工项目、或学校明确声明“严禁公开”的内部绝密试卷。
3. **尊重版权，合法引用**：
   - 笔记与题解请尽量使用自己的语言进行原创梳理。
   - 如引用任课教师 PPT、教材图表或公开论文，请在文末清晰注明来源作者与出处。

---

感谢你的付出，祝你代码无 Bug，逢考必高分！🎉