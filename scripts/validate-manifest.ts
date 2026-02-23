import { readFileSync } from "fs";
import { parse } from "yaml";
import { DB_IDS } from "../src/config.js";

type Relation = { name: string; target: string; dual_name_in_target: string };

const manifestPath = "manifests/nos.yaml";
const allowedTypes = new Set([
    "select",
    "multi_select",
    "date",
    "checkbox",
    "number",
    "url",
    "files",
    "rich_text",
    "email",
    "phone_number",
    "rollup"
]);

function validate(): void {
    const raw = readFileSync(manifestPath, "utf8");
    const manifest = parse(raw) as any;

    const errors: string[] = [];
    const warnings: string[] = [];

    // DB keys
    const manifestDbKeys = Object.keys(manifest.databases || {});
    for (const key of manifestDbKeys) {
        if (!(key in DB_IDS)) {
            warnings.push(`DB '${key}' en manifest no existe en src/config.ts`);
        }
    }
    for (const key of Object.keys(DB_IDS)) {
        if (!manifestDbKeys.includes(key)) {
            warnings.push(`DB '${key}' en src/config.ts no está en manifest`);
        }
    }

    // Properties and relations
    for (const [dbKey, dbCfg] of Object.entries<any>(manifest.databases || {})) {
        if (!dbCfg.properties) continue;

        for (const [propName, propCfg] of Object.entries<any>(dbCfg.properties)) {
            if (!allowedTypes.has(propCfg.type)) {
                errors.push(`DB ${dbKey}: propiedad '${propName}' usa tipo no soportado '${propCfg.type}'`);
            }
        }

        const relations: Relation[] = dbCfg.relations_to_add_later || [];
        for (const rel of relations) {
            if (!(rel.target in DB_IDS)) {
                errors.push(`DB ${dbKey}: relación '${rel.name}' apunta a '${rel.target}' que no existe en config`);
            }
            if (!rel.dual_name_in_target) {
                warnings.push(`DB ${dbKey}: relación '${rel.name}' sin dual_name_in_target`);
            }
        }
    }

    if (warnings.length) {
        console.warn("WARNINGS:");
        warnings.forEach(w => console.warn(` - ${w}`));
    }

    if (errors.length) {
        console.error("ERRORS:");
        errors.forEach(e => console.error(` - ${e}`));
        process.exit(1);
    }

    console.log("Manifest validation OK");
}

validate();
