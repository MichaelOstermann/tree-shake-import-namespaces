import type MagicString from "magic-string"
import type { ImportDeclaration, ImportDeclarationSpecifier, JSXMemberExpression, MemberExpression } from "oxc-parser"
import type { ScopeTracker } from "oxc-walker"
import type { TreeShakeImportResolver } from "../types"

export interface ImportSpecifierMetadata {
    importDeclaration: ImportDeclaration
    importName: string | undefined
    importPath: string
    localName: string
    newImports: string[]
    properties: Map<string, {
        importAlias: string
        memberExpressions: Set<MemberExpression | JSXMemberExpression>
    }>
}

export interface Context {
    code: string
    debug: boolean | undefined
    filePath: string
    identifiers: Set<string>
    importDeclarations: Set<ImportDeclaration>
    importSpecifiers: Map<ImportDeclarationSpecifier, ImportSpecifierMetadata>
    ms: MagicString
    resolvers: TreeShakeImportResolver[]
    scopeTracker: ScopeTracker
}
