document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const roleSelect = document.getElementById('role');
    const branchesSection = document.getElementById('branches_section');
    
    const toggleBranches = () => {
        branchesSection.style.display = 
            roleSelect.value === 'teacher' ? 'block' : 'none';
    };
    
    roleSelect.addEventListener('change', toggleBranches);
    toggleBranches();
    
    signupForm.addEventListener('submit', async (e) => {
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
        
        if (roleSelect.value === 'teacher') {
            const selectedBranches = 
                document.querySelectorAll('input[name="branches"]:checked');
            if (selectedBranches.length === 0) {
                showAlert('Please select at least one branch');
                return;
            }
        }
        
        signupForm.submit();
    });
});
