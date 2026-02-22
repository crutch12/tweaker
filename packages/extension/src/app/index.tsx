import { renderWidget } from "@tweaker/devtools-widget";

// import radixStyles from "@tweaker/styles/radix-ui.css?url";
// import devtoolsStyles from "@tweaker/devtools-ui/styles.css?url";

const container = document.getElementById("root");

if (container) {
  renderWidget(container, {
    // includeStyles: [radixStyles, devtoolsStyles],
  });
}
