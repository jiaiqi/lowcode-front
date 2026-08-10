"""捕获新旧工程实际发出的 pageConfig 接口请求与响应。"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

OUT_DIR = "C:/Users/24682/AppData/Local/Temp/lowcode-shots"
os.makedirs(OUT_DIR, exist_ok=True)

CAPTURE_JS = """
async (pageNo) => {
  // 复用页面 axios 的 baseURL 逻辑：优先 backendIpAddr
  const base = window.backendIpAddr || '';
  const url = base + '/config/select/srvpage_cfg_page_guest_select';
  const req = {
    serviceName: 'srvpage_cfg_page_guest_select',
    colNames: ['*'],
    condition: [{ colName: 'page_no', ruleType: 'eq', value: pageNo }],
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const text = await res.text();
  return { status: res.status, url, backendIpAddr: base, body: text.slice(0, 5000) };
}
"""


def main():
    page_no = sys.argv[1] if len(sys.argv) > 1 else ""
    out = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        for tag, url in (("old", "http://192.168.0.214/#/"), ("new", "http://localhost:8088/")):
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            page.wait_for_timeout(3000)
            out[tag] = page.evaluate(CAPTURE_JS, page_no)
            page.goto("about:blank")
        browser.close()

    with open(os.path.join(OUT_DIR, "pageconfig.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    for tag, r in out.items():
        print(f"===== {tag} =====")
        print(f"status: {r['status']} | backendIpAddr: {r['backendIpAddr']} | url: {r['url']}")
        body = r["body"]
        try:
            data = json.loads(body)
            inner = data.get("data")
            if isinstance(inner, str):
                inner = json.loads(inner)
            print(json.dumps(inner, ensure_ascii=False)[:2000])
        except Exception:
            print("raw:", body[:2000])
        print()


if __name__ == "__main__":
    main()
