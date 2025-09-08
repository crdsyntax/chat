import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { deriveSessionKeyFromPassword } from "../services/derivate";
import { decryptFile, decryptMessage } from "../services/decryptMessage";
import { encryptFile, encryptMessage } from "../services/encryptMessage";
import { ObjectId } from "bson";
import { message as antMessage, Avatar } from "antd";

export const useChat = (currentUser, users) => {
    const { connect, disconnect, emit, on, off } = useSocket();
    const [chats, setChats] = useState([]);
    const [chatName, setChatName] = useState();
    const [chatImage, setChatImage] = useState();
    const [chatSuject, setChatSuject] = useState();
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [createChatModal, setCreateChatModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [sessionKey, setSessionKey] = useState(null);
    const [keyStatus, setKeyStatus] = useState("generating");
    const [decryptedMessages, setDecryptedMessages] = useState({});
    const messagesEndRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            antMessage.error("El archivo no puede ser mayor a 10MB");
            return;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            setSelectedFile({
                content: Array.from(uint8Array),
                filename: file.name,
                type: file.type,
                size: file.size,
            });

            antMessage.success(`Archivo "${file.name}" listo para enviar`);
        } catch (error) {
            console.error("Error leyendo archivo:", error);
            antMessage.error("No se pudo procesar el archivo");
        }
    };


    useEffect(() => {
        const initSessionKey = async () => {
            try {
                setKeyStatus("generating");

                const userObj = users.find((u) => u._id === currentUser._id);
                if (!userObj || !userObj.password) {
                    throw new Error("No se encontró la contraseña del usuario");
                }

                const key = await deriveSessionKeyFromPassword(
                    userObj.password,
                    userObj._id
                );

                setSessionKey(key);
                setKeyStatus("ready");
                antMessage.success("Clave de cifrado derivada correctamente");
            } catch (error) {
                console.error("Error inicializando clave de sesión:", error);
                setKeyStatus("error");
                antMessage.error("Error al inicializar el cifrado");
            }
        };

        initSessionKey();
    }, [currentUser, users]);

    useEffect(() => {
        if (keyStatus !== "ready") return;

        connect(currentUser._id);

        on(currentUser._id, "receive_message", handleNewMessage);
        on(currentUser._id, "receive_messages_history", handleMessagesHistory);
        on(currentUser._id, "chat_created", handleNewChat);
        on(currentUser._id, "message_read", handleMessageRead);

        const projectId = "64f9a2e3c2a7d9a1b3f0e123";
        loadProjectChats(projectId);

        return () => {
            off(currentUser._id, "receive_message", handleNewMessage);
            off(currentUser._id, "receive_messages_history", handleMessagesHistory);
            off(currentUser._id, "chat_created", handleNewChat);
            off(currentUser._id, "message_read", handleMessageRead);
            disconnect(currentUser._id);
        };
    }, [currentUser, keyStatus]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, decryptedMessages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const decryptAndCacheMessage = useCallback(
        async (message) => {
            if (!message.chatId || decryptedMessages[message._id]) return;

            try {
                const userObj = users.find((u) => u._id === currentUser._id);
                const key = await deriveSessionKeyFromPassword(
                    userObj.password,
                    userObj._id
                );

                const decryptedContent = await decryptMessage(
                    message.encryptedMessage,
                    key
                );

                setDecryptedMessages((prev) => ({
                    ...prev,
                    [message._id]: decryptedContent,
                }));
            } catch (error) {
                console.error("Error descifrando mensaje:", error);
                setDecryptedMessages((prev) => ({
                    ...prev,
                    [message._id]: "[Error al descifrar]",
                }));
            }
        },
        [currentUser, decryptedMessages, users]
    );

    const loadProjectChats = (projectId) => {
        setLoading(true);

        emit(currentUser._id, "get_project_chat", { projectId });

        on(currentUser._id, "project_chat", (projectChats) => {
            setChats(projectChats);
            setLoading(false);
        });

        on(currentUser._id, "project_chat_not_found", () => {
            setChats([]);
            setLoading(false);
        });

        return () => {
            off(currentUser._id, "project_chat");
            off(currentUser._id, "project_chat_not_found");
        };
    };

    const handleNewMessage = async (message) => {
        if (selectedChat && message.chatId === selectedChat._id) {
            setMessages((prev) => [...prev, message]);

            await decryptAndCacheMessage(message);

            if (message.senderId !== currentUser._id) {
                emit(currentUser._id, "mark_as_read", {
                    messageId: message._id,
                    userId: currentUser._id,
                });
            }
        }
    };

    const handleMessagesHistory = async (messagesHistory) => {
        setMessages(messagesHistory);

        for (const msg of messagesHistory) {
            await decryptAndCacheMessage(msg);
        }

        const unreadMessages = messagesHistory.filter(
            (msg) =>
                !msg.readBy.includes(currentUser._id) &&
                msg.senderId !== currentUser._id
        );

        unreadMessages.forEach((msg) => {
            emit(currentUser._id, "mark_as_read", {
                messageId: msg._id,
                userId: currentUser._id,
            });
        });
    };

    const handleNewChat = async (chat) => {
        setChats((prev) => [...prev, chat]);
        setSelectedChat(chat);

        const userObj = users.find((u) => u._id === currentUser._id);
        const key = await deriveSessionKeyFromPassword(userObj.password, userObj._id);
        setSessionKey(key);
        setDecryptedMessages({});

        setCreateChatModal(false);
        setSelectedUsers([]);
        antMessage.success("Chat creado y listo para cifrar mensajes");
    };

    const handleMessageRead = (data) => {
        setMessages((prev) =>
            prev.map((msg) =>
                msg._id === data.messageId
                    ? { ...msg, readBy: [...msg.readBy, data.userId] }
                    : msg
            )
        );
    };

    const selectChat = (chat) => {
        setSelectedChat(chat);
        setLoading(true);

        emit(currentUser._id, "load_messages", { chatId: chat._id });

        setLoading(false);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedChat || !sessionKey) return;

        try {
            const encryptedMessage = await encryptMessage(newMessage, sessionKey);

            const encryptFiles = selectedFile ? selectedFile : []

            emit(currentUser._id, "send_message", {
                chatId: selectedChat._id,
                senderId: currentUser._id,
                senderType: "User",
                attachments: encryptFiles,
                encryptedMessage,
            });

            const tempMessage = {
                _id: new ObjectId().toHexString(),
                chatId: selectedChat._id,
                senderId: currentUser._id,
                senderType: "User",
                encryptedMessage,
                attachments: encryptFiles,
                readBy: [currentUser._id],
                createdAt: new Date(),
            };

            setMessages((prev) => [...prev, tempMessage]);
            setDecryptedMessages((prev) => ({
                ...prev,
                [tempMessage._id]: newMessage,
            }));
            setSelectedFile(null)
            setNewMessage("");
        } catch (error) {
            console.error("Error cifrando mensaje:", error);
            antMessage.error("Error al enviar el mensaje");
        }
    };

    const createChat = () => {
        if (selectedUsers.length === 0) {
            antMessage.error("Selecciona al menos un participante");
            return;
        }

        const projectId = "64f9a2e3c2a7d9a1b3f0e123";

        const participants = [
            { userId: currentUser._id, roleType: "User" },
            ...selectedUsers.map((userId) => ({ userId, roleType: "Client" })),
        ];

        emit(currentUser._id, "create_chat", {
            projectId,
            participants,
            name: chatName,
            subject: chatSuject,
            avatarUrl: chatImage,
        });
    };

    const getChatName = (chat) => {
        if (!chat.isGroup) {
            const otherParticipant = chat.participants.find(
                (p) => p?.userId !== currentUser?._id
            );
            const user = users.find((u) => u?._id === otherParticipant?.userId);
            return user ? user.name : "Usuario desconocido";
        }

        return `Grupo: ${chat.participants.length} participantes`;
    };

    const getUnreadCount = (chat) => {
        return 0;
    };

    const regenerateKey = async () => {
        try {
            setKeyStatus("generating");

            const userObj = users.find((u) => u._id === currentUser._id);
            if (!userObj || !userObj.password) {
                throw new Error("No se encontró la contraseña del usuario");
            }

            const newKey = await deriveSessionKeyFromPassword(
                userObj.password,
                userObj._id
            );
            const projectId = "64f9a2e3c2a7d9a1b3f0e123";
            loadProjectChats(projectId);
            setSessionKey(newKey);
            setKeyStatus("ready");
            setDecryptedMessages({});
            antMessage.success("Clave de cifrado regenerada correctamente");
        } catch (error) {
            console.error("Error regenerando clave:", error);
            setKeyStatus("error");
            antMessage.error("Error al regenerar la clave");
        }
    };

    const viewDoc = async (encryptedFileObject) => {
        const decryptedBlob = await decryptFile(encryptedFileObject, sessionKey);
        if (decryptedBlob) {
            const url = URL.createObjectURL(decryptedBlob);
            window.open(url);
        }
    }

    return {
        chats,
        getChatName,
        getUnreadCount,
        selectedChat,
        messages,
        newMessage,
        loading,
        createChatModal,
        selectedUsers,
        sessionKey,
        keyStatus,
        decryptedMessages,
        messagesEndRef,
        selectChat,
        sendMessage,
        createChat,
        regenerateKey,
        setSelectedUsers,
        setCreateChatModal,
        setNewMessage,
        viewDoc,
        setChatName,
        setChatImage,
        setChatSuject,
        chatName,
        chatImage,
        chatSuject,
        selectedFile, setSelectedFile,
        handleFileSelect
    };
}