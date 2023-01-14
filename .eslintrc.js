module.exports = {
  extends: [
    'alloy',
    'alloy/typescript'
  ],
  globals:{
    NodeJS: true,
    BufferEncoding: true,
  },
  rules: {
    'arrow-parens': 'error',
    complexity: 'off',
    'guard-for-in': 'off',
    'max-params': ['error', 6],
    'max-nested-callbacks': ['error', 4],
    // 禁止不必要的布尔转换
    'no-extra-boolean-cast': 'error',
    // 禁止不必要的括号
    'no-extra-parens': 'off',
    // 强制使用有效的 JSDoc 注释
    // 'valid-jsdoc': 'error',
    // 类的箭头函数方法中的this会被误判
    'no-invalid-this': 'off',
    'no-param-reassign': 'off',
    'no-return-await': 'off',
    'no-unused-vars': 'off',
    'no-undefined': 'off',
    'no-shadow': 'error',
    'object-curly-spacing': ['error', 'always'],
    'prefer-template': 'error',
    'prefer-object-spread': 'off',
    radix: 'off',
    'require-atomic-updates': 'off',
    // 允许使用 { ... } as XXX
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/method-signature-style': 'off',
    '@typescript-eslint/no-dynamic-delete': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/no-require-imports': 'warn',
    '@typescript-eslint/prefer-function-type': 'off',
    '@typescript-eslint/prefer-optional-chain': 'off',
    '@typescript-eslint/unified-signatures': 'off',
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: [
          'public-static-field',
          'protected-static-field',
          'private-static-field',

          'public-instance-field',
          'protected-instance-field',
          'private-instance-field',

          'public-field',
          'protected-field',
          'private-field',

          'static-field',
          'instance-field',

          'field',

          'constructor',

          'public-static-method',
          'protected-static-method',
          'private-static-method',

          'public-instance-method',
          'protected-instance-method',
          'private-instance-method',

          'public-method',
          'protected-method',
          'private-method',

          'static-method',
          'instance-method',

          'method'
        ]
      }
    ]
  },
  overrides: [
    {
      files: ['*.d.ts'],
      rules: {
        'no-dupe-class-members': 'off',
        'no-use-before-define': 'off',
        'no-useless-constructor': 'off'
      }
    }
  ]
};
