-- Complete SQL schema for the meetings database
-- Run this in your MySQL database

-- Create the database if it doesn't exist
-- CREATE DATABASE IF NOT EXISTS meetings;
-- USE meetings;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- User Roles (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT,
    role_id INT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Committees table
CREATE TABLE IF NOT EXISTS committees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- Committee Members (many-to-many)
CREATE TABLE IF NOT EXISTS committee_members (
    committee_id INT,
    user_id INT,
    PRIMARY KEY (committee_id, user_id),
    FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    committee_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at DATETIME,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT,
    user_id INT,
    status ENUM('present', 'absent', 'excused') DEFAULT 'present',
    checked_in_at DATETIME,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Agenda Items table
CREATE TABLE IF NOT EXISTS agenda_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT,
    title VARCHAR(255),
    description TEXT,
    position INT,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT,
    filename VARCHAR(255),
    url VARCHAR(255),
    uploaded_by INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Votes table (with 'opt' column as requested)
CREATE TABLE IF NOT EXISTS votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT,
    user_id INT,
    opt VARCHAR(255),  -- Changed from 'option' to 'opt'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT,
    message TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT,
    user_id INT,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT,
    assigned_to INT,
    description TEXT,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample data
-- Roles
INSERT IGNORE INTO roles (name) VALUES ('admin'), ('member'), ('guest');

-- Users
INSERT IGNORE INTO users (email, password_hash, name) VALUES
('ada@demo.gr', 'hashed_pw1', 'Ada'),
('admin@demo.gr', 'hashed_admin', 'Admin User'),
('member@demo.gr', 'hashed_member', 'Member User');

-- User Roles
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES
(1, 1), -- Ada is admin
(2, 1), -- Admin is admin
(3, 2); -- Member is member

-- Committees
INSERT IGNORE INTO committees (name, description) VALUES
('Tech Committee', 'Handles all technology matters'),
('Finance Committee', 'Manages financial oversight'),
('Planning Committee', 'Strategic planning and development');

-- Committee Members
INSERT IGNORE INTO committee_members (committee_id, user_id) VALUES
(1, 1), (1, 2), -- Ada and Admin in Tech
(2, 3),         -- Member in Finance
(3, 1), (3, 3); -- Ada and Member in Planning

-- Sample Meetings
INSERT IGNORE INTO meetings (committee_id, title, description, scheduled_at, created_by) VALUES
(1, 'Tech Kickoff Meeting', 'First technology committee meeting', '2025-09-25 10:00:00', 1),
(2, 'Finance Review Q3', 'Quarterly financial review', '2025-09-26 14:00:00', 3),
(3, 'Strategic Planning Session', 'Annual planning meeting', '2025-09-27 09:00:00', 1);

-- Sample Votes
INSERT IGNORE INTO votes (meeting_id, user_id, opt) VALUES
(1, 1, 'yes'), 
(1, 2, 'no'), 
(2, 3, 'yes');

-- Sample Comments
INSERT IGNORE INTO comments (meeting_id, user_id, message) VALUES
(1, 2, 'Looking forward to this technology discussion!'),
(2, 3, 'The budget numbers look good for this quarter.');

-- Sample Announcements
INSERT IGNORE INTO announcements (meeting_id, message, created_by) VALUES
(1, 'Welcome to the technology committee! Please bring your laptops.', 1),
(2, 'Finance meeting will include budget presentation.', 3);

-- Sample Tasks
INSERT IGNORE INTO tasks (meeting_id, assigned_to, description, status) VALUES
(1, 2, 'Prepare technology roadmap presentation', 'pending'),
(2, 3, 'Send quarterly budget report to all members', 'in_progress'),
(3, 1, 'Draft strategic plan outline', 'pending');