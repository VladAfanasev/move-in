# Biome Code Standards & Compliance

## Current Biome Configuration

Based on your `biome.json`, all code must comply with these standards:

### Formatting Rules
- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for strings and JSX attributes
- **Semicolons**: Always required
- **Trailing commas**: ES5 style (objects/arrays only)
- **Arrow parentheses**: Always use parentheses `(param) => {}`
- **Bracket spacing**: Enabled `{ key: value }`
- **Bracket same line**: False (closing bracket on new line)
- **Import organization**: Automatic import sorting enabled

### Code Quality Standards
- All recommended linting rules enabled
- Automatic import organization on save
- Unknown file handling disabled
- Git integration disabled (manual control)

---

## Compliance Checklist

### Before Every Commit
```bash
# Check all files for compliance
bun run check

# Or individual commands:
bun run lint        # Check for linting issues
bun run lint:fix    # Auto-fix linting issues
bun run format      # Format all files
```

### Biome-Compliant Code Examples

#### Component Structure
```typescript
// ✅ Correct: Tab indentation, double quotes, proper formatting
import { useState, useEffect } from "react";
import { useMachine } from "@xstate/react";
import type { FormBuilderProps } from "@/types/formBuilder";
import styles from "./FormBuilder.module.css";

interface ComponentState {
	isLoading: boolean;
	config: FormConfig | null;
	errors: string[];
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
	wizardId,
	onSave,
	initialConfig,
}) => {
	const [state, setState] = useState<ComponentState>({
		isLoading: false,
		config: null,
		errors: [],
	});

	const handleSave = (config: FormConfig): void => {
		try {
			onSave(config);
		} catch (error) {
			setState((prev) => ({
				...prev,
				errors: [...prev.errors, "Failed to save configuration"],
			}));
		}
	};

	return (
		<div className={styles.formBuilder}>
			<header className={styles.formBuilder__header}>
				<h1>Form Builder</h1>
			</header>
			{/* Component content */}
		</div>
	);
};
```

#### XState Machine Definition
```typescript
// ✅ Correct: Proper formatting and structure
import { createMachine, assign } from "xstate";
import type { FormConfig, FormField } from "@/types/formBuilder";

interface FormBuilderContext {
	config: FormConfig | null;
	selectedField: FormField | null;
	isDirty: boolean;
	errors: string[];
}

type FormBuilderEvent =
	| { type: "LOAD_CONFIG"; wizardId: string }
	| { type: "ADD_FIELD"; field: FormField }
	| { type: "UPDATE_FIELD"; fieldId: string; updates: Partial<FormField> }
	| { type: "SAVE_CONFIG" }
	| { type: "RESET" };

export const formBuilderMachine = createMachine({
	id: "formBuilder",
	initial: "idle",
	context: {
		config: null,
		selectedField: null,
		isDirty: false,
		errors: [],
	} as FormBuilderContext,
	states: {
		idle: {
			on: {
				LOAD_CONFIG: {
					target: "loading",
					actions: assign({
						errors: [],
					}),
				},
			},
		},
		loading: {
			invoke: {
				src: "loadConfig",
				onDone: {
					target: "editing",
					actions: assign({
						config: ({ event }) => event.output,
					}),
				},
				onError: {
					target: "error",
					actions: assign({
						errors: ({ event }) => [event.error.message],
					}),
				},
			},
		},
		editing: {
			on: {
				ADD_FIELD: {
					actions: assign({
						config: ({ context, event }) => ({
							...context.config!,
							fields: [...context.config!.fields, event.field],
						}),
						isDirty: true,
					}),
				},
				SAVE_CONFIG: {
					target: "saving",
				},
			},
		},
		saving: {
			// Saving state implementation
		},
		error: {
			on: {
				RESET: {
					target: "idle",
					actions: assign({
						config: null,
						errors: [],
						isDirty: false,
					}),
				},
			},
		},
	},
});
```

#### API Integration
```typescript
// ✅ Correct: Error handling, async/await, proper typing
import type { FormConfig } from "@/types/formBuilder";

export class ConfigManager {
	private readonly formsPath = "./forms";

	async loadConfig(wizardId: string): Promise<FormConfig> {
		try {
			const filePath = `${this.formsPath}/${wizardId}.json`;
			const configData = await fs.readFile(filePath, "utf-8");
			const config = JSON.parse(configData) as FormConfig;
			
			return this.validateConfig(config);
		} catch (error) {
			throw new Error(`Failed to load config for ${wizardId}: ${error}`);
		}
	}

	async saveConfig(wizardId: string, config: FormConfig): Promise<void> {
		try {
			const filePath = `${this.formsPath}/${wizardId}.json`;
			const configJson = JSON.stringify(config, null, "\t");
			
			await fs.mkdir(this.formsPath, { recursive: true });
			await fs.writeFile(filePath, configJson, "utf-8");
		} catch (error) {
			throw new Error(`Failed to save config for ${wizardId}: ${error}`);
		}
	}

	private validateConfig(config: FormConfig): FormConfig {
		// Validation logic using Zod
		return FormConfigSchema.parse(config);
	}
}
```

