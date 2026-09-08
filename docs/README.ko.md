<div align="center">

# 🎓 대학교 강의 자료 내비게이션 / Astro Course Hub

> 현대적이고 즉시 사용 가능한 대학교 강의 자료 내비게이션 및 실러버스 리더 템플릿  
> 대학, 학과 및 학생 오픈소스 커뮤니티를 위해 구축되어 학습 노하우와 기출 자료를 다음 세대로 계승합니다 ✨

![Node.js >= 22](https://img.shields.io/badge/node.js-%3E%3D22-brightgreen)
![pnpm >= 11](https://img.shields.io/badge/pnpm-%3E%3D11-blue)
![Astro](https://img.shields.io/badge/Astro-7.2.10-orange)
![Svelte](https://img.shields.io/badge/Svelte-5.57.0-red)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

📖 README:
**[简体中文](../README.md)** | **[繁體中文](README.zh-TW.md)** | **[English](../README.en.md)** | **[日本語](README.ja.md)** | **[한국어](README.ko.md)**

🚀 빠른 링크:
[**🖥️ 라이브 데모**](https://courses.example.edu.cn) /
[**📝 기여 가이드**](../CONTRIBUTING.md) /
[**💡 강의 실러버스 예시**](../src/content/courses/cs101-c-programming.md) /
[**⚙️ 설정 문서**](../src/config/README.md)

⚡ **초고속 정적 사이트**: Astro 7 SSG 기반의 빠른 초기 로딩 및 내장 SEO 최적화  
🍱 **Bento 대시보드**: 학기 및 전공별 실시간 다차원 필터링과 퍼지 검색  
📖 **우아한 실러버스 읽기**: KaTeX 수식, Mermaid 다이어그램, 코드 하이라이트 및 Admonition 지원  
🔍 **오프라인 전체 텍스트 검색**: Pagefind 기반 클라이언트 밀리초 단위 검색  
🔧 **완전한 범용성**: 특정 대학 하드코딩 없이 설정 파일만으로 간편한 커스터마이징 및 Fork 가능  
📱 **반응형 디자인**: 데스크톱, 태블릿, 모바일 완벽 대응

---

>[!TIP]
>
>**Astro Course Hub**는 대학, 학부 및 학생 오픈소스 커뮤니티를 위해 제작된 **범용 강의 자료 내비게이션 템플릿**입니다.
>
>Astro 블로그 테마 [Firefly](https://github.com/CuteLeaf/Firefly) 및 [fuwari](https://github.com/saicaca/fuwari)를 기반으로 대대적으로 리팩터링되었습니다. 기존 개인 블로그 포스트 구조를 **구조화된 강의 스키마(Course Schema)**로 전환하여 유려한 디자인을 유지하면서 대학 커리큘럼에 최적화된 자료 탐색 기능을 제공합니다.
>
>이 저장소를 **Fork**한 후 본인 대학교의 학기 체계와 커리큘럼에 맞춰 설정하고 배포해 보세요!

---

## ✨ 핵심 기능

- [x] **Bento Grid 대시보드** - 깔끔하고 직관적인 카드형 대시보드
- [x] **실시간 다차원 필터링** - 개설 학기(1학년~4학년/교양 등) 및 전공 분류별 즉시 필터링
- [x] **즉시 검색** - 강의명, 강의 코드(예: CS101), 교수명, 설명, 태그 기반 고속 검색
- [x] **Markdown / MDX 리더** - 각 강의의 README.md 문서를 아름답게 렌더링
- [x] **KaTeX 수식 엔진** - 인라인 `$E=mc^2$` 및 블록 수식 지원
- [x] **Mermaid 차트 지원** - 플로우차트와 시퀀스 다이어그램 작성 지원
- [x] **Expressive Code** - 줄 강조 및 복사 기능을 갖춘 코드 블록
- [x] **Pagefind 오프라인 검색** - 서버 없이 작동하는 초고속 클라이언트 검색

---

## 🚀 빠른 시작 (Fork 가이드)

1. **저장소 Fork 및 클론**
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```
2. **의존성 설치**
   ```bash
   pnpm install
   ```
3. **사이트 및 강의 설정 커스터마이징**
   - `src/config/siteConfig.ts`: 대학명, 사이트 제목, 테마 색상 설정
   - `src/config/courseConfig.ts`: 학기 목록(`semesters`), 전공 분류(`categories`) 설정
4. **로컬 개발 서버 실행**
   ```bash
   pnpm dev
   ```
5. **강의 추가**
   ```bash
   pnpm new-course "자료구조와 알고리즘" "大二上" "전공핵심"
   ```

---

## ⚙️ 강의 Frontmatter 규격 (Course Schema)

```yaml
---
title: "프로그래밍 기초 (C/C++)"
titleEn: "Fundamentals of Programming"
code: "CS101"
semester: "大一上"
category: "기초과목"
tags: ["필수", "실습포함", "기출문제"]
description: "컴퓨터공학 입문 강의..."
credits: 4.0
hours: 64
instructors: ["컴퓨터공학과 교수진"]
prerequisites: ["선수과목 없음"]
difficulty: 3.5
repoUrl: "https://github.com/..."
externalLinks:
  - name: "온라인 저지 실습"
    url: "https://..."
    icon: "material-symbols:terminal-outline"
icon: "material-symbols:code-blocks"
order: 10
draft: false
---
```

---

## ⚖️ 학술 윤리 및 면책 조항

1. **학습 지원 목적**: 본 사이트의 자료와 풀이는 학생 간 상호 학습 교류 목적으로만 제공됩니다.
2. **학술 윤리 준수**: 본 플랫폼을 시험 부정행위나 과제 대리 작성, 표절에 사용하는 것은 엄격히 금지됩니다.
3. **비공개 자료 금지**: 학교 규정상 비공개인 기밀 시험지 원본이나 대외비 연구 자료를 업로드할 수 없습니다.
4. **저작권 존중**: 출처를 명확히 표기하고 원작자의 저작권을 존중해 주세요.

---

## 📝 라이선스

본 프로젝트는 [MIT 라이선스](../LICENSE)에 따라 오픈소스로 제공됩니다.
