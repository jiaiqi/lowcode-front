"""监听页面加载过程中的所有 /config/ 请求,保存请求体与响应体。"""
import json
import os

from playwright.sync_api import sync_playwright

OUT_DIR = "C:/Users/24682/AppData/Local/Temp/lowcode-shots"
os.makedirs(OUT_DIR, exist_ok=True)


def main():
    out = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for tag, url in (("old", "http://192.168.0.214/#/"), ("new", "http://localhost:8088/")):
            page = browser.new_page()
            hits = []
            page.on(
                "request",
                lambda r: hits.append({"kind": "req", "url": r.url, "method": r.method,
                                       "postData": (r.post_data or "")[:800]})
                if "config/select" in r.url else None,
            )
            page.on(
                "response",
                lambda r: hits.append({"kind": "res", "url": r.url, "status": r.status})
                if "config/select" in r.url else None,
            )
            page.on(
                "response",
                lambda r: hits.append({"kind": "body", "url": r.url, "body": r.text()[:20000]})
                if "config/select" in r.url else None,
            )
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            page.wait_for_timeout(15000)
            out[tag] = hits
            page.close()
        browser.close()

    with open(os.path.join(OUT_DIR, "pageconfig-listen.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    for tag, hits in out.items():
        print(f"===== {tag}: {len(hits)} hits =====")
        seen = set()
        for h in hits:
            key = (h["url"], h.get("postData", "")[:50])
            if key in seen:
                continue
            seen.add(key)
            print(f"[{h['kind']}] {h['url']}")
            if h["kind"] == "req":
                print(f"    POST: {h.get('postData', '')[:300]}")
            elif h["kind"] == "body":
                b = h["body"]
                print(f"    BODY({len(b)}): {b[:600]}")
        print()


if __name__ == "__main__":
    main()
