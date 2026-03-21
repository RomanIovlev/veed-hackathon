// Example client-side integration for the video generation backend
// Use this code in your React frontend to integrate with the video generation service

class VideoGenerationClient {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async generateVideo({ script, imageUrl, resolution = '720p' }) {
    try {
      const response = await fetch(`${this.baseUrl}/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script,
          imageUrl,
          resolution
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Video generation failed');
      }

      return result;
    } catch (error) {
      console.error('Video generation failed:', error);
      throw error;
    }
  }

  async checkStatus(requestId) {
    try {
      const response = await fetch(`${this.baseUrl}/status/${requestId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Status check failed');
      }

      return result;
    } catch (error) {
      console.error('Status check failed:', error);
      throw error;
    }
  }

  async getAvailableVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get voices');
      }

      return result;
    } catch (error) {
      console.error('Failed to get voices:', error);
      throw error;
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const result = await response.json();
      
      return response.ok && result.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Example usage in a React component:

/*
import { useState } from 'react';

export function VideoGenerator() {
  const [client] = useState(() => new VideoGenerationClient());
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');

  const handleGenerateVideo = async () => {
    try {
      setIsGenerating(true);
      setError('');

      // Example: Get script and image from your training topic
      const topic = getCurrentTopic(); // Your implementation
      const script = topic.script;
      const imageUrl = getCoverImageUrl(); // Your implementation

      const result = await client.generateVideo({
        script,
        imageUrl,
        resolution: '720p'
      });

      setVideoUrl(result.videoUrl);
      console.log('Video generated successfully:', result.videoUrl);
      
    } catch (error) {
      setError(error.message);
      console.error('Video generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleGenerateVideo} 
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating Video...' : 'Generate Video'}
      </button>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {videoUrl && (
        <video controls src={videoUrl} style={{ width: '100%', maxWidth: '800px' }}>
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
*/

// Example integration with your existing CreateTrainingFlow component:

/*
// Add this to your CreateTrainingFlow.tsx component

const generateVideoForTopic = async (topic: Topic) => {
  try {
    const client = new VideoGenerationClient();
    
    const result = await client.generateVideo({
      script: topic.script,
      imageUrl: coverImage, // from your existing state
      resolution: '720p'
    });

    // Update the topic with the generated video
    updateTopic(topic.id, { 
      content: [
        ...topic.content.filter(c => c.type !== 'video'),
        { type: 'video', value: result.videoUrl }
      ]
    });

    toast({ title: 'Video generated successfully!' });
    
  } catch (error) {
    toast({ 
      title: 'Video generation failed', 
      description: error.message, 
      variant: 'destructive' 
    });
  }
};
*/

export default VideoGenerationClient;