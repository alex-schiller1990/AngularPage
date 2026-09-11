# Testing Rules

- This project uses Vitest (not Jasmine). Do not use Jasmine-only matchers such as toBeTrue() or
  toBeFalse(); use toBe(true) / toBe(false) instead.
- Test command: `ng test --watch=false`
- After modifying existing code, always run the tests. If any tests fail, first determine whether
  the implementation broke something or whether the test no longer matches updated logic before
  changing either side.
- After creating new code (functions, services, utilities, pipes), check whether unit tests would
  be appropriate. Add them if so — pure functions and transformation logic should always be tested.
  Use plain describe/it blocks with no TestBed for pure functions.
- Test files live next to the file they test (e.g. foo.utils.spec.ts beside foo.utils.ts).
- Do not use TestBed for pure functions or stateless utilities.
