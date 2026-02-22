import { renderWidget } from "@tweaker/devtools-widget";

import "@tweaker/styles/radix-ui.css";
import "@tweaker/devtools-ui/styles.css";

const container = document.getElementById("root");

if (container) {
  renderWidget(container, {});
}
