(function () {
  document.querySelectorAll("pre code.language-mermaid").forEach(function (code) {
    var div = document.createElement("div");
    div.className = "mermaid";
    div.textContent = code.textContent;
    code.parentElement.replaceWith(div);
  });
  if (window.mermaid) {
    var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    mermaid.initialize({ startOnLoad: false, theme: dark ? "dark" : "default", securityLevel: "strict" });
    // Diagrams fit the page; a click shows a large one at its natural size, scrollable.
    mermaid.run({ querySelector: ".mermaid" }).then(function () {
      document.querySelectorAll(".mermaid").forEach(function (diagram) {
        diagram.title = "Click to enlarge";
        diagram.addEventListener("click", function () { diagram.classList.toggle("enlarged"); });
      });
    });
  }
  var input = document.getElementById("search"), list = document.getElementById("results");
  if (!input || !window.MiniSearch || !window.TIDEWIKI_INDEX) return;
  var search = new MiniSearch({ fields: ["title", "text"], storeFields: ["title", "text"],
                                searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.2 } });
  search.addAll(window.TIDEWIKI_INDEX);
  input.addEventListener("input", function () {
    var query = input.value.trim();
    list.innerHTML = "";
    if (!query) { list.hidden = true; return; }
    search.search(query).slice(0, 8).forEach(function (hit) {
      var item = document.createElement("li"), link = document.createElement("a"), note = document.createElement("small");
      link.href = hit.id + ".html";
      link.textContent = hit.title;
      var at = hit.text.toLowerCase().indexOf(query.toLowerCase().split(" ")[0]);
      note.textContent = hit.text.substr(Math.max(0, at - 40), 120);
      item.appendChild(link); item.appendChild(note); list.appendChild(item);
    });
    list.hidden = list.children.length === 0;
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "/" && document.activeElement !== input) { event.preventDefault(); input.focus(); }
    if (event.key === "Escape") { list.hidden = true; }
  });
})();
