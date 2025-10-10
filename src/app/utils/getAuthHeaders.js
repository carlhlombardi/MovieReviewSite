export function getAuthHeaders(req) {
  const username = req.headers.get("x-username");
  const userIdHeader = req.headers.get("x-userid");
  const userId = userIdHeader ? parseInt(userIdHeader, 10) : null;

  return { username, userId };
}