import type { TreeShakeImportsOptions } from "./types"
import remapping from "@jridgewell/remapping"
import { SourceMap } from "magic-string"
import { transform } from "./transform"

export * from "./types"

export default function (
    code: string,
    filePath: string,
    { debug, nested, resolve }: TreeShakeImportsOptions,
): {
    code: string
    map: SourceMap
} | undefined {
    const resolvers = Array.isArray(resolve) ? resolve : [resolve]
    let lastRun = transform(code, filePath, debug, resolvers)

    if (!lastRun.hasChanged()) return

    if (!nested) {
        return {
            code: lastRun.toString(),
            get map() {
                return lastRun.generateMap({
                    hires: "boundary",
                    includeContent: true,
                    source: filePath,
                })
            },
        }
    }

    const runs = [lastRun]

    while (true) {
        const nextRun = transform(lastRun.toString(), filePath, debug, resolvers)
        if (!nextRun.hasChanged()) break
        lastRun = nextRun
        // Collect all runs for the purpose of combining sourcemaps.
        // @jridgewell/remapping requires sourcemaps to be combined in reverse order.
        runs.unshift(nextRun)
    }

    return {
        code: lastRun.toString(),
        get map() {
            const maps = runs.map(ms => ms.generateDecodedMap({
                hires: "boundary",
                includeContent: true,
                source: filePath,
            }) as any)

            const combined = remapping(maps, () => null, {
                decodedMappings: true,
            })

            return new SourceMap(combined as any)
        },
    }
}
