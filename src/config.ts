/**
 * Centralized configuration for NOs system
 * All database IDs, API endpoints, and constants
 */

export const DB_IDS = {
    DB_AREAS: "2d7af5db-be15-81e9-9630-e633d6cf9075",
    DB_SUBCATEGORIES: "2d7af5db-be15-81ba-95d5-dde79aa4269b",
    DB_PROJECTS: "2d7af5db-be15-8196-82b3-d75c37b2ee36",
    DB_MASTER_TASKS: "2d7af5db-be15-8127-8d03-c72f11529b00",
    DB_KNOWLEDGE_BASE: "2d7af5db-be15-8130-aa16-ff4dd56adb1c",
    DB_ENTITIES_ASSETS: "2d7af5db-be15-81a6-8b64-ec068dfda52a",
    DB_FINANCE_LEDGER: "2d7af5db-be15-8128-a6d1-c05bdc6d1e5e",
    DB_SURGICAL_LOG: "2d7af5db-be15-81cf-9144-f1d0d78f34b7",
    DB_METRICS_LOG: "2d7af5db-be15-811b-a7d9-ebf5696bb191",
    DB_CANVAS_COURSES: "2d7af5db-be15-8186-8bf7-ca541cf17322",
    DB_EMAILS: "2d7af5db-be15-81f0-b474-db03492a67eb",
    DB_MEETINGS_CLASSES: "2d7af5db-be15-810e-9d14-ec2345c95ba3",
} as const;

export type DatabaseKey = keyof typeof DB_IDS;

// API Configuration
export const NOTION_API_VERSION = "2025-09-03";
export const NOTION_BASE_URL = "https://api.notion.com/v1";

export const N8N_BASE_URL = "https://n8n.imedicina.cl";

export const CANVAS_DEFAULT_URL = "https://uandes.instructure.com";

// File Paths
export const MANIFEST_PATH = "manifests/nos.yaml";
export const ENV_FILE = ".env";

// Rate Limits
export const NOTION_RATE_LIMIT = 3; // requests per second
export const GMAIL_RATE_LIMIT = 250; // quota units per second

// Demo Data
export const DEMO_PREFIX = "[DEMO]";

// Notion Page Names
export const ROOT_PAGE_NAME = "NOs";
