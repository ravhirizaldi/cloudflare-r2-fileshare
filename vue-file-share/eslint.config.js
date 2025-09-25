import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  { ignores: ['dist', 'node_modules'] },

  // pake recommended bawaan eslint 9
  js.configs.recommended,

  ...pluginVue.configs['flat/recommended'],

  eslintConfigPrettier,

  {
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        FileList: 'readonly',
        Blob: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        IntersectionObserver: 'readonly',
        performance: 'readonly',
        process: 'readonly',
        requestIdleCallback: 'readonly',
        XMLHttpRequest: 'readonly',
        FileReader: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
]
