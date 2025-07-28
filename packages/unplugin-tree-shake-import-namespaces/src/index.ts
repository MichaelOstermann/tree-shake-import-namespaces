import type { Options } from "./types"
import transform from "@monstermann/tree-shake-import-namespaces"
import { createUnplugin } from "unplugin"
import { createFilter } from "unplugin-utils"

export default createUnplugin<Options>(({ debug, enforce, exclude, include, nested, resolveImport }) => {
    const shouldDebug = debug === undefined
        ? () => false
        : typeof debug === "boolean"
            ? () => debug
            : createFilter(debug)

    return {
        enforce,
        name: "unplugin-tree-shake-import-namespaces",
        transform: {
            filter: {
                id: {
                    exclude,
                    include: include || [/\.[jt]sx?$/],
                },
            },
            handler(code, id) {
                return transform(code, id, {
                    debug: shouldDebug(id),
                    nested,
                    resolveImport,
                })
            },
        },
    }
})
