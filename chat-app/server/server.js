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
    io.emit("checkStatus"); //notify all clients's contacts to check if they're owners are online
    console.log("EMESSO CHECK STATUS!");
    socket.join(socket.id);
    console.log(`Client with ID: ${socket.id} connected.`);

    socket.on("notifyClosing", (id) => {
        userId = id;
        io.emit("checkStatus"); //notify all clients's contacts to check if they're owners are online
    });

    socket.on("disconnect", () => {
        console.log(`Client with ID: ${socket.id} disconnected.`);
        removeSocket(userId); //remove socket id
    });

    //listen for client's messages
    socket.on("message", (data) => {
        console.log("Message received (server)");
        console.log("Receiver socket id: " + data.socketId);
        io.to(data.socketId).emit("message", data.message);
    });    
});

// Start the server
httpServer.listen(3000, () => {
    console.log("Server is up and listening on port 3000...");
});

// Update socket ID in Firebase
async function removeSocket(userId) {
    const db = admin.database();
    const ref = db.ref(`users/${userId}/socketId`); 

    try {
        await ref.set(""); 
        console.log(`Updated socketId to empty for userId ${userId} in Firebase.`);
    } catch (error) {
        console.error(`Error updating Firebase: ${error}`);
    }
}
