export function startGoogleLogin(e: MouseEvent) {
    e.preventDefault(); // Stop form or button default behavior
    window.location.href = '/api/auth/start'; // relative URL to the backend
}

export function logout() {
    // Remove the token
    sessionStorage.removeItem('google-id-token');
    
    // Close the SSE connection
    (window as any).router?.closeSSEConnection();
    
    // Redirect to login page
    window.location.href = '/login';
}

// document.getElementById('google-login-button')?.addEventListener('click', (e) => {
//     e.preventDefault()
//     startGoogleLogin()
// });