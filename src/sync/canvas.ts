/**
 * Canvas LMS Unified Sync
 * Syncs courses to DB_CANVAS_COURSES and assignments to DB_MASTER_TASKS
 */

import { Client } from "@notionhq/client";
import axios from "axios";
import { DB_IDS, CANVAS_DEFAULT_URL } from "../config.js";
import { getAllDatabasePages, retryWithBackoff, notionRateLimiter } from "../utils/helpers.js";

interface CanvasAssignment {
    id: number;
    name: string;
    due_at: string | null;
    html_url: string;
}

interface CanvasCourse {
    id: number;
    name: string;
    course_code: string;
}

function getRichTextValue(page: any, propertyName: string): string | undefined {
    const property = page.properties?.[propertyName];
    if (!property || property.type !== "rich_text") return undefined;
    return property.rich_text?.[0]?.plain_text;
}

function parseLinkHeader(linkHeader?: string): Record<string, string> {
    if (!linkHeader) return {};
    return linkHeader.split(",").reduce<Record<string, string>>((acc, part) => {
        const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
        if (match) {
            acc[match[2]] = match[1];
        }
        return acc;
    }, {});
}

async function fetchCanvasPaginated<T>(
    canvasApi: ReturnType<typeof axios.create>,
    path: string,
    params: Record<string, string | number | boolean> = {}
): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | null = null;
    let isFirstRequest = true;

    do {
        const response = await canvasApi.get<T[]>(nextUrl ?? path, {
            params: isFirstRequest ? { ...params, per_page: 100 } : undefined
        });
        results.push(...response.data);
        const links = parseLinkHeader(response.headers?.link);
        nextUrl = links.next ?? null;
        isFirstRequest = false;
    } while (nextUrl);

    return results;
}

/**
 * Sync Canvas courses and assignments to Notion
 */
