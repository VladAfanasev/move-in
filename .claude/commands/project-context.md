# Form Builder Package - Project Context

## Overview
This is an NPM package that provides two main React components for creating and rendering dynamic forms/wizards:
- `FormBuilder`: Admin interface for configuring forms with drag-and-drop
- `FormRenderer`: Component that reads config and renders forms for end users

## Target Audience
- React + TypeScript developers
- Future: Angular and Vue versions planned
- Primary users: Government organizations (accessibility critical)

## Tech Stack
- **Framework**: Next.js 14+ (App Router) for development/preview
- **Package Build**: Vite + Rollup via NX monorepo
- **Styling**: 
  - Tailwind CSS for FormBuilder admin UI
  - CSS Modules for Lux Design System components
- **State Management**: XState v5 (separate machines for builder/renderer)
- **Forms**: TanStack Form + Zod validation
- **Drag & Drop**: DND Kit
- **Design System**: Lux Design System components (see available components list)
- **Linting**: Biome (tab indentation, double quotes, trailing commas)

## Architecture Principles
- **Performance**: Server-side config loading, minimal client-side awaits
- **Accessibility**: 100% WCAG compliant (government requirement)
- **Security**: No exposed URLs/keys, secure config handling
- **Maintainability**: Clear separation of concerns, comprehensive testing

## File Structure
```
packages/
├── form-builder-core/          # Shared types, utilities
├── form-builder-react/         # Main React components
├── design-tokens/              # CSS modules for Lux DS
└── playground/                 # Next.js demo app

src/
├── components/
│   ├── form-builder/           # FormBuilder admin component
│   ├── form-renderer/          # FormRenderer user component
│   └── shared/                 # Shared utilities
├── lib/
│   ├── state/                  # XState machines
│   ├── validation/             # Zod schemas
│   ├── config/                 # Config file handling
│   └── api/                    # API integration utilities
├── styles/                     # CSS modules
├── types/                      # TypeScript definitions
└── __tests__/                  # Test files
```

## Data Storage (MVP)
- Forms stored as JSON files in `forms/` directory at project root
- File naming: `{wizardId}.json`
- Future: Versioning system and optional SQLite backend

## Configuration Schema
Forms are configured as JSON with:
- Steps/pages structure
- Field definitions using Lux Design System components
- Validation rules (Zod schemas)
- API integration points for step-based submissions
- XState machine definitions for flow control

## Development Workflow
1. Write specs in markdown
2. Generate tests (Jest + Playwright + axe-core)
3. Implement features with TDD approach
4. Ensure Biome compliance
5. Generate/update documentation

## Quality Standards
- All code must pass Biome linting rules
- 100% accessibility compliance testing
- Performance optimization for server-side operations
- Comprehensive test coverage (unit + integration + e2e)
- Security review for all data handling

## Available Lux Design System Components
- Form fields: Textbox, Textarea, Select, Checkbox, Radio Group/Option
- Layout: Section, Heading Group, Heading, Paragraph
- Interactive: Button, Link, Accordion
- Feedback: Alert, Form Field Error Message
- Data: Document (file handling)

When writing code:
- Use TypeScript strictly
- Follow Biome formatting rules (tabs, double quotes)
- Prefer server-side operations where possible
- Implement proper error boundaries
- Include accessibility attributes
- Write comprehensive JSDoc comments