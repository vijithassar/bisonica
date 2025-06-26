const config = {
    extends: ['@commitlint/config-conventional'],
    "rules": {
        'body-case': [0],
        'body-max-line-length': [0],
        'body-leading-blank': [2, 'always'],
        'footer-empty': [0],
        'footer-max-line-length': [0],
        'references-empty': [0],
        'signed-off-by': [0],
        'scope-case': [2, 'always', 'lower-case'],
        'scope-empty': [2, 'never'],
        'scope-enum': [2, 'always', ['core', 'tooling', 'tests', 'docs']],
        'type-enum': [2, 'always', ['chore', 'fix', 'feat']]
    },
};

module.exports = config;
