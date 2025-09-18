-- Step 1: Extend agenda_items table
-- Current structure: id, meeting_id, title, description, position
-- Need to add: category, presenter, estimated_duration, status, introduction_file, decision_file, created_at, updated_at
-- Also rename position to order_index for consistency

-- Add new columns to agenda_items table
ALTER TABLE agenda_items 
ADD COLUMN category VARCHAR(100) AFTER description,
ADD COLUMN presenter VARCHAR(200) AFTER category,
ADD COLUMN estimated_duration INT COMMENT 'Duration in minutes' AFTER presenter,
ADD COLUMN status ENUM('pending', 'in_progress', 'completed', 'deferred') DEFAULT 'pending' AFTER estimated_duration,
ADD COLUMN introduction_file VARCHAR(500) AFTER status,
ADD COLUMN decision_file VARCHAR(500) AFTER introduction_file,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER decision_file,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Rename position column to order_index for consistency
ALTER TABLE agenda_items 
CHANGE COLUMN position order_index INT NOT NULL;

-- Add index for better performance on meeting queries
CREATE INDEX IF NOT EXISTS idx_meeting_order ON agenda_items (meeting_id, order_index);

-- Add foreign key constraint if not exists
ALTER TABLE agenda_items 
ADD CONSTRAINT fk_agenda_meeting 
FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE;