# 关于本项目与资料共建指南

欢迎来到**开源高校课程资源导航站**！本项目致力于汇聚高校各专业培养方案、优质课程攻略、实验报告指引、期末复习题解与历年真题资料，让知识在学长学姐与学弟学妹之间薪火相传。

---

## 🚀 如何为本校 Fork 复用此模板？

如果您希望为自己的高校或学院搭建专属的课程攻略站，只需简单 3 步：

1. **Fork 本仓库** 到您的个人或学生组织 GitHub 账号。
2. **修改基础配置**：
   - 打开 `src/config/siteConfig.ts`：修改网站标题 `title`、副标题 `subtitle` 与域名。
   - 打开 `src/config/courseConfig.ts`：按本校的培养计划调整开课学期 `semesters` 与学科方向 `categories`。
3. **添加课程内容**：
   - 在本地运行 `pnpm new-course 课程名称 [学期] [分类]` 脚手架，即可在 `src/content/courses/` 自动生成格式规范的 Markdown 模板。
   - 填写课程经验后提交代码，即可通过 GitHub Pages、Vercel 或 Cloudflare 免费一键自动化部署上线！

---

## 📝 贡献指南 (Contribution Guide)

我们极度渴望并热烈欢迎来自同学们的点滴贡献！您可以贡献：
- 💡 **选课经验与避坑建议**：授课风格、平时作业量、期末考核方式。
- 🧪 **实验与大作业攻略**：实验步骤梳理、开发环境配置、常见报错解决。
- 📚 **优质学习资料推荐**：推荐 B 站优质网课、国内外名校公开课、经典参考教材。
- 📄 **历年试卷与考点回忆**：历年期中/期末考题型分布、高频考点。

### 提交 PR 步骤

```bash
# 1. 克隆您 Fork 的仓库
git clone https://github.com/<your-username>/course-resources.git
cd course-resources

# 2. 安装依赖 (推荐 pnpm)
pnpm install

# 3. 运行本地开发服务器实时预览
pnpm dev

# 4. 创建或修改 src/content/courses/ 对应的课程 Markdown 文件

# 5. 提交并向主仓库发起 Pull Request
git add .
git commit -m "docs: 补充数据结构与算法期末复习考点"
git push origin main
```

---

## ⚖️ 免责声明与版权提示

1. 本站收录的所有学习资料、笔记与复习指南均为开源学习交流用途。
2. 严禁上传任何带有国家秘密、高校保密科研项目或直接涉及未公开考试泄密的非法材料。
3. 知识共享，共同成长！
