/* eslint-disable no-console */
import type { Context } from "./types"
import pc from "picocolors"

export function transformMembers(ctx: Context): void {
    for (const { properties } of ctx.importSpecifiers.values()) {
        for (const { importAlias, memberExpressions } of properties.values()) {
            let didPrint = false
            for (const memberExpression of memberExpressions) {
                if (!didPrint && ctx.debug) {
                    console.log(pc.magenta("Replacing:"))
                    console.log(pc.red(`- ${ctx.code.slice(memberExpression.start, memberExpression.end)}`))
                    console.log(pc.green(`+ ${importAlias}`))
                    didPrint = true
                }
                ctx.ms.overwrite(memberExpression.start, memberExpression.end, importAlias)
            }
        }
    }
}
