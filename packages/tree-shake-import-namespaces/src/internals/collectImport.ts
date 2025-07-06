import type { ImportDeclaration, ImportDeclarationSpecifier } from "oxc-parser"
import type { Context } from "./types"

export function collectImport(ctx: Context, node: ImportDeclaration): void {
    ctx.importDeclarations.add(node)
    for (const specifier of node.specifiers) {
        ctx.importSpecifiers.set(specifier, {
            importDeclaration: node,
            importName: getImportName(specifier),
            importPath: node.source.value,
            localName: specifier.local.name,
            newImports: [],
            properties: new Map(),
        })
    }
}

function getImportName(importSpecifier: ImportDeclarationSpecifier): string | undefined {
    if (importSpecifier.type === "ImportDefaultSpecifier") return undefined
    if (importSpecifier.type === "ImportNamespaceSpecifier") return "*"
    return importSpecifier.imported.type === "Literal"
        ? importSpecifier.imported.value
        : importSpecifier.imported.name
}
