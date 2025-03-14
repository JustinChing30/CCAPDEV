const profileButton = document.getElementById("profileDropdownBtn"); // Button to open dropdown
const profileDropdown = document.getElementById("profileDropdown"); // The actual dropdown

// Open dropdown
profileButton.addEventListener("click", (e) => {
  if (profileDropdown.style.visibility === "visible") { // If dropdown is visible, hide it when button clicked
    profileDropdown.style.opacity = "0";
    profileDropdown.style.visibility = "hidden";
  } else { // If dropdown is NOT visible, show it when button clicked
    profileDropdown.style.opacity = "1";
    profileDropdown.style.visibility = "visible";
  }
});

// Close dropdown when clicking outside of it
document.addEventListener("click", (e) => {
  if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.style.opacity = "0";
    profileDropdown.style.visibility = "hidden";
  }
});
