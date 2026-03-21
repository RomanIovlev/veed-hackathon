// Local Database Client - PostgreSQL Database Integration
// This client provides database operations for our local PostgreSQL database

const API_BASE_URL = 'http://localhost:3002/api';

// Generic API response type
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Query result type
interface QueryResult<T = any> {
  data: T | null;
  error: { message: string } | null;
}

// Thenable interface for async operations
interface Thenable<T> {
  then(onResolve: (value: T) => any, onReject?: (error: any) => any): Promise<any>;
  catch(onReject: (error: any) => any): Promise<any>;
}

// Base query class with Promise-like behavior
class BaseQuery<T> implements Thenable<QueryResult<T>> {
  protected executeQuery: () => Promise<QueryResult<T>>;

  constructor(executor: () => Promise<QueryResult<T>>) {
    this.executeQuery = executor;
  }

  then(onResolve: (value: QueryResult<T>) => any, onReject?: (error: any) => any): Promise<any> {
    return this.executeQuery().then(onResolve, onReject);
  }

  catch(onReject: (error: any) => any): Promise<any> {
    return this.executeQuery().catch(onReject);
  }
}

// ============================================
// TRAINING DOCUMENTS TABLE
// ============================================

class TrainingDocumentsTable {
  select(_columns: string = '*') {
    return new TrainingDocumentsSelectQuery();
  }

  insert(data: any) {
    return new TrainingDocumentsInsertQuery(data);
  }

  update(data: any) {
    return new TrainingDocumentsUpdateQuery(data);
  }

  delete() {
    return new TrainingDocumentsDeleteQuery();
  }
}

class TrainingDocumentsSelectQuery extends BaseQuery<any[]> {
  constructor() {
    super(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/trainings`);
        const result: ApiResponse = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch trainings');
        return { data: result.data, error: null };
      } catch (error) {
        console.error('Error fetching trainings:', error);
        return { data: null, error: { message: (error as Error).message } };
      }
    });
  }

  eq(column: string, value: any) {
    return new TrainingDocumentsByIdQuery(column, value);
  }

  order(_column: string, _options?: { ascending: boolean }) {
    return this;
  }
}

class TrainingDocumentsByIdQuery extends BaseQuery<any> {
  constructor(private column: string, private value: any) {
    super(async () => {
      try {
        if (column === 'id') {
          const response = await fetch(`${API_BASE_URL}/trainings/${value}`);
          const result: ApiResponse = await response.json();
          if (!result.success) throw new Error(result.error || 'Training not found');
          return { data: result.data, error: null };
        }
        throw new Error(`Query by ${column} not implemented`);
      } catch (error) {
        console.error('Error fetching training:', error);
        return { data: null, error: { message: (error as Error).message } };
      }
    });
  }

  async single() {
    return this.executeQuery();
  }
}

class TrainingDocumentsInsertQuery {
  constructor(private data: any) {}

  select(_columns: string = '*') {
    return new TrainingDocumentsInsertSelectQuery(this.data);
  }

  private async execute(): Promise<QueryResult<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/trainings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: this.data.title,
          description: this.data.description || '',
          categories: this.data.categories || [],
          languages: this.data.languages || ['en'],
          coverImageUrl: this.data.coverImageUrl || null,
          assignedToGroups: this.data.assignedToGroups || [],
          duration: this.data.duration || 10,
          notes: this.data.notes || ''
        })
      });
      const result: ApiResponse = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to create training');
      return { data: result.data, error: null };
    } catch (error) {
      console.error('Error creating training:', error);
      return { data: null, error: { message: (error as Error).message } };
    }
  }

  then(onResolve: any, onReject?: any) {
    return this.execute().then(onResolve, onReject);
  }

  catch(onReject: any) {
    return this.execute().catch(onReject);
  }
}

class TrainingDocumentsInsertSelectQuery {
  constructor(private data: any) {}

  async single(): Promise<QueryResult<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/trainings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: this.data.title,
          description: this.data.description || '',
          categories: this.data.categories || [],
          languages: this.data.languages || ['en'],
          coverImageUrl: this.data.coverImageUrl || null,
          assignedToGroups: this.data.assignedToGroups || [],
          duration: this.data.duration || 10,
          notes: this.data.notes || ''
        })
      });
      const result: ApiResponse = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to create training');
      return { data: result.data, error: null };
    } catch (error) {
      console.error('Error creating training:', error);
      return { data: null, error: { message: (error as Error).message } };
    }
  }

  then(onResolve: any, onReject?: any) {
    return this.single().then(onResolve, onReject);
  }

  catch(onReject: any) {
    return this.single().catch(onReject);
  }
}

class TrainingDocumentsUpdateQuery {
  constructor(private data: any) {}

  eq(column: string, value: any) {
    return new TrainingDocumentsUpdateExecutor(this.data, column, value);
  }
}

class TrainingDocumentsUpdateExecutor extends BaseQuery<any> {
  constructor(private data: any, private column: string, private value: any) {
    super(async () => {
      try {
        if (column === 'id') {
          console.log('📝 Updating training document:', value);
          const response = await fetch(`${API_BASE_URL}/trainings/${value}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: data.title,
              description: data.description || '',
              categories: data.categories || [],
              languages: data.languages || ['en'],
              coverImageUrl: data.coverImageUrl || null,
              assignedToGroups: data.assignedToGroups || [],
              duration: data.duration || 10,
              notes: data.notes || ''
            })
          });
          const result: ApiResponse = await response.json();
          if (!result.success) throw new Error(result.error || 'Failed to update training');
          console.log('✅ Training updated successfully');
          return { data: result.data, error: null };
        }
        throw new Error(`Update by ${column} not implemented`);
      } catch (error) {
        console.error('❌ Error updating training:', error);
        return { data: null, error: { message: (error as Error).message } };
      }
    });
  }
}

