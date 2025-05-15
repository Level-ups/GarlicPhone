export async function apiFetch(method: string, path: string, payload: any, headers: HeadersInit = {}) {
    return fetch(`${window.location.origin}${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(payload)
    });
}
