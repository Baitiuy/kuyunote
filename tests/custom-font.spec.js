import { test, expect } from "@playwright/test";
import { HeynotePage } from "./test-utils.js";

let heynotePage

test.beforeEach(async ({ page }) => {
    heynotePage = new HeynotePage(page)
    await heynotePage.goto()
});

test("test default font is Hack", async ({ page }) => {
    await page.locator("body").pressSequentially("hey")
    const line = await page.locator("css=.cm-activeLine")
    expect(await line.evaluate((el) => {
        return window.getComputedStyle(el).getPropertyValue("font-family")
    })).toBe("Hack")
    expect(await line.evaluate((el) => {
        return window.getComputedStyle(el).getPropertyValue("font-size")
    })).toBe("12px")
    expect(await line.evaluate((el) => {
        return el.clientHeight
    })).toBeLessThan(20)
})

test("test custom font", async ({ page }) => {
    // monkey patch window.queryLocalFonts because it's not available in Playwright
    await page.evaluate(() => {
        window.queryLocalFonts = async () => {
            return [
                {
                    family: "Arial",
                    style: "Regular",
                },
                {
                    family: "Hack",
                    fullName: "Hack Regular",
                    style: "Regular",
                    postscriptName: "Hack-Regular",
                },
                {
                    family: "Hack",
                    fullName: "Hack Italic",
                    style: "Italic",
                    postscriptName: "Hack-Italic",
                },
            ]
        }
    })

    await page.locator("css=.status-block.settings").click()
    await page.locator("css=li.tab-appearance").click()
    await page.locator("css=select.font-family").selectOption("Arial")
    await page.locator("css=select.font-size").selectOption("20")
    await page.locator("body").press("Escape")
    await page.locator("body").pressSequentially("hey")
    const line = await page.locator("css=.cm-activeLine")
    expect(await line.evaluate((el) => {
        return window.getComputedStyle(el).getPropertyValue("font-family")
    })).toBe("Arial")
    expect(await line.evaluate((el) => {
        return window.getComputedStyle(el).getPropertyValue("font-size")
    })).toBe("20px")
    expect(await line.evaluate((el) => {
        return el.clientHeight
    })).toBeGreaterThan(20)
})

test("markdown todo checkbox position with monospaced font", async ({ page }) => {
    await heynotePage.setContent(`
∞∞∞markdown
- [ ] Test
- [x] Test 2
`)
    
    await page.locator("css=.cm-taskmarker-toggle input[type=checkbox]").first().waitFor()
    await expect(await page.locator("css=.cm-taskmarker-toggle input[type=checkbox]")).toHaveCount(2)
    await expect(await page.locator("css=.cm-taskmarker-toggle input[type=checkbox]").first()).toHaveCSS("position", "absolute")
})

test("markdown todo checkbox position with variable width font", async ({ page }) => {
    await page.evaluate(() => {
        window.queryLocalFonts = async () => {
            return [
                {
                    family: "Arial",
                    style: "Regular",
                },
                {
                    family: "Hack",
                    fullName: "Hack Regular",
                    style: "Regular",
                    postscriptName: "Hack-Regular",
                },
                {
                    family: "Hack",
                    fullName: "Hack Italic",
                    style: "Italic",
                    postscriptName: "Hack-Italic",
                },
            ]
        }
    })
    await page.locator("css=.status-block.settings").click()
    await page.locator("css=li.tab-appearance").click()
    await page.locator("css=select.font-family").selectOption("Arial")
    await page.locator("css=select.font-size").selectOption("20")
    await page.locator("body").press("Escape")

    await heynotePage.setContent(`
∞∞∞markdown
- [ ] Test
- [x] Test 2
`)
    
    await page.locator("css=.cm-taskmarker-toggle input[type=checkbox]").first().waitFor()
    await expect(await page.locator("css=.cm-taskmarker-toggle input[type=checkbox]")).toHaveCount(2)
    await expect(await page.locator("css=.cm-taskmarker-toggle input[type=checkbox]").first()).toHaveCSS("position", "relative")
})