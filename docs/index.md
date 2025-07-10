# tree-shake-import-namespaces

**Tree-shake import namespaces with oxc.**

This is a set of plugins that helps you to use TypeScript [namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html), [ambient namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html#ambient-namespaces), barrel files, or modules with many named exports by tree-shaking and rewiring their import declarations into direct imports:

::: code-group

```ts [Before]
import { User } from "#utils";
const userEmail = User.email(user);
```

```ts [After]
import { email } from "foo/bar/utils/User/email";
const userEmail = email(user);
```

:::

## Features

- Fast, uses the [Oxidation Compiler](https://oxc.rs/) under the hood
- Supports default, named and wildcard imports, including mixed import types
- Allows you to rewire or skip each individual imported module
- No hardcoded assumptions about your file structure, you can roll your own module resolution
- Optionally supports recursive destructuring for nested namespaces
- Supports JSX
- Sourcemap generation
- [Unplugin](#unplugin-tree-shake-import-namespaces) for convenient integration with modern bundlers

## How it works

Given the example:

```ts
import { User } from "#utils";
const userEmail = User.email(user);
```

First, this plugin will collect import declarations (`import { User } from "#utils";`), member expressions bound to these imports (`User.email`) and their scope information.

This information will be forwarded to a function provided by you:

```ts
treeshake(code, "source.ts", {
    resolveImport({
        filePath = "source.ts",
        importName = "User",
        importPath = "#utils",
        localName = "User",
        propertyName = "email",
    }) {},
});
```

You can use this to declare a new import statement, for example:

```ts
treeshake(code, "source.ts", {
    resolveImport({ propertyName, importPath }) {
        // import { email } from "#utils/email"
        return `import { ${propertyName} } from "${importPath}/${propertyName}";`;
    },
});
```

The plugin will extract the desired import name, in this example `email`.

Following that, the import declarations are rewritten as necessary - in this case replacing the entire import:

```ts
import { User } from "#utils"; // [!code --]
import { email } from "#utils/email"; // [!code ++]
```

Then all relevant member expressions are replaced with the new import name:

```ts
const userEmail = User.email(user); // [!code --]
const userEmail = email(user); // [!code ++]
```

## Unique import names

In the above example, it is easy to declare an import statement that results with naming conflicts:

::: code-group

```ts [Before]
import { User } from "#utils";
const email = User.email(user);
```

```ts [After]
import { email } from "#utils/email";
const email = email(user);
```

:::

The plugin will generate an import name (`importAlias`) that is ensured to be unique across all relevant scopes as a suggestion:

```ts
treeshake(code, "source.ts", {
    resolveImport({ importAlias, propertyName, importPath }) {
        // import { email as _email } from "#utils/email"
        return `import { ${propertyName} as ${importAlias} } from "${importPath}/${propertyName}";`;
    },
});
```

```ts
import { email as _email } from "#utils/email";
const email = _email(user);
```

And alternatively you can access all used bindings to generate your own if you'd like:

```ts
treeshake(code, "source.ts", {
    resolveImport({ scopes, propertyName, importPath }) {
        let name = propertyName;
        while (scopes.has(name)) name += "$";
        // import { email as email$ } from "#utils/email"
        return `import { ${propertyName} as ${name} } from "${importPath}/${propertyName}";`;
    },
});
```

```ts
import { email as email$ } from "#utils/email";
const email = email$(user);
```

## tree-shake-import-namespaces

### Installation

::: code-group

```sh [npm]
npm install -D @monstermann/tree-shake-import-namespaces
```

```sh [pnpm]
pnpm -D add @monstermann/tree-shake-import-namespaces
```

```sh [yarn]
yarn -D add @monstermann/tree-shake-import-namespaces
```

```sh [bun]
bun -D add @monstermann/tree-shake-import-namespaces
```

:::

### Usage

```ts
import treeshake from "@monstermann/tree-shake-import-namespaces";

const result = treeshake(code, filePath, options);

// `undefined` if no changes to the code have been made
if (!result) return;

// Transformed code
result.code;

// Sourcemap if needed
result.map;
```

### Options

```ts
import treeshake from "@monstermann/tree-shake-import-namespaces";

interface TreeShakeImportData {
    // The path of the file being transformed.
    filePath: string;

    // The generated alias name that is safe to use for the new import.
    importAlias: string;

    // Bindings that are already in use, useful if
    // you want to create your own import aliases.
    scope: Set<string>;

    // The imported module name, if available:
    // import { Foo } from "foo" → "Foo"
    // import { Foo as Bar } from "foo" → "Foo"
    // import * as Bar from "foo" → "*"
    // import Foo from "foo" → undefined
    importName: string | undefined;

    // The path of the imported module:
    // import { Foo } from "foo" → "foo"
    importPath: string;

    // The local alias of the imported module:
    // import { Foo } from "foo" → "Foo"
    // import { Foo as Bar } from "foo" → "Bar"
    // import * as Bar from "foo" → "Bar"
    // import Foo from "foo" → "Foo"
    localName: string;

    // The property that was used in the member expression:
    // Foo.bar; → "bar"
    propertyName: string;
}

treeshake(code, filePath, {
    // Print detailed information to stdout if needed:
    debug?: true,

    // Enable destructuring nested properties if needed:
    nested?: true,

    resolveImport(importData: TreeShakeImportData) {
        // Skip tree-shaking this import:
        return false;
        return null;
        return undefined;

        // Tree-shake this import by returning an import declaration
        // that should be injected - make sure you use `importAlias`!
        return `
            import { ${propertyName} as ${importAlias} }
            from "${importPath}/${propertyName}";
        `;
    },
});
```

## unplugin-tree-shake-import-namespaces

### Installation

::: code-group

```sh [npm]
npm install -D @monstermann/unplugin-tree-shake-import-namespaces
```

```sh [pnpm]
pnpm -D add @monstermann/unplugin-tree-shake-import-namespaces
```

```sh [yarn]
yarn -D add @monstermann/unplugin-tree-shake-import-namespaces
```

```sh [bun]
bun -D add @monstermann/unplugin-tree-shake-import-namespaces
```

:::

### Usage

::: code-group

```ts [Vite]
// vite.config.ts
import treeshake from "@monstermann/unplugin-tree-shake-import-namespaces/vite";

export default defineConfig({
    plugins: [treeshake(options)],
});
```

```ts [Rollup]
// rollup.config.js
import treeshake from "@monstermann/unplugin-tree-shake-import-namespaces/rollup";

export default {
    plugins: [treeshake(options)],
};
```

```ts [Rolldown]
// rolldown.config.js
import treeshake from "@monstermann/unplugin-tree-shake-import-namespaces/rolldown";

export default {
    plugins: [treeshake(options)],
};
```

```ts [Webpack]
// webpack.config.js
module.exports = {
    plugins: [
        require("@monstermann/unplugin-tree-shake-import-namespaces/webpack")(
            options,
        ),
    ],
};
```

```ts [Rspack]
// rspack.config.js
module.exports = {
    plugins: [
        require("@monstermann/unplugin-tree-shake-import-namespaces/rspack")(
            options,
        ),
    ],
};
```

```ts [ESBuild]
// esbuild.config.js
import { build } from "esbuild";
import treeshake from "@monstermann/unplugin-tree-shake-import-namespaces/esbuild";

build({
    plugins: [treeshake(options)],
});
```

:::

### Options

```ts
import treeshake from "@monstermann/unplugin-tree-shake-import-namespaces";

interface TreeShakeImportData {
    // The path of the file being transformed.
    filePath: string;

    // The generated alias name that is safe to use for the new import.
    importAlias: string;

    // Bindings that are already in use, useful if
    // you want to create your own import aliases.
    scope: Set<string>;

    // The imported module name, if available:
    // import { Foo } from "foo" → "Foo"
    // import { Foo as Bar } from "foo" → "Foo"
    // import * as Bar from "foo" → "*"
    // import Foo from "foo" → undefined
    importName: string | undefined;

    // The path of the imported module:
    // import { Foo } from "foo" → "foo"
    importPath: string;

    // The local alias of the imported module:
    // import { Foo } from "foo" → "Foo"
    // import { Foo as Bar } from "foo" → "Bar"
    // import * as Bar from "foo" → "Bar"
    // import Foo from "foo" → "Foo"
    localName: string;

    // The property that was used in the member expression:
    // Foo.bar; → "bar"
    propertyName: string;
}

treeshake({
    // Print detailed information to stdout if needed:
    // Strings and RegExps can be used to match file paths.
    debug?: Boolean | String | RegExp | Array[...String | RegExp],

    // Enable destructuring nested properties if needed:
    // Strings and RegExps can be used to match file paths.
    nested?: Boolean | String | RegExp | Array[...String | RegExp],

    // Specify which file paths to include when transforming:
    include?: String | RegExp | Array[...String | RegExp],

    // Specify which file paths to exclude when transforming:
    exclude?: String | RegExp | Array[...String | RegExp],

    // Enforce plugin order for bundlers that support this:
    enforce?: "post" | "pre" | undefined,

    resolveImport(importData: TreeShakeImportData) {
        // Skip tree-shaking this import:
        return false;
        return null;
        return undefined;

        // Tree-shake this import by returning an import declaration
        // that should be injected - make sure you use `importAlias`!
        return `
            import { ${propertyName} as ${importAlias} }
            from "${importPath}/${propertyName}";
        `;
    },
});
```

## Tips

### oxc-resolver

This plugin will report imported paths as-is.

If you need to work with resolved module paths, eg.:

::: code-group

```ts [Code]
import { Foo } from "#utils/Foo";
```

```json [tsconfig.json]
{
    "compilerOptions": {
        "paths": {
            "#utils/*": ["./src/utils/*"]
        }
    }
}
```

:::

And you would like to resolve `#utils/Foo` to `$PWD/src/utils/Foo`, you can consider giving [oxc-resolver](https://github.com/oxc-project/oxc-resolver) a try.
