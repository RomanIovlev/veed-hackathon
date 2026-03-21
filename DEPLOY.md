# Netlify Deployment Guide

This guide will walk you through deploying the CareLearn training platform to Netlify with zero additional configuration needed after setup.

## Prerequisites

Before deploying, you'll need:

1. **Cloud Database**: Set up a PostgreSQL database (recommended services: Neon, Supabase, or Railway)
2. **API Keys**: 
   - FAL AI API key for TTS/video generation
   - VEED API key (optional, for advanced video features)

## Step 1: Set Up Cloud Database

### Option A: Neon (Recommended)
1. Go to [Neon](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (starts with `postgresql://`)

### Option B: Supabase
1. Go to [Supabase](https://supabase.com) and create a project
2. Go to Settings → Database
3. Copy the connection string

### Option C: Railway
1. Go to [Railway](https://railway.app) and create a project
2. Add a PostgreSQL service
3. Copy the connection string

## Step 2: Create Database Tables

Connect to your cloud database and run these SQL commands:

```sql
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  training_id INTEGER REFERENCES training_documents(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'worker',
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, email, role, department) VALUES
  ('John Manager', 'john@company.com', 'manager', 'Operations'),
  ('Sarah Smith', 'sarah@company.com', 'worker', 'Nursing'),
  ('Mike Johnson', 'mike@company.com', 'worker', 'Administration')
ON CONFLICT (email) DO NOTHING;
```

## Step 3: Deploy to Netlify

### Method A: GitHub Integration (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to [Netlify](https://netlify.com) and sign in
   - Click "New site from Git"
   - Connect your GitHub repository
   - Netlify will automatically detect the build settings from `netlify.toml`

3. **Set Environment Variables**:
   In Netlify dashboard → Site settings → Environment variables, add:
   - `FAL_KEY`: Your FAL AI API key
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `VEED_API_KEY`: Your VEED API key (optional)
   - `NODE_ENV`: `production`

4. **Deploy**: Netlify will automatically build and deploy your site

### Method B: Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize site**:
   ```bash
   netlify init
   ```

4. **Set environment variables**:
   ```bash
   netlify env:set FAL_KEY your_fal_api_key_here
   netlify env:set DATABASE_URL your_postgresql_connection_string
   netlify env:set NODE_ENV production
   ```

5. **Deploy**:
   ```bash
   netlify deploy --build --prod
   ```

## Step 4: Verify Deployment

After deployment:

1. **Check Health**: Visit `https://your-site.netlify.app/.netlify/functions/health`
2. **Test API**: Visit `https://your-site.netlify.app/.netlify/functions/trainings`
3. **Use the App**: Visit your main site URL

## Automatic Deployments

Once set up, Netlify will automatically deploy when you push to your main branch:

```bash
# Make changes to your code
git add .
git commit -m "Add new feature"
git push origin main
# Netlify automatically deploys the changes
```

## Troubleshooting

### Common Issues:

1. **Database Connection Error**: 
   - Verify your `DATABASE_URL` is correct
   - Ensure your cloud database allows connections from Netlify

2. **Function Timeout**: 
   - Netlify functions have a 10-second timeout limit
   - Large operations might need optimization

3. **Environment Variables Not Working**:
   - Check that variables are set in Netlify dashboard
   - Redeploy after adding new environment variables

4. **Build Failures**:
   - Check the build logs in Netlify dashboard
   - Ensure all dependencies are in `package.json`

### Monitoring

- **Netlify Dashboard**: Monitor deployments and function calls
- **Function Logs**: View real-time logs for debugging
- **Analytics**: Track usage and performance

## Production Considerations

1. **Database Backups**: Ensure your cloud database provider has automatic backups
2. **Monitoring**: Set up uptime monitoring for your application
3. **Domain**: Add a custom domain in Netlify settings
4. **SSL**: Netlify provides free SSL certificates automatically

## Support

If you encounter issues:
1. Check Netlify function logs
2. Verify environment variables
3. Test database connectivity
4. Review the build logs

The application is now ready for production use with automatic deployments!