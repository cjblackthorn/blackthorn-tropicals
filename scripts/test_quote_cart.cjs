"use strict";
/** Functional read-only test of the locally served GitHub Pages static storefront. */
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const URL = "http://127.0.0.1:4173/";
const CART_KEY = "blackthorn_quote_cart";

async function visit(context) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  const response = await page.goto(URL, { waitUntil: "load", timeout: 20000 });
  assert.equal(response.status(), 200);
  return { page, errors };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    // Normal cart lifecycle: add, increment, persistence, decrement, remove.
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const { page, errors } = await visit(context);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "load" });
    assert.equal(await page.locator("[data-cart-count]").innerText(), "0");
    assert.equal(await page.locator("[data-cart-total]").innerText(), "$0");
    assert.equal(await page.locator(".plant-card").count(), 6);

    await page.locator(".plant-card[data-sku='queen-node'] [data-add-to-cart]").click();
    assert.equal(await page.locator("[data-cart-count]").innerText(), "1");
    assert.equal(await page.locator("[data-cart-total]").innerText(), "$38");
    assert.equal(await page.locator("[data-cart-panel]").getAttribute("aria-hidden"), "false");
    assert.equal(await page.locator("[data-cart-panel]").getAttribute("aria-modal"), "true");
    assert.equal(await page.locator("[data-cart-panel]").evaluate(el => el.inert), false);
    await page.waitForFunction(() => document.activeElement?.matches("[data-cart-close]"), null, { timeout: 3000 });
    await page.keyboard.press("Shift+Tab");
    assert.equal(await page.locator("[data-cart-contact]").evaluate(el => document.activeElement === el), true);
    await page.keyboard.press("Tab");
    assert.equal(await page.locator("[data-cart-close]").evaluate(el => document.activeElement === el), true);
    await page.locator("[data-cart-close]").click();
    assert.equal(await page.locator("[data-cart-panel]").evaluate(el => el.inert), true);
    assert.equal(await page.locator(".plant-card[data-sku='queen-node'] [data-add-to-cart]").evaluate(el => document.activeElement === el), true);
    await page.locator(".plant-card[data-sku='queen-node'] [data-add-to-cart]").click();
    assert.equal(await page.locator("[data-cart-total]").innerText(), "$76");

    await page.reload({ waitUntil: "load" });
    assert.equal(await page.locator("[data-cart-count]").innerText(), "2");
    assert.equal(await page.locator("[data-cart-total]").innerText(), "$76");
    await page.locator("[data-cart-open]").click();
    await page.locator("[data-remove-item='queen-node']").click();
    assert.equal(await page.locator("[data-cart-count]").innerText(), "1");
    await page.locator("[data-remove-item='queen-node']").click();
    assert.equal(await page.locator("[data-cart-count]").innerText(), "0");
    assert.equal(await page.locator("[data-cart-close]").evaluate(el => document.activeElement === el), true);
    assert.equal(await page.locator("[data-cart-total]").innerText(), "$0");
    assert.match(await page.locator("[data-cart-items]").innerText(), /No plants selected/);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("[data-cart-panel]").getAttribute("aria-hidden"), "true");
    assert.equal(await page.locator("[data-cart-open]").evaluate(el => document.activeElement === el), true);

    await page.locator('[data-filter="node"]').click();
    assert.equal(await page.locator(".plant-card:visible").count(), 1);
    await page.locator('[data-filter="all"]').click();
    assert.equal(await page.locator(".plant-card:visible").count(), 6);
    assert.deepEqual(errors, []);
    await context.close();
    console.log("PASS: cart quantities, totals, reload, removal, Escape and stage filters");

    // Corrupted storage must not crash site initialization.
    const broken = await browser.newContext();
    await broken.addInitScript(key => localStorage.setItem(key, "this is not json"), CART_KEY);
    const corrupt = await visit(broken);
    assert.deepEqual(corrupt.errors, []);
    assert.equal(await corrupt.page.locator("[data-cart-count]").innerText(), "0");
    await corrupt.page.locator(".plant-card[data-sku='queen-node'] [data-add-to-cart]").click();
    assert.equal(await corrupt.page.locator("[data-cart-count]").innerText(), "1");
    await broken.close();
    console.log("PASS: corrupted JSON recovery");

    // Saved prices and titles must never override canonical inventory data.
    const tampered = await browser.newContext();
    await tampered.addInitScript(key => localStorage.setItem(key,
      JSON.stringify([["queen-node", { sku:"queen-node", title:"<img src=x onerror=alert(1)>", price:-999, quantity:2 }]])), CART_KEY);
    const restored = await visit(tampered);
    assert.deepEqual(restored.errors, []);
    assert.equal(await restored.page.locator("[data-cart-count]").innerText(), "2");
    assert.equal(await restored.page.locator("[data-cart-total]").innerText(), "$76");
    await restored.page.locator("[data-cart-open]").click();
    assert.match(await restored.page.locator("[data-cart-items]").innerText(), /Queen Chloe Node Cutting/);
    assert.equal(await restored.page.locator("[data-cart-items] img").count(), 0);
    await tampered.close();
    console.log("PASS: stored cart prices and labels normalized to published inventory");

    // Privacy/security settings may block storage; in-memory shopping must still work.
    const restricted = await browser.newContext();
    await restricted.addInitScript(() => {
      Storage.prototype.getItem = () => { throw new Error("storage blocked"); };
      Storage.prototype.setItem = () => { throw new Error("storage blocked"); };
    });
    const limited = await visit(restricted);
    assert.deepEqual(limited.errors, []);
    await limited.page.locator(".plant-card[data-sku='queen-node'] [data-add-to-cart]").click();
    assert.equal(await limited.page.locator("[data-cart-count]").innerText(), "1");
    await restricted.close();
    console.log("PASS: storage-unavailable in-memory cart");

    console.log("All static Tropical Plants functional browser smoke checks passed. No inquiry submitted.");
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
