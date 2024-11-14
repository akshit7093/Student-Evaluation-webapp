// Form handling and validation
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form elements
    const roleSelect = document.getElementById('role');
    const branchesSection = document.getElementById('branches_section');
    const form = document.querySelector('form');
    
    // Toggle branches section based on role
    function toggleBranches() {
        if (roleSelect) {
            const isTeacher = roleSelect.value === 'teacher';
            branchesSection.style.display = isTeacher ? 'block' : 'none';
            
            if (isTeacher) {
                branchesSection.classList.add('fade-in');
            }
        }
    }

    // Form validation
    function validateForm(event) {
        if (form) {
            const username = form.querySelector('input[name="username"]').value;
            const password = form.querySelector('input[name="password"]').value;
            
            if (username.length < 3) {
                showError('Username must be at least 3 characters long');
                event.preventDefault();
                return false;
            }

            if (password.length < 6) {
                showError('Password must be at least 6 characters long');
                event.preventDefault();
                return false;
            }

            if (roleSelect.value === 'teacher') {
                const selectedBranches = document.querySelectorAll('input[name="branches"]:checked');
                if (selectedBranches.length === 0) {
                    showError('Please select at least one branch');
                    event.preventDefault();
                    return false;
                }
            }
        }
        return true;
    }

    // Error handling
    function showError(message) {
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alert = document.createElement('div');
        alert.className = 'alert fade-in';
        alert.textContent = message;

        const container = document.querySelector('.container');
        container.insertBefore(alert, form);

        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    // Dashboard interactions
    function initializeDashboard() {
        const dashboardOptions = document.querySelectorAll('.dashboard-options li');
        
        dashboardOptions.forEach(option => {
            option.addEventListener('click', function() {
                this.style.backgroundColor = '#e0e0e0';
                setTimeout(() => {
                    this.style.backgroundColor = '#f8f8f8';
                }, 200);
            });
        });
    }

    // Event listeners
    if (roleSelect) {
        roleSelect.addEventListener('change', toggleBranches);
        toggleBranches(); // Initial state
    }

    if (form) {
        form.addEventListener('submit', validateForm);
    }

    // Initialize dashboard if on dashboard page
    if (document.querySelector('.dashboard-options')) {
        initializeDashboard();
    }

    // Password visibility toggle
    const passwordInput = document.querySelector('input[type="password"]');
    if (passwordInput) {
        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.textContent = 'Show';
        toggleButton.className = 'password-toggle';
        toggleButton.onclick = function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggleButton.textContent = type === 'password' ? 'Show' : 'Hide';
        };
        passwordInput.parentNode.appendChild(toggleButton);
    }

    // Add loading indicators
    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (validateForm(event)) {
                this.innerHTML = '<span class="spinner"></span> Processing...';
                this.disabled = true;
            }
        });
    });
});

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
