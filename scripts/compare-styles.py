"""对比新旧页面:加载的样式表 + 关键元素 computed style。"""
import json
import os

from playwright.sync_api import sync_playwright

OUT_DIR = "C:/Users/24682/AppData/Local/Temp/lowcode-shots"

DIFF_STYLE_JS = """
() => {
  // 1) 样式表清单
  const sheets = [...document.styleSheets].map((s) => {
    try { s.cssRules; return s.href || 'inline'; } catch (e) { return s.href || 'inline(blocked)'; }
  });
  // 2) 关键元素 computed style
  const styles = {};
  const sels = {
    'header lc-container': '.lc-container[style*="top: 0px"], .page-item:nth-child(1)',
    'lc-content(header)': '.lc-content',
    'nav-menu': '.nav-menu',
    'page-wrap': '.page-wrap',
    'ui_scaler': '.ui_scaler',
    'body': 'body',
  };
  const props = ['width','height','margin','padding','font-size','line-height','box-sizing','position','top','left','right','display','flex-direction','justify-content','align-items','gap','white-space','letter-spacing','background-color','color','transform','min-width','max-width','overflow-x'];
  for (const [name, sel] of Object.entries(sels)) {
    const el = document.querySelector(sel);
    if (!el) { styles[name] = 'NOT FOUND'; continue; }
    const cs = getComputedStyle(el);
    const o = { tag: el.tagName, cls: (el.className || '').slice(0, 80) };
    for (const p of props) {
      const v = cs[p];
      if (v && v !== 'none' && v !== 'normal' && v !== '0px' && p !== 'position') o[p] = v;
    }
    // 关键子元素:nav-menu 内 li/a
    if (name === 'nav-menu') {
      const items = [...el.querySelectorAll('li, a')].slice(0, 4).map((i) => {
        const c = getComputedStyle(i);
        return { tag: i.tagName, cls: (i.className||'').slice(0,50), fs: c.fontSize, lh: c.lineHeight, pad: c.padding, w: c.width, h: c.height };
      });
      o.children = items;
    }
    styles[name] = o;
  }
  return { sheets, styles, bodyOverflowX: getComputedStyle(document.body).overflowX };
}
"""


def main():
    out = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for tag, url in (("old", "http://192.168.0.214/#/"), ("new", "http://localhost:8088/")):
            page = browser.new_page(viewport={"width": 1912, "height": 906})
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            try:
                page.wait_for_selector(".page-item", timeout=30000)
            except Exception:
                pass
            page.wait_for_timeout(8000)
            out[tag] = page.evaluate(DIFF_STYLE_JS)
            page.close()
        browser.close()

    with open(os.path.join(OUT_DIR, "styles-compare.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    old, new = out["old"], out["new"]
    print("=== 样式表差异 ===")
    for s in set(old["sheets"]) ^ set(new["sheets"]):
        print("  仅一边有:", s)
    print(f"old sheets({len(old['sheets'])}):")
    for s in old["sheets"]:
        print("  ", s[:150])
    print(f"new sheets({len(new['sheets'])}):")
    for s in new["sheets"]:
        print("  ", s[:150])
    print("\n=== computed style 对比 ===")
    for key in old["styles"]:
        a, b = old["styles"][key], new["styles"][key]
        print(f"--- {key} ---")
        print(f"  OLD: {json.dumps(a, ensure_ascii=False)[:600]}")
        print(f"  NEW: {json.dumps(b, ensure_ascii=False)[:600]}")


if __name__ == "__main__":
    main()
