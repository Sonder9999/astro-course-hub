import { defineCollection } from "astro:content";
import type { CollectionConfig } from "astro/content/config";
import { glob } from "astro/loaders";
import { type ZodType, z } from "astro/zod";

type PostData = {
	title: string;
	published: Date;
	updated?: Date;
	draft: boolean;
	description: string;
	image: string;
	tags: string[];
	category: string | null;
	lang: string;
	pinned: boolean;
	author: string;
	sourceLink: string;
	licenseName: string;
	licenseUrl: string;
	comment: boolean;
	password: string;
	passwordHint: string;
	series: string;
	seriesOrder?: number;
	prevTitle: string;
	prevSlug: string;
	nextTitle: string;
	nextSlug: string;
};

type DynamicData = {
	published: Date;
	pinned: boolean;
	location: string;
};

type ExternalLink = {
	name: string;
	url: string;
	icon?: string;
};

type CourseData = {
	title: string;
	titleEn?: string;
	code?: string;
	semester: string;
	category: string;
	major: string | string[];
	tags: string[];
	description: string;
	credits?: number;
	hours?: number;
	instructors: string[];
	prerequisites: string[];
	difficulty?: number;
	repoUrl: string;
	externalLinks: ExternalLink[];
	icon: string;
	image: string;
	order?: number;
	draft: boolean;
	published?: Date;
	updated?: Date;
	comment: boolean;
	prevTitle?: string;
	prevSlug?: string;
	nextTitle?: string;
	nextSlug?: string;
};

type ContentCollection<T> = CollectionConfig<
	ZodType<T>,
	ReturnType<typeof glob>
>;

const coursesCollection: ContentCollection<CourseData> = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/courses" }),
	schema: z.object({
		title: z.string(),
		titleEn: z.string().optional().default(""),
		code: z.string().optional().default(""),
		semester: z.string(),
		category: z.string(),
		major: z
			.union([z.string(), z.array(z.string())])
			.optional()
			.default("公共课"),
		tags: z.array(z.string()).optional().default([]),
		description: z.string().optional().default(""),
		credits: z.number().optional().default(3),
		hours: z.number().optional().default(48),
		instructors: z.array(z.string()).optional().default([]),
		prerequisites: z.array(z.string()).optional().default([]),
		difficulty: z.number().optional().default(3),
		repoUrl: z.string().optional().default(""),
		externalLinks: z
			.array(
				z.object({
					name: z.string(),
					url: z.string(),
					icon: z.string().optional(),
				}),
			)
			.optional()
			.default([]),
		icon: z.string().optional().default("material-symbols:book-2-outline"),
		image: z.string().optional().default(""),
		order: z.number().optional().default(100),
		draft: z.boolean().optional().default(false),
		published: z.date().optional(),
		updated: z.date().optional(),
		comment: z.boolean().optional().default(true),

		/* For internal navigation use */
		prevTitle: z.string().optional().default(""),
		prevSlug: z.string().optional().default(""),
		nextTitle: z.string().optional().default(""),
		nextSlug: z.string().optional().default(""),
	}),
});

const postsCollection: ContentCollection<PostData> = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),
		author: z.string().optional().default(""),
		sourceLink: z.string().optional().default(""),
		licenseName: z.string().optional().default(""),
		licenseUrl: z.string().optional().default(""),
		comment: z.boolean().optional().default(true),
		password: z.string().optional().default(""),
		passwordHint: z.string().optional().default(""),
		series: z.string().optional().default(""),
		seriesOrder: z.number().optional(),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

const specCollection: ContentCollection<Record<string, never>> =
	defineCollection({
		loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spec" }),
		schema: z.object({}),
	});

const dynamicCollection: ContentCollection<DynamicData> = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/dynamic" }),
	schema: z.object({
		published: z.date(),
		pinned: z.boolean().optional().default(false),
		location: z.string().optional().default(""),
	}),
});

export const collections: {
	courses: typeof coursesCollection;
	dynamic: typeof dynamicCollection;
	posts: typeof postsCollection;
	spec: typeof specCollection;
} = {
	courses: coursesCollection,
	dynamic: dynamicCollection,
	posts: postsCollection,
	spec: specCollection,
};
