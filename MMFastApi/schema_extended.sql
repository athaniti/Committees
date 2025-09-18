-- Extended MySQL Schema for Meetings Management System
-- Supporting detailed meeting view with agenda items, voting results, and comments

-- Existing tables (already created)
-- committees, meetings, votes, users

-- Update meetings table to include location and status
ALTER TABLE meetings 
ADD COLUMN location VARCHAR(255) DEFAULT 'Αίθουσα Δημοτικού Συμβουλίου',
ADD COLUMN status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled';

-- Create agenda_items table
CREATE TABLE IF NOT EXISTS agenda_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT NOT NULL,
    order_index INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    presenter VARCHAR(200),
    estimated_duration INT, -- in minutes
    status ENUM('pending', 'in_progress', 'completed', 'deferred') DEFAULT 'pending',
    introduction_file VARCHAR(500),
    decision_file VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    INDEX idx_meeting_order (meeting_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vote_results table (for agenda item voting results)
CREATE TABLE IF NOT EXISTS vote_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agenda_item_id INT NOT NULL,
    votes_for INT DEFAULT 0,
    votes_against INT DEFAULT 0,
    votes_abstain INT DEFAULT 0,
    total_votes INT DEFAULT 0,
    result ENUM('approved', 'rejected', 'no_quorum') NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (agenda_item_id) REFERENCES agenda_items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_agenda_vote (agenda_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create agenda_comments table
CREATE TABLE IF NOT EXISTS agenda_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agenda_item_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (agenda_item_id) REFERENCES agenda_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_agenda_comments (agenda_item_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample agenda items for demo
INSERT INTO agenda_items (meeting_id, order_index, title, description, category, presenter, estimated_duration, status, introduction_file, decision_file) VALUES
(1, 1, 'Έγκριση Προϋπολογισμού 2025', 'Συζήτηση και έγκριση του προϋπολογισμού για το επόμενο έτος', 'Οικονομικά', 'Αντιδήμαρχος Οικονομικών', 45, 'completed', 'eisigisi_proypologismos_2025.pdf', 'apofasi_proypologismos_2025.pdf'),
(1, 2, 'Αδειοδότηση Νέου Καταστήματος', 'Εξέταση αίτησης για άδεια λειτουργίας καταστήματος εστίασης', 'Αδειοδοτήσεις', 'Προϊστάμενος Τμήματος', 20, 'in_progress', 'aitisi_adeias_estiasis.pdf', NULL),
(1, 3, 'Κυκλοφοριακές Ρυθμίσεις Κέντρου', 'Προτάσεις για βελτίωση της κυκλοφορίας στο ιστορικό κέντρο', 'Κυκλοφορία', 'Τμήμα Κυκλοφορίας', 30, 'pending', 'meleti_kykloforias.pdf', NULL);

-- Insert sample vote results
INSERT INTO vote_results (agenda_item_id, votes_for, votes_against, votes_abstain, total_votes, result) VALUES
(1, 12, 3, 2, 17, 'approved');

-- Insert sample comments
INSERT INTO agenda_comments (agenda_item_id, user_id, comment) VALUES
(1, 1, 'Θα πρέπει να εξετάσουμε προσεκτικότερα τον κονδύλιο για τις παιδικές χαρές.');

-- Update meetings table with location and status for existing records
UPDATE meetings SET 
    location = 'Αίθουσα Δημοτικού Συμβουλίου',
    status = 'scheduled'
WHERE location IS NULL OR status IS NULL;