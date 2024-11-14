document.addEventListener('DOMContentLoaded', () => {
    const branchSelect = document.getElementById('branchSelect');
    const yearSelect = document.getElementById('yearSelect');
    const studentSelect = document.getElementById('studentSelect');

    // Load students when branch/year changes
    function loadStudents() {
        const branch = branchSelect.value;
        const year = yearSelect.value;
        
        fetch(`/get_students/${branch}/${year}`)
            .then(res => res.json())
            .then(students => {
                studentSelect.innerHTML = '<option value="">Select Student</option>' +
                    students.map(s => `<option value="${s.enrollment}">${s.enrollment} - ${s.name}</option>`).join('');
            });
    }

    branchSelect.addEventListener('change', loadStudents);
    yearSelect.addEventListener('change', loadStudents);

    // Handle file uploads
    document.querySelectorAll('.file-upload-zone').forEach(zone => {
        const fileInput = zone.querySelector('.file-input');
        const fileList = zone.querySelector('.file-list');
        const section = zone.dataset.section;

        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', e => {
            handleFiles(e.target.files);
        });

        function handleFiles(files) {
            const formData = new FormData();
            formData.append('enrollment', studentSelect.value);
            formData.append('section', section);
            
            Array.from(files).forEach(file => {
                formData.append('files', file);
            });

            fetch('/upload/files', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                updateFileList(data.files);
            });
        }

        function updateFileList(files) {
            fileList.innerHTML = files.map(file => `
                <div class="file-item">
                    <span>${file}</span>
                    <i class="fas fa-check"></i>
                </div>
            `).join('');
        }
    });
});
