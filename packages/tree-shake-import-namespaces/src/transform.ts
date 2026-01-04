/* eslint-disable no-console */
import type { Context } from "./internals/types"
import type { TreeShakeImportResolver } from "./types"
import MagicString from "magic-string"
import { parseAndWalk, ScopeTracker } from "oxc-walker"
import pc from "picocolors"
import { collectImport } from "./internals/collectImport"
import { collectMember } from "./internals/collectMember"
import { resolveImports } from "./internals/resolveImports"
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
        identifiers: new Set(),
        importDeclarations: new Set(),
        importSpecifiers: new Map(),
        ms: new MagicString(code, { filename: filePath }),
        resolvers,
        scopeTracker: new ScopeTracker(),
    }

    parseAndWalk(code, filePath, {
        scopeTracker: ctx.scopeTracker,
        enter(node) {
            if (node.type === "Identifier") ctx.identifiers.add(node.name)
            else if (node.type === "ImportDeclaration") collectImport(ctx, node)
            else if (node.type === "MemberExpression") collectMember(ctx, node)
            else if (node.type === "JSXMemberExpression") collectMember(ctx, node)
        },
    })

    resolveImports(ctx)
    transformImports(ctx)
    transformMembers(ctx)

    return ctx.ms
}
