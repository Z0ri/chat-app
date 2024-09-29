const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:4200", 
    }
});

io.on("connection", (socket) => {
    socket.emit("saveSocket", socket.id);
    console.log(`Client with ID: ${socket.id} connected.`);

    socket.on("disconnect", () => {
        console.log(`Client with ID: ${socket.id} disconnected.`);
    });

    socket.on("message", (message) => {
        io.emit("message", message);
    });
});

httpServer.listen(3000, () => {
    console.log("Server is up and listening on port 3000...");
});
