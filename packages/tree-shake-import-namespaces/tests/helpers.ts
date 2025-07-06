import type { TreeShakeImportsOptions } from "../src/types"
import redent from "redent"
import { expect } from "vitest"
import transform from "../src/index"

export const defaultOptions: TreeShakeImportsOptions = {
    resolveImport(data) {
        return `import { ${data.propertyName} as ${data.importAlias} } from "${data.importPath}/${data.propertyName}";`
    },
}

export function expectSnapshot(code: string, options: TreeShakeImportsOptions = defaultOptions): void {
    code = redent(code).trim()
    const actual = transform(code, "source.tsx", options)
    const result = actual
        ? [actual.code, JSON.stringify(actual.map, null, 2)].join("\n\n")
        : ""
    expect(result).toMatchSnapshot()
}
