module.exports = {
    root: true,

    env: {
        es2020: true,
        node: true,
    },

    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],

    parser: "@typescript-eslint/parser",

    plugins: ["@typescript-eslint"],

    rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/ban-types": "off"
    },
};
