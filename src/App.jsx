import "./App.css";
import { SocketProvider } from "./contexts/SocketContext";
import ChatRoom from "./components/ChatComponent";
import { useState } from "react";
import "antd/dist/reset.css";
import { ObjectId } from "bson";

const App = () => {
  const [currentUser] = useState({
    _id: "68bd80285efbc44326048d09",
    name: "Usuario Actual",
    avatar: null,
    password: "a3f1b2c4d5e6f789",
  });

  const [users] = useState([
    {
      _id: "68bd80285efbc44326048d09",
      name: "Usuario Actual",
      avatar: null,
      password: "a3f1b2c4d5e6f789",
    },
    {
      _id: "68be2e3a9a5c497f0f456ad3",
      name: "Cliente 1",
      avatar: null,
      password: "f4d3a2b1c6e7f890",
    },
    {
      _id: "68be2eb79a5c497f0f456ada",
      name: "Cliente 2",
      avatar: null,
      password: "1a2b3c4d5e6f7890",
    },
    {
      _id: "68be2ec49a5c497f0f456ae0",
      name: "Cliente 3",
      avatar: null,
      password: "9f8e7d6c5b4a3210",
    },
  ]);
  return (
    <SocketProvider>
      <div style={{ padding: "24px" }}>
        <ChatRoom currentUser={currentUser} users={users} />
      </div>
    </SocketProvider>
  );
};

export default App;
