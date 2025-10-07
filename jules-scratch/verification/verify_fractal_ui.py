from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Navigate to the app
    page.goto("http://localhost:5173/")

    # Wait for the initial nodes to be visible
    page.wait_for_selector('.react-flow__node')

    # Take a screenshot of the initial view
    page.screenshot(path="jules-scratch/verification/initial_view.png")

    # Find the fractal node and double-click it
    fractal_node = page.locator('div[data-id="1"]')
    fractal_node.dblclick()

    # Wait for the zoom animation to complete
    page.wait_for_timeout(1000)

    # Take a screenshot of the zoomed-in view
    page.screenshot(path="jules-scratch/verification/zoomed_in_view.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)