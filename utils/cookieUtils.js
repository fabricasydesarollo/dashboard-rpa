// utils/cookieUtils.js
export function setAuthCookie(res, token) {
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 1000 * 60 * 60 * 3, // 3 hora
  });
}
