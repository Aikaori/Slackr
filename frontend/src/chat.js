import { sendRequest, popUp, userToken, userId } from "./main.js";
import { hideChannelList } from "./channel.js";
import viewUserProfile from "./user.js";
import { fileToDataUrl } from './helpers.js';

const chatContent = document.getElementById("chatContent"); // all chats container
const loading = document.getElementById("loading"); // loading logo
const sendBtn = document.getElementById("sendBtn"); // send message button
const userInput = document.getElementById("userInput"); // user input message area
const editInput = document.getElementById("editInput"); // user edit message area
const sendimageMessage = document.getElementById("sendimageMessage"); // user send image button
const slideImage = document.getElementById("slideImage"); // enlage image container
const emojiMessages = document.getElementsByClassName("emojiMessage"); // emoji messages
const emojisContainer = document.getElementById("emojisContainer"); // emoji container
const reactions = document.querySelectorAll(".emojiReaction"); // emoji reaction conatiner

// pinned message sort button
const pinnedMessageSort = document.getElementById("pinnedMessageSort");
// decoration send image button
const disguiseSendImageMessage = document.getElementById("disguiseSendImageMessage");


let preKeyDown = ""; // previous key input
let preEditKey = ""; // previous edited key input
let images = new Array(); // all images
let pinnedImages = new Array(); // all pinned images
let messageIds = new Array(); // image message id
let imageIndex; // current image index

//setup emojis for input
for (const emojiMessage of emojiMessages) {
    // shortcut emoji to add emoji into message
    emojiMessage.addEventListener("click", () => {
        userInput.value += emojiMessage.innerText;
        editInput.value += emojiMessage.innerText;
    })
}

// display enlarge image
const showEnlarge = (id) => {
    let enlargeImage = document.getElementById("enlargeImage"); // enlarge image container
    let pinned = document.getElementById("pinnedMessage"); // pinned message container
    let channelId = document.querySelector(".selected").id; // channel id

    images = new Array(); // initlize images array
    pinnedImages = new Array(); // initlize pinned images array
    messageIds = new Array(); // initlize image index array

    if (!navigator.onLine) {
        // view image offline
        let allImages = document.querySelectorAll(`div[channelid="${channelId}"] img.messageImage`); // get all loaded images
        let length = allImages.length; // num of image

        if (pinned.hasAttribute("style")) {
            // find pinned images
            slideImage.setAttribute("pinned", true);
            for (let i = length - 1; i >= 0; --i) {
                // store images and image id
                if (allImages[i].hasAttribute("pinned")) {
                    pinnedImages.push(allImages[i].src);
                    messageIds.push(parseInt(allImages[i].parentElement.parentElement.getAttribute("messageid")));
                }
            }
            // display image
            enlargeImage.style.display = "block";
            showNextEnlarge(pinnedImages, id);
        }
        else {
            for (let i = length - 1; i >= 0; --i) {
                // store images and image id
                images.push(allImages[i].src);
                messageIds.push(parseInt(allImages[i].parentElement.parentElement.getAttribute("messageid")));
            }

            // display image
            enlargeImage.style.display = "block";
            showNextEnlarge(images, id);
        }
        return;
    }

    // get all online images
    if (pinned.hasAttribute("style")) {
        // find pinned images
        slideImage.setAttribute("pinned", true);

        getAllImage(channelId, 0, true)
        .then(() => {
            // display image
            enlargeImage.style.display = "block";
            showNextEnlarge(pinnedImages, id);
        })
        .catch(e => {
            popUp(e.error);
        })
    }
    else {
        // find images
        slideImage.removeAttribute("pinned");
        getAllImage(channelId, 0)
        .then(() => {
            // display image
            enlargeImage.style.display = "block";
            showNextEnlarge(images, id);
        })
        .catch(e => {
            popUp(e.error);
        })
    }
}

// display next enlarge image
const showNextEnlarge = (images, id) => {
    imageIndex = messageIds.indexOf(id);
    slideImage.src = images[imageIndex];
}

// find all images including not loaded images
const getAllImage = (channelId, index, isPinned=false) => {
    return new Promise((resolve, reject) => {
        sendRequest("GET", `/message/${channelId}?start=${index}`, userToken)
        .then(response => {
            // stop recursion if not more previous message
            if (response.messages.length === 0) {
                resolve();
            }

            for (const message of response.messages) {
                if (message.image) {
                    if (isPinned && message.pinned) {
                        // store pinned image
                        pinnedImages.push(message.image);
                        messageIds.push(message.id);
                    }
                    else if (!isPinned) {
                        // store image
                        images.push(message.image);
                        messageIds.push(message.id);
                    }
                }
            }

            // recursive request previous messages
            if (response.messages.length) {
                resolve(getAllImage(channelId, index + 25, isPinned));
            }
        })
        .catch(e => {
            reject(e);
        })
    });
};

// return current node's index
const getNodeIndex = (node) => {
    let nodeContainer = node.parentNode; // current node parent container
    let grandparentNode = nodeContainer.parentNode; // current node grandparent container
    let childrenNum = grandparentNode.childElementCount; // number of children
    return childrenNum - Array.prototype.indexOf.call(grandparentNode.children, nodeContainer) - 1;
}

