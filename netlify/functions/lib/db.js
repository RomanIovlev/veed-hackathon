import pkg from 'pg';
const { Pool } = pkg;

let pool;

// Database configuration for production (cloud database)
const getDbConfig = () => {
  return {
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
};

// Initialize connection pool (singleton pattern for serverless)
const getPool = () => {
  if (!pool) {
    pool = new Pool(getDbConfig());
    
    pool.on('error', (err) => {
      console.error('Database connection error:', err);
    });
  }
  return pool;
};

// Database helper functions
export const db = {
  // Generic query function
  async query(text, params) {
    const client = await getPool().connect();
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

  // Delete training document
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
  }
};

export default db;