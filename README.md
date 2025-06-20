# 中文学习 - Chinese Learning Landing Page

A clean, minimal landing page for a Chinese language learning application.

## ✨ Features

- **Modern Design**: Beautiful gradient backgrounds and animations
- **Responsive Layout**: Works perfectly on desktop and mobile devices
- **Interactive Elements**: Demo pronunciation button and contact form
- **Feature Highlights**: Three main feature blocks showcasing the app benefits
- **Clean Typography**: Uses Inter font for Latin text and Noto Sans SC for Chinese characters

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🏗️ Project Structure

```
├── app/
│   ├── globals.css          # Global styles and animations
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Landing page component
├── components/
│   └── ui/
│       ├── button.tsx       # Reusable button component
│       └── card.tsx         # Reusable card component
├── lib/
│   └── utils.ts             # Utility functions (cn for className merging)
└── package.json             # Dependencies and scripts
```

## 🎨 Technologies Used

- **Next.js 14** - React framework with app router
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Radix UI** - Accessible UI primitives

## 📱 Landing Page Sections

1. **Hero Section**: Main headline "Изучайте 中文 эффективно" with call-to-action buttons
2. **Features Section**: Three feature blocks highlighting:
   - Smart learning system with AI-powered spaced repetition
   - Real pronunciation with native speaker audio
   - Personal progress tracking and statistics
3. **Contact Form**: Simple feedback form for user inquiries
4. **Footer**: Branding and copyright information

## 🎯 Key Features Removed

This is a minimal version with all complex functionality removed:
- ❌ Authentication system (login/register)
- ❌ Protected routes and dashboards
- ❌ Supabase integration
- ❌ Flashcard system and study components
- ❌ User progress tracking
- ❌ Category management

## 💻 Development

The landing page is fully static and doesn't require any backend services. All interactive elements (demo button, contact form) use mock functionality.

## 🚀 Deployment

This project can be deployed to any static hosting service:
- Vercel (recommended for Next.js)
- Netlify
- GitHub Pages
- Any static hosting provider

## 📝 License

© 2024 Chinese Learning App. All rights reserved. 