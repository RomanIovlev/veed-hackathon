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
    const { httpMethod, path, queryStringParameters } = event;
    const pathParts = path.split('/').filter(Boolean);
    
    // Extract ID from path if present (e.g., /api/trainings/123)
    const trainingId = pathParts.length > 2 ? pathParts[2] : null;

    switch (httpMethod) {
      case 'GET':
        if (trainingId) {
          // Get specific training document
          const training = await db.getTrainingDocument(trainingId);
          
          if (!training) {
            return {
              statusCode: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify({ error: 'Training not found' }),
            };
          }

          return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify(training),
          };
        } else {
          // Get all training documents
          const trainings = await db.getTrainingDocuments();
          
          return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify(trainings),
          };
        }

      case 'POST':
        if (trainingId) {
          return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'POST with ID not supported' }),
          };
        }

        // Create new training document
        const newTrainingData = JSON.parse(event.body || '{}');
        const newTraining = await db.createTrainingDocument(newTrainingData);
        
        return {
          statusCode: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(newTraining),
        };

      case 'PUT':
        if (!trainingId) {
          return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Training ID required for update' }),
          };
        }

        // Update training document
        const updateData = JSON.parse(event.body || '{}');
        const updatedTraining = await db.updateTrainingDocument(trainingId, updateData);
        
        if (!updatedTraining) {
          return {
            statusCode: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Training not found' }),
          };
        }

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTraining),
        };

      case 'DELETE':
        if (!trainingId) {
          return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Training ID required for delete' }),
          };
        }

        // Delete training document
        const deleted = await db.deleteTrainingDocument(trainingId);
        
        if (!deleted) {
          return {
            statusCode: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Training not found' }),
          };
        }

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Training deleted successfully' }),
        };

      default:
        return {
          statusCode: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

  } catch (error) {
    console.error('Training API error:', error);
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