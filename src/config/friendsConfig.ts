import type { FriendLink, FriendsPageConfig } from "../types/friendsConfig";

// 友链/兄弟院校页面配置
export const friendsPageConfig: FriendsPageConfig = {
	title: "兄弟院校开源群星录",
	description: "汇聚全国高校优质开源课程资料、攻略共享与学习指南项目",
	showCustomContent: true,
	showComment: true,
	randomizeSort: false,
};

// 兄弟院校开源课程项目列表
export const friendsConfig: FriendLink[] = [
	{
		title: "浙江大学 · 课程攻略共享计划",
		imgurl: "https://avatars.githubusercontent.com/u/10419842?v=4&s=640",
		desc: "浙大学子发起的开源课程攻略共享计划 (ZJU Icicles)，国内高校开源课程运动先驱。",
		siteurl: "https://qsctech.github.io/zju-icicles/",
		tags: ["浙江大学", "综合大类", "老牌标杆"],
		weight: 100,
		enabled: true,
	},
	{
		title: "北京大学 · 课程资料民间整理",
		imgurl: "https://avatars.githubusercontent.com/u/40149021?v=4&s=640",
		desc: "北京大学民间整理开源课程资料库 (libpku)，涵盖理学、信息科学等全学科复习与实验资源。",
		siteurl: "https://libpku.github.io/",
		tags: ["北京大学", "全学科", "通识与核心"],
		weight: 95,
		enabled: true,
	},
	{
		title: "清华大学 · 计算机系课程攻略",
		imgurl: "https://avatars.githubusercontent.com/u/22588102?v=4&s=640",
		desc: "清华大学计算机系课程攻略 (THU-CST-Cracker)，包含硬核专业课大作业、实验代码与复习纲要。",
		siteurl: "https://github.com/ThuOpenTech/THU-CST-Cracker",
		tags: ["清华大学", "计算机科学", "硬核进阶"],
		weight: 90,
		enabled: true,
	},
	{
		title: "中国科学技术大学 · 课程资源",
		imgurl: "https://avatars.githubusercontent.com/u/49257608?v=4&s=640",
		desc: "中国科大 (USTC) 课程资源共享平台，数理基础极度深厚，涵盖高数、线代、力热光电及计科核心。",
		siteurl: "https://github.com/USTC-Resource/USTC-Course",
		tags: ["中国科大", "数理基础", "理工强校"],
		weight: 85,
		enabled: true,
	},
	{
		title: "上海交通大学 · 课程资料分享",
		imgurl: "https://avatars.githubusercontent.com/u/48858348?v=4&s=640",
		desc: "上海交大电院与计系学子自发整理的历年试卷、实验作业与选课心得汇总。",
		siteurl: "https://github.com/SJTU-Courses",
		tags: ["上海交大", "电子信息", "期末复习"],
		weight: 80,
		enabled: true,
	},
	{
		title: "南京大学 · 开放课程指南",
		imgurl: "https://avatars.githubusercontent.com/u/10839446?v=4&s=640",
		desc: "南京大学计算机系开源课程与实验指引，包含深受全国学子好评的 ICS、OS 等硬核基础课。",
		siteurl: "https://ics-pa.org",
		tags: ["南京大学", "计算机系统", "名师公开课"],
		weight: 75,
		enabled: true,
	},
];

// 获取启用的友链并进行排序
export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);

	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}

	return friends.sort((a, b) => b.weight - a.weight);
};
