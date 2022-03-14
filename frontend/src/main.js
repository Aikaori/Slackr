import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { offlineCommunicate, baseChannelListClickHandler } from './channel.js';
import { receiveNewMessages } from './chat.js';
import { hideChannelList } from './channel.js';
import getMessage from './chat.js';
import viewUserProfile from './user.js';
import communication from './channel.js';

const loginSubmit = document.getElementById("loginBox_submitBtn"); // login submit button
const registBtn = document.getElementById("loginBox_registerBtn"); // start register button
const loginEmail = document.getElementById("loginBox_email"); // login email account
const loginPassword = document.getElementById("loginBox_password"); // login password
const registerEmail = document.getElementById("registerBox_email"); // register email
const registerName = document.getElementById("registerBox_name"); // register name
const registerPass = document.getElementById("registerBox_password"); // register password
const registerConfirm = document.getElementById("registerBox_confirmPassword"); // register confirm password
const registSubmit = document.getElementById("registerBox_submit"); //register submit button
const registBack = document.getElementById("registerBox_back"); // stop register and back to login in button
const welcomePage = document.getElementById("welcome"); // welcome page with welcome information
const messageContainer = document.getElementById("messageContainer"); // system message container
const chatWrap = document.getElementById("chatWrap"); // area block user from operation
const getChannelBtns = document.getElementsByClassName("getChannelBtn"); // button to display all channels for small screen
const pattern = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/; // email pattern

let userToken = null; // user token for authorization and further operation
let userId = null; // user id for authorization and further operation
let setPoll = false; // flag of whether system set up poll for information notification
let intervalId = null; // poll id for future stop poll

// show system notification
const popUp = (message, warning = true) => {
    const msg = document.getElementById("msg");
    messageContainer.style.display = "flex";
    
    if (warning === true) {
        // error message
        msg.innerText = `Error: ${message}`;
    }
    else {
        // normal notification
        msg.innerText = message;
    }
};

// check user input for login
const checkLogin = (email, password) => {
    let hasEmail = true;
    let hasPassword = true;

    if (email.value === "") {
        // no email input response
        email.style.animation = "reminder 1s linear 3";
        email.style.backgroundColor = "red";
        hasEmail = false;
    }
    
    if (password.value === "") {
        // no password input response
        password.style.animation = "reminder 1s linear 3";
        password.style.backgroundColor = "red";
        hasPassword = false;
    }

    if (!hasEmail && !hasPassword) {
        // no both email and password are given notification
        popUp("Please enter email and password!")
    }
    else if (!hasEmail) {
        // no email notification
        popUp("Please enter email!")
    }
    else if (!hasPassword){
        // no password notification
        popUp("Please enter password!")
    }

    return hasEmail && hasPassword;
};

// check user input for register
const checkRegister = () => {
    let isValid = true;
    let isEmpty = false;


    if (!registerEmail.value.match(pattern)) {
        // wrong email format response
        registerEmail.style.animation = "reminder 1s linear 3";
        registerEmail.style.backgroundColor = "red";
        isValid = false;
    }

    if (registerEmail.value === "") {
        // no email input response
        registerEmail.style.animation = "reminder 1s linear 3";
        registerEmail.style.backgroundColor = "red";
        isEmpty = true;
    }

    if (registerName.value === "") {
        // no name input response
        registerName.style.animation = "reminder 1s linear 3";
        registerName.style.backgroundColor = "red";
        isEmpty = true;
    }
    
    if (registerPass.value === "") {
        // no password input response
        registerPass.style.animation = "reminder 1s linear 3";
        registerPass.style.backgroundColor = "red";
        isEmpty = true;
    }

    if (registerConfirm.value === "") {
        // no confirm password response
        registerConfirm.style.animation = "reminder 1s linear 3";
        registerConfirm.style.backgroundColor = "red";
        isEmpty = true;
    }

    if (isEmpty) {
        // all required information is not provided
        popUp("Must input all required information!");
    }
    else if (registerPass.value !== registerConfirm.value) {
        // two password not the same response
        popUp("Two input password must be consistent!");
        isValid = false;
    }

    return isValid && !isEmpty;
};

