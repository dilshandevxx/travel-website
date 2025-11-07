// Function to handle smooth scrolling for anchor links (ToC)
document.addEventListener("DOMContentLoaded", () => {
  // Select all anchor links within the table of contents
  const tocLinks = document.querySelectorAll('.toc a[href^="#"]');

  tocLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      // Prevent default jump action
      e.preventDefault();

      // Get the target element ID from the href attribute
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        // Use the scrollIntoView method for smooth scrolling
        targetElement.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });
});
