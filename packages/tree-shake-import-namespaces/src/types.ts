export interface TreeShakeImportData {
    filePath: string
    importAlias: string
    importName: string | undefined
    importPath: string
    localName: string
    propertyName: string
    scope: Set<string>
}

export interface TreeShakeImportResolver {
    (importData: TreeShakeImportData): string | null | undefined | false | void
}

export interface TreeShakeImportsOptions {
    debug?: boolean
    nested?: boolean
    resolve: TreeShakeImportResolver | TreeShakeImportResolver[]
}
