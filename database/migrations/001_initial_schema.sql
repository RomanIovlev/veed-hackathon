-- Initial database schema for CareLearn Training Platform
-- Run this script on your cloud PostgreSQL database

-- Create training_documents table
CREATE TABLE IF NOT EXISTS training_documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  categories TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{en}',
  cover_image_url TEXT,
  assigned_to_groups TEXT[] DEFAULT '{}',
  duration INTEGER DEFAULT 10,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create video_scripts table
CREATE TABLE IF NOT EXISTS video_scripts (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES training_documents(id) ON DELETE CASCADE,
  video_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  hook TEXT,
  script TEXT,
  call_to_action TEXT,
  duration INTEGER,
  priority INTEGER DEFAULT 1,
  key_learning_points JSONB DEFAULT '[]',
  content_blocks JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique video numbers per document
  UNIQUE(document_id, video_number)
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  training_id INTEGER REFERENCES training_documents(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure correct_index is valid
  CHECK (correct_index >= 0)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'worker',
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure valid roles
  CHECK (role IN ('worker', 'manager', 'admin'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_documents_categories ON training_documents USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_training_documents_assigned_groups ON training_documents USING GIN (assigned_to_groups);
CREATE INDEX IF NOT EXISTS idx_video_scripts_document_id ON video_scripts (document_id);
CREATE INDEX IF NOT EXISTS idx_video_scripts_category ON video_scripts (category);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_training_id ON quiz_questions (training_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users (department);

-- Insert sample data
INSERT INTO users (name, email, role, department) VALUES
  ('John Manager', 'john.manager@company.com', 'manager', 'Operations'),
  ('Sarah Smith', 'sarah.smith@company.com', 'worker', 'Nursing'),
  ('Mike Johnson', 'mike.johnson@company.com', 'worker', 'Administration'),
  ('Emma Wilson', 'emma.wilson@company.com', 'worker', 'Nursing'),
  ('David Brown', 'david.brown@company.com', 'admin', 'IT')
ON CONFLICT (email) DO NOTHING;

-- Insert sample training documents
INSERT INTO training_documents (title, description, categories, duration, notes) VALUES
  (
    'Hand Hygiene Best Practices', 
    'Essential hand hygiene protocols for healthcare workers',
    ARRAY['Healthcare', 'Safety', 'Infection Control'],
    15,
    'Critical training for all healthcare staff'
  ),
  (
    'Patient Communication Skills',
    'Effective communication strategies for patient interactions',
    ARRAY['Communication', 'Patient Care'],
    20,
    'Soft skills development for healthcare professionals'
  ),
  (
    'Emergency Response Procedures',
    'Standard operating procedures for medical emergencies',
    ARRAY['Emergency', 'Safety', 'Procedures'],
    25,
    'Mandatory annual training'
  )
ON CONFLICT DO NOTHING;

-- Verify tables were created
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('training_documents', 'video_scripts', 'quiz_questions', 'users')
ORDER BY tablename;