// login success setup
const loginSuccess = () => {
    const loginRegister = document.getElementById("loginRegister"); // login and register container
    const chatBox = document.getElementById("chatBox"); // chat area
    const channelNav = document.getElementById("channelNav"); // channel navigation
    const allInfoContainer = document.getElementById("allInfoContainer"); // container display information
    const welcome = document.getElementById("welcome"); // welcome page

    // clear login information and register information
    loginEmail.value = "";
    loginPassword.value = "";
    registerEmail.value = "";
    registerName.value = "";
    registerPass.value = "";
    registerConfirm.value = "";

    // display welcome page
    welcome.style.display = "block";

    // remove all login UI
    sky1.style.animation = "rotate 10s linear 1, loginSuccess 1s linear 1 forwards"
    sky2.style.animation = "rotate 7s linear 1, loginSuccess 1s linear 1 forwards"
    loginRegister.style.animation = "disappear 2s ease-out 1 forwards";

    // display chat UI
    chatBox.style.display = "block";
    chatBox.style.animation = "display 1s 0.5s linear 1 forwards";
    channelNav.style.display = "block";
    channelNav.style.animation = "display 1s 0.5s linear 1 forwards";
    allInfoContainer.style.zIndex = 1;
};

// send request with given information
const sendRequest = (method, address, token, userId, body) => {
    // setup request information
    const requestInfo = {
        method: method,
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(body) // command required body
    };

    // setup token for authorization
    if (token !== null) {
        requestInfo.headers.Authorization = `Bearer ${token}`;
    }

    // setup id for authorization
    if (userId !== null) {
        requestInfo.headers.userId = `${userId}`;
    }

    // set up asycn to send request with given information
    return new Promise((resolve, reject) => {
        fetch(`http://localhost:${BACKEND_PORT}${address}`, requestInfo)
        .then(response=> {
            if (response.status === 200) {
                // parse reponse into json and resolve
                resolve(response.json());
            }
            else {
                // parse reponse into json and reject
                response.json().then(data => reject(data));
            }
        })
        .catch(e => {
            // reject with  unexpected error
            reject(e);
        });
    });
};

// remove all child of node
const removeAllChild = (node) => {
    while (node.childElementCount !== 0) {
        node.removeChild(node.lastChild);
    }
};

// get current routing hash
const getHashUrl = () => {
    // get hash path and query
    let hash = location.hash.split("=");
    let path = hash[0].split("#")[1];
    let query = hash.length === 2 ? hash[1] : null;
    return {
        path,
        query
    };
}

// click event for channel list
const channelClickHandler = (channelId) => {
    let chatContainer = document.querySelector(`div[channelid="${channelId}"]`); // chat container

    // last view notification
    let lastView = chatContainer.querySelector(".lastView") || document.createElement("div");
    
    let channelBox = document.getElementById(channelId); // channel list item with given id
    let preSelected = document.querySelector(".selected"); // previous selected channel

    if (chatContainer) {
        // setup last view notification
        if (lastView.childElementCount === 0) {
            let line = document.createElement("span");
            line.innerText = "last viewed";
            line.classList.add("line");
            lastView.appendChild(line);
        }

        lastView.classList.add("lastView");
        chatContainer.appendChild(lastView); // insert last view at the end

        // remove new notification
        if (channelBox.hasAttribute("new")) {
            channelBox.removeAttribute("new");
            channelBox.removeChild(channelBox.lastChild);
        }

        // hide previous channel and display current channel
        baseChannelListClickHandler(chatContainer);

        if (navigator.onLine) {
            // get messages if online
            getMessage(0, channelId, false, true, chatContainer.lastChild);
        }
        else {
            // scroll screen to latest message if offline
            chatContainer.scrollTop = chatContainer.scrollHeight;
            lastView.remove();
        }

        // clear previous selected channel notification
        if (preSelected) {
            preSelected.classList.remove("selected");
        }

        // setup notification for selected
        if (channelBox) {
            channelBox.classList.add("selected");
            channelName.innerText = document.querySelector(".selected div:first-child").innerText;
        }
    }
};

// setup web for user first enter web page
const routingWebInit = () => {
    // get user information
    userId = parseInt(localStorage.getItem("userId"));
    userToken = localStorage.getItem("userToken");

    // clear previous localstorage
    localStorage.clear();

    // store user information
    localStorage.setItem("userId", userId);
    localStorage.setItem("userToken", userToken);

    loginSuccess();
    welcomePage.removeAttribute("style");
};

