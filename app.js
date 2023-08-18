/*
 * File: c:\Users\tonyw\Desktop\socketChat\server.js
 * Project: c:\Users\tonyw\Desktop\socketChat
 * Created Date: Thursday August 17th 2023
 * Author: Tony Wiedman
 * -----
 * Last Modified: Fri August 18th 2023 4:18:22 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2023 Tone Web Design, Molex
 */

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

/**
 * Get static files from public folder
 */
app.use(express.static("public"));

/**
 * Socket.io
 * Listen for connection
 */
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("user joined", (data) => {
    const { username } = data;
    socket.username = username;
    socket.userColor = data.userColor;
    socket.broadcast.emit("system message", `${username} has joined the chat.`);
  });

  /**
   * Listen for chat message
   * Emit chat message
   * @param {string} message
   * @param {string} username
   * @param {string} userColor
   * @returns {void}
   */
  socket.on("chat message", (data) => {
    const { message, username, userColor } = data;
    io.emit("chat message", {
      message,
      username,
      userColor,
    });
  });

  /**
   * Listen for username update
   * Emit username update
   * @param {string} newUsername
   * @param {string} oldUsername
   * @param {string} newColor
   * @returns {void}
   */
  socket.on("update username", (data) => {
    const { newUsername, oldUsername, newColor } = data;
    socket.username = newUsername;
    socket.userColor = newColor;
    io.emit("username updated", {
      message: `${oldUsername} changed their username to ${newUsername}.`,
    });
  });

  /**
   * Listen for color update
   * Emit color update
   * @param {string} username
   * @param {string} newColor
   * @returns {void}
   */
  socket.on("update color", (data) => {
    const { username, newColor } = data;
    socket.userColor = newColor;
    io.emit("color updated", {
      message: `${username} changed their color to:`,
      color: newColor,
    });
  });

  /**
   * Listen for disconnect
   * Emit disconnect
   * @returns {void}
   */
  socket.on("disconnect", () => {
    if (socket.username) {
      io.emit("system message", `${socket.username} has left the chat.`);
    }
    console.log("a user disconnected");
  });

  /**
   * Listen for image
   * Emit image
   * @param {string} imageData
   * @param {string} username
   * @param {string} userColor
   * @returns {void}
   */
  socket.on("receive image", function (data) {
    const li = document.createElement("li");
    li.innerHTML = `<div style="color:${data.userColor}">${data.username}:</div> <img src="${data.imageData}" alt="Shared Image" width="200">`;
    document.getElementById("messages").appendChild(li);
  });

  /**
   * Listen for image
   * Emit image
   * @param {string} imageData
   * @param {string} username
   * @param {string} userColor
   * @returns {void}
   */
  socket.on("send image", function (data) {
    io.emit("receive image", data);
  });

  /**
   * Listen for typing
   * Emit user's currently typing
   * @param {string} username
   * @returns {void}
   */
  const typingUsers = new Set();
  socket.on("typing", (data) => {
    typingUsers.add(data.username);
    socket.broadcast.emit("user typing", {
      username: data.username,
    });
  });

  /**
   * Listen for stop typing
   * Emit user stopped typing
   * @param {string} username
   * @returns {void}
   */
  socket.on("stop typing", (data) => {
    typingUsers.delete(data.username);
    socket.broadcast.emit("user stopped typing", {
      username: data.username,
    });
  });
});

/**
 * Listen on port 3000
 */
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
