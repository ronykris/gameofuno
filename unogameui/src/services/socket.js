import io from "socket.io-client";

const ENDPOINT = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'https://tonunosocket-6k6gsdlfoa-el.a.run.app/';

const connectionOptions = {
  forceNew: true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  transports: ["websocket"],
};
const socket = io.connect(ENDPOINT, connectionOptions);

export default socket;