/* eslint-disable no-console */
import type { ImportDeclarationSpecifier } from "oxc-parser"
import type { TreeShakeImportData, TreeShakeImportResolver } from "../types"
import type { Context, ImportSpecifierMetadata } from "./types"
import { parseAndWalk } from "oxc-walker"
import pc from "picocolors"

export function resolveImports(ctx: Context): void {
    for (const [importSpecifier, importMetadata] of ctx.importSpecifiers) {
        // We have not found any MemberExpressions associated with this import, ignore this.
        if (importMetadata.properties.size === 0) {
            ctx.importSpecifiers.delete(importSpecifier)
            continue
        }

        resolveMemberExpressions(ctx, importSpecifier, importMetadata)
    }
}

function resolveMemberExpressions(
    ctx: Context,
    importSpecifier: ImportDeclarationSpecifier,
    importMetadata: ImportSpecifierMetadata,
): void {
    for (const [propertyName, property] of importMetadata.properties) {
        const importData: TreeShakeImportData = {
            filePath: ctx.filePath,
            importAlias: ctx.scopeTracker.generateImportAlias(property.scopes, propertyName),
            importName: importMetadata.importName,
            importPath: importMetadata.importPath,
            localName: importMetadata.localName,
            propertyName,
            get scope() {
                return ctx.scopeTracker.getUsedIdentifiers(property.scopes)
            },
        }

        if (ctx.debug) {
            const importDeclaration = importMetadata.importDeclaration
            const memberExpressionSample = Array.from(property.memberExpressions)[0]!
            console.log(pc.magenta("Resolving:"))
            console.log(pc.magenta("  Import:"), ctx.code.slice(importDeclaration.start, importSpecifier.start) + pc.blue(ctx.code.slice(importSpecifier.start, importSpecifier.end)) + ctx.code.slice(importSpecifier.end, importDeclaration.end))
            console.log(pc.magenta("  Member:"), ctx.code.slice(memberExpressionSample.start, memberExpressionSample.end))
        }

        let resolvedImport: ReturnType<TreeShakeImportResolver>

        for (const resolve of ctx.resolvers) {
            resolvedImport = resolve(importData)
            if (resolvedImport) break
        }

        if (ctx.debug) {
            console.log(pc.magenta("  Result:"), resolvedImport)
        }

        if (!resolvedImport) {
            ctx.importSpecifiers.delete(importSpecifier)
            return
        }

        property.importAlias = getImportAliasName(resolvedImport)
        ctx.scopeTracker.reportGeneratedIdentifer(property.importAlias)

        importMetadata.newImports.push(resolvedImport)
    }
}

function getImportAliasName(code: string): string {
    let aliasName: string | undefined
    parseAndWalk(code, "source.ts", (node) => {
        if (node.type !== "ImportDeclaration") return
        for (const specifier of node.specifiers)
            aliasName = specifier.local.name
    })
    if (!aliasName) throw new Error(`tree-shake-import-namespaces: Could not extract valid import name from "${code}"`)
    return aliasName
}