// show all user that react with current message
const getReactUser = (button) => {
    let index = getNodeIndex(button); // index of current node
    let channelId = document.querySelector(".selected").id; // channel id

    // react user container
    let reactUserContainer = document.getElementById("reactUserContainer");

    // remove all previous message reactions
    reactUserContainer.lastChild.remove();

    // get current messages reactions
    sendRequest("GET", `/message/${channelId}?start=${index}`, userToken)
    .then(response => {
        let list = document.createElement("ul"); // reactions container

        // set up information fo each reaction
        for (const { react, user } of response.messages[0].reacts) {
            let userItem = document.createElement("li"); // user
            let emoji = document.createElement("div"); // emoji container

            let userInfo = document.createElement("div"); // user information container
            let userName = document.createElement("div"); // user name container
            let userImage = document.createElement("img"); // user image container
            
            // get user name and image
            sendRequest("GET", `/user/${user}`, userToken)
            .then(response => {
                if (response.image) {
                    userImage.classList.remove("defaultImage");
                    userImage.src = response.image;
                }
                userName.innerText = response.name;
            })

            // display emoji
            emoji.innerText = react;
            
            // setup default image format
            userImage.classList.add("defaultImage");
            userImage.classList.add("reactUserImage");
            userImage.classList.add("imageBaseSetting");

            // setup user information container
            userInfo.classList.add("reactUserInfo");
            userInfo.appendChild(userImage);
            userInfo.appendChild(userName);
            
            // insert to display user reaction
            userItem.appendChild(userInfo);
            userItem.appendChild(emoji);
            list.append(userItem);
            reactUserContainer.append(list);
        }

        // display reaction container
        reactUserContainer.style.display = "block";
        document.getElementById("chatWrap").style.display = "block";
    })
    .catch(e => {
        // warning notification
        popUp(e.error);
    })
};

// set up message sender information for display
const setSenderInfo = (sender, userName, userimage) => {
    // get user information
    sendRequest("GET", `/user/${sender}`, userToken)
    .then(response => {
        // store sender information
        localStorage.setItem(sender, JSON.stringify(response));

        // set up sender profile image
        if (response.image) {
            userimage.classList.remove("defaultImage");
            userimage.src = response.image;
        }

        // set up sender name
        userName.innerText = response.name;
    })
    .catch(e => {
        // warning notification
        popUp(e.error)
    });
};

// set up message appearance
const setUpMessageStyle = (messageInfo, messageContainer, message, sender, userName, userimage, sendTime) => {
    // setup message overall appearance
    messageContainer.setAttribute("messageid", messageInfo.id);
    messageContainer.setAttribute("userid", sender);
    messageContainer.classList.add("chatMessageContainer")

    // setup user profile image appearance 
    userimage.classList.add("defaultImage");
    userimage.classList.add("chatUserImage");

    // setup user profile name appearance 
    userName.classList.add("chatUserName");
    sendTime.classList.add("chatSentTime");

    if (sender === userId) {
        // display message at left hand side
        message.classList.add("ownMessage");
        userName.classList.add("ownUserName");
        sendTime.classList.add("ownSentTime");
        userimage.classList.add("ownUserImage");
        messageContainer.classList.add("ownMessageContainer");
    }
    else {
        // display message at right hand side
        message.classList.add("chatMessage");
    }

    // setup pinned flag
    if (messageInfo.pinned) {
        message.setAttribute("pinned", true);
    }
}

// setup image message
const setMessageImage = (messageInfo, messageContainer, message, image, imageClickHandler) => {
    if (messageInfo.image) {
        // create enlarge button
        let enlarge = document.createElement("button");
        
        // setup image
        image.src = messageInfo.image;
        image.classList.add("messageImage")

        // setup enlarge button appearance and utility
        enlarge.classList.add("enlarge");
        enlarge.innerText = String.fromCodePoint(128269);
        enlarge.addEventListener("click", () => imageClickHandler(messageInfo.id));

        // display image
        message.appendChild(image);
        if (messageContainer.querySelector(".enlarge") === null) {
            messageContainer.appendChild(enlarge);
        }
    }
};

// setup response option container
const setUpResponse = (messageInfo, messageContainer, sender, message, pinned) => {
    let ownReact = new Array(); // own react array
    let count = 0; // number of all reactions

    for (const react of messageInfo.reacts) {
        if (react.user === userId) {
            // store own reaction
            ownReact.push(react.react);
        }
        ++count;
    }

    // setup own message reaction
    message.setAttribute("react", ownReact.join(" "));

    if (!pinned) {
        // setup response utility while not viewing pinned message
        message.addEventListener("click", () => {
            responseToMessage(message, sender === userId);
        });

        // set up small logo for notification indicate current message has reactions
        if (count !== 0) {
            let reactButton = document.createElement("button");
            reactButton.innerText = String.fromCodePoint(128512);
            reactButton.setAttribute("count", count);
            reactButton.addEventListener("click", () => getReactUser(reactButton));
            reactButton.setAttribute("messageid", messageInfo.id);
            reactButton.classList.add("getUserReactions");
            messageContainer.appendChild(reactButton);
        }
    }
};