class TrainingDocumentsDeleteQuery {
  eq(column: string, value: any) {
    return new TrainingDocumentsDeleteExecutor(column, value);
  }
}

class TrainingDocumentsDeleteExecutor extends BaseQuery<null> {
  constructor(private column: string, private value: any) {
    super(async () => {
      try {
        if (column === 'id') {
          console.log('🗑️ Deleting training document:', value);
          const response = await fetch(`${API_BASE_URL}/trainings/${value}`, {
            method: 'DELETE'
          });
          const result: ApiResponse = await response.json();
          if (!result.success) throw new Error(result.error || 'Failed to delete training');
          console.log('✅ Training deleted successfully');
          return { data: null, error: null };
        }
        throw new Error(`Delete by ${column} not implemented`);
      } catch (error) {
        console.error('❌ Error deleting training:', error);
        return { data: null, error: { message: (error as Error).message } };
      }
    });
  }
}

// ============================================
// VIDEO SCRIPTS TABLE
// ============================================

class VideoScriptsTable {
  select(_columns: string = '*') {
    return new VideoScriptsSelectQuery();
  }

  insert(data: any[]) {
    return new VideoScriptsInsertQuery(data);
  }

  delete() {
    return new VideoScriptsDeleteQuery();
  }
}

class VideoScriptsSelectQuery extends BaseQuery<any[]> {
  constructor() {
    super(async () => {
      return { data: [], error: null };
    });
  }

  eq(column: string, value: any) {
    return new VideoScriptsFilterQuery(column, value);
  }

  in(column: string, values: any[]) {
    return new VideoScriptsInQuery(column, values);
  }
}

class VideoScriptsFilterQuery extends BaseQuery<any[]> {
  constructor(private column: string, private value: any) {
    super(async () => {
      try {
        if (this.column === 'document_id') {
          const response = await fetch(`${API_BASE_URL}/trainings/${this.value}`);
          const result: ApiResponse = await response.json();
          if (result.success && result.data?.video_scripts) {
            return { data: result.data.video_scripts, error: null };
          }
        }
        return { data: [], error: null };
      } catch (error) {
        console.error('Error fetching video scripts:', error);
        return { data: null, error: { message: (error as Error).message } };
      }
    });
  }

