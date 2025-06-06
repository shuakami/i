export interface HeartRateData {
  last_non_zero_hr: number;
  timestamp: number;
}

export interface ActivityData {
  window_title: string;
  process_name: string;
  mouse_idle_seconds: number;
}

export interface ActivityDetails {
  type: ActivityType;
  subType?: ActivitySubType;
  description: string;
  rawTitle: string;
  rawProcess: string;
  focusLevel?: "high" | "medium" | "low";
  intensity?: "high" | "medium" | "low";
}

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
  GAMING_INTENSE = "gaming_intense",
  GAMING_CASUAL = "gaming_casual",
  GAMING_STRATEGY = "gaming_strategy",

  CODING_ACTIVE = "coding_active",
  CODING_DEBUGGING = "coding_debugging",
  WRITING_DOCS = "writing_docs",
  DESIGNING_UIUX = "designing_uiux",
  PROJECT_MANAGEMENT = "project_management",
  ANDROID_DEVELOPMENT = "android_development",
  WEB_DEVELOPMENT = "web_development",

  LEARNING_VIDEO_COURSE = "learning_video_course",
  LEARNING_READING_DOCS = "learning_reading_docs",
  LEARNING_CODING_PRACTICE = "learning_coding_practice",

  WATCHING_MOVIE_SERIES = "watching_movie_series",
  WATCHING_SHORT_VIDEO = "watching_short_video",
  LISTENING_MUSIC = "listening_music",
  READING_NOVEL_COMIC = "reading_novel_comic",

  CHATTING_IM = "chatting_im",
  BROWSING_SOCIAL_MEDIA = "browsing_social_media",
  VOICE_VIDEO_CALL = "voice_video_call",

  AI_CHATTING_ASSISTANT = "ai_chatting_assistant",
  AI_CODE_GENERATION = "ai_code_generation",
  AI_IMAGE_GENERATION = "ai_image_generation",

  BROWSING_NEWS = "browsing_news",
  BROWSING_FORUM = "browsing_forum",
  BROWSING_SHOPPING = "browsing_shopping",
  BROWSING_RESEARCH = "browsing_research",
  BROWSING_GENERAL = "browsing_general",

  MEETING_ONLINE_CONFERENCE = "meeting_online_conference",
  MEETING_PRESENTING = "meeting_presenting",

  NOTE_TAKING_QUICK = "note_taking_quick",
  NOTE_TAKING_ORGANIZING = "note_taking_organizing",

  PLANNING_TASK_MANAGEMENT = "planning_task_management",
  PLANNING_BRAINSTORMING = "planning_brainstorming",

  SYSTEM_COMPILING = "system_compiling",
  SYSTEM_RENDERING = "system_rendering",
  SYSTEM_UPDATING = "system_updating",
}

interface ActivityRule {
  processMatchers: RegExp[];
  titleMatchers: RegExp[];
  activityType: ActivityType;
  activitySubType?: ActivitySubType;
  descriptionTemplate: string;
  focusLevel?: "high" | "medium" | "low";
  intensity?: "high" | "medium" | "low";
  priority: number;
}

/** 清洗并规范化文本：NFKC + 去零宽字符 + 小写 */
function normalizeText(text: string): string {
  return text.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").toLowerCase();
}

/** 从可能带路径的 processName 提取可执行文件名并清洗 */
function extractProcessName(raw: string): string {
  const cleaned = normalizeText(raw);
  const parts = cleaned.split(/[/\\]/);
  return parts[parts.length - 1];
}

/** 判断是否匹配某条规则 —— 用 "OR" 逻辑：只要 process 或 title 匹配即算命中 */
function matches(rule: ActivityRule, title: string, process: string): boolean {
  const procMatch = rule.processMatchers.some(r => r.test(process));
  const titleMatch = rule.titleMatchers.some(r => r.test(title));
  return procMatch || titleMatch;
}

/**
 * 针对"浏览"或"短视频/影视"这类，进一步根据标题关键字细化 subType/description。
 * 如果没有匹配到任何关键字，就返回空 description，后续用模板。
 */
function refineByKeywords(
  baseType: ActivityType,
  baseSub: ActivitySubType | undefined,
  cleanedTitle: string
): { type: ActivityType; subType?: ActivitySubType; description: string } {
  // 仅当 baseType 属于 BROWSING 或属于 ENT/短视频/影片 时才细化
  if (
    baseType !== ActivityType.BROWSING &&
    !(baseType === ActivityType.ENTERTAINMENT &&
      (baseSub === ActivitySubType.WATCHING_SHORT_VIDEO ||
        baseSub === ActivitySubType.WATCHING_MOVIE_SERIES))
  ) {
    return { type: baseType, subType: baseSub, description: "" };
  }

  // 学习关键词
  if (/\b(教程|课程|学习|指南|tutorial|course|docs|lecture|how to|可汗学院|khan academy)\b/i.test(
    cleanedTitle
  )) {
    return {
      type: ActivityType.LEARNING,
      subType: ActivitySubType.LEARNING_VIDEO_COURSE,
      description: "在学习",
    };
  }

  // 新闻关键词
  if (/\b(新闻|资讯|报道|news|report)\b/i.test(cleanedTitle)) {
    return {
      type: baseType,
      subType: ActivitySubType.BROWSING_NEWS,
      description: "阅读新闻资讯",
    };
  }

  // 购物关键词
  if (/\b(购物|商城|淘宝|京东|amazon|ebay)\b/i.test(cleanedTitle)) {
    return {
      type: ActivityType.BROWSING,
      subType: ActivitySubType.BROWSING_SHOPPING,
      description: "网上购物",
    };
  }

  // 电影/剧集关键词
  if (
    /\b(电影|剧集|番剧|movie|series|episode|anime)\b/i.test(cleanedTitle) &&
    baseType === ActivityType.ENTERTAINMENT
  ) {
    return {
      type: ActivityType.ENTERTAINMENT,
      subType: ActivitySubType.WATCHING_MOVIE_SERIES,
      description: "看电影/追剧",
    };
  }

  // 否则不细化，返回空 description
  return { type: baseType, subType: baseSub, description: "" };
}

