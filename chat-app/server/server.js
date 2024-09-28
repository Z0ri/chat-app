const { createServer } = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');

// Directly set the path to your service account key
const serviceAccount = require('C:/Users/lorir/Desktop/Informatica/js/framework/Angular/chat-app/server/chat-app-3dfec-firebase-adminsdk-l4amc-663fe2b4e7.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://chat-app-3dfec-default-rtdb.firebaseio.com/' 
});

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:4200", 
    }
});

io.on("connection", (socket) => {
    console.log(`Client with ID: ${socket.id} connected.`);
    
    // Store socket ID in Firebase
    admin.database().ref('sockets').push(socket.id);

    socket.on("disconnect", () => {
        console.log(`Client with ID: ${socket.id} disconnected.`);
        
        // Remove socket ID from Firebase on disconnect
        admin.database().ref('sockets').orderByValue().equalTo(socket.id).once('value', (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                childSnapshot.ref.remove();  
            });
        });
    });

    socket.on("message", (message) => {
        io.emit("message", message);
    });
});

httpServer.listen(3000, () => {
    console.log("Server is up and listening on port 3000...");
});
