import postcssImport from "postcss-import";
import postcssNesting from "postcss-nesting";
import postcssBreakpoints from "@radix-ui/themes/postcss-breakpoints.cjs";
import postcssCustomMedia from "postcss-custom-media";
import postcssPrefixSelector from "postcss-prefix-selector";
// import postcssCombineDuplicatedSelectors from "postcss-combine-duplicated-selectors";
import postcssDiscardEmpty from "postcss-discard-empty";
import postcssWhitespace from "@radix-ui/themes/postcss-whitespace.cjs";
import postcssMediaToContainer from "postcss-media-to-container";
import autoprefixer from "autoprefixer";

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
    // (NEW) force generated styles to have "tdrt" namespace, so we wouldn't have collisions with other frameworks
    postcssPrefixSelector({
      prefix: ".tdrt", // tweaker-devtools-radix-themes namespace
      transform: function (prefix, selector, prefixedSelector, filePath, rule) {
        if (selector.startsWith(".tdrt")) {
          return selector;
        }
        if (selector.startsWith(":is")) {
          return [prefix, selector].join("");
        }
        return prefixedSelector;
      },
    }),
    // postcssCombineDuplicatedSelectors(), // duplicates a lot of queries when using "postcssPrefixSelector", disabled
    postcssDiscardEmpty(),
    postcssWhitespace(),
    // (NEW) replace all radix's "@media" queries with "@container" queries
    postcssMediaToContainer({
      containerName: "tweaker-devtools",
      filter: (path) => Boolean(path.match(/radix-ui[\\/]index\.css/)),
    }),
    autoprefixer(),
  ],
};
