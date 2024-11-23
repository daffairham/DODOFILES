function moveFileToast(xhr) {
  let message, bgColor;

  if (xhr.status === 400) {
    message = "You can't move to the same directory!";
    bgColor = "#FF4D4D";
  } else {
    message = "File moved successfully.";
    bgColor = "#FF4D4D";
  }
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    backgroundColor: bgColor,
    gravity: "bottom",
    position: "center",
  }).showToast();
}

function binToast() {
  Toastify({
    text: "File moved to recycle bin.",
    duration: 2000,
    close: true,
    gravity: "bottom",
    position: "center",
    backgroundColor: "#0CC0DF",
  }).showToast();
}

function deleteToast() {
  Toastify({
    text: "File has been deleted from the system.",
    duration: 2000,
    close: true,
    gravity: "bottom",
    position: "center",
    backgroundColor: "#0CC0DF",
  }).showToast();
}

function copyToast() {
  Toastify({
    text: "Copied file succesfully.",
    duration: 2000,
    close: true,
    gravity: "bottom",
    position: "center",
    backgroundColor: "#0CC0DF",
  }).showToast();
}

function renameToast() {
  Toastify({
    text: "Rename succesful.",
    duration: 2000,
    close: true,
    gravity: "bottom",
    position: "center",
    backgroundColor: "#0CC0DF",
  }).showToast();
}

function restoreToast() {
  Toastify({
    text: "File has been restored.",
    duration: 2000,
    close: true,
    gravity: "bottom",
    position: "center",
    backgroundColor: "#0CC0DF",
  }).showToast();
}

function sharingToast(xhr) {
  let message, bgColor;

  if (xhr.status === 404) {
    message = "The user is not registered.";
    bgColor = "#FF4D4D";
  } else if (xhr.status === 409) {
    const response = JSON.parse(xhr.responseText);
    if (response.message === "1") {
      message = "You can't share files with yourself!";
      bgColor = "#FF4D4D";
    } else if (response.message === "2") {
      message = "User already have access to this file.";
      bgColor = "#0CC0DF";
    }
  } else if (xhr.status === 200) {
    message = "File shared succesfully!";
    bgColor = "#0CC0DF";
  } else {
    message = "An error occurred, please try again.";
    bgColor = "#808080";
  }
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    backgroundColor: bgColor,
    gravity: "bottom",
    position: "center",
  }).showToast();
}

function removeAccessToast() {
  Toastify({
    text: "Access removed.",
    duration: 2000,
    close: true,
    gravity: "bottom",
    position: "center",
    backgroundColor: "#0CC0DF",
  }).showToast();
}
