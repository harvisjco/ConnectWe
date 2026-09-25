import { test, expect } from '@playwright/test';

test.describe('Apple Chief Designer Deep Precision Audit', () => {
  test.setTimeout(120000);

  test('Audit All 11 Multi-Dimension Views, Modals, and Drawers in Clean Light Mode', async ({ page }) => {
    // 1. Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Screenshot 1: Command Center Home
    await page.screenshot({ path: 'e2e/screenshots/audit-01-command-center.png', fullPage: true });

    // Apple HIG Metrics Check Function
    const getHigMetrics = async (viewName: string) => {
      return await page.evaluate((name) => {
        const all = Array.from(document.querySelectorAll('*'));
        let tinyCount = 0;
        const tinySamples: string[] = [];
        all.forEach((el) => {
          const style = window.getComputedStyle(el);
          const size = parseFloat(style.fontSize);
          if (size > 0 && size < 11 && el.textContent && el.children.length === 0) {
            const text = el.textContent.trim();
            if (text && tinySamples.length < 5) {
              tinySamples.push(`[${el.tagName.toLowerCase()}] ${text.slice(0, 25)} (${style.fontSize})`);
            }
            tinyCount++;
          }
        });

        // Touch Targets below 32px
        const interactives = Array.from(document.querySelectorAll('button, a[href], input, select'));
        let smallTargetCount = 0;
        const smallSamples: string[] = [];
        interactives.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 32 || rect.height < 32)) {
            const text = (el.textContent || '').trim().slice(0, 20);
            if (smallSamples.length < 5) {
              smallSamples.push(`"${text}" (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
            }
            smallTargetCount++;
          }
        });

        return {
          view: name,
          tinyCount,
          tinySamples,
          smallTargetCount,
          smallSamples
        };
      }, viewName);
    };

    const metricsResults = [];

    // Audit 1: Command Center
    metricsResults.push(await getHigMetrics('Command Center'));

    // Audit 2: Explore - Company Alumni
    await page.locator('[data-testid="segment-explore"]').click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'e2e/screenshots/audit-02-explore-alumni.png', fullPage: true });
    metricsResults.push(await getHigMetrics('Explore - Alumni'));

    // Audit 3: Explore - Org Chart
    const orgBtn = page.locator('button:has-text("DART 기업 조직도")');
    if (await orgBtn.isVisible()) {
      await orgBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/audit-03-explore-orgchart.png', fullPage: true });
      metricsResults.push(await getHigMetrics('Explore - OrgChart'));
    }

    // Audit 4: Explore - 2D Canvas Graph
    const canvasBtn = page.locator('button:has-text("2D 인터랙티브 그래프")');
    if (await canvasBtn.isVisible()) {
      await canvasBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/audit-04-explore-canvas.png', fullPage: true });
      metricsResults.push(await getHigMetrics('Explore - 2D Canvas'));
    }

    // Audit 4b: Explore - 3D Cosmic Galaxy
    const galaxyBtn = page.locator('button:has-text("3D 은하계")');
    if (await galaxyBtn.isVisible()) {
      await galaxyBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/audit-04b-explore-galaxy3d.png', fullPage: true });
      metricsResults.push(await getHigMetrics('Explore - 3D Galaxy'));
    }

    // Audit 4c: Explore - Age Spectrum
    const ageBtn = page.locator('button:has-text("나이대별")');
    if (await ageBtn.isVisible()) {
      await ageBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/audit-04c-explore-age.png', fullPage: true });
      metricsResults.push(await getHigMetrics('Explore - Age Spectrum'));
    }

    // Audit 4d: Explore - Timeline
    const timelineBtn = page.locator('button:has-text("소통 타임라인")');
    if (await timelineBtn.isVisible()) {
      await timelineBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/audit-04d-explore-timeline.png', fullPage: true });
      metricsResults.push(await getHigMetrics('Explore - Timeline'));
    }

    // Audit 5: Business - Deals Pipeline
    await page.locator('[data-testid="segment-business"]').click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'e2e/screenshots/audit-05-business-deals.png', fullPage: true });
    metricsResults.push(await getHigMetrics('Business - Deals'));

    // Audit 6: Business - Proximity Radar
    const proxBtn = page.locator('button:has-text("거점별 레이더")');
    if (await proxBtn.isVisible()) {
      await proxBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/audit-06-business-proximity.png', fullPage: true });
      metricsResults.push(await getHigMetrics('Business - Proximity'));
    }

    // Audit 7: Business - Promotion Cadence
    const promoBtn = page.locator('button:has-text("영전·케어 골든타임")');
    if (await promoBtn.isVisible()) {
      await promoBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/audit-07-business-promotion.png', fullPage: true });
      metricsResults.push(await getHigMetrics('Business - Promotion'));
    }

    // Audit 8: Business - Network Audit
    const auditBtn = page.locator('button:has-text("인맥 자산 진단")');
    if (await auditBtn.isVisible()) {
      await auditBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/audit-08-business-audit.png', fullPage: true });
      metricsResults.push(await getHigMetrics('Business - Audit'));
    }

    // Audit 8b: Business - Team Network
    const teamBtn = page.locator('button:has-text("팀 인맥")');
    if (await teamBtn.isVisible()) {
      await teamBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/audit-08b-business-team.png', fullPage: true });
      metricsResults.push(await getHigMetrics('Business - Team'));
    }

    // Audit 8c: Business - Referral Bounty
    const bountyBtn = page.locator('button:has-text("바운티 탐색")');
    if (await bountyBtn.isVisible()) {
      await bountyBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/audit-08c-business-bounty.png', fullPage: true });
      metricsResults.push(await getHigMetrics('Business - Bounty'));
    }

    // Audit 9: Modal Inspection (Daily Digest)
    const digestBtn = page.locator('button:has-text("다이제스트")');
    if (await digestBtn.isVisible()) {
      await digestBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/audit-09-modal-digest.png' });
      // Close modal using close button
      const closeBtn = page.locator('button:has-text("닫기"), button[aria-label="닫기"]').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(400);
    }

    // Audit 9b: Modal Inspection (Cloud Sync Vault)
    const syncBtn = page.locator('button:has-text("Supabase Live")');
    if (await syncBtn.isVisible()) {
      await syncBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/audit-09b-modal-cloudsync.png' });
      const closeBtn = page.locator('button[aria-label="닫기"], button:has-text("닫기")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(400);
    }

    // Audit 9c: Drawer Inspection (AI Copilot Drawer)
    const copilotBtn = page.locator('button:has-text("인맥 코파일럿"), button[title*="코파일럿"]').first();
    if (await copilotBtn.isVisible()) {
      await copilotBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/audit-09c-drawer-copilot.png' });
      metricsResults.push(await getHigMetrics('Drawer - Copilot'));
      
      const closeBtn = page.locator('div.fixed.inset-0.z-50 button:has(svg)').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(500);
    }

    // Audit 10: Drawer Inspection (Person Inspector Drawer)
    // Go to Command Center and click first person
    await page.locator('[data-testid="segment-command"]').click();
    await page.waitForTimeout(500);
    const firstPerson = page.locator('text=김서연').first();
    if (await firstPerson.isVisible()) {
      await firstPerson.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/audit-10-drawer-inspector.png' });
      const drawerClose = page.locator('button[aria-label="Close"], button:has-text("닫기")').first();
      if (await drawerClose.isVisible()) {
        await drawerClose.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(400);
    }

    // Audit 11: Mobile Viewport (iPhone 14 Pro: 393 x 852)
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);

    const mobileOverflow = await page.evaluate(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        windowInnerWidth: window.innerWidth,
        hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
      };
    });

    await page.screenshot({ path: 'e2e/screenshots/audit-11-mobile-command.png', fullPage: true });

    // Switch to Explore on Mobile
    await page.locator('[data-testid="segment-explore"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/audit-12-mobile-explore.png', fullPage: true });

    console.log('=== CHIEF DESIGNER AUDIT METRICS SUMMARY ===');
    console.log(JSON.stringify(metricsResults, null, 2));
    console.log('Mobile Overflow:', mobileOverflow);
  });
});
