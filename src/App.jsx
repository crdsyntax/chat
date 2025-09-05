import "./App.css";
import { SocketProvider } from "./contexts/SocketContext";
import {Chat} from "./components/ChatComponent";

function App() {
  return (
    <>
      <div>
        <SocketProvider>
          <Chat />
        </SocketProvider>
      </div>
    </>
  );
}

export default App;
