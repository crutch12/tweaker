declare global {
  interface WindowEventMap {
    "devtools:search": CustomEvent<{
      queryString?: string;
    }>;
  }
}

export function subscribeDevtoolsSearch() {
  const searchResults = new Highlight();
  CSS.highlights.set("search-results", searchResults);

  const handler = (event: WindowEventMap["devtools:search"]) => {
    const queryString = event.detail?.queryString?.trim();
    if (!queryString) {
      searchResults.clear();
      return;
    }

    const contentArea = document.body;

    searchResults.clear();

    if (!queryString) return;

    const walker = document.createTreeWalker(contentArea, NodeFilter.SHOW_TEXT);

    let firstMatchRange = null;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const index =
        node.textContent?.toLowerCase().indexOf(queryString.toLowerCase()) ??
        -1;

      if (index > -1) {
        const range = new Range();
        range.setStart(node, index);
        range.setEnd(node, index + queryString.length);
        searchResults.add(range);

        if (!firstMatchRange) {
          firstMatchRange = range;
        }
      }
    }

    // Go to the first highlighted instance
    if (firstMatchRange) {
      // Use scrollIntoView() on the range's start container (the text node)
      // Parent element is needed for the scroll method
      firstMatchRange.startContainer.parentElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  window.addEventListener("devtools:search", handler);

  return () => window.removeEventListener("devtools:search", handler);
}
