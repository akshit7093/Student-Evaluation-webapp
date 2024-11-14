document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username.length < 3) {
            showAlert('Username must be at least 3 characters long');
            return;
        }
        
        if (password.length < 6) {
            showAlert('Password must be at least 6 characters long');
            return;
        }
        
        loginForm.submit();
    });
});
