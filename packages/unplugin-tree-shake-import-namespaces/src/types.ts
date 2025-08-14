import type { TreeShakeImportResolver } from "@monstermann/tree-shake-import-namespaces"
import type { FilterPattern } from "unplugin"

export interface Options {
    debug?: boolean | FilterPattern
    enforce?: "post" | "pre" | undefined
    exclude?: FilterPattern
    include?: FilterPattern
    nested?: boolean
    resolve: TreeShakeImportResolver | TreeShakeImportResolver[]
}
