export function startGoogleLogin(e: MouseEvent) {
    console.log(e);
    
    e.preventDefault(); // Stop form or button default behavior
    window.location.href = '/api/auth/start'; // relative URL to the backend
}
// document.getElementById('google-login-button')?.addEventListener('click', (e) => {
//     e.preventDefault()
//     startGoogleLogin()
// });