import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import ExcelJS from 'exceljs'

const buildUrl = 'http://127.0.0.1:43971'

function harnessUrl(state: 'guest' | 'student' | 'admin') {
  return `/tests/e2e/harness.html?state=${state}`
}

function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

async function expectNoAutomatedAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const summary = results.violations
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length})`)
    .join('\n')
  expect(results.violations, summary).toEqual([])
}

async function expectLightThemeWithoutPageOverflow(page: Page) {
  const layout = await page.evaluate(() => {
    const bodyStyle = window.getComputedStyle(document.body)
    const viewportWidth = document.documentElement.clientWidth
    const overflowing = Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .map((element) => {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return {
          element: `${element.tagName.toLowerCase()}.${element.className}`,
          text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) ?? '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          minWidth: style.minWidth,
          whiteSpace: style.whiteSpace,
        }
      })
      .filter((item) => item.right > viewportWidth + 1 || item.left < -1)
      .slice(0, 12)
    return {
      backgroundColor: bodyStyle.backgroundColor,
      clientWidth: viewportWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflowing,
    }
  })
  expect(layout.backgroundColor).toBe('rgb(243, 239, 230)')
  expect(
    layout.scrollWidth,
    `Document overflow details: ${JSON.stringify(layout.overflowing, null, 2)}`,
  ).toBeLessThanOrEqual(layout.clientWidth)
}

async function events(page: Page): Promise<string[]> {
  return page.evaluate(() => window.__PORTAL_E2E_EVENTS__)
}

test('keyboard-only roll-number login and office-assisted recovery', async ({ page }) => {
  const browserErrors = collectBrowserErrors(page)
  await page.goto(harnessUrl('guest'))

  await expect(page.getByRole('heading', { name: 'Student sign in' })).toBeVisible()
  const logo = page.getByRole('img', { name: 'Concept Institute' })
  await expect(logo).toBeVisible()
  expect(await logo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Concept Institute home' })).toBeFocused()
  await page.keyboard.press('Tab')

  const loginId = page.getByLabel('Roll number or admin ID')
  await expect(loginId).toBeFocused()
  const focusOutline = await loginId.evaluate((element) => {
    const style = window.getComputedStyle(element)
    return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) }
  })
  expect(focusOutline.style).toBe('solid')
  expect(focusOutline.width).toBeGreaterThanOrEqual(2)

  await loginId.fill('T-001')
  await page.keyboard.press('Tab')
  const forgotPassword = page.getByRole('button', { name: 'Forgot password?' })
  await expect(forgotPassword).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('heading', { name: 'Ask Concept for a reset' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Call 9928111865' })).toBeVisible()
  await expect(page.getByText(/new temporary password/i)).toBeVisible()
  await expect(page.getByLabel(/email/i)).toHaveCount(0)
  await expectNoAutomatedAccessibilityViolations(page)

  await page.getByRole('button', { name: 'Back to sign in' }).click()
  await page.getByLabel('Roll number or admin ID').fill('T-001')
  await page.getByLabel('Password').fill('SyntheticPass9')
  await page.getByLabel('Password').press('Enter')

  await expect(page.getByRole('heading', { name: 'Your QPT results' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Concept Institute' })).toBeVisible()
  expect(await events(page)).toEqual(['sign-in'])
  expect(browserErrors).toEqual([])
})

test('results filter recomputes totals and skip link moves focus', async ({ page }) => {
  const browserErrors = collectBrowserErrors(page)
  await page.goto(harnessUrl('student'))
  await expect(page.getByRole('heading', { name: 'Your QPT results' })).toBeVisible()

  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Skip to main content' })
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()

  const totals = page.getByTestId('grand-totals')
  await expect(totals).toContainText('115 / 230')
  await expect(totals).toContainText('50%')

  const insights = page.locator('.qpt-insights')
  await expect(page.getByRole('heading', { name: 'Your QPT comparison' })).toBeVisible()
  await expect(insights).toContainText('Batch average')
  await expect(insights).toContainText('64.5 / 100')
  await expect(insights).toContainText('Batch highest')
  await expect(insights).toContainText('96 / 100')
  await expect(insights).toContainText('32 participants')

  await page.getByLabel('Assessment', { exact: true }).selectOption('synthetic-assessment-3')
  await expect(insights).toContainText('Mathematics')
  await expect(insights).toContainText('45 / 50')
  await expect(insights).toContainText('34.75 / 50')
  await expect(insights).toContainText('30 participants')

  await page.getByLabel('Subject').selectOption('PHY')
  const table = page.getByRole('table', { name: 'Published QPT results and visible grand totals' })
  await expect(table).toContainText('Physics')
  await expect(table).not.toContainText('Chemistry')
  await expect(totals).toContainText('70 / 100')
  await expect(totals).toContainText('70%')

  await expectNoAutomatedAccessibilityViolations(page)
  await expectLightThemeWithoutPageOverflow(page)
  expect(browserErrors).toEqual([])
})

test('admin downloads template, reviews upload, and confirms publication', async ({ page }) => {
  const browserErrors = collectBrowserErrors(page)
  await page.goto(harnessUrl('admin'))
  await expect(page.getByRole('heading', { name: 'Admin portal' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Results' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Admin' })).toHaveAttribute('aria-current', 'page')
  await expect.poll(() => new URL(page.url()).pathname).toBe('/admin')

  const workbooksTab = page.getByRole('tab', { name: 'Workbooks' })
  const studentAccessTab = page.getByRole('tab', { name: 'Student Access' })
  await expect(workbooksTab).toHaveAttribute('aria-selected', 'true')
  await expect(studentAccessTab).toHaveAttribute('aria-selected', 'false')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Download official template' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('qpt-import-template.xlsx')
  expect(await download.path()).not.toBeNull()

  await page.getByLabel('Choose QPT workbook').setInputFiles({
    name: 'synthetic-qpt.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('synthetic workbook bytes'),
  })
  await page.getByRole('button', { name: 'Upload for server validation' }).click()

  await expect(page.getByText(/queued for server validation/i)).toBeVisible()
  await expect(page.getByText('Server validated')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'QPT 5' })).toBeVisible()
  await expect(page.getByText('Uploaded by another authorised staff account')).toBeVisible()

  await page.getByRole('button', { name: 'Review QPT 5 for publication' }).click()
  await page.getByRole('button', { name: 'Confirm publication' }).click()
  await expect(page.getByText('QPT 5 was published.')).toBeVisible()

  await workbooksTab.focus()
  await page.keyboard.press('ArrowRight')
  await expect(studentAccessTab).toBeFocused()
  await expect(studentAccessTab).toHaveAttribute('aria-selected', 'true')

  await page.getByRole('button', { name: 'Generate & download all credentials' }).click()
  await expect(page.getByRole('heading', {
    name: 'Generate a new login file for 2 students?',
  })).toBeVisible()
  await page.getByLabel(
    'I understand that older credential files and passwords will stop working.',
  ).check()
  const credentialDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Replace passwords & download Excel' }).click()
  const credentialDownload = await credentialDownloadPromise
  expect(credentialDownload.suggestedFilename()).toMatch(
    /^concept-student-temporary-credentials-\d{4}-\d{2}-\d{2}-\d{6}\.xlsx$/,
  )
  const credentialPath = await credentialDownload.path()
  expect(credentialPath).not.toBeNull()
  const credentialWorkbook = new ExcelJS.Workbook()
  await credentialWorkbook.xlsx.readFile(credentialPath ?? '')
  const credentialSheet = credentialWorkbook.getWorksheet('Temporary Credentials')
  expect(credentialSheet).toBeDefined()
  expect(credentialSheet?.getCell('B2').value).toBe('0007')
  expect(credentialSheet?.getCell('D2').value).toBe('0007')
  expect(credentialSheet?.getCell('E2').value).toBe('=SyntheticPass9')
  expect(credentialSheet?.getCell('E2').type).toBe(ExcelJS.ValueType.String)
  expect(credentialSheet?.getCell('F2').value).toBe('created')
  expect(credentialSheet?.getCell('B3').value).toBe('0008')
  expect(credentialSheet?.getCell('D3').value).toBe('0008')
  expect(credentialSheet?.getCell('E3').value).toBe('SyntheticReset9')
  expect(credentialSheet?.getCell('F3').value).toBe('reset')
  await expect(page.getByRole('heading', { name: 'Download started' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download Excel again' })).toBeVisible()

  expect(await events(page)).toEqual([
    'workbook-queued',
    'revision-published',
    'credential-issued:synthetic-new-student',
    'credential-reset:synthetic-existing-student',
  ])
  await expectNoAutomatedAccessibilityViolations(page)
  await expectLightThemeWithoutPageOverflow(page)
  expect(browserErrors).toEqual([])
})

test('light theme renders without document overflow at the configured viewport', async ({ page }, testInfo) => {
  await page.goto(harnessUrl('guest'))
  await expect(page.getByRole('heading', { name: 'Student sign in' })).toBeVisible()
  await expect(page.locator('.login-card')).toHaveCSS('background-color', 'rgb(255, 253, 248)')
  await expectLightThemeWithoutPageOverflow(page)

  const viewport = page.viewportSize()
  if (testInfo.project.name === 'mobile-chromium') {
    expect(viewport?.width).toBeLessThan(600)
  } else {
    expect(viewport?.width).toBe(1440)
  }
})

test('desktop navigation follows the visible brand without a large dead zone', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'The compact header uses a deliberate second navigation row')
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto(harnessUrl('student'))
  await expect(page.getByRole('heading', { name: 'Your QPT results' })).toBeVisible()

  const positions = await page.evaluate(() => {
    const logo = document.querySelector('.portal-header .brand-logo')?.getBoundingClientRect()
    const portalLabel = document.querySelector('.portal-header .brand small')?.getBoundingClientRect()
    const navigation = document.querySelector('.portal-nav')?.getBoundingClientRect()
    const account = document.querySelector('.account-actions')?.getBoundingClientRect()
    if (!logo || !portalLabel || !navigation || !account) return null
    return {
      brandToNavigation: navigation.left - Math.max(logo.right, portalLabel.right),
      navigationToAccount: account.left - navigation.right,
    }
  })

  expect(positions).not.toBeNull()
  expect(positions?.brandToNavigation).toBeGreaterThanOrEqual(16)
  expect(positions?.brandToNavigation).toBeLessThanOrEqual(64)
  expect(positions?.navigationToAccount).toBeGreaterThanOrEqual(16)
  await expectLightThemeWithoutPageOverflow(page)
})

test('200% zoom-equivalent reflow keeps student controls usable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop viewport is halved for the zoom-equivalent check')
  await page.setViewportSize({ width: 720, height: 450 })
  await page.goto(harnessUrl('student'))

  await expect(page.getByRole('heading', { name: 'Your QPT results' })).toBeVisible()
  await expect(page.getByLabel('Student', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Subject')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  await expectLightThemeWithoutPageOverflow(page)

  const tableScroller = page.getByRole('region', {
    name: 'QPT result table. Scroll horizontally on small screens.',
  })
  await expect(tableScroller).toBeVisible()
  expect(await tableScroller.getAttribute('tabindex')).toBe('0')
})

test('reduced-motion preference suppresses interface transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(harnessUrl('guest'))
  const motion = await page.getByRole('button', { name: 'Sign in securely' }).evaluate((element) => ({
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    transitionSeconds: Math.max(
      ...window.getComputedStyle(element).transitionDuration
        .split(',')
        .map((value) => Number.parseFloat(value) * (value.trim().endsWith('ms') ? 0.001 : 1)),
    ),
  }))
  expect(motion.reduced).toBe(true)
  expect(motion.transitionSeconds).toBeLessThanOrEqual(0.001)
})

test('Netlify production build applies SPA rewrites and strict compatible CSP', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'One production-header pass is sufficient')
  const browserErrors = collectBrowserErrors(page)

  const response = await page.goto(`${buildUrl}/reset-password`)
  expect(response?.status()).toBe(200)
  const headers = response?.headers() ?? {}
  const csp = headers['content-security-policy'] ?? ''
  expect(csp).toContain("default-src 'self'")
  expect(csp).toContain("connect-src 'self' https://concept-portal-build.invalid")
  expect(csp).not.toContain('*.supabase.co')
  expect(csp).not.toContain('wss:')
  expect(csp).toContain("script-src 'self'")
  expect(csp).toContain("style-src 'self'")
  expect(csp).not.toContain("'unsafe-inline'")
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['permissions-policy']).toContain('camera=()')
  expect(headers['referrer-policy']).toBe('no-referrer')
  expect(headers['cache-control']).toContain('no-store')

  await expect(page.getByRole('heading', { name: 'Student sign in' })).toBeVisible()
  await expectLightThemeWithoutPageOverflow(page)
  expect(browserErrors).toEqual([])

  const adminResponse = await page.goto(`${buildUrl}/admin`)
  expect(adminResponse?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Student sign in' })).toBeVisible()

  const stylesheetPath = await page.locator('link[rel="stylesheet"]').getAttribute('href')
  expect(stylesheetPath).toBeTruthy()
  const stylesheet = await page.request.get(new URL(stylesheetPath ?? '', buildUrl).toString())
  expect(stylesheet.headers()['cache-control']).toContain('immutable')
})
