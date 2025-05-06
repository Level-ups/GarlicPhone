function startGoogleLogin() {
    window.location.href = 'http://localhost:5000/api/auth/start';
    
}
document.getElementById('google-login-button')?.addEventListener('click', (e) => {
    e.preventDefault()
    startGoogleLogin()
});