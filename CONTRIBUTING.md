# Contributing to Ledger

Thank you for your interest in contributing to Ledger! This document provides guidelines and workflows for contributing to this project.

## Code of Conduct
By participating in this project, you agree to abide by our Code of Conduct, which focuses on maintaining a respectful and inclusive environment.

## Development Workflow
1. **Branch Naming**: Use the format `feature/<name>`, `bugfix/<name>`, or `chore/<name>`.
2. **Commit Messages**: We follow Conventional Commits.
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `refactor:` for code refactoring
3. **Pull Requests**:
   - Ensure all CI checks pass (linting, typescript compilation, testing).
   - Provide a clear description of the problem solved.
   - Attach screenshots if you modified UI components.

## Technical Standards
- **Strict Typing**: No `any` types allowed in new TypeScript code. Always define explicit interfaces or infer from Zod schemas.
- **Styling**: Do not use ad-hoc inline styles. Use Tailwind utility classes. Follow the established monochrome color palette (`#000000`, `#050505`, `#1a1a1a`, `#737373`, `#F5F5F5`).
- **Database**: Do not write raw SQL queries unless absolutely necessary for performance. Use Prisma Client.
