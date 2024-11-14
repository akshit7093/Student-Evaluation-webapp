from flask import Flask, jsonify, render_template, request, redirect, send_from_directory, url_for, flash, session
from functools import wraps
import json
import os

app = Flask(__name__)
app.secret_key = 'b9834758947c498d62d88b91eeb9c'

def load_admins():
    try:
        with open('project/admins.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def load_teachers():
    try:
        with open('project/teachers.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_admins(admins):
    with open('admins.json', 'w') as f:
        json.dump(admins, f, indent=4)

def save_teachers(teachers):
    with open('teachers.json', 'w') as f:
        json.dump(teachers, f, indent=4)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))



@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role']
        
        users = load_admins() if role == 'admin' else load_teachers()
        print("Loaded users:", users)  # Check loaded data
        print("Login attempt:", username, password, role)  # Check submitted data
        
        user = next((user for user in users if user['username'] == username and user['password'] == password), None)
        print("Found user:", user)  # Check matched user
        
        if user:
            session['user_id'] = user['admin_id' if role == 'admin' else 'teacher_id']
            session['username'] = user['username']
            session['role'] = role
            session['branches'] = user['branches']
            return redirect(url_for('dashboard'))
        
        flash('Invalid credentials')
    return render_template('login.html')








# @app.route('/login', methods=['GET', 'POST'])
# def login():
#     if 'user_id' in session:
#         return redirect(url_for('dashboard'))
    
#     if request.method == 'POST':
#         username = request.form['username']
#         password = request.form['password']
#         role = request.form['role']
        
#         print("Form data received:")
#         print(f"Username: {username}")
#         print(f"Password: {password}")
#         print(f"Role: {role}")
        
#         # Direct credential check
#         if username == "admin2" and password == "adminpass2" and role == "admin":
#             print("Credentials matched!")
#             session['user_id'] = "A002"
#             session['username'] = "admin2"
#             session['role'] = "admin"
#             session['branches'] = ["all"]
#             return redirect(url_for('dashboard'))
        
#         print("Authentication failed")
#         flash('Invalid credentials')
#     return render_template('login.html')



@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role']
        
        if role == 'admin':
            users = load_admins()
            if any(user['username'] == username for user in users):
                flash('Username already exists')
                return render_template('signup.html')
            
            new_user = {
                "username": username,
                "admin_id": f"A{str(len(users) + 1).zfill(3)}",
                "password": password,
                "role": "admin",
                "branches": ["all"]
            }
            users.append(new_user)
            save_admins(users)
            
        else:
            users = load_teachers()
            if any(user['username'] == username for user in users):
                flash('Username already exists')
                return render_template('signup.html')
            
            branches = request.form.getlist('branches')
            if not branches:
                flash('Please select at least one branch')
                return render_template('signup.html')
            
            new_user = {
                "username": username,
                "teacher_id": f"T{str(len(users) + 1).zfill(3)}",
                "password": password,
                "role": "teacher",
                "branches": branches
            }
            users.append(new_user)
            save_teachers(users)
        
        flash('Account created successfully')
        return redirect(url_for('login'))
    
    return render_template('signup.html')

# @app.route('/dashboard')
# @login_required
# def dashboard():
#     if 'user_id' not in session:
#         return redirect(url_for('login'))
#     return render_template('dashboard.html')


@app.route('/dashboard')
@login_required
def dashboard():
    branches = []
    if session['role'] == 'admin':
        # Get all branches from student_database directory
        branches = [d for d in os.listdir('project/student_database') if os.path.isdir(os.path.join('project/student_database', d))]
    else:
        # Get only assigned branches for teacher
        branches = session['branches']
    
    return render_template('dashboard.html', branches=branches)

@app.route('/branch/<branch_name>')
@login_required
def view_branch(branch_name):
    # Convert spaces to underscores in branch name
    branch_path = branch_name.replace(' ', '_')
    path = f'project/student_database/{branch_path}'
    years = [d for d in os.listdir(path) if os.path.isdir(os.path.join(path, d))]
    return render_template('branch.html', branch=branch_name, years=years)

@app.route('/branch/<branch_name>/<year>')
@login_required
def view_year(branch_name, year):
    if branch_name == "All Branches":
        # Get students from all accessible branches
        if session['role'] == 'admin':
            branches = [d for d in os.listdir('project/student_database') 
                       if os.path.isdir(os.path.join('project/student_database', d))]
        else:
            branches = [branch.replace(' ', '_') for branch in session.get('branches', [])]
        
        students = []
        for branch in branches:
            branch_path = f'project/student_database/{branch}/{year}'
            if os.path.exists(branch_path):
                for enrollment in os.listdir(branch_path):
                    details_path = os.path.join(branch_path, enrollment, 'details.json')
                    if os.path.exists(details_path):
                        with open(details_path, 'r') as f:
                            student_details = json.load(f)
                            students.append(student_details)
    else:
        # Get students from specific branch
        branch_path = branch_name.replace(' ', '_')
        path = f'project/student_database/{branch_path}/{year}'
        students = []
        for enrollment in os.listdir(path):
            details_path = os.path.join(path, enrollment, 'details.json')
            if os.path.exists(details_path):
                with open(details_path, 'r') as f:
                    student_details = json.load(f)
                    students.append(student_details)
    
    return render_template('students.html', branch=branch_name, year=year, students=students)


