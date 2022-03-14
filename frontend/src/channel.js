import { sendRequest, popUp, removeAllChild, userToken, userId } from "./main.js";
import getMessage from "./chat.js";
import { getMessageOffline } from "./chat.js";

// view all channels buttons
const getChannelBtns = document.getElementsByClassName("getChannelBtn");
// channel information ame container
const channelInfoHeader = document.querySelector("#channelInfo h3");
// channel description container
const channelDescription = document.getElementById("description");

const channelNav = document.getElementById("channelNav"); // channel nvaigation
const chatWrap = document.getElementById("chatWrap"); // screen wrap
const createChannel = document.getElementById("channelInfo_create"); // create channel button

const creator = document.getElementById("creator"); // channel creator container
const createAt = document.getElementById("createAt"); // create time container
const channelUpdate = document.getElementById("channelInfo_update"); // update channel button
const leaveChannel = document.getElementById("leaveChannel"); // leave channel button
const newchannelName = document.getElementById("newChannelName"); // new channel name input area
const privateCheck = document.getElementById("private"); // private check box
const channelInfoBox = document.getElementById("channelInfo"); // channel information container
const channelName = document.getElementById("channelName"); // channel name container
const userNavs = document.querySelectorAll(".userNav"); // user navigator
const searchUser = document.getElementById("searchUser"); // search user input area
const welcomePage = document.getElementById("welcome"); // welcome page
const responseContainer = document.getElementById("responseContainer"); // response conatiner
let inviteContiner = document.getElementById("inviteContiner");

// display all channel
const showChannelList = () => {
    channelNav.style.left = 0;
    chatWrap.style.display = "block";
    chatWrap.style.animation = "block 0.2s linear 1 fowards";
};

// hide channel list
const hideChannelList = () => {
    chatWrap.removeAttribute("style");
    channelNav.style.left = null;
};

// setup user information
const setUpUser = (userInfo) => {
    let userImage = document.getElementById("loginUserImage"); // user image

    // setup user information
    document.getElementById("userName").innerText = userInfo.name;
    if (userInfo.image) {
        userImage.src = userInfo.image;
    }
    else {
        userImage.classList.add("defaultImage");
    }
}

// communication with server and initilize web
const communication = () => {
    return new Promise((resovle, reject) => {
        // get login user information
        sendRequest("GET", `/user/${userId}`, userToken)
        .then(userInfo => {
            localStorage.setItem(userId, JSON.stringify(userInfo));
            setUpUser(userInfo);

            // get all public and joined private channel information
            sendRequest("GET", "/channel", userToken)
            .then((responses) => {
                localStorage.setItem("channels", JSON.stringify(responses.channels));
                const channelList = document.getElementById("channelList");
                for (const channel of responses.channels) {
                    let inChannel = channel.members.indexOf(userId) !== -1;
                    if (!channel.private || inChannel) {
                        // show channel
                        let channelNode = showChannel(channel.name, channel.id, channel.private, inChannel);
                        channelList.appendChild(channelNode);
                    }
                }
                resovle();
            });
        })
        .catch(e => {
            reject(e);
        })
    });
}

// scroll event handler, get old message
const scrollEventHandler = (chat) => {
    if (chat.scrollTop === 0) {
        // get old message
        let channelId = chat.getAttribute("channelid"); // channel id
        let nextIndex = chat.childElementCount; // next set of message index

        if (navigator.onLine) {
            // load and get old messages
            loading.style.display = "block";
            getMessage(nextIndex, channelId, true);
        }
    }
};

// hide previous channel and display selected channel
const baseChannelListClickHandler = (chatContainer) => {
    let lastChannel = document.querySelector(".display");
    if (lastChannel) {
        lastChannel.classList.remove("display");
    }

    chatContainer.classList.add("display");
}

