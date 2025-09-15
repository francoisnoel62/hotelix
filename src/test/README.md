# Testing Guide

## Overview

This guide covers the comprehensive testing infrastructure for Hotelix, including unit tests, integration tests, and CI/CD pipeline. The testing setup uses Vitest with React Testing Library and Docker PostgreSQL for database testing.

## Running Tests

### Basic Commands

```bash
# Run all tests in watch mode (development)
npm test

# Run all tests once
npm run test -- --run

# Run with coverage report
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Open Vitest UI interface
npm run test:ui

# Run tests in watch mode
npm run test:watch
```

### Database Commands

```bash
# Start test database
npm run test:db:setup

# Stop test database
npm run test:db:teardown

# Push schema to test database
npm run db:test:push
```

### Recommended Workflow

For development:
```bash
# 1. Start test database
npm run test:db:setup

# 2. Run tests in watch mode
npm run test:watch

# 3. When done, stop test database
npm run test:db:teardown
```

For CI/comprehensive testing:
```bash
# Run all tests with coverage (sequential execution recommended)
npm run test -- --run --pool=forks --poolOptions.forks.singleFork=true
```

## Test Structure

### Directory Organization

```
src/
├── app/actions/__tests__/     # Server Actions tests
│   ├── auth.test.ts          # Authentication actions (7 tests)
│   └── intervention.test.ts   # Intervention management (11 tests)
├── lib/
│   ├── __tests__/
│   │   └── prisma.test.ts    # Database client tests (2 tests)
│   └── validations/__tests__/
│       └── auth.test.ts      # Validation functions (10 tests)
├── test/                     # Test utilities and setup
│   ├── setup.ts              # Global test configuration
│   ├── db-utils.ts           # Database testing utilities
│   └── __tests__/
│       └── database-relationships.test.ts  # Database integration (8 tests)
```

### Test Coverage

- **Total Tests**: 36 tests passing
- **Authentication**: 17 tests (Server Actions + Validations)
- **Business Logic**: 11 tests (Intervention management)
- **Database**: 8 tests (Relationships and constraints)

## Testing Conventions

### 1. Test Organization
- Use descriptive test names that explain the behavior
- Group related tests with `describe()` blocks
- One test file per module/function group

### 2. Test Structure (AAA Pattern)
```typescript
it('should register user successfully', async () => {
  // Arrange
  const { hotel } = await seedTestData()
  const formData = new FormData()
  formData.append('email', 'test@example.com')

  // Act
  const result = await registerAction(null, formData)

  // Assert
  expect(result.success).toBe(true)
  expect(result.data?.email).toBe('test@example.com')
})
```

### 3. Database Testing
- Reset database state between tests using `beforeEach()`
- Use `testPrisma` client for test database operations
- Seed test data consistently with `seedTestData()`

### 4. Mocking Strategy
- Mock external dependencies (bcryptjs, Next.js functions)
- Use real database for integration tests
- Mock at the boundary of your system

### 5. Error Testing
- Test both success and error scenarios
- Verify error messages and types
- Test edge cases and boundary conditions

## Test Types

### Unit Tests
Test individual functions in isolation:

```typescript
// Testing validation functions
describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBeNull()
  })

  it('should reject invalid formats', () => {
    expect(validateEmail('invalid')).toBe('Format d\'email invalide')
  })
})
```

### Integration Tests
Test Server Actions with real database:

```typescript
// Testing authentication with database
describe('registerAction', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('should create user in database', async () => {
    const formData = new FormData()
    formData.append('email', 'test@example.com')

    const result = await registerAction(null, formData)

    expect(result.success).toBe(true)

    // Verify database state
    const user = await testPrisma.user.findUnique({
      where: { email: 'test@example.com' }
    })
    expect(user).toBeTruthy()
  })
})
```

### Database Relationship Tests
Test complex database operations:

```typescript
describe('Database Relationships', () => {
  it('should enforce hotel isolation', async () => {
    const hotel1 = await testPrisma.hotel.create({...})
    const hotel2 = await testPrisma.hotel.create({...})

    // Create users in different hotels
    const user1 = await testPrisma.user.create({
      data: { hotelId: hotel1.id, ... }
    })

    // Verify isolation
    const hotel1Users = await testPrisma.user.findMany({
      where: { hotelId: hotel1.id }
    })

    expect(hotel1Users).toHaveLength(1)
  })
})
```

## Configuration Files

### vitest.config.mts
Main Vitest configuration with Next.js 15 support:
- JSdom environment for React components
- TypeScript path resolution
- Coverage reporting with V8 provider
- Test setup file integration

### src/test/setup.ts
Global test environment setup:
- Next.js router mocking
- Database URL configuration
- Testing library matchers

