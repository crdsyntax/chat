export async function decryptMessage(encryptedObj, key) {
  try {
    const iv = new Uint8Array(encryptedObj.iv);
    const content = new Uint8Array(encryptedObj.content);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      content
    );
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error("❌ Error al descifrar:", err);
    return "[Error de cifrado]";
  }
}

export async function decryptFile(encryptedObj, key) {
  try {
    const iv = new Uint8Array(encryptedObj.iv);
    const content = new Uint8Array(encryptedObj.content);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      content
    );
    return new Blob([decrypted], { type: encryptedObj.type });
  } catch (err) {
    console.error("❌ Error al descifrar archivo:", err);
    return null;
  }
}
