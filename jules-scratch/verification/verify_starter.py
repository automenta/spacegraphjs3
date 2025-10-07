from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    try:
        page.goto("http://localhost:5174")

        # Check for any ReactFlow node, which is the core of the starter template
        expect(page.locator(".react-flow__node").first).to_be_visible()

        print("SUCCESS: The ReactFlow starter template rendered correctly.")
        page.screenshot(path="jules-scratch/verification/starter_success.png")

    except Exception as e:
        print(f"FAILURE: The starter template did not render. Error: {e}")
        page.screenshot(path="jules-scratch/verification/starter_failure.png")

    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)