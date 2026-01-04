import type { ImportDeclarationSpecifier, JSXIdentifier, JSXMemberExpression, MemberExpression, Node } from "oxc-parser"
import type { Identifier } from "oxc-walker"
import type { Context } from "./types"

export function collectMember(ctx: Context, node: MemberExpression | JSXMemberExpression): void {
    const namespaceNode = node.object
    if (!isIdentifier(namespaceNode)) return

    // Get the ImportSpecifier associated with the left side of this MemberExpression, ignore if this is referencing anything else.
    const importSpecifier = ctx.scopeTracker.getDeclaration(namespaceNode.name)?.node
    if (!isImportSpecifier(importSpecifier)) return

    const importMetadata = ctx.importSpecifiers.get(importSpecifier)
    if (!importMetadata) return

    // Skip if the right side is something odd like `Foo["bar"]` instead of `Foo.bar`.
    const propertyNode = node.property
    if (!isIdentifier(propertyNode)) return void ctx.importSpecifiers.delete(importSpecifier)

    // Register this MemberExpression in its associated ImportSpecifier, we need to collect everything else first
    // and then come back to this - we can not generate imports already because we need to be aware of all identifiers
    // first before we can start generating identifiers.

    const property = importMetadata.properties.get(propertyNode.name)

    if (property) {
        property.memberExpressions.add(node)
    }
    else {
        importMetadata.properties.set(propertyNode.name, {
            importAlias: "",
            memberExpressions: new Set([node]),
        })
    }
}

function isIdentifier(node: Node): node is Identifier | JSXIdentifier {
    return node.type === "Identifier"
        || node.type === "JSXIdentifier"
}

function isImportSpecifier(node: Node | undefined): node is ImportDeclarationSpecifier {
    if (!node) return false
    return node.type === "ImportSpecifier"
        || node.type === "ImportDefaultSpecifier"
        || node.type === "ImportNamespaceSpecifier"
}
