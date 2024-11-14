// Utility functions used across all pages
const showAlert = (message, type = 'error') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => alertDiv.remove(), 5000);
};

const togglePasswordVisibility = () => {
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const passwordInput = e.target.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
        });
    });
};

document.addEventListener('DOMContentLoaded', () => {
    togglePasswordVisibility();
});