// hide all button that for display all channel list items
const largeWindowSize = () => {
    if (visualViewport.width > 600) {
        for (const getChannelBtn of getChannelBtns) {
            getChannelBtn.style.display = "none";
        }
    }
};

// close notification event
document.getElementById("closeMsg").addEventListener("click", () => {
    messageContainer.style.display = "none"; 
});

// check login email after user blur input area
loginEmail.addEventListener("blur", () => {
    if (!loginEmail.value.match(pattern)) {
        loginEmail.style.backgroundColor = "red";
    }
});

// clear email warning during user input
loginEmail.addEventListener("focus", (key) => {
    loginEmail.removeAttribute("style");
});

// clear password warning during user input
loginPassword.addEventListener("focus", () => {
    loginPassword.removeAttribute("style");
});

// submit email and password for login
loginSubmit.addEventListener("click", () => {
    if (checkLogin(loginEmail, loginPassword)) {
        // send request if all required information are in correct format
        const loginInfo = {
            "email": loginEmail.value,
            "password": loginPassword.value
        };

        // send request
        sendRequest("POST", "/auth/login", null, null, loginInfo)
        .then(data => {
            // setup token and id for future operation
            userToken = data.token;
            userId = data.userId;

            // clear past localstorage cache to keep space for current login
            localStorage.clear();

            // store id and token for routing for future login if user logout
            localStorage.setItem("userId", userId);
            localStorage.setItem("userToken", userToken);

            loginSuccess(); // login success setup
            communication(); // send request to server to initilize the web page

            // set up poll loop
            if (!setPoll) {
                intervalId = setInterval(receiveNewMessages, 2000);
                setPoll = true;
            }
        })
        .catch(e => {
            // login info incorrect
            popUp(e.error);
        });
    }
});

// start offline mode without internet
document.getElementById("offline").addEventListener("click", () => {
    // get user recognition for message setup
    userId = parseInt(localStorage.getItem("userId"));
    userToken = localStorage.getItem("userToken");

    loginSuccess(); // login success setup
    offlineCommunicate(); // initilize the web page in offline mode
});

// start register event
registBtn.addEventListener("click", () => {
    const loginBox = document.getElementById("loginBox"); // login form
    const registerBox = document.getElementById("registerBox"); // register form

    // clear already input login information
    loginEmail.value = "";
    loginPassword.value = "";

    // clear warning
    loginEmail.removeAttribute("style");
    loginPassword.removeAttribute("style");

    // hide login form
    loginBox.style.display = "none";

    // display register form
    registerBox.style.display = "grid";
    registerBox.style.animation = "switch 1s ease-in-out 1"
});


// check register email after user blur input area
registerEmail.addEventListener("blur", () => {
    if (!registerEmail.value.match(pattern)) {
        registerEmail.style.backgroundColor = "red";
        popUp("Please enter valid email address!");
    }
});

// clear email warning during user input
registerEmail.addEventListener("focus", () => {
    registerEmail.removeAttribute("style");
});

