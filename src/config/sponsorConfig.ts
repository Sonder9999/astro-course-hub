import type { SponsorConfig } from "../types/sponsorConfig";

// 赞助配置（高校课程导航站默认关闭赞助页面，若需接受校友/基金会捐赠可在此配置）
export const sponsorConfig: SponsorConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "支持与赞助",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description:
		"如果您觉得本站对您的大学学业有所帮助，欢迎支持我们维护服务器与开源运营！",

	// 打赏用途说明
	usage: "所有资助将全额用于服务器托管、域名续费及开源社区建设，账目公开透明。",

	// 是否显示打赏者列表
	showSponsorsList: false,

	// 是否显示评论区，需要先在commentConfig.ts启用评论系统
	showComment: false,

	// 是否在文章详情页底部显示打赏按钮（高校站建议关闭）
	showButtonInPost: false,

	// 打赏方式列表（示例占位）
	methods: [
		{
			name: "支付宝",
			icon: "fa7-brands:alipay",
			// 收款码图片路径（需将图片放置在 public 目录下，如 "/assets/images/sponsor/alipay.png"）
			qrCode: "",
			link: "",
			description: "使用支付宝扫码赞助",
			enabled: false,
		},
		{
			name: "微信支付",
			icon: "fa7-brands:weixin",
			qrCode: "",
			link: "",
			description: "使用微信扫码赞助",
			enabled: false,
		},
		{
			name: "GitHub Sponsors",
			icon: "simple-icons:githubsponsors",
			qrCode: "",
			link: "https://github.com/sponsors",
			description: "通过 GitHub Sponsors 资助项目",
			enabled: false,
		},
	],

	// 资助者列表（可选）
	sponsors: [],
};
