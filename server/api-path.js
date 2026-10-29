export function apiPath(req) {
  const url = new URL(req.url, 'http://localhost');
  const route = req.query?.__route ?? url.searchParams.get('__route') ?? url.pathname.replace(/^\/api\/?/, '');
  return typeof route === 'string' ? route.split('/').filter(Boolean) : [];
}
