const globals = require("globals");
const js = require("@eslint/js");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");

module.exports = [
    {
        ignores: [
            "**/dist/**",
            // Old weekly dashboard code. Nothing imports these files any more; they are kept
            // until they are deleted, and are not linted.
            "client/src/components/Layout.jsx",
            "client/src/components/ParticleBackground.jsx",
            "client/src/components/WeekSection.jsx",
            "client/src/components/YearSection.jsx",
            "client/src/pages/Home.jsx",
            "client/src/pages/Random.jsx",
            "client/src/pages/Yearlies.jsx",
            "client/src/utils/particleSystem.js",
            "server/src/services/activity/**",
            "server/src/services/books/**",
            "server/src/services/cache/**",
            "server/src/services/places/**",
            "server/src/services/spotify/**",
            "server/src/services/weekDataService.js",
            "server/src/services/yearDataService.js",
            "server/src/utils/dateUtils.js",
            "server/src/utils/httpClient.js",
            "server/src/utils/imageValidator.js",
        ],
    },
    js.configs.recommended,
    {
        files: ["**/*.{js,jsx,mjs}"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            react: reactPlugin,
            "react-hooks": reactHooksPlugin,
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "no-console": ["warn", { allow: ["warn", "error"] }],
            quotes: ["error", "double", { avoidEscape: true }],
            semi: ["error", "always"],
            indent: ["error", 4, { SwitchCase: 1 }],
            "react/react-in-jsx-scope": "off", // Not needed in React 17+
            "react/prop-types": "warn",
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
];