// show all channel in channel list
const showChannel = (name, channelId, isPrivate, inChannel) => {
    let chatContent = document.getElementById("chatContent"); // chat container
    let channelBox = document.createElement("li"); // channel list item in navigation
    let channelInfo = document.createElement("div"); // box storing channel information
    let channelPrivate = document.createElement("div"); // channel private property
    let channelChat = document.createElement("div"); // channel chat content container

    // setup channel information
    channelInfo.innerText = name;
    channelPrivate.innerText = isPrivate ? "private" : "public";
    channelPrivate.classList.add(isPrivate ? "private" : "public");

    // setup channel appearance
    channelBox.id = channelId;
    channelBox.classList.add("channel");
    channelBox.appendChild(channelInfo);
    channelBox.appendChild(channelPrivate);
    channelChat.setAttribute("channelId", channelId);
    channelChat.classList.add("chat");
    chatContent.append(channelChat);

    // create join channel button
    if (inChannel === false) {
        channelBox.appendChild(createJoinBtn(channelId));
    }
    else {
        channelBox.setAttribute("joined", true);
        getMessage(0, channelId);
    }
    
    if (isPrivate) {
        channelBox.setAttribute("private", true);
    }

    // add scroll event
    channelChat.addEventListener("scroll", () => {
        scrollEventHandler(channelChat);
    });

    // add click event
    channelBox.addEventListener("click", () => {
        // selected message node
        const messageNode = document.querySelector(".ownMessageSelected") ||
            document.querySelector(".messageSelected");
        // pinned message container
        const pinnedMessage = document.getElementById("pinnedMessage");
        // box storing channel information
        const channelInfo = document.getElementById("channelInfo");
        // container display profile
        const profileContainer = document.getElementById("profileContainer");
        // reaction container
        const reactUserContainer = document.getElementById("reactUserContainer");
        const enlargeImage = document.getElementById("enlargeImage"); // enlarge image container
        const inviteContiner = document.getElementById("inviteContiner"); // invite container

        // setup routing
        window.location.hash = `channel=${channelId}`;
        welcomePage.style.display = "none";

        // remove selected message appearance
        if (messageNode) {
            messageNode.classList.remove("ownMessageSelected");
            messageNode.classList.remove("messageSelected");
        }

        // hide not related container
        chatWrap.removeAttribute("style");
        pinnedMessage.removeAttribute("style");
        enlargeImage.removeAttribute("style");
        channelInfo.removeAttribute("style");
        profileContainer.removeAttribute("style");
        inviteContiner.removeAttribute("style");
        responseContainer.removeAttribute("style");
        reactUserContainer.removeAttribute("style");
    });

    return channelBox;
}

// insert channel in channel list
const insertChannel = (name, id, isPrivate) => {
    const channelList = document.getElementById("channelList");
    channelList.insertBefore(showChannel(name, id, isPrivate), channelList.firstChild);
};

// create a join button for channel
const createJoinBtn = (channelId) => {
    let button = document.createElement("button");

    // setup button
    button.innerText = "Join";
    button.classList.add("joinBtn");

    button.addEventListener("click", (event) => {
        event.stopPropagation();
        sendRequest("POST", `/channel/${channelId}/join`, userToken)
        .then(() => {
            let channel = document.getElementById(channelId); // channel id
            let preSelected = document.querySelector(".selected"); // previous selected channel
            // chats container
            let chats = document.querySelector(`div[channelid="${channelId}"]`);

            // remove button and join channel
            channel.removeChild(button);
            channel.setAttribute("joined", true)

            // get and display messages
            getMessage(0, channelId);
            baseChannelListClickHandler(chats);
            welcomePage.removeAttribute("style");

            // select current channel
            if (preSelected) {
                preSelected.classList.remove("selected");
            }

            if (channel) {
                channel.classList.add("selected");
                channelName.innerText = document.querySelector(".selected div:first-child").innerText;
            }
            popUp("Successful Join Channel", false);
        })
        .catch(e => {
            if (e.error === "User is already a member of this channel") {
                button.remove();
            }
            popUp(e.error);
        })
    });
    return button;
}

