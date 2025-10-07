from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

    try:
        page.goto("http://localhost:5173", wait_until="domcontentloaded")
        page.wait_for_selector('.react-flow__node', timeout=5000)

        page.screenshot(path="jules-scratch/verification/01_initial_state.png")
        initial_node = page.locator('.react-flow__node[data-id="1"]')
        expect(initial_node).to_be_visible()
        initial_node.click()

        new_node = page.locator('.react-flow__node[data-id="node_2"]')
        expect(new_node).to_be_visible()
        page.wait_for_timeout(1000)
        page.screenshot(path="jules-scratch/verification/02_expanded_state.png")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        # Get the HTML content of the root element
        try:
            root_html = page.locator('#root').inner_html()
            print("\n--- INNER HTML OF #root ---\n")
            print(root_html)
            print("\n---------------------------\n")
        except Exception as html_e:
            print(f"Could not get inner HTML of #root: {html_e}")

        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)

print("Verification script finished.")