// setup editing time
const setUpEditTime = (messageInfo, messageContainer, sender) => {
    if (messageInfo.edited) {
        // transform time into utc time string
        let editTime = (new Date(messageInfo.editedAt)).toUTCString();
        let editTimeContainer = document.createElement("div");

        // set time in time container
        editTime = editTime.substr(0, editTime.length - 7);
        editTimeContainer.innerText = `edited at: ${editTime}`;
        editTimeContainer.classList.add("editedTime");

        if (sender === userId) {
            // display own edited time at right hand side
            editTimeContainer.classList.add("ownEditeTime");
        }
        messageContainer.appendChild(editTimeContainer);
    }
};

// insert message into chat node
const insertMessageToContainer = (channelChatContainer, messageContainer, getAllNewMessages, oldMessage, node) => {
    if (getAllNewMessages) {
        // insert all not read new messages after the end of last viewed message
        if (node.nextElementSibling) {
            channelChatContainer.insertBefore(messageContainer, node.nextElementSibling);
        }
        else {
            channelChatContainer.appendChild(messageContainer);
        }
    }
    else if (!oldMessage) {
        // insert all messages after lauching
        channelChatContainer.appendChild(messageContainer);
    }
    else {
        // insert all old messages in front of the current oldest message
        channelChatContainer.insertBefore(messageContainer, channelChatContainer.firstChild); 
    }
};

// display message in chat
const displayMessage = (channelChatContainer, messageInfo, oldMessage=false, getAllNewMessages=false, node=null, pinned=false) => {
    let messageContainer = document.createElement("div"); // message information container
    let message = document.createElement("div"); // message container
    let image = document.createElement("img"); // image message container
    let userName = document.createElement("div"); // user name container
    let sendTime = document.createElement("div"); // send time container
    let userimage = document.createElement("img"); // user profile image container
    let sender = messageInfo.sender; // sender id
    let date = (new Date(messageInfo.sentAt)).toUTCString(); // utc send time

    // insert word message
    if (messageInfo.message) {
        message.innerText = messageInfo.message;
    }

    // setup sender information in container
    setSenderInfo(sender, userName, userimage);

    // setup send time
    sendTime.innerText = date.substr(0, date.length - 7);

    // set up message appearnce
    setUpMessageStyle(messageInfo, messageContainer, message, sender, userName, userimage, sendTime);

    // setup edit time
    setUpEditTime(messageInfo, messageContainer, sender)

    // view sender profile event
    userName.addEventListener("click", () => {
        window.location.hash = `profile=${messageInfo.sender}`;
    });

    // insert and display into container
    messageContainer.appendChild(userimage);
    messageContainer.appendChild(message);
    messageContainer.appendChild(sendTime);
    messageContainer.appendChild(userName);

    // response option container setup
    setUpResponse(messageInfo, messageContainer, sender, message, pinned);

    // setup image message
    setMessageImage(messageInfo, messageContainer, message, image, showEnlarge);

    // display all information into chat
    insertMessageToContainer(channelChatContainer, messageContainer, getAllNewMessages, oldMessage, node);
};

// get message in channel
const getMessage = (startIndex, channelId, oldMessage=false, getAllNewMessages=false, node=null) => {
    sendRequest("GET", `/message/${channelId}?start=${startIndex}`, userToken)
    .then(response => {
        // get store message of current channel in to localstorage
        let data = localStorage.getItem(channelId);
        if (data && data.indexOf(JSON.stringify(response.messages)) === -1) {
            // append not stored message to previous store message
            data = JSON.parse(data);
            data.messages = data.messages.concat(response.messages);
        }
        else {
            data = response;
        }

        // store current channel message
        localStorage.setItem(channelId, JSON.stringify(data));

        // channel chat container
        let channelChat = document.querySelector(`div[channelid="${channelId}"]`);
        let length = response.messages.length; // number of messages
        let preHeight = channelChat.scrollHeight; // current screen postion
        
        if (oldMessage || getAllNewMessages) {
            for (let i = 0; i < length; ++i) {
                let chat = document.querySelector(`div[channelid="${channelId}"] > div[messageid="${response.messages[i].id}"]`);

                // display not read message at the last
                if (chat === null && getAllNewMessages) {
                    displayMessage(channelChat, response.messages[i], oldMessage, getAllNewMessages, node);

                    // if the last message is not display yet, request and display 
                    // next messages which could not be display as well
                    if (i === length - 1 && navigator.onLine) {
                        getMessage(startIndex + 25, channelId, oldMessage, getAllNewMessages, node);
                    }
                }
                else if (!getAllNewMessages) {
                    // display old message at the front
                    displayMessage(channelChat, response.messages[i], oldMessage);
                }
            }
        }
        else {
            // display all message in order at the end the container
            for (let i = length - 1; i >= 0; --i) {
                let chat = document.querySelector(`div[channelid="${channelId}"] div[messageid="${response.messages[i].id}"]`);
                if (chat === null) {
                    displayMessage(channelChat, response.messages[i]);
                }
            }
        }

        if (oldMessage) {
            // remove loading logo
            loading.removeAttribute("style");

            // stay current screen position
            channelChat.scrollTop = channelChat.scrollHeight - preHeight;
        }
        else {
            // screen display latest message
            channelChat.scrollTop = channelChat.scrollHeight;
        }
    })
    .then(() => {
        // last view notification
        let lastView = document.querySelector(`div[channelid="${channelId}"] .lastView`);
        // chat container
        let channelChat = document.querySelector(`div[channelid="${channelId}"]`);
        
        // hide channel list side bar
        hideChannelList();

        // remove last view notification if there is not new message
        if (lastView && lastView === channelChat.lastChild) {
            lastView.remove();
        }
    })
    .catch(e => {
        // warning notification
        popUp(e.error);
    });
};

