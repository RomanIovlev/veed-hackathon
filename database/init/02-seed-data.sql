-- Seed data for Training Hackathon Local Database

-- Insert users (staff members)
INSERT INTO users (id, name, email, role, language_code, flag, pin, completed_trainings, assigned_trainings, last_active) VALUES
(1, 'Maria Santos', 'maria@care.nl', 'Carer', 'tl', '🇵🇭', '1234', 2, 3, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(2, 'Ana Popescu', 'ana@care.nl', 'Senior Carer', 'ro', '🇷🇴', '2345', 3, 3, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(3, 'Dariya Kovalenko', 'dariya@care.nl', 'Nurse', 'uk', '🇺🇦', '3456', 1, 3, CURRENT_TIMESTAMP - INTERVAL '3 hours'),
(4, 'Jan de Vries', 'jan@care.nl', 'Manager', 'nl', '🇳🇱', '4567', 3, 3, CURRENT_TIMESTAMP),
(5, 'Fatima Zahra', 'fatima@care.nl', 'Carer', 'ar', '🇸🇦', '5678', 0, 3, CURRENT_TIMESTAMP - INTERVAL '4 days');

-- Insert demo training documents
INSERT INTO training_documents (id, title, description, categories, languages, assigned_to_groups, duration, status, due_date, notes) VALUES
(
    uuid_generate_v4(),
    'Hand Hygiene Protocol',
    'Essential hand washing and sanitization procedures for infection prevention. This training covers the WHO 5 Moments for Hand Hygiene, proper handwashing technique, when to use alcohol-based hand rub, and common mistakes to avoid.',
    ARRAY['Infection Control', 'Patient Safety'],
    ARRAY['en', 'ro', 'tl', 'uk'],
    ARRAY['carer', 'senior-carer', 'nurse'],
    12,
    'Active',
    CURRENT_DATE + INTERVAL '30 days',
    'Ensure you wash your hands for at least 20 seconds. Focus on the areas between fingers and under nails. Hand sanitizer is not a replacement for soap and water when hands are visibly soiled.'
),
(
    uuid_generate_v4(),
    'Manual Handling Techniques',
    'Proper lifting, moving, and positioning of patients to prevent injury to both patients and healthcare workers. Learn about risk assessment, mechanical aids, team lifting techniques, and injury prevention strategies.',
    ARRAY['Patient Handling', 'Health & Safety'],
    ARRAY['en', 'nl', 'tl'],
    ARRAY['carer', 'senior-carer', 'nurse'],
    18,
    'Active',
    CURRENT_DATE + INTERVAL '45 days',
    'Always assess the load before lifting. Use mechanical aids whenever possible. Never lift a patient alone if they cannot support their own weight.'
);

-- Store the generated UUIDs in variables for subsequent inserts
DO $$
DECLARE
    hand_hygiene_id UUID;
    manual_handling_id UUID;
BEGIN
    -- Get the UUIDs of the trainings we just inserted
    SELECT id INTO hand_hygiene_id FROM training_documents WHERE title = 'Hand Hygiene Protocol';
    SELECT id INTO manual_handling_id FROM training_documents WHERE title = 'Manual Handling Techniques';
    
    -- Insert video scripts for Hand Hygiene Protocol
    INSERT INTO video_scripts (document_id, video_number, title, category, hook, script, call_to_action, duration, priority, key_learning_points, content_blocks) VALUES
    (
        hand_hygiene_id,
        1,
        'Introduction to Hand Hygiene',
        'Infection Control',
        'Did you know that proper hand hygiene can prevent up to 80% of healthcare-associated infections?',
        '[VISUAL: Healthcare worker washing hands]\n\nNARRATOR: Hand hygiene is the single most important measure to prevent the spread of infections in healthcare settings. Today we''ll learn the essential steps that protect both patients and healthcare workers.\n\n[VISUAL: Infection transmission diagram]\n\nEvery day, healthcare workers'' hands come into contact with countless surfaces and patients. Without proper hygiene, these hands become vehicles for dangerous pathogens.',
        'Remember: Clean hands save lives. Make hand hygiene your priority.',
        '3 minutes',
        'High',
        '["Understand the importance of hand hygiene", "Learn when hand hygiene is required", "Recognize the consequences of poor hand hygiene"]'::jsonb,
        '[{"type": "quiz", "value": "", "quiz": []}]'::jsonb
    ),
    (
        hand_hygiene_id,
        2,
        'Handwashing Technique',
        'Infection Control',
        'The difference between adequate and excellent hand hygiene lies in the technique.',
        '[VISUAL: Step-by-step handwashing demonstration]\n\nNARRATOR: Follow these essential steps for effective handwashing:\n\n1. Wet your hands with clean, running water\n2. Apply soap and lather well\n3. Scrub all surfaces for at least 20 seconds\n\n[VISUAL: Close-up of scrubbing technique]\n\nPay special attention to areas often missed: between fingers, under nails, thumbs, and wrists.\n\n[VISUAL: Proper drying technique]\n\n4. Rinse thoroughly\n5. Dry with a clean towel or air dry',
        'Practice makes perfect. Master this technique and use it consistently.',
        '4 minutes',
        'High',
        '["Master the 6-step handwashing technique", "Understand proper timing and duration", "Identify commonly missed areas"]'::jsonb,
        '[{"type": "quiz", "value": "", "quiz": []}]'::jsonb
    );
    
    -- Insert video scripts for Manual Handling Techniques
    INSERT INTO video_scripts (document_id, video_number, title, category, hook, script, call_to_action, duration, priority, key_learning_points, content_blocks) VALUES
    (
        manual_handling_id,
        1,
        'Principles of Safe Manual Handling',
        'Patient Handling',
        'Back injuries account for over 40% of healthcare worker injuries. Learn how to protect yourself.',
        '[VISUAL: Healthcare worker assessing a patient]\n\nNARRATOR: Before any manual handling task, always start with assessment. Consider the patient''s mobility, weight, and any medical conditions that might affect the transfer.\n\n[VISUAL: Risk assessment checklist]\n\nAsk yourself: Can the patient help? Do I need assistance? What equipment is available?\n\n[VISUAL: Proper lifting posture demonstration]\n\nRemember the golden rule: keep your back straight, bend your knees, and keep the load close to your body.',
        'Always assess before you act. Your safety and the patient''s safety depend on it.',
        '5 minutes',
        'High',
        '["Conduct proper risk assessment", "Understand body mechanics", "Know when to seek assistance"]'::jsonb,
        '[{"type": "quiz", "value": "", "quiz": []}]'::jsonb
    );
    
    -- Insert quiz questions for Hand Hygiene Protocol
    INSERT INTO quiz_questions (training_id, question_text, options, correct_index) VALUES
    (hand_hygiene_id, 'How long should you scrub your hands with soap?', '["5 seconds", "10 seconds", "20 seconds", "1 minute"]'::jsonb, 2),
    (hand_hygiene_id, 'When should you wash your hands?', '["Only before meals", "Before and after patient contact", "Only when visibly dirty", "Once per shift"]'::jsonb, 1),
    (hand_hygiene_id, 'What is the correct water temperature for handwashing?', '["Cold", "Lukewarm", "Very hot", "It doesn''t matter"]'::jsonb, 1),
    (hand_hygiene_id, 'Which area is most commonly missed during handwashing?', '["Palms", "Between fingers and thumbs", "Wrists", "Back of hand"]'::jsonb, 1),
    (hand_hygiene_id, 'Can hand sanitizer replace soap and water?', '["Always", "Never", "Only when hands are not visibly soiled", "Only in emergencies"]'::jsonb, 2);
    
    -- Insert quiz questions for Manual Handling Techniques
    INSERT INTO quiz_questions (training_id, question_text, options, correct_index) VALUES
    (manual_handling_id, 'What should you do before lifting a patient?', '["Start lifting immediately", "Assess the load and plan", "Call a doctor", "Skip if in a hurry"]'::jsonb, 1),
    (manual_handling_id, 'What is the correct posture for lifting?', '["Bend at the waist", "Keep back straight, bend knees", "Twist while lifting", "Lean forward"]'::jsonb, 1),
    (manual_handling_id, 'When should you use a hoist?', '["Never", "Only for heavy patients", "When a patient cannot support their weight", "Only during the day"]'::jsonb, 2),
    (manual_handling_id, 'How many people are needed for a two-person lift?', '["1", "2", "3", "4"]'::jsonb, 1),
    (manual_handling_id, 'What is the first step in moving a patient?', '["Grab and pull", "Communicate with the patient", "Call a supervisor", "Check the floor"]'::jsonb, 1);
    
    -- Assign trainings to users
    INSERT INTO user_training_assignments (user_id, training_id, status) 
    SELECT u.id, hand_hygiene_id, 'assigned' FROM users u WHERE u.role IN ('Carer', 'Senior Carer', 'Nurse');
    
    INSERT INTO user_training_assignments (user_id, training_id, status) 
    SELECT u.id, manual_handling_id, 'assigned' FROM users u WHERE u.role IN ('Carer', 'Senior Carer', 'Nurse');
    
END $$;