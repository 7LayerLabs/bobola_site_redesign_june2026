// Menu toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  // Menu Toggle
  const iconMenu = document.querySelector('.icon-menu');
  const menuBody = document.querySelector('.menu__body');
  
  if (iconMenu) {
    iconMenu.addEventListener('click', function(e) {
      e.stopPropagation();
      document.body.classList.toggle('lock');
      iconMenu.classList.toggle('active');
      menuBody.classList.toggle('active');
    });
  }

  // Dropdown Toggle
  const dropdownItems = document.querySelectorAll('.menu__item-dropdown');
  
  dropdownItems.forEach(item => {
    const link = item.querySelector('.menu__link');
    
    link.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      if (window.innerWidth <= 768) {
        item.classList.toggle('active');
      }
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!menuBody.contains(e.target) && !iconMenu.contains(e.target)) {
      document.body.classList.remove('lock');
      iconMenu.classList.remove('active');
      menuBody.classList.remove('active');
      
      // Close any open dropdowns
      dropdownItems.forEach(item => item.classList.remove('active'));
    }
  });

  // Close menu when clicking a menu link (except dropdown toggles)
  const menuLinks = document.querySelectorAll('.menu__link:not(.menu__item-dropdown .menu__link), .dropdown__link');
  menuLinks.forEach(link => {
    link.addEventListener('click', function() {
      document.body.classList.remove('lock');
      iconMenu.classList.remove('active');
      menuBody.classList.remove('active');
      
      // Close any open dropdowns
      dropdownItems.forEach(item => item.classList.remove('active'));
    });
  });
});

// Spoller (FAQ) functionality
const spollerButtons = document.querySelectorAll("[data-spoller] .spollers-faq__button");

spollerButtons.forEach((button) => {
  button.addEventListener("click", function () {
    const currentItem = button.closest("[data-spoller]");
    const content = currentItem.querySelector(".spollers-faq__text");

    const parent = currentItem.parentNode;
    const isOneSpoller = parent.hasAttribute("data-one-spoller");

    if (isOneSpoller) {
      const allItems = parent.querySelectorAll("[data-spoller]");
      allItems.forEach((item) => {
        if (item !== currentItem) {
          const otherContent = item.querySelector(".spollers-faq__text");
          item.classList.remove("active");
          otherContent.style.maxHeight = null;
        }
      });
    }

    if (currentItem.classList.contains("active")) {
      currentItem.classList.remove("active");
      content.style.maxHeight = null;
    } else {
      currentItem.classList.add("active");
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
});

// Restaurant Status Indicator
function updateStatusIndicator() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour * 100 + minute;

  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');

  let isOpen = false;
  let nextOpenTime = '';

  if (day === 0) { // Sunday
    isOpen = (currentTime >= 730 && currentTime < 1400);
    nextOpenTime = !isOpen ? 'Tuesday at 7:30 AM' : 'Monday at 7:30 AM';
  } else if (day === 1) { // Monday
    isOpen = false;
    nextOpenTime = 'Tuesday at 7:30 AM';
  } else if (day >= 2 && day <= 6) { // Tuesday to Saturday
    isOpen = (currentTime >= 730 && currentTime < 2000);
    nextOpenTime = day === 6 ? 'Sunday at 7:30 AM' : 'Tomorrow at 7:30 AM';
  }

  if (statusDot && statusText) {
    statusDot.style.backgroundColor = isOpen ? '#4CAF50' : '#FF5252';
    statusText.textContent = isOpen ? 'Open Now' : `Opens ${nextOpenTime}`;
  }
}

// Update status on page load and every minute
updateStatusIndicator();
setInterval(updateStatusIndicator, 60000);
