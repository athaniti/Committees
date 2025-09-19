-- Update files table schema to support new file management features

-- First, backup existing data if any
CREATE TABLE IF NOT EXISTS files_backup AS SELECT * FROM files;

-- Drop the existing files table
DROP TABLE IF EXISTS files;

-- Create the new files table with all the new fields
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id INTEGER NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NULL,
    url VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NULL,
    uploaded_by INTEGER NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    size INTEGER NULL,
    file_type VARCHAR(100) NULL,
    description TEXT NULL,
    category VARCHAR(50) DEFAULT 'general',
    tags TEXT NULL,
    download_count INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 1,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_files_category ON files(category);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_meeting_id ON files(meeting_id);
CREATE INDEX idx_files_is_public ON files(is_public);

-- Insert some sample data for testing
INSERT INTO files (
    filename, 
    original_name, 
    url, 
    uploaded_by, 
    size, 
    file_type, 
    description, 
    category, 
    tags, 
    download_count, 
    is_public
) VALUES 
(
    'sample_meeting_minutes.pdf',
    'Πρακτικά Συνεδρίασης Σεπτεμβρίου 2025.pdf',
    '/uploads/sample_meeting_minutes.pdf',
    1,
    2485760,
    'application/pdf',
    'Πρακτικά της τακτικής συνεδρίασης του Διοικητικού Συμβουλίου',
    'meetings',
    '["πρακτικά", "συνεδρίαση", "διοικητικό"]',
    23,
    1
),
(
    'annual_report_2024.docx',
    'Ετήσια Έκθεση 2024.docx',
    '/uploads/annual_report_2024.docx',
    1,
    5242880,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Αναλυτική ετήσια έκθεση δραστηριοτήτων και οικονομικών στοιχείων',
    'reports',
    '["έκθεση", "ετήσια", "οικονομικά"]',
    45,
    1
),
(
    'budget_proposal_2026.xlsx',
    'Πρόταση Προϋπολογισμού 2026.xlsx',
    '/uploads/budget_proposal_2026.xlsx',
    1,
    1048576,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Προτεινόμενος προϋπολογισμός για το έτος 2026',
    'documents',
    '["προϋπολογισμός", "2026", "οικονομικά"]',
    12,
    0
),
(
    'committee_photo_2025.jpg',
    'Φωτογραφία Επιτροπής 2025.jpg',
    '/uploads/committee_photo_2025.jpg',
    1,
    3145728,
    'image/jpeg',
    'Ομαδική φωτογραφία των μελών της επιτροπής',
    'images',
    '["φωτογραφία", "επιτροπή", "μέλη"]',
    8,
    1
),
(
    'training_video.mp4',
    'Εκπαιδευτικό Βίντεο Διαδικασιών.mp4',
    '/uploads/training_video.mp4',
    1,
    52428800,
    'video/mp4',
    'Εκπαιδευτικό βίντεο για τις νέες διαδικασίες',
    'videos',
    '["εκπαίδευση", "διαδικασίες", "βίντεο"]',
    15,
    1
);

-- Verify the data was inserted correctly
SELECT 
    id,
    filename,
    original_name,
    category,
    size,
    download_count,
    is_public
FROM files
ORDER BY id;