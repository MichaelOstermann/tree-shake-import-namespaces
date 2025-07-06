import { defineConfig } from "vitepress"
import { groupIconMdPlugin, groupIconVitePlugin, localIconLoader } from "vitepress-plugin-group-icons"

export default defineConfig({
    base: "/tree-shake-import-namespaces/",
    description: "Tree-shake import namespaces with oxc.",
    title: "tree-shake-import-namespaces",
    markdown: {
        theme: {
            dark: "catppuccin-macchiato",
            light: "github-light-default",
        },
        config(md) {
            md.use(groupIconMdPlugin)
        },
    },
    themeConfig: {
        outline: "deep",
        docFooter: {
            next: false,
            prev: false,
        },
        search: {
            provider: "local",
        },
        socialLinks: [
            { icon: "github", link: "https://github.com/MichaelOstermann/tree-shake-import-namespaces" },
        ],
    },
    vite: {
        plugins: [
            groupIconVitePlugin({
                customIcon: {
                    rolldown: "vscode-icons:file-type-rolldown",
                    rspack: localIconLoader(import.meta.url, "../assets/rspack-logo.svg"),
                },
            }),
        ],
    },
})
