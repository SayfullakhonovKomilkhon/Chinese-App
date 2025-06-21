# Technical Context - Chinese Learning Application

## Technology Stack

### Frontend Framework
- **Next.js 14.2.30**: React framework with App Router
- **TypeScript 5**: Type safety and developer experience
- **React 18**: UI library with modern hooks and features

### Styling & UI
- **Tailwind CSS 3.3.0**: Utility-first CSS framework
- **tailwindcss-animate**: Animation utilities
- **Framer Motion 12.18.1**: Advanced animations and transitions
- **Lucide React 0.294.0**: Modern icon library
- **Radix UI**: Accessible UI primitives (@radix-ui/react-slot)

### Backend & Database
- **Supabase**: Backend-as-a-Service platform
  - PostgreSQL database
  - Authentication system
  - Real-time subscriptions
  - Row Level Security (RLS)
- **@supabase/supabase-js 2.50.0**: Official JavaScript client

### Development Tools
- **ESLint**: Code linting with Next.js config
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing
- **dotenv 16.5.0**: Environment variable management

### Utility Libraries
- **class-variance-authority 0.7.0**: Component variant management
- **clsx 2.0.0**: Conditional className utility
- **tailwind-merge 2.0.0**: Tailwind class merging

## Development Setup

### Environment Requirements
- Node.js (implied by package.json dependencies)
- npm or yarn package manager
- Supabase account and project

### Key Configuration Files
- `next.config.js`: Next.js configuration
- `tailwind.config.ts`: Tailwind CSS customization
- `tsconfig.json`: TypeScript compiler options
- `postcss.config.js`: PostCSS processing setup
- `components.json`: UI component configuration

### Scripts Available
```json
{
  "dev": "next dev",          // Development server
  "build": "next build",      // Production build
  "start": "next start",      // Production server
  "lint": "next lint"         // Code linting
}
```

## Database Configuration

### Supabase Setup
- **Auto Email Confirmation**: Disabled via dashboard settings
- **Database Trigger**: `supabase-auto-confirm-email.sql` for auto-confirmation
- **User Activity Table**: `create-user-activity-table.sql` for statistics
- **UUID-based References**: All user relations use Supabase Auth UUIDs

### Key Database Tables
- `users`: User profiles (linked to auth.users via uuid_id)
- `user_statistics`: Aggregated user learning statistics  
- `user_activity`: Detailed activity tracking
- `questions`: Learning content organized by categories

## Technical Constraints

### Platform Limitations
- **Client-Side Rendering**: Some components require 'use client' directive
- **Supabase RLS**: Row Level Security policies must be configured
- **Authentication State**: Client-side session management required
- **UUID Dependencies**: All user data tied to Supabase Auth UUIDs

### Performance Considerations
- **Bundle Size**: Rich animation libraries increase build size
- **Database Queries**: UUID-based filtering for user data isolation
- **Real-time Updates**: Statistics tracking during active sessions
- **Mobile Responsiveness**: Tailwind responsive design patterns

## Integration Patterns

### Supabase Client Usage
```typescript
// Singleton pattern for Supabase client
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)
```

### Authentication Integration
- Client-side session handling
- UUID-based user identification
- Automatic session refresh
- Protected route patterns

### API Layer Organization
- Modular API functions in lib/ directory
- Consistent error handling across modules
- TypeScript interfaces for data contracts
- Real-time subscription patterns (when needed)

## Development Workflow

### Local Development
1. `npm install` - Install dependencies
2. Environment variables setup (Supabase keys)
3. `npm run dev` - Start development server
4. Database schema application via Supabase dashboard

### Production Deployment
1. `npm run build` - Create optimized build
2. Environment variables configured
3. `npm start` - Production server
4. Database migrations applied

## Tool Usage Patterns

### Component Development
- Tailwind-first styling approach
- TypeScript interfaces for props
- Framer Motion for enhanced animations
- Radix UI for accessibility compliance

### State Management
- React hooks for local state
- Supabase client for server state
- Context providers for global state (when needed)
- Loading and error state patterns

### Code Organization
- App Router for routing
- Component co-location in components/
- API utilities in lib/
- UI primitives in components/ui/ 