  order(_column: string, _options?: { ascending: boolean }) {
    return new VideoScriptsOrderedQuery(this.column, this.value);
  }
}

class VideoScriptsOrderedQuery extends BaseQuery<any[]> {
  constructor(private filterColumn: string, private filterValue: any) {
    super(async () => {
      try {
        if (filterColumn === 'document_id') {
          const response = await fetch(`${API_BASE_URL}/trainings/${filterValue}`);
          const result: ApiResponse = await response.json();
          if (result.success && result.data?.video_scripts) {
            const scripts = result.data.video_scripts;
            return { data: scripts, error: null };
          }
        }
        return { data: [], error: null };
      } catch (error) {
        console.error('Error fetching video scripts:', error);
        return { data: null, error: { message: (error as Error).message } };
      }
    });
  }
}

class VideoScriptsInQuery extends BaseQuery<any[]> {
  constructor(private column: string, private values: any[]) {
    super(async () => {
      try {
        if (this.column === 'document_id' && this.values.length > 0) {
          const allScripts: any[] = [];
          for (const docId of this.values) {
            const response = await fetch(`${API_BASE_URL}/trainings/${docId}`);
            const result: ApiResponse = await response.json();
            if (result.success && result.data?.video_scripts) {
              allScripts.push(...result.data.video_scripts);
            }
          }
          return { data: allScripts, error: null };
        }
        return { data: [], error: null };
      } catch (error) {
        console.error('Error fetching video scripts:', error);
        return { data: null, error: { message: (error as Error).message } };
      }
    });
  }
}

class VideoScriptsInsertQuery extends BaseQuery<any[]> {
  constructor(private data: any[]) {
    super(async () => {
      try {
        console.log('🚀 Inserting video scripts:', data);
        const results: any[] = [];
        
        for (const script of data) {
          const requestBody = {
            videoNumber: script.video_number,
            title: script.title,
            category: script.category,
            hook: script.hook,
            script: script.script,
            callToAction: script.call_to_action,
            duration: script.duration,
            priority: script.priority,
            keyLearningPoints: script.key_learning_points || [],
            contentBlocks: script.content_blocks || []
          };
          
          console.log('📄 Creating script:', requestBody);
          
          const response = await fetch(`${API_BASE_URL}/trainings/${script.document_id}/scripts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          
          const result: ApiResponse = await response.json();
          
          if (!result.success) {
            console.error('❌ Failed to create script:', result);
            throw new Error(result.error || 'Failed to create video script');
          }
          
          console.log('✅ Script created successfully:', result.data);
          results.push(result.data);
        }
        
        console.log('🎉 All scripts created successfully');
        return { data: results, error: null };
      } catch (error) {
        console.error('❌ Error creating video scripts:', error);
        return { data: null, error: { message: (error as Error).message } };
      }
    });
  }
}

class VideoScriptsDeleteQuery {
  eq(column: string, value: any) {
    return new VideoScriptsDeleteExecutor(column, value);
  }
}

class VideoScriptsDeleteExecutor extends BaseQuery<null> {
  constructor(private column: string, private value: any) {
    super(async () => {
      try {
        if (column === 'document_id') {
          console.log('🗑️ Deleting video scripts for document:', value);
          const response = await fetch(`${API_BASE_URL}/trainings/${value}/scripts`, {
            method: 'DELETE'
          });
          const result: ApiResponse = await response.json();
          if (!result.success) throw new Error(result.error || 'Failed to delete video scripts');
          console.log('✅ Video scripts deleted successfully');
          return { data: null, error: null };
        }
        throw new Error(`Delete by ${column} not implemented`);
      } catch (error) {
        console.error('❌ Error deleting video scripts:', error);
        return { data: null, error: { message: (error as Error).message } };
      }
    });
  }
}

// ============================================
// USERS TABLE
// ============================================

class UsersTable {
  select(_columns: string = '*') {
    return new UsersSelectQuery();
  }
}

class UsersSelectQuery extends BaseQuery<any[]> {
  constructor() {
    super(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users`);
        const result: ApiResponse = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch users');
        return { data: result.data, error: null };
      } catch (error) {
        console.error('Error fetching users:', error);
        return { data: null, error: { message: (error as Error).message } };
      }
    });
  }
}

// ============================================
// MAIN CLIENT CLASS
// ============================================

class LocalDatabaseClient {
  private trainingDocumentsTable = new TrainingDocumentsTable();
  private videoScriptsTable = new VideoScriptsTable();
  private usersTable = new UsersTable();

