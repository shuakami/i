export interface HeartRateData {
  user_id: string;
  device_id: string;
  alarm_state: string;
  last_non_zero_hr: number;
  last_timestamp: number;
  is_watch_off: boolean;
  recent_hrs: Array<{
    HeartRate: number;
    Timestamp: number;
  }>;
  timestamp: number;
}

export interface ActivityData {
  user_id: string;
  timestamp: number;
  process_name: string;
  window_title: string;
  mouse_idle_seconds: number;
  is_fullscreen: boolean;
  extra_info: string;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  isDark: boolean;
}

// 活动详情，由 getActivityDetails 生成
export interface ActivityDetails {
  type: ActivityType;
  subType?: ActivitySubType;
  description: string;
  rawTitle: string;
  rawProcess: string;
  focusLevel?: "high" | "medium" | "low";
  intensity?: "high" | "medium" | "low";
}

// 可用性状态预测结果
export interface AvailabilityStatus {
  status: string;
  reason: string;
  color: string;
  suggestion?: string;
}

export enum ActivityType {
  GAMING = "gaming",
  WORKING = "working",
  LEARNING = "learning",
  ENTERTAINMENT = "entertainment",
  SOCIAL = "social",
  AI_INTERACTION = "ai_interaction",
  BROWSING = "browsing",
  MEETING = "meeting",
  NOTE_TAKING = "note_taking",
  PLANNING = "planning",
  SYSTEM_TASK = "system_task",
  IDLE = "idle",
  UNKNOWN = "unknown",
}

export enum ActivitySubType {
  // Gaming SubTypes
  GAMING_INTENSE = "gaming_intense",
  GAMING_CASUAL = "gaming_casual",
  GAMING_STRATEGY = "gaming_strategy",

  // Working SubTypes
  CODING_ACTIVE = "coding_active",
  CODING_DEBUGGING = "coding_debugging",
  WRITING_DOCS = "writing_docs",
  DESIGNING_UIUX = "designing_uiux",
  PROJECT_MANAGEMENT = "project_management",
  ANDROID_DEVELOPMENT = "android_development",
  WEB_DEVELOPMENT = "web_development",

  // Learning SubTypes
  LEARNING_VIDEO_COURSE = "learning_video_course",
  LEARNING_READING_DOCS = "learning_reading_docs",
  LEARNING_CODING_PRACTICE = "learning_coding_practice",

  // Entertainment SubTypes
  WATCHING_MOVIE_SERIES = "watching_movie_series",
  WATCHING_SHORT_VIDEO = "watching_short_video",
  LISTENING_MUSIC = "listening_music",
  READING_NOVEL_COMIC = "reading_novel_comic",

  // Social SubTypes
  CHATTING_IM = "chatting_im", 
  BROWSING_SOCIAL_MEDIA = "browsing_social_media",
  VOICE_VIDEO_CALL = "voice_video_call", 

  // AI Interaction SubTypes
  AI_CHATTING_ASSISTANT = "ai_chatting_assistant",
  AI_CODE_GENERATION = "ai_code_generation",
  AI_IMAGE_GENERATION = "ai_image_generation",

  // Browsing SubTypes
  BROWSING_NEWS = "browsing_news",
  BROWSING_FORUM = "browsing_forum",
  BROWSING_SHOPPING = "browsing_shopping",
  BROWSING_RESEARCH = "browsing_research", 
  BROWSING_GENERAL = "browsing_general",

  // Meeting SubTypes
  MEETING_ONLINE_CONFERENCE = "meeting_online_conference",
  MEETING_PRESENTING = "meeting_presenting",

  // NoteTaking SubTypes
  NOTE_TAKING_QUICK = "note_taking_quick",
  NOTE_TAKING_ORGANIZING = "note_taking_organizing",

  // Planning SubTypes
  PLANNING_TASK_MANAGEMENT = "planning_task_management",
  PLANNING_BRAINSTORMING = "planning_brainstorming",

  // SystemTask SubTypes
  SYSTEM_COMPILING = "system_compiling",
  SYSTEM_RENDERING = "system_rendering",
  SYSTEM_UPDATING = "system_updating",
}

export interface SportsActivity {
  id: string;
  type: string;
  start_time: string; // TIMESTAMPTZ is a string in JSON
  end_time: string;   // TIMESTAMPTZ is a string in JSON
  total_time: number; // REAL can be number
  total_distance: number;
  start_latitude: number;
  start_longitude: number;
  moving_time: number;
  average_speed: number;
  average_heartrate: number;
  elevation_gain: number;
  sync_time: string; // TIMESTAMPTZ is a string in JSON
}

export interface ActivityTrackPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  altitude: number;
}

export interface SportsActivityDetailed extends SportsActivity {
  track_points: ActivityTrackPoint[];
}
