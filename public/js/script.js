function openModal() {
  document.getElementById("upload-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("upload-modal").classList.add("hidden");
}

function openRenameModal(index) {
  document.getElementById(`rename-modal${index}`).classList.remove("hidden");
}

function closeRenameModal(index) {
  document.getElementById(`rename-modal${index}`).classList.add("hidden");
}

function openMoveFileModal(index) {
  document.getElementById(`move-file-modal${index}`).classList.remove("hidden");
}

function closeMoveFileModal(index) {
  document.getElementById(`move-file-modal${index}`).classList.add("hidden");
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
  var uploadModal = document.getElementById("upload-modal");
  
  for (let i = 0; i < fileList.length; i++) {
    var renameModal = document.getElementById(`rename-modal${i}`);
    if (event.target == renameModal) {
      closeRenameModal(i);
    }
  }

  if (event.target == uploadModal) {
    closeModal();
  }
};

//tutup modal kalau klik elemen selain
window.addEventListener('click', function(event) {

  for (let i = 0; i < fileList.length; i++) {
    const renameModal = document.getElementById(`rename-modal${i}`);
    if (event.target !== renameModal && !renameModal.contains(event.target)) {
      closeRenameModal(i);
    }
  }

  if (!event.target.classList.contains('option-btn') && !event.target.closest('.dropdown')) {
    const allDropdowns = document.querySelectorAll('.dropdown');
    allDropdowns.forEach(dropdown => {
      dropdown.classList.add('hidden');
    });
  }
});
