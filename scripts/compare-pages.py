"""对比新旧工程页面渲染差异。

用法:
    python scripts/compare-pages.py --url-old "http://192.168.0.214/#/" --url-new "http://localhost:8088/" --shot-dir /tmp/shots
"""
import argparse
import json
import os

from playwright.sync_api import sync_playwright

WAIT_SELECTOR = ".page-item"  # 低代码页面渲染完成标志


def capture(page, url, name, shot_dir):
    """访问一个页面,返回渲染摘要。"""
    console = []
    page_errors = []
    request_failures = []

    page.on("console", lambda m: console.append({"type": m.type, "text": m.text[:500]}))
    page.on("pageerror", lambda e: page_errors.append(str(e)[:500]))
    page.on(
        "requestfailed",
        lambda r: request_failures.append(f"{r.url[:200]}: {r.failure}"),
    )

    page.goto(url, wait_until="domcontentloaded", timeout=45000)
    try:
        page.wait_for_selector(WAIT_SELECTOR, timeout=30000)
    except Exception:
        pass
    page.wait_for_timeout(12000)  # 等图表/异步数据渲染
    page.screenshot(path=os.path.join(shot_dir, f"{name}.png"), full_page=True)

    result = page.evaluate(
        """() => {
          const pick = (sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return {
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
              client: { w: el.clientWidth, h: el.clientHeight },
              scroll: { w: el.scrollWidth, h: el.scrollHeight },
              overflow: style.overflowX + '/' + style.overflowY,
              transform: style.transform.slice(0, 80),
              bg: style.backgroundColor,
              fontSize: style.fontSize,
              fontFamily: (style.fontFamily || '').slice(0, 60),
            };
          };
          const overflowNodes = [...document.querySelectorAll('*')]
            .filter((el) => el.scrollWidth > el.clientWidth + 3 || el.scrollHeight > el.clientHeight + 3)
            .slice(0, 25)
            .map((el) => {
              const rect = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              return {
                tag: el.tagName,
                cls: (typeof el.className === 'string' ? el.className : '').slice(0, 60),
                rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
                client: { w: el.clientWidth, h: el.clientHeight },
                scroll: { w: el.scrollWidth, h: el.scrollHeight },
                overflow: style.overflowX + '/' + style.overflowY,
              };
            });
          const textItems = [...document.querySelectorAll('.page-item')].slice(0, 12).map((el) => ({
            cls: (el.className || '').slice(0, 80),
            text: (el.innerText || '').replace(/\\s+/g, ' ').slice(0, 80),
            rect: (() => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })(),
          }));
          return {
            location: location.href,
            title: document.title,
            viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
            bodyScroll: { h: document.body.scrollHeight, clientH: document.body.clientHeight },
            app: pick('#app'),
            pageWrap: pick('.page-wrap'),
            uiScaler: pick('.ui-scaler'),
            navMenu: pick('.nav-menu'),
            pageItemCount: document.querySelectorAll('.page-item').length,
            textItems,
            visibleText: (document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 500),
            overflowNodes,
            imagesBroken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).length,
            imagesTotal: document.images.length,
            canvases: document.querySelectorAll('canvas').length,
          };
        }"""
    )
    result["console"] = console[-25:]
    result["pageErrors"] = page_errors[-15:]
    result["requestFailures"] = request_failures[-15:]
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url-old", default="http://192.168.0.214/#/")
    ap.add_argument("--url-new", default="http://localhost:8088/")
    ap.add_argument("--shot-dir", default="C:/Users/24682/AppData/Local/Temp/lowcode-shots")
    ap.add_argument("--json", action="store_true", help="输出 JSON 便于对比")
    args = ap.parse_args()

    os.makedirs(args.shot_dir, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1912, "height": 906})
        old = capture(page, args.url_old, "old", args.shot_dir)
        page.goto("about:blank")
        new = capture(page, args.url_new, "new", args.shot_dir)
        browser.close()

    out = {"old": old, "new": new}
    with open(os.path.join(args.shot_dir, "report.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=1))
    else:
        for tag in ("old", "new"):
            r = out[tag]
            print(f"===== {tag}: {r['location']} =====")
            print(f"title: {r['title']} | viewport: {r['viewport']}")
            print(f"pageItemCount: {r['pageItemCount']} | images: {r['imagesBroken']}/{r['imagesTotal']} broken | canvases: {r['canvases']}")
            for k in ("app", "pageWrap", "uiScaler", "navMenu"):
                print(f"{k}: {json.dumps(r[k], ensure_ascii=False)}")
            print("textItems:")
            for t in r["textItems"]:
                print("  ", json.dumps(t, ensure_ascii=False))
            print(f"visibleText: {r['visibleText']}")
            print(f"overflowNodes({len(r['overflowNodes'])}):")
            for n in r["overflowNodes"]:
                print("  ", json.dumps(n, ensure_ascii=False))
            print("console:")
            for c in r["console"]:
                print(f"  [{c['type']}] {c['text'][:220]}")
            print("pageErrors:", r["pageErrors"])
            print("requestFailures:", r["requestFailures"])
    print(f"\n截图目录: {args.shot_dir}")


if __name__ == "__main__":
    main()
