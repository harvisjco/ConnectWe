import { test, expect } from '@playwright/test';

test.describe('Apple Chief Designer Precision Audit', () => {
  test('Capture Full Visual States and Measure Apple HIG Compliance', async ({ page }) => {
    // 1. Desktop 1440x900 Viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Screenshot 1: Command Center Home
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

    // Apple HIG Metrics Check: Small touch targets (< 36px height)
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

    // Header buttons inspection (Toolbar cognitive load)
    const headerButtonCount = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return 0;
      return header.querySelectorAll('button').length;
    });

    console.log('--- HIG AUDIT DATA ---');
    console.log('Header buttons count:', headerButtonCount);
    console.log('Tiny font count (< 11px):', tinyFontElements.length);
    console.log('Sample tiny fonts:', JSON.stringify(tinyFontElements.slice(0, 5), null, 2));
    console.log('Small touch targets (< 32px):', smallTouchTargets.length);
    console.log('Sample small targets:', JSON.stringify(smallTouchTargets.slice(0, 5), null, 2));

    // Screenshot 2: Explore Segment
    await page.locator('[data-testid="segment-explore"]').click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'e2e/screenshots/02-explore-company-desktop.png', fullPage: true });

    // OrgChart View
    const orgChartBtn = page.locator('button:has-text("??? DART 기업 조직도")');
    if (await orgChartBtn.isVisible()) {
      await orgChartBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/03-explore-orgchart-desktop.png', fullPage: true });
    }

    // Screenshot 4: Business Segment (Deals)
    await page.locator('[data-testid="segment-business"]').click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'e2e/screenshots/04-business-deals-desktop.png', fullPage: true });

    // Proximity Radar View
    const proxBtn = page.locator('button:has-text("??? 거점별 레이더")');
    if (await proxBtn.isVisible()) {
      await proxBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/05-business-proximity-desktop.png', fullPage: true });
    }

    // Promotion View
    const promoBtn = page.locator('button:has-text("?? 영전·케어 골든타임")');
    if (await promoBtn.isVisible()) {
      await promoBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/06-business-promotion-desktop.png', fullPage: true });
    }

    // Daily Digest Modal Inspection
    const digestBtn = page.locator('button:has-text("오늘의 다이제스트")');
    if (await digestBtn.isVisible()) {
      await digestBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/07-daily-digest-modal.png' });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

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

    await page.screenshot({ path: 'e2e/screenshots/08-mobile-command-center.png', fullPage: true });

    // Switch to Explore on Mobile
    await page.locator('[data-testid="segment-explore"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/09-mobile-explore.png', fullPage: true });
  });
});
