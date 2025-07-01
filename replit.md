# Nijalaya - Personal Family Hub

## Overview

Nijalaya is a comprehensive Progressive Web Application (PWA) designed for personal family management, media tracking, and life organization. The application features a full-stack architecture with a React TypeScript frontend and Express.js backend, providing multi-user support with PIN-based authentication and a rich set of features for family data management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **API Design**: RESTful API endpoints with type-safe schemas

### Progressive Web App Features
- **Manifest**: Comprehensive PWA manifest with app metadata
- **Service Worker**: Custom service worker for caching strategies
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Offline Support**: Static asset caching and dynamic content strategies

## Key Components

### Authentication System
- Multi-user support with username-based profiles
- Optional PIN protection for individual profiles
- Session persistence with automatic timeout
- Profile avatar and customization support

### Data Models
The application manages nine core data entities:
- **Users**: Profile management with avatars and PIN security
- **Family Members**: Relationship tracking with family tree structure
- **Media**: Movie, TV show, book, and game tracking with TMDB integration
- **Journal Entries**: Personal journaling with mood tracking
- **Tasks**: Task management with habits and recurring items
- **Events**: Calendar events with family member associations
- **Photos**: Gallery management with tagging and family member linking
- **Bookmarks**: URL bookmarking with categorization
- **Places**: Travel and location tracking with visit history
- **Quotes**: Personal quote collection with favoriting

### User Interface Components
- **Layout System**: Responsive layout with sidebar navigation (desktop) and bottom navigation (mobile)
- **Theme System**: Light/dark mode support with system preference detection
- **Component Library**: Extensive UI component library based on Radix UI
- **Mobile Optimization**: Touch-friendly interfaces with gesture support

## Data Flow

### Client-Server Communication
1. **API Layer**: RESTful endpoints with consistent error handling
2. **Query Management**: TanStack Query handles caching, background updates, and optimistic updates
3. **Form Submission**: React Hook Form with Zod validation ensures type safety
4. **Real-time Updates**: Query invalidation provides near real-time data synchronization

### Database Operations
1. **Schema Management**: Drizzle ORM with TypeScript-first schema definitions
2. **Migration System**: Automated database migrations with schema versioning
3. **Connection Pooling**: Neon serverless PostgreSQL with automatic scaling
4. **Data Validation**: Shared Zod schemas between client and server

### State Management
1. **Server State**: TanStack Query for API data caching and synchronization
2. **Client State**: React state for UI interactions and temporary data
3. **Persistent State**: LocalStorage for user preferences and session data
4. **Form State**: React Hook Form for complex form management

## External Dependencies

### Database and Backend
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: TypeScript ORM for database operations
- **connect-pg-simple**: PostgreSQL session store for Express
- **express**: Web application framework

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI component primitives
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **wouter**: Lightweight routing library
- **date-fns**: Date manipulation utilities

### Development Tools
- **typescript**: Type safety across the stack
- **vite**: Build tool and development server
- **tailwindcss**: Utility-first CSS framework
- **zod**: Runtime type validation
- **drizzle-kit**: Database toolkit for migrations

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite bundles React application into optimized static assets
2. **Backend Build**: ESBuild compiles TypeScript server code for Node.js
3. **Database Setup**: Drizzle migrations ensure schema consistency
4. **Static Assets**: PWA assets including service worker and manifest

### Environment Configuration
- **Development**: Local development server with hot module replacement
- **Production**: Optimized builds with asset compression and caching
- **Database**: Environment-specific connection strings and pooling
- **PWA**: Service worker registration and offline functionality

### Hosting Requirements
- **Node.js Runtime**: Server-side JavaScript execution
- **PostgreSQL Database**: Persistent data storage with session management
- **Static File Serving**: PWA assets and client application files
- **HTTPS Support**: Required for PWA features and service workers

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
- July 01, 2025. Added Family Tree visualization feature with interactive node-based layout
- July 01, 2025. Fixed event creation validation errors with proper date parsing
- July 01, 2025. Enhanced family management with separate family list and tree visualization pages
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```