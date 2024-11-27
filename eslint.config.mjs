import jsdocPlugin from 'eslint-plugin-jsdoc';
import unicornPlugin from 'eslint-plugin-unicorn';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import cypressPlugin from 'eslint-plugin-cypress';
import noOnlyTestsPlugin from 'eslint-plugin-no-only-tests';
import eslintCommentsPlugin from 'eslint-plugin-eslint-comments';
import importPlugin from 'eslint-plugin-import';
import regexpPlugin from 'eslint-plugin-regexp';
import globals from 'globals';

export default [
    {
        languageOptions: {
            ecmaVersion: 12,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2021,
                ...globals.node,
                ...globals.webextensions,
                ...globals.amd,
                ...globals.cypress,
            },
        },
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
        plugins: {
            jsdoc: jsdocPlugin,
            unicorn: unicornPlugin,
            sonarjs: sonarjsPlugin,
            cypress: cypressPlugin,
            'no-only-tests': noOnlyTestsPlugin,
            'eslint-comments': eslintCommentsPlugin,
            import: importPlugin,
            regexp: regexpPlugin,
        },
        ignores: [
            '**/dist/**',
            '**/icons/**',
        ],
        rules: {
            'no-only-tests/no-only-tests': 'error',
            indent: ['warn', 4],
            quotes: ['warn', 'single', {avoidEscape: true}],
            'jsx-quotes': ['warn', 'prefer-double'],
            semi: ['warn', 'always'],
            complexity: ['warn', 30],
            eqeqeq: ['warn', 'always'],
            'no-eval': 'warn',
            'no-alert': 'warn',
            'no-return-await': 'warn',
            'no-implied-eval': 'warn',
            'no-trailing-spaces': 'warn',
            'no-var': 'warn',
            'keyword-spacing': 'warn',
            'key-spacing': 'warn',
            'no-self-compare': 'warn',
            'no-unmodified-loop-condition': 'warn',
            'no-useless-concat': 'warn',
            'no-label-var': 'warn',
            'no-use-before-define': 'warn',
            'no-implicit-coercion': 'warn',
            'global-require': 'warn',
            'spaced-comment': ['warn', 'always', {exceptions: ['/']}],
            'no-multiple-empty-lines': ['warn', {max: 2, maxEOF: 1}],
            'array-element-newline': ['warn', 'consistent'],
            'arrow-spacing': 'warn',
            'array-bracket-spacing': 'warn',
            'space-in-parens': 'warn',
            'object-curly-spacing': 'warn',
            'space-before-blocks': 'warn',
            'computed-property-spacing': 'warn',
            'array-callback-return': 'warn',
            'block-spacing': ['warn', 'always'],
            'padded-blocks': ['warn', 'never'],
            'comma-spacing': ['warn', {before: false, after: true}],
            'eol-last': ['warn', 'always'],
            'func-call-spacing': ['warn', 'never'],
            'max-len': ['warn', {code: 150, ignoreComments: true}],
            'max-params': ['warn', 7],
            'no-unneeded-ternary': 'warn',
            'no-useless-constructor': 'warn',
            'no-useless-computed-key': 'warn',
            'semi-style': ['warn', 'last'],
            'space-infix-ops': 'warn',
            'no-multi-spaces': 'warn',
            'jsdoc/require-jsdoc': [
                'warn',
                {
                    require: {
                        ArrowFunctionExpression: true,
                    },
                },
            ],
            'jsdoc/require-description': 'warn',
            'jsdoc/check-tag-names': [
                'warn',
                {
                    definedTags: ['jsx', 'component'],
                },
            ],
            'jsdoc/no-undefined-types': [
                'warn',
                {
                    definedTypes: ['ReactNode'],
                },
            ],
            'unicorn/prefer-module': 'off',
            'unicorn/no-anonymous-default-export': 'off',
            'unicorn/filename-case': 'off',
            'unicorn/no-array-callback-reference': 'off',
            'eslint-comments/disable-enable-pair': [
                'error',
                {
                    allowWholeFile: true,
                },
            ],
        },
    },
];
