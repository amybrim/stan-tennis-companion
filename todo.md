# Stan Tennis Companion — TODO

## Setup & Foundation
- [x] Configure deep navy (#0D1B3E) and clay orange (#E8651A) color palette in index.css
- [x] Set up large, accessible typography (tablet-optimized, min 18px base)
- [x] Configure dark theme with navy background
- [x] Add Google Fonts (Playfair Display + Inter)
- [x] Build database schema: memories, family_drops, pick_battles, guest_sessions, chat_messages
- [x] Apply database migrations

## Core Architecture
- [x] Guest session system (no login, Steve lands directly in app)
- [x] Bottom navigation bar with 6 tabs (Home, Stan, Tours, Picks, Memories, Drops)
- [x] App shell / StanLayout wrapper with persistent header and Voice Aid

## Feature 1: Morning Briefing (Home)
- [x] Daily greeting from Stan
- [x] Bible verse / prayer of the day (LLM-generated from verse)
- [x] Today's top ATP matches summary
- [x] Today's top WTA matches summary
- [x] Warm, welcoming daily start screen design

## Feature 2: Voice Aid
- [x] Large prominent microphone button in header
- [x] MediaRecorder API for audio capture
- [x] Audio upload to storage + Whisper transcription
- [x] Routes to Stan chat with transcribed message
- [x] Visual feedback (pulse animation when listening)

## Feature 3: Companion Chat
- [x] Stan AI persona system prompt (tennis-savvy, warm, calls user Steve)
- [x] Chat interface with message history
- [x] LLM responses via invokeLLM
- [x] Chat history persistence per guest session
- [x] Suggestion chips on empty state

## Feature 4: ATP & WTA Tournament Pages
- [x] Tournament list page (All/ATP/WTA filter tabs)
- [x] Tournament detail with draw/bracket info
- [x] Match schedule display
- [x] LLM-powered tournament data
- [x] Rankings section per tournament

## Feature 5: Pick Battle
- [x] Stan auto-generates match prediction with reasoning
- [x] Steve picks his own winner
- [x] Results tracking in database
- [x] Running win/loss scoreboard (Stan vs Steve)
- [x] Pick history display with resolve functionality

## Feature 6: Memory Keeper
- [x] Add memory form (emoji, author, title, content)
- [x] Memory list display
- [x] Persistent storage in database
- [x] Delete memory functionality
- [x] Family can add memories with their name

## Feature 7: Family Drops
- [x] Leave a message form (family member name + message)
- [x] Steve's inbox view of drops
- [x] Unread indicator on nav badge
- [x] Mark as read functionality
- [x] New vs. read drops separation

## Polish & Delivery
- [x] All pages responsive and tablet-optimized
- [x] Large touch targets throughout (min 48px)
- [x] Smooth animations (fade-in, slide-up, pulse-mic)
- [x] 11 vitest tests passing (0 failures)
- [x] TypeScript: 0 errors
- [x] Final screenshot verification — all 6 pages confirmed
- [x] Checkpoint and deliver

## TTS Update
- [x] "Listen to Full Briefing" master button at top of Morning Briefing (reads entire briefing aloud)
- [x] Individual listen buttons on Stan's message, Morning Prayer, ATP Today, WTA Today sections
- [x] Animated sound wave indicator when audio is playing
- [x] Tap again to stop — toggle behaviour
- [x] Preferred warm English voice selection (Daniel, Alex, Samantha, Google US, Microsoft)
- [x] Speech cancelled on page unmount (no ghost audio)

## Analytics System
- [x] analytics_events table in DB schema and migration applied
- [x] Server DB helpers: logAnalyticsEvent, getEventCounts, getTopPhrases, getHourlyActivity, getDailyActivity, getDailyVoiceAid, getCategoryBreakdown, getTotalSessions, getTotalEvents
- [x] analytics.log and analytics.dashboard tRPC procedures
- [x] useAnalytics hook with fire-and-forget tracking (never blocks user)
- [x] Tracking wired into all pages: MorningBriefing, CompanionChat, PickBattle, MemoryKeeper, FamilyDrops, TennisTriva, Tournaments
- [x] /admin/analytics dashboard with 30-day trend, feature usage bar chart, category pie chart, hourly heatmap, top phrases
- [x] Printable usage report button (window.print with print-only table layout)
- [x] Transparency footer note from Julia in StanLayout
