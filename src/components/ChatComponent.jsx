import { useEffect, useState, useRef } from "react";
import { useSocket } from "../contexts/SocketContext";

const STORAGE_KEY = "chat-users";
const SESSION_KEY = "chat-sessionKey";

async function generateSessionKey() {
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const exported = await window.crypto.subtle.exportKey("jwk", key);
  localStorage.setItem(SESSION_KEY, JSON.stringify(exported));
  return key;
}

async function importSessionKey() {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  const jwk = JSON.parse(stored);
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

async function encryptMessage(message, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(message);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  return { iv: Array.from(iv), content: Array.from(new Uint8Array(encrypted)) };
}

async function decryptMessage(encryptedObj, key) {
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

const ChatBox = ({ userId, recipientId, sessionKey, socket }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket || !sessionKey) return;

    const handleReceive = async (data) => {
      if (data.senderId === userId && data.recipientId === recipientId) return;
      const text = await decryptMessage(data.encryptedMessage, sessionKey);
      setMessages((prev) => [
        ...prev,
        {
          text,
          userId: data.senderId,
          timestamp: new Date().toLocaleTimeString(),
          isIncoming: data.senderId !== userId,
        },
      ]);
    };

    socket.on("receive_message", handleReceive);

    const handleHistory = async (data) => {
      const decrypted = await Promise.all(
        data.map((m) => decryptMessage(m.encryptedMessage, sessionKey))
      );
      setMessages(
        decrypted.map((text, i) => ({
          text,
          userId: data[i].senderId,
          timestamp: new Date(data[i].createdAt).toLocaleTimeString(),
          isIncoming: data[i].senderId !== userId,
        }))
      );
    };

    socket.on("receive_messages_history", handleHistory);
    socket.emit("load_messages", { userId, recipientId });

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("receive_messages_history", handleHistory);
    };
  }, [socket, sessionKey, userId, recipientId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !socket || !sessionKey) return;

    const encrypted = await encryptMessage(inputMessage, sessionKey);
    socket.emit("send_message", {
      senderId: userId,
      recipientId,
      encryptedMessage: encrypted,
      encryptedKey: "dummyKeyBase64",
    });

    setMessages((prev) => [
      ...prev,
      {
        text: inputMessage,
        userId,
        timestamp: new Date().toLocaleTimeString(),
        isIncoming: false,
      },
    ]);
    setInputMessage("");
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 12,
        flex: 1,
      }}
    >
      <h4>{userId}</h4>
      <div
        style={{
          height: 200,
          overflowY: "auto",
          border: "1px solid #eee",
          marginBottom: 10,
          padding: 8,
          background: "#fafafa",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{ textAlign: msg.userId === userId ? "right" : "left" }}
          >
            <div
              style={{
                display: "inline-block",
                background: msg.userId === userId ? "#3498db" : "#95a5a6",
                color: "white",
                padding: "6px 10px",
                borderRadius: 12,
                margin: "4px 0",
              }}
            >
              {msg.text}
              <div style={{ fontSize: 10, opacity: 0.7 }}>
                {msg.userId === userId ? "Tú" : msg.userId} • {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Escribe..."
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
          Enviar
        </button>
      </div>
    </div>
  );
};

export const Chat = () => {
  const { connect, sockets } = useSocket();
  const [sessionKey, setSessionKey] = useState(null);

  const [userA, setUserA] = useState(null);
  const [userB, setUserB] = useState(null);

  const [socketA, setSocketA] = useState(null);
  const [socketB, setSocketB] = useState(null);

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (storedUsers) {
      setUserA(storedUsers.userA);
      setUserB(storedUsers.userB);
    } else {
      const newUserA = "user-A-" + Math.random().toString(36).substr(2, 4);
      const newUserB = "user-B-" + Math.random().toString(36).substr(2, 4);
      setUserA(newUserA);
      setUserB(newUserB);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ userA: newUserA, userB: newUserB })
      );
    }

    importSessionKey().then((key) => {
      if (key) setSessionKey(key);
      else generateSessionKey().then(setSessionKey);
    });
  }, []);

  useEffect(() => {
    if (sessionKey && userA && userB) {
      setSocketA(connect(userA));
      setSocketB(connect(userB));
    }
  }, [sessionKey, userA, userB, connect]);

  if (!socketA || !socketB) return <div>Conectando sockets...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>💬 Chat persistente con E2EE</h2>
      <div style={{ display: "flex", gap: 20 }}>
        <ChatBox
          userId={userA}
          recipientId={userB}
          sessionKey={sessionKey}
          socket={socketA}
        />
        <ChatBox
          userId={userB}
          recipientId={userA}
          sessionKey={sessionKey}
          socket={socketB}
        />
      </div>
    </div>
  );
};
