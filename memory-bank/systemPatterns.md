# System Patterns - Chinese Learning Application

## Architecture Overview

### Frontend Architecture (Next.js 14)
```
app/
├── page.tsx (Landing page)
├── student/page.tsx (Student dashboard)
├── teacher/page.tsx (Teacher dashboard)
├── study/[category]/page.tsx (Dynamic study routes)
└── layout.tsx (Root layout with navigation)
```

### Component Architecture
```
components/
├── AuthModal.tsx (Authentication handling)
├── FlashcardStudy.tsx (Core learning component)
└── ui/ (Reusable UI primitives)
    ├── button.tsx
    └── card.tsx
```

### API Layer Structure
```
lib/
├── supabaseClient.ts (Database connection)
├── questionsApi.ts (Content management)
├── userActivityApi.ts (Activity tracking)
├── userStatisticsApi.ts (Statistics calculation)
└── userUtils.ts (User management utilities)
```

## Key Technical Decisions

### Database Schema Design
- **UUID-based user identification**: Uses Supabase Auth UUIDs for user relationships
- **Separate statistics table**: `user_statistics` table for performance optimization
- **Activity tracking**: Granular session and question view tracking
- **Category-based content**: Flexible content organization system

### Authentication Strategy
- **Supabase Auth**: Leverages built-in authentication system
- **Email confirmation disabled**: Streamlined registration for development
- **Auto-confirmation trigger**: Database trigger sets email_confirmed_at automatically
- **Session management**: Client-side session handling with Supabase client

### State Management Patterns
- **React useState**: Local component state for UI interactions
- **useEffect hooks**: Data fetching and lifecycle management
- **Loading states**: Comprehensive loading/error state handling
- **Real-time updates**: Statistics update during study sessions

## Design Patterns in Use

### API Communication
```typescript
// Consistent error handling pattern
try {
  const data = await apiFunction()
  setData(data)
} catch (error) {
  console.error('Operation failed:', error)
  setError('User-friendly error message')
}
```

### Component Composition
- **Container/Presenter**: Separate data fetching from presentation
- **Compound Components**: UI components compose together cleanly
- **Custom Hooks**: Reusable logic extraction (when needed)

### Routing Strategy
- **App Router**: Next.js 14 app directory structure
- **Dynamic Routes**: Category-based study routes with URL encoding
- **Protected Routes**: Authentication checks for student/teacher areas
- **Navigation**: Programmatic routing with Next.js router

## Component Relationships

### Data Flow
```
Supabase Auth → userUtils → Statistics APIs → Dashboard Components
                     ↓
Database → API Layer → React Components → User Interface
```

### Authentication Flow
```
User Login → Supabase Auth → UUID Verification → Dashboard Access
                                  ↓
          Statistics Initialization → Progress Tracking
```

### Study Session Flow
```
Category Selection → Question Loading → Flashcard Display → Progress Update
                                           ↓
                           Statistics Tracking → Database Update
```

## Critical Implementation Paths

### User Registration
1. AuthModal component handles form submission
2. Supabase creates user with UUID
3. Database trigger auto-confirms email
4. User statistics record initialized
5. Redirect to appropriate dashboard

### Study Session
1. Category selection from student dashboard
2. Questions loaded from API with error handling
3. FlashcardStudy component manages session state
4. Progress tracked in real-time
5. Statistics updated on completion

### Statistics Display
1. UUID retrieved from Supabase Auth
2. User verification in users table
3. Statistics queried by UUID
4. Real-time updates during sessions
5. Dashboard displays current values

## Performance Optimizations
- **Static generation**: Landing page pre-rendered
- **Lazy loading**: Study components loaded on demand
- **Efficient queries**: UUID-based filtering for user data
- **Caching strategies**: Supabase built-in caching utilized
- **Loading states**: Prevent UI blocking during data fetching 