// display user in user list
const displayUser = (users) => {
    const userList = document.getElementById("userList"); // user list
    let preAlphabet = ""; // previous group
    let alphabetNode = document.createElement("ol");

    // clear previous user list
    removeAllChild(userList);

    for (const user of users) {
        if (document.querySelector(`li[username="${user[0].name}"]`)) {
            continue;
        }
        // setup user information
        let userContainer = document.createElement("li");
        let label = document.createElement("label");
        let userImage = document.createElement("img");
        let userName = document.createElement("p");
        let checkBox = document.createElement("input");

        // setup user list item appearance
        userImage.classList.add("userImage");
        userImage.classList.add("imageBaseSetting");
        userImage.alt = "userImage";

        // setup user image
        if (user[0].image) {
            userImage.src = user[0].image;
        }
        else {
            userImage.classList.add("defaultImage");
        }

        // setup user name
        userName.innerText = user[0].name;

        // setup html checkbox
        checkBox.value = user[1];
        checkBox.type = "checkbox";
        checkBox.checked = false;

        // setup conatiner information
        userContainer.setAttribute("userName", user[0].name);
        userName.classList.add("userName");
        label.classList.add("user");

        // add all information into node
        label.appendChild(checkBox);
        label.appendChild(userImage);
        label.appendChild(userName);
        userContainer.appendChild(label);

        // sepearte user into group base on alphabetical order
        if (preAlphabet !== "#" && user[0].name[0].toUpperCase() !== preAlphabet) {
            let alphabet = document.createElement("li");
            alphabet.classList.add("alphabet");

            // add user into group
            if (preAlphabet !== "") {
                let userWrapContainer = document.createElement("li");
                userWrapContainer.id = preAlphabet;
                userWrapContainer.appendChild(alphabetNode);
                userList.appendChild(userWrapContainer);
                alphabetNode = document.createElement("ol");
            }

            // setup current group
            if (preAlphabet !== "Z") {
                preAlphabet = user[0].name[0].toUpperCase();
                alphabet.innerText = preAlphabet;
            }
            else {
                alphabet.id = "#";
                alphabet.innerText = "#";
                preAlphabet = "#";
            }
            alphabetNode.appendChild(alphabet);
        }
        alphabetNode.appendChild(userContainer);
    }

    // add last group into list
    if (preAlphabet !== "") {
        let userWrapContainer = document.createElement("li");
        userWrapContainer.id = preAlphabet;
        userWrapContainer.appendChild(alphabetNode);
        userList.appendChild(userWrapContainer);
    }
}

// get offline webpage
const offlineCommunicate = () => {
    let userInfo = JSON.parse(localStorage.getItem(userId)); // get user information
    let channelListInfo = JSON.parse(localStorage.getItem("channels")); // get channel list
    const channelList = document.getElementById("channelList"); // channel list container

    // setup user
    setUpUser(userInfo, userInfo);

    for (const channel of channelListInfo) {
        let inChannel = channel.members.indexOf(userId) !== -1;
        // insert joined channel
        if (!channel.private || inChannel) {
            let channelNode = showChannelOffline(channel.name, channel.id, channel.private, inChannel);
            channelList.appendChild(channelNode);
        }
    }
}

// 
const showChannelOffline = (name, channelId, isPrivate, inChannel) => {
    let chatContent = document.getElementById("chatContent");  // chat container
    let channelBox = document.createElement("li"); // channel list item in navigation
    let channelInfo = document.createElement("div"); // box storing channel information
    let channelPrivate = document.createElement("div"); // channel private property
    let channelChat = document.createElement("div"); // channel chat content container

    // setup channel information
    channelInfo.innerText = name;
    channelPrivate.innerText = isPrivate ? "private" : "public";
    channelPrivate.classList.add(isPrivate ? "private" : "public");

    // setup channel appearance
    channelBox.id = channelId;
    channelBox.classList.add("channel");
    channelBox.appendChild(channelInfo);
    channelBox.appendChild(channelPrivate);
    channelChat.setAttribute("channelId", channelId);
    channelChat.classList.add("chat");
    chatContent.append(channelChat);

    // create join channel button
    if (inChannel === false) {
        channelBox.appendChild(createJoinBtn(channelId));
    }
    else {
        channelBox.setAttribute("joined", true);
        getMessageOffline(channelId);
    }

    // add click event
    channelBox.addEventListener("click", () => {
        // chat container
        let chatContainer = document.querySelector(`div[channelid="${channelId}"]`);
        let preSelected = document.querySelector(".selected"); // previous selected channel

        // hide welcome page
        welcomePage.style.display = "none";

        // display current channel
        baseChannelListClickHandler(chatContainer);
        hideChannelList();

        if (preSelected) {
            preSelected.classList.remove("selected");
        }

        channelBox.classList.add("selected");
        channelName.innerText = document.querySelector(".selected div:first-child").innerText;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });

    return channelBox;
}

for (const getChannelBtn of getChannelBtns) {
    // add get channel button click event
    getChannelBtn.addEventListener("click", () => {
        let editedMessage = document.querySelector("div[editing]"); // edited message

        // remove edited status
        if (editedMessage) {
            editedMessage.removeAttribute("editing");
        }

        // show all channel
        showChannelList();
    });
}

