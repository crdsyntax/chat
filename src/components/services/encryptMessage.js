export async function encryptMessage(message, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(message);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoded
    );
    return { iv: Array.from(iv), content: Array.from(new Uint8Array(encrypted)) };
}

export async function encryptFile(file, key) {
    try {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const fileBuffer = await file.arrayBuffer();
        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            fileBuffer
        );
        const content = Array.from(new Uint8Array(encryptedBuffer));
        return {
            iv: Array.from(iv),
            content,
            filename: file.name,
            type: file.type,
        };
    } catch (error) {
        console.error("Error cifrando archivo:", error);
        throw error;
    }
}
