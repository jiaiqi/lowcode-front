import os

from playwright.sync_api import sync_playwright


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1912, "height": 906}, device_scale_factor=1)
    console_messages = []
    page_errors = []
    request_failures = []

    page.on("console", lambda message: console_messages.append(f"{message.type}: {message.text}"))
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.on("requestfailed", lambda request: request_failures.append(f"{request.url}: {request.failure}"))

    target_url = os.environ.get("TARGET_URL", "http://localhost:8088/")
    screenshot_path = os.environ.get(
        "SCREENSHOT_PATH", "C:/Users/24682/AppData/Local/Temp/lowcode-current.png"
    )
    page.goto(target_url, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(10000)
    page.screenshot(path=screenshot_path, full_page=True)

    result = page.evaluate(
        """
        () => {
          const pick = (selector) => {
            const el = document.querySelector(selector);
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return {
              selector,
              className: el.className,
              text: (el.innerText || '').slice(0, 120),
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              client: { width: el.clientWidth, height: el.clientHeight },
              scroll: { width: el.scrollWidth, height: el.scrollHeight },
              overflow: { x: style.overflowX, y: style.overflowY },
              transform: style.transform,
              position: style.position,
            };
          };
          const overflowNodes = [...document.querySelectorAll('*')]
            .filter((el) => el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)
            .slice(0, 30)
            .map((el) => {
              const rect = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              return {
                tag: el.tagName,
                className: typeof el.className === 'string' ? el.className : '',
                id: el.id,
                rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                client: { width: el.clientWidth, height: el.clientHeight },
                scroll: { width: el.scrollWidth, height: el.scrollHeight },
                overflow: { x: style.overflowX, y: style.overflowY },
              };
            });
          return {
            location: location.href,
            title: document.title,
            body: pick('body'),
            app: pick('#app'),
            pageWrap: pick('.page-wrap'),
            uiScaler: pick('.ui-scaler'),
            navMenu: pick('.nav-menu'),
            pageItems: document.querySelectorAll('.page-item').length,
            visibleText: (document.body.innerText || '').slice(0, 600),
            overflowNodes,
          };
        }
        """
    )

    print("=== page ===")
    print(result)
    print("=== console ===")
    print("\n".join(console_messages[-30:]))
    print("=== page errors ===")
    print("\n".join(page_errors))
    print("=== request failures ===")
    print("\n".join(request_failures[-30:]))
    browser.close()
