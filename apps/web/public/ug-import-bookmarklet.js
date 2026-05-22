/**
 * Script chargé par le bookmarklet LiveStage depuis une page Ultimate Guitar.
 * Ne pas ouvrir directement — utiliser le favori « Importer dans LiveStage ».
 */
(function () {
  var O = window.__LIVESTAGE_ORIGIN__;
  if (!O) {
    alert("LiveStage: configuration manquante. Recreez le favori depuis l application.");
    return;
  }

  function decodeAttr(v) {
    return v
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'");
  }

  function hasTab(d) {
    return (
      d &&
      d.tab_view &&
      ((d.tab_view.wiki_tab && d.tab_view.wiki_tab.content) ||
        (d.tab_view.tab && d.tab_view.tab.content))
    );
  }

  function wrap(data) {
    return JSON.stringify({ store: { page: { data: data } } } });
  }

  function fromStore(store) {
    if (!store || !store.page || !store.page.data || !hasTab(store.page.data))
      return null;
    return JSON.stringify({ store: store });
  }

  function fromObj(obj) {
    if (!obj) return null;
    if (obj.store) return fromStore(obj.store);
    if (obj.page && obj.page.data && hasTab(obj.page.data))
      return JSON.stringify({ store: { page: obj.page } });
    if (hasTab(obj)) return wrap(obj);
    return null;
  }

  function tryJson(raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function findInTree(obj, depth) {
    if (!obj || depth > 14) return null;
    if (typeof obj !== "object") return null;
    if (!Array.isArray(obj)) {
      if (hasTab(obj)) return obj;
      var keys = Object.keys(obj);
      for (var i = 0; i < keys.length; i++) {
        var f = findInTree(obj[keys[i]], depth + 1);
        if (f) return f;
      }
      return null;
    }
    for (var j = 0; j < obj.length; j++) {
      var f2 = findInTree(obj[j], depth + 1);
      if (f2) return f2;
    }
    return null;
  }

  function extract() {
    if (window.UGAPP && window.UGAPP.store) {
      var a = fromStore(window.UGAPP.store);
      if (a) return a;
    }
    if (window.__DATA__) {
      var b = fromObj(window.__DATA__);
      if (b) return b;
    }
    if (window.__NEXT_DATA__) {
      var pd = findInTree(window.__NEXT_DATA__, 0);
      if (pd) return wrap(pd);
    }

    var selectors = [
      ".js-store[data-content]",
      ".js-store",
      "[class*='js-store'][data-content]",
      "[data-content]",
    ];
    for (var s = 0; s < selectors.length; s++) {
      var nodes = document.querySelectorAll(selectors[s]);
      for (var n = 0; n < nodes.length; n++) {
        var raw = nodes[n].getAttribute("data-content");
        if (!raw || raw.length < 50) continue;
        var parsed = tryJson(decodeAttr(raw));
        var json = fromObj(parsed);
        if (json) return json;
      }
    }

    var scripts = document.querySelectorAll(
      'script[type="application/json"], script#__NEXT_DATA__'
    );
    for (var i = 0; i < scripts.length; i++) {
      var text = (scripts[i].textContent || "").trim();
      if (text.length < 100) continue;
      var p = tryJson(text);
      if (p) {
        var j = fromObj(p);
        if (j) return j;
        var pd2 = findInTree(p, 0);
        if (pd2) return wrap(pd2);
      }
    }

    var inline = document.querySelectorAll("script:not([src])");
    for (var k = 0; k < inline.length; k++) {
      var t = inline[k].textContent || "";
      var m1 = t.match(/window\.__DATA__\s*=\s*(\{[\s\S]*?\});/);
      if (m1) {
        var j1 = fromObj(tryJson(m1[1]));
        if (j1) return j1;
      }
      var m2 = t.match(/window\.UGAPP\s*=\s*(\{[\s\S]*?\});/);
      if (m2) {
        var p2 = tryJson(m2[1]);
        if (p2 && p2.store) {
          var j2 = fromStore(p2.store);
          if (j2) return j2;
        }
      }
    }

    return null;
  }

  var raw = extract();
  if (!raw) {
    alert(
      "LiveStage: impossible de lire les données du tab.\n\n" +
        "• Ouvrez une page d accords Ultimate Guitar (pas la recherche)\n" +
        "• Attendez le chargement complet de la page\n" +
        "• Sinon : Bibliothèque → Importer → collez le code source (Ctrl+U)"
    );
    return;
  }

  var src = location.href;
  var done = false;
  var handler = function (e) {
    if (e.origin !== O || done) return;
    if (e.data && e.data.type === "livestage-import-ready" && e.source) {
      done = true;
      e.source.postMessage(
        { type: "livestage-ug-import", data: raw, sourceUrl: src },
        O
      );
      window.removeEventListener("message", handler);
    }
  };
  window.addEventListener("message", handler);

  var w = window.open(O + "/songs/import-ug", "_blank");
  if (!w) {
    window.removeEventListener("message", handler);
    alert("LiveStage: autorisez les pop-ups pour Ultimate Guitar.");
    return;
  }
  setTimeout(function () {
    if (!done) window.removeEventListener("message", handler);
  }, 30000);
})();
