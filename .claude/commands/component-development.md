# Component Development Guide

## FormBuilder Component Requirements

### Purpose
Admin interface for creating and configuring forms/wizards with drag-and-drop functionality.

### Key Features
- Drag-and-drop canvas using DND Kit
- Component palette with Lux Design System components
- Real-time preview of form configuration
- JSON config generation and saving
- Step/page management for multi-step forms
- Validation rule configuration
- API endpoint configuration per step

### Props Interface
```typescript
interface FormBuilderProps {
  wizardId?: string;              // For editing existing forms
  initialConfig?: FormConfig;     // Pre-populate configuration
  onSave: (config: FormConfig) => void;
  onPreview?: (config: FormConfig) => void;
  availableComponents?: ComponentType[];
  className?: string;
}
```

### XState Machine Events
- `LOAD_CONFIG`: Load existing form configuration
- `UPDATE_FIELD`: Modify field properties
- `ADD_FIELD`: Add new field to canvas
- `REMOVE_FIELD`: Remove field from canvas
- `REORDER_FIELDS`: Change field order via drag-drop
- `ADD_STEP`: Add new step/page
- `REMOVE_STEP`: Remove step/page
- `SAVE_CONFIG`: Save configuration to file
- `PREVIEW`: Open preview mode
- `VALIDATE_CONFIG`: Validate current configuration

### CSS Modules Naming
Use `formBuilder.module.css` with BEM-style naming:
```css
.formBuilder { }
.formBuilder__canvas { }
.formBuilder__palette { }
.formBuilder__properties { }
.formBuilder__step { }
```

---

## FormRenderer Component Requirements

### Purpose
Renders configured forms for end users with full accessibility support.

### Key Features
- Multi-step form rendering based on JSON config
- Real-time validation using Zod
- Step navigation (next/previous/jump to step)
- API integration for step-based submissions
- Accessibility compliance (WCAG 2.1 AA)
- Loading states and error handling

### Props Interface
```typescript
interface FormRendererProps {
  wizardId: string;               // Required: form to render
  config?: FormConfig;            // Optional: direct config object
  onSubmit?: (data: FormData) => void;
  onStepChange?: (step: number) => void;
  onError?: (error: Error) => void;
  className?: string;
  mode?: 'development' | 'production';
}
```

### XState Machine Events
- `LOAD_FORM`: Initialize form from config
- `NEXT_STEP`: Navigate to next step
- `PREVIOUS_STEP`: Navigate to previous step
- `JUMP_TO_STEP`: Jump to specific step
- `UPDATE_FIELD`: Update field value
- `VALIDATE_STEP`: Validate current step
- `SUBMIT_STEP`: Submit step data to API
- `SUBMIT_FORM`: Final form submission
- `HANDLE_ERROR`: Error state management

### Accessibility Requirements
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management between steps
- Error announcement
- Progress indication

---

## Shared Utilities

### Config File Handling
```typescript
// lib/config/fileSystem.ts - Handle form JSON files
export async function loadFormConfig(wizardId: string): Promise<FormConfig>
export async function saveFormConfig(wizardId: string, config: FormConfig): Promise<void>
export async function listFormConfigs(): Promise<string[]>
```

### Validation Schemas
```typescript
// lib/validation/schemas.ts - Zod schemas for form validation
export const FormConfigSchema: z.ZodSchema<FormConfig>
export const FormFieldSchema: z.ZodSchema<FormField>
export const ValidationRuleSchema: z.ZodSchema<ValidationRule>
```

### API Integration
```typescript
// lib/api/integration.ts - Handle step-based API calls
export async function submitStepData(endpoint: string, payload: object): Promise<void>
export function buildPayload(fields: FormField[], formData: FormData): object
```

---

## Development Guidelines

### Component Structure
```typescript
// Standard component template
import { useState } from 'react';
import { useMachine } from '@xstate/react';
import styles from './component.module.css';

interface ComponentProps {
  // Define props
}

export const Component: React.FC<ComponentProps> = ({ ...props }) => {
  const [state, send] = useMachine(componentMachine);
  
  return (
    <div className={styles.component}>
      {/* Implementation */}
    </div>
  );
};
```

### Error Handling
- Implement error boundaries for both components
- Provide meaningful error messages
- Log errors appropriately for debugging
- Graceful degradation when configs are invalid

### Performance Considerations
- Lazy load form configurations
- Implement virtual scrolling for large forms
- Debounce drag-and-drop operations
- Optimize re-renders with React.memo where appropriate

### Testing Requirements
- Unit tests for all utilities and hooks
- Integration tests for component interactions
- E2E tests for complete form building and rendering flows
- Accessibility tests using axe-core
- Performance tests for large form configurations

When implementing components:
1. Start with TypeScript interfaces
2. Create XState machine definition
3. Implement component with proper error handling
4. Add comprehensive tests
5. Ensure accessibility compliance
6. Add JSDoc documentation