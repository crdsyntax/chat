export async function encryptMessage(message, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(message)
  );
  return { iv: Array.from(iv), content: Array.from(new Uint8Array(encrypted)) };
}

export async function decryptMessage(encryptedObj, key) {
  const iv = new Uint8Array(encryptedObj.iv);
  const content = new Uint8Array(encryptedObj.content);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    content
  );
  return new TextDecoder().decode(decrypted);
}