@app.route('/api/student_files/<branch>/<year>/<enrollment>')
@login_required
def get_student_files(branch, year, enrollment):
    student_path = f'project/student_database/{branch}/{year}/{enrollment}'
    
    files = {
        'assignments': os.listdir(os.path.join(student_path, 'assignments')),
        'projects': os.listdir(os.path.join(student_path, 'projects')),
        'reports': os.listdir(os.path.join(student_path, 'reports'))
    }
    
    return jsonify(files)

@app.route('/download/<path:filename>')
@login_required
def download_file(filename):
    return send_from_directory('project/student_database', filename, as_attachment=True)



@app.route('/students')
@login_required
def all_students():
    if session['role'] == 'admin':
        branches = [d for d in os.listdir('project/student_database') 
                   if os.path.isdir(os.path.join('project/student_database', d))]
        current_branch = "All Branches"
        current_year = "All Years"
    else:
        # For teachers, show only their assigned branches
        branches = [branch.replace(' ', '_') for branch in session.get('branches', [])]
        current_branch = branches[0] if branches else ""  # Show first assigned branch
        current_year = "Current Year"  # Or fetch specific year
    
    students = []
    for branch in branches:
        branch_path = f'project/student_database/{branch}'
        years = [y for y in os.listdir(branch_path) 
                if os.path.isdir(os.path.join(branch_path, y))]
        
        for year in years:
            year_path = os.path.join(branch_path, year)
            for enrollment in os.listdir(year_path):
                details_path = os.path.join(year_path, enrollment, 'details.json')
                if os.path.exists(details_path):
                    with open(details_path, 'r') as f:
                        student_details = json.load(f)
                        students.append(student_details)
    
    return render_template('students.html', 
                         students=students,
                         branch=current_branch,
                         year=current_year)




@app.route('/student/<enrollment>/<branch>/<year>')
@login_required
def student_full_view(enrollment, branch, year):
    # Convert spaces to underscores in branch name
    branch_path = branch.replace(' ', '_')
    student_path = f'project/student_database/{branch_path}/{year}/{enrollment}'
    
    # Load student details
    with open(os.path.join(student_path, 'details.json'), 'r') as f:
        student = json.load(f)
    
    # Get files from each directory
    assignments = os.listdir(os.path.join(student_path, 'assignments'))
    projects = os.listdir(os.path.join(student_path, 'projects'))
    reports = os.listdir(os.path.join(student_path, 'reports'))
    
    return render_template('student_full_view.html',
                         student=student,
                         assignments=assignments,
                         projects=projects,
                         reports=reports)


@app.route('/upload', methods=['GET'])
@login_required
def upload_page():
    branches = session.get('branches', []) if session['role'] == 'teacher' else ['All Branches']
    return render_template('upload.html', branches=branches)

@app.route('/get_students/<branch>/<year>')
@login_required
def get_students(branch, year):
    student_path = f'project/student_database/{branch}/{year}'
    students = []
    for enrollment in os.listdir(student_path):
        with open(os.path.join(student_path, enrollment, 'details.json')) as f:
            student_data = json.load(f)
            students.append({
                'enrollment': enrollment,
                'name': student_data['personal_info']['name']
            })
    return jsonify(students)

@app.route('/upload/files', methods=['POST'])
@login_required
def upload_files():
    enrollment = request.form.get('enrollment')
    section = request.form.get('section')  # assignments, projects, or reports
    files = request.files.getlist('files')
    
    student_path = f'project/student_database/{enrollment}/{section}'
    
    uploaded_files = []
    for file in files:
        if file and file.filename:
            from werkzeug.utils import secure_filename

            filename = secure_filename(file.filename)
            file.save(os.path.join(student_path, filename))
            uploaded_files.append(filename)
    
    return jsonify({
        'success': True,
        'files': uploaded_files
    })

@app.route('/student/<branch>/<year>/<enrollment>')
@login_required
def view_student(branch, year, enrollment):
    student_path = f'project/student_database/{branch}/{year}/{enrollment}'
    
    # Load student details
    with open(os.path.join(student_path, 'details.json'), 'r') as f:
        details = json.load(f)
    
    # Get files from different folders
    assignments = os.listdir(os.path.join(student_path, 'assignments'))
    projects = os.listdir(os.path.join(student_path, 'projects'))
    reports = os.listdir(os.path.join(student_path, 'reports'))
    
    return render_template('student_details.html', 
                         student=details, 
                         assignments=assignments,
                         projects=projects,
                         reports=reports)




@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)
