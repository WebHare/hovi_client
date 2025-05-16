export async function validateCredentials(url: string, key:string) {
  const apimeta = await fetch(url + 'v0/meta', {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${key}`
    }
  });
  try {
    return await apimeta.json();
  } catch {
    return null;
  }
}
