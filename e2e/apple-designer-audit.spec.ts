import { test, expect } from '@playwright/test';

test.describe('Clean Tech Portal & Apple Visual Design Precision Audit', () => {
  test('Capture Full Visual States in Default Light Mode and Measure HIG Compliance', async ({ page }) => {
    // 1. Desktop 1440x900 Viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify Default Theme is Light
    const htmlClasses = await page.locator('html').getAttribute('class');
    console.log('HTML Root Classes (Default Theme):', htmlClasses);
    expect(htmlClasses).toContain('light');

    // Screenshot 1: Command Center Home (Clean Light Mode)
    await page.screenshot({ path: 'e2e/screenshots/01-command-center-desktop.png', fullPage: true });

    // Apple HIG Metrics Check: Tiny font sizes (< 11px)
    const tinyFontElements = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const tiny: { tag: string; text: string; fontSize: string; classes: string }[] = [];
      all.forEach((el) => {
        const style = window.getComputedStyle(el);
        const size = parseFloat(style.fontSize);
        if (size > 0 && size < 11 && el.textContent && el.children.length === 0) {
          const text = el.textContent.trim();
          if (text) {
            tiny.push({
              tag: el.tagName.toLowerCase(),
              text: text.slice(0, 30),
              fontSize: style.fontSize,
              classes: el.className || '',
            });
          }
        }
      });
      return tiny;
    });

    // Apple HIG Metrics Check: Small touch targets (< 32px height/width)
    const smallTouchTargets = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a[href], input, select'));
      const small: { text: string; width: number; height: number; classes: string }[] = [];
      buttons.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 32 || rect.height < 32)) {
          small.push({
            text: (el.textContent || '').trim().slice(0, 25),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            classes: el.className || '',
          });
        }
      });
      return small;
    });

    // Header buttons inspection
    const headerButtonCount = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return 0;
      return header.querySelectorAll('button').length;
    });

    console.log('--- HIG AUDIT DATA ---');
    console.log('Header buttons count:', headerButtonCount);
    console.log('Tiny font count (< 11px):', tinyFontElements.length);
    console.log('Small touch targets (< 32px):', smallTouchTargets.length);

    // Screenshot 2: Explore Segment (Alumni View)
    await page.locator('[data-testid="segment-explore"]').click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'e2e/screenshots/02-explore-company-desktop.png', fullPage: true });

    // Screenshot 3: Business Segment (Deals Pipeline)
    await page.locator('[data-testid="segment-business"]').click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'e2e/screenshots/04-business-deals-desktop.png', fullPage: true });

    // 2. Mobile Viewport (iPhone 14 Pro: 393 x 852)
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);

    // Mobile Horizontal Overflow Check
    const mobileOverflow = await page.evaluate(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        windowInnerWidth: window.innerWidth,
        hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
      };
    });
    console.log('Mobile overflow status:', mobileOverflow);
    expect(mobileOverflow.hasHorizontalScroll).toBe(false);

    // Screenshot 4: Mobile Command Center
    await page.screenshot({ path: 'e2e/screenshots/08-mobile-command-center.png', fullPage: true });

    // Switch to Explore on Mobile
    await page.locator('[data-testid="segment-explore"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/09-mobile-explore.png', fullPage: true });
  });
});