#### CSS Modules (Biome-Compliant)
```css
/* ✅ Correct: Proper nesting, consistent formatting */
.formBuilder {
	display: grid;
	grid-template-columns: 250px 1fr 300px;
	grid-template-rows: auto 1fr;
	height: 100vh;
	background-color: var(--lux-color-background);

	& .formBuilder__header {
		grid-column: 1 / -1;
		padding: var(--lux-space-400);
		border-bottom: 1px solid var(--lux-color-border);
		background-color: var(--lux-color-surface);

		& h1 {
			margin: 0;
			font-size: var(--lux-font-size-large-scale-lg);
			color: var(--lux-color-text-primary);
		}
	}

	& .formBuilder__palette {
		padding: var(--lux-space-300);
		border-right: 1px solid var(--lux-color-border);
		overflow-y: auto;

		& .palette__section {
			margin-bottom: var(--lux-space-400);

			& .section__title {
				font-weight: var(--lux-font-weight-medium);
				margin-bottom: var(--lux-space-200);
				color: var(--lux-color-text-secondary);
			}

			& .section__components {
				display: flex;
				flex-direction: column;
				gap: var(--lux-space-200);
			}
		}
	}

	& .formBuilder__canvas {
		padding: var(--lux-space-400);
		background-color: var(--lux-color-background-secondary);
		position: relative;
		overflow-y: auto;

		&.canvas--empty {
			display: flex;
			align-items: center;
			justify-content: center;
			color: var(--lux-color-text-tertiary);
			font-size: var(--lux-font-size-base);
		}

		& .canvas__dropZone {
			min-height: 200px;
			border: 2px dashed var(--lux-color-border);
			border-radius: var(--lux-border-radius-md);
			padding: var(--lux-space-300);

			&.dropZone--active {
				border-color: var(--lux-color-primary);
				background-color: var(--lux-color-primary-alpha-10);
			}
		}
	}

	& .formBuilder__properties {
		padding: var(--lux-space-300);
		border-left: 1px solid var(--lux-color-border);
		background-color: var(--lux-color-surface);
		overflow-y: auto;
	}
}
```

---

## Common Biome Violations & Fixes

### ❌ Common Mistakes

```typescript
// Wrong indentation (spaces instead of tabs)
  const config = {
    id: 'form-1',
    title: 'My Form'
  };

// Single quotes instead of double quotes
import { useState } from 'react';

// Missing semicolons
const handleClick = () => {
  console.log("clicked")
}

// Arrow function without parentheses
const callback = param => param.toUpperCase();

// Inconsistent bracket spacing
const obj = {key: value};
```

### ✅ Corrected Versions

```typescript
// Correct tab indentation
	const config = {
		id: "form-1",
		title: "My Form",
	};

// Double quotes
import { useState } from "react";

// Semicolons required
const handleClick = (): void => {
	console.log("clicked");
};

// Parentheses always required
const callback = (param: string): string => param.toUpperCase();

// Proper bracket spacing
const obj = { key: value };
```

---

## Pre-commit Hook Setup

Add this to ensure compliance before commits:

```json
// package.json
{
  "scripts": {
    "pre-commit": "biome check --write .",
    "validate": "biome check . && tsc --noEmit"
  }
}
```

```bash
# Install husky for git hooks
npm install -D husky

# Setup pre-commit hook
npx husky add .husky/pre-commit "npm run pre-commit"
```

---

## VS Code Integration

Recommended `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "editor.insertSpaces": false,
  "editor.detectIndentation": false,
  "typescript.preferences.quoteStyle": "double"
}
```

---

## CI/CD Integration

```yaml
# .github/workflows/quality.yml
name: Code Quality

on: [push, pull_request]

jobs:
  biome-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Run Biome checks
        run: bun run check
        
      - name: Type check
        run: bunx tsc --noEmit
```

---

## File-by-File Compliance

### TypeScript Files
- Use `.ts` for utilities, `.tsx` for components
- Always export types and interfaces
- Use proper JSDoc comments
- Follow strict TypeScript settings

### Test Files
- Follow same formatting rules
- Use descriptive test names with double quotes
- Proper async/await handling
- Mock imports at top of file

### Configuration Files
- Use consistent formatting for JSON files
- Proper commenting in JSON where supported
- Environment-specific configurations properly structured

---

## Development Commands

```bash
# Daily workflow commands
bun run check                    # Full compliance check
bun run lint:fix                # Auto-fix what's possible
bun run format                  # Format all files
bun run dev:with-format         # Dev server with auto-formatting

# CI commands
bun run validate                # Full validation (lint + typecheck)
bun run test && bun run check   # Full quality gate
```

---

## Quality Gates

Before any code is considered complete:

1. ✅ `bun run check` passes without errors
2. ✅ `bunx tsc --noEmit` passes (no type errors)
3. ✅ All tests pass
4. ✅ Coverage requirements met
5. ✅ Accessibility tests pass
6. ✅ Performance benchmarks met

**Remember**: Biome compliance is non-negotiable. All code must pass these checks before being committed or merged.