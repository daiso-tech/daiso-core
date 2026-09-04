// Dependency chain used to demonstrate lifetime relationships.
// The chain is: C → B → A
export class A {}

export class B {
    constructor(private a: A) {
        /* ... */
    }
}

export class C {
    constructor(private b: B) {
        /* ... */
    }
}
