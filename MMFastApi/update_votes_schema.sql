-- Updated SQL schema with 'opt' column for votes table
-- Run this to update your existing schema or create a fresh one

-- Drop and recreate the votes table with 'opt' column
DROP TABLE IF EXISTS votes;

CREATE TABLE votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT,
    user_id INT,
    opt VARCHAR(255),  -- Changed from 'option' to 'opt'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Updated sample data for votes with 'opt' column
INSERT INTO votes (meeting_id, user_id, opt) VALUES
(1, 1, 'yes'), (1, 2, 'no'), (2, 3, 'yes');