// check register name after user blur input area
registerName.addEventListener("blur", () => {
    let pattern = /^[a-zA-Z0-9_^!@#$%&*()+?-]+$/;
    if (!registerName.value.match(pattern)) {
        registerName.style.backgroundColor = "red";
    }
});

// clear name warning during user input
registerName.addEventListener("focus", () => {
    registerName.removeAttribute("style");
});

// check password name after user blur input area
registerPass.addEventListener("blur", () => {
    if (registerPass.value.length < 8 || registerPass.value.length > 12) {
        registerPass.style.backgroundColor = "red";
        popUp("Please enter 8-12 characters password!");
    }
});

// clear password warning during user input
registerPass.addEventListener("focus", () => {
    registerPass.removeAttribute("style");
})

// submit register information event for register
registSubmit.addEventListener("click", () => {
    if (checkRegister()) {
        // send request if all required information is valid
        const registInfo = {
            "email": registerEmail.value,
            "password": registerPass.value,
            "name": registerName.value
        };

        // send request
        sendRequest("POST", "/auth/register", null, null, registInfo)
        .then(data => {
            // setup token and id for future operation
            userToken = data.token;
            userId = data.userId;

            // clear past localstorage cache to keep space for current login
            localStorage.clear();

            // store id and token for routing for future login if user logout
            localStorage.setItem("userId", userId);
            localStorage.setItem("userToken", userToken);

            // login with register information
            loginSuccess(); // login success setup
            communication();  // send request to server to initilize the web page

            // set up poll loop
            if (!setPoll) {
                intervalId = setInterval(receiveNewMessages, 2000);
                setPoll = true;
            }
        })
        .catch(e => {
            // register info incorrect
            popUp(e.error);
        });
    }
});

// stop register and back to login event
registBack.addEventListener("click", () => {
    const loginBox = document.getElementById("loginBox"); // login form
    const registerBox = document.getElementById("registerBox"); // register form

    // clear already input register information
    registerEmail.value = "";
    registerName.value = "";
    registerPass.value = "";
    registerConfirm.value = "";

    // clear warning
    registerEmail.removeAttribute("style");
    registerName.removeAttribute("style");
    registerPass.removeAttribute("style");
    registerConfirm.removeAttribute("style");

    // display login form
    loginBox.style.display = "grid";
    loginBox.style.animation = "switch 1s ease-in-out 1";

    // hide register form
    registerBox.style.display = "none";
});

// login decoration components
let sky1 = document.createElement("div"); // top decrotation
let sky2 = document.createElement("div"); // top decrotation overlap
let body = document.body; // html body
let current = new Date().getHours(); // current time

// setup decoration components
sky1.setAttribute("id", "sky1");
sky2.setAttribute("id", "sky2");

// insert decoration
body.appendChild(sky1);
body.appendChild(sky2);

// setup decoration color base on current time
if (current > 19 || current < 7) {
    sky1.style.backgroundColor = "rgb(25, 25, 112)";
    sky2.style.backgroundColor = "rgb(25, 25, 112)";

    body.style.color = "white";
    body.style.backgroundColor = "rgb(0, 0, 139)";
}

let showPasswords = document.querySelectorAll(".showPass"); // show password button
let hidePasswords = document.querySelectorAll(".hidePass"); // hide password button
let passwords = document.querySelectorAll("input[type='password'"); // password area

// setup show password utility
for (let i = 0; i < showPasswords.length; ++i) {
    showPasswords[i].addEventListener("click", () => {
        let input = passwords[i];
        let hide = hidePasswords[i];

        // change password area type and hide show password button
        input.type = "text";
        showPasswords[i].style.display = "none";

        // display hide password button
        hide.style.display = "block";
    });
}

// setup hide password utility
for (let i = 0; i < hidePasswords.length; ++i) {
    hidePasswords[i].addEventListener("click", () => {
        let input = passwords[i];
        let show = showPasswords[i];

        // change password area type and hide hide password button
        input.type = "password";
        hidePasswords[i].removeAttribute("style");

        // display show password button
        show.removeAttribute("style");
    });
}

// logout current user
document.getElementById("logoutBtn").addEventListener("click", () => {
    sendRequest("POST", "/auth/logout", userToken)
    .then(() => {
        const loginRegister = document.getElementById("loginRegister"); // login and register container
        const chatBox = document.getElementById("chatBox"); // chat area
        const channelNav = document.getElementById("channelNav"); // channel navigation
        const chatWrap = document.getElementById("chatWrap"); // area block user from operation
        const allInfoContainer = document.getElementById("allInfoContainer"); // container display information
        const chatContent = document.getElementById("chatContent"); // all chats container
        const channelList = document.getElementById("channelList"); // channel list
        const loginBox = document.getElementById("loginBox"); // login container
        const registerBox = document.getElementById("registerBox"); // register container
        const profileContainer = document.getElementById("profileContainer"); // profile container
        const emptyChannelList = document.createElement("ul"); // new empty channel list
        const emptyChatContent = document.createElement("div"); // new empty chats container

        window.location.hash = ""; // setup hash url to normal state
        clearInterval(intervalId); // stop poll loop

        // clear animation
        sky1.style.animation = "";
        sky2.style.animation = "";

        // hide all container that are not for login and register
        loginRegister.removeAttribute("style");
        chatBox.removeAttribute("style");
        channelNav.removeAttribute("style");
        chatWrap.removeAttribute("style");
        allInfoContainer.removeAttribute("style");
        loginBox.removeAttribute("style");
        registerBox.removeAttribute("style");
        profileContainer.removeAttribute("style");

        // clear channel list by insert new channel list and remove old list
        channelNav.insertBefore(emptyChannelList, channelList);
        channelList.remove();

        // clear chats container by insert new container and remove old container
        chatContent.parentNode.insertBefore(emptyChatContent, chatContent);
        chatContent.remove();

        // setup empty container property
        emptyChannelList.id = "channelList";
        emptyChatContent.id = "chatContent";

        // clear user information
        userToken = null;
        userId = null;

        // notice user
        popUp("Successful Logout", false);
    })
    .catch(() => {
        popUp("Time Out");
    })
});

// router class
function Router() {
    this.routes = {};
}

// setup router and callback function
Router.prototype.setUpRoute = function(path, callback) {
    this.routes[path] = callback;
}

// setup change response
Router.prototype.urlChange = function() {
    let hash = getHashUrl();
    
    // valid path response
    if (this.routes[hash.path]) {
        this.routes[hash.path](hash.query);
    }
    else if (hash.path) {
        // invalid url, go back to index page
        this.routes['index']();
    }
}

// initilize router
Router.prototype.init = function() {
    // bind this to event lisener callback
    let bindFunction = this.urlChange.bind(this);
    window.addEventListener("load", bindFunction);
    window.addEventListener("hashchange", bindFunction);
}

// generate router object and initilize it
window.Router = new Router();
window.Router.init();

// back into index page callback
window.Router.setUpRoute('index', () => {
    if (userId === null) {
        // user first enter current url
        routingWebInit();
        communication()
        .then(() => {
            // display welcome page
            document.getElementById("welcome").style.display = "block";

            // start poll loop
            if (!setPoll) {
                intervalId = setInterval(receiveNewMessages, 2000);
                setPoll = true;
            }
        });
    }
    else {
        // user already login in
        // display welcome page
        document.getElementById("welcome").style.display = "block";

        // start poll loop
        if (!setPoll) {
            intervalId = setInterval(receiveNewMessages, 2000);
            setPoll = true;
        }
    }
});

// get sepcific channel callback
window.Router.setUpRoute('channel', (query) => {
    if (userId === null) {
        // user first enter current url
        routingWebInit();
        communication()
        .then(() => {
            // get channel
            channelClickHandler(query)
            hideChannelList();
            // start poll loop
            if (!setPoll) {
                intervalId = setInterval(receiveNewMessages, 2000);
                setPoll = true;
            }
        });
    }
    else {
        // user already login in
        // get channel
        channelClickHandler(query);
        hideChannelList();

        // start poll loop
        if (!setPoll) {
            intervalId = setInterval(receiveNewMessages, 2000);
            setPoll = true;
        }
    }
});

// get sepcific profile callback
window.Router.setUpRoute('profile', (query) => {
    if (userId === null) {
        // user first enter current url
        routingWebInit();
        communication()
        .then(() => {
            if (query === null) {
                // view user own profile and able to edit
                viewUserProfile(userId, true);
            }
            else {
                // view other user profile
                viewUserProfile(query);
            }

            // start poll loop
            if (!setPoll) {
                intervalId = setInterval(receiveNewMessages, 2000);
                setPoll = true;
            }
        });
    }
    else {
        if (query === null) {
            // view user own profile and able to edit
            viewUserProfile(userId, true);
        }
        else {
            // view other user profile
            viewUserProfile(query);
        }

        // start poll loop
        if (!setPoll) {
            intervalId = setInterval(receiveNewMessages, 2000);
            setPoll = true;
        }
    }
});

// clear all get channel button if current screent is large
largeWindowSize();

// setup screen size event
visualViewport.addEventListener("resize", () => {
    if (visualViewport.width > 600) {
        largeWindowSize(); // clear all get channel button if current screent is large
        chatWrap.removeAttribute("style"); // remove wrap for large scrren
    }
    else {
        // display all get channel button
        for (const getChannelBtn of getChannelBtns) {
            getChannelBtn.removeAttribute("style");
        }
    }
})

export { sendRequest, popUp, removeAllChild, userToken, userId };