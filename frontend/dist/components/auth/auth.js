"use strict";
var _a;
function startGoogleLogin() {
    window.location.href = 'http://localhost:5000/api/auth/start';
}
(_a = document.getElementById('google-login-button')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', (e) => {
    e.preventDefault();
    startGoogleLogin();
});
