import { describe, expect, test } from "vitest";

import { copyObj } from "@/utilities/functions/copy-obj.js";

describe("function: copyObj", () => {
    test("Should return false for referential equality for object literals", () => {
        const obj = { a: 1, b: "hello", c: true };
        const copiedObj = copyObj(obj);

        expect(copiedObj).not.toBe(obj);
    });
    test("Should copy the object literal", () => {
        const obj = { a: 1, b: "hello", c: true };
        const copiedObj = copyObj(obj);

        expect(copiedObj).toEqual(obj);
    });
    test("Should return false for referential equality for class instances", () => {
        class Person {
            constructor(
                public name: string,
                public age: number,
            ) {}

            getGreeting(): string {
                return `Hi, I'm ${this.name} and I'm ${String(this.age)} years old.`;
            }
        }

        const instance = new Person("Alice", 30);
        const copiedInstance = copyObj(instance);

        expect(copiedInstance).not.toBe(instance);
        expect(copiedInstance.getGreeting()).toBe(
            "Hi, I'm Alice and I'm 30 years old.",
        );
    });
    test("Should keep prototype intact when called on class instances by checking instanceof", () => {
        class Animal {
            constructor(public species: string) {}

            getDescription(): string {
                return `A ${this.species}`;
            }

            getSound(): string {
                switch (this.species) {
                    case "dog":
                        return "bark";
                    case "cat":
                        return "meow";
                    default:
                        return "unknown";
                }
            }
        }

        const instance = new Animal("dog");
        const copiedInstance = copyObj(instance);

        expect(copiedInstance).toBeInstanceOf(Animal);
        expect(copiedInstance.getDescription()).toBe("A dog");
        expect(copiedInstance.getSound()).toBe("bark");
    });
    test("Should copy the class instance", () => {
        class Person {
            constructor(
                public name: string,
                public age: number,
            ) {}

            getName(): string {
                return this.name;
            }

            getAge(): number {
                return this.age;
            }

            getGreeting(): string {
                return `Hi, I'm ${this.getName()} and I'm ${String(this.getAge())} years old.`;
            }
        }

        const instance = new Person("Alice", 30);
        const copiedInstance = copyObj(instance);

        expect(copiedInstance).toEqual(instance);
        expect(copiedInstance.getName()).toBe(instance.getName());
        expect(copiedInstance.getAge()).toBe(instance.getAge());
        expect(copiedInstance.getGreeting()).toBe(instance.getGreeting());
    });
});
