/* This is a script to create a new course markdown file with front-matter */

import fs from "node:fs";
import path from "node:path";
import { pinyin } from "pinyin-pro";

function getDate() {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

const args = process.argv.slice(2);

if (args.length === 0) {
	console.error(`Error: No course name argument provided
Usage: pnpm new-course -- <CourseName> [semester] [category] [major]`);
	process.exit(1);
}

const courseTitle = args[0];
const semester = args[1] || "大一上";
const category = args[2] || "专业核心课";
const major = args[3] || "计算机科学与技术";

let fileName = courseTitle;
const fileExtensionRegex = /\.(md|mdx)$/i;
if (!fileExtensionRegex.test(fileName)) {
	fileName += ".md";
}

const targetDir = "./src/content/courses/";
const fullPath = path.join(targetDir, fileName);

// Generate slug from filename
let slug = fileName.replace(fileExtensionRegex, "");
if (slug.endsWith("/index")) {
	slug = slug.slice(0, -"/index".length);
}

slug = slug
	.split("/")
	.map((segment) => {
		if (!/[一-鿿]/.test(segment)) return segment;
		const chars = [...segment];
		const parts = [];
		let buf = "";
		for (const ch of chars) {
			if (/[一-鿿]/.test(ch)) {
				if (buf) {
					parts.push(buf);
					buf = "";
				}
				parts.push(pinyin(ch, { toneType: "none", type: "array" })[0]);
			} else {
				buf += ch;
			}
		}
		if (buf) parts.push(buf);
		return parts
			.join("-")
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");
	})
	.join("/");

if (fs.existsSync(fullPath)) {
	console.error(`Error: File ${fullPath} already exists`);
	process.exit(1);
}

const dirPath = path.dirname(fullPath);
if (!fs.existsSync(dirPath)) {
	fs.mkdirSync(dirPath, { recursive: true });
}

const content = `---
title: "${courseTitle}"
titleEn: ""
code: ""
semester: "${semester}"
category: "${category}"
major: "${major}"
tags: ["必修", "含实验"]
description: "课程简述与学习要点速览。"
credits: 3.0
hours: 48
instructors: []
prerequisites: []
difficulty: 3.5
repoUrl: "https://github.com/example-univ/course-resources"
externalLinks: []
icon: "material-symbols:book-2-outline"
order: 50
draft: false
published: ${getDate()}
updated: ${getDate()}
---

> [!NOTE]
> 欢迎在此添加该课程的选课攻略、实验经验以及复习笔记！

## 📖 课程概述

在这里填写课程基本介绍、教学大纲、授课教师风格与考核方式。

## 🧪 实验与大作业

介绍各次实验的要求、采坑点与避坑指南。

## 📚 推荐教材与学习资源

列出优质教材、网课与期末复习资料。
`;

fs.writeFileSync(fullPath, content);
console.log(`Course ${fullPath} created successfully!`);