// send message in current channel
const sendMessage = () => {
    let message = userInput.value; // message
    let channelId = document.querySelector(".selected").id; // channel id

    // require request body
    let messageInfo = {
        "message": message
    };
    
    if (message.trim() === "") {
        // empty message warning
        popUp("Cannot Send Empty Message");
    }
    else {
        // post message
        sendRequest("POST", `/message/${channelId}`, userToken, null, messageInfo)
        .then(() => {
            // get message information
            sendRequest("GET", `/message/${channelId}?start=0`, userToken)
            .then(response => {
                // display message
                let channelChat = document.querySelector(`div[channelid="${channelId}"]`);
                displayMessage(channelChat, response.messages[0]);
                channelChat.scrollTop = channelChat.scrollHeight;

                // clear input
                userInput.value = "";
            })
        })
        .catch(e => {
            // warning notification
            popUp(e.error);
        })
    }
};

// response to current message
const responseToMessage = (message, ownMessage) => {
    let responseContainer = document.getElementById("responseContainer"); // response container
    let deleteMessage = document.getElementById("deleteMessage"); // delete button
    let editMessage = document.getElementById("editMessage"); // edit button
    let pinMessage = document.getElementById("pinMessage"); // pin button
    let unpinMessage = document.getElementById("unpinMessage"); // unpin button
    let emojis = document.querySelectorAll(".emojiReaction"); // emoji reaction button

    // own reaction to current message
    let ownReactions = new Set(message.getAttribute("react").split(" "));

    // display response container
    responseContainer.style.display = "block";
    
    if (ownMessage) {
        // enable own message response
        message.classList.add("ownMessageSelected");
        deleteMessage.style.display = "block";
        editMessage.style.display = "block";
    }
    else {
        // enable other message response
        message.classList.add("messageSelected");
        deleteMessage.removeAttribute("style");
        editMessage.removeAttribute("style");
    }

    // block user from other operation except response
    document.getElementById("chatWrap").style.display = "block";
    
    if (message.hasAttribute("pinned")) {
        // hide pinned button and show unpin button if message is pinned
        unpinMessage.style.display = "block";
        pinMessage.removeAttribute("style");
    }
    else {
        // hide pinned button and show unpin button if message is unpinned
        pinMessage.style.display = "block";
        unpinMessage.removeAttribute("style");
    }

    for (const emoji of emojis) {
        if (ownReactions.has(emoji.value)) {
            // own reaction emoji appearance
            emoji.classList.add("selectedEmoji");
        }
        else {
            // not reacted emoji appearance
            emoji.classList.remove("selectedEmoji");
        }
    }
};

// deselect response of selected message
const deselect = () => {
    const ownMessage = document.querySelector(".ownMessageSelected"); // own message selected
    const othersMessage = document.querySelector(".messageSelected"); // other message selected
    const chatWrap = document.getElementById("chatWrap"); // screen wrap

    // hide response and reaction container
    document.getElementById("responseContainer").removeAttribute("style");
    document.getElementById("reactUserContainer").removeAttribute("style");

    // remvoe own message selected appearance
    if (ownMessage) {
        ownMessage.classList.remove("ownMessageSelected");
    }

    // remvoe other message selected appearance
    if (othersMessage) {
        othersMessage.classList.remove("messageSelected");
    }

    // hide wrap
    chatWrap.removeAttribute("style");
};

// get all pinned messages
const getAllPinMessage = (container, channelId, index) => {
    sendRequest("GET", `/message/${channelId}?start=${index}`, userToken)
    .then(response => {
        // display all pinned messages
        for (const messageInfo of response.messages) {
            if (messageInfo.pinned) {
                displayMessage(container, messageInfo, false, false, null, true);
            }
        }

        // get all previous pinned messages
        if (response.messages.length) {
            getAllPinMessage(container, channelId, index + 25);
        }
    })
    .catch(() => {
        // warning notification
        popUp("Time Out");
    })
};

// remvoe user edit input
const removeEditInput = () => {
    let messageNode = document.querySelector("div[editing]"); // edited message
    let userInput = document.getElementById("userInput"); // user input area
    let sendBtn = document.getElementById("sendBtn"); // send message button

    // edit and cancel buttons container
    let editMessageBtnContatiner = document.getElementById("editMessageBtnContatiner");

    // clear all input value
    userInput.value = "";

    // display input area
    userInput.removeAttribute("style");
    sendBtn.removeAttribute("style");

    // hide edit area
    editInput.removeAttribute("style");
    editMessageBtnContatiner.removeAttribute("style");
    messageNode.removeAttribute("editing");
}

