document.addEventListener('DOMContentLoaded', function() {
    // File preview functionality
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (!e.target.classList.contains('download-btn')) {
                const fileName = this.querySelector('span').textContent;
                previewFile(fileName);
            }
        });
    });

    // Document section collapsible
    const sectionHeaders = document.querySelectorAll('.doc-section h3');
    sectionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const section = header.parentElement;
            const fileList = section.querySelector('.file-list');
            fileList.style.display = fileList.style.display === 'none' ? 'block' : 'none';
            header.querySelector('i').classList.toggle('fa-rotate-180');
        });
    });

    // File filtering
    const searchInputs = document.querySelectorAll('.file-search');
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const fileList = this.closest('.doc-section').querySelectorAll('.file-item');
            
            fileList.forEach(file => {
                const fileName = file.querySelector('span').textContent.toLowerCase();
                file.style.display = fileName.includes(searchTerm) ? 'flex' : 'none';
            });
        });
    });
});

function previewFile(fileName) {
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const previewContainer = document.getElementById('filePreview');
    
    if (['pdf', 'doc', 'docx'].includes(fileExtension)) {
        // Document preview logic
        previewContainer.innerHTML = `<iframe src="/preview/${fileName}" width="100%" height="600px"></iframe>`;
    } else if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
        // Image preview logic
        previewContainer.innerHTML = `<img src="/preview/${fileName}" alt="${fileName}">`;
    }
    
    previewContainer.style.display = 'block';
}

function downloadFile(fileType, fileName) {
    fetch(`/download/${fileType}/${fileName}`)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });
}

function exportStudentData() {
    const studentData = {
        name: document.querySelector('.profile-header h1').textContent,
        enrollment: document.querySelector('.enrollment-badge').textContent,
        // Add other fields as needed
    };
    
    const blob = new Blob([JSON.stringify(studentData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studentData.enrollment}_data.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
