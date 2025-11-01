# Testing Strategy & Templates

## Testing Architecture

### Test Types & Tools
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Accessibility Tests**: axe-core + Playwright
- **Performance Tests**: Lighthouse CI + Playwright
- **XState Tests**: @xstate/test

### Test Structure
```
__tests__/
├── unit/
│   ├── components/
│   ├── lib/
│   └── utils/
├── integration/
│   ├── form-builder/
│   └── form-renderer/
├── e2e/
│   ├── complete-workflows/
│   └── accessibility/
├── fixtures/
│   ├── mock-configs/
│   └── test-data/
└── helpers/
    ├── setup.ts
    └── test-utils.tsx
```

---

## Unit Test Templates

### Component Test Template
```typescript
// __tests__/unit/components/FormBuilder.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FormBuilder } from '@/components/form-builder/FormBuilder';
import { mockFormConfig } from '../fixtures/mock-configs';

describe('FormBuilder', () => {
  const defaultProps = {
    onSave: jest.fn(),
    wizardId: 'test-form'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty canvas initially', () => {
    render(<FormBuilder {...defaultProps} />);
    expect(screen.getByTestId('form-canvas')).toBeInTheDocument();
    expect(screen.getByText('Drag components here')).toBeInTheDocument();
  });

  it('should load existing config when wizardId provided', async () => {
    render(<FormBuilder {...defaultProps} initialConfig={mockFormConfig} />);
    await screen.findByDisplayValue('Test Form Title');
    expect(screen.getByTestId('form-field-name')).toBeInTheDocument();
  });

  // Add more test cases...
});
```

### XState Machine Test Template
```typescript
// __tests__/unit/lib/state/formBuilderMachine.test.ts
import { createActor } from 'xstate';
import { formBuilderMachine } from '@/lib/state/formBuilderMachine';
import { mockFormConfig } from '../fixtures/mock-configs';

describe('formBuilderMachine', () => {
  it('should transition from idle to loading when LOAD_CONFIG event sent', () => {
    const actor = createActor(formBuilderMachine).start();
    
    actor.send({ type: 'LOAD_CONFIG', wizardId: 'test-form' });
    
    expect(actor.getSnapshot().value).toBe('loading');
  });

  it('should handle ADD_FIELD event correctly', () => {
    const actor = createActor(formBuilderMachine, {
      input: { config: mockFormConfig }
    }).start();
    
    actor.send({ 
      type: 'ADD_FIELD', 
      field: { type: 'textbox', id: 'new-field', label: 'New Field' }
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.config.fields).toHaveLength(2);
  });
});
```

### Utility Function Test Template
```typescript
// __tests__/unit/lib/config/fileSystem.test.ts
import { loadFormConfig, saveFormConfig } from '@/lib/config/fileSystem';
import { mockFormConfig } from '../fixtures/mock-configs';

jest.mock('fs/promises');

describe('fileSystem utilities', () => {
  describe('loadFormConfig', () => {
    it('should load and parse form configuration', async () => {
      const config = await loadFormConfig('test-form');
      expect(config).toMatchObject({
        id: 'test-form',
        title: expect.any(String),
        steps: expect.any(Array)
      });
    });

    it('should throw error for non-existent form', async () => {
      await expect(loadFormConfig('non-existent')).rejects.toThrow();
    });
  });
});
```

---

## Integration Test Templates

### Form Building Workflow Test
```typescript
// __tests__/integration/form-builder/complete-workflow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormBuilder } from '@/components/form-builder/FormBuilder';

describe('FormBuilder Complete Workflow', () => {
  it('should create a complete form from scratch', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    
    render(<FormBuilder onSave={onSave} />);
    
    // Add form title
    await user.type(screen.getByLabelText('Form Title'), 'Contact Form');
    
    // Drag textbox component to canvas
    const textboxComponent = screen.getByTestId('component-textbox');
    const canvas = screen.getByTestId('form-canvas');
    
    fireEvent.dragStart(textboxComponent);
    fireEvent.dragOver(canvas);
    fireEvent.drop(canvas);
    
    // Configure the field
    await user.type(screen.getByLabelText('Field Label'), 'Full Name');
    await user.click(screen.getByLabelText('Required'));
    
    // Save form
    await user.click(screen.getByText('Save Form'));
    
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Contact Form',
          fields: expect.arrayContaining([
            expect.objectContaining({
              type: 'textbox',
              label: 'Full Name',
              required: true
            })
          ])
        })
      );
    });
  });
});
```