// send edit message
const sendEditMessage = () => {
    let messageNode = document.querySelector("div[editing]"); // edit message node
    let message = messageNode.innerText; // origin message
    let editMessage = editInput.value; // edited message
    
    // warn if message is not edited
    if (message === editMessage) {
        popUp("Message Is Not Edited");
        return;
    }

    let messageContainer = messageNode.parentElement; // message information container
    let channelId =document.querySelector(".selected").id; // selected channel list item
    let messageId = messageContainer.getAttribute("messageid"); // message id

    // required request body
    let body = {
        "message": editMessage
    };

    sendRequest("PUT", `/message/${channelId}/${messageId}`, userToken, null, body)
    .then(() => {
        let index = getNodeIndex(messageNode); // index of current message node
        messageNode.innerText = editMessage; // change message to edited message

        // get edited message information
        sendRequest("GET", `/message/${channelId}?start=${index}`, userToken)
        .then(response => {
            // setup edited time
            let editTime = (new Date(response.messages[0].editedAt)).toUTCString();
            let editTimeContainer = document.querySelector(`div[channelid="${channelId}"] div[messageid="${messageId}"] .editedTime`) || document.createElement("div");

            // insert edited time
            editTime = editTime.substr(0, editTime.length - 7);
            editTimeContainer.innerText = `edited at: ${editTime}`;
            editTimeContainer.classList.add("editedTime");
            editTimeContainer.classList.add("ownEditeTime");
            messageContainer.appendChild(editTimeContainer);
            
            // if edited message is image, remove enlarge button
            let enlarge = messageContainer.querySelector(".enlarge");
            if (enlarge) {
                enlarge.remove();
            }

            // remove edit area
            removeEditInput();
        });
    })
    .catch(e => {
        popUp(e.error);
    });
};

// remove message reaction
const removeReaction = () => {
    let messageNode = document.querySelector(".ownMessageSelected") || document.querySelector(".messageSelected"); // message node
    let channelId =document.querySelector(".selected").id; // channel id
    let messageId = messageNode.parentNode.getAttribute("messageid"); // message id

    // required request body
    let body = {
        "react": reaction.value
    };

    sendRequest("POST", `/message/unreact/${channelId}/${messageId}`, userToken, null, body)
    .then(() => {
        // deselect current message
        deselect();

        // toggle reaction event
        reaction.removeEventListener("click", removeReaction);
        reaction.addEventListener("click", addReaction);
    })
    .catch(e => {
        // warn notification
        popUp(e.error);
    })
};

// receive all new messages
const receiveNewMessages = () => {
    let channels = document.querySelectorAll("li[joined]"); // all joined channel
    let queue = new Array(); // require join channels information request array
    let channelIds = new Array(); // channel id array
    let numChannel = channels.length; // channel number

    // offline
    if (!navigator.onLine) {
        return;
    }
    
    // get all channels information
    for (let i = 0; i < numChannel; ++i) {
        queue.push(sendRequest("GET", `/message/${channels[i].id}?start=0`, userToken));
        channelIds.push(channels[i].id);
    }

    Promise.all(queue)
    .then(responses => {
        let length = responses.length;

        for (let i = 0; i < length; ++i) {
            let container = document.querySelector(`div[channelid="${channelIds[i]}"]`) // channel chat container
            let lastChat = container.lastElementChild; // current latest message

            if (lastChat) {
                // compare with latest message to current latest message
                let messageId = lastChat.getAttribute("messageid");
                let newMessageId = responses[i].messages.length ? parseInt(responses[i].messages[0].id) : -1;
                let channel = document.getElementById(`${channelIds[i]}`);

                if (messageId && newMessageId > messageId) {
                    if (channel.classList.contains("selected")) {
                        // display latest message if user is viewing current channel
                        pushMessage(channelIds[i], container, responses[i].messages[0]);
                    }
                    else {
                        // push notification if latest message is not displayed
                        notice(channelIds[i]);
                    }
                }
            }
        }
    })
    .catch(e => {
        // warning notification
        popUp(e.error);
    });
};

// display latest message
const pushMessage = (channelId, container, message) => {
    // store latest message in local storage
    let data = JSON.parse(localStorage.getItem(channelId));
    data.messages.unshift(message);
    localStorage.setItem(channelId, JSON.stringify(data));

    // display message
    displayMessage(container, message);
    container.scrollTop = container.scrollHeight;
};

// show notification at channel list item
const notice = (id) => {
    let channel = document.getElementById(id); // channel list item

    // display notification
    if (!channel.hasAttribute("new")) {
        let newMessageNotice = document.createElement("div");
        let channelList = channel.parentElement;

        // set notification appearance
        newMessageNotice.innerText = "new";
        newMessageNotice.classList.add("newMessage");
        channel.append(newMessageNotice);
        channel.setAttribute("new", true);
        channelList.insertBefore(channel, channelList.firstChild);
    }
}

// get offline messages
const getMessageOffline = (channelId) => {
    // read stored channle messages
    let data = JSON.parse(localStorage.getItem(channelId)); // stored messages
    let length = data.messages.length; // number of store messages
    // chat container
    let channelChatContainer = document.querySelector(`div[channelid="${channelId}"]`);

    // display all messages
    for (let i = length - 1; i >= 0; --i) {
        displayMessageOffline(channelChatContainer, data.messages[i]);
    }
    channelChatContainer.scrollTop = channelChatContainer.scrollHeight;
}

