document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('branchSearch');
    const searchButton = document.getElementById('searchButton');
    const branchCards = document.querySelectorAll('.branch-card');

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        
        branchCards.forEach(card => {
            const branchName = card.querySelector('h3').textContent.toLowerCase();
            const branchCode = card.querySelector('.branch-code').textContent.toLowerCase();
            
            const matches = [
                fuzzyMatch(branchName, searchTerm),
                fuzzyMatch(branchCode, searchTerm)
            ];
            
            card.style.display = matches.some(match => match) ? 'flex' : 'none';
        });
    }

    function fuzzyMatch(str, pattern) {
        const abbreviations = {
            'comp': 'computer',
            'cs': 'computer science',
            'it': 'information technology',
            'mech': 'mechanical',
            'elec': 'electrical',
            'civil': 'civil engineering'
        };

        str = str.toLowerCase();
        pattern = pattern.toLowerCase();

        if (abbreviations[pattern] && str.includes(abbreviations[pattern])) {
            return true;
        }

        return str.includes(pattern) || str.startsWith(pattern);
    }

    searchButton.addEventListener('click', performSearch);
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    searchInput.addEventListener('input', performSearch);
});
