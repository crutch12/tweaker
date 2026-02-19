import postcssImport from "postcss-import";
import postcssNesting from "postcss-nesting";
import postcssBreakpoints from "@radix-ui/themes/postcss-breakpoints.cjs";
import postcssCustomMedia from "postcss-custom-media";
import postcssCombineDuplicatedSelectors from "postcss-combine-duplicated-selectors";
import postcssDiscardEmpty from "postcss-discard-empty";
import postcssWhitespace from "@radix-ui/themes/postcss-whitespace.cjs";
import autoprefixer from "autoprefixer";

/**  @type import('postcss').PluginCreator<{ containerName: string, filter?: (path: string) => boolean }> */
const postcssReplaceMediaWithContainer = ({
  containerName,
  filter = () => true,
}) => {
  const pluginName = "replace-media-with-container";

  const supportedRules = [
    "width",
    "min-width",
    "max-width",
    "height",
    "min-height",
    "max-height",
    "inline-size",
    "min-inline-size",
    "block-size",
    "min-block-size",
    "aspect-ratio",
    "orientation",
  ];

  return {
    postcssPlugin: pluginName,
    OnceExit(root) {
      const filePath = root.source?.input.file || "<unknown>";

      if (!filter(filePath)) return;

      console.log(pluginName, "processing file", filePath);

      root.walkAtRules("media", (atRule) => {
        const ruleIsSupported = supportedRules.some((rule) =>
          atRule.params.includes(`${rule}:`),
        );
        if (!ruleIsSupported) return;
        atRule.name = "container";
        atRule.params = [containerName.trim() + " ", atRule.params]
          .filter(Boolean)
          .join("");
      });
    },
  };
};
/**
 * Since we import @radix-ui/themes/src/styles/index.css to override breakpoints, we should implement the same postcss config
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/postcss.config.cjs
 */
export default {
  plugins: [
    postcssImport(),
    postcssNesting(),
    postcssBreakpoints(),
    postcssCustomMedia(),
    postcssCombineDuplicatedSelectors(),
    postcssDiscardEmpty(),
    postcssWhitespace(),
    postcssReplaceMediaWithContainer({
      containerName: "tweaker-devtools",
      filter: (path) => Boolean(path.match(/styles[\\/]radix\.css/)),
    }),
    autoprefixer(),
  ],
};
