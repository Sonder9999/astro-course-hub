import {
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/navBarConfig";

// ============================================================================
// 导航栏配置 - 高校课程资源导航站
// NavBar Configuration - College Course Resource Hub
// ============================================================================
const getDynamicNavBarConfig = (): NavBarConfig => {
	const links: NavBarLink[] = [];

	// 首页（Bento Grid 课程仪表盘）
	links.push(LinkPresets.Home);

	// 课程与培养方案菜单
	links.push({
		name: "课程索引",
		url: "#",
		icon: "material-symbols:school-outline",
		children: [
			LinkPresets.Curriculum,
			LinkPresets.Categories,
			LinkPresets.Tags,
		],
	});

	// 兄弟院校开源群星录
	links.push(LinkPresets.Friends);

	// 书签与学习资源导航（如果开启）
	links.push(LinkPresets.Booknav);

	// 交流与反馈
	links.push(LinkPresets.Guestbook);

	// 关于与贡献指南
	links.push(LinkPresets.About);

	// 开源仓库与链接
	links.push({
		name: "开源项目",
		url: "#",
		icon: "material-symbols:code-blocks-outline",
		children: [
			{
				name: "GitHub 仓库",
				url: "https://github.com/example-univ/course-resources",
				external: true,
				icon: "fa7-brands:github",
			},
			{
				name: "贡献指南",
				url: "/about/#贡献指南",
				icon: "material-symbols:volunteer-activism-outline",
			},
		],
	});

	return { links } as NavBarConfig;
};

// 导航搜索配置（基于 Pagefind 离线搜索）
export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

// ============================================================================
// 链接预设 - 高校课程资源导航站预设
// ============================================================================
export const LinkPresets: Record<string, NavBarLink> = {
	Home: {
		name: "课程导航",
		url: "/",
		icon: "material-symbols:dashboard-customize-outline",
	},
	Curriculum: {
		name: "培养方案地图",
		url: "/archive/",
		icon: "material-symbols:calendar-clock-outline",
	},
	Categories: {
		name: "学科方向",
		url: "/categories/",
		icon: "material-symbols:category-outline",
	},
	Tags: {
		name: "课程标签",
		url: "/tags/",
		icon: "material-symbols:label-outline",
	},
	Friends: {
		name: "兄弟院校",
		url: "/friends/",
		icon: "material-symbols:hub-outline",
		pageKey: "friends",
	},
	Booknav: {
		name: "资源导航",
		url: "/booknav/",
		icon: "material-symbols:bookmarks-outline",
		pageKey: "booknav",
	},
	Guestbook: {
		name: "课程问答",
		url: "/guestbook/",
		icon: "material-symbols:forum-outline",
		pageKey: "guestbook",
	},
	About: {
		name: "关于与贡献",
		url: "/about/",
		icon: "material-symbols:info-outline",
	},
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
