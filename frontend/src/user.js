import { sendRequest, popUp, userToken, userId } from "./main.js"
import { hideChannelList } from "./channel.js";
import { fileToDataUrl } from './helpers.js';

const profileContainer = document.getElementById("profileContainer"); // container display profile
const ownProfileEmail = document.getElementById("ownProfileEmail"); // user email
const editPassword = document.getElementById("editPassword"); // user edited password
const welcomePage = document.getElementById("welcome"); // welcome page

// upload user profile image button
const uploadImageProfile = document.getElementById("uploadImgBtn");
// fake upload user profile image to have better appearance
const disguiseUploadImageProfile = document.getElementById("disguiseUploadBtn");
// user edited confirmation password
const editConfirmPassword = document.getElementById("editConfirmPassword");

let currentEmail; // current email

// view user profile
const viewUserProfile = (id, isOwn=false) => {
    // get user profile from server
    sendRequest("GET", `/user/${id}`, userToken)
    .then(response => {
        let profile = isOwn ? document.getElementById("ownProfile") : document.getElementById("profile"); // profile container
        let profileImage = isOwn ? document.getElementById("ownProfileImage") : document.getElementById("profileImage"); // user image container
        let name = isOwn ? document.getElementById("ownProfileUserName") : document.getElementById("profileUserName"); // user name container
        let bio = isOwn ? document.getElementById("ownProfileBio") : document.getElementById("profileBio"); // user bio container
        let email = isOwn ? document.getElementById("ownProfileEmail") : document.getElementById("profileEmail"); // user email container

        // setup user image
        if (response.image) {
            profileImage.src = response.image;
        }
        else {
            // setup user image with default image
            profileImage.classList.add("defaultImage");
        }

        // display profile
        profileImage.classList.add("imageBaseSetting");
        profileContainer.style.display = "block";
        profile.style.display = "block";

        if (isOwn) {
            // setup information ready to edit
            name.value = response.name;
            bio.value = response.bio;
            email.value = response.email;
            currentEmail = email.value;
            profileContainer.setAttribute("isOwn", true);
        } 
        else {
            // setup not editable information
            name.innerText = response.name;
            bio.innerText = response.bio;
            email.innerText = response.email;
        }
    })
    .catch(e => {
        // error notification
        popUp(e.error);
    })
}

// update all user image
const updateAllRelatedImg = (img) => {
    const ownProfileImage = document.getElementById("ownProfileImage"); // profile page image
    const loginUserImage = document.getElementById("loginUserImage"); // channel navigation image
    const userImages = document.querySelectorAll(`div[userid="${userId}"] img`); // user chat image

    // remove default image
    if (ownProfileImage.classList.contains("defaultImage")) {
        ownProfileImage.classList.remove("defaultImage");
    }

    // remove default image
    if (loginUserImage.classList.contains("defaultImage")) {
        loginUserImage.classList.remove("defaultImage");
    }

    // remove default image
    for (const userImage of userImages) {
        if (userImage.classList.contains("defaultImage")) {
            userImage.classList.remove("defaultImage");
        }
        userImage.src = img; // setup user image
    }
    
    // setup user image
    ownProfileImage.src = img;
    loginUserImage.src = img;
};

// update all user name
const updateAllRelatedName = (name) => {
    const userName = document.getElementById("userName"); // profile page name
    const chatUserNames = document.querySelectorAll(".chatUserName"); // user chat name
    
    // update name
    userName.innerText = name;

    for (const chatUserName of chatUserNames) {
        chatUserName.innerText = name;
    }
};

// send update information to server
const update = (body) => {
    return new Promise((resolve, reject) => {
        sendRequest("PUT", "/user", userToken, null, body)
        .then(() => {
            popUp("Succeessful Update Profile", false);
            resolve();
        })
        .catch(e => {
            reject(e);
        });
    });
};

