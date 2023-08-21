/*
 * File: c:\Users\tonyw\Desktop\socketChat\public\js\messenger.js
 * Project: c:\Users\tonyw\Desktop\GIT Messenger\socket-messenger
 * Created Date: Friday August 18th 2023
 * Author: Tony Wiedman
 * -----
 * Last Modified: Mon August 21st 2023 2:36:29 
 * Modified By: Tony Wiedman
 * -----
 * Copyright (c) 2023 Tone Web Design, Molex
 */
const socket = io();

// Get LocalStorage
const storedUsername = localStorage.getItem("username");
const storedColor = localStorage.getItem("userColor");

// Typing indicator
const typingUsers = new Set();
let typingTimeout;

/**
 * Check if username and color are stored in localStorage
 * If so, set the username and color in the hidden fields
 * and hide the overlay
 * 
 * Emit user joined event
 * @returns {void}
 */
if (storedUsername && storedColor) {
    Id("username").value = storedUsername;
    Id("colorPicker").value = storedColor;
    Id("overlay").style.display = "none";
    socket.emit("user joined", {
        username: storedUsername,
        userColor: storedColor,
    });
}

/**
 * Listen for user joined event
 * Emit system message
 * @param {string} username
 * @returns {void}
 */
Id("joinChat").addEventListener("click", () => {
    const username = Id("username").value;
    const userColor = Id("colorPicker").value;

    if (username.trim() !== "") {
        Id("overlay").style.display = "none";

        localStorage.setItem("username", username);
        localStorage.setItem("userColor", userColor);

        socket.emit("user joined", {
            username,
            userColor
        });
    }
});

/**
 * Listen for settings button click
 * Display settings overlay
 * @returns {void}
 */
Id("settingsButton").addEventListener("click", () => {
    Id("settingsOverlay").style.display = "flex";
    Id("newUsername").value = Id("username").value;
    Id("newColorPicker").value = Id("colorPicker").value;
});

/**
 * Listen for close settings button click
 * Hide settings overlay
 * @returns {void}
 */
Id("closeSettings").addEventListener("click", () => {
    Id("settingsOverlay").style.display = "none";
});

/**
 * Listen for update settings button click
 * Emit update username event
 * @returns {void}
 */
Id("updateSettings").addEventListener("click", () => {
    const newUsername = Id("newUsername").value.trim();
    const oldUsername = Id("username").value;
    const newColor = Id("newColorPicker").value;

    Id("colorPicker").value = Id("newColorPicker").value;

    if (newUsername !== "" && newUsername !== oldUsername) {
        socket.emit("update username", {
            newUsername,
            oldUsername,
            newColor,
        });
        Id("username").value = newUsername;

        localStorage.setItem("username", newUsername);
        localStorage.setItem("userColor", newColor);
    } else {
        localStorage.setItem("userColor", newColor);
        socket.emit("update color", {
            username: oldUsername,
            newColor
        });
    }

    Id("newUsername").value = "";
});

/**
 * Listen for system message
 * @param {string} message
 * @returns {void}
 */
socket.on("system message", function (message) {
    const li = document.createElement("li");
    li.textContent = message;
    li.style.color = "#E74C3C";
    Id("messages").appendChild(li);

    Id("messages").scrollTop = Id("messages").scrollHeight;
});

/**
 * Listen for chat message
 * @param {string} message
 * @param {string} username
 * @param {string} userColor
 * @returns {void}
 */
socket.on("chat message", function (data) {
    const {
        message,
        username,
        userColor
    } = data;
    const convertedMessage = message.replace(
        youtubeURLPattern,
        convertToEmbedURL
    );

    const li = document.createElement("li");
    li.innerHTML = `<span style="color:${userColor}">${username}:</span> ${convertedMessage}`;
    Id("messages").appendChild(li);
    Id("messages").scrollTop = Id("messages").scrollHeight;
});

/**
 * Listen for username update notifications
 * @param {string} message
 * @returns {void}
 */
socket.on("color updated", function (data) {
    const li = document.createElement("li");
    li.innerHTML = `${data.message} <span style="background-color:${data.color}; display: inline-block; width: 14px; height: 14px; border-radius: 50%;"></span>`;
    li.style.color = "#E74C3C";
    Id("messages").appendChild(li);
    Id("messages").scrollTop = Id("messages").scrollHeight;
});

/**
 * Listen for username update notifications
 * @param {string} message
 * @returns {void}
 */
socket.on("username updated", function (data) {
    const li = document.createElement("li");
    li.textContent = data.message;
    li.style.color = "#E74C3C";
    Id("messages").appendChild(li);
    Id("messages").scrollTop = Id("messages").scrollHeight;
});

/**
 * Listen for chat form submit
 * Emit chat message
 * @param {Event} e
 * @returns {void}
 */
Id("chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const message = Id("inputMessage").value;
    const username = Id("username").value;
    const userColor = Id("colorPicker").value;

    socket.emit("chat message", {
        username,
        message,
        userColor: Id("colorPicker").value,
    });
    Id("inputMessage").value = "";
});

/**
 * Listen for image input change
 * Emit image
 */
