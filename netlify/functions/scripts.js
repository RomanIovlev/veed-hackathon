import { db } from './lib/db.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const { httpMethod, path } = event;
    const pathParts = path.split('/').filter(Boolean);
    
    // Extract IDs from path
    // Expected patterns:
    // POST /api/trainings/:trainingId/scripts
    // PUT /api/scripts/:scriptId
    // DELETE /api/trainings/:trainingId/scripts
    
    if (pathParts.includes('trainings')) {
      const trainingId = pathParts[pathParts.indexOf('trainings') + 1];
      
      switch (httpMethod) {
        case 'POST':
          // Create new script for training
          const scriptData = JSON.parse(event.body || '{}');
          scriptData.documentId = trainingId;
          
          const newScript = await db.createVideoScript(scriptData);
          
          return {
            statusCode: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify(newScript),
          };

        case 'DELETE':
          // Delete all scripts for training
          const deletedCount = await db.deleteVideoScriptsByDocumentId(trainingId);
          
          return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: 'Scripts deleted successfully',
              deletedCount 
            }),
          };

        default:
          return {
            statusCode: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' }),
          };
      }
    }
    
    if (pathParts.includes('scripts')) {
      const scriptId = pathParts[pathParts.indexOf('scripts') + 1];
      
      switch (httpMethod) {
        case 'PUT':
          // Update specific script
          if (!scriptId) {
            return {
              statusCode: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Script ID required for update' }),
            };
          }

          const updateData = JSON.parse(event.body || '{}');
          const updatedScript = await db.updateVideoScript(scriptId, updateData);
          
          if (!updatedScript) {
            return {
              statusCode: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Script not found' }),
            };
          }

          return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedScript),
          };

        default:
          return {
            statusCode: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' }),
          };
      }
    }

    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid path' }),
    };

  } catch (error) {
    console.error('Scripts API error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};