# NX Monorepo Setup & Build Process

## Project Structure

```
form-builder-monorepo/
├── packages/
│   ├── core/                           # Shared types, utilities, constants
│   ├── react/                          # React FormBuilder + FormRenderer
│   ├── design-tokens/                  # CSS modules for Lux DS integration
│   └── cli/                           # CLI tools for form management
├── apps/
│   ├── playground/                     # Next.js development environment
│   ├── docs/                          # Documentation site (Next.js)
│   └── examples/                       # Example implementations
├── tools/
│   ├── build-scripts/                  # Custom build utilities
│   └── eslint-config/                  # Shared linting configuration
├── dist/                              # Build outputs
└── nx.json                            # NX configuration
```

---

## NX Configuration

### `nx.json`
```json
{
  "npmScope": "form-builder",
  "affected": {
    "defaultBase": "main"
  },
  "workspaceLayout": {
    "appsDir": "apps",
    "libsDir": "packages"
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "test": {
      "inputs": ["default", "^production"]
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"]
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json"
    ],
    "sharedGlobals": []
  },
  "generators": {
    "@nx/react": {
      "application": {
        "babel": true
      }
    }
  }
}
```

### Root `package.json`
```json
{
  "name": "@form-builder/monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nx run-many -t build",
    "build:affected": "nx affected -t build",
    "test": "nx run-many -t test",
    "test:affected": "nx affected -t test",
    "lint": "nx run-many -t lint",
    "lint:fix": "nx run-many -t lint --fix",
    "check": "biome check .",
    "check:fix": "biome check --write .",
    "dev:playground": "nx serve playground",
    "dev:docs": "nx serve docs",
    "publish:all": "nx run-many -t publish",
    "clean": "nx reset"
  },
  "devDependencies": {
    "@nx/cypress": "^17.0.0",
    "@nx/jest": "^17.0.0",
    "@nx/js": "^17.0.0",
    "@nx/next": "^17.0.0",
    "@nx/playwright": "^17.0.0",
    "@nx/react": "^17.0.0",
    "@nx/rollup": "^17.0.0",
    "@nx/vite": "^17.0.0",
    "@nx/workspace": "^17.0.0",
    "nx": "^17.0.0",
    "@biomejs/biome": "^2.0.5",
    "typescript": "^5.5.3"
  }
}
```

---

## Package Configurations

### `packages/core/project.json`
```json
{
  "name": "core",
  "sourceRoot": "packages/core/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "@nx/rollup:rollup",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/packages/core",
        "tsConfig": "packages/core/tsconfig.lib.json",
        "project": "packages/core/package.json",
        "entryFile": "packages/core/src/index.ts",
        "rollupConfig": "packages/core/rollup.config.js"
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/packages/core"],
      "options": {
        "jestConfig": "packages/core/jest.config.ts"
      }
    },
    "lint": {
      "executor": "@nx/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["packages/core/**/*.{ts,tsx,js,jsx}"]
      }
    }
  },
  "tags": ["scope:core", "type:library"]
}
```

### `packages/react/project.json`
```json
{
  "name": "react",
  "sourceRoot": "packages/react/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "defaultConfiguration": "production",
      "options": {
        "outputPath": "dist/packages/react"
      },
      "configurations": {
        "development": {
          "mode": "development"
        },
        "production": {
          "mode": "production"
        }
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/packages/react"],
      "options": {
        "jestConfig": "packages/react/jest.config.ts"
      }
    },
    "test:e2e": {
      "executor": "@nx/playwright:playwright",
      "outputs": ["{workspaceRoot}/dist/.playwright"],
      "options": {
        "config": "packages/react/playwright.config.ts"
      }
    }
  },
  "tags": ["scope:react", "type:library"]
}
```

---

## Build Process

### Vite Configuration for React Package

