# Life Dashboard Project Plan

Last Updated: 2025-06-14
Author: Kxvin1

---

# VERSION 2 - CURRENT PROJECT PLAN (2025)

## Executive Summary

Life Dashboard has evolved from a conceptual MVP into a production-ready personal life management platform. Version 2 represents the current state and future roadmap of our comprehensive dashboard application that integrates financial tracking, productivity tools, and personal organization features with AI-powered insights.

**Current Status:** Production deployment with 5 core features implemented, comprehensive caching system, demo user functionality, and AI integration.

**Deployment URLs:**

- Frontend: https://life-dashboard-eta.vercel.app
- Backend API: https://life-dashboard-production-27bf.up.railway.app

## Current Technology Stack (Version 2)

### Frontend Architecture

- **Framework:** Next.js 15.3.1 with App Router
- **Runtime:** React 19.0.0
- **Language:** TypeScript 5.x (strict mode)
- **Styling:** Tailwind CSS 3.x with custom design system
- **UI Components:** Custom component library with Radix UI primitives
- **State Management:** React Context + Custom hooks (no external state library)
- **Data Fetching:** Native fetch with custom caching layer
- **Charts:** Chart.js 4.4.9 with react-chartjs-2
- **Authentication:** JWT with secure cookie storage
- **Icons:** Lucide React 0.510.0
- **Deployment:** Vercel (production)

### Backend Architecture

- **Framework:** FastAPI 0.109.2
- **Language:** Python 3.11+
- **ORM:** SQLAlchemy 2.0+ with Alembic migrations
- **Database:** PostgreSQL (Railway)
- **Authentication:** JWT with bcrypt password hashing (7-day expiration)
- **AI Integration:** OpenAI API 1.12.0 (GPT-4o-mini for cost optimization)
- **Caching:** Redis 6.1.0 with fallback to in-memory
- **Performance:** Gzip compression, connection pooling
- **Deployment:** Railway with Gunicorn + Uvicorn workers
- **Process Management:** Alembic auto-migrations on deploy

### Infrastructure & Performance

- **Caching Strategy:**
  - Redis backend caching (3600s TTL)
  - Frontend request deduplication
  - Gzip compression
  - Database query optimization
- **Database:** Railway PostgreSQL with connection pooling
- **Monitoring:** Custom health checks and error logging
- **Security:** CORS configuration, input validation, SQL injection protection

## Currently Implemented Features (Version 2)

### ✅ Core Features (Production Ready)

1. **Transaction Overview & Management**

   - Complete CRUD operations for income/expense tracking
   - Category-based organization with predefined categories
   - Monthly/yearly financial summaries
   - Visual charts and spending analysis
   - Export capabilities

2. **Subscription Tracker**

   - Recurring payment management
   - Due date tracking and notifications
   - Status management (active/inactive/cancelled)
   - Cost analysis and projections
   - Bulk operations support

3. **Task Manager**

   - Short-term and long-term task organization
   - Priority levels (High, Medium, Low)
   - Due date management
   - Category-based filtering
   - Task completion tracking
   - Drag-and-drop interface

4. **Pomodoro Timer**

   - 25-minute work sessions with 5-minute breaks
   - 15-minute break after 3 completed sessions
   - Session history and statistics
   - Daily streak tracking with PST timezone support
   - Task integration (optional task linking)

5. **AI Financial Insights**
   - Transaction analysis with OpenAI integration
   - Spending pattern recognition
   - Personalized recommendations
   - Usage limits for cost control
   - Demo mode restrictions

### ✅ System Features (Production Ready)

1. **Authentication System**

   - JWT-based authentication with 7-day expiration
   - Secure password hashing with bcrypt
   - User registration and login
   - Protected routes and API endpoints

2. **Demo User System**

   - Pre-warmed sample data for all features
   - Session-only storage (no database persistence)
   - AI features disabled in demo mode
   - Automatic data reset on logout

3. **Performance Optimization**

   - Comprehensive Redis caching system
   - Frontend request deduplication
   - Gzip compression
   - Database query optimization
   - Connection pooling

4. **Admin Dashboard**
   - System health monitoring
   - User management capabilities
   - Performance metrics
   - Error logging and debugging

### ❌ Planned Features (Not Yet Implemented)

1. **Health & Wellness Module**

   - Mood Journal (placeholder page exists)
   - Sleep Log (placeholder page exists)
   - Gratitude Log
   - Mindfulness Timer

2. **Personal Organization Module**

   - Reading List (placeholder page exists)
   - Skill Progress Tracker (placeholder page exists)
   - Recipe Manager
   - Digital Filing System
   - Notes/Scratchpad with AI summarization

3. **Calendar Integration**
   - Preview page implemented with mock data
   - Unified calendar view of all dashboard data
   - Holiday integration
   - Event management

## Version 2 Roadmap & Planned Features

### Phase 1: Calendar Implementation (Highest Priority)

**Timeline:** Q1 2025

**Scope:**

- Convert calendar preview into fully functional feature
- Integrate with all existing dashboard data (transactions, tasks, pomodoro sessions)
- Add event creation and management
- Implement holiday API integration
- Add calendar-based filtering and views

**Technical Considerations:**

- Investigate external calendar API integration (Google Calendar, Outlook)
- Design unified data model for calendar events
- Implement date-based queries and aggregations
- Add calendar-specific caching strategies

**Deliverables:**

- Functional calendar with all dashboard data integration
- Event CRUD operations
- Holiday integration
- Mobile-responsive calendar interface

### Phase 2: Reading List → Watch List Transformation

**Timeline:** Q2 2025

**Scope:**

- Transform Reading List concept into comprehensive Watch List
- Track TV shows, movies, documentaries, and books
- AI-powered recommendation engine
- Integration with external APIs (TMDB, OMDB)
- Progress tracking for series and reading

**AI Integration:**

- Content recommendations based on viewing/reading history
- Mood-based suggestions
- Genre analysis and preferences
- Watchlist optimization

**Technical Implementation:**

- External API integrations for content metadata
- Recommendation algorithm development
- Enhanced search and filtering capabilities
- Progress tracking system

### Phase 3: Personal Wardrobe Feature

**Timeline:** Q2-Q3 2025

**Scope:**

- Digital wardrobe management system
- Outfit planning and suggestions
- Weather-based recommendations
- Wardrobe gap analysis
- Style preference learning

**AI Integration:**

- AI-powered outfit suggestions based on weather, occasion, and preferences
- Wardrobe gap analysis (identifying missing pieces)
- Style trend integration
- Color coordination recommendations
- Seasonal wardrobe optimization

**Technical Implementation:**

- Image storage and processing
- Weather API integration
- Machine learning for style preferences
- Outfit combination algorithms

### Phase 4: Rekindle - Personal Timeline Feature

**Timeline:** Q3-Q4 2025

**Scope:**
Rekindle is a private and social feature that allows users to document their life through a scrollable, emotion-first personal timeline. This feature taps into growing demand for emotional wellness, memory journaling, and meaningful digital content.

**Core Features:**

- Daily thought and milestone documentation
- Private and public post options
- Emotion-first interface design
- Scrollable timeline with rich media support
- Memory triggers and nostalgia features
- Digital legacy creation

**AI Integration:**

- Emotion analysis and mood tracking
- Memory pattern recognition
- Personalized reflection prompts
- Content summarization for life reviews
- Relationship and growth insights

**Social Features:**

- Selective sharing with friends/family
- Memory collaboration
- Anniversary and milestone reminders
- Community features for shared experiences

### Phase 5: Workout Planner & Health Integration

**Timeline:** Q4 2025

**Scope:**

- Comprehensive workout planning system
- Exercise library and routine builder
- Progress tracking and analytics
- Integration with existing health features
- Nutrition tracking capabilities

**AI Integration:**

- Personalized workout recommendations
- Progress analysis and optimization
- Injury prevention suggestions
- Nutrition optimization
- Recovery recommendations

**Technical Implementation:**

- Exercise database integration
- Progress tracking algorithms
- Health data visualization
- Wearable device integration potential

### Phase 6: Personal Vault

**Timeline:** Q1 2026

**Scope:**

- Secure document storage and organization
- Link and bookmark management
- Encrypted file storage
- Advanced search and tagging
- Sharing and collaboration features

**Security Features:**

- End-to-end encryption
- Secure file upload and storage
- Access control and permissions
- Audit logging
- Backup and recovery

## AI Integration Strategy (Version 2)

### Current AI Implementation

- **OpenAI Integration:** GPT-4o-mini for cost-effective analysis
- **Financial Insights:** Transaction analysis and spending recommendations
- **Usage Controls:** Daily limits and cost management
- **Demo Restrictions:** AI features disabled in demo mode

