import type { AnnouncementConfig } from "../types/announcementConfig";

export const announcementConfig: AnnouncementConfig = {
	// 公告标题
	title: "这是公告标题",

	// 公告内容
	content: "这只是一个公告",

	// 是否允许用户关闭公告
	closable: true,

	link: {
		// 启用链接
		enable: true,
		// 链接文本
		text: "About",
		// 链接 URL
		url: "/astro-course-hub/about/",
		// 内部链接
		external: false,
	},
};