// set user inforamtio in chat offline
const setUserInfoOffline = (sender, userName, userimage) => {
    let userInfo = JSON.parse(localStorage.getItem(sender)); // get stored information

    // setup user information
    if (userInfo.image) {
        userimage.classList.remove("defaultImage");
        userimage.src = userInfo.image;
    }
    userName.innerText = userInfo.name;
}

// get offline images
const getAllOfflineImage = (channelId, isPinned=false) => {
    let messagesInfo = JSON.parse(localStorage.getItem(channelId)); // get stored messages

    if (messagesInfo.messages.length === 0) {
        return;
    }

    for (const message of messagesInfo.messages) {
        if (message.image) {
            if (isPinned && message.pinned) {
                // store pinned images
                pinnedImages.push(message.image);
                messageIds.push(message.id);
            }
            else if (!isPinned) {
                // store images
                images.push(message.image);
                messageIds.push(message.id);
            }
        }
    }
};

// enlarge image offline
const showEnlargeOffline = (id) => {
    let enlargeImage = document.getElementById("enlargeImage"); // enlarge image container
    let pinned = document.getElementById("pinnedMessage"); // pinned message container
    let channelId = document.querySelector(".selected").id; // channel id

    images = new Array();  // initlize images array
    pinnedImages = new Array(); // initlize pinned images array
    messageIds = new Array(); // initlize image index array

    if (pinned.hasAttribute("style")) {
        // display pinned image
        slideImage.setAttribute("pinned", true);
        getAllOfflineImage(channelId, true)
        enlargeImage.style.display = "block";
        showNextEnlarge(pinnedImages, id);
    }
    else {
        // display image
        slideImage.removeAttribute("pinned");
        getAllOfflineImage(channelId)
        enlargeImage.style.display = "block";
        showNextEnlarge(images, id);
    }
};

// display message offline
const displayMessageOffline = (channelChatContainer, messageInfo, pinned=false) => {
    let messageContainer = document.createElement("div"); // message information container
    let message = document.createElement("div"); // message container
    let image = document.createElement("img"); // image message container
    let userName = document.createElement("div"); // user name container
    let sendTime = document.createElement("div"); // send time container
    let userimage = document.createElement("img"); // user profile image container
    let sender = messageInfo.sender; // sender id
    let date = (new Date(messageInfo.sentAt)).toUTCString(); // utc send time

    // insert word message
    if (messageInfo.message) {
        message.innerText = messageInfo.message;
    }

    // setup sender information in container
    setUserInfoOffline(sender, userName, userimage);

    // setup send time
    sendTime.innerText = date.substr(0, date.length - 7);

    // set up message appearnce
    setUpMessageStyle(messageInfo, messageContainer, message, sender, userName, userimage, sendTime);

    // response option container setup
    setUpResponse(messageInfo, messageContainer, sender, message, pinned);

    // setup edit time
    setUpEditTime(messageInfo, messageContainer, sender)
    
    userName.addEventListener("click", () => viewUserProfile(messageInfo.sender));

    messageContainer.appendChild(userimage);
    messageContainer.appendChild(message);
    messageContainer.appendChild(sendTime);
    messageContainer.appendChild(userName);

    // setup image message
    setMessageImage(messageInfo, messageContainer, message, image, showEnlargeOffline);

    // display all information into chat
    insertMessageToContainer(channelChatContainer, messageContainer, false, false, null);
};

const editSendImage = (channelId, body) => {
    // sned image as edited message

    let messageContainer = document.querySelector("div[editing]"); //message container
    let editedMessageNode = messageContainer.parentElement; // chats container
    let messageId = editedMessageNode.getAttribute("messageid"); // message id

    // update message with image
    sendRequest("PUT", `/message/${channelId}/${messageId}`, userToken, null, body)
    .then(() => {
        let index = getNodeIndex(messageContainer); // index of current message
        let image = document.createElement("img"); // edited image container
        messageContainer.innerText = ""; // empty message

        sendRequest("GET", `/message/${channelId}?start=${index}`, userToken)
        .then(response => {
            // transform time into utc time string
            let editTime = (new Date(response.messages[0].editedAt)).toUTCString();
            let editTimeContainer = editedMessageNode.querySelector(".editedTime") || document.createElement("div");

            // set time in time container
            editTime = editTime.substr(0, editTime.length - 7);
            editTimeContainer.innerText = `edited at: ${editTime}`;
            editTimeContainer.classList.add("editedTime");
            editTimeContainer.classList.add("ownEditeTime");
            editedMessageNode.appendChild(editTimeContainer);

            // setup image
            setMessageImage(response.messages[0], editedMessageNode, messageContainer, image, showEnlarge);

            // remove edited area
            removeEditInput();

            channelChat.scrollTop = channelChat.scrollHeight;
        })
    })
    .catch(() => {
        popUp("Time Out")
    })
}

// hide emoji shortcut
document.getElementById("emojiMessageBack").addEventListener("click", () => {
    emojisContainer.removeAttribute("style");
});

