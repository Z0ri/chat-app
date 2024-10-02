const { createServer } = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const path = require('path');

// Create HTTP server
const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:4200", 
    }
});

// Corrected path for the service account JSON
const serviceAccount = require(path.join(__dirname, 'chat-app-3dfec-firebase-adminsdk-l4amc-663fe2b4e7.json')); // Adjust this if necessary

let userId = ""; // Changed const to let to allow reassignment

// Initialize Firebase app
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://chat-app-3dfec-default-rtdb.firebaseio.com/" // Replace with your database URL
});

// Handle socket connections
io.on("connection", (socket) => {
    socket.emit("saveSocket", socket.id);
    console.log(`Client with ID: ${socket.id} connected.`);

    socket.on("notifyClosing", (id) => {
        userId = id;
    });

    socket.on("checkOnline", ()=>{
        io.emit("checkStatus");
        console.log("check status(server)");
    });

    socket.on("disconnect", () => {
        console.log(`Client with ID: ${socket.id} disconnected.`);
        updateSocket(userId);
    });

    socket.on("message", (message) => {
        io.emit("message", message);
    });
});

// Start the server
httpServer.listen(3000, () => {
    console.log("Server is up and listening on port 3000...");
});

// Update socket ID in Firebase
async function updateSocket(userId) {
    const db = admin.database();
    const ref = db.ref(`users/${userId}/socketId`); 

    try {
        await ref.set(""); 
        console.log(`Updated socketId to empty for userId ${userId} in Firebase.`);
    } catch (error) {
        console.error(`Error updating Firebase: ${error}`);
    }
}