  from(tableName: 'training_documents'): TrainingDocumentsTable;
  from(tableName: 'video_scripts'): VideoScriptsTable;
  from(tableName: 'users'): UsersTable;
  from(tableName: string): TrainingDocumentsTable | VideoScriptsTable | UsersTable {
    switch (tableName) {
      case 'training_documents':
        return this.trainingDocumentsTable;
      case 'video_scripts':
        return this.videoScriptsTable;
      case 'users':
        return this.usersTable;
      default:
        throw new Error(`Table ${tableName} not implemented`);
    }
  }

  // Functions invoke (for AI generation functions - mock implementation)
  functions = {
    invoke: async (functionName: string, options: { body: any }) => {
      console.log(`Mock function call: ${functionName}`, options.body);
      
      switch (functionName) {
        case 'generate-description':
          return {
            data: { suggestion: "AI-generated description based on your input. This training module covers essential skills and knowledge that staff members need to provide high-quality care. Participants will learn through interactive content, practical examples, and assessments designed to reinforce key learning points." },
            error: null
          };
        case 'generate-topic-text':
          return {
            data: { suggestion: "This topic provides comprehensive coverage of the subject matter, with clear explanations and practical guidance for real-world application." },
            error: null
          };
        case 'generate-topic-content':
          return {
            data: {
              hook: "Did you know that mastering these skills can significantly improve care quality?",
              keyLearningPoints: ["Understanding the fundamentals", "Applying best practices", "Maintaining compliance"],
              script: "[VISUAL: Professional care setting]\n\nNARRATOR: Welcome to this important training module. Today we'll explore essential concepts that will help you provide better care.\n\n[VISUAL: Key points appearing on screen]\n\nLet's begin by understanding the core principles...",
              callToAction: "Apply what you've learned in your next shift!",
              duration: "5 minutes",
              priority: "High",
              image_prompt: "Professional healthcare training illustration",
              video_brief: "Create a welcoming introduction video",
              quiz: [
                { id: 1, text: "What is the main learning objective?", options: ["Option A", "Option B", "Option C", "Option D"], correctIndex: 0 }
              ]
            },
            error: null
          };
        case 'generate-structure':
          return {
            data: {
              topics: [
                { title: "Introduction", text: "Welcome and overview of the training objectives" },
                { title: "Core Concepts", text: "Understanding the fundamental principles" },
                { title: "Practical Application", text: "How to apply what you've learned" },
                { title: "Assessment", text: "Test your knowledge" }
              ]
            },
            error: null
          };
        case 'generate-topic-quiz':
          return {
            data: {
              questions: [
                { id: 1, text: "What is the primary focus of this topic?", options: ["Answer A", "Answer B", "Answer C", "Answer D"], correctIndex: 0 },
                { id: 2, text: "Which practice is recommended?", options: ["Option 1", "Option 2", "Option 3", "Option 4"], correctIndex: 1 }
              ]
            },
            error: null
          };
        case 'generate-image':
          return {
            data: { imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800" },
            error: null
          };
        default:
          return { data: null, error: { message: `Function ${functionName} not implemented` } };
      }
    }
  };
}

// Create and export the client instance
export const localDb = new LocalDatabaseClient();

// Default export for database operations
export default localDb;
