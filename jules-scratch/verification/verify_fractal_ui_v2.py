from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    This script verifies the fractal UI functionality.
    """
    # 1. Navigate to the application.
    page.goto("http://localhost:5173/")

    # Wait for the nodes to be visible
    page.wait_for_selector('.react-flow__node')

    # 2. Take a screenshot of the initial view.
    page.screenshot(path="jules-scratch/verification/initial_view.png")

    # 3. Double-click the main fractal node to zoom in.
    fractal_node = page.locator('.react-flow__node[data-id="1"]')
    fractal_node.dblclick()

    # Wait for the view to change
    page.wait_for_timeout(1000) # Wait for animation

    # 4. Take another screenshot of the zoomed-in view.
    page.screenshot(path="jules-scratch/verification/zoomed_in_view.png")

    # 5. Click the "Back" button to zoom out.
    back_button = page.locator('button.back-button')
    back_button.click()

    # Wait for the view to change
    page.wait_for_timeout(1000) # Wait for animation

    # 6. Take a final screenshot to verify the zoom-out functionality.
    page.screenshot(path="jules-scratch/verification/zoomed_out_view_v2.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()