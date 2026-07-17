# Personalized Learning Path Generator

An AI-powered personalized learning platform that generates custom, structured learning paths for students based on their onboarding assessments.

## Key Features

- **Role-Based Authentication**: Separate spaces and permissions for Learners and Instructors using JWT.
- **Course & Module Management**: Full CRUD interface for creating courses, modules, and subtopics.
- **Personalized Learning Paths**: Generates optimized learning outlines powered by LLM based on learner onboarding scores.
- **Assessment Engine**: Onboarding and modular quizzes with skill domain analysis.
- **Progress Tracking**: Tracks completed subtopics and visualizes learner progress.

## Tech Stack

- **Backend**: Django, Django REST Framework, SQLite/PostgreSQL
- **Frontend**: React, React Router, Axios, Tailwind CSS
- **AI Integration**: Gemini / LLM APIs

## Quick Start

### Backend
1. Navigate to the `backend` directory.
2. Activate the virtual environment:
   ```bash
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
