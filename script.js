// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Navigation Toggle ---
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            // Optional: Change menu icon to close icon when active
            const menuIcon = menuToggle.querySelector('svg'); // Assuming one SVG inside
            if (mainNav.classList.contains('active')) {
                menuToggle.setAttribute('aria-expanded', 'true');
                // Change to a close icon (X)
                if (menuIcon) menuIcon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
            } else {
                menuToggle.setAttribute('aria-expanded', 'false');
                // Change back to menu icon (hamburger)
                if (menuIcon) menuIcon.innerHTML = '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
            }
        });
    }

    // --- Search Bar Toggle ---
    const searchButton = document.querySelector('.search-button');
    const searchBarContainer = document.querySelector('.search-bar-container');
    const searchInput = document.getElementById('searchInput');

    if (searchButton && searchBarContainer) {
        searchButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from immediately closing if search bar is part of a dropdown
            searchBarContainer.classList.toggle('active');
            if (searchBarContainer.classList.contains('active')) {
                searchButton.setAttribute('aria-expanded', 'true');
                if(searchInput) searchInput.focus(); // Focus the input when shown
            } else {
                searchButton.setAttribute('aria-expanded', 'false');
            }
        });

        // Optional: Close search bar if clicked outside
        document.addEventListener('click', (event) => {
            if (searchBarContainer.classList.contains('active') &&
                !searchBarContainer.contains(event.target) &&
                !searchButton.contains(event.target)) {
                searchBarContainer.classList.remove('active');
                searchButton.setAttribute('aria-expanded', 'false');
            }
        });
    }
    
    // --- Search Submit (Placeholder) ---
    const searchSubmitButton = document.getElementById('searchSubmit');
    if (searchSubmitButton && searchInput) {
        searchSubmitButton.addEventListener('click', () => {
            const searchTerm = searchInput.value;
            if (searchTerm.trim() !== '') {
                // In a real application, you would redirect to a search results page
                // or fetch search results via AJAX.
                console.log('Searching for:', searchTerm);
                // Example: window.location.href = '/search?q=' + encodeURIComponent(searchTerm);
                // For now, just log to console and clear.
                searchInput.value = '';
                // Optionally hide search bar after search
                // searchBarContainer.classList.remove('active');
                // searchButton.setAttribute('aria-expanded', 'false');
            } else {
                // Maybe provide some feedback if search term is empty
                console.log('Search term is empty.');
            }
        });
        // Allow submitting search with Enter key
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission if it's in a form
                searchSubmitButton.click();
            }
        });
    }


    // --- Sticky Header (Optional: Add class on scroll) ---
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) { // Adjust scroll threshold as needed
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
    // Add this to your CSS for the .scrolled effect:
    /*
    header.scrolled {
        background-color: rgba(255, 255, 255, 0.95);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(5px); // For a frosted glass effect if desired
    }
    */

    // --- Update Current Year in Footer ---
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Active Navigation Link Highlighting (Basic Example) ---
    // This is a very basic version. For a real site, this logic would be more complex,
    // especially with multiple pages or a single-page application router.
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const currentPath = window.location.pathname.split('/').pop() || 'index.html'; // Get current page file name

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        // Simple check for hash links or direct page links
        if (linkPath === `#${currentPath.replace('.html', '')}` || linkPath === currentPath || (currentPath === 'index.html' && linkPath === '#home')) {
            link.classList.add('active');
        }

        // Smooth scroll for hash links
        if (linkPath.startsWith('#')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    // Calculate offset if you have a sticky header
                    const headerOffset = document.querySelector('header') ? document.querySelector('header').offsetHeight : 0;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });

                    // Close mobile nav if open after clicking a link
                    if (mainNav && mainNav.classList.contains('active')) {
                        mainNav.classList.remove('active');
                        if (menuToggle && menuToggle.querySelector('svg')) {
                             menuToggle.querySelector('svg').innerHTML = '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
                             menuToggle.setAttribute('aria-expanded', 'false');
                        }
                    }
                }
            });
        }
    });

    // --- Newsletter Form Submission (Basic Example) ---
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default form submission
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            if (emailInput && emailInput.value) {
                // In a real application, you'd send this to a server (e.g., using fetch API)
                console.log('Newsletter subscription for:', emailInput.value);
                // Show a success message (you'd create a proper UI element for this)
                // For now, just an alert (though alerts are generally discouraged for good UX)
                // alert(`Thank you for subscribing, ${emailInput.value}!`);
                
                // Create a custom message display instead of alert
                let messageDiv = newsletterForm.querySelector('.form-message');
                if (!messageDiv) {
                    messageDiv = document.createElement('div');
                    messageDiv.className = 'form-message';
                    // Insert message after the form or button
                    newsletterForm.appendChild(messageDiv);

                }
                messageDiv.textContent = `Thank you for subscribing, ${emailInput.value}!`;
                messageDiv.style.color = 'var(--success-color)';
                messageDiv.style.marginTop = '10px';
                messageDiv.style.fontWeight = '500';


                emailInput.value = ''; // Clear the input field

                // Remove message after a few seconds
                setTimeout(() => {
                    if(messageDiv) messageDiv.textContent = '';
                }, 5000);

            } else if (emailInput) {
                // Handle empty email field
                let messageDiv = newsletterForm.querySelector('.form-message');
                 if (!messageDiv) {
                    messageDiv = document.createElement('div');
                    messageDiv.className = 'form-message';
                    newsletterForm.appendChild(messageDiv);
                }
                messageDiv.textContent = 'Please enter a valid email address.';
                messageDiv.style.color = 'var(--danger-color)';
                messageDiv.style.marginTop = '10px';
                messageDiv.style.fontWeight = '500';
                emailInput.focus();

                setTimeout(() => {
                     if(messageDiv) messageDiv.textContent = '';
                }, 3000);
            }
        });
    }

    // --- Add to Cart Button (Placeholder Interaction) ---
    const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');
    const cartCountElement = document.querySelector('.cart-link .cart-count');
    let cartItemCount = 0;

    if (cartCountElement) { // Initialize cart count display
        cartCountElement.textContent = cartItemCount;
    }

    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            // In a real app, this would involve more complex logic:
            // - Getting product ID and details
            // - Sending data to a server/cart API
            // - Updating cart state globally
            // - Providing more detailed user feedback (e.g., item added to cart modal)

            cartItemCount++;
            if (cartCountElement) {
                cartCountElement.textContent = cartItemCount;
                // Add a little animation to cart count
                cartCountElement.style.transform = 'scale(1.3)';
                cartCountElement.style.transition = 'transform 0.1s ease-in-out';
                setTimeout(() => {
                    cartCountElement.style.transform = 'scale(1)';
                }, 150);
            }
            
            // Change button text temporarily
            const originalText = button.textContent;
            button.textContent = 'Added!';
            button.style.backgroundColor = 'var(--primary-color)'; // Change color to indicate success
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = ''; // Revert to original style (or var(--success-color))
            }, 1500);

            console.log('Product added to cart (placeholder). Current count:', cartItemCount);
        });
    });

    // --- Image Error Handling for Placeholders (already in HTML, but good to be aware of) ---
    // The onerror attribute in the <img> tags in index.html handles this.
    // Example: <img src="path/to/image.jpg" onerror="this.onerror=null;this.src='placeholder.jpg';" />

    console.log('ElectroMart JavaScript loaded and initialized.');
});
