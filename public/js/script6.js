const profileButton2 = document.getElementById("profileDropdownBtn"); // Button to open dropdown
const profileDropdown2 = document.getElementById("profileDropdown"); // The actual dropdown
let isDropdownOpen = false; // Track dropdown state

// Open or close dropdown
profileButton2.addEventListener("click", (e) => {
  e.stopPropagation()
  isDropdownOpen = !isDropdownOpen;

  if (isDropdownOpen) {
    profileDropdown2.style.opacity = "1";
    profileDropdown2.style.visibility = "visible";
  } else {
    profileDropdown2.style.opacity = "0";
    profileDropdown2.style.visibility = "hidden";
  }
});

// Close dropdown when clicking outside of it
document.addEventListener("click", (e) => {
  if (
    isDropdownOpen &&
    !profileButton2.contains(e.target) &&
    !profileDropdown2.contains(e.target)
  ) {
    profileDropdown2.style.opacity = "0";
    profileDropdown2.style.visibility = "hidden";
    isDropdownOpen = false;
  }
});