export async function syncCanvas(
    canvasToken: string,
    notionToken: string,
    canvasUrl: string = CANVAS_DEFAULT_URL,
    dryRun: boolean = false
): Promise<void> {
    if (dryRun) {
        console.log("DRY-RUN: se inspeccionará Canvas pero no se escribirán datos en Notion.");
    }

    const notion = new Client({ auth: notionToken });
    const canvasApi = axios.create({
        baseURL: `${canvasUrl}/api/v1`,
        headers: { Authorization: `Bearer ${canvasToken}` }
    });

    console.log("=".repeat(80));
    console.log("UNIFIED CANVAS SYNC");
    console.log("=".repeat(80));

    console.log("\n🔎 Cargando registros existentes desde Notion...");
    const existingCourses = await retryWithBackoff(async () => {
        return getAllDatabasePages(notion, DB_IDS.DB_CANVAS_COURSES);
    });
    const existingTasks = await retryWithBackoff(async () => {
        return getAllDatabasePages(notion, DB_IDS.DB_MASTER_TASKS);
    });

    const courseByExternalId = new Map<string, string>();
    for (const page of existingCourses) {
        const externalId = getRichTextValue(page, "External ID");
        if (externalId) {
            courseByExternalId.set(externalId, page.id);
        }
    }

    const taskByExternalId = new Map<string, string>();
    for (const page of existingTasks) {
        const externalId = getRichTextValue(page, "ID_Evento_Tarea");
        if (externalId) {
            taskByExternalId.set(externalId, page.id);
        }
    }

    // 1. Get active courses
    console.log("\n📚 Getting active courses...");
    const courses = await retryWithBackoff(async () => {
        return fetchCanvasPaginated<CanvasCourse>(canvasApi, "/courses", {
            enrollment_state: "active"
        });
    });

    console.log(`   Found ${courses.length} active courses`);

    for (const course of courses) {
        console.log(`\n   ▶ Processing: ${course.name}`);

        // 2. Create/Update course in DB_CANVAS_COURSES
        const courseExternalId = `canvas_course_${course.id}`;

        const courseProps: any = {
            Nombre: { title: [{ text: { content: course.name } }] },
            "External ID": { rich_text: [{ text: { content: courseExternalId } }] },
            "Código Curso": { rich_text: [{ text: { content: course.course_code } }] },
            Estado: { select: { name: "En Progreso" } }
        };

        let coursePageId = courseByExternalId.get(courseExternalId);

        if (coursePageId) {
            if (dryRun) {
                console.log(`      DRY-RUN: actualizaría curso ${course.name}`);
            } else {
                await retryWithBackoff(async () => {
                    await notionRateLimiter.waitIfNeeded();
                    await notion.pages.update({ page_id: coursePageId, properties: courseProps });
                });
                console.log(`      ✅ Course updated`);
            }
        } else {
            if (dryRun) {
                console.log(`      DRY-RUN: crearía curso ${course.name}`);
            } else {
                const created = await retryWithBackoff(async () => {
                    await notionRateLimiter.waitIfNeeded();
                    return notion.pages.create({
                        parent: { database_id: DB_IDS.DB_CANVAS_COURSES },
                        properties: courseProps
                    });
                });
                coursePageId = created.id;
                courseByExternalId.set(courseExternalId, coursePageId);
                console.log(`      ✅ Course created`);
            }
        }

        // 3. Get assignments for this course
        const assignments = await retryWithBackoff(async () => {
            return fetchCanvasPaginated<CanvasAssignment>(canvasApi, `/courses/${course.id}/assignments`);
        });

        console.log(`      📄 ${assignments.length} assignments found`);

        // 4. Create/Update assignments in DB_MASTER_TASKS
        for (const assignment of assignments) {
            const taskExternalId = `canvas_assignment_${assignment.id}`;
            const status = assignment.due_at && new Date(assignment.due_at) < new Date()
                ? "Completado"
                : "Siguiente";

            const taskProps: any = {
                Nombre: { title: [{ text: { content: assignment.name } }] },
                Fuente: { select: { name: "Canvas" } },
                Tipo: { select: { name: "Tarea" } },
                Estado: { select: { name: status } },
                Contexto: { multi_select: [{ name: "Compus" }] },
                ID_Evento_Tarea: { rich_text: [{ text: { content: taskExternalId } }] },
                "Link Original": { url: assignment.html_url },
                Notas: { rich_text: [{ text: { content: `Course: ${course.name}` } }] }
            };

            if (coursePageId) {
                taskProps["Curso Canvas"] = { relation: [{ id: coursePageId }] };
            }

            if (assignment.due_at) {
                taskProps.Fecha = { date: { start: assignment.due_at } };
            }

            const existingTaskId = taskByExternalId.get(taskExternalId);
            if (existingTaskId) {
                if (dryRun) {
                    console.log(`         DRY-RUN: actualizaría tarea ${assignment.name}`);
                } else {
                    await retryWithBackoff(async () => {
                        await notionRateLimiter.waitIfNeeded();
                        await notion.pages.update({
                            page_id: existingTaskId,
                            properties: taskProps
                        });
                    });
                }
            } else {
                if (dryRun) {
                    console.log(`         DRY-RUN: crearía tarea ${assignment.name}`);
                } else {
                    const created = await retryWithBackoff(async () => {
                        await notionRateLimiter.waitIfNeeded();
                        return notion.pages.create({
                            parent: { database_id: DB_IDS.DB_MASTER_TASKS },
                            properties: taskProps
                        });
                    });
                    taskByExternalId.set(taskExternalId, created.id);
                    console.log(`         ✅ New task: ${assignment.name}`);
                }
            }
        }
    }

    console.log(dryRun ? "\n✔️ Canvas audit completed (no writes)" : "\n✅ Canvas sync completed");
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const canvasToken = process.argv[2];
    const notionToken = process.argv[3];
    const canvasUrl = process.argv[4];
    const dryRun = process.argv.includes("--dry-run");

    if (!canvasToken || !notionToken) {
        console.error("Usage: tsx src/sync/canvas.ts <CANVAS_TOKEN> <NOTION_TOKEN> [CANVAS_URL] [--dry-run]");
        process.exit(1);
    }

    syncCanvas(canvasToken, notionToken, canvasUrl, dryRun).catch(console.error);
}
