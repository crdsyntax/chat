import {
  List,
  Input,
  Button,
  Typography,
  Space,
  Badge,
  Modal,
  Select,
  message as antMessage,
  Spin,
  Alert,
  Avatar,
} from "antd";
import {
  SendOutlined,
  UserAddOutlined,
  LockOutlined,
  KeyOutlined,
  MessageOutlined,
  UserOutlined,
  TeamOutlined,
  PaperClipOutlined,
  CloseOutlined,
  FileOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  AudioOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { useChat } from "./hooks/useChat";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ChatRoom = ({ currentUser, users }) => {
  const {
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
    setChatName,
    setChatImage,
    setChatSuject,
    chatName,
    chatImage,
    chatSuject,
    selectedFile,
    setSelectedFile,
    handleFileSelect,
    viewDoc,
  } = useChat(currentUser, users);

  const getFileIcon = (fileType) => {
    if (!fileType) return <FileOutlined />;

    if (fileType.includes("image")) return <FileImageOutlined />;
    if (fileType.includes("pdf")) return <FilePdfOutlined />;
    if (fileType.includes("word") || fileType.includes("document"))
      return <FileWordOutlined />;
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return <FileExcelOutlined />;
    if (fileType.includes("zip") || fileType.includes("compressed"))
      return <FileZipOutlined />;
    if (fileType.includes("video")) return <VideoCameraOutlined />;
    if (fileType.includes("audio")) return <AudioOutlined />;

    return <FileOutlined />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
  };

  const downloadFile = (file) => {
    console.log("Descargando archivo:", file.name);
  };

  const getChatAvatar = (chat) => {
    if (!chat.isGroup) {
      const otherParticipant = chat.participants.find(
        (p) => p?.userId !== currentUser?._id
      );
      const user = users.find((u) => u?._id === otherParticipant?.userId);
      return <Avatar icon={<UserOutlined />} src={user?.avatar} />;
    }

    return <Avatar icon={<TeamOutlined />} />;
  };

  if (keyStatus === "generating") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <Spin size="large" tip="Inicializando cifrado..." />
      </div>
    );
  }

  if (keyStatus === "error") {
    return (
      <div style={{ padding: "20px" }}>
        <Alert
          message="Error de cifrado"
          description="No se pudo inicializar el sistema de cifrado. Por favor, recarga la página."
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => window.location.reload()}>
              Recargar
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "90vh",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div
        style={{
          width: "340px",
          backgroundColor: "#F8FAFC",
          borderRight: "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <span
            style={{ fontWeight: "600", fontSize: "18px", color: "#1E293B" }}
          >
            Conversaciones
          </span>
          <Space>
            <Button
              icon={<KeyOutlined />}
              size="small"
              onClick={regenerateKey}
              title="Regenerar clave de cifrado"
              style={{
                backgroundColor: "transparent",
                border: "1px solid #E2E8F0",
                color: "#fa0932ff",
              }}
            />
            <Button
              icon={<UserAddOutlined />}
              type="primary"
              size="small"
              onClick={() => setCreateChatModal(true)}
              style={{
                backgroundColor: "#3B82F6",
                border: "none",
                borderRadius: "8px",
                fontWeight: "500",
              }}
            >
              Nuevo chat
            </Button>
          </Space>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          <List
            dataSource={chats}
            renderItem={(chat) => (
              <List.Item
                style={{
                  cursor: "pointer",
                  padding: "16px 20px",
                  backgroundColor:
                    selectedChat?._id === chat._id ? "#EFF6FF" : "transparent",
                  borderBottom: "1px solid #F1F5F9",
                  transition: "all 0.2s ease",
                }}
                onClick={() => selectChat(chat)}
              >
                <List.Item.Meta
                  avatar={
                    <Badge
                      count={getUnreadCount(chat)}
                      offset={[-5, 5]}
                      style={{
                        backgroundColor: "#EF4444",
                        boxShadow: "0 0 0 2px #F8FAFC",
                      }}
                    >
                      {getChatAvatar(chat)}
                    </Badge>
                  }
                  title={
                    <span style={{ fontWeight: "500", color: "#1E293B" }}>
                      {getChatName(chat)}
                    </span>
                  }
                  description={
                    <Space>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#64748B",
                        }}
                      >
                        {chat.isGroup ? "Grupo" : "Chat privado"}
                      </span>
                      <LockOutlined
                        style={{ fontSize: "10px", color: "#10B981" }}
                      />
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
        }}
      >
        {selectedChat ? (
          <>
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#F8FAFC",
              }}
            >
              <span style={{ fontWeight: "600", color: "#1E293B" }}>
                {getChatName(selectedChat)}
              </span>
              <LockOutlined
                style={{ color: "#10B981", fontSize: "16px" }}
                title="Conversación cifrada"
              />
            </div>

            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "24px",
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, #E2E8F0 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            >
              {loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <Spin tip="Cargando mensajes..." />
                </div>
              ) : messages.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#94A3B8",
                    marginTop: "60px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <MessageOutlined
                    style={{
                      fontSize: "48px",
                      marginBottom: "16px",
                      color: "#E2E8F0",
                    }}
                  />
                  <div style={{ fontSize: "16px", fontWeight: "500" }}>
                    No hay mensajes aún
                  </div>
                  <div style={{ fontSize: "14px", marginTop: "8px" }}>
                    ¡Envía el primero!
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === currentUser._id;
                  const sender = users.find((u) => u._id === msg.senderId);
                  const decryptedContent =
                    decryptedMessages[msg._id] || "⏳ Descifrando...";

                  // Verificar si el mensaje tiene archivos adjuntos
                  const hasFiles = msg.files && msg.files.length > 0;

                  return (
                    <div
                      key={msg._id}
                      style={{
                        display: "flex",
                        justifyContent: isOwn ? "flex-end" : "flex-start",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "70%",
                          padding: "12px 16px",
                          borderRadius: isOwn
                            ? "16px 16px 4px 16px"
                            : "16px 16px 16px 4px",
                          backgroundColor: isOwn ? "#3B82F6" : "#F1F5F9",
                          color: isOwn ? "white" : "#1E293B",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                        }}
                      >
                        {/* Información del remitente */}
                        <div
                          style={{
                            fontSize: "12px",
                            marginBottom: "6px",
                            opacity: 0.9,
                            fontWeight: "500",
                          }}
                        >
                          {isOwn ? "Tú" : sender?.name || "Usuario desconocido"}
                        </div>

                        {/* Contenido del mensaje (si existe) */}
                        {decryptedContent &&
                          decryptedContent !== "⏳ Descifrando..." && (
                            <div
                              style={{
                                lineHeight: "1.4",
                                marginBottom: hasFiles ? "12px" : "0",
                              }}
                            >
                              {decryptedContent}
                            </div>
                          )}

                        {/* Archivos adjuntos */}
                        {hasFiles && (
                          <div
                            style={{
                              marginTop: decryptedContent ? "10px" : "0",
                            }}
                          >
                            {msg.files.map((file, index) => (
                              <div
                                key={index}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "8px",
                                  backgroundColor: isOwn
                                    ? "rgba(255, 255, 255, 0.15)"
                                    : "rgba(0, 0, 0, 0.05)",
                                  borderRadius: "8px",
                                  marginBottom:
                                    index < msg.files.length - 1 ? "8px" : "0",
                                  border: `1px solid ${
                                    isOwn
                                      ? "rgba(255, 255, 255, 0.2)"
                                      : "rgba(0, 0, 0, 0.1)"
                                  }`,
                                }}
                              >
                                {/* Icono según el tipo de archivo */}
                                <div
                                  style={{
                                    marginRight: "10px",
                                    fontSize: "18px",
                                  }}
                                >
                                  {getFileIcon(file.type)}
                                </div>

                                {/* Información del archivo */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: "500",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                    title={file.name}
                                  >
                                    {file.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      opacity: 0.8,
                                    }}
                                  >
                                    {formatFileSize(file.size)}
                                  </div>
                                </div>

                                {/* Botón de descarga */}
                                <Button
                                  type="text"
                                  icon={<DownloadOutlined />}
                                  size="small"
                                  onClick={() => downloadFile(file)}
                                  style={{
                                    color: isOwn ? "white" : "#3B82F6",
                                    marginLeft: "8px",
                                  }}
                                  title="Descargar archivo"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Información de tiempo y estado de lectura */}
                        <div
                          style={{
                            fontSize: "10px",
                            textAlign: "right",
                            opacity: 0.7,
                            marginTop: "4px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>
                            {new Date(
                              msg.createdAt || Date.now()
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>
                            {isOwn && msg.readBy && msg.readBy.length > 1 && (
                              <span style={{ marginLeft: "5px" }}>
                                <CheckOutlined /> Leído
                              </span>
                            )}
                            {hasFiles && (
                              <PaperClipOutlined
                                style={{ marginLeft: "8px", fontSize: "10px" }}
                              />
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div
              style={{
                padding: "20px 24px",
                borderTop: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
              }}
            >
              <div
                style={{
                  padding: "20px 24px",
                  borderTop: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                }}
              >
                {selectedFile && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px",
                      backgroundColor: "#F1F5F9",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <PaperClipOutlined style={{ color: "#64748B" }} />
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#334155",
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {selectedFile.name}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748B" }}>
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="text"
                      icon={<CloseOutlined />}
                      size="small"
                      onClick={() => setSelectedFile(null)}
                      style={{ color: "#64748B" }}
                    />
                  </div>
                )}

                <Space.Compact style={{ width: "100%" }}>
                  <Button
                    icon={<PaperClipOutlined />}
                    onClick={() =>
                      document.getElementById("file-input").click()
                    }
                    style={{
                      borderRadius: "8px 0 0 8px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#F8FAFC",
                      color: "#64748B",
                      padding: "0 12px",
                    }}
                    title="Adjuntar archivo"
                  />
                  <input
                    type="file"
                    id="file-input"
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                  />

                  <TextArea
                    placeholder="Escribe un mensaje .."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onPressEnter={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{
                      border: "1px solid #E2E8F0",
                      borderLeft: "none",
                      borderRight: "none",
                      padding: "12px 16px",
                    }}
                  />

                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    disabled={
                      (!newMessage.trim() && !selectedFile) || !sessionKey
                    }
                    style={{
                      borderRadius: "0 8px 8px 0",
                      backgroundColor: "#3B82F6",
                      border: "none",
                      height: "auto",
                      padding: "0 16px",
                    }}
                  >
                    Enviar
                  </Button>
                </Space.Compact>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#94A3B8",
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <LockOutlined style={{ marginRight: "6px" }} /> Todos los
                    mensajes y archivos se cifran antes de enviarse
                  </div>
                  {selectedFile && (
                    <div style={{ fontSize: "11px" }}>
                      Archivo listo para enviar cifrado
                    </div>
                  )}
                </div>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#94A3B8",
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <LockOutlined style={{ marginRight: "6px" }} /> Todos los
                mensajes se cifran antes de enviarse
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#94A3B8",
              backgroundColor: "#F8FAFC",
              padding: "40px",
            }}
          >
            <div
              style={{
                padding: "24px",
                borderRadius: "50%",
                backgroundColor: "#EFF6FF",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LockOutlined style={{ fontSize: "48px", color: "#3B82F6" }} />
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "500",
                marginBottom: "8px",
              }}
            >
              Selecciona una conversación
            </div>
            <div style={{ textAlign: "center", maxWidth: "400px" }}>
              Todas las conversaciones están protegidas con cifrado de extremo a
              extremo
            </div>
          </div>
        )}
      </div>

      <Modal
        title="Crear nuevo chat"
        open={createChatModal}
        onOk={createChat}
        onCancel={() => {
          setCreateChatModal(false);
          setSelectedUsers([]);
          setChatName("");
          setChatImage("");
        }}
        okText="Crear chat"
        cancelText="Cancelar"
        width={500}
        styles={{
          body: { padding: "20px" },
          header: { borderBottom: "1px solid #E2E8F0", padding: "16px 20px" },
          footer: { borderTop: "1px solid #E2E8F0", padding: "12px 20px" },
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Nombre del chat
            </label>
            <Input
              placeholder="Ingresa un nombre para el chat"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #D1D5DB",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              URL de la imagen (opcional)
            </label>
            <Input
              placeholder="https://ejemplo.com/imagen.jpg"
              value={chatImage}
              onChange={(e) => setChatImage(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #D1D5DB",
              }}
            />
            <div
              style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}
            >
              Inserta la URL de una imagen para personalizar el chat
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Participantes
            </label>
            <Select
              mode="multiple"
              placeholder="Selecciona participantes"
              style={{ width: "100%", borderRadius: "8px" }}
              value={selectedUsers}
              onChange={setSelectedUsers}
              optionFilterProp="children"
            >
              {users
                .filter((user) => user._id !== currentUser._id)
                .map((user) => (
                  <Option key={user._id} value={user._id}>
                    {user.name}
                  </Option>
                ))}
            </Select>
          </div>

          <div
            style={{
              padding: "12px",
              backgroundColor: "#F9FAFB",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#6B7280",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <LockOutlined style={{ color: "#10B981" }} />
            <span>Esta conversación será cifrada de extremo a extremo</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatRoom;