document
    .getElementById("imageInput")
    .addEventListener("change", function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const userColor = Id("colorPicker").value;
                const username = Id("username").value;
                socket.emit("send image", {
                    imageData: event.target.result,
                    userColor: userColor,
                    username: username,
                });
            };
            reader.readAsDataURL(file);
        }
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
    console.log("Received image on client:", data);
    const li = document.createElement("li");
    const img = document.createElement("img");

    img.src = data.imageData;
    img.alt = "Shared Image";
    img.width = 200;
    img.onload = function () {
        Id("messages").scrollTop = Id("messages").scrollHeight;
    };

    li.innerHTML = `<div style="color:${data.userColor}">${data.username}:</div>`;
    li.appendChild(img);
    Id("messages").appendChild(li);
});

/**
 * On keyup, emit typing event
 * @param {Event} e - keyup event
 * @returns {void}
 */
Id("inputMessage").addEventListener("keyup", function () {
    clearTimeout(typingTimeout);

    socket.emit("typing", {
        username: Id("username").value,
    });

    typingTimeout = setTimeout(() => {
        socket.emit("stop typing", {
            username: Id("username").value,
        });
    }, 2000);
});

/**
 * Listen for user typing
 * Emit user typing
 * @param {string} username
 * @returns {void}
 */
socket.on("user typing", function (data) {
    const typingArea = Id("typingArea");
    typingUsers.add(data.username);
    updateTypingArea(typingArea);
});

/**
 * Listen for user stopped typing
 * Emit user stopped typing
 * @param {string} username
 * @returns {void}
 */
socket.on("user stopped typing", function (data) {
    const typingArea = Id("typingArea");
    typingUsers.delete(data.username);
    updateTypingArea(typingArea);
});

/**
 * Update the typing area
 * @param {HTMLElement} typingArea
 * @returns {void}
 */
function updateTypingArea(typingArea) {
    const typingUsersArray = Array.from(typingUsers);
    if (typingUsersArray.length > 0) {
        typingArea.textContent = `${typingUsersArray.join(", ")} ${typingUsersArray.length > 1 ? "are" : "is"
            } typing...`;
    } else {
        typingArea.textContent = "";
    }
}

/**
 * Show YouTube search overlay
 * @returns {void}
 */
function showYouTubeOverlay() {
    Id("ytOverlay").style.display = "flex";
}
/**
 * Hide YouTube search overlay
 * @returns {void}
 */
function hideYouTubeOverlay() {
    Id("ytOverlay").style.display = "none";
}
/**
 * Listen for open popup button click
 * Show YouTube search overlay
 */
Id("openYouTube").addEventListener("click", showYouTubeOverlay);
/**
 * Listen for close popup button click
 * Hide YouTube search overlay
 */
Id("closeYouTube").addEventListener("click", hideYouTubeOverlay);
/**
 * Listen for click outside of YouTube search overlay
 * Hide YouTube search overlay
 */
Id("ytOverlay").addEventListener("click", function (event) {
    if (event.target === Id("ytOverlay")) {
        hideYouTubeOverlay();
    }
});

/**
 * Listen for youtube search results
 * @param {Array} results - array of search results
 * @returns {void}
 */
socket.on("youtube search results", (results) => {
    const searchResults = Id("searchResults");
    searchResults.innerHTML = "";

    results.forEach((result) => {
        const listItem = document.createElement("li");
        listItem.textContent = result.title;
        searchResults.appendChild(listItem);
    });
});

/**
 * Search YouTube API
 * @param {string} query - search query
 * @returns 
 */
async function searchYouTube(query) {

    const apiKey = "";
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${apiKey}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    const searchResults = data.items.map((item) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
    }));

    return searchResults;
}

/**
 * Send YouTube link
 * @param {string} videoId - YouTube video ID
 */
function sendYouTubeLink(videoId) {
    const username = Id("username").value;
    const userColor = Id("colorPicker").value;

    socket.emit("chat message", {
        username,
        message: `https://www.youtube.com/watch?v=${videoId}`,
        userColor,
    });

    Id("messages").scrollTop = Id("messages").scrollHeight;
}

/**
 * Search YouTube Handler
 * @returns {void}
 */
const searchYouTubeFunction = async () => {
    const searchQuery = Id("youtubeSearchInput").value;
    const searchResults = await searchYouTube(searchQuery);

    Id("searchResults").innerHTML = "";

    searchResults.forEach((result) => {
        const listItem = document.createElement("li");
        listItem.textContent = result.title;
        listItem.addEventListener("click", () => {
            sendYouTubeLink(result.videoId);
            Id("ytOverlay").style.display = "none";
        });
        Id("searchResults").appendChild(listItem);
    });
};

/**
 * Listen for search button click, and input enter key
 * Search YouTube
 * @returns {void}
 */
Id("searchYouTube").addEventListener("click", searchYouTubeFunction);

Id("youtubeSearchInput").addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        searchYouTubeFunction();
    }
});

/**
 * YouTube URL pattern
 * @type {RegExp}
 * @returns {void}
 */
const youtubeURLPattern =
    /(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?:&[^ ]+)?|https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+))/;

/**
 * Convert YouTube URL to embed URL
 * @param {*} match - regex match
 * @param {*} p1 - first capture group
 * @param {*} p2 - second capture group
 * @param {*} p3 - third capture group
 * @returns - embed URL
 */
function convertToEmbedURL(match, p1, p2, p3) {
    const videoID = p2 || p3;
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoID}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}