// remove screen wrap event
chatWrap.addEventListener("click", hideChannelList);

// display create channel form
document.getElementById("channelInfoBtn").addEventListener("click", ()=> {
    hideChannelList()

    // setup and display channel inforamtion container
    channelInfoBox.style.display = "block";
    channelInfoHeader.innerText = "New Channel";
    newchannelName.value = "";
    channelDescription.value = "";
    
    privateCheck.checked = false;

    privateCheck.removeAttribute("disabled");
    createChannel.classList.remove("hidden");
    creator.classList.add("hidden");
    createAt.classList.add("hidden");
    channelUpdate.classList.add("hidden");
    leaveChannel.classList.add("hidden");
});

// quit viewing channel information
document.getElementById("channelInfo_back").addEventListener("click", () => {
    let selected = document.querySelector(".selected");
    channelInfoBox.removeAttribute("style");
    if (selected === null) {
        showChannelList();
    }
});

// create channel event
createChannel.addEventListener("click", () => {
    let name = newchannelName.value; // channel name
    let isPrivate = privateCheck.checked; // private setting
    let description = channelDescription.value; // channel description

    // required request body
    let channelInfo = {
        "name": name,
        "private": isPrivate,
        "description": description
    };
    
    if (name === "") {
        popUp("Cannot Set Empty Name");
        return;
    }

    sendRequest("POST", "/channel", userToken, null, channelInfo)
    .then(response => {
        let selected = document.querySelector(".selected"); // selected channel

        // display new created channel
        welcomePage.removeAttribute("style");
        insertChannel(name, response.channelId, isPrivate);
        channelInfoBox.removeAttribute("style");

        // chats container
        let chats = document.querySelector(`div[channelid="${response.channelId}"]`);
        
        if (selected) {
            selected.classList.remove("selected");
        }

        // select new created channel
        document.getElementById(`${response.channelId}`).classList.add("selected");
        channelName.innerText = name;
        baseChannelListClickHandler(chats);
    })
    .catch(() => {
        popUp("Time Out");
    })
});

// update channel event
channelUpdate.addEventListener("click", () => {
    let name = newchannelName.value; // new channel name
    let description = channelDescription.value; // new channel description
    let channelId = document.querySelector(".selected").id; // new channel id

    // required request body
    let channelInfo = {
        "name": name,
        "description": description
    };

    if (name === "") {
        popUp("Cannot Set Empty Channel Name");
        return;
    }
    
    sendRequest("PUT", `/channel/${channelId}`, userToken, null, channelInfo)
    .then(() => {
        // setup updated information
        document.querySelector(".selected div:first-child").innerText = name;
        channelName.innerText = name;
        channelInfoBox.removeAttribute("style");
    })
    .catch(e => {
        popUp(e.error);
    });
});

// get channel informatio event
document.getElementById("getChannelInfo").addEventListener("click", () => {
    let channelId = document.querySelector(".selected").id; // channel id

    sendRequest("GET", `/channel/${channelId}`, userToken)
    .then(response => {
        // transform create time into utc string
        let createTime = (new Date(response.createdAt)).toUTCString();

        // get and setup creator information
        sendRequest("GET", `/user/${response.creator}`, userToken)
        .then(response => {
            document.querySelector("#creator span").innerText = response.name;
        })
        .catch(e => {
            popUp(e.error);
        });

        // display channel information
        createChannel.classList.add("hidden");
        creator.classList.remove("hidden");
        createAt.classList.remove("hidden");

        if (response.members.indexOf(userId) !== -1) {
            // display update and leave button
            channelUpdate.classList.remove("hidden");
            leaveChannel.classList.remove("hidden");
        }
        else {
            // hide update and leave button
            channelUpdate.classList.add("hidden");
            leaveChannel.classList.add("hidden");
        }

        // display information
        channelInfoHeader.innerText = "Channel Details";
        newchannelName.value = response.name;
        privateCheck.checked = response.private;
        privateCheck.setAttribute("disabled", "disabled");
        channelDescription.value = response.description;
        document.querySelector("#createAt span").innerText = createTime.substr(0, createTime.length - 3);
        channelInfoBox.style.display = "block";
    })
    .catch(() => {
        popUp("Time Out");
    });
});