const ACTIVITY_RULES: ActivityRule[] = [
  // --- 游戏类 (高优先级) ---
  {
    processMatchers: [/wutheringwaves\.exe/i, /wwlauncher\.exe/i],
    titleMatchers: [/wuthering waves/i, /鸣潮/i],
    activityType: ActivityType.GAMING,
    activitySubType: ActivitySubType.GAMING_INTENSE,
    descriptionTemplate: "玩鸣潮",
    intensity: "high",
    focusLevel: undefined,
    priority: 100,
  },
  {
    processMatchers: [/tslgame\.exe/i],
    titleMatchers: [/playerunknown's battlegrounds/i, /pubg/i],
    activityType: ActivityType.GAMING,
    activitySubType: ActivitySubType.GAMING_INTENSE,
    descriptionTemplate: "玩PUBG",
    intensity: "high",
    focusLevel: undefined,
    priority: 100,
  },
  {
    processMatchers: [/discovery\.exe/i],
    titleMatchers: [/the finals/i],
    activityType: ActivityType.GAMING,
    activitySubType: ActivitySubType.GAMING_INTENSE,
    descriptionTemplate: "玩THE FINALS",
    intensity: "high",
    focusLevel: undefined,
    priority: 100,
  },
  {
    processMatchers: [/genshinimpact\.exe/i, /yuanshen\.exe/i, /client-win64-shipping\.exe/i], // ← 新增：Wuthering Waves 在某些平台下可执行名为 Client-Win64-Shipping.exe
    titleMatchers: [/genshin impact/i, /原神/i, /鸣潮/i],
    activityType: ActivityType.GAMING,
    activitySubType: ActivitySubType.GAMING_INTENSE,
    descriptionTemplate: "玩鸣潮",
    intensity: "high",
    focusLevel: undefined,
    priority: 100,
  },
  {
    processMatchers: [/\btloupart1\.exe\b/i],
    titleMatchers: [/the last of us part i/i, /最后生还者第一部/i],
    activityType: ActivityType.GAMING,
    activitySubType: ActivitySubType.GAMING_INTENSE,
    descriptionTemplate: "玩最后生还者",
    intensity: "high",
    focusLevel: undefined,
    priority: 100,
  },
  {
    processMatchers: [/cyberpunk2077\.exe/i],
    titleMatchers: [/cyberpunk 2077/i, /赛博朋克2077/i],
    activityType: ActivityType.GAMING,
    activitySubType: ActivitySubType.GAMING_INTENSE,
    descriptionTemplate: "玩赛博朋克2077",
    intensity: "high",
    focusLevel: undefined,
    priority: 100,
  },
  {
    processMatchers: [/javaw\.exe/i, /minecraftlauncher\.exe/i],
    titleMatchers: [/minecraft\b/i, /我的世界/i],
    activityType: ActivityType.GAMING,
    activitySubType: ActivitySubType.GAMING_CASUAL,
    descriptionTemplate: "玩Minecraft",
    intensity: "medium",
    focusLevel: undefined,
    priority: 99,
  },
  {
    processMatchers: [/palworld-win64-shipping\.exe/i],
    titleMatchers: [/palworld/i, /幻兽帕鲁/i],
    activityType: ActivityType.GAMING,
    activitySubType: ActivitySubType.GAMING_CASUAL,
    descriptionTemplate: "玩幻兽帕鲁",
    intensity: "medium",
    focusLevel: undefined,
    priority: 99,
  },
  {
    processMatchers: [/witcher3\.exe/i],
    titleMatchers: [/the witcher 3/i, /巫师3/i],
    activityType: ActivityType.GAMING,
    activitySubType: ActivitySubType.GAMING_INTENSE,
    descriptionTemplate: "玩巫师3",
    intensity: "high",
    focusLevel: undefined,
    priority: 100,
  },
  {
    processMatchers: [/rdr2\.exe/i],
    titleMatchers: [/red dead redemption 2/i, /荒野大镖客2/i],
    activityType: ActivityType.GAMING,
    activitySubType: ActivitySubType.GAMING_INTENSE,
    descriptionTemplate: "玩荒野大镖客2",
    intensity: "high",
    focusLevel: undefined,
    priority: 100,
  },
  {
    processMatchers: [/gta5\.exe/i],
    titleMatchers: [/grand theft auto v/i, /侠盗猎车手5/i],
    activityType: ActivityType.GAMING,
    activitySubType: ActivitySubType.GAMING_INTENSE,
    descriptionTemplate: "玩GTA V",
    intensity: "high",
    focusLevel: undefined,
    priority: 100,
  },
  {
    processMatchers: [/steam\.exe/i],
    titleMatchers: [/\b(game|play|level|steam)\b/i],
    activityType: ActivityType.GAMING,
    activitySubType: ActivitySubType.GAMING_CASUAL,
    descriptionTemplate: "不知道在玩什么游戏",
    intensity: "medium",
    focusLevel: undefined,
    priority: 10,
  },

  // --- 开发工具类 ---
  {
    processMatchers: [/code\.exe/i, /code - insiders\.exe/i],
    titleMatchers: [/visual studio code/i, /\.(js|ts|py|java|kt|go|rs|html|css|scss|json|md|xml|gradle|dockerfile|yaml|yml)\b/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.CODING_ACTIVE,
    descriptionTemplate: "用 VSCode",
    focusLevel: "high",
    intensity: undefined,
    priority: 90,
  },
  {
    processMatchers: [/cursor\.exe/i],
    titleMatchers: [/cursor/i, /\.(js|ts|py|java|kt|go|rs|html|css|scss|json|md|xml|gradle|dockerfile|yaml|yml)\b/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.CODING_ACTIVE,
    descriptionTemplate: "用 Cursor",
    focusLevel: "high",
    intensity: undefined,
    priority: 91,
  },
  {
    processMatchers: [/studio64\.exe/i, /androidstudio64\.exe/i],
    titleMatchers: [/android studio/i, /manifest\.xml/i, /\.(kt|java|xml)\b/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.ANDROID_DEVELOPMENT,
    descriptionTemplate: "用 Android Studio",
    focusLevel: "high",
    intensity: undefined,
    priority: 95,
  },
  {
    processMatchers: [/idea64\.exe/i, /pycharm64\.exe/i, /webstorm64\.exe/i, /goland64\.exe/i, /clion64\.exe/i, /rubymine64\.exe/i, /phpstorm64\.exe/i, /datagrip64\.exe/i],
    titleMatchers: [/intellij idea/i, /pycharm/i, /webstorm/i, /goland/i, /clion/i, /rubymine/i, /phpstorm/i, /datagrip/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.CODING_ACTIVE,
    descriptionTemplate: "用 JetBrains IDE",
    focusLevel: "high",
    intensity: undefined,
    priority: 92,
  },
  {
    processMatchers: [/zed\.exe/i],
    titleMatchers: [/zed/i, /\.(rs|js|ts|py|go|md)\b/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.CODING_ACTIVE,
    descriptionTemplate: "用 Zed",
    focusLevel: "high",
    intensity: undefined,
    priority: 89,
  },
  {
    processMatchers: [/sublime_text\.exe/i],
    titleMatchers: [/sublime text/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.CODING_ACTIVE,
    descriptionTemplate: "用 Sublime Text",
    focusLevel: "medium",
    intensity: undefined,
    priority: 88,
  },
  {
    processMatchers: [/atom\.exe/i],
    titleMatchers: [/atom/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.CODING_ACTIVE,
    descriptionTemplate: "用 Atom",
    focusLevel: "medium",
    intensity: undefined,
    priority: 87,
  },
  {
    processMatchers: [/devenv\.exe/i],
    titleMatchers: [/microsoft visual studio/i, /\.(cs|vb|cpp|fs)\b/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.CODING_ACTIVE,
    descriptionTemplate: "用 Visual Studio",
    focusLevel: "high",
    intensity: undefined,
    priority: 90,
  },
  {
    processMatchers: [/xcode\.app/i],
    titleMatchers: [/xcode/i, /\.(swift|m|h|storyboard|xib)\b/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.CODING_ACTIVE,
    descriptionTemplate: "用 Xcode",
    focusLevel: "high",
    intensity: undefined,
    priority: 90,
  },
  {
    processMatchers: [/unity\.exe/i],
    titleMatchers: [/unity/i, /game scene/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.DESIGNING_UIUX,
    descriptionTemplate: "用 Unity",
    focusLevel: "high",
    intensity: undefined,
    priority: 85,
  },
  {
    processMatchers: [/unrealeditor\.exe/i],
    titleMatchers: [/unreal editor/i, /blueprint/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.DESIGNING_UIUX,
    descriptionTemplate: "用 Unreal Engine",
    focusLevel: "high",
    intensity: undefined,
    priority: 85,
  },
  {
    processMatchers: [/postman\.exe/i],
    titleMatchers: [/postman/i, /request/i, /collection/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.CODING_ACTIVE,
    descriptionTemplate: "用 Postman 测试 API",
    focusLevel: "medium",
    intensity: undefined,
    priority: 80,
  },
  {
    processMatchers: [/figma\.exe/i, /sketch\.app/i],
    titleMatchers: [/figma/i, /sketch/i, /untitled design/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.DESIGNING_UIUX,
    descriptionTemplate: "进行 UI/UX 设计",
    focusLevel: "high",
    intensity: undefined,
    priority: 80,
  },

  // --- 浏览器类 (进一步细化) ---
  {
    processMatchers: [/chrome\.exe/i, /msedge\.exe/i, /firefox\.exe/i, /safari\.app/i, /brave\.exe/i],
    titleMatchers: [/chatgpt/i, /openai\.com/i],
    activityType: ActivityType.AI_INTERACTION,
    activitySubType: ActivitySubType.AI_CHATTING_ASSISTANT,
    descriptionTemplate: "与 ChatGPT 对话",
    focusLevel: "medium",
    intensity: undefined,
    priority: 75,
  },
  {
    processMatchers: [/chrome\.exe/i, /msedge\.exe/i, /firefox\.exe/i, /safari\.app/i, /brave\.exe/i],
    titleMatchers: [/gemini\.google\.com/i, /bard\.google\.com/i],
    activityType: ActivityType.AI_INTERACTION,
    activitySubType: ActivitySubType.AI_CHATTING_ASSISTANT,
    descriptionTemplate: "与 Gemini 对话",
    focusLevel: "medium",
    intensity: undefined,
    priority: 75,
  },
  {
    processMatchers: [/chrome\.exe/i, /msedge\.exe/i, /firefox\.exe/i, /safari\.app/i, /brave\.exe/i],
    titleMatchers: [/aistudio\.google\.com/i, /google ai studio/i],
    activityType: ActivityType.AI_INTERACTION,
    activitySubType: ActivitySubType.AI_CHATTING_ASSISTANT,
    descriptionTemplate: "用 Google AI Studio",
    focusLevel: "medium",
    intensity: undefined,
    priority: 75,
  },
  {
    processMatchers: [/chrome\.exe/i, /msedge\.exe/i, /firefox\.exe/i, /safari\.app/i, /brave\.exe/i],
    titleMatchers: [/bilibili\.com/i, /哔哩哔哩/i, /youtube\.com/i, /youtu\.be/i],
    activityType: ActivityType.ENTERTAINMENT,
    activitySubType: ActivitySubType.WATCHING_SHORT_VIDEO,
    descriptionTemplate: "看短视频",
    focusLevel: "low",
    intensity: undefined,
    priority: 70,
  },
  {
    processMatchers: [/chrome\.exe/i, /msedge\.exe/i, /firefox\.exe/i, /safari\.app/i, /brave\.exe/i],
    titleMatchers: [/stackoverflow\.com/i, /github\.com/i, /developer\.mozilla\.org/i, /medium\.com\/.*(programming|develop|code|software)/i, /\.dev\b/i, /掘金/i, /csdn/i, /segmentfault/i, /v2ex\.com/i],
    activityType: ActivityType.LEARNING,
    activitySubType: ActivitySubType.LEARNING_READING_DOCS,
    descriptionTemplate: "查阅技术资料/看技术博客",
    focusLevel: "high",
    intensity: undefined,
    priority: 78,
  },
  {
    processMatchers: [/chrome\.exe/i, /msedge\.exe/i, /firefox\.exe/i, /safari\.app/i, /brave\.exe/i],
    titleMatchers: [/coursera\.org/i, /udemy\.com/i, /edx\.org/i, /khanacademy\.org/i, /中国大学mooc/i, /学堂在线/i, /网易公开课/i, /freecodecamp\.org/i],
    activityType: ActivityType.LEARNING,
    activitySubType: ActivitySubType.LEARNING_VIDEO_COURSE,
    descriptionTemplate: "在线学习课程",
    focusLevel: "high",
    intensity: undefined,
    priority: 77,
  },
  {
    processMatchers: [/chrome\.exe/i, /msedge\.exe/i, /firefox\.exe/i, /safari\.app/i, /brave\.exe/i],
    titleMatchers: [/微博/i, /twitter\.com/i, /facebook\.com/i, /instagram\.com/i, /知乎/i, /豆瓣/i, /reddit\.com/i],
    activityType: ActivityType.SOCIAL,
    activitySubType: ActivitySubType.BROWSING_SOCIAL_MEDIA,
    descriptionTemplate: "刷社交媒体",
    focusLevel: "low",
    intensity: undefined,
    priority: 60,
  },
  {
    processMatchers: [/chrome\.exe/i, /msedge\.exe/i, /firefox\.exe/i, /safari\.app/i, /brave\.exe/i],
    titleMatchers: [/淘宝/i, /tmall/i, /京东/i, /jd\.com/i, /amazon/i, /pinduoduo/i],
    activityType: ActivityType.BROWSING,
    activitySubType: ActivitySubType.BROWSING_SHOPPING,
    descriptionTemplate: "网上购物",
    focusLevel: "low",
    intensity: undefined,
    priority: 50,
  },
  {
    processMatchers: [/chrome\.exe/i, /msedge\.exe/i, /firefox\.exe/i, /safari\.app/i, /brave\.exe/i],
    titleMatchers: [/.*/],
    activityType: ActivityType.BROWSING,
    activitySubType: ActivitySubType.BROWSING_GENERAL,
    descriptionTemplate: "浏览网页",
    focusLevel: "low",
    intensity: undefined,
    priority: 5,
  },

  // --- 通讯/会议类 ---
  {
    processMatchers: [/wechat\.exe/i, /weixin\.exe/i],
    titleMatchers: [/微信/i],
    activityType: ActivityType.SOCIAL,
    activitySubType: ActivitySubType.CHATTING_IM,
    descriptionTemplate: "聊微信",
    focusLevel: "medium",
    intensity: undefined,
    priority: 65,
  },
  {
    processMatchers: [/qq\.exe/i],
    titleMatchers: [/qq/i, /腾讯qq/i],
    activityType: ActivityType.SOCIAL,
    activitySubType: ActivitySubType.CHATTING_IM,
    descriptionTemplate: "聊QQ",
    focusLevel: "medium",
    intensity: undefined,
    priority: 64,
  },
  {
    processMatchers: [/dingtalk\.exe/i],
    titleMatchers: [/钉钉/i, /会议/i, /直播/i],
    activityType: ActivityType.MEETING,
    activitySubType: ActivitySubType.MEETING_ONLINE_CONFERENCE,
    descriptionTemplate: "用钉钉",
    focusLevel: "medium",
    intensity: undefined,
    priority: 70,
  },
  {
    processMatchers: [/slack\.exe/i],
    titleMatchers: [/slack/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.CHATTING_IM,
    descriptionTemplate: "用Slack沟通",
    focusLevel: "medium",
    intensity: undefined,
    priority: 72,
  },
  {
    processMatchers: [/discord\.exe/i],
    titleMatchers: [/discord/i],
    activityType: ActivityType.SOCIAL,
    activitySubType: ActivitySubType.VOICE_VIDEO_CALL,
    descriptionTemplate: "用Discord",
    focusLevel: "medium",
    intensity: undefined,
    priority: 68,
  },
  {
    processMatchers: [/zoom\.exe/i, /vmwarezoom\.exe/i],
    titleMatchers: [/zoom/i, /会议/i, /meeting/i],
    activityType: ActivityType.MEETING,
    activitySubType: ActivitySubType.MEETING_ONLINE_CONFERENCE,
    descriptionTemplate: "参加Zoom会议",
    focusLevel: "high",
    intensity: undefined,
    priority: 76,
  },
  {
    processMatchers: [/teams\.exe/i],
    titleMatchers: [/microsoft teams/i, /会议/i, /call/i],
    activityType: ActivityType.MEETING,
    activitySubType: ActivitySubType.MEETING_ONLINE_CONFERENCE,
    descriptionTemplate: "参加Teams会议/通话",
    focusLevel: "high",
    intensity: undefined,
    priority: 76,
  },
  {
    processMatchers: [/chrome\.exe/i, /msedge\.exe/i, /firefox\.exe/i],
    titleMatchers: [/meet\.google\.com/i, /正在通话/i, /会议中/i],
    activityType: ActivityType.MEETING,
    activitySubType: ActivitySubType.MEETING_ONLINE_CONFERENCE,
    descriptionTemplate: "参加Google Meet会议",
    focusLevel: "high",
    intensity: undefined,
    priority: 77,
  },
  {
    processMatchers: [/applicationframehost\.exe/i],
    titleMatchers: [/unigram/i],
    activityType: ActivityType.SOCIAL,
    activitySubType: ActivitySubType.CHATTING_IM,
    descriptionTemplate: "用Unigram聊天",
    focusLevel: "medium",
    intensity: undefined,
    priority: 65,
  },

  // --- 媒体播放类 ---
  {
    processMatchers: [/cloudmusic\.exe/i, /neteasecloudmusic\.exe/i],
    titleMatchers: [/网易云音乐/i],
    activityType: ActivityType.ENTERTAINMENT,
    activitySubType: ActivitySubType.LISTENING_MUSIC,
    descriptionTemplate: "听网易云音乐",
    focusLevel: "low",
    intensity: undefined,
    priority: 55,
  },
  {
    processMatchers: [/qqmusic\.exe/i],
    titleMatchers: [/qq音乐/i],
    activityType: ActivityType.ENTERTAINMENT,
    activitySubType: ActivitySubType.LISTENING_MUSIC,
    descriptionTemplate: "听QQ音乐",
    focusLevel: "low",
    intensity: undefined,
    priority: 54,
  },
  {
    processMatchers: [/spotify\.exe/i],
    titleMatchers: [/spotify/i],
    activityType: ActivityType.ENTERTAINMENT,
    activitySubType: ActivitySubType.LISTENING_MUSIC,
    descriptionTemplate: "听Spotify",
    focusLevel: "low",
    intensity: undefined,
    priority: 56,
  },
  {
    processMatchers: [/potplayer.*\.exe/i],
    titleMatchers: [/\.(mkv|mp4|avi|rmvb|flv|mov)\b/i],
    activityType: ActivityType.ENTERTAINMENT,
    activitySubType: ActivitySubType.WATCHING_MOVIE_SERIES,
    descriptionTemplate: "用PotPlayer看片",
    focusLevel: "low",
    intensity: undefined,
    priority: 60,
  },
  {
    processMatchers: [/potplayer.*\.exe/i],
    titleMatchers: [/教程/i, /课程/i, /教学/i, /lesson/i, /course/i, /tutorial/i],
    activityType: ActivityType.LEARNING,
    activitySubType: ActivitySubType.LEARNING_VIDEO_COURSE,
    descriptionTemplate: "用PotPlayer看学习视频",
    focusLevel: "medium",
    intensity: undefined,
    priority: 62,
  },
  {
    processMatchers: [/vlc\.exe/i],
    titleMatchers: [/\.(mkv|mp4|avi|rmvb|flv|mov)\b/i],
    activityType: ActivityType.ENTERTAINMENT,
    activitySubType: ActivitySubType.WATCHING_MOVIE_SERIES,
    descriptionTemplate: "用VLC看片",
    focusLevel: "low",
    intensity: undefined,
    priority: 59,
  },

  // --- 笔记/知识管理类 ---
  {
    processMatchers: [/obsidian\.exe/i],
    titleMatchers: [/obsidian/i, /\.md\b/i],
    activityType: ActivityType.NOTE_TAKING,
    activitySubType: ActivitySubType.NOTE_TAKING_ORGANIZING,
    descriptionTemplate: "用Obsidian记笔记/整理知识",
    focusLevel: "medium",
    intensity: undefined,
    priority: 70,
  },
  {
    processMatchers: [/notion\.exe/i],
    titleMatchers: [/notion/i],
    activityType: ActivityType.PLANNING,
    activitySubType: ActivitySubType.PLANNING_TASK_MANAGEMENT,
    descriptionTemplate: "用Notion",
    focusLevel: "medium",
    intensity: undefined,
    priority: 71,
  },
  {
    processMatchers: [/typora\.exe/i],
    titleMatchers: [/typora/i, /\.md\b/i],
    activityType: ActivityType.NOTE_TAKING,
    activitySubType: ActivitySubType.WRITING_DOCS,
    descriptionTemplate: "用Typora写文档",
    focusLevel: "medium",
    intensity: undefined,
    priority: 69,
  },
  {
    processMatchers: [/evernote\.exe/i, /yinxiang\.exe/i],
    titleMatchers: [/evernote/i, /印象笔记/i],
    activityType: ActivityType.NOTE_TAKING,
    activitySubType: ActivitySubType.NOTE_TAKING_QUICK,
    descriptionTemplate: "用印象笔记",
    focusLevel: "medium",
    intensity: undefined,
    priority: 68,
  },

  // --- 系统/其他 ---
  {
    processMatchers: [/explorer\.exe/i],
    titleMatchers: [/.*/],
    activityType: ActivityType.BROWSING,
    activitySubType: ActivitySubType.BROWSING_GENERAL,
    descriptionTemplate: "管理文件",
    focusLevel: "low",
    intensity: undefined,
    priority: 20,
  },
  {
    processMatchers: [/.*/],
    titleMatchers: [/编译/i, /compile/i, /building/i, /打包/i],
    activityType: ActivityType.SYSTEM_TASK,
    activitySubType: ActivitySubType.SYSTEM_COMPILING,
    descriptionTemplate: "程序编译中",
    focusLevel: "low",
    intensity: undefined,
    priority: 30,
  },
  {
    processMatchers: [/code\.exe/i, /sublime_text\.exe/i, /atom\.exe/i, /devenv\.exe/i, /xcode\.app/i, /zed\.exe/i, /cursor\.exe/i, /terminal/i, /cmd/i, /powershell/i],
    titleMatchers: [/\\.(js|ts|jsx|tsx|py|java|kt|go|rs|html|css|scss|json|md|xml|gradle|dockerfile|yaml|yml|c|cpp|rb|php|sql)\\b/i],
    activityType: ActivityType.WORKING,
    activitySubType: ActivitySubType.CODING_ACTIVE,
    descriptionTemplate: "写代码",
    focusLevel: "high",
    intensity: undefined,
    priority: 85,
  },
];

// 将规则按 priority 从大到小排序
ACTIVITY_RULES.sort((a, b) => b.priority - a.priority);

function getCurrentTimeInfo() {
  const now = new Date();
  const hours = now.getHours();
  const day = now.getDay();
  return {
    hours,
    isWeekend: day === 0 || day === 6,
    isTypicalSleepTime: hours >= 22 || hours < 7,
    isTypicalWorkTime: hours >= 9 && hours < 18 && day >= 1 && day <= 5,
    isLunchBreakTime: hours >= 12 && hours < 14,
  };
}

function isHeartRateDataFresh(hrData: HeartRateData | null, maxStalenessMinutes: number = 5): boolean {
  if (!hrData || !hrData.timestamp) return false;
  const stalenessMillis = Date.now() - hrData.timestamp;
  return stalenessMillis <= maxStalenessMinutes * 60 * 1000;
}

/**
 * 核心：先清洗、提取，再按规则匹配；匹配后做关键词细化
 */
export function getActivityDetails(windowTitle: string, processName: string): ActivityDetails {
  const rawTitle = windowTitle;
  const rawProcess = processName;

  // 1. 清洗字段
  const titleClean = normalizeText(windowTitle);
  const processBase = extractProcessName(processName);

  // 2. 按规则匹配
  for (const rule of ACTIVITY_RULES) {
    if (!matches(rule, titleClean, processBase)) continue;

    // 基础类型、子类型和描述模板
    let activityType = rule.activityType;
    let activitySubType = rule.activitySubType;
    let description = rule.descriptionTemplate;

    // 只有当类型是"浏览" 或 同属"娱乐→短视频/影视"时，做关键词细化
    const refined = refineByKeywords(activityType, activitySubType, titleClean);
    if (refined.description) {
      activityType = refined.type;
      activitySubType = refined.subType;
      description = refined.description;
    }

    // 把描述模板里的 {title}、{process} 替换成原始字符串
    description = description.replace("{title}", rawTitle).replace("{process}", rawProcess);

    return {
      type: activityType,
      subType: activitySubType,
      description,
      rawTitle,
      rawProcess,
      focusLevel: rule.focusLevel,
      intensity: rule.intensity,
    };
  }

  // 3. 没有任何规则命中 → UNKNOWN（简洁描述）
  return {
    type: ActivityType.UNKNOWN,
    description: "进行未知活动",
    rawTitle,
    rawProcess,
  };
}

/**
 * 根据心率、活动、鼠标空闲时间，推断可用性
 */
export function predictAvailability(
  heartRate: HeartRateData | null,
  activityDetails: ActivityDetails | null,
  mouseIdleSeconds: number
): AvailabilityStatus {
  const timeInfo = getCurrentTimeInfo();
  const mouseIdleMinutes = Math.floor(mouseIdleSeconds / 60);

  if (!activityDetails) {
    return {
      status: "有点懵",
      reason: "暂时看不清你在做什么",
      color: "text-neutral-500 dark:text-neutral-400",
      suggestion: "也许稍后信息会更明朗",
    };
  }

  const hrFresh = isHeartRateDataFresh(heartRate);
  const hrValue = heartRate && heartRate.last_non_zero_hr > 0 ? heartRate.last_non_zero_hr : null;
  const desc = activityDetails.description;

  // —— 睡眠/休息 判断 —— 
  if (hrValue && hrValue < 60 && hrFresh && mouseIdleMinutes >= 20) {
    if (timeInfo.isTypicalSleepTime) {
      return {
        status: "睡着了",
        reason: `心率${hrValue}...`,
        color: "text-purple-500 dark:text-purple-400",
        suggestion: "嘘，让她/他好好休息吧",
      };
    }
    if (timeInfo.isLunchBreakTime && activityDetails.type !== ActivityType.WORKING) {
      return {
        status: "午休中",
        reason: `心率${hrValue}，可能是午后小憩？`,
        color: "text-purple-500 dark:text-purple-400",
        suggestion: "让她/他安静地休息一会儿吧",
      };
    }
    return {
      status: "在休息",
      reason: `心率${hrValue}，鼠标${mouseIdleMinutes}分钟没动，可能在小憩？`,
      color: "text-indigo-500 dark:text-indigo-400",
      suggestion: "看起来在休息，不急的话晚点再联系",
    };
  }

  // —— 高心率 + 长时间不动 → 可能在运动 —— 
  if (hrFresh && hrValue) {
    if (hrValue >= 110 && mouseIdleMinutes >= 15) {
      if (hrValue >= 140) {
        return {
          status: "运动中",
          reason: `心率${hrValue}，估计跑得很快`,
          color: "text-emerald-600 dark:text-emerald-500",
          suggestion: "运动时不便回复，稍后再联系",
        };
      }
      if (hrValue >= 120) {
        return {
          status: "在跑步",
          reason: `心率${hrValue}，估计在跑步？`,
          color: "text-emerald-500 dark:text-emerald-400",
          suggestion: "运动时不便回复，稍后再试",
        };
      }
      return {
        status: "可能出去了",
        reason: `心率${hrValue}偏高，鼠标${mouseIdleMinutes}分钟没动，可能在外活动`,
        color: "text-teal-600 dark:text-teal-500",
        suggestion: "试试其他联系方式？",
      };
    }
    if (hrValue >= 80 && hrValue < 110 && mouseIdleMinutes >= 20) {
      return {
        status: "可能外出了",
        reason: `心率${hrValue}，鼠标${mouseIdleMinutes}分钟没动，可能出去散步`,
        color: "text-blue-500 dark:text-blue-400",
        suggestion: "暂时不在电脑前，晚点再联系",
      };
    }
  }

  // —— 长时间不动 → 可能离开电脑 —— 
  if (mouseIdleMinutes > 45) {
    if (
      activityDetails.type === ActivityType.SYSTEM_TASK &&
      (activityDetails.subType === ActivitySubType.SYSTEM_COMPILING ||
        activityDetails.subType === ActivitySubType.SYSTEM_RENDERING)
    ) {
      return {
        status: "电脑工作中",
        reason: `电脑正在 ${desc}，可能在等结果`,
        color: "text-teal-500 dark:text-teal-400",
        suggestion: "如果不急，可以稍等一下",
      };
    }
    return {
      status: "似乎出门了",
      reason: `鼠标${mouseIdleMinutes}分钟没动，大概率不在电脑前`,
      color: "text-blue-600 dark:text-blue-500",
      suggestion: "晚点再找或试试其他联系方式",
    };
  }
  if (mouseIdleMinutes > 20) {
    if (
      activityDetails.type === ActivityType.SYSTEM_TASK &&
      (activityDetails.subType === ActivitySubType.SYSTEM_COMPILING ||
        activityDetails.subType === ActivitySubType.SYSTEM_RENDERING)
    ) {
      return {
        status: "电脑工作中",
        reason: `电脑正在 ${desc}，人可能在旁边等`,
        color: "text-teal-500 dark:text-teal-400",
        suggestion: "可以先留个言",
      };
    }
    if (hrFresh && hrValue && hrValue < 65) {
      return {
        status: "可能在小憩",
        reason: `鼠标${mouseIdleMinutes}分钟没动，心率${hrValue}较平缓`,
        color: "text-indigo-500 dark:text-indigo-400",
        suggestion: "也许在闭目养神，稍等一下",
      };
    }
    return {
      status: "可能离开了",
      reason: `鼠标${mouseIdleMinutes}分钟没动，可能暂时不在`,
      color: "text-sky-500 dark:text-sky-400",
      suggestion: "可以留个言或稍后再看",
    };
  }

  // —— 基于活动类型做判断 —— 
  switch (activityDetails.type) {
    case ActivityType.GAMING:
      {
        let name = activityDetails.rawTitle.split(/[-–|—]|steam/i)[0].trim();
        if (name.length > 30 || name.toLowerCase().includes("exe")) {
          name = "某个游戏";
        }
        const playDesc = desc.startsWith("玩") ? desc : `在玩《${name}》`;
        if (
          activityDetails.intensity === "high" ||
          activityDetails.subType === ActivitySubType.GAMING_INTENSE
        ) {
          return {
            status: "沉浸游戏中",
            reason: `${playDesc}，看起来很投入`,
            color: "text-red-600 dark:text-red-500",
            suggestion: "现在打扰可能会打断精彩操作",
          };
        }
        return {
          status: "在玩游戏",
          reason: playDesc,
          color: "text-red-500 dark:text-red-400",
          suggestion: "游戏时间，回复可能会慢",
        };
      }

    case ActivityType.WORKING:
      {
        let workStatus = "在忙碌";
        let workReason = `正在${desc}`;
        let workSug = "如果不急，可以留言";
        if (activityDetails.focusLevel === "high") {
          workStatus = "写代码";
          workReason = `都在${desc}了还能在干啥`;
          workSug = "她/他需要集中精神，晚点联系更好";
        }
        if (activityDetails.subType === ActivitySubType.CODING_DEBUGGING) {
          workStatus = "在调试";
          workReason = "似乎聚精会神地改Bug";
          workSug = "调试时不可打断，建议稍后再联系";
        }
        if (mouseIdleMinutes > 5 && mouseIdleMinutes <= 15) {
          workStatus = "工作中";
          workReason = `正在${desc}，但已有${mouseIdleMinutes}分钟没动，可能在思考`;
          workSug = "可以发消息，但请耐心等待回复";
        }
        return {
          status: workStatus,
          reason: workReason,
          color: "text-orange-500 dark:text-orange-400",
          suggestion: workSug,
        };
      }

    case ActivityType.LEARNING:
      {
        let learnStatus = "学习中";
        let learnReason = `正在${desc}`;
        let learnSug = "她/他在学习，尽量别打扰";
        if (
          activityDetails.focusLevel === "high" ||
          activityDetails.subType === ActivitySubType.LEARNING_READING_DOCS ||
          activityDetails.subType === ActivitySubType.LEARNING_VIDEO_COURSE
        ) {
          learnStatus = "沉浸学习";
          learnReason = `正在${desc}，看起来很认真`;
          learnSug = "让她/他安静学习一会儿";
        }
        if (
          mouseIdleMinutes > 8 &&
          mouseIdleMinutes <= 20 &&
          activityDetails.subType === ActivitySubType.LEARNING_VIDEO_COURSE
        ) {
          learnReason = `正在${desc}，鼠标${mouseIdleMinutes}分钟没动，可能在认真观看或做笔记`;
        } else if (mouseIdleMinutes > 5 && mouseIdleMinutes <= 10) {
          learnReason = `正在${desc}，有${mouseIdleMinutes}分钟没操作，可能在消化`;
        }
        return {
          status: learnStatus,
          reason: learnReason,
          color: "text-green-600 dark:text-green-500",
          suggestion: learnSug,
        };
      }

    case ActivityType.MEETING:
      {
        let meetStatus = "大概在开会？";
        let meetReason = desc;
        let meetSug = "可以留言";
        if (activityDetails.subType === ActivitySubType.MEETING_PRESENTING) {
          meetStatus = "可能在演示";
          meetReason = "专心演示中";
        }
        return {
          status: meetStatus,
          reason: meetReason,
          color: "text-cyan-500 dark:text-cyan-400",
          suggestion: meetSug,
        };
      }

    case ActivityType.ENTERTAINMENT:
      {
        let entStatus = "放松中";
        let entReason = desc;
        let entSug = "休息一下吧";
        if (activityDetails.subType === ActivitySubType.WATCHING_MOVIE_SERIES) {
          entStatus = "看剧/电影";
          let title = activityDetails.rawTitle.split(/[-–|—]/)[0].trim();
          if (
            title.length > 30 ||
            title.toLowerCase().includes("potplayer") ||
            title.toLowerCase().includes("vlc")
          ) {
            title = "一部影片";
          }
          entReason = `正在看《${title}》`;
          if (mouseIdleMinutes > 5 && mouseIdleMinutes <= 15) {
            entReason += "，看得很专心";
          }
        } else if (activityDetails.subType === ActivitySubType.LISTENING_MUSIC) {
          entStatus = "听音乐";
          entReason = "在听音乐放松";
        } else if (activityDetails.subType === ActivitySubType.WATCHING_SHORT_VIDEO) {
          entStatus = "刷短视频";
          entReason = "在看有趣的短视频";
        }
        return {
          status: entStatus,
          reason: entReason,
          color: "text-lime-500 dark:text-lime-400",
          suggestion: entSug,
        };
      }

    case ActivityType.SOCIAL:
      {
        let socStatus = "在聊天";
        let socReason = desc;
        let socSug = "可以发消息看看";
        if (activityDetails.subType === ActivitySubType.CHATTING_IM) {
          socReason = `正在${desc}`;
        } else if (activityDetails.subType === ActivitySubType.BROWSING_SOCIAL_MEDIA) {
          socStatus = "逛动态";
          socReason = `在${desc}`;
        }
        if (mouseIdleSeconds > 0 && mouseIdleSeconds <= 15) {
          socReason += "，可能在打字或看消息";
        }
        return {
          status: socStatus,
          reason: socReason,
          color: "text-pink-500 dark:text-pink-400",
          suggestion: socSug,
        };
      }

    case ActivityType.AI_INTERACTION:
      {
        const aiStatus = "与 AI 对话";
        let aiReason = `正在用 ${desc.replace("与 ", "").replace("对话", "")}`;
        if (/studio/i.test(desc)) {
          aiReason = `在 ${desc} 中尝试新功能`;
        }
        return {
          status: aiStatus,
          reason: aiReason,
          color: "text-violet-500 dark:text-violet-400",
          suggestion: "她/他可能在思考，稍等一下",
        };
      }

    case ActivityType.BROWSING:
      {
        let browseStatus = "浏览网页";
        let partial = activityDetails.rawTitle.length > 40
          ? activityDetails.rawTitle.substring(0, 37) + "..."
          : activityDetails.rawTitle;
        if (/\b(new tab|新标签页)\b/i.test(partial)) {
          partial = "一个网页";
        }
        let browseReason = `正在看 ${partial}`;
        let browseSug = "可以试着联系，但回复可能慢";

        if (activityDetails.subType === ActivitySubType.BROWSING_RESEARCH) {
          browseStatus = "查资料";
          browseReason = `在网上查 "${partial}" 相关资料`;
          if (mouseIdleMinutes > 5 && mouseIdleMinutes <= 15) {
            browseReason += "，似乎稍作停顿";
          }
        } else if (activityDetails.subType === ActivitySubType.BROWSING_NEWS) {
          browseStatus = "看新闻";
          browseReason = `正在阅读 "${partial}" 的新闻`;
        } else if (activityDetails.subType === ActivitySubType.BROWSING_GENERAL) {
          browseReason = `随便看看 ${partial}`;
        }

        if (mouseIdleMinutes > 8 && activityDetails.subType !== ActivitySubType.BROWSING_RESEARCH) {
          browseStatus = "可能走神";
          browseReason = `浏览器开着 "${partial}"，鼠标${mouseIdleMinutes}分钟没动`;
          browseSug = "可能暂时离开或走神";
        } else if (mouseIdleMinutes > 3) {
          browseReason += "，也许在认真看";
        }
        return {
          status: browseStatus,
          reason: browseReason,
          color: "text-sky-500 dark:text-sky-400",
          suggestion: browseSug,
        };
      }

    case ActivityType.NOTE_TAKING:
    case ActivityType.PLANNING:
      {
        const planStatus = activityDetails.type === ActivityType.NOTE_TAKING ? "整理思绪" : "规划事情";
        const planReason = `正在 ${desc}`;
        return {
          status: planStatus,
          reason: planReason,
          color: "text-gray-500 dark:text-gray-400",
          suggestion: "可能在安静思考",
        };
      }

    case ActivityType.SYSTEM_TASK:
      return {
        status: "电脑在忙",
        reason: `电脑正在 ${desc}`,
        color: "text-teal-500 dark:text-teal-400",
        suggestion: "可以先留个言",
      };

    case ActivityType.IDLE:
      {
        if (mouseIdleMinutes > 40) {
          return {
            status: "非常无聊",
            reason: `鼠标${mouseIdleMinutes}分钟没动`,
            color: "text-yellow-500 dark:text-yellow-400",
            suggestion: "或许可以聊天",
          };
        }
        if (mouseIdleMinutes > 30) {
          return {
            status: "好无聊",
            reason: `鼠标${mouseIdleMinutes}分钟没动`,
            color: "text-yellow-500 dark:text-yellow-400",
            suggestion: "或许可以聊聊",
          };
        }
        if (mouseIdleMinutes > 15) {
          return {
            status: "发呆中",
            reason: `鼠标${mouseIdleMinutes}分钟没动`,
            color: "text-yellow-500 dark:text-yellow-400",
            suggestion: "也许可以打个招呼",
          };
        }
        if (mouseIdleMinutes > 5) {
          return {
            status: "摸鱼",
            reason: `闲置 ${mouseIdleMinutes}分钟`,
            color: "text-yellow-400 dark:text-yellow-300",
            suggestion: "大概率有空",
          };
        }
        return {
          status: "小憩片刻",
          reason: "暂无特别活动",
          color: "text-gray-400 dark:text-gray-500",
          suggestion: "可以试着联系",
        };
      }

    case ActivityType.UNKNOWN:
    default:
      return {
        status: "未知",
        reason: "进行未知活动",
        color: "text-neutral-400 dark:text-neutral-500",
        suggestion: "可以尝试联系",
      };
  }
}