// display previous image
document.getElementById("previous").addEventListener("click", () => {
    let pinned = document.getElementById("pinnedMessage"); // pinned message container
    if (imageIndex < messageIds.length - 1) {
        if (pinned.hasAttribute("style")) {
            // display previous pinned image
            slideImage.src = pinnedImages[++imageIndex];
        }
        else {
            // display previous image
            slideImage.src = images[++imageIndex];
        }
    }
    else {
        // end of images
        popUp("This is the first image", false);
    }
    
});

// display next image
document.getElementById("next").addEventListener("click", () => {
    let pinned = document.getElementById("pinnedMessage"); // pinned message container
    if (imageIndex > 0) {
        if (pinned.hasAttribute("style")) {
            // display next pinned image
            slideImage.src = pinnedImages[--imageIndex];
        }
        else {
            // display next image
            slideImage.src = images[--imageIndex];
        }
    }
    else {
        // end of images
        popUp("This is the last image", false);
    }
    
});

// stop viewing enlarge image event
document.getElementById("enlargeImage_back").addEventListener("click", () => {
    // hide enlarge image container
    let enlargeImage = document.getElementById("enlargeImage");
    enlargeImage.removeAttribute("style");
})

// display emoji shortcut
document.getElementById("sendEmoji").addEventListener("click", () => {
    emojisContainer.style.display = "block";
})

// send message event
sendBtn.addEventListener("click", sendMessage);

