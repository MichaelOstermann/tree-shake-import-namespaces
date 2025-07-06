/* eslint-disable no-console */
import type { ImportDeclaration, ImportDeclarationSpecifier } from "oxc-parser"
import type { Context } from "./types"
import { generate } from "astring"
import pc from "picocolors"

export function transformImports(ctx: Context): void {
    for (const importDeclaration of ctx.importDeclarations) {
        const specifiersToKeep = collectSpecifiersToKeep(ctx, importDeclaration)

        if (!didChangeImport(importDeclaration, specifiersToKeep)) continue

        const newImports = collectNewImports(ctx, importDeclaration)

        shouldReplaceImport(specifiersToKeep)
            ? replaceImport(ctx, importDeclaration, newImports)
            : updateImport(ctx, importDeclaration, newImports, specifiersToKeep)
    }
}

function collectSpecifiersToKeep(
    ctx: Context,
    importDeclaration: ImportDeclaration,
): ImportDeclarationSpecifier[] {
    return importDeclaration.specifiers.filter(importSpecifier => !ctx.importSpecifiers.has(importSpecifier))
}

function didChangeImport(
    importDeclaration: ImportDeclaration,
    specifiersToKeep: ImportDeclarationSpecifier[],
): boolean {
    return specifiersToKeep.length !== importDeclaration.specifiers.length
}

function collectNewImports(
    ctx: Context,
    importDeclaration: ImportDeclaration,
): string {
    return importDeclaration.specifiers
        .flatMap(importSpecifier => ctx.importSpecifiers.get(importSpecifier)?.newImports ?? [])
        .join("\n")
}

function shouldReplaceImport(specifiersToKeep: ImportDeclarationSpecifier[]): boolean {
    return specifiersToKeep.length === 0
}

function replaceImport(
    ctx: Context,
    importDeclaration: ImportDeclaration,
    newImports: string,
): void {
    if (ctx.debug) {
        console.log(pc.magenta("Replacing:"))
        console.log(pc.red(`- ${ctx.code.slice(importDeclaration.start, importDeclaration.end)}`))
        console.log(newImports.split("\n").map(line => pc.green(`+ ${line}`)).join("\n"))
    }

    ctx.ms.overwrite(importDeclaration.start, importDeclaration.end, newImports)
}

function updateImport(
    ctx: Context,
    importDeclaration: ImportDeclaration,
    newImports: string,
    specifiersToKeep: ImportDeclarationSpecifier[],
): void {
    if (ctx.debug) {
        console.log(pc.magenta("Replacing:"))
        console.log(pc.red(`- ${ctx.code.slice(importDeclaration.start, importDeclaration.end)}`))
    }

    importDeclaration.specifiers = specifiersToKeep

    if (ctx.debug) {
        console.log(pc.green(`+ ${generate(importDeclaration)}`))
        console.log(newImports.split("\n").map(line => pc.green(`+ ${line}`)).join("\n"))
    }

    ctx.ms.overwrite(importDeclaration.start, importDeclaration.end, generate(importDeclaration))
    ctx.ms.appendRight(importDeclaration.end, `\n${newImports}\n`)
}
