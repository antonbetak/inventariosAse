// An open tab can outlive the deployment that supplied its lazy module URLs.
export function recoverDeployment(event, browser = window) {
  const key = 'sanate:deployment-reload';
  try {
    const previous = Number(browser.sessionStorage.getItem(key) || 0);
    const now = Date.now();
    if (previous && now - previous < 60000) return;
    browser.sessionStorage.setItem(key, String(now));
  } catch {
    // Without a reload guard, keep the original error instead of looping.
    return;
  }
  event.preventDefault();
  browser.location.reload();
}