// input keydown event
userInput.addEventListener("keydown", event => {
    // send message if previous key is not control
    if (preKeyDown !== "Control" && event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
    
    // store curretn key
    preKeyDown = event.key;
});

// send image in channel
sendimageMessage.addEventListener("change", () => {
    let channelId = document.querySelector(".selected").id; // channel id
    let channelChat = document.querySelector(`div[channelid="${channelId}"]`); // chats conatiner
    let editedMessage = document.getElementById("editInput"); // edited area
    let files = sendimageMessage.files; // images
    let length = files.length; // number of images
    
    for (let i = 0; i < length; ++i) {
        // limit image size
        // avoid using too much local storage
        if (files[i].size > 5120) {
            popUp("Cannot Upload Image Over 5kb");
            return;
        }

        try {
            // transform image to valid format
            fileToDataUrl(files[i])
            .then(img => {
                let body = {
                    "image": img
                }

                if (!editedMessage.style.display) {
                    // not edited previous message
                    sendRequest("POST", `/message/${channelId}`, userToken, null, body)
                    .then(() => {
                        sendRequest("GET", `/message/${channelId}?start=0`, userToken)
                        .then(response => {
                            // display image message
                            displayMessage(channelChat, response.messages[0]);
                            channelChat.scrollTop = channelChat.scrollHeight;
                        })
                    })
                    .catch(() => {
                        popUp("Time Out")
                    })
                }
                else {
                    editSendImage(channelId, body);
                }
            })
            .catch(e => {
                popUp(e.error);
            })
        }
        catch (e) {
            // wrong image format
            popUp(e.message);
        }
    }
});

// fake send image button
disguiseSendImageMessage.addEventListener("click", () => {
    if (sendimageMessage) {
        sendimageMessage.click();
    }
}, false);

// wrap click event, remvoe wrap
document.getElementById("chatWrap").addEventListener("click", deselect);

// delete message event
document.getElementById("deleteMessage").addEventListener("click", () => {
    let channelId = document.querySelector(".selected").id; // cahnnel id
    let message = document.querySelector(".ownMessageSelected") || document.querySelector(".messageSelected"); // message container
    let messageId = message.parentNode.getAttribute("messageid"); // chats container

    sendRequest("DELETE", `/message/${channelId}/${messageId}`, userToken)
    .then(response => {
        // delete message in chat
        message.parentNode.remove();
        deselect();
        popUp("Successfull Delete Message", false);
    })
    .catch(e => {
        // warning notification
        popUp(e.error);
    })
});

// edit message event
document.getElementById("editMessage").addEventListener("click", () => {
    let messageNode = document.querySelector(".ownMessageSelected") || document.querySelector(".messageSelected"); // message node
    let message = messageNode.innerText; // message
    let userInput = document.getElementById("userInput"); // user input area
    let sendBtn = document.getElementById("sendBtn"); // send message button

    // edit and cancel buttons container
    let editMessageBtnContatiner = document.getElementById("editMessageBtnContatiner");

    // hide input area
    userInput.style.display = "none";
    sendBtn.style.display = "none";
    editInput.style.display = "block";
    editMessageBtnContatiner.style.display = "block";

    // display edit area
    editInput.value = message;
    messageNode.setAttribute("editing", true);
    deselect();
});

// pin message event
document.getElementById("pinMessage").addEventListener("click", () => {
    let messageNode = document.querySelector(".ownMessageSelected") || document.querySelector(".messageSelected"); // edited message
    let messageId = messageNode.parentNode.getAttribute("messageId"); // message id
    let channelId = document.querySelector(".selected").id; // channel id

    sendRequest("POST", `/message/pin/${channelId}/${messageId}`, userToken)
    .then(() => {
        // pin message
        messageNode.setAttribute("pinned", true);
        deselect();
        popUp("Successful Pin Message", false);
    })
    .catch(e => {
        // warning notification
        popUp(e.error);
    })
});

// unpin message event
document.getElementById("unpinMessage").addEventListener("click", () => {
    let messageNode = document.querySelector(".ownMessageSelected") || document.querySelector(".messageSelected"); // edited message
    let messageId = messageNode.parentNode.getAttribute("messageId"); // message id
    let channelId = document.querySelector(".selected").id; // channel id

    sendRequest("POST", `/message/unpin/${channelId}/${messageId}`, userToken)
    .then(() => {
        // unpin message
        messageNode.removeAttribute("pinned");
        deselect();
        popUp("Successful Unpin Message", false);
    })
    .catch(e => {
        // warning notification
        popUp(e.error);
    })
});

// get all pin message event
document.getElementById("getPinnedMessageBtn").addEventListener("click", () => {
    // pinned message information container
    let pinnedMessagesContainer = document.getElementById("pinnedMessage");
    // pin message container
    let infoContainer = document.querySelector("#pinnedMessage > div:last-child");
    let container = document.createElement("div"); // new container
    let channel = document.querySelector(".selected"); // viewed channel

    // remove previous other channel pin message
    if (infoContainer.childElementCount === 2) {
        infoContainer.removeChild(infoContainer.lastChild);
    }
    
    // display pined message
    infoContainer.appendChild(container);
    container.setAttribute("id", "pinnedMessages");
    pinnedMessagesContainer.style.display = "block";
    getAllPinMessage(container, channel.id, 0);
});

// quit viewing pinned message
document.getElementById("pinnedMessage_back").addEventListener("click", () => {
    document.getElementById("pinnedMessage").removeAttribute("style");
});

// sort pinned message
pinnedMessageSort.addEventListener("change", () => {
    // pinned messages information container
    let messagesContainer = document.getElementById("pinnedMessages");
    // all pinned messages
    let pinnedMessages = messagesContainer.querySelectorAll("#pinnedMessages > div");
    // pinned messages container
    let messageContainer = messagesContainer.parentNode;
    let newContainer = document.createElement("div"); // new message container
    let length = pinnedMessages.length; // number of pinned messages

    // reverse display pinned messages
    newContainer.id = messagesContainer.id;
    for (let i = length - 1; i >= 0; --i) {
        newContainer.appendChild(pinnedMessages[i]);
    }
    messagesContainer.remove();
    messageContainer.appendChild(newContainer);
})

// send edit messages event
document.getElementById("editBtn").addEventListener("click", sendEditMessage);

// edited input keydown event
editInput.addEventListener("keydown", event => {
    // send message if previous key is not control
    if (preEditKey !== "Control" && event.key === "Enter") {
        event.preventDefault();
        sendEditMessage();
    }

    // store curretn key
    preEditKey = event.key;
});

// quit edit mode event
document.getElementById("cancelBtn").addEventListener("click", removeEditInput);

for (const reaction of reactions) {
    // add emoji reactions button click event
    reaction.addEventListener("click", () => {
        let messageNode = document.querySelector(".ownMessageSelected") || document.querySelector(".messageSelected"); // selected message
        let channelId =document.querySelector(".selected").id; // channel id
        let messageId = messageNode.parentNode.getAttribute("messageid"); // message id
        
        // required request body
        let body = {
            "react": reaction.value
        };

        // setup view all reactions button
        let react = document.querySelector(`.getUserReactions[messageid="${messageId}"] `)
                    || document.createElement("button");

        // number of reaction
        let count = react.hasAttribute("count") ? parseInt(react.getAttribute("count")) : 0;

        // set react button appearance
        react.setAttribute("messageid", messageId);
        react.classList.add("getUserReactions");
        
        if (reaction.classList.contains("selectedEmoji")) {
            // unreact if current emoji is already react
            sendRequest("POST", `/message/unreact/${channelId}/${messageId}`, userToken, null, body)
            .then(() => {
                let ownReaction = messageNode.getAttribute("react").split(" "); // own reactions
                let index = ownReaction.indexOf(reaction.value); // index of current reaction

                // remove current reaction from own reactions
                ownReaction.splice(index, 1);
                messageNode.setAttribute("react", ownReaction.join(" "));

                // setup reaction after unreact
                if (count > 1) {
                    react.setAttribute("count", count - 1);
                }
                else {
                    react.remove();
                }
                
                deselect();
            })
        }
        else {
            // react if current emoji is unreact
            sendRequest("POST", `/message/react/${channelId}/${messageId}`, userToken, null, body)
            .then(() => {
                // own reactions
                let ownReaction = (messageNode.getAttribute("react") || "") +
                    ` ${reaction.value}`;
                
                // setup message reaction
                messageNode.setAttribute("react", ownReaction);

                if (count === 0) {
                    // if no reaction to this message before
                    // add reaction logo beside message
                    let messageContainer = messageNode.parentNode;
                    react = document.createElement("button");
                    react.innerText = String.fromCodePoint(128512);
                    react.classList.add("getUserReactions");
                    react.addEventListener("click", () => getReactUser(react));
                    react.setAttribute("messageid", messageId);
                    messageContainer.appendChild(react);
                }
                react.setAttribute("count", count + 1);
                deselect();
            })
        }
    });
}

export default getMessage;
export { displayMessage, receiveNewMessages, getMessageOffline };