### Planned AI Enhancements

1. **Cross-Feature AI Integration**

   - Unified AI assistant across all dashboard features
   - Context-aware recommendations
   - Predictive analytics for habits and goals
   - Personalized insights dashboard

2. **Feature-Specific AI Capabilities**

   - **Calendar:** Smart scheduling and conflict resolution
   - **Watch List:** Content recommendations and mood-based suggestions
   - **Wardrobe:** Outfit suggestions and style analysis
   - **Rekindle:** Emotion analysis and reflection prompts
   - **Workout:** Personalized training plans and progress optimization
   - **Personal Vault:** Intelligent document categorization and search

3. **Advanced AI Features**
   - Natural language query interface
   - Predictive modeling for personal goals
   - Habit formation optimization
   - Life pattern recognition and insights
   - Automated data entry and categorization

### AI Cost Management Strategy

- **Model Selection:** Continue using cost-effective models (GPT-4o-mini)
- **Usage Optimization:** Implement caching for repeated queries
- **User Limits:** Maintain daily/monthly usage caps
- **Batch Processing:** Group similar requests for efficiency
- **Fallback Systems:** Graceful degradation when AI services are unavailable

## Feature Coherence Analysis

### Current Dashboard Ecosystem Strengths

1. **Financial Foundation:** Strong transaction and subscription tracking
2. **Productivity Core:** Effective task management and time tracking
3. **Data Integration:** Unified user experience across features
4. **Performance:** Optimized caching and responsive design
5. **Scalability:** Modular architecture supports feature expansion

### Recommended Additional Features for Ecosystem Enhancement

1. **Goal Setting & Achievement System**

   - Cross-feature goal integration
   - Progress visualization
   - Achievement badges and milestones
   - Goal dependency mapping

2. **Habit Tracking Integration**

   - Connect habits to existing features (exercise, reading, productivity)
   - Habit stacking recommendations
   - Progress correlation analysis
   - Behavioral pattern insights

3. **Data Export & Analytics**

   - Comprehensive data export capabilities
   - Advanced analytics dashboard
   - Custom report generation
   - Data visualization improvements

4. **Integration Hub**

   - Third-party service connections (banks, fitness trackers, calendars)
   - API marketplace for custom integrations
   - Webhook support for automation
   - IFTTT/Zapier integration

5. **Collaboration Features**
   - Shared goals and tasks
   - Family/household management
   - Group challenges and competitions
   - Social accountability features

## Implementation Considerations

### Technical Debt & Improvements

1. **Frontend State Management:** Consider migrating to more robust state management
2. **Testing Coverage:** Expand automated testing suite
3. **API Documentation:** Enhance OpenAPI documentation
4. **Error Handling:** Improve error boundaries and user feedback
5. **Accessibility:** Ensure WCAG 2.1 AA compliance

### Scalability Preparations

1. **Database Optimization:** Implement advanced indexing strategies
2. **Caching Evolution:** Consider CDN integration for static assets
3. **API Rate Limiting:** Implement comprehensive rate limiting
4. **Monitoring Enhancement:** Add application performance monitoring
5. **Security Hardening:** Regular security audits and updates

### User Experience Enhancements

1. **Mobile App Development:** Consider native mobile applications
2. **Offline Functionality:** Implement progressive web app features
3. **Customization Options:** User-configurable dashboard layouts
4. **Accessibility Improvements:** Enhanced screen reader support
5. **Internationalization:** Multi-language support preparation

---

# VERSION 1 - LEGACY PROJECT PLAN (Original MVP Concept)

_The following section contains the original project plan that served as the foundation for the current implementation. This is preserved for historical reference and to understand the evolution of the project._

## Legacy Overview (Version 1)

This section contains the original project concept and planning documentation that guided the initial development of Life Dashboard. While the implementation has evolved significantly, these foundational concepts remain relevant for understanding the project's origins and core philosophy.

## Original Project Concept (Version 1)

Life Dashboard is a web application focused on providing users with a simple, aesthetically pleasing, and integrated platform for managing various aspects of their personal lives. It aims to improve users' quality of life by curating simple digital tools across key areas such as personal finance, productivity, health, and organization, avoiding the complexity often found in all-in-one solutions.

Key Features (MVP Focus):

- Modular design covering core "Quality of Life" areas (Personal Finance, Productivity / Time Management, Health and Wellness, Personal Organization).
- Simple interfaces for managing data within each module.
- Features within modules designed to be usable separately or together, allowing users to pick and choose which tools they utilize.
- Modular Usability: Each tool within the Finance, Productivity, Health, and Organization modules is designed to be fully functional independently, allowing users to adopt only the features they need without being forced into a monolithic workflow. Tools can also be used together where integrations make sense.
- AI-enhanced features designed for simplicity and background operation (e.g., summarizing notes).
- User accounts to personalize and secure data.
- Freemium model foundation (MVP focuses on free tier features).

Example Use Cases:

- A user wants a single place to track simple expenses, manage daily tasks, log basic health metrics, and keep organized notes.
- A user receives an AI summary of their weekly journal entries, highlighting key activities or feelings.
- A user quickly adds a task related to a financial goal directly from the finance module.
- A user searches across all their notes and tasks from a single search bar.
- A user tracks their habits alongside their to-do list without needing to use the budgeting tool.

## Original User Stories (Version 1 MVP)

### Authenticated Users (Free Tier)

1. **Personal Finance:**
   - As a user, I want to manually enter my income and expenses with customizable categories using the **Income/Expense Tracker**.
   - As a user, I want to perform simple monthly financial planning using a streamlined budgeting method in the **Budgeting Tool**.
   - As a user, I want to manually list and track my recurring subscription payments and their due dates using the **Subscription Tracker**.
   - As a user, I want to define and manually track contributions towards my personal savings goals using the **Savings Goal Tracker**.
   - As a user, I want to view lists and basic summaries of my financial data (transactions, budget progress, subscriptions, savings goals).
   - _Note: I can use any of these finance tools independently or together._
2. **Productivity / Time Management:**
   - As a user, I want to create, edit, delete, and complete tasks with due dates and priorities/tags using the **To Do List**.
   - As a user, I want to use a simple timer for focused work sessions and breaks with the **Pomodoro Timer**.
   - As a user, I want to track my daily or weekly habits and view streaks using the **Habit Tracker**.
   - As a user, I want to manually start/stop timers for activities and categorize my time spent using the **Time Tracker**, and view basic time reports.
   - As a user, I want to set and track my broader personal objectives using the **Goal Tracker**.
   - As a user, I want to view lists and basic progress indicators for my productivity items (tasks, habits, time logs, goals).
   - _Note: I can use any of these productivity tools independently or together._
3. **Health and Wellness:**
   - As a user, I want to log my daily emotional state and add brief notes using the **Mood Journal**.
   - As a user, I want to record things I am thankful for daily using the **Gratitude Log**.
   - As a user, I want to manually record my bedtime, wake-up time, and rate my sleep quality using the **Sleep Log**.
   - As a user, I want to use a simple guided timer for short (1-5 minute) mindfulness or breathing exercises.
   - As a user, I want to view lists of my recent health and wellness entries.
   - _Note: I can use any of these health and wellness tools independently or together._
4. **Personal Organization:**
   - As a user, I want to capture and manage text notes with basic tagging or folder organization using the **Notes/Digital Scratchpad**.
   - As a user, I want to request an AI summary of a single note.
   - As a user, I want to manage a list of books I want to read or have completed using the **Reading List Tracker**.
   - As a user, I want to **track metadata** (name, type, tags, optional external link) for important personal documents using the **Digital Filing** tool. (MVP focuses on metadata only, not file uploads).
   - As a user, I want to define skills I'm learning and log practice sessions (time spent) or specific milestones achieved using the **Skill Progress Monitor**.
   - As a user, I want to save and organize recipes with basic tagging (e.g., "quick," "vegetarian") using the **Recipe Manager**.
   - As a user, I want to create and manage simple checklists for grocery or household needs using the **Shopping List**.
   - As a user, I want to view lists of items within each personal organization tool.
   - _Note: I can use any of these personal organization tools independently or together._
5. **Core Experience:**
   - As a user, I want to log in and log out of my account (e.g., using email/password).
   - As a user, I want to navigate easily between the different modules (Personal Finance, Productivity, Health and Wellness, Personal Organization).
   - As a user, I want a simple, clean interface that is easy to understand and use.
   - As a user, I want my data to be private and accessible only to me (and the admin for maintenance/support purposes).

### Admin User (Single Developer/Admin)

1. System Monitoring:
   - As an admin, I want to monitor basic system health and performance.
   - As an admin, I want to view logs for errors or failures (e.g., failed API calls).
