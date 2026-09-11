# Firestore & Caching Rules

## Data Access

- Use onSnapshot for real-time updates.
- Wrap Firestore access in helper functions (e.g. collectionData$, docData$).
- Services convert Firestore streams into Signals.
- Components must never access Firestore directly.

## Caching

- Implement in-memory caching inside services using Signals.
- Prevent duplicate Firestore listeners by caching per document ID.
- Cache survives route changes but not page reload.
