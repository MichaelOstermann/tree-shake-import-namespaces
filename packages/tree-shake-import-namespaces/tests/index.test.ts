import { describe, expect, it } from "vitest"
import { defaultOptions, expectSnapshot } from "./helpers"

describe("babel-plugin-tree-shake-imports", () => {
    it("Should tree-shake named imports", () => {
        expectSnapshot(`
            import { Foo } from "foo";
            Foo.bar;
        `, {
            resolveImport(data) {
                expect(data).toEqual({
                    filePath: "source.tsx",
                    importAlias: "_bar",
                    importName: "Foo",
                    importPath: "foo",
                    localName: "Foo",
                    propertyName: "bar",
                    scope: new Set(["Foo"]),
                })
                return defaultOptions.resolveImport(data)
            },
        })
    })

    it("Should tree-shake aliased imports", () => {
        expectSnapshot(`
            import { Foo as Bar } from "foo";
            Bar.bar;
        `, {
            resolveImport(data) {
                expect(data).toEqual({
                    filePath: "source.tsx",
                    importAlias: "_bar",
                    importName: "Foo",
                    importPath: "foo",
                    localName: "Bar",
                    propertyName: "bar",
                    scope: new Set(["Bar"]),
                })
                return defaultOptions.resolveImport(data)
            },
        })
    })

    it("Should tree-shake default imports", () => {
        expectSnapshot(`
            import Foo from "foo";
            Foo.bar;
        `, {
            resolveImport(data) {
                expect(data).toEqual({
                    filePath: "source.tsx",
                    importAlias: "_bar",
                    importName: undefined,
                    importPath: "foo",
                    localName: "Foo",
                    propertyName: "bar",
                    scope: new Set(["Foo"]),
                })
                return defaultOptions.resolveImport(data)
            },
        })
    })

    it("Should tree-shake wildcard imports", () => {
        expectSnapshot(`
            import * as Foo from "foo";
            Foo.bar;
        `, {
            resolveImport(data) {
                expect(data).toEqual({
                    filePath: "source.tsx",
                    importAlias: "_bar",
                    importName: "*",
                    importPath: "foo",
                    localName: "Foo",
                    propertyName: "bar",
                    scope: new Set(["Foo"]),
                })
                return defaultOptions.resolveImport(data)
            },
        })
    })

    it("Should transform JSX", () => {
        expectSnapshot(`
            import { Foo } from "foo";
            const Component = (
                <Foo.Bar>
                </Foo.Bar>
            );
        `, {
            resolveImport(data) {
                expect(data).toEqual({
                    filePath: "source.tsx",
                    importAlias: "_Bar",
                    importName: "Foo",
                    importPath: "foo",
                    localName: "Foo",
                    propertyName: "Bar",
                    scope: new Set(["Foo", "Component"]),
                })
                return defaultOptions.resolveImport(data)
            },
        })
    })

    it("Should tree-shake multiple references", () => {
        expectSnapshot(`
            import { Foo } from "foo";
            Foo.bar;
            Foo.bar;
            Foo.baz;
            Foo.baz;
        `)
    })

    it("Should not tree-shake nested imports by default", () => {
        expectSnapshot(`
            import { Foo } from "foo";
            Foo.bar.baz;
        `)
    })

    it("Should tree-shake nested imports when requested", () => {
        expectSnapshot(`
            import { Foo } from "foo";
            Foo.bar.baz;
        `, {
            ...defaultOptions,
            nested: true,
        })
    })

    it("Should not tree-shake when not desired", () => {
        expectSnapshot(`
            import { A } from "a";
            import { B } from "b";
            A.a;
            B.c;
            B.d;
        `, {
            resolveImport(data) {
                if (data.importName === "B" && data.propertyName === "d") return
                return defaultOptions.resolveImport(data)
            },
        })
    })

    it("Should create unique identifiers", () => {
        expectSnapshot(`
            import { Foo } from "foo";
            Foo.bar;
            const bar = true;
            const _bar = true;
        `)
    })

    it("Should create unique identifiers across scopes", () => {
        expectSnapshot(`
            import { Foo } from "foo";
            Foo.bar;
            const example = function (bar) {
                Foo.bar;
            };
            const example2 = function (_bar) {
                Foo.bar;  
            };
        `)
    })

    it("Should create unique identifiers across namespaces", () => {
        expectSnapshot(`
            import { Foo } from "foo";
            import { Bar } from "bar";
            Foo.baz;
            Bar.baz;
        `)
    })

    it("Should skip irrelevant references", () => {
        expectSnapshot(`
            import { Foo } from "foo";
            function example() {
                const Foo = {};
                return Foo.bar;
            };
        `)
    })

    it("Should skip fishy properties", () => {
        expectSnapshot(`
            import { Foo } from "foo";
            Foo.bar;
            Foo["bar"];
        `)
    })

    it("Should keep unused imports", () => {
        expectSnapshot(`
            import { Foo, Bar } from "foo";
            Foo.bar;
        `)
    })
})
