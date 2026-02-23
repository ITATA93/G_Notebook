import tseslint from "typescript-eslint";

export default tseslint.config([
    {
        ignores: ["dist", "node_modules"]
    },
    ...tseslint.configs.recommended,
    {
        files: ["**/*.ts"],
        languageOptions: {
            parserOptions: {
                project: false
            }
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off"
        }
    }
]);
