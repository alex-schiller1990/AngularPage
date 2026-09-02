Code Quality Principles:
- Prioritize simplicity and readability over performance and cleverness.
- Prefer explicit and straightforward solutions.
- Avoid unnecessary abstractions.
- Avoid over-engineering.
- Do not optimize prematurely.
- Write code that is easy to understand for other developers.
- Favor clarity over DRY if it improves readability.


Project uses Angular 21 exactly.
Do not mix Angular versions.
Do not use deprecated or legacy APIs.

Architecture:
- Standalone components only.
- Signals-first architecture.
- Services expose Signals only.
- Components must consume Signals directly.
- No RxJS state management in components.
- No manual subscribe in components.

Control Flow:
- Use @if, @for, @switch.
- Never use *ngIf, *ngFor, *ngSwitch.

Templates:
- Use signal invocation syntax: mySignal()
- No async pipe.
- Prefer optional chaining over nested conditionals.

Firestore:
- Use onSnapshot for real-time updates.
- Wrap Firestore access in helper functions (e.g. collectionData$, docData$).
- Services convert Firestore streams into Signals.
- Components must never access Firestore directly.

Caching:
- Implement in-memory caching inside services using Signals.
- Prevent duplicate Firestore listeners by caching per document ID.
- Cache survives route changes but not page reload.

Strict Rules:
- Never use BehaviorSubject or Subject for state.
- Never mix Observables and Signals in templates.
- Never introduce module-based components.
- Keep architecture consistent and modern.

Testing:
- This project uses Vitest (not Jasmine). Do not use Jasmine-only matchers such as toBeTrue() or toBeFalse(); use toBe(true) / toBe(false) instead.
- Test command: ng test --watch=false
- After modifying existing code, always run the tests. If any tests fail, first determine whether the implementation broke something or whether the test no longer matches updated logic before changing either side.
- After creating new code (functions, services, utilities, pipes), check whether unit tests would be appropriate. Add them if so — pure functions and transformation logic should always be tested. Use plain describe/it blocks with no TestBed for pure functions.
- Test files live next to the file they test (e.g. foo.utils.spec.ts beside foo.utils.ts).
- Do not use TestBed for pure functions or stateless utilities.