2. Configuration (if any):
   - As an admin, I want to manage any system-level configurations (e.g., toggle certain features, set API keys - though many handled by env vars).

## Original API Endpoints (Version 1 Design)

### Public Endpoints

- `POST /api/v1/auth/register`: Creates a new user account. Requires username/email and password.
- `POST /api/v1/auth/login`: Authenticates a user with credentials, returns a token (e.g., JWT) or sets a session cookie.
- `POST /api/v1/auth/logout`: Invalidates the user's current session/token (requires authentication token/cookie).
- (Optional) `POST /api/v1/auth/refresh`: Refreshes an expired access token using a refresh token.
- (Note: Static content or initial landing pages handled by Next.js may not require specific API endpoints.)

### Authenticated Endpoints (Requires User Authentication)

(Note: Generate standard RESTful CRUD endpoints (GET list, GET one, POST, PUT, DELETE) for each primary resource identified in the MVP User Stories and Database Schema sections (e.g., transactions, budgets, subscriptions, savings goals, tasks, habits, time logs, goals, mood entries, gratitude logs, sleep entries, notes, reading list items, digital file metadata, skill progress items, recipes, shopping list items, categories, tags). Define clear request/response models based on Pydantic.)

**Key Resource Examples & Non-Standard Endpoints:**

1. **Auth:**
   - `GET /api/v1/auth/me` (Get current authenticated user info - requires token/session)
2. **Personal Finance:**
   - Resource endpoints for: `transactions`, `budgets`, `subscriptions`, `savings-goals`, `categories`.
   - `GET /api/v1/finance/summary` (Specific endpoint for aggregated data)
   - `POST /api/v1/finance/savings-goals/:id/contributions` (Action endpoint)
3. **Productivity:**
   - Resource endpoints for: `tasks`, `pomodoro-sessions` (logging), `habits`, `time-logs`, `goals`, `tags`.
   - `PATCH /api/v1/productivity/tasks/:id/complete` (Action endpoint)
   - `POST /api/v1/productivity/habits/:id/check-in` (Action endpoint)
   - `GET /api/v1/productivity/time-reports` (Specific endpoint for aggregated data)
4. **Health & Wellness:**
   - Resource endpoints for: `mood-entries`, `gratitude-entries`, `sleep-entries`, `mindfulness-sessions` (logging).
5. **Personal Organization:**
   - Resource endpoints for: `notes`, `reading-list-items`, `digital-files` (metadata), `skill-progress-items`, `recipes`, `shopping-list-items`, `shopping-lists`, `tags`.
   - `POST /api/v1/organization/notes/:id/summarize` (Action endpoint triggering AI)
   - `POST /api/v1/organization/skill-progress-items/:id/sessions` (Action endpoint)
   - `PATCH /api/v1/organization/shopping-list-items/:id/check` (Action endpoint)
6. **AI Integration:**
   - `POST /api/v1/ai/summarize` (General utility endpoint)
   - `POST /api/v1/ai/sentiment` (Potential future endpoint)

### Admin Endpoints (Requires Admin Authentication/Authorization)

1. Monitoring
   - `GET /api/v1/admin/system-status`
   - `GET /api/v1/admin/logs`
   - `GET /api/v1/admin/api-usage` (Monitor external API usage, e.g., OpenAI)
2. Configuration (Minimal for MVP)
   - `GET /api/v1/admin/config`
   - `PUT /api/v1/admin/config` (Placeholder for future configuration)

### Background Processes / System Tasks

(Note: These describe internal system operations rather than scheduled jobs)

1. Data Processing
   - As the system, I need to process and validate user input data received via API endpoints before storage.
   - As the system, I need to handle triggering asynchronous AI tasks (e.g., summarization) based on specific user actions or API calls (if implemented asynchronously).

## Original System Architecture Diagrams (Version 1 Design)

### Simplified Version

```text
┌───────────────────────┐     ┌───────────────────────┐
│ Client (Browser)      │     │ Vercel (Frontend)     │
│                       │     │                       │
│ Next.js App           ├────►│ React Components      │
│                       │     │ API Routes            │
└───────────┬───────────┘     └───────────┬───────────┘
            │                             │
            │                             │
            ▼                             ▼
┌───────────────────────┐      ┌───────────────────────┐
│ FastAPI Backend       │      │ External Services     │
│   (Hosted on Render)  │      │                       │
│ • Data Processing     ├─────►│ • OpenAI API          │
│ • Auth Middleware     │      │ • Other 3rd Parties   │
│ • API Endpoints       │      │                       │
└───────────┬───────────┘      └───────────────────────┘
            │
            │
            ▼
┌───────────────────────┐
│ Railway PostgreSQL       │
│                       │
│ • User Data           ├
│ • Module Data         │
│ • Analytics (Future)  │
└───────────────────────┘
```

Simplified Data Flow:

1. The user interacts with the Client (Browser) running the Next.js application.
2. Requests from the Client go through Vercel (Frontend), which hosts the Next.js app and handles serving assets and routing API calls.
3. API requests are forwarded from Vercel to the FastAPI Backend hosted on Render.
4. The Render-hosted Backend processes the requests, interacting with the Railway PostgreSQL database for persistent data storage (user data, module data).

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                 │
│                                                                           │
│ ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │
│ │  Next.js App    │   │  React States   │   │   API Client    │           │
│ │                 │   │                 │   │                 │           │
│ │• Pages/Routes   ├──►│• TanStack Query ├──►│• Axios/Fetch    │           │
│ │• Components     │   │• Local Storage  │   │• Error Handling │           │
│ │• UI             │   │• Auth Context   │   │• Rate Limiting  │           │
│ └────────┬────────┘   └─────────────────┘   └────────┬────────┘           │
│          │                                           │                    │
└──────────┼───────────────────────────────────────────┼────────────────────┘
           │                                           │
           ▼                                           ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              Vercel Layer                                  │
│                                                                            │
│ ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐            │
│ │   Edge Cache    │   │  Next.js API    │   │    Auth         │            │
│ │                 │   │   Routes        │   │                 │            │
│ │• CDN            ├──►│• API Endpoints  ├──►│• Authentication │            │
│ │• Asset Serving  │   │• Middleware     │   │• User Sessions  │            │
│ │• Route Cache    │   │• Rate Limits    │   │• RBAC           │            │
│ └─────────────────┘   └────────┬────────┘   └─────────────────┘            │
│                                │                                           │
└────────────────────────────────┼───────────────────────────────────────────┘
                                 │
                                 ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                    Backend Layer (Hosted on Render)                       │
│                                                                           │
│ ┌─────────────────┐   ┌─────────────────┐                                 │
│ │  FastAPI App    │   │  Data Services  │                                 │
│ │                 │   │                 │                                 │
│ │• API Routes     ├──►│• Data Process   ├                                 │
│ │• Pydantic       │   │• Aggregation    │                                 │
│ │• Middleware     │   │• Caching        ├                                 │
│ └────────┬────────┘   └───────┬─────────┘                                 │
│          │                    │                                           │
│ ┌─────────────────┐           │                                           │
│ │    Auth         │           │                                           │
│ │ Integration     │           │                                           │
│ │• JWT Validation ├───┐       │                                           │
│ │• User Sync      │   │       │                                           │
│ └─────────────────┘   │       │                                           │
│                       │       │                                           │
└───────────────────────┼───────┼───────────────────────────────────────────┘
                        │       │
                        ▼       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             External Services                               │
│                                                                             │
│ ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐             │
│ │  Railway Postgres  │   │  OpenAI API     │   │ Other 3rd Party │             │
│ │                 │   │                 │   │ APIs (Future)   │             │
│ │• User Data      │   │• GPT Models     │   │                 │             │
│ │• Module Data    │   │• Embeddings     │   │• Finance APIs   │             │
│ │• Analytics      │   │• Moderation     │   │• Calendar APIs  │             │
│ └─────────────────┘   └─────────────────┘   └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Detailed Data Flow:

User interaction begins in the Client Layer, where the Next.js App displays UI built with UI Components.
User actions trigger interactions with the React State managed by TanStack Query, which handles fetching and caching server data.
The API Client (e.g., Axios/Fetch) makes HTTP requests, potentially handling basic error handling and rate limiting on the client side. These requests target Next.js API Routes.
Requests traverse the Vercel Layer. Edge Cache might serve static assets or cached routes. Requests requiring backend processing hit the Next.js API Routes.
Authenticated requests are forwarded to the FastAPI Backend layer, hosted on Render.
The FastAPI App running on Render handles routing. Incoming data is validated by Pydantic.
Validated requests are processed by Data Services, which contain the core business logic for each module (Finance, Productivity, etc.).
Data Services interact with the Railway PostgreSQL database via SQLAlchemy for all persistent data operations (CRUD for module data, user profile storage).
External Services include the OpenAI API (called by Data Services or Background Tasks for AI features like summarization) and potentially Other 3rd Party APIs in the future (e.g., for finance integration, calendar sync).
Responses from External Services, and Database are processed by Data Services and sent back through the FastAPI App, Vercel Layer, and finally to the Client Layer to update the UI.

