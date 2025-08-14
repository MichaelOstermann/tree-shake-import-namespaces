import type MagicString from "magic-string"
import type { ImportDeclaration, ImportDeclarationSpecifier, JSXMemberExpression, MemberExpression } from "oxc-parser"
import type { TreeShakeImportResolver } from "../types"
import type { ScopeTracker } from "./ScopeTracker"

export interface ImportSpecifierMetadata {
    importDeclaration: ImportDeclaration
    importName: string | undefined
    importPath: string
    localName: string
    newImports: string[]
    properties: Map<string, {
        importAlias: string
        memberExpressions: Set<MemberExpression | JSXMemberExpression>
        scopes: Set<string>
    }>
}

export interface Context {
    code: string
    debug: boolean | undefined
    filePath: string
    importDeclarations: Set<ImportDeclaration>
    importSpecifiers: Map<ImportDeclarationSpecifier, ImportSpecifierMetadata>
    ms: MagicString
    resolvers: TreeShakeImportResolver[]
    scopeTracker: ScopeTracker
}
