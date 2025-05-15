export async function apiFetch(method: string, path: string, payload: any, headers: HeadersInit = {}) {
    const token = localStorage.getItem('google-id-token')
    return fetch(`${window.location.origin}${path}`, {
        method,
        headers: { "Content-Type": "application/json",  'Authorization': `Bearer ${token}`, ...headers },
        body: JSON.stringify(payload)
    });
}