// update user profile image
uploadImageProfile.addEventListener("change", () => {
    let img = uploadImageProfile.files;
    if (img.length === 1) {
        // limit image size
        // avoid using too much local storage
        if (img[0].size > 5120) {
            popUp("Cannot Upload Image Over 5kb");
            return;
        }

        try {
            // transform image to valid format
            fileToDataUrl(img[0])
            .then(img => {
                let body = {
                    "image": img
                }

                // update user image
                update(body)
                .then(() => {
                    updateAllRelatedImg(img); // update all related user image
                })
                .catch(e => popUp(e.error));
            })
            .catch(e => {
                popUp(e.error);
            })
        }
        catch (e) {
            // wrong image format
            popUp(e.message);
            return;
        }
    }
    else if (img.length > 1) {
        popUp("Can Only Set One Image");
    }
});

// transfer upload image function to fake button
disguiseUploadImageProfile.addEventListener("click", () => {
    if (uploadImageProfile) {
        uploadImageProfile.click();
    }
}, false);

// close profile page event
document.getElementById("profileBack").addEventListener("click", () => {
    let isOwn = profileContainer.hasAttribute("isOwn"); // editing profile flag
    let profile = isOwn ? document.getElementById("ownProfile") : document.getElementById("profile"); // profile container
    let channel = document.querySelector(".selected"); // selected channel
    window.location.hash = ""; // set to initial hash url
    
    // show welcome page if no channel oppen
    if (!channel) {
        welcomePage.style.display = "block";
    }

    // hide profile page
    ownProfileEmail.removeAttribute("style");
    editPassword.removeAttribute("style");
    editConfirmPassword.removeAttribute("style");
    profileContainer.removeAttribute("style");
    profileContainer.removeAttribute("isOwn");
    profile.removeAttribute("style");
});

// display profile page
document.getElementById("settingBtn").addEventListener("click", () => {
    hideChannelList();
    window.location.hash = `profile`;
});

// check edited email after user blur input area
ownProfileEmail.addEventListener("blur", () => {
    let pattern = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
    if (!ownProfileEmail.value.match(pattern)) {
        ownProfileEmail.style.backgroundColor = "red";
    }
})

// clear email warning during user input
ownProfileEmail.addEventListener("focus", () => {
    ownProfileEmail.removeAttribute("style");
});

// check edited password after user blur input area
editPassword.addEventListener("blur", () => {
    if (editPassword.value.length < 8 || editPassword.value.length > 12) {
        editPassword.style.backgroundColor = "red";
        popUp("Please enter 8-12 characters password!");
    }
});

// clear password warning during user input
editPassword.addEventListener("focus", () => {
    editPassword.removeAttribute("style");
});

// check edited confirm password after user blur input area
editConfirmPassword.addEventListener("blur", () => {
    if (editConfirmPassword.value.length < 8 || editConfirmPassword.value.length > 12) {
        editConfirmPassword.style.backgroundColor = "red";
        popUp("Please enter 8-12 characters password!");
    }
});

// clear confirm password warning during user input
editConfirmPassword.addEventListener("focus", () => {
    editConfirmPassword.removeAttribute("style");
});

// update user profile event
document.getElementById("update").addEventListener("click", () => {
    let name = document.getElementById("ownProfileUserName").value; // new user name
    let email = document.getElementById("ownProfileEmail").value; // new user email
    let pwd = document.getElementById("editPassword").value; // new password
    let confirm = document.getElementById("editConfirmPassword").value; // confirm password
    let bio = document.getElementById("ownProfileBio").value; // new bio
    let pattern = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/; // email pattern

    if (!ownProfileEmail.value.match(pattern)) {
        // wrong email format response
        popUp("Wrong Email Format");
        return;
    }

    if (name === "") {
        // no name input response
        popUp("Cannot Set Empty Name");
        return;
    }

    if (bio.length > 50) {
        // to long bio
        popUp("Only Accept 50 Characters");
        return;
    }

    if (confirm !== pwd) {
        // two password not the same response
        popUp("Two Passwords Are Different");
        return;
    }

    // server requested body
    let body = {
        "email": email === currentEmail ? "" : email,
        "password": pwd === "" ? null : pwd,
        "name": name,
        "bio": bio
    }

    // update user profile
    update(body)
    .then(() => {
        // store current email
        currentEmail = email
        updateAllRelatedName(name);
    })
    .catch(e => {
        popUp(e.error)
    });
});

export default viewUserProfile;