// leave channel event
leaveChannel.addEventListener("click", () =>{
    let channel = document.querySelector(".selected"); // selected channel

    sendRequest("POST", `/channel/${channel.id}/leave`, userToken)
    .then(() => {
        let chats = document.querySelector(`div[channelid="${channel.id}"]`); // chat container
        let chatsContainer = chats.parentElement; // all chats container

        // hide current channel
        channelInfoBox.removeAttribute("style");
        channel.classList.remove("selected");
        channel.removeAttribute("joined");

        // add join button
        channel.appendChild(createJoinBtn(channel.id))

        // remove channel chat
        chats.remove();
        if (channel.hasAttribute("private")) {
            channel.remove();
        }
        else {
            // add new empty chat container
            let newChats = document.createElement("div");
            newChats.setAttribute("channelid", channel.id);
            newChats.classList.add("chat");
            chatsContainer.append(newChats);
        }

        // display welcome page
        welcomePage.style.display = "block";
        popUp("Successful Leave Channel", false);
    })
    .catch(e => {
        popUp(e.error);
    });
});

// initlize page of invite other user event
document.getElementById("inviteBtn").addEventListener("click", () => {
    let users = document.querySelectorAll("#userList input"); // users list
    let channelId = document.querySelector(".selected").id; //  // channel id
    
    // initilize all users
    for (const user of users) {
        user.checked = false;
    }

    sendRequest("GET", `/channel/${channelId}`, userToken)
    .then(response => {
        // get all not invited user
        let channelMembers = response.members;

        sendRequest("GET", "/user", userToken)
        .then(response => {
            let promises = new Array();
            let notInvitedId = new Array();

            // get all user information
            for (const user of response.users) {
                if (channelMembers.indexOf(user.id) === -1) {
                    promises.push(sendRequest("GET", `/user/${user.id}`, userToken));
                    notInvitedId.push(user.id);
                }
            }
            response = null;
            
            Promise.all(promises)
            .then(responses => {
                responses = responses.map((userInfo, i) => [userInfo, notInvitedId[i]]);
                notInvitedId = null;

                // display all user in alphabetical order
                displayUser(responses.sort((a, b) => a[0].name.localeCompare(b[0].name)));

                // setup user navigation
                for (const userNav of userNavs) {
                    let userBox = document.getElementById(userNav.innerText);
                    if (userBox) {
                        userNav.classList.remove("notExist");
                    }
                    else {
                        userNav.classList.add("notExist");
                    }
                }
            })

            // display invite container
            inviteContiner.style.display = "block";
        })
    })
    .catch(() => {
        popUp("Time Out");
    });
});

// quite invite mode event
document.getElementById("inviteBack").addEventListener("click", () => {
    inviteContiner.removeAttribute("style");
});

// invite selected user event 
document.getElementById("inviteUser").addEventListener("click", () => {
    let users = document.querySelectorAll("#userList input"); // users list
    let invitePromises = new Array(); // invite requests
    let channelId = document.querySelector(".selected").id; // channel id

    // send invite requests for selected users
    for (const user of users) {
        if (user.checked) {
            let inviteBody = {
                "userId": parseInt(user.value)
            };

            invitePromises.push(sendRequest("POST", `/channel/${channelId}/invite`, userToken, null, inviteBody));
        }
    }

    Promise.allSettled(invitePromises)
    .then(() => {
        // hide invite page
        inviteContiner.removeAttribute("style");
        channelInfoBox.removeAttribute("style");
        popUp(`Successful Invite All Users`, false);
    })
    .catch(e => {
        popUp(e.error);
    })
});

// add utility to move to selected group of users
for (const userNav of userNavs) {
    userNav.addEventListener("click", () => {
        let userBox = document.getElementById(userNav.innerText); // get sepecific alphabet group

        // display that group
        if (userBox) {
            userBox.scrollIntoView();
        }
    });
}

// search user base on input name
searchUser.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        // search whether user in user list
        let user = document.querySelector(`li[userName="${searchUser.value}"]`);

        if (user) {
            // display user if user exist
            user.scrollIntoView();
        }
        else {
            popUp("Searched User Does Not Exist");
        }
        
    }
});

export default communication;
export { hideChannelList, offlineCommunicate, baseChannelListClickHandler };