from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    try:
        page.goto("http://localhost:5173")

        # Check for the "It Works!" heading
        heading = page.locator("h1")
        expect(heading).to_have_text("It Works!")

        print("SUCCESS: The 'Hello World' component rendered correctly.")
        page.screenshot(path="jules-scratch/verification/hello_world_success.png")

    except Exception as e:
        print(f"FAILURE: The 'Hello World' component did not render. Error: {e}")
        page.screenshot(path="jules-scratch/verification/hello_world_failure.png")

    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)