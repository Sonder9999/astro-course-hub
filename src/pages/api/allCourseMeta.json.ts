import { getCourseListData } from "@/utils/course-utils";

export async function GET(): Promise<Response> {
	const courses = await getCourseListData();

	return new Response(JSON.stringify(courses), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
	});
}