## Original Technology Stack (Version 1 Specification)

### Configuration & Environment Management

- Environment Management:
  - Simple .env file for all environments (`.env.development`, `.env.production`, `.env.test`).
  - Basic development/production toggle via environment variables.
  - Documentation for environment variables and required secrets (API keys, database URLs).
  - Secrets management guidance (e.g., using Vercel's built-in secrets management for production).

### Frontend

- Framework: React (latest stable version) with Next.js (latest stable version) - Utilizing App Router for structure and data fetching.
- Language: TypeScript (latest stable version)
- Styling: Tailwind CSS (latest stable version)
- UI Components: Clean UI
- State Management: TanStack Query (React Query) (latest stable version) - For server state management, caching, and background updates.
- Authentication: Custom implementation using standard practices (e.g., JWT with secure cookie storage, or session-based authentication). Frontend handles storing/sending tokens or managing session cookies.

### Backend

- Framework: FastAPI (0.110.0+) - Chosen for speed, ease of use, and automatic documentation.
- Language: Python (3.11+)
- ORM: SQLAlchemy (2.0+) - For database interaction, providing an expressive and robust way to work with PostgreSQL.
- Database Migrations: Alembic (latest stable) - For managing incremental changes to the SQLAlchemy database schema.
- Package Management: pip with requirements.txt
- Data Validation: Pydantic (2.0+) - For defining data models and ensuring data integrity for API requests and responses.
- AI Integration: `openai` Python library.

### Database & Storage

- Primary Database: Railway (Serverless PostgreSQL)
  - Database Environments:
    - Development: Local PostgreSQL Instance - Recommended for faster iteration during development.
    - Production: Railway (Serverless PostgreSQL) - Provides a scalable, serverless solution.
    - Production Backup Strategy: Rely on Railway's built-in automated backup features (e.g., Point-in-Time Recovery) available within the chosen service tier. No custom backup scripts planned for MVP.

### AI/ML Integration

- LLM Integration: OpenAI API
  - Suggested Models for MVP:
    - Summarization: `gpt-4o-mini` (Cost-effective, fast) or `gpt-3.5-turbo` (established, performant). `gpt-4o` could be used for higher quality if budget allows.
    - Sentiment Analysis (Potential MVP or Fast Follow): `gpt-4o-mini` or a dedicated sentiment model/library if a simple positive/negative/neutral is sufficient and cost is a major concern.
- Note: Direct OpenAI API integration will be used for sentiment analysis and content summarization, with structured prompting patterns for consistent results.

- **Additional AI/ML Tech (Future Considerations):** Pinecone (Vector Database), TensorFlow, PyTorch, Langchain are in the tech stack but are beyond the scope of the MVP features described in the documents. They could be explored for future features like semantic search over notes, more advanced personalized recommendations, or complex data analysis pipelines.

### Deployment

- Frontend Hosting: Vercel (Hobby tier) - Ideal for Next.js applications, providing automatic deployment and scaling.
- Backend Hosting: Render (Free/Hobby Tier) - Chosen for its ease of deployment from Git, native support for Python/FastAPI (using standard WSGI servers like Uvicorn), integrated PostgreSQL (alternative to Railway if preferred, though Railway is specified).
- Database: Railway (Free tier)

## Original Best Practices & Standards (Version 1)

### Language & Framework Standards

Ensure the generated plan emphasizes adherence to current, industry-standard best practices for the entire specified technology stack (Python 3.11+, FastAPI, SQLAlchemy 2+, Pydantic 2+, React 18+, Next.js 15 App Router, TypeScript 5+, Tailwind CSS, TanStack Query).

**Key principles to highlight in the generated plan:**

- **Python/Backend:** Maintainability (PEP 8, type hints, clear structure, context managers), performance (async/await where appropriate), robustness (error handling, logging), security (input validation).
- **TypeScript/Frontend:** Type safety (strict mode), modern React patterns (hooks, functional components, performance optimizations like memoization where needed), efficient state management (TanStack Query for server state, appropriate client state solutions), component-based architecture (UI patterns), utility-first CSS (Tailwind).
- **Next.js:** App Router conventions (Server Components, Server Actions where appropriate), optimized data fetching, performance focus (code splitting, image optimization, caching).
- **General:** Clean code, clear documentation (docstrings/JSDoc), effective use of frameworks and libraries, modular design, security considerations throughout.

## Original Development Workflow (Version 1)

### Local Development

- Branch naming convention:
  - Feature: `feature/short-description`
  - Bug fix: `fix/issue-description`
  - Hotfix: `hotfix/critical-fix`
  - Chore: `chore/task-description` (for maintenance tasks)
  - Release: `release/vX.Y.Z`
- Commit message format:
  - Format: `[type]: Short description (max 50 chars)`
  - Types: `feat` (new feature), `fix` (bug fix), `docs` (documentation changes), `style` (code formatting, no functional changes), `refactor` (code restructuring, no functional changes), `test` (adding/changing tests), `chore` (build process, tooling, dependencies).
  - Example: `feat: implement basic finance transaction tracking`
  - Body (optional): More detailed explanatory text after a blank line.
  - Footer (optional): Reference issues, e.g., `Closes #123`.

## Original Minimum Viable Product (MVP) Scope (Version 1)

### Initial Module Support

- Launch with a comprehensive set of tools across four distinct modules, designed to be used independently or together:
  1. **Personal Finance Module:** Includes tools for Income/Expense Tracking, basic Budgeting, Subscription Tracking, and Savings Goal Tracking.
  2. **Productivity / Time Management Module:** Includes tools for managing To-Do Lists, using a Pomodoro Timer, tracking Habits, logging Time, and setting Goals.
  3. **Health and Wellness Module:** Includes tools for Mood Journaling, maintaining a Gratitude Log, tracking Sleep, and using a Mindfulness/Breathing Exercise Timer.
  4. **Personal Organization Module:** Includes tools for Notes/Digital Scratchpad, Reading List Tracking, basic Digital Filing (metadata), Skill Progress Monitoring, Recipe Management, and Shopping Lists.
- User authentication and basic profile management.
- Simple, clean UI using UI and Tailwind CSS, ensuring each tool feels integrated but usable on its own page or section.
- Clear navigation between modules and access to individual tools within modules.
- Basic AI summarization feature integrated into the Notes tool.

### Core Features (Per Module)

- **Personal Finance Tools:**
  - **Income/Expense Tracker:** Manual entry of transactions, user-defined categories, basic listing and filtering by category/date.
  - **Budgeting Tool:** Define monthly budget categories and allocate amounts, manual tracking against budget, simple progress view.
  - **Subscription Tracker:** Manual entry of subscription name, cost, billing cycle, due date; list view with upcoming payments.
  - **Savings Goal Tracker:** Define a goal name and target amount, manually log contributions, view progress towards the goal.
- **Productivity / Time Management Tools:**
  - **To Do List:** Create, edit, delete tasks; add due dates, simple priority flags or tags; mark as complete; list view with sorting options.
  - **Pomodoro Timer:** Simple start/stop timer with configurable work and break intervals; basic logging of completed sessions.
  - **Habit Tracker:** Define habits, daily/weekly check-off, view streak count.
  - **Time Tracker:** Manual start/stop timer for activities, assign categories to time logs, basic reports showing time spent per category.
  - **Goal Tracker:** Define personal goals (text description), set status (e.g., In Progress, Completed).
- **Health and Wellness Tools:**
  - **Mood Journal:** Text entry for daily mood and notes, simple mood rating (e.g., scale or emoji); list view of entries.
  - **Gratitude Log:** Text entry for daily gratitude points; list view.
  - **Sleep Log:** Manual entry of bedtime, wake-up time, total sleep duration calculation, subjective quality rating; list view.
  - **Mindfulness/Breathing Exercise Timer:** Simple timer with guided duration (e.g., 1, 3, 5 minutes). Basic logging of session completion.
- **Personal Organization Tools:**
  - **Notes/Digital Scratchpad:** Rich text or markdown editor for notes, basic tagging or folder structure, list view, search functionality.
  - **Reading List Tracker:** Add book title/author, status (Want to Read, Reading, Completed), basic tagging; list view.
  - **Digital Filing (Metadata Only):** Track file metadata (name, type, size, date added, user-defined tags, optional external link/location note). Does **not** include file uploading/hosting capabilities in the MVP. List view and basic tagging.
  - **Skill Progress Monitor:** Define a skill, log practice sessions (date, duration, brief notes), log milestones; view list of skills and logged sessions.
  - **Recipe Manager:** Save recipe title, source (link or text), ingredients, instructions; basic tagging (e.g., cuisine, meal type); list view.
  - **Shopping List:** Simple checklist, add/edit/delete items, mark items as purchased; multiple lists support.
- **AI Integration:** On-demand AI summarization for individual notes.
- **Data Storage:** Persisting user data for all tools in the PostgreSQL database, linked to the user account.

### Technical Requirements

- Modular Architecture:
  - Clear separation of concerns for each module (e.g., separate backend routers, frontend components, database tables).
  - Core backend services for database interaction, external API calls, and authentication middleware.
  - Extensible design to easily add new modules or features in the future.
- Data Management:
  - Relational database schema suitable for storing structured data for each module.
  - Efficient querying for displaying lists and summaries.
  - Scalable storage design in PostgreSQL.
- Performance Optimization:
  - Next.js built-in caching strategies (Data Cache, HTTP Caching).
  - Efficient data fetching using TanStack Query with caching and background updates.
  - Optimized database queries with appropriate indexing.
- Error Handling & Recovery:
  - Graceful handling of API errors (backend and external).
  - Data validation on both frontend and backend.
  - Logging of errors and failures.
  - Simple database backup strategy.
- Mobile Responsiveness:
  - Responsive design for all screen sizes using Tailwind CSS utility classes.
  - Touch-friendly interfaces.
  - Adaptive layouts for different viewports.
  - Optimized images and assets using `next/image`.
- Accessibility:
  - Strive for WCAG 2.1 AA compliance.
  - Implement keyboard navigation support.
  - Ensure screen reader compatibility through semantic HTML and ARIA attributes.
  - Meet color contrast requirements.
  - Implement proper focus management.

### API Error Handling

- External APIs (OpenAI):
  - Implement retry logic with exponential backoff for transient errors.
  - Handle specific API errors (e.g., rate limits, invalid requests).
  - Log API request failures and responses for debugging.
  - Implement a basic circuit breaker pattern for repeated failures to prevent cascading issues.
- Internal API (FastAPI):
  - Use FastAPI's built-in exception handling for standard HTTP errors (e.g., 404, 400).
  - Implement custom exception handlers for application-specific errors.
  - Return consistent error response formats (e.g., JSON with error code and message).
  - Log backend errors with sufficient detail.

## Original Entity-Relationship Diagram (Version 1 Database Design)

### Entities (Tables) and Relationships

```text
**users**
├─── has many ─── **finance_transactions** (via user_id)
├─── has many ─── **finance_budgets** (via user_id)
├─── has many ─── **finance_subscriptions** (via user_id)
├─── has many ─── **finance_savings_goals** (via user_id)
├─── has many ─── **finance_categories** (via user_id)
├─── has many ─── **productivity_tasks** (via user_id)
├─── has many ─── **productivity_pomodoro_sessions** (via user_id)
├─── has many ─── **productivity_habits** (via user_id)
├─── has many ─── **productivity_time_logs** (via user_id)
├─── has many ─── **productivity_goals** (via user_id)
├─── has many ─── **productivity_tags** (via user_id)
├─── has many ─── **health_mood_entries** (via user_id)
├─── has many ─── **health_gratitude_entries** (via user_id)
├─── has many ─── **health_sleep_entries** (via user_id)
├─── has many ─── **health_mindfulness_sessions** (via user_id)
├─── has many ─── **organization_notes** (via user_id)
├─── has many ─── **organization_reading_list_items** (via user_id)
├─── has many ─── **organization_digital_files** (via user_id)
├─── has many ─── **organization_skill_progress_items** (via user_id)
├─── has many ─── **organization_recipes** (via user_id)
├─── has many ─── **organization_shopping_lists** (via user_id)
└─── has many ─── **organization_tags** (via user_id)

**finance_transactions**
└─── belongs to ─── **users** (via user_id)
└─── belongs to ─── **finance_categories** (via category_id)

**finance_budgets**
└─── belongs to ─── **users** (via user_id)
└─── belongs to ─── **finance_categories** (via category_id)

**finance_subscriptions**
└─── belongs to ─── **users** (via user_id)

**finance_savings_goals**
└─── belongs to ─── **users** (via user_id)
└─── has many ─── **finance_savings_goal_contributions** (via goal_id)

**finance_savings_goal_contributions**
└─── belongs to ─── **finance_savings_goals** (via goal_id)

**finance_categories**
└─── belongs to ─── **users** (via user_id)

**productivity_tasks**
└─── belongs to ─── **users** (via user_id)
└─── has many through ─── **productivity_tags** (via productivity_task_tags)

**productivity_pomodoro_sessions**
└─── belongs to ─── **users** (via user_id)
└─── belongs to (optional) ─── **productivity_tasks** (via task_id)

**productivity_habits**
└─── belongs to ─── **users** (via user_id)
└─── has many ─── **productivity_habit_checkins** (via habit_id)

**productivity_habit_checkins**
└─── belongs to ─── **productivity_habits** (via habit_id)

**productivity_time_logs**
└─── belongs to ─── **users** (via user_id)
└─── belongs to ─── **productivity_time_categories** (via category_id)

**productivity_time_categories**
└─── belongs to ─── **users** (via user_id)

**productivity_goals**
└─── belongs to ─── **users** (via user_id)

**productivity_task_tags**
└─── belongs to ─── **productivity_tasks** (via task_id)
└─── belongs to ─── **productivity_tags** (via tag_id)

**productivity_tags**
└─── belongs to ─── **users** (via user_id)
└─── has many through ─── **productivity_tasks** (via productivity_task_tags)

**health_mood_entries**
└─── belongs to ─── **users** (via user_id)

**health_gratitude_entries**
└─── belongs to ─── **users** (via user_id)

**health_sleep_entries**
└─── belongs to ─── **users** (via user_id)

**health_mindfulness_sessions**
└─── belongs to ─── **users** (via user_id)

**organization_notes**
└─── belongs to ─── **users** (via user_id)
└─── has many through ─── **organization_tags** (via organization_note_tags)

**organization_note_tags**
└─── belongs to ─── **organization_notes** (via note_id)
└─── belongs to ─── **organization_tags** (via tag_id)

**organization_reading_list_items**
└─── belongs to ─── **users** (via user_id)

**organization_digital_files**
└─── belongs to ─── **users** (via user_id)
└─── has many through ─── **organization_tags** (via organization_digital_file_tags)

**organization_digital_file_tags**
└─── belongs to ─── **organization_digital_files** (via file_id)
└─── belongs to ─── **organization_tags** (via tag_id)

**organization_skill_progress_items**
└─── belongs to ─── **users** (via user_id)
└─── has many ─── **organization_skill_practice_sessions** (via skill_id)

**organization_skill_practice_sessions**
└─── belongs to ─── **organization_skill_progress_items** (via skill_id)

**organization_recipes**
└─── belongs to ─── **users** (via user_id)
└─── has many through ─── **organization_tags** (via organization_recipe_tags)

**organization_recipe_tags**
└─── belongs to ─── **organization_recipes** (via recipe_id)
└─── belongs to ─── **organization_tags** (via tag_id)

**organization_shopping_lists**
└─── belongs to ─── **users** (via user_id)
└─── has many ─── **organization_shopping_list_items** (via list_id)

**organization_shopping_list_items**
└─── belongs to ─── **organization_shopping_lists** (via list_id)

**organization_tags**
└─── belongs to ─── **users** (via user_id)
└─── has many through ─── **organization_notes** (via organization_note_tags)
└─── has many through ─── **organization_digital_files** (via organization_digital_file_tags)
└─── has many through ─── **organization_recipes** (via organization_recipe_tags)
└─── has many through ─── **productivity_tasks** (via productivity_task_tags)
```

**Explanation of Notation:**

- `└─── has many ───`: Indicates a one-to-many relationship where the first table can have multiple related records in the second table.
- `├─── has many ───`: Similar to above, used when there are more relationships listed for the first table.
- `└─── belongs to ───`: Indicates the current table has a foreign key referencing the first table (a many-to-one relationship from the current table's perspective).
- `└─── has many through ───`: Indicates a many-to-many relationship mediated by a joining table (the table name in parentheses).
- `(via column_name)`: Specifies the foreign key column used for the relationship.
- `(optional)`: Indicates that the foreign key can be null.

## Original Required Components in Generated Plan (Version 1)

1. Detailed SDLC Plan (Agile Approach)

   - Requirements Gathering & Analysis: Define detailed requirements for the MVP tools within each module.
   - System Design: Design the architecture, database schema, API endpoints, and AI integration points.
   - Implementation (Sprint-based):
     - Propose a logical sprint breakdown for the MVP (e.g., 3-5 sprints), considering dependencies and complexity. Justify the proposed breakdown. Acknowledge the significant scope of the MVP (approx. 20 tools across 4 modules) for a solo developer and ensure the sprint plan is realistic, potentially suggesting prioritizing core tools within each module first if necessary.
       - Example 3-Sprint Breakdown Suggestion:
         - _Sprint 1 Focus:_ Core infrastructure (Backend/DB/Auth setup, Frontend layout), potentially one simpler module end-to-end.
         - _Sprint 2 Focus:_ Implement key functional modules.
         - _Sprint 3 Focus:_ Implement remaining modules, refine UI/UX, add testing, basic monitoring, prepare backend for deployment on Render (e.g., configure `render.yaml` or dashboard settings, test deployment pipeline), address cross-cutting concerns.
     - _Rationale guidance:_ The generated plan should prioritize foundational elements early, introduce core features iteratively, integrate complex parts like AI mid-way, and leave refinement/testing towards the end.
   - Testing: Define a testing strategy.
   - Deployment: Plan for deploying frontend and backend to chosen platforms.
   - Maintenance & Iteration: Outline ongoing tasks and future development cycles.

2. Requirements Specification

   - Functional Requirements: Detailed list of features for each MVP tool and core functionality.
   - Non-Functional Requirements: Performance, security, accessibility, usability, etc.
   - User Stories: The MVP user stories defined above, broken down per module and tool.
   - System Requirements: Hardware/software requirements for development and deployment.

3. System Design

   - Architecture Overview: Detailed description of the layered architecture (Client, Vercel, Backend, Database, External Services) and component responsibilities. Generate relevant diagrams using Mermaid syntax to illustrate the architecture, data flow, and component interactions.
   - Database Schema: Detailed relational schema for MVP data across all tools ((including authentication endpoints: register, login, logout, me), Finance Transactions, Budget Allocations, Subscriptions, Savings Goals, Savings Goal Contributions, Productivity Tasks, Pomodoro Sessions, Habits, Habit Check-ins, Time Logs, Productivity Goals, Mood Entries, Gratitude Logs, Sleep Entries, Mindfulness Sessions, Notes, Reading List Items, Digital File Metadata, Skill Progress Items, Skill Practice Sessions, Recipes, Shopping List Items, Categories/Tags). Define tables, columns (data types, constraints), relationships (Foreign Keys), and initial indexing strategies (e.g., on user ID, dates, due dates, categories/tags). Detail the Full-Text Search implementation plan (e.g., on note content, recipe text).
   - API Endpoint Design: Detailed specifications for each API endpoint required for the MVP tools (request/response schemas using Pydantic models, query parameters, authentication/authorization requirements). Define standard success and error response formats (JSON).
   - Authentication Flow: Describe the chosen authentication mechanism (e.g., JWT over HTTPS-only cookies or session-based).
     - Registration: User submits credentials (e.g., email, password) -> Backend validates input, hashes password (using bcrypt via passlib), stores user in database.
     - Login: User submits credentials -> Backend verifies credentials against hashed password in database -> On success, backend generates a JWT (containing user ID, roles, expiry using python-jose) or creates a server-side session -> Backend sends JWT back (e.g., in response body or secure, HttpOnly cookie) or sets session cookie.
     - Authenticated Requests: Frontend includes JWT (e.g., in Authorization: Bearer header) or session cookie with subsequent requests -> Backend middleware (using FastAPI's security utilities) intercepts request, validates JWT signature/expiry or session ID -> If valid, extracts user identity and attaches it to the request context for use by endpoint logic.
     - Logout: Frontend sends logout request -> Backend invalidates JWT (if using a denylist/short expiry) or destroys server-side session. Frontend removes token/cookie.
     - Token Handling: Specify secure storage (e.g., HttpOnly, Secure cookies for JWT/sessions). Discuss refresh token strategy if using JWTs with short expiry.
     - Password Management: Detail password hashing strategy (bcrypt). Mention password reset flow (requires separate endpoints/logic - potentially post-MVP).
   - AI Integration Points: Describe where and how the OpenAI API is called (e.g., in a backend service function triggered by the summarize note endpoint). Detail the structured prompting patterns. Discuss strategies for handling potential external API errors (retry with backoff, circuit breakers, logging).
   - UI/UX Wireframe Descriptions: Textual descriptions of key screens for each MVP module/tool (e.g., Finance Dashboard with summaries, Transaction List, Add Transaction Form, Tasks List, Note Editor, Recipe View, Shopping List). Describe key user flows (e.g., logging in, navigating to a tool, adding an item, requesting a summary, marking a task complete).

4. Implementation Plan

   - Development Environment Setup:
     - Step-by-step guide for setting up Python backend (venv, dependencies), local PostgreSQL, and Next.js frontend (dependencies).
     - Configuration file setup (`.env.development`, `.env.production`, `.env.test`).
     - Environment variable documentation.
     - Secrets management guidance for development and production.
   - Database Technology:
     - Development: Local PostgreSQL Instance setup and configuration.
     - Production: Railway (Serverless PostgreSQL) setup and connection details.
     - Production Backup Strategy: State reliance on Railway's built-in automated backup features.
   - Backend Implementation: Outline the development process for FastAPI, SQLAlchemy models, business logic services for each tool, and API routers. Include details on configuring Uvicorn for production within Render.
   - Frontend Implementation: Outline the development process for Next.js pages/components for each module/tool, using UI, integrating TanStack Query for data fetching.
   - Backend Deployment (Render):
     - Detail steps for deploying the FastAPI app to Render (e.g., connecting GitHub repo, configuring build command `pip install -r requirements.txt`, start command `uvicorn main:app --host 0.0.0.0 --port $PORT`).
     - Explain how to set environment variables (Database URL, OpenAI key, Python version) using Render's environment groups or `.env` file handling.
     - Mention potential configuration via `render.yaml` for Infrastructure as Code approach.
   - Database Setup: Steps for creating the database, running migrations (using Alembic with SQLAlchemy).
   - AI Features Integration: Detail the steps for integrating the `openai` library, implementing summarization logic. Provide example prompts. Discuss potential challenges (e.g., token limits, cost, latency) and suggest cost/latency optimizations (model choice, caching, batching if applicable). Detail full-text search setup if part of MVP.
   - Testing Strategy: Outline the approach for backend unit/integration tests (pytest) and frontend basic tests (React Testing Library).

5. Database Schema

   - Detailed relational schema:
     - `users` table (will store user ID (e.g., UUID/Serial PK), email, hashed_password, timestamps).
     - `finance_transactions` table (user_id, type (income/expense), amount, category_id, date, description).
     - `finance_budgets` table (user_id, month, year, category_id, budgeted_amount).
     - `finance_subscriptions` table (user_id, name, cost, billing_cycle, next_due_date).
     - `finance_savings_goals` table (user_id, name, target_amount, current_amount, created_at).
     - `finance_savings_goal_contributions` table (goal_id, amount, date).
     - `finance_categories` table (user_id, name, type - e.g., 'expense', 'income', 'budget').
     - `productivity_tasks` table (user_id, description, due_date, priority, completed, completed_at).
     - `productivity_pomodoro_sessions` table (user_id, start_time, end_time, duration, task_id - optional).
     - `productivity_habits` table (user_id, name, frequency, created_at).
     - `productivity_habit_checkins` table (habit_id, date).
     - `productivity_time_logs` table (user_id, start_time, end_time, duration, category_id, description).
     - `productivity_time_categories` table (user_id, name).
     - `productivity_goals` table (user_id, description, status, created_at, completed_at).
     - `productivity_task_tags` table (task_id, tag_id).
     - `productivity_tags` table (user_id, name).
     - `health_mood_entries` table (user_id, date, mood_rating, notes).
     - `health_gratitude_entries` table (user_id, date, entry_text).
     - `health_sleep_entries` table (user_id, bed_time, wake_up_time, duration, quality_rating).
     - `health_mindfulness_sessions` table (user_id, date, duration).
     - `organization_notes` table (user_id, title, content, created_at, updated_at, summary - potentially stored after generation).
     - `organization_note_tags` table (note_id, tag_id).
     - `organization_reading_list_items` table (user_id, title, author, status, created_at, completed_at).
     - `organization_digital_files` table (user_id, file_name, file_type, file_size, upload_date, tags, external_url - if hosted elsewhere).
     - `organization_digital_file_tags` table (file_id, tag_id).
     - `organization_skill_progress_items` table (user_id, name, created_at).
     - `organization_skill_practice_sessions` table (skill_id, date, duration, notes).
     - `organization_recipes` table (user_id, title, source_url, ingredients_text, instructions_text).
     - `organization_recipe_tags` table (recipe_id, tag_id).
     - `organization_shopping_lists` table (user_id, name).
     - `organization_shopping_list_items` table (list_id, description, purchased, created_at).
     - `organization_tags` table (user_id, name, type - e.g., 'note', 'file', 'recipe').
   - User Table Primary Key: The `users` table primary key should be `id` (or `user_id`) of type `VARCHAR(255)` All foreign keys in other tables referencing the user must use this same type (`user_id VARCHAR(255) NOT NULL`).
   - Timestamp Consistency: Use `TIMESTAMP WITH TIME ZONE` (`TIMESTAMPTZ`) for _all_ date and time columns (e.g., `created_at`, `updated_at`, `due_date`, `date`, `start_time`, `end_time`, `bed_time`, `wake_up_time`, `upload_date`) unless a simple DATE is explicitly required.
   - Finance Categories Clarification: The `finance_categories.type` should distinguish between 'income' and 'expense'. The `finance_budgets` table should link to these existing categories via `category_id`. Ensure categories are unique per user per type (e.g., UNIQUE(user_id, name, type)).
   - Productivity Time Categories: Consider if `productivity_time_logs` could use the existing `productivity_tags` via a linking table (`productivity_time_log_tags`) instead of a separate `productivity_time_categories` table. _However, for MVP simplicity as requested, generating the separate `productivity_time_categories` table as originally listed is acceptable._
   - ID Naming: Maintain consistency in naming primary keys (e.g., always `id` of type `SERIAL` or `UUID`) and foreign keys (e.g., `[referenced_table_singular]_id`). The detailed list provided mostly follows this, just ensure it's applied everywhere.
   - Define relationships (Foreign Keys linking module/tool data to `users.user_id` and linking related tool data, e.g., transactions to categories).
   - Essential constraints (e.g., NOT NULL constraints, UNIQUE constraints where appropriate).
   - Basic indexing strategies: Add indexes on `user_id` for all user-specific tables. Add indexes on relevant date/time columns (`date`, `due_date`, `created_at`) for sorting and filtering. Index foreign key columns.
   - Full-Text Search plan: Configure PostgreSQL FTS on `organization_notes.content` and potentially `organization_recipes.ingredients_text`, `organization_recipes.instructions_text` using `tsvector` and define how to query using `tsquery`.

6. API Documentation

   - Detailed Endpoint Specifications: Provide example request and response JSON payloads for key endpoints across the new tools (e.g., `POST /finance/budgets`, `GET /productivity/habits`, `POST /health/mood-entries`, `PUT /organization/recipes/:id`). Specify query parameters for filtering, sorting, and pagination where applicable. Define authentication requirements (e.g., "Authenticated User"). Define standard JSON structures for success (`{"status": "success", "data": {...}}`) and error responses (`{"status": "error", "message": "...", "code": "..."}`).

7. Development Setup Instructions

   - Prerequisites: List required software (Python 3.11+, Node.js, Docker Compose for local DB (optional, for local dev consistency), Git).
   - Environment Setup:
     - Clone the repository.
     - Set up Python virtual environment (`python -m venv .venv`, `source .venv/bin/activate`).
     - Install backend dependencies (`pip install -r requirements.txt`).
     - Install frontend dependencies (`npm install` or `yarn install` or `pnpm install`).
     - Setup and start local PostgreSQL using Docker Compose for local DB (`docker-compose up -d`).
     - Run database migrations (`alembic upgrade head`).
   - Configuration Files:
     - Copy example `.env` file (`cp .env.example .env.development`).
     - Fill in necessary environment variables (database URL, OpenAI key).
     - Document each environment variable.
   - Run Commands:
     - Run backend (`uvicorn main:app --reload`).
     - Run frontend (`npm run dev`).
     - Access the application (localhost URLs for frontend and backend).

8. Free Tier Considerations

   - OpenAI API Usage Management:
     - Choose cost-effective models (`gpt-4o-mini`).
     - Monitor token usage via the OpenAI dashboard and potentially log usage server-side.
     - Inform users about potential limitations if usage becomes high (future).
   - Railway Database Constraints:
     - Monitor storage usage to stay within the free tier limit, especially considering file metadata and potential growth from many small entries across tools.
     - Monitor compute hours. Optimize queries to reduce compute time.
     - Implement basic data retention policies if data grows large (e.g., archive or prune old, less important data - _post-MVP consideration_).
   - Vercel Usage Optimization:
     - Optimize frontend assets and code splitting to reduce build size and function durations.
     - Leverage caching effectively.
   - Render Free Tier Constraints:
     - Instance Spin-down: Be aware that Render free web services spin down after 15 minutes of inactivity and require ~30 seconds to restart on the next request, which might impact user experience for infrequent use.
     - Resource Limits: Free tiers have limits on CPU/RAM which might affect performance under load.
     - Egress Bandwidth: Monitor bandwidth usage against free tier limits (typically generous but good to be aware of).

9. Monitoring & Maintenance

   - Basic Monitoring:
     - Implement simple logging for application errors, external API call failures, and background task status.
     - Use basic monitoring tools provided by hosting platforms (e.g., Render's log streaming and basic metrics dashboard, Vercel's logs).
     - Manually check logs daily for errors.
     - Track external API usage (OpenAI) via their dashboards and potentially custom logging.
   - Free Tier Alerts: Set up alerts (if provided by hosting/service providers) for approaching free tier limits.
   - External Service Handling: Plan for handling downtime (graceful degradation) and errors from external services (OpenAI). Implement retry mechanisms.
   - Maintenance: Plan for regular dependency updates, security patching, and database maintenance (e.g., monitoring performance).

## Content Processing (Renamed to Data Processing & AI Integration)

1. Data Handling

   - User Input Processing: Receive and validate user input data for each module via API endpoints.
   - Source Attribution: Data is user-generated, linked to their account.
   - Storage: Persist structured data in the PostgreSQL database.

2. Analysis Pipeline (AI Integration)

   - AI Summarization: Process note content using the OpenAI API upon user request.
   - Sentiment Analysis (Potential Fast Follow): Analyze sentiment of wellness entries or notes using OpenAI API. Store results or analyze on demand.
   - Task Suggestion (Future): Analyze note content to suggest potential tasks.

3. Content Presentation
   - Display Lists: Present user data in simple lists within each module's UI.
   - Basic Summaries: Provide aggregate views for Finance.
   - AI Results: Display AI-generated summaries within the Notes module.
   - Content Filtering/Sorting: Implement basic filtering (e.g., by date) and sorting (e.g., by due date for tasks).

## Quality Requirements

### Code Quality & Structure

1. Architecture:
   - Demonstrate a modular design with clear separation of concerns for each module and tool (e.g., `frontend/modules/[module-name]/`, `backend/app/api/v1/routers/[module-name]/`, `backend/app/services/[module-name]/`, `backend/app/models/[module-name]/`) -- although do keep in mind Next.js naming conventions.
   - Organize code logically within each layer, module, and tool.
   - Structure supports maintainability and future tool/module additions.
2. Python Backend:
   - Apply appropriate programming paradigms (OOP for SQLAlchemy models/services, functional for FastAPI endpoints).
   - Use type hints extensively.
   - Include comprehensive docstrings for functions, classes, and modules.
   - Adhere strictly to PEP 8 compliance (enforce with linters).
3. TypeScript Frontend:
   - Use strict TypeScript configuration.
   - Employ functional components and standard React/Next.js patterns (hooks, App Router conventions).
   - Explain state management choices (TanStack Query for server state, useState/useReducer/Context for local/global client state).
   - Follow Tailwind v4 utility patterns and optimizations.
   - Implement custom hooks following React 18 guidelines where beneficial.
   - Proper state management with modern patterns (avoid prop drilling).
   - Effective code splitting and lazy loading for routes and components.
   - Apply performance optimization techniques as needed.

### Documentation

1. Code Documentation:
   - Detailed docstrings for Python functions, classes, and modules.
   - JSDoc comments for TypeScript functions, components, and types.
   - Architecture diagrams (Mermaid syntax - _to be provided separately_).
   - Detailed data flow documentation.
   - README file with project overview, setup instructions, and key architecture notes.
2. Setup Instructions:
   - Comprehensive, step-by-step guide for setting up the local development environment.
   - Detailed configuration guides, including environment variables.
   - Basic troubleshooting steps for common setup issues.
   - Explanation of development workflows (branching, commits, running tests).
3. API Documentation:
   - Utilize FastAPI's automatic OpenAPI/Swagger UI.
   - Supplement with markdown documentation specifying request/response schemas, parameters, authentication, and error handling for key endpoints.
   - Include example requests and responses.
   - Describe authentication flows.
   - Document standard error handling formats.

### Testing Requirements

1. Backend Testing:
   - Write unit tests (using `pytest`) for critical business logic functions and services across all tools.
   - Implement integration tests for database interactions for each tool.
   - Write API endpoint tests (using `pytest` with `httpx` or FastAPI's `TestClient`) to verify endpoint behavior, validation, and authentication for all tool endpoints.
2. Frontend Testing:
   - Write basic unit tests for React components using React Testing Library to ensure they render correctly and respond to simple interactions.
   - Implement key user flow tests for critical paths within each module/tool (e.g., adding a transaction, marking a task complete, logging a mood, creating a note).

### Security Requirements

1. Authentication:
   - Secure implementation of the chosen authentication method (e.g., JWT with strong secret, secure cookie flags; or robust session management).
   - Validate JWTs/session tokens on the backend (FastAPI middleware) to secure all authenticated API endpoints. Use libraries like `python-jose` correctly.
   - Implement strong password hashing (e.g., bcrypt via `passlib`).
   - Implement role-based access control (RBAC) if differentiating between regular users and the single admin (e.g., admin endpoints require a specific role/permission check based on user data).
   - Protect API endpoints requiring user data by ensuring the request is authenticated and the data accessed belongs to the authenticated user (row-level security principle).
2. Data Protection:
   - Implement robust input validation on the backend using Pydantic for all incoming data.
   - Prevent Cross-Site Scripting (XSS) by properly sanitizing or escaping user-generated content before rendering on the frontend.
   - Implement Cross-Site Request Forgery (CSRF) protection (Next.js might provide this, verify backend also handles it if necessary for form submissions).
   - Implement rate limiting on API endpoints to prevent abuse.
   - Ensure sensitive data (e.g., financial amounts) is handled securely and stored appropriately in the database.

### Accessibility & Mobile Requirements

1. Mobile Responsiveness:
   - Implement responsive design breakpoints using Tailwind CSS.
   - Adopt a mobile-first design approach where layout and components are designed for smaller screens first and scaled up.
   - Ensure touch target sizes are adequate for mobile use.
   - Optimize performance for mobile devices (image optimization, code splitting).
2. Accessibility Standards:
   - Aim for WCAG 2.1 AA compliance as a development standard.
   - Ensure full keyboard navigation support for all interactive elements.
   - Use semantic HTML5 elements correctly.
   - Add appropriate ARIA attributes where semantic HTML is insufficient for screen readers.
   - Test with screen readers (e.g., VoiceOver, NVDA) to ensure usability.
   - Validate color contrast ratios to meet WCAG guidelines.
   - Manage focus effectively, especially in modals or dynamic content updates.

## Future Considerations

1. Mobile App - Make web app into a Mobile App:
   - Technical Approach Exploration:
     - Progressive Web App (PWA): Investigate the feasibility and benefits of converting the web app into a PWA for cross-platform compatibility and potentially faster development. Evaluate required changes to the existing codebase.
     - Cross-Platform Frameworks (React Native/Flutter): Research the potential of using frameworks like React Native or Flutter for building native-like mobile apps for both iOS and Android from a single codebase. Assess the learning curve and integration with the current backend.
     - Native Mobile Apps: Consider the longer-term option of building fully native iOS (Swift/Objective-C) and Android (Kotlin/Java) apps if performance and full access to device features become critical.
   - Core Mobile Use Case Definition: Identify the primary ways users will interact with the Life Dashboard on their mobile devices (e.g., quick data entry, checking key metrics on the go, receiving notifications).
   - Mobile-First Design Considerations: Plan for a user interface and experience optimized for smaller screens and touch interactions. This may involve simplifying navigation and prioritizing key information.
   - Data Synchronization Strategy: Define how data will be seamlessly synchronized between the web app and the mobile app to ensure a consistent user experience across platforms.
   - Offline Access Planning: Determine which features or data should be accessible offline to accommodate users with limited or no internet connectivity.
   - Notification Integration: Explore the potential for using push notifications to provide timely reminders, insights, or updates to users on their mobile devices.
   - Performance Optimization for Mobile: Outline strategies for ensuring the mobile app is fast, responsive, and efficient in terms of battery and data usage.
   - Initial Feature Set for Mobile: Prioritize the core features of the web app that will be included in the initial mobile app release. Avoid overwhelming the first version with too much functionality.
2. Scalability:
   - Tool/Module diversity expansion: Plan for adding more life management tools or entirely new modules.
   - Historical data management: Strategies for handling growing amounts of user data over time, including archiving or data tiering.
   - Processing pipeline optimization: Improving the efficiency of data processing and AI integration as usage grows and features become more complex.
   - Real-time update capabilities: Exploring technologies like WebSockets for real-time data synchronization between devices or users (if collaboration features added later).
   - Database scaling (beyond Railway Free Tier): Migrating to larger Railway plans or other PostgreSQL hosting solutions.
   - Backend scaling: Deploying multiple instances of the FastAPI application behind a load balancer.
   - File Storage Solution: Implementing a more robust solution for Digital Filing (e.g., S3-compatible storage) if file uploads become a core feature.
3. Monetization (Transitioning from Freemium MVP):
   - Premium insights: Offer more advanced analytics, reports, or AI features (e.g., predictive insights, deeper analysis) for paid users.
   - Advanced tool features: Unlock more complex functionalities within existing tools (e.g., recurring transactions, advanced budgeting rules, goal linking) for premium users.
   - API access: Provide API access for users to integrate their Life Dashboard data with other tools (paid feature).
   - Increased limits: Offer higher limits on data storage, number of items, or AI usage for paid tiers.
4. User Growth (Beyond Solo Admin):
   - User feedback mechanisms: Implement ways for users to suggest new tools or features.
   - User onboarding and tutorials: Develop guides to help new users get started with the various tools.
   - Community features: (Less aligned with simple personal tool, potentially separate project or feature).
   - Customization options: Allow users more control over dashboard layout, themes, or tool configurations.
5. Content Enhancement (Advanced AI/ML Integration):
   - Advanced sentiment analysis: More nuanced sentiment analysis using fine-tuned models or techniques on journal/note entries.
   - Cross-module data integration analysis: AI analyzing data across different modules for deeper personal insights (e.g., how sleep affects productivity).
   - Automated trend detection: Identifying personal trends in user data (e.g., spending habits over time, productivity patterns by day).
   - Custom report generation: AI generating personalized summaries or reports based on user data.
   - **Potential vector database integration (Pinecone):** For implementing semantic search over notes, recipes, or digital file content.
   - **Consider LangChain integration:** For orchestrating more complex AI pipelines involving multiple steps or models for advanced features.
   - **TensorFlow/PyTorch:** For training custom models if needed for highly specific tasks (likely far future, requires significant data).
   - AI-powered task suggestions from notes or other inputs.
   - AI assistance for budgeting or financial planning.

## Output Format Requirements

The generated plan should:

1. Be well-structured and organized using markdown headings and lists.
2. Provide clear, step-by-step setup instructions.
3. Provide project scaffolding (described textually or via directory structure), core functional code examples (e.g., a simple FastAPI endpoint, a basic React component fetching data, a SQLAlchemy model definition), and configuration templates (e.g., `.env.example`). Code should be well-commented.
4. Generate a logical file structure for both frontend and backend. Code should follow standard formatting conventions (PEP 8 for Python, Prettier for TS/JS) and demonstrate modularity.
5. Code should demonstrate adherence to specified best practices (type safety, basic error handling, framework conventions). Explain design choices where relevant (e.g., why a specific hook was used, how SQLAlchemy models map to the database).
6. Implement foundational error handling for common scenarios (API request failures, basic input validation). Describe the overall error handling strategy and acknowledge potential unaddressed edge cases (e.g., complex data migration errors).
7. Explicitly address the specified free tier limitations (Vercel, Render, Railway, OpenAI) and API constraints (OpenAI) in the design and implementation plan, suggesting strategies to mitigate them.
8. Ensure setup instructions and the overall plan are feasible for a solo developer with intermediate experience in the specified technologies.
9. Focus on MVP features as defined in the scope, clearly listing each tool.
10. Include clear progression paths for future development based on the "Future Considerations" section.

## Note on Original Implementation (Version 1)

This original project plan was designed for a solo developer learning modern web development technologies. The implementation prioritized simplicity and maintainability while providing room for future enhancements and scaling. The focus was on building a solid foundation for the core Life Dashboard modules and integrating the specified technologies effectively.

**Historical Note:** This Version 1 plan served as the foundation for the current production implementation (Version 2). Many of the core concepts, architecture decisions, and feature specifications from this original plan have been successfully implemented and evolved in the current system.

---

_End of Version 1 Legacy Documentation_
