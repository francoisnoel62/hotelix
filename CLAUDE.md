# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hotelix** is a Next.js 15 hotel management application with TypeScript, Prisma, and Tailwind CSS. The project uses the App Router architecture with PostgreSQL as the database.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database using `prisma/seed.ts`

## Architecture & Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **UI Components**: Radix UI primitives with shadcn/ui (New York style)
- **Icons**: Lucide React
- **Build Tool**: Turbopack

## Database Schema

The application uses a hotel management domain model with:
- **User** model with role-based access (MANAGER/STAFF)
- **Hotel** model with location information
- Users belong to hotels (many-to-one relationship)

## Project Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/components/ui/` - shadcn/ui reusable components
- `src/lib/` - Utility functions and shared logic
- `prisma/` - Database schema, migrations, and seed files

## UI Component System

This project uses shadcn/ui with:
- **Style**: "new-york" variant
- **Base color**: neutral
- **CSS variables**: enabled
- **Path aliases**: `@/components`, `@/lib`, `@/ui`, `@/hooks`
- Components follow Radix UI patterns with CVA for variants

## Key Configuration

- **TypeScript**: Uses `@/*` path alias for `./src/*`
- **ESLint**: Next.js TypeScript configuration with core-web-vitals
- **Prisma**: PostgreSQL provider, uses `DATABASE_URL` environment variable