---

## E2E Test Templates

### Playwright Test Configuration
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '__tests__/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'accessibility', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

### Complete Form Creation E2E Test
```typescript
// __tests__/e2e/complete-workflows/form-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Form Creation Workflow', () => {
  test('should create and preview a multi-step form', async ({ page }) => {
    await page.goto('/form-builder');
    
    // Create form
    await page.fill('[data-testid="form-title"]', 'User Registration');
    
    // Add step 1 - Personal Info
    await page.click('[data-testid="add-step"]');
    await page.fill('[data-testid="step-title"]', 'Personal Information');
    
    // Drag and drop name field
    await page.dragAndDrop(
      '[data-testid="component-textbox"]',
      '[data-testid="form-canvas"]'
    );
    
    // Configure field
    await page.fill('[data-testid="field-label"]', 'Full Name');
    await page.check('[data-testid="field-required"]');
    
    // Add step 2 - Contact Info
    await page.click('[data-testid="add-step"]');
    // ... more step configuration
    
    // Save form
    await page.click('[data-testid="save-form"]');
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    
    // Preview form
    await page.click('[data-testid="preview-form"]');
    
    // Test form rendering
    await expect(page.locator('h1')).toContainText('User Registration');
    await expect(page.locator('[data-testid="step-1"]')).toBeVisible();
    
    // Fill and submit step
    await page.fill('input[name="fullName"]', 'John Doe');
    await page.click('[data-testid="next-step"]');
    
    await expect(page.locator('[data-testid="step-2"]')).toBeVisible();
  });
});
```

---

## Accessibility Test Templates

### Accessibility Testing with axe-core
```typescript
// __tests__/e2e/accessibility/form-accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Form Accessibility', () => {
  test('FormRenderer should be fully accessible', async ({ page }) => {
    await page.goto('/form-renderer/test-form');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('FormBuilder should be accessible', async ({ page }) => {
    await page.goto('/form-builder');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('.drag-preview') // Exclude drag preview from scan
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/form-renderer/test-form');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="name"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();
    
    // Test form submission with Enter key
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="step-2"]')).toBeVisible();
  });
});
```

---

## Mock Data & Fixtures

### Mock Form Configuration
```typescript
// __tests__/fixtures/mock-configs/basic-form.ts
export const mockBasicForm = {
  id: 'basic-contact-form',
  title: 'Contact Form',
  description: 'A simple contact form',
  steps: [
    {
      id: 'personal-info',
      title: 'Personal Information',
      fields: [
        {
          id: 'name',
          type: 'textbox',
          label: 'Full Name',
          required: true,
          validation: {
            minLength: 2,
            maxLength: 50
          }
        },
        {
          id: 'email',
          type: 'textbox',
          label: 'Email Address',
          required: true,
          validation: {
            pattern: 'email'
          }
        }
      ]
    }
  ],
  settings: {
    showProgress: true,
    allowNavigation: true
  }
};
```

### Test Utilities
```typescript
// __tests__/helpers/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create test wrapper with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

---

## Test Development Workflow

1. **Write Specification**: Create detailed test specifications in markdown
2. **Generate Test Structure**: Use templates to create test files
3. **Implement Tests**: Write failing tests first (TDD approach)
4. **Run Tests**: Execute tests and verify they fail appropriately
5. **Implement Feature**: Write code to make tests pass
6. **Refactor**: Improve code while keeping tests green
7. **Add Documentation**: Update component documentation

### Test Commands
```json
// package.json scripts
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:e2e": "playwright test",
  "test:accessibility": "playwright test --grep @accessibility",
  "test:all": "npm run test && npm run test:e2e"
}
```

Use these templates as starting points and adapt them based on specific component requirements and features.