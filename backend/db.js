import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'training_user',
  password: process.env.DB_PASSWORD || 'training_pass',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'training_db',
};

// Create a connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(1);
});

// Database helper functions
export const db = {
  // Generic query function
  async query(text, params) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Get all training documents
  async getTrainingDocuments() {
    const query = `
      SELECT 
        td.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', vs.id,
              'video_number', vs.video_number,
              'title', vs.title,
              'category', vs.category,
              'hook', vs.hook,
              'script', vs.script,
              'call_to_action', vs.call_to_action,
              'duration', vs.duration,
              'priority', vs.priority,
              'key_learning_points', vs.key_learning_points,
              'content_blocks', vs.content_blocks
            ) ORDER BY vs.video_number
          ) FILTER (WHERE vs.id IS NOT NULL), 
          '[]'
        ) as video_scripts,
        COALESCE(
          json_agg(
            json_build_object(
              'id', qq.id,
              'text', qq.question_text,
              'options', qq.options,
              'correctIndex', qq.correct_index
            )
          ) FILTER (WHERE qq.id IS NOT NULL),
          '[]'
        ) as questions
      FROM training_documents td
      LEFT JOIN video_scripts vs ON td.id = vs.document_id
      LEFT JOIN quiz_questions qq ON td.id = qq.training_id
      GROUP BY td.id
      ORDER BY td.created_at DESC
    `;
    
    const result = await this.query(query);
    return result.rows;
  },

  // Get single training document
  async getTrainingDocument(id) {
    const query = `
      SELECT 
        td.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', vs.id,
              'video_number', vs.video_number,
              'title', vs.title,
              'category', vs.category,
              'hook', vs.hook,
              'script', vs.script,
              'call_to_action', vs.call_to_action,
              'duration', vs.duration,
              'priority', vs.priority,
              'key_learning_points', vs.key_learning_points,
              'content_blocks', vs.content_blocks
            ) ORDER BY vs.video_number
          ) FILTER (WHERE vs.id IS NOT NULL), 
          '[]'
        ) as video_scripts
      FROM training_documents td
      LEFT JOIN video_scripts vs ON td.id = vs.document_id
      WHERE td.id = $1
      GROUP BY td.id
    `;
    
    const result = await this.query(query, [id]);
    return result.rows[0] || null;
  },

  // Create new training document
  async createTrainingDocument(data) {
    const {
      title,
      description = '',
      categories = [],
      languages = ['en'],
      coverImageUrl = null,
      assignedToGroups = [],
      duration = 10,
      notes = ''
    } = data;

    const query = `
      INSERT INTO training_documents (
        title, description, categories, languages, cover_image_url, 
        assigned_to_groups, duration, notes
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
    
    const result = await this.query(query, [
      title, description, categories, languages, coverImageUrl,
      assignedToGroups, duration, notes
    ]);
    
    return result.rows[0];
  },

  // Update training document
  async updateTrainingDocument(id, data) {
    const {
      title,
      description,
      categories,
      languages,
      coverImageUrl,
      assignedToGroups,
      duration,
      notes
    } = data;

    const query = `
      UPDATE training_documents 
      SET title = $2, description = $3, categories = $4, languages = $5,
          cover_image_url = $6, assigned_to_groups = $7, duration = $8, notes = $9,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await this.query(query, [
      id, title, description, categories, languages, coverImageUrl,
      assignedToGroups, duration, notes
    ]);
    
    return result.rows[0];
  },

  // Create video script
  async createVideoScript(data) {
    const {
      documentId,
      videoNumber,
      title,
      category,
      hook = null,
      script = null,
      callToAction = null,
      duration = null,
      priority = null,
      keyLearningPoints = [],
      contentBlocks = []
    } = data;

    const query = `
      INSERT INTO video_scripts (
        document_id, video_number, title, category, hook, script,
        call_to_action, duration, priority, key_learning_points, content_blocks
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *
    `;
    
    const result = await this.query(query, [
      documentId, videoNumber, title, category, hook, script,
      callToAction, duration, priority, JSON.stringify(keyLearningPoints),
      JSON.stringify(contentBlocks)
    ]);
    
    return result.rows[0];
  },

  // Update video script
  async updateVideoScript(id, data) {
    const {
      title,
      category,
      hook,
      script,
      callToAction,
      duration,
      priority,
      keyLearningPoints,
      contentBlocks
    } = data;

    const query = `
      UPDATE video_scripts 
      SET title = $2, category = $3, hook = $4, script = $5,
          call_to_action = $6, duration = $7, priority = $8,
          key_learning_points = $9, content_blocks = $10
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await this.query(query, [
      id, title, category, hook, script, callToAction,
      duration, priority, JSON.stringify(keyLearningPoints),
      JSON.stringify(contentBlocks)
    ]);
    
    return result.rows[0];
  },

  // Delete training document (video_scripts will be deleted via CASCADE)
  async deleteTrainingDocument(id) {
    const query = 'DELETE FROM training_documents WHERE id = $1 RETURNING id';
    const result = await this.query(query, [id]);
    return result.rowCount > 0;
  },

  // Delete video scripts by document ID
  async deleteVideoScriptsByDocumentId(documentId) {
    const query = 'DELETE FROM video_scripts WHERE document_id = $1';
    const result = await this.query(query, [documentId]);
    return result.rowCount;
  },

  // Get all users
  async getUsers() {
    const query = 'SELECT * FROM users ORDER BY name';
    const result = await this.query(query);
    return result.rows;
  },

  // Authenticate user by name and PIN
  async authenticateUser(name, pin) {
    const query = 'SELECT * FROM users WHERE name = $1 AND pin = $2';
    const result = await this.query(query, [name, pin]);
    return result.rows[0] || null;
  },

  // Get trainings assigned to a user based on their group membership
  async getUserAssignedTrainings(userId) {
    try {
      // First, get the user's groups
      const userQuery = 'SELECT user_groups FROM users WHERE id = $1';
      const userResult = await this.query(userQuery, [userId]);
      
      if (!userResult.rows.length) {
        return [];
      }
      
      const userGroups = userResult.rows[0].user_groups || [];
      console.log(`👤 User ${userId} groups:`, userGroups);
      
      // Then get trainings assigned to any of the user's groups
      const trainingsQuery = `
        SELECT 
          td.id,
          td.title,
          td.description,
          td.categories,
          td.cover_image_url,
          td.status,
          td.due_date,
          td.duration,
          td.assigned_to_groups
        FROM training_documents td
        WHERE td.assigned_to_groups && $1
           OR 'all-staff' = ANY(td.assigned_to_groups)
        ORDER BY td.created_at DESC
      `;
      
      const trainingsResult = await this.query(trainingsQuery, [userGroups]);
      console.log(`🎯 Found ${trainingsResult.rows.length} trainings for user ${userId}`);
      
      // Get video scripts for each training
      const trainingsWithScripts = [];
      for (const training of trainingsResult.rows) {
        const scriptsQuery = `
          SELECT * FROM video_scripts 
          WHERE document_id = $1 
          ORDER BY video_number
        `;
        const scriptsResult = await this.query(scriptsQuery, [training.id]);
        
        trainingsWithScripts.push({
          ...training,
          video_scripts: scriptsResult.rows
        });
      }
      
      return trainingsWithScripts;
    } catch (error) {
      console.error('Error in getUserAssignedTrainings:', error);
      throw error;
    }
  },

  // Get assignment statistics for dashboard
  async getAssignmentStats() {
    const query = `
      SELECT 
        COUNT(DISTINCT uta.user_id) as total_users,
        COUNT(DISTINCT uta.training_id) as total_trainings,
        COUNT(*) as total_assignments,
        COUNT(CASE WHEN uta.status = 'completed' THEN 1 END) as total_completed,
        ROUND(
          (COUNT(CASE WHEN uta.status = 'completed' THEN 1 END)::numeric / 
           NULLIF(COUNT(*), 0)::numeric) * 100
        ) as completion_rate
      FROM user_training_assignments uta
    `;
    
    const result = await this.query(query);
    return result.rows[0];
  },

  // Assign training to users based on group membership
  async assignTrainingToGroups(trainingId, groupIds) {
    // Remove existing assignments for this training
    await this.query(
      'DELETE FROM user_training_assignments WHERE training_id = $1',
      [trainingId]
    );
    
    // Get all users who belong to any of the specified groups
    const usersQuery = `
      SELECT DISTINCT id 
      FROM users 
      WHERE user_groups && $1
    `;
    
    const usersResult = await this.query(usersQuery, [groupIds]);
    
    // Create new assignments for matching users
    for (const user of usersResult.rows) {
      await this.query(
        'INSERT INTO user_training_assignments (user_id, training_id, status) VALUES ($1, $2, $3) ON CONFLICT (user_id, training_id) DO NOTHING',
        [user.id, trainingId, 'assigned']
      );
    }
    
    console.log(`📋 Assigned training ${trainingId} to ${usersResult.rows.length} users in groups:`, groupIds);
    return usersResult.rows.length;
  },

  // Update training group assignments
  async updateTrainingGroupAssignments(trainingId, groupIds) {
    return this.assignTrainingToGroups(trainingId, groupIds);
  },

  // Get all trainings with their assignment statistics based on user groups
  async getTrainingsWithStats() {
    try {
      // First get all trainings
      const trainingsQuery = 'SELECT * FROM training_documents ORDER BY created_at DESC';
      const trainingsResult = await this.query(trainingsQuery);
      
      // Then get assignment stats for each training based on group membership
      const trainingsWithStats = [];
      for (const training of trainingsResult.rows) {
        // Count users whose groups overlap with training's assigned groups
        const assignedCountQuery = `
          SELECT COUNT(DISTINCT id) as assigned
          FROM users 
          WHERE user_groups && $1
        `;
        const assignedResult = await this.query(assignedCountQuery, [training.assigned_to_groups]);
        const assignedCount = parseInt(assignedResult.rows[0].assigned) || 0;
        
        // Count completed from actual assignments table
        const completedQuery = `
          SELECT COUNT(DISTINCT user_id) as completed
          FROM user_training_assignments 
          WHERE training_id = $1 AND status = 'completed'
        `;
        const completedResult = await this.query(completedQuery, [training.id]);
        const completedCount = parseInt(completedResult.rows[0].completed) || 0;
        
        trainingsWithStats.push({
          ...training,
          assigned: assignedCount,
          completed: completedCount
        });
      }
      
      return trainingsWithStats;
    } catch (error) {
      console.error('Error in getTrainingsWithStats:', error);
      throw error;
    }
  },

  // Close the database connection pool
  async close() {
    await pool.end();
  }
};

// Test connection on startup
(async () => {
  try {
    await db.query('SELECT NOW()');
    console.log('🚀 Database connection verified');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    console.error('Make sure Docker is running and the database is available');
  }
})();

export default db;