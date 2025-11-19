# Code Standards & Quality Guidelines

## Overview

This document outlines the code quality standards and development practices for the Omeagle VITAP Next.js application.

## Table of Contents

1. [TypeScript Standards](#typescript-standards)
2. [TSDoc Documentation](#tsdoc-documentation)
3. [React/Next.js Best Practices](#reactnextjs-best-practices)
4. [Testing Requirements](#testing-requirements)
5. [Git Workflow](#git-workflow)
6. [CI/CD Pipeline](#cicd-pipeline)

---

## TypeScript Standards

### Strict Mode

All TypeScript files must compile with strict mode enabled:

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true
}
```

### Type Annotations

- Always explicitly type function return values
- Avoid using `any` - use `unknown` or proper types instead
- Use TypeScript utility types (`Partial`, `Pick`, `Omit`, etc.)

**Good:**

```typescript
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Bad:**

```typescript
function calculateTotal(items) {
  // Missing types
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Unused Variables

Prefix intentionally unused parameters with underscore:

```typescript
function handleEvent(_event: Event, userId: string): void {
  // _event is intentionally unused
  processUser(userId);
}
```

---

## TSDoc Documentation

### Required Documentation

All exported functions, classes, interfaces, and types must have TSDoc comments.

### Format

````typescript
/**
 * Brief description of the function
 *
 * @param channelName - The name of the channel to join
 * @param token - Authentication token for the channel
 * @returns Promise that resolves when successfully joined
 * @throws {Error} When channel name is invalid
 *
 * @example
 * ```typescript
 * await joinChannel('room-123', 'auth-token');
 * ```
 */
export async function joinChannel(channelName: string, token: string): Promise<void> {
  // Implementation
}
````

### Required Tags

- `@param` - For each parameter
- `@returns` - For return values
- `@throws` - For potential errors
- `@example` - Usage examples (when helpful)
- `@deprecated` - For deprecated functions

### Validation

TSDoc syntax is validated by ESLint:

```bash
npm run lint  # Checks TSDoc formatting
```

---

## React/Next.js Best Practices

### Component Structure

```typescript
"use client";  // Only when needed

import { useState, useCallback } from "react";
import type { FC } from "react";

/**
 * User profile component
 *
 * @param props - Component props
 * @returns Rendered component
 */
export const UserProfile: FC<UserProfileProps> = ({ userId, onUpdate }) => {
  // Hooks
  const [data, setData] = useState<UserData | null>(null);

  // Event handlers
  const handleUpdate = useCallback(() => {
    onUpdate(userId);
  }, [userId, onUpdate]);

  // Render
  return <div>{/* JSX */}</div>;
};
```

### Hooks Rules

- Always include all dependencies in dependency arrays
- Use `useCallback` for functions passed as props
- Use `useMemo` for expensive computations
- Custom hooks must start with `use`

### Error Boundaries

Wrap components that might fail:

```typescript
<ErrorBoundary fallback={<ErrorMessage />}>
  <RiskyComponent />
</ErrorBoundary>
```

### Accessibility

- Use semantic HTML elements
- Include ARIA labels when needed
- Ensure keyboard navigation works
- Test with screen readers

---

## Testing Requirements

### Coverage Thresholds

Minimum coverage requirements:

- **Branches**: 80%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Test Structure

```typescript
describe("Component/Function Name", () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it("should do something specific", () => {
    // Arrange
    const input = createTestData();

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Test Types

1. **Unit Tests**: Individual functions/components
2. **Integration Tests**: Component interactions
3. **Snapshot Tests**: UI consistency
4. **E2E Tests**: Full user flows (future)

### Running Tests

```bash
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:ci       # CI mode with coverage
npm run test:coverage # Generate coverage report
```

---

## Git Workflow

### Commit Message Format

Follow Conventional Commits:

```
type(scope): subject

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes
- `ci`: CI/CD changes
- `perf`: Performance improvements

**Examples:**

```bash
feat(auth): add social login support
fix(video): resolve camera permission issue
docs(readme): update installation instructions
test(hooks): add useVideoChat test cases
```

### Pre-commit Hooks

Automatically run on `git commit`:

1. **Prettier** - Code formatting
2. **ESLint** - Linting with zero warnings
3. **TypeScript** - Type checking
4. Status: ✅ Fail if any errors

### Pre-push Hooks

Automatically run on `git push`:

1. **Tests** - All tests must pass
2. **Coverage** - Meet minimum thresholds
3. Status: ✅ Fail if tests fail

### Commit Message Validation

Format validated on commit:

- Must follow conventional commits
- Subject line ≤ 72 characters
- Body lines ≤ 100 characters

---

## CI/CD Pipeline

### Pipeline Stages

```
Format Check → Lint → Type Check → Tests → Security → Build → Deploy
```

### Stage Details

#### 1. Format Check

- Validates Prettier formatting
- Ensures code style consistency
- **Command**: `npm run format:check`

#### 2. Lint (ESLint + TSDoc)

- ESLint validation (strict mode)
- TSDoc syntax validation
- Zero warnings allowed
- **Command**: `npm run lint:strict`

#### 3. Type Check

- TypeScript compilation check
- Strict mode validation
- **Command**: `npm run type-check`

#### 4. Tests

- Unit & integration tests
- Coverage report generation
- Upload to Codecov
- PR coverage comments
- **Command**: `npm run test:ci`

#### 5. Security Audit

- NPM vulnerability scan
- Dependency security check
- **Command**: `npm audit`

#### 6. Build

- Production build
- Static export for Firebase
- Build artifact upload
- **Command**: `npm run build`

#### 7. Deploy (main branch only)

- Deploy to Firebase Hosting
- Deployment URL comment
- **Trigger**: Push to `main`

### Running Locally

```bash
# Run full validation (same as CI)
npm run validate

# Individual checks
npm run format:check
npm run lint:strict
npm run type-check
npm run test:ci
```

### Environment Variables

Required secrets in GitHub:

- `NEXT_PUBLIC_AGORA_APP_ID`
- `NEXT_PUBLIC_AGORA_TOKEN_ENDPOINT`
- `NEXT_PUBLIC_AGORA_API_KEY`
- `NEXT_PUBLIC_FIREBASE_*` (9 variables)
- `FIREBASE_SERVICE_ACCOUNT`
- `CODECOV_TOKEN` (optional)

---

## Code Quality Tools

### ESLint

Configuration: `eslint.config.mjs`

- Next.js rules
- TypeScript rules
- React hooks rules
- TSDoc validation
- Custom project rules

### Prettier

Configuration: `.prettierrc.json`

- 2 spaces indentation
- 100 character line width
- Semicolons required
- Double quotes
- Trailing commas (ES5)

### TypeScript

Configuration: `tsconfig.json`, `tsconfig.production.json`

- Strict mode enabled
- No unused variables
- No implicit returns
- Path aliases configured

### Husky + lint-staged

Pre-commit automation:

- Format staged files
- Lint staged files
- Type check
- Reject if errors

---

## Development Workflow

### Starting Development

```bash
# Install dependencies
npm install

# Start dev server with Turbopack
npm run dev

# Run in watch mode (recommended)
npm run test:watch  # Terminal 1
npm run type-check:watch  # Terminal 2
```

### Before Committing

```bash
# Format all files
npm run format

# Check for issues
npm run lint:fix
npm run type-check

# Run tests
npm run test
```

### Creating Pull Request

1. Ensure all tests pass locally
2. Run `npm run validate`
3. Write clear PR description
4. Link related issues
5. Wait for CI checks
6. Address review feedback

### Merging to Main

- All CI checks must pass
- Requires code review approval
- Auto-deploys to production
- Monitor deployment status

---

## Performance Standards

### Build Performance

- Build time: < 2 minutes
- Bundle size: Monitor and optimize
- Lighthouse score: > 90

### Runtime Performance

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1

### Code Splitting

- Route-based splitting enabled
- Component lazy loading
- Dynamic imports for large dependencies

---

## Security Standards

### Environment Variables

- Never commit secrets
- Use GitHub Secrets
- Validate in CI/CD
- Document required variables

### Dependencies

- Regular security audits
- Auto-update patch versions
- Review major updates
- Check vulnerability reports

### Code Security

- Sanitize user inputs
- Validate API responses
- Use Content Security Policy
- Implement rate limiting

---

## Additional Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TSDoc Reference](https://tsdoc.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Tools

- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Project Links

- Repository: [GitHub](https://github.com/rudra-sah00/omeagle-vitap)
- CI/CD: [GitHub Actions](https://github.com/rudra-sah00/omeagle-vitap/actions)
- Deployment: Firebase Hosting

---

## Questions or Issues?

If you have questions about these standards or need clarification:

1. Check existing documentation
2. Review similar code examples
3. Ask in team discussions
4. Open a GitHub issue

**Last Updated**: November 2025
