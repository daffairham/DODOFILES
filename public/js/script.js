function openModal() {
  document.getElementById("upload-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("upload-modal").classList.add("hidden");
}

function openUploadMultiModal() {
  document.getElementById("uploadmulti-modal").classList.remove("hidden");
}

function closeUploadMultiModal() {
  document.getElementById("uploadmulti-modal").classList.add("hidden");
}

function openRenameModal(index) {
  document.getElementById(`rename-modal${index}`).classList.remove("hidden");
}

function closeRenameModal(index) {
  document.getElementById(`rename-modal${index}`).classList.add("hidden");
}

function openRenameSharedModal(index) {
  document.getElementById(`renameshared-modal${index}`).classList.remove("hidden");
}

function closeRenameSharedModal(index) {
  document.getElementById(`renameshared-modal${index}`).classList.add("hidden");
}

function openMoveFileModal(index) {
  document.getElementById(`move-file-modal${index}`).classList.remove("hidden");
}

function closeMoveFileModal(index) {
  document.getElementById(`move-file-modal${index}`).classList.add("hidden");
}

function openCopyFileModal(index) {
  document.getElementById(`copy-file-modal${index}`).classList.remove("hidden");
}

function closeCopyFileModal(index) {
  document.getElementById(`copy-file-modal${index}`).classList.add('hidden');
}

function openShareFileModal(index) {
  document.getElementById(`share-file-modal${index}`).classList.remove("hidden");
}

function closeShareFileModal(index) {
  document.getElementById(`share-file-modal${index}`).classList.add("hidden");
}

function openPropertiesModal(index) {
  document.getElementById(`properties-modal${index}`).classList.remove("hidden");
}

function closePropertiesModal(index) {
  document.getElementById(`properties-modal${index}`).classList.add("hidden");
}

function toggleDropdown(button, index) {
  const allDropdowns = document.querySelectorAll('.dropdown');
  allDropdowns.forEach(dropdown => {
    if (!dropdown.classList.contains('hidden')) {
      dropdown.classList.add('hidden');
    }
  });

  const dropdown = document.getElementById(`dropdown${index}`);
  dropdown.classList.toggle('hidden');
}

window.onclick = function (event) {
  const allDropdowns = document.querySelectorAll('.dropdown');
  allDropdowns.forEach(dropdown => {
    if (!dropdown.contains(event.target) && !event.target.closest('button')) {
      dropdown.classList.add('hidden');
    }
  });

  if (event.target == document.getElementById("upload-modal")) {
    closeModal();
  }
};

window.addEventListener('click', function(event) {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target == modal) {
      modal.classList.add('hidden');
    }
  });
});