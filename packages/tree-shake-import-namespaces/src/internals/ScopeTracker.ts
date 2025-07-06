import { ScopeTracker as OXCScopeTracker } from "oxc-walker"

export class ScopeTracker extends OXCScopeTracker {
    generatedIdentifiers = new Set<string>()

    generateImportAlias(scopes: Set<string>, name: string): string {
        let counter = 0
        let result = generateIdentifier(name, counter)
        while (this.generatedIdentifiers.has(result) || this.isDeclaredIn(scopes, result)) {
            result = generateIdentifier(name, ++counter)
        }
        return result
    }

    // Reference: https://github.com/oxc-project/oxc-walker/blob/main/src/scope-tracker.ts#L262C3-L274C4
    getUsedIdentifiers(scopes: Set<string>) {
        const result = new Set<string>(this.generatedIdentifiers)

        for (const scope of scopes) {
            this.scopeIndexKey = scope
            const indices = this.scopeIndexKey.split("-").map(Number)
            for (let i = indices.length; i >= 0; i--) {
                for (const name of this.scopes.get(indices.slice(0, i).join("-"))?.keys() ?? []) {
                    result.add(name)
                }
            }
        }

        return result
    }

    isDeclaredIn(scopes: Set<string>, name: string): boolean {
        for (const scope of scopes) {
            this.scopeIndexKey = scope
            if (this.isDeclared(name)) return true
        }
        return false
    }

    reportGeneratedIdentifer(name: string): void {
        this.generatedIdentifiers.add(name)
    }
}

function generateIdentifier(name: string, counter: number): string {
    return `_${name}${counter || ""}`
}