```typescript
// packages/react/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      outDir: 'dist/types',
      exclude: ['**/*.test.*', '**/*.spec.*']
    })
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'form-builder': resolve(__dirname, 'src/components/FormBuilder/index.ts'),
        'form-renderer': resolve(__dirname, 'src/components/FormRenderer/index.ts')
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@xstate/react',
        'xstate',
        '@tanstack/react-form',
        '@dnd-kit/core',
        '@dnd-kit/sortable',
        'zod'
      ],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime'
        }
      }
    },
    sourcemap: true,
    minify: 'terser'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
```

### Rollup Configuration for Core Package

```javascript
// packages/core/rollup.config.js
const { createRollupOptions } = require('@nx/rollup/plugins/rollup');

module.exports = (config) => {
  return createRollupOptions({
    ...config,
    compiler: 'tsc',
    format: ['esm', 'cjs'],
    external: ['zod', 'xstate'],
    generateExportsField: true
  });
};
```

---

## Package.json Templates

### Core Package
```json
{
  "name": "@form-builder/core",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/types/index.d.ts"
    },
    "./types": {
      "import": "./dist/types.mjs",
      "require": "./dist/types.cjs",
      "types": "./dist/types/types.d.ts"
    }
  },
  "files": ["dist"],
  "peerDependencies": {
    "zod": "^3.25.0",
    "xstate": "^5.19.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### React Package
```json
{
  "name": "@form-builder/react",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/types/index.d.ts"
    },
    "./form-builder": {
      "import": "./dist/form-builder.mjs",
      "require": "./dist/form-builder.cjs",
      "types": "./dist/types/components/FormBuilder/index.d.ts"
    },
    "./form-renderer": {
      "import": "./dist/form-renderer.mjs",
      "require": "./dist/form-renderer.cjs",
      "types": "./dist/types/components/FormRenderer/index.d.ts"
    },
    "./styles": "./dist/styles.css"
  },
  "files": ["dist"],
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@form-builder/core": "^1.0.0",
    "@xstate/react": "^5.0.0",
    "xstate": "^5.19.0",
    "@tanstack/react-form": "^1.12.0",
    "@dnd-kit/core": "^6.3.0",
    "zod": "^3.25.0"
  },
  "dependencies": {
    "@lux-design-system/components-react": "latest",
    "@lux-design-system/design-tokens": "latest"
  }
}
```

---

## Development Workflow

### Daily Development Commands
```bash
# Start development environment
nx serve playground

# Run tests for affected packages
nx affected:test

# Build all packages
nx run-many -t build

# Lint and format
nx run-many -t lint
biome check --write .

# Test specific package
nx test react
nx test core

# Build specific package
nx build react --watch
```

### Release Workflow
```bash
# Build all packages for production
nx run-many -t build --configuration=production

# Run all tests
nx run-many -t test

# Run E2E tests
nx run-many -t e2e

# Version and publish
nx run-many -t version
nx run-many -t publish
```

---

## Dependency Management

### Shared Dependencies (Root)
- Build tools: NX, Vite, Rollup, TypeScript
- Testing: Jest, Playwright, @testing-library
- Linting: Biome, ESLint
- Development: Next.js (for playground)

### Package-Specific Dependencies
- **Core**: Zod, XState (peer dependencies)
- **React**: React ecosystem, Lux Design System
- **Design Tokens**: CSS processing tools

### Dependency Graph
```bash
# View dependency graph
nx graph

# Show what's affected by changes
nx show projects --affected
```

---

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Code quality checks
        run: |
          bun run check
          bunx tsc --noEmit
      
      - name: Run affected tests
        run: bunx nx affected -t test --parallel=3
      
      - name: Build affected packages
        run: bunx nx affected -t build --parallel=3
      
      - name: E2E tests
        run: bunx nx affected -t e2e

  publish:
    needs: quality
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Build packages
        run: |
          bun install --frozen-lockfile
          bunx nx run-many -t build --configuration=production
      
      - name: Publish to NPM
        run: bunx nx run-many -t publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

This setup provides a robust foundation for your multi-framework form builder with proper build optimization, dependency management, and deployment processes.