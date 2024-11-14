document.addEventListener('DOMContentLoaded', function() {
    // File preview functionality
    const fileCards = document.querySelectorAll('.file-card');
    fileCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('download-btn')) {
                const fileName = this.querySelector('.file-name').textContent;
                previewFile(fileName);
            }
        });
    });

    // Download functionality
    const downloadButtons = document.querySelectorAll('.download-btn');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const fileName = this.parentElement.querySelector('.file-name').textContent;
            downloadFile(fileName);
        });
    });

    // Tab switching for different file types
    const sections = ['assignments', 'projects', 'reports'];
    sections.forEach(section => {
        const tab = document.querySelector(`.section-${section} h2`);
        if (tab) {
            tab.addEventListener('click', () => toggleSection(section));
        }
    });
});

function previewFile(fileName) {
    // Implement file preview logic
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const previewContainer = document.createElement('div');
    previewContainer.classList.add('file-preview');
    
    if (['pdf', 'doc', 'docx'].includes(fileExtension)) {
        // Document preview logic
    } else if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
        // Image preview logic
    }
}

function downloadFile(fileName) {
    // Implement file download logic
    const downloadUrl = `/download/${fileName}`;
    fetch(downloadUrl)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => console.error('Download failed:', error));
}

function toggleSection(sectionName) {
    const section = document.querySelector(`.section-${sectionName}`);
    const fileGrid = section.querySelector('.file-grid');
    fileGrid.style.display = fileGrid.style.display === 'none' ? 'grid' : 'none';
}
