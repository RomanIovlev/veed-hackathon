-- Training Hackathon Local Database Schema
-- PostgreSQL database schema for the training platform

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (staff members)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(100) NOT NULL,
    language_code VARCHAR(10) DEFAULT 'en',
    flag VARCHAR(10) DEFAULT '🇬🇧',
    pin VARCHAR(10) DEFAULT '0000',
    completed_trainings INTEGER DEFAULT 0,
    assigned_trainings INTEGER DEFAULT 0,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training documents table
CREATE TABLE IF NOT EXISTS training_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    categories TEXT[], -- Array of category strings
    languages TEXT[], -- Array of language codes
    cover_image_url TEXT,
    assigned_to_groups TEXT[], -- Array of user group IDs
    duration INTEGER DEFAULT 10,
    status VARCHAR(50) DEFAULT 'Active',
    due_date DATE,
    notes TEXT,
    document_type VARCHAR(50) DEFAULT 'training',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video scripts table (topics within trainings)
CREATE TABLE IF NOT EXISTS video_scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES training_documents(id) ON DELETE CASCADE,
    video_number INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(255) NOT NULL,
    hook TEXT,
    script TEXT,
    call_to_action TEXT,
    duration VARCHAR(50),
    priority VARCHAR(50),
    key_learning_points JSONB,
    content_blocks JSONB, -- Store image, video, quiz blocks
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, video_number)
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    training_id UUID REFERENCES training_documents(id) ON DELETE CASCADE,
    script_id UUID REFERENCES video_scripts(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of option strings
    correct_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User training assignments table
CREATE TABLE IF NOT EXISTS user_training_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    training_id UUID REFERENCES training_documents(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    score INTEGER,
    status VARCHAR(50) DEFAULT 'assigned', -- assigned, in_progress, completed
    UNIQUE(user_id, training_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_documents_created_at ON training_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_video_scripts_document_id ON video_scripts(document_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_training_id ON quiz_questions(training_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_user_id ON user_training_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_training_id ON user_training_assignments(training_id);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_training_documents_updated_at 
    BEFORE UPDATE ON training_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();