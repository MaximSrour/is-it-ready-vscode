# Contributing to is-it-ready-vscode

Thank you for your interest in contributing to **is-it-ready-vscode**! This
document covers how to get started and the standards we follow for this VS Code
extension.

## Code of Conduct

We expect all contributors to be respectful and professional. Please maintain a
welcoming and inclusive environment for everyone.

## Getting Started

### Prerequisites

- Node.js (latest LTS recommended)
- npm (comes with Node.js)
- Git
- VS Code (for extension development)

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:

   ```sh
   git clone https://github.com/YOUR_USERNAME/is-it-ready-vscode.git
   cd is-it-ready-vscode
   ```

3. Install dependencies:

   ```sh
   npm install
   ```

4. Create a branch for your changes:

   ```sh
   git checkout -b your-feature-branch
   ```

## Development Workflow

### Build

- `npm run package` builds the extension output into `dist/`.
- `npm run watch` runs the build in watch mode.

### Tests

- `npm run test` runs Vitest unit tests.

## Code Standards

**Code quality standards are high and expected to be followed for all pull
requests.** We maintain strict quality gates to keep the extension reliable.

### Quality Gates

Before every commit, run `npm run check` (powered by is-it-ready) to validate:

1. **Prettier** - Code formatting
2. **ESLint** - Code linting and best practices
3. **MarkdownLint** - Markdown file quality
4. **TypeScript** - Type checking
5. **Vitest** - All tests pass
6. **Knip** - No unused dependencies or exports
7. **npm audit** - No known security vulnerabilities

**All checks must pass** before your pull request will be accepted.

### Individual Quality Checks

You can run individual checks as needed:

- `npm run prettier` or `npm run prettier:fix`
- `npm run lint` or `npm run lint:fix`
- `npm run type-check`
- `npm run test`
- `npm run knip`
- `npm run markdownlint` or `npm run markdownlint:fix`

## TypeScript Guidelines

- Use strict TypeScript with no implicit `any`
- Prefer `const` over `let`; avoid `var`
- Use meaningful variable and function names
- Explicitly type function parameters, rely on type inference for return values
- Use interfaces for object shapes, types for unions/primitives
- Keep functions small and focused (single responsibility)

### Naming Conventions

- **Files**: camelCase (e.g., `taskRunner.ts`)
- **Functions/Variables**: camelCase (e.g., `resolveTask`, `runTaskInternal`)
- **Types/Interfaces**: PascalCase (e.g., `IsItReadyTask`, `TaskStatus`)
- **Test files**: `*.test.ts` suffix

## Testing

### Test-Driven Development

We follow a TDD approach:

1. Write tests first before implementing features
2. Start with the simplest test case
3. Add complexity incrementally
4. Ensure all tests pass before moving forward

### Test Structure

```typescript
import { describe, expect, it } from "vitest";

import { functionToTest } from "./module";

describe("functionToTest", () => {
  it("should handle basic case", () => {
    const result = functionToTest("input");
    expect(result).toBe("expected");
  });
});
```

### Test Best Practices

- Use descriptive test names that explain behavior
- Test behavior, not implementation
- Cover happy paths, edge cases, and error cases
- Use arrange-act-assert pattern
- Keep tests independent and isolated
- Co-locate tests with source files (e.g., `helpers.test.ts` with `helpers.ts`)

## Pull Request Process

1. Ensure your code follows all code standards
2. Run `npm run check` and fix any issues
3. Write or update tests for your changes
4. Update documentation if needed
5. Commit your changes with clear, descriptive commit messages
6. Push to your fork and create a pull request
7. Respond to any code review feedback

### Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Write a clear description of what your PR does
- Reference any related issues
- Ensure all CI checks pass
- Be responsive to review feedback

## Use of AI Tools

**The use of AI tools (such as GitHub Copilot) is acceptable and encouraged**,
provided that:

- **You review all AI-generated code carefully** before submitting
- **The code aligns with our code standards** and quality requirements
- **You understand the code** and can explain how it works
- **All tests pass** and the code is properly tested

AI is a tool to assist you, but you remain responsible for the quality and
correctness of your contributions.

## Code Patterns and Best Practices

### Error Handling

- Use explicit error checking
- Provide helpful error messages
- Don't swallow errors silently
- Use appropriate error types

### Async Code

- Use `async/await` over raw promises
- Handle promise rejections properly
- Use `Promise.all()` for parallel operations

### Type Safety

- Avoid type assertions unless absolutely necessary
- Use type guards for runtime type checking
- Prefer union types over `any`

### Documentation

- Prefer self-documenting code over comments
- Use JSDoc for public APIs
- Explain "why" not "what" in comments
- Keep comments up-to-date with code

## What NOT to Do

- ❌ Don't use `any` type without good reason
- ❌ Don't skip tests for new functionality
- ❌ Don't commit code that doesn't pass `npm run check`
- ❌ Don't mutate function parameters
- ❌ Don't use `eval()` or similar dangerous functions
- ❌ Don't hardcode file paths or system-specific values
- ❌ Don't add dependencies without careful consideration
- ❌ Don't disable TypeScript at all
- ❌ Don't disable ESLint rules without significant justification
- ❌ Don't refactor unrelated code
- ❌ Don't fix unrelated issues in your PR

## Dependencies

### Adding Dependencies

- Prefer established, well-maintained packages
- Check package size and dependencies
- Ensure license compatibility (MIT preferred)
- Add to correct section in package.json:
  - `dependencies` - Runtime dependencies
  - `devDependencies` - Development tools and testing

## Security

- Validate all external inputs
- Avoid command injection vulnerabilities
- Don't commit secrets or credentials
- Keep dependencies updated for security patches
- Use `npm audit` to check for vulnerabilities

## Need Help?

- Check existing [issues](https://github.com/MaximSrour/is-it-ready/issues)
- Open a new issue for bugs or feature requests
- Ask questions in your pull request

Thank you for contributing to is-it-ready! 🚀
