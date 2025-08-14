/* eslint-disable no-console */
import type { ImportDeclaration, ImportDeclarationSpecifier } from "oxc-parser"
import type { Context, ImportSpecifierMetadata } from "./internals/types"
import type { TreeShakeImportResolver } from "./types"
import MagicString from "magic-string"
import { parseAndWalk } from "oxc-walker"
import pc from "picocolors"
import { collectImport } from "./internals/collectImport"
import { collectMember } from "./internals/collectMember"
import { resolveImports } from "./internals/resolveImports"
import { ScopeTracker } from "./internals/ScopeTracker"
import { transformImports } from "./internals/transformImports"
import { transformMembers } from "./internals/transformMembers"

export function transform(
    code: string,
    filePath: string,
    debug: boolean | undefined,
    resolvers: TreeShakeImportResolver[],
): MagicString {
    if (debug) {
        const text = `Transforming: ${filePath}`
        const line = "─".repeat(text.length)
        console.log(pc.cyan(`╭─${line}─╮`))
        console.log(pc.cyan(`│ ${text} │`))
        console.log(pc.cyan(`╰─${line}─╯`))
    }

    const ctx: Context = {
        code,
        debug,
        filePath,
        importDeclarations: new Set<ImportDeclaration>(),
        importSpecifiers: new Map<ImportDeclarationSpecifier, ImportSpecifierMetadata>(),
        ms: new MagicString(code, { filename: filePath }),
        resolvers,
        scopeTracker: new ScopeTracker({ preserveExitedScopes: true }),
    }

    parseAndWalk(code, filePath, {
        scopeTracker: ctx.scopeTracker,
        enter(node) {
            if (node.type === "ImportDeclaration") collectImport(ctx, node)
            else if (node.type === "MemberExpression") collectMember(ctx, node)
            else if (node.type === "JSXMemberExpression") collectMember(ctx, node)
        },
    })

    resolveImports(ctx)
    transformImports(ctx)
    transformMembers(ctx)

    return ctx.ms
}
