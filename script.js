// script.js

document.addEventListener('DOMContentLoaded', async () => { // Make outer function async for initial auth check
    // --- Global Elements & State ---
    const body = document.body;
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    let currentUser = null; // Will store user data if logged in

    // --- Helper to display server messages on forms ---
    function displayFormMessage(formElement, message, type = 'error') {
        const messageDiv = formElement.querySelector('.form-server-message');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = 'form-server-message'; // Reset
            messageDiv.classList.add(type); // 'success' or 'error'
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'form-server-message';
            }, 5000);
        }
    }
    function clearFormErrorMessages(formElement) {
        formElement.querySelectorAll('.form-error-message').forEach(el => el.textContent = '');
        const serverMessageDiv = formElement.querySelector('.form-server-message');
        if (serverMessageDiv) {
            serverMessageDiv.textContent = '';
            serverMessageDiv.className = 'form-server-message';
        }
    }


    // --- Mobile Navigation Toggle ---
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            const isActive = mainNav.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', isActive.toString());
            const menuIcon = menuToggle.querySelector('svg');
            if (menuIcon) {
                menuIcon.innerHTML = isActive ?
                    '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>' :
                    '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
            }
        });
    }

    // --- Search Bar Toggle ---
    const searchButton = document.querySelector('.search-button');
    const searchBarContainer = document.querySelector('.search-bar-container');
    const searchInput = document.getElementById('searchInput');
    if (searchButton && searchBarContainer) {
        searchButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const isActive = searchBarContainer.classList.toggle('active');
            searchButton.setAttribute('aria-expanded', isActive.toString());
            if (isActive && searchInput) searchInput.focus();
        });
        document.addEventListener('click', (event) => {
            if (searchBarContainer.classList.contains('active') &&
                !searchBarContainer.contains(event.target) &&
                !searchButton.contains(event.target)) {
                searchBarContainer.classList.remove('active');
                searchButton.setAttribute('aria-expanded', 'false');
            }
        });
    }
    const searchSubmitButton = document.getElementById('searchSubmit');
    if (searchSubmitButton && searchInput) {
        const performSearch = () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) console.log('Searching for:', searchTerm);
            else console.log('Search term is empty.');
        };
        searchSubmitButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') { event.preventDefault(); performSearch(); }
        });
    }

    // --- Sticky Header ---
    const header = document.querySelector('header:not(.auth-header)');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // --- Update Current Year in Footer ---
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    // --- Active Navigation Link Highlighting & Smooth Scroll ---
    const navLinks = document.querySelectorAll('.main-nav .nav-link');
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || (currentPage === 'index.html' && (linkHref === 'index.html#home' || link.hash === window.location.hash))) {
             navLinks.forEach(l => l.classList.remove('active'));
             link.classList.add('active');
        }

        if (linkHref && (linkHref.startsWith('index.html#') || (linkHref.startsWith('#') && currentPage === 'index.html'))) {
            link.addEventListener('click', function(e) {
                const targetId = this.hash;
                if (currentPage === 'index.html' && targetId) {
                    e.preventDefault();
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        const headerOffset = document.querySelector('header:not(.auth-header)')?.offsetHeight || 0;
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                        navLinks.forEach(l => l.classList.remove('active'));
                        this.classList.add('active');
                    }
                }
                if (mainNav && mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    if (menuToggle && menuToggle.querySelector('svg')) {
                        menuToggle.querySelector('svg').innerHTML = '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
                        menuToggle.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        }
    });

    // --- Newsletter Form Submission ---
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const messageDiv = newsletterForm.querySelector('.form-message'); // Ensure this div exists in HTML
            if (!messageDiv || !emailInput) return;

            clearFormErrorMessages(newsletterForm); // Clear previous messages

            if (emailInput.value && emailInput.value.includes('@')) {
                try {
                    const response = await fetch('/api/newsletter/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: emailInput.value })
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        displayFormMessage(newsletterForm, result.message || 'Thank you for subscribing!', 'success');
                        emailInput.value = '';
                    } else {
                        displayFormMessage(newsletterForm, result.error || result.message || 'Subscription failed.', 'error');
                    }
                } catch (error) {
                    console.error("Newsletter fetch error:", error);
                    displayFormMessage(newsletterForm, 'An error occurred. Please try again.', 'error');
                }
            } else {
                displayFormMessage(newsletterForm, 'Please enter a valid email address.', 'error');
                if(emailInput) emailInput.focus();
            }
        });
    }

    // --- Add to Cart Button (Placeholder) ---
    const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');
    const cartCountElement = document.querySelector('.cart-link .cart-count');
    let cartItemCount = 0;
    if (cartCountElement) cartCountElement.textContent = cartItemCount;
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            cartItemCount++;
            if (cartCountElement) {
                cartCountElement.textContent = cartItemCount;
                cartCountElement.style.transform = 'scale(1.3)';
                setTimeout(() => { cartCountElement.style.transform = 'scale(1)'; }, 150);
            }
            const originalText = button.textContent;
            button.textContent = 'Added!'; button.disabled = true;
            setTimeout(() => { button.textContent = originalText; button.disabled = false; }, 1500);
        });
    });

    // --- Authentication UI Management ---
    const updateAuthUI = () => {
        const loginLink = document.getElementById('loginLink');
        const registerLink = document.getElementById('registerLink');
        const profileLink = document.getElementById('profileLink');
        const ordersLink = document.getElementById('ordersLink');
        const logoutButton = document.getElementById('logoutButton');
        const accountIconLink = document.querySelector('.account-dropdown .account-link');
        const welcomeMessageElement = document.getElementById('userWelcomeMessage'); // Optional: Add <span id="userWelcomeMessage"></span> in header

        if (currentUser) {
            if (loginLink) loginLink.style.display = 'none';
            if (registerLink) registerLink.style.display = 'none';
            if (profileLink) profileLink.style.display = 'block';
            if (ordersLink) ordersLink.style.display = 'block';
            if (logoutButton) logoutButton.style.display = 'block';
            if (accountIconLink) accountIconLink.href = '#profile'; // TODO: Create profile.html
            if (welcomeMessageElement) welcomeMessageElement.textContent = `Hi, ${currentUser.fullName || currentUser.email}!`;
        } else {
            if (loginLink) loginLink.style.display = 'block';
            if (registerLink) registerLink.style.display = 'block';
            if (profileLink) profileLink.style.display = 'none';
            if (ordersLink) ordersLink.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'none';
            if (accountIconLink) accountIconLink.href = 'login.html';
            if (welcomeMessageElement) welcomeMessageElement.textContent = '';
        }
    };

    // --- Check Authentication Status on Page Load ---
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/users/authcheck'); // Server sends cookie automatically
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.isAuthenticated) {
                    currentUser = data.user;
                } else {
                    currentUser = null;
                }
            } else {
                // If authcheck fails (e.g. 401), user is not authenticated
                currentUser = null;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            currentUser = null;
        }
        updateAuthUI(); // Update UI after checking status
    }

    // --- Logout ---
    const logoutUser = async () => {
        try {
            const response = await fetch('/api/users/logout', { method: 'POST' });
            const result = await response.json();
            if (response.ok && result.success) {
                currentUser = null;
                updateAuthUI();
                // Redirect to homepage or login page after logout
                if (currentPage !== 'index.html' && currentPage !== 'login.html' && currentPage !== 'register.html') {
                    window.location.href = 'index.html';
                } else if (currentPage === 'profile.html' || currentPage === 'orders.html') { // Assuming these pages exist
                     window.location.href = 'login.html';
                }
            } else {
                alert('Logout failed: ' + (result.error || 'Please try again.'));
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('An error occurred during logout.');
        }
    };
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) logoutButton.addEventListener('click', logoutUser);


    // --- Login Form Handling (login.html) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const emailInput = loginForm.email;
            const passwordInput = loginForm.password;
            const emailError = document.getElementById('emailError');
            const passwordError = document.getElementById('passwordError');

            clearFormErrorMessages(loginForm);
            let isValid = true;

            if (!emailInput.value.trim()) {
                emailError.textContent = 'Email is required.'; isValid = false;
            } else if (!emailInput.value.includes('@')) {
                emailError.textContent = 'Please enter a valid email.'; isValid = false;
            }
            if (!passwordInput.value) {
                passwordError.textContent = 'Password is required.'; isValid = false;
            }

            if (isValid) {
                try {
                    const response = await fetch('/api/users/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: emailInput.value.trim(), password: passwordInput.value })
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        currentUser = result.user; // Server should return user details
                        updateAuthUI(); // Update UI elements like account dropdown
                        displayFormMessage(loginForm, 'Login successful! Redirecting...', 'success');
                        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                    } else {
                        displayFormMessage(loginForm, result.error || 'Invalid email or password.', 'error');
                    }
                } catch (error) {
                    console.error('Login fetch error:', error);
                    displayFormMessage(loginForm, 'An error occurred. Please try again.', 'error');
                }
            }
        });
    }

    // --- Registration Form Handling (register.html) ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const fullNameInput = registerForm.fullName;
            const emailInput = registerForm.email;
            const passwordInput = registerForm.password;
            const confirmPasswordInput = registerForm.confirmPassword;
            const termsInput = registerForm.terms;

            const fullNameError = document.getElementById('fullNameError');
            const emailError = document.getElementById('emailError');
            const passwordError = document.getElementById('passwordError');
            const confirmPasswordError = document.getElementById('confirmPasswordError');
            const termsError = document.getElementById('termsError');

            clearFormErrorMessages(registerForm);
            let isValid = true;

            if (!fullNameInput.value.trim()) { fullNameError.textContent = 'Full name is required.'; isValid = false; }
            if (!emailInput.value.trim()) { emailError.textContent = 'Email is required.'; isValid = false; }
            else if (!emailInput.value.includes('@')) { emailError.textContent = 'Please enter a valid email.'; isValid = false; }
            if (!passwordInput.value) { passwordError.textContent = 'Password is required.'; isValid = false; }
            else if (passwordInput.value.length < 6) { passwordError.textContent = 'Password must be at least 6 characters.'; isValid = false; }
            if (passwordInput.value !== confirmPasswordInput.value) { confirmPasswordError.textContent = 'Passwords do not match.'; isValid = false; }
            if (!termsInput.checked) { termsError.textContent = 'You must agree to the terms.'; isValid = false; }

            if (isValid) {
                try {
                    const response = await fetch('/api/users/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fullName: fullNameInput.value.trim(),
                            email: emailInput.value.trim(),
                            password: passwordInput.value
                        })
                    });
                    const result = await response.json();
                    if (response.status === 201 && result.success) {
                        displayFormMessage(registerForm, 'Registration successful! Please log in.', 'success');
                        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
                    } else {
                        displayFormMessage(registerForm, result.error || 'Registration failed. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error('Registration fetch error:', error);
                    displayFormMessage(registerForm, 'An error occurred. Please try again.', 'error');
                }
            }
        });
    }

    // --- Initial UI Update based on Auth State ---
    if (document.querySelector('.account-dropdown')) {
        await checkAuthStatus(); // Perform initial check and update UI
    }

    console.log(`ElectroMart JavaScript loaded for ${currentPage}. Auth status checked.`);
});
