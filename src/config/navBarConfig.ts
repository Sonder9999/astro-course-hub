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

	// 首页（通告与帖子）
	links.push(LinkPresets.Home);

	// 课程（独立课程中心）
	links.push(LinkPresets.Courses);

	// 社交及其子菜单（友链与留言在同一个折叠内）
	links.push({
		name: "社交",
		url: "#",
		icon: "material-symbols:group",
		children: [LinkPresets.Friends, LinkPresets.Guestbook],
	});

	// 书签与学习资源导航（如果开启）
	links.push(LinkPresets.Booknav);

	// 关于与贡献（下拉展开关于本站与 GitHub 仓库）
	links.push({
		name: "关于与贡献",
		url: "#",
		icon: "material-symbols:info-outline",
		children: [
			LinkPresets.About,
			{
				name: "GitHub",
				url: "https://github.com/CuteLeaf/Firefly",
				external: true,
				icon: "fa7-brands:github",
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
// 链接预设 - 站点导航预设
// ============================================================================
export const LinkPresets: Record<string, NavBarLink> = {
	Home: {
		name: "首页",
		url: "/",
		icon: "material-symbols:home-outline",
	},
	Courses: {
		name: "课程",
		url: "/courses/",
		icon: "material-symbols:school-outline",
	},
	Archive: {
		name: "文章归档",
		url: "/archive/",
		icon: "material-symbols:archive-outline",
	},
	Categories: {
		name: "全部分类",
		url: "/categories/",
		icon: "material-symbols:category-outline",
	},
	Tags: {
		name: "全部标签",
		url: "/tags/",
		icon: "material-symbols:label-outline",
	},
	Friends: {
		name: "友链",
		url: "/friends/",
		icon: "material-symbols:link-2-rounded",
		pageKey: "friends",
	},
	Guestbook: {
		name: "留言",
		url: "/guestbook/",
		icon: "material-symbols:chat",
		pageKey: "guestbook",
	},
	Booknav: {
		name: "资源导航",
		url: "/booknav/",
		icon: "material-symbols:bookmarks-outline",
		pageKey: "booknav",
	},
	About: {
		name: "关于本站",
		url: "/about/",
		icon: "material-symbols:person",
	},
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