### docker-compose.test.yml
Isolated PostgreSQL test database:
- Runs on port 5433 (separate from development)
- Uses test credentials
- Automatic cleanup with container removal

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Ensure test database is running
npm run test:db:setup

# Check database URL environment variable
echo $DATABASE_URL
```

#### 2. Test Isolation Issues
```bash
# Use sequential execution for database tests
npm run test -- --run --pool=forks --poolOptions.forks.singleFork=true
```

#### 3. TypeScript Errors in Tests
- Ensure test files are in TypeScript project scope
- Check tsconfig.json includes test directories
- Verify @types packages are installed

#### 4. Mock Function Issues
```typescript
// Proper mock setup
vi.mock('bcryptjs')
const mockedBcryptjs = vi.mocked(bcryptjs)

// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})
```

### Performance Tips

1. **Use Sequential Execution for Database Tests**
   ```bash
   npm run test -- --run --pool=forks --poolOptions.forks.singleFork=true
   ```

2. **Skip Database Reset When Possible**
   ```typescript
   // Only reset when necessary for test isolation
   beforeEach(async () => {
     if (testNeedsCleanState) {
       await resetDatabase()
     }
   })
   ```

3. **Mock External Services**
   ```typescript
   // Mock expensive operations
   vi.mock('bcryptjs', () => ({
     hash: vi.fn().mockResolvedValue('mocked_hash'),
     compare: vi.fn().mockResolvedValue(true)
   }))
   ```

## CI/CD Integration

### GitHub Actions
The `.github/workflows/test.yml` workflow:
- Runs on push/PR to master branch
- Sets up Node.js 18 and PostgreSQL
- Installs dependencies with `npm ci`
- Runs tests with coverage reporting
- Uploads coverage to Codecov (optional)

### Local CI Simulation
```bash
# Simulate CI environment locally
npm ci
npm run test:db:setup
npm run test:coverage
npm run test:db:teardown
```

## Best Practices

### Writing Tests
1. **Start with failing test** (Red-Green-Refactor)
2. **Keep tests simple and focused**
3. **Use descriptive test names**
4. **Test behavior, not implementation**
5. **Maintain test independence**

### Database Testing
1. **Use transactions for speed** (when possible)
2. **Reset state between tests**
3. **Test constraint violations**
4. **Verify cascading operations**

### Mocking Guidelines
1. **Mock at system boundaries**
2. **Don't mock what you don't own** (except for testing)
3. **Prefer fakes over mocks** when possible
4. **Keep mocks simple and realistic**

### Test Maintenance
1. **Update tests with code changes**
2. **Remove obsolete tests**
3. **Refactor test code like production code**
4. **Monitor test performance**

## Security Testing Considerations

### Authentication Testing
- Test password hashing and verification
- Verify session handling
- Test authorization boundaries
- Check for user enumeration vulnerabilities

### Data Isolation Testing
- Test hotel-based data separation
- Verify role-based access controls
- Test cross-tenant data leakage prevention
- Validate input sanitization

### Example Security Test
```typescript
it('should prevent cross-hotel data access', async () => {
  const hotel1 = await seedTestData()
  const hotel2 = await seedTestData()

  // Create intervention in hotel1
  const intervention = await testPrisma.intervention.create({
    data: { hotelId: hotel1.id, ... }
  })

  // User from hotel2 should not see hotel1 interventions
  const userHotel2 = await testPrisma.user.create({
    data: { hotelId: hotel2.id, ... }
  })

  // Test that filtering works correctly
  const interventions = await getInterventions(userHotel2)
  expect(interventions.find(i => i.id === intervention.id)).toBeUndefined()
})
```

## Development Workflow

### Adding New Tests
1. Create test file alongside implementation
2. Write failing test first
3. Implement feature to make test pass
4. Refactor and ensure all tests pass
5. Check coverage with `npm run test:coverage`

### Running Specific Tests
```bash
# Run tests for specific file
npm run test src/app/actions/__tests__/auth.test.ts

# Run tests matching pattern
npm run test -- --grep "authentication"

# Run tests in specific directory
npm run test src/lib/
```

### Debugging Tests
```bash
# Debug mode with VSCode
npm run test:debug

# Verbose output
npm run test -- --reporter=verbose

# Watch specific file
npm run test:watch src/app/actions/__tests__/auth.test.ts
```

## Future Enhancements

### Planned Additions
- End-to-end testing with Playwright
- Visual regression testing
- Performance testing benchmarks
- Load testing capabilities
- Component testing for UI elements

### Testing Metrics Goals
- Maintain >80% code coverage
- Keep test suite under 30 seconds execution time
- Zero flaky tests
- 100% critical path coverage

---

**Need help?** Check the [Vitest documentation](https://vitest.dev/) or [Testing Library guides](https://testing-library.com/) for more advanced testing patterns and troubleshooting.