# Angular Rules

Project uses Angular 21 exactly. Do not mix Angular versions. Do not use deprecated or legacy APIs.

## Architecture

- Standalone components only.
- Signals-first architecture.
- Services expose Signals only.
- Components must consume Signals directly.
- No RxJS state management in components.
- No manual subscribe in components.
- Never use BehaviorSubject or Subject for state.
- Never mix Observables and Signals in templates.
- Never introduce module-based components.

## Control Flow

- Use @if, @for, @switch.
- Never use *ngIf, *ngFor, *ngSwitch.

## Templates

- Use signal invocation syntax: mySignal()
- No async pipe.
- Prefer optional chaining over nested conditionals.
