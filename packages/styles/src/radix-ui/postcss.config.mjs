import postcssImport from "postcss-import";
import postcssNesting from "postcss-nesting";
import postcssBreakpoints from "@radix-ui/themes/postcss-breakpoints.cjs";
import postcssCustomMedia from "postcss-custom-media";
import postcssCombineDuplicatedSelectors from "postcss-combine-duplicated-selectors";
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
    postcssCombineDuplicatedSelectors(),
    postcssDiscardEmpty(),
    postcssWhitespace(),
    postcssMediaToContainer({
      containerName: "tweaker-devtools",
      filter: (path) => Boolean(path.match(/radix-ui[\\/]index\.css/)),
    }),
    autoprefixer(),
  ],
};
