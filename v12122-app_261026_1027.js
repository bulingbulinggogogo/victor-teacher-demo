const DEFAULT_CLASS = "1班";
const DEFAULT_RATE_THRESHOLD = 70;
const RATE_THRESHOLD_DEFAULT_VERSION = "70-v1";
const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_DEFAULT_VERSION = "20-v1";
const PLAYBACK_RATES = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 2.0];
const SIMILAR_MEMORY_KEY = "victor:similarQuestionMemory:v1";
const GLOBAL_ASSIST_KEY = "victor:globalAssist:v1";

if (demoStorage.getItem("victor:rateThresholdDefaultVersion") !== RATE_THRESHOLD_DEFAULT_VERSION) {
  demoStorage.setItem("victor:rateThreshold", String(DEFAULT_RATE_THRESHOLD));
  demoStorage.setItem("victor:rateThresholdDefaultVersion", RATE_THRESHOLD_DEFAULT_VERSION);
}

if (demoStorage.getItem("victor:pageSizeDefaultVersion") !== PAGE_SIZE_DEFAULT_VERSION) {
  demoStorage.setItem("victor:pageSize", String(PAGE_SIZE_DEFAULT));
  demoStorage.setItem("victor:pageSizeDefaultVersion", PAGE_SIZE_DEFAULT_VERSION);
}

function basketStorageKey(className) {
  return `victor:selectedIds:${className}`;
}

function readStoredIds(key) {
  try {
    const value = JSON.parse(demoStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

function loadBasketForClass(className) {
  const key = basketStorageKey(className);
  if (demoStorage.getItem(key) !== null) return readStoredIds(key);
  if (className === DEFAULT_CLASS && demoStorage.getItem("victor:selectedIds") !== null) {
    const legacyIds = readStoredIds("victor:selectedIds");
    demoStorage.setItem(key, JSON.stringify(legacyIds));
    demoStorage.removeItem("victor:selectedIds");
    return legacyIds;
  }
  return [];
}

function bookBasketStorageKey() {
  return "victor:bookSelectedQuestionIds";
}

function loadBookBasket() {
  return readStoredIds(bookBasketStorageKey());
}

function saveBookBasket() {
  demoStorage.setItem(bookBasketStorageKey(), JSON.stringify([...state.bookSelectedQuestionIds]));
}

function loadSimilarQuestionMemory() {
  try {
    const value = JSON.parse(demoStorage.getItem(SIMILAR_MEMORY_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function saveSimilarQuestionMemory() {
  demoStorage.setItem(SIMILAR_MEMORY_KEY, JSON.stringify(state.similarQuestionMemory));
}

function loadGlobalAssistState() {
  try {
    const value = JSON.parse(demoStorage.getItem(GLOBAL_ASSIST_KEY) || "{}");
    return {
      halfScreen: value.halfScreen === true,
      expanded: value.expanded === true,
    };
  } catch {
    return { halfScreen: false, expanded: false };
  }
}

function saveGlobalAssistState() {
  demoStorage.setItem(GLOBAL_ASSIST_KEY, JSON.stringify({
    halfScreen: state.globalAssistHalfScreen,
    expanded: state.globalAssistExpanded,
  }));
}

const globalAssistInitialState = loadGlobalAssistState();

const state = {
  page: "home",
  teacherName: "李岚岚",
  teacherPhone: "13100001111",
  teacherSchool: "第一中学",
  teacherSchools: ["第一中学", "第一中学第二校区"],
  teacherPassword: "123456",
  questions: [],
  activeBookKey: "legacy-book",
  textResources: {},
  timecodes: null,
  selectedIds: new Set(loadBasketForClass(DEFAULT_CLASS)),
  basketExpandedTypes: new Set(),
  currentPage: 1,
  pageSize: [10, 20, 30, 40, 50].includes(Number(demoStorage.getItem("victor:pageSize")))
    ? Number(demoStorage.getItem("victor:pageSize"))
    : PAGE_SIZE_DEFAULT,
  rateThreshold: Number(demoStorage.getItem("victor:rateThreshold") || DEFAULT_RATE_THRESHOLD),
  filterClass: DEFAULT_CLASS,
  filterTime: "近7天",
  sortDirection: demoStorage.getItem("victor:tableSort") || "asc",
  filterComposedQuestions: false,
  columnFilters: {
    bookName: new Set(),
    unit: new Set(),
    setName: new Set(),
    questionType: new Set(),
  },
  listeningWorkspaceMode: "listening",
  listeningWorkspaceSnapshot: null,
  bookMistakesSnapshot: null,
  explainIds: [],
  originalExplainIds: [],
  explainOrder: ["rate", "natural"].includes(demoStorage.getItem("victor:explainOrder"))
    ? demoStorage.getItem("victor:explainOrder")
    : "rate",
  activeExplainSetId: null,
  lastQuestionBySet: {},
  similarExamPoint: "",
  lectureSnapshot: null,
  currentQuestionId: null,
  showAnswer: false,
  showAnswerAnalysis: false,
  showAnalysis: false,
  questionPanelCollapsed: false,
  showQuestionTranslation: false,
  showTranscriptTranslation: false,
  activeKnowledgeType: null,
  fullFont: Number(demoStorage.getItem("victor:fullFont") || 48),
  theme: demoStorage.getItem("victor:theme") || "dark",
  playingSegmentIndex: null,
  playbackStopTime: null,
  playbackScope: null,
  playbackRate: 1,
  globalAssistHalfScreen: globalAssistInitialState.halfScreen,
  globalAssistExpanded: globalAssistInitialState.expanded,
  followReadActive: false,
  followReadQueue: [],
  followReadQueueIndex: -1,
  followReadPhase: null,
  followReadWaitRemainingMs: 0,
  followReadWaitStartedAt: 0,
  followReadTimer: null,
  followReadRestoreSnapshot: null,
  followReadEndAfterQueue: false,
  followReadPendingSeekTime: null,
  maskTranscriptActive: false,
  maskRevealedSegments: new Set(),
  classroomDockCollapsed: false,
  audioOnlyPlayback: false,
  practiceQuestionsVisible: true,
  practiceModeActive: false,
  practicePhase: "idle",
  practicePaused: false,
  practiceRepeatIndex: 0,
  practiceTextKey: "",
  practiceTimer: null,
  practiceTimerRemainingMs: 0,
  practiceTimerStartedAt: 0,
  practiceTimerCallback: null,
  practiceCountdownTicker: null,
  practiceAuxiliaryCallback: null,
  practiceIntroducedSections: new Set(),
  practiceClosingStagesStarted: false,
  practiceRestoreSnapshot: null,
  practiceShortDialogueRepeats: Number(demoStorage.getItem("victor:practiceShortDialogueRepeats")) === 1 ? 1 : 2,
  similarPracticeRepeats: Number(demoStorage.getItem("victor:similarPracticeRepeats")) === 1 ? 1 : 2,
  practiceChineseInstruction: demoStorage.getItem("victor:practiceChineseInstruction") !== "false",
  similarSource: "gaokao",
  similarSourceQuestionId: null,
  similarQuestionMemory: {}, // Selection history belongs to this lecture session only.
  similarPool: [],
  dictationMaterials: [],
  activeMaterialIndex: 0,
  editorPlayingSegmentIndex: null,
  editingTaskId: null,
  contentViewOnly: false,
  dictationDirty: false,
  dictationSourceVisible: false,
  dictationSourceFilter: null,
  addMaterialFilters: null,
  addMaterialSelectedKeys: new Set(),
  publishSource: "paper",
  publishClassId: DEFAULT_CLASS,
  publishStudentIds: new Set(),
  publishStudentSearch: "",
  publishStudentSearchOpen: false,
  paperItems: [],
  publishSetCount: 1,
  publishQuantityMode: "question",
  activePaperIndex: 0,
  paperPlayingSegmentIndex: null,
  editingPaperTaskId: null,
  paperTranscriptVisible: false,
  paperDirty: false,
  paperSimilarEnabled: true,
  paperSimilarScope: "gaokao",
  paperEntryMode: "direct",
  onlineTask: null,
  onlineMaterialIndex: 0,
  onlineRevealAll: false,
  onlineRevealedBlankIds: new Set(),
  onlineShowQuestions: false,
  onlinePlayingSegmentIndex: null,
  onlineDockSide: demoStorage.getItem("victor:onlineDockSide") || "right",
  onlineDockCollapsed: demoStorage.getItem("victor:onlineDockCollapsed") === "true",
  onlinePlaybackRate: Number(demoStorage.getItem("victor:onlinePlaybackRate") || 1),
  bookSelectedSetIds: new Set(),
  bookSelectedQuestionIds: new Set(loadBookBasket()),
  bookActiveSetId: 14255,
  bookCatalogGroupCode: "WELCOME",
  bookClassName: DEFAULT_CLASS,
  bookOverviewTab: "catalog",
  bookOverviewUnit: "WELCOME",
  bookCatalogSortKey: "sequence",
  bookCatalogSortDirection: "asc",
  bookOverviewSelectedSetId: 14255,
  bookOverviewMistakeUnit: "all",
  bookOverviewMistakeSetId: "all",
  bookOverviewSetMetric: "score",
  bookOverviewStudentId: null,
  bookOverviewStudentSearch: "",
  bookOverviewStudentMetric: "score",
  bookOverviewStudentSetPage: 1,
  bookOverviewSetDetailId: null,
  bookOverviewSetDetailTab: "overview",
  bookOverviewSetDetailStudentId: null,
  bookOverviewSetStudentPage: 1,
  bookOverviewSetQuestionPage: 1,
  bookOverviewQuestionSortKey: "questionNo",
  bookOverviewQuestionSortDirection: "asc",
  bookKnowledgeUnit: "all",
  bookKnowledgeSetId: "all",
  bookAssignmentSource: "sets",
  bookDetailView: "catalog",
  bookWorkspaceTab: "questions",
  bookAssignmentSetPage: 1,
  bookAssignmentUnit: "all",
  bookAssignmentSetId: "all",
  bookDataTab: "overview",
  bookStudentDataPage: 1,
  bookQuestionDataPage: 1,
  bookTranscriptVisible: false,
  bookQuestionMode: "sets",
  bookQuestionTypeFilters: new Set(["短对话", "长对话", "独白"]),
  bookQuestionPointFilter: "all",
  bookQuestionSortKey: "classRate",
  bookActiveQuestionId: null,
  bookTranscriptSegmentEnd: null,
  bookBasketExpandedTypes: new Set(),
  classManagementClasses: new Set([DEFAULT_CLASS]),
  studentSearch: "",
  questionBankTab: "my-paper",
  myPaperTypeFilter: "all",
  myPaperTimeFilter: "7",
  myPaperDateStart: "",
  myPaperDateEnd: "",
  workTimeFilter: "7",
  workDateStart: "",
  workDateEnd: "",
  publishDeadlineOnly: false,
  workReportTaskId: null,
  workReportClassName: "",
  workReportTab: "overall",
  workReportStudentPage: 1,
  workReportQuestionPage: 1,
  editingStudentId: null,
  lastResetPassword: "",
  assignmentClassId: DEFAULT_CLASS,
  assignmentStudentIds: new Set(),
  fullReturnPage: "listening",
  fullSetNameOverride: "",
  editorReturnPage: "listening",
  publishReturnPage: "paper",
};

const BOOK_CLASS_GRADING = {
  "1班": new Set([14255, 14256]),
  "2班": new Set([14255, 14256]),
  "3班": new Set([14255, 14256]),
};

const PROTOTYPE_NATIONAL_RATE_PATTERNS = {
  14255: [78, 74, 81, 69, 76, 64, 72, 67, 83, 71, 75, 68, 79, 73, 66, 77, 70, 62, 74, 80],
  14256: [76, 79, 73, 82, 68, 65, 71, 75, 69, 78, 72, 66, 80, 74, 63, 77, 70, 81, 67, 76],
};

const BOOK_CATALOG_GROUPS = [
  { code: "WELCOME", title: "WELCOME UNIT", sets: [
    { setId: 14255, sourceSetId: 14255, name: "Welcome Unit 听力训练（一）", available: true },
    { setId: 14256, sourceSetId: 14256, name: "Welcome Unit 听力训练（二）", available: true },
    { setId: 14257, sourceSetId: 14255, name: "Welcome Unit 听力训练（三）", available: true },
  ] },
  { code: "B1U1", title: "B1U1", sets: [
    { setId: 14258, sourceSetId: 14255, name: "B1U1 听力训练（一）", available: true },
    { setId: 14259, sourceSetId: 14255, name: "B1U1 听力训练（二）", available: true },
    { setId: 14260, sourceSetId: 14255, name: "B1U1 听力训练（三）", available: true },
  ] },
  { code: "B1U2", title: "B1U2", sets: [
    { setId: 14261, sourceSetId: 14255, name: "B1U2 听力训练（一）", available: true },
    { setId: 14262, sourceSetId: 14255, name: "B1U2 听力训练（二）", available: true },
    { setId: 14263, sourceSetId: 14255, name: "B1U2 听力训练（三）", available: true },
  ] },
  { code: "B1U3", title: "B1U3", sets: [
    { setId: 14264, sourceSetId: 14255, name: "B1U3 听力训练（一）", available: true },
    { setId: 14265, sourceSetId: 14255, name: "B1U3 听力训练（二）", available: true },
    { setId: 14266, sourceSetId: 14255, name: "B1U3 听力训练（三）", available: true },
  ] },
  { code: "B1U4", title: "B1U4", sets: [
    { setId: 14267, sourceSetId: 14255, name: "B1U4 听力训练（一）", available: true },
    { setId: 14268, sourceSetId: 14255, name: "B1U4 听力训练（二）", available: true },
    { setId: 14269, sourceSetId: 14255, name: "B1U4 听力训练（三）", available: true },
  ] },
  { code: "B1U5", title: "B1U5", sets: [
    { setId: 14270, sourceSetId: 14255, name: "B1U5 听力训练（一）", available: true },
    { setId: 14271, sourceSetId: 14255, name: "B1U5 听力训练（二）", available: true },
    { setId: 14272, sourceSetId: 14255, name: "B1U5 听力训练（三）", available: true },
  ] },
  { code: "MIDTERM", title: "MIDTERM TEST I", sets: [
    { setId: 14273, sourceSetId: 14255, name: "MIDTERM TEST I", available: true },
  ] },
  { code: "B2U1", title: "B2U1", sets: [
    { setId: 14283, sourceSetId: 14255, name: "B2U1 听力训练（一）", available: true },
    { setId: 14284, sourceSetId: 14255, name: "B2U1 听力训练（二）", available: true },
    { setId: 14285, sourceSetId: 14255, name: "B2U1 听力训练（三）", available: true },
    { setId: 14286, sourceSetId: 14255, name: "B2U1 听力训练（四）", available: true },
  ] },
  { code: "B2U2", title: "B2U2", sets: [
    { setId: 14275, sourceSetId: 14255, name: "B2U2 听力训练（一）", available: true },
    { setId: 14276, sourceSetId: 14255, name: "B2U2 听力训练（二）", available: true },
    { setId: 14277, sourceSetId: 14255, name: "B2U2 听力训练（三）", available: true },
    { setId: 14278, sourceSetId: 14255, name: "B2U2 听力训练（四）", available: true },
  ] },
  { code: "B2U3", title: "B2U3", sets: [
    { setId: 14287, sourceSetId: 14255, name: "B2U3 听力训练（一）", available: true },
    { setId: 14288, sourceSetId: 14255, name: "B2U3 听力训练（二）", available: true },
    { setId: 14289, sourceSetId: 14255, name: "B2U3 听力训练（三）", available: true },
    { setId: 14290, sourceSetId: 14255, name: "B2U3 听力训练（四）", available: true },
  ] },
  { code: "B2U4", title: "B2U4", sets: [
    { setId: 14279, sourceSetId: 14255, name: "B2U4 听力训练（一）", available: true },
    { setId: 14280, sourceSetId: 14255, name: "B2U4 听力训练（二）", available: true },
    { setId: 14281, sourceSetId: 14255, name: "B2U4 听力训练（三）", available: true },
    { setId: 14282, sourceSetId: 14255, name: "B2U4 听力训练（四）", available: true },
  ] },
  { code: "B2U5", title: "B2U5", sets: [
    { setId: 14291, sourceSetId: 14255, name: "B2U5 听力训练（一）", available: true },
    { setId: 14292, sourceSetId: 14255, name: "B2U5 听力训练（二）", available: true },
    { setId: 14293, sourceSetId: 14255, name: "B2U5 听力训练（三）", available: true },
    { setId: 14294, sourceSetId: 14255, name: "B2U5 听力训练（四）", available: true },
  ] },
  { code: "FINAL", title: "FINAL TEST I", sets: [
    { setId: 14274, sourceSetId: 14255, name: "FINAL TEST I", available: true },
  ] },
];

const TEACHER_CLASSES = [
  { id: "1班", name: "高一1班", cohort: "2026级", classNo: "YMJO-2025-01", studentCount: 42, trend: "平均分提升", trendTone: "positive", syncTime: "2026-08-02 06:30" },
  { id: "2班", name: "高一2班", cohort: "2026级", classNo: "YMJO-2025-02", studentCount: 40, trend: "平均分稳定", trendTone: "positive", syncTime: "2026-08-02 06:30" },
  { id: "3班", name: "高一3班", cohort: "2026级", classNo: "YMJO-2025-03", studentCount: 41, trend: "需关注提升", trendTone: "attention", syncTime: "2026-08-02 06:30" },
];

const STUDENT_NAMES = [
  "李兰兰", "王晨曦", "张若涵", "刘子昂", "陈雨桐", "杨浩然", "赵欣怡", "黄思远", "周语彤", "吴嘉树",
  "徐可心", "孙博文", "胡嘉怡", "朱俊熙", "高梓萱", "林泽宇", "何诗涵", "郭宇辰", "马思琪", "罗逸凡",
  "梁梦洁", "宋皓轩", "郑佳宁", "谢文博", "韩依诺", "唐嘉佑", "冯语菲", "于景行", "董若琳", "萧奕辰",
  "程乐瑶", "曹致远", "袁心怡", "邓凯文", "许安然", "傅明轩", "沈佳琪", "曾睿哲", "彭思妍", "吕承泽",
  "苏雨桐", "陆星河",
];

function buildClassStudents(classId) {
  const classInfo = TEACHER_CLASSES.find((item) => item.id === classId) || TEACHER_CLASSES[0];
  const classIndex = Math.max(0, TEACHER_CLASSES.findIndex((item) => item.id === classId));
  const studentOffset = TEACHER_CLASSES
    .slice(0, classIndex)
    .reduce((total, item) => total + item.studentCount, 0);
  return STUDENT_NAMES.slice(0, classInfo.studentCount).map((name, index) => {
    const studentNo = String(2500001 + studentOffset + index);
    const listeningLevel = 6 + (index * 3 + classIndex) % 15;
    return {
      id: `${classId}-${index + 1}`,
      name,
      classId: classInfo.id,
      className: classInfo.name,
      cohort: classInfo.cohort,
      studentNo,
      account: `YMJO${studentNo}`,
      listeningLevel,
      passwordResetAt: "",
    };
  });
}

const CLASS_STUDENTS = Object.fromEntries(TEACHER_CLASSES.map((item) => [item.id, buildClassStudents(item.id)]));
const bookOverviewChartInstances = new Map();
const bookDataChartInstances = new Map();
const BOOK_OVERVIEW_REFERENCE = {
  className: "1班",
  progressPercent: 56,
  scoreDistribution: [2, 3, 5, 34, 2],
  setScores: [23.6, 18.9, 25.4, 21.7, 17.8, 22.3, 24.6, 19.2, 20.8, 26.1, 22.4, 18.6, 21.9, 24.7, 20, 17.5, 23.1, 21, 16.8, 24.3],
  nationalSetScores: [22.8, 20.2, 23.9, 22.5, 19.4, 21.7, 23.2, 20.4, 21.6, 24.8, 22.9, 19.8, 22.6, 23.5, 21.4, 19.1, 22.3, 21.8, 18.7, 23.1],
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const EMPTY_FILTER_VALUE = "__none__";

const icons = {
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>',
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
  "eye-off": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 6.2A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16.8 16.8 0 0 1-2.1 2.7M6.1 6.1C3.7 7.8 2.5 12 2.5 12s3.5 6 9.5 6a9.6 9.6 0 0 0 3-.5M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 10.3 12 3l9 7.3v9.2c0 .8-.7 1.5-1.5 1.5H15v-6H9v6H4.5c-.8 0-1.5-.7-1.5-1.5z"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 4.8C5.6 3.7 8.3 3.9 11 5.4V21c-2.5-1.4-5.1-1.7-8-.5zm18 0c-2.6-1.1-5.3-.9-8  .6V21c2.5-1.4 5.1-1.7 8-.5z"/></svg>',
  library: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="18" rx="1"/><path d="M6.5 3v18M14.2 4.2l6.2 15.6M12.4 4.9l2.5-1a1 1 0 0 1 1.3.6l5.1 13.2a1 1 0 0 1-.6 1.3l-2.5 1a1 1 0 0 1-1.3-.6L11.8 6.2a1 1 0 0 1 .6-1.3Z"/></svg>',
  database: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 5c0 1.7-3.8 3-8.5 3S3.5 6.7 3.5 5 7.3 2 12 2s8.5 1.3 8.5 3Zm0 3.2v4.3c0 1.7-3.8 3-8.5 3s-8.5-1.3-8.5-3V8.2C5.4 9.4 8.6 10 12 10s6.6-.6 8.5-1.8Zm0 7.5V19c0 1.7-3.8 3-8.5 3s-8.5-1.3-8.5-3v-3.3c1.9 1.2 5.1 1.8 8.5 1.8s6.6-.6 8.5-1.8Z"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M9 3.5A2.5 2.5 0 0 1 11.5 1h1A2.5 2.5 0 0 1 15 3.5h3A2 2 0 0 1 20 5v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3v.5ZM8 11h8v2H8v-2Zm0 5h6v2H8v-2Z" clip-rule="evenodd"/></svg>',
  cloze: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5h14v17H5z"/><path d="M8 8h8M8 12h3M14 12h2M8 16h2.5M14 16h2"/><path d="M10.8 12h3M10.8 16H14"/></svg>',
  users: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 0 1 16 0H4Zm15.2-8.9a3.7 3.7 0 0 0-1.4-7.1 6.2 6.2 0 0 1-.2 6.8c.6.1 1.1.2 1.6.3ZM21 21h2a6.4 6.4 0 0 0-5.4-6.3A10 10 0 0 1 21 21Z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 17h-1V9a7 7 0 0 0-14 0v8H4a2 2 0 0 0-2 2h20a2 2 0 0 0-2-2Zm-11 4h6a3 3 0 0 1-6 0Z"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
  "arrow-left": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></svg>',
  "arrow-right": '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M2 3h3.2l1.1 3H21l-2.2 8.2a2 2 0 0 1-1.9 1.5H9a2 2 0 0 1-1.9-1.4L4.4 6H2V3Zm7 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  scan: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3M7 12h10"/></svg>',
  paper: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V5a1.5 1.5 0 0 1 1-1.5Z"/><path d="M14 3.5V8h4M8 12h8M8 16h6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.8" width="10" height="18.4" rx="2.2"/><path d="M10.5 17.8h3"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg>',
  detail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h4"/><circle cx="17" cy="17" r="3"/><path d="m19.2 19.2 2 2"/></svg>',
  pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0 0-3L17.6 4.2a2.1 2.1 0 0 0-3 0L4 14.8 3 20z"/><path d="m13.5 5.4 5.1 5.1"/></svg>',
  filter: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3Z"/></svg>',
  "chevron-down": '<svg viewBox="0 0 24 24"><path d="m7 9.5 5 5 5-5"/></svg>',
  "chevron-up": '<svg viewBox="0 0 24 24"><path d="m7 14.5 5-5 5 5"/></svg>',
  "sort-asc": '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 4-4 4 4M7 4v16M11 12h4M11 16h7M11 20h10"/></svg>',
  "sort-desc": '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m3 16 4 4 4-4M7 20V4M11 4h10M11 8h7M11 12h4"/></svg>',
  expand: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
  headphones: '<svg viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v6H5a1 1 0 0 1-1-1zM20 14h-3v6h2a1 1 0 0 0 1-1z"/></svg>',
  files: '<svg viewBox="0 0 24 24"><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 12h7M9 16h7"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20V8"/></svg>',
  message: '<svg viewBox="0 0 24 24"><path d="M4 4h16v12H8l-4 4z"/><path d="M8 9h8M8 13h5"/></svg>',
  waves: '<svg viewBox="0 0 24 24"><path d="M3 12h2l2-5 4 10 3-8 3 6 2-3h2"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></svg>',
  target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
  "check-filled": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7.5 12.2 3 3.1 6.4-7"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-15.4 6.4L3 16"/><path d="M3 21v-5h5"/><path d="M3 12A9 9 0 0 1 18.4 5.6L21 8"/><path d="M16 8h5V3"/></svg>',
  gauge: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.2 17a8.5 8.5 0 1 1 15.6 0"/><path d="m12 13 4-4"/><path d="M7 17h10"/></svg>',
  grip: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1" fill="currentColor" stroke="none"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m4 20 4.2-1 10.9-10.9a2.1 2.1 0 0 0-3-3L5.2 16Z"/><path d="m14.8 6.4 2.8 2.8M4 20h6"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6.5 7l1 14h9l1-14M10 11v6M14 11v6"/></svg>',
  warning: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>',
  help: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9.8 9.2a2.4 2.4 0 0 1 4.5 1.2c0 1.7-2.3 1.8-2.3 3.6"/><path d="M12 17.4h.01"/></svg>',
  answer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11.5 11.5 14 16 9.5"/><rect x="3.5" y="3.5" width="17" height="17" rx="3"/></svg>',
  analysis: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5h10l4 4V20.5H5z"/><path d="M14 3.5v5h5M8 12h5M8 16h3"/><circle cx="16.5" cy="16.5" r="2.5"/><path d="m18.3 18.3 2.2 2.2"/></svg>',
  layers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></svg>',
  translate: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h9M8.5 3v2M6 5c.7 3.2 2.7 5.8 5.5 7.5M11 5c-.6 2.7-2.2 5-4.5 6.6"/><path d="m14 20 3.5-8 3.5 8M15.2 17h4.6"/></svg>',
  vocabulary: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4.5c2.8-.8 5.5-.3 8 1.5v14c-2.5-1.8-5.2-2.3-8-1.5zM20 4.5c-2.8-.8-5.5-.3-8 1.5v14c2.5-1.8 5.2-2.3 8-1.5z"/></svg>',
  grammar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M8 5v14M5 19h6M14 10h6M17 7v6"/></svg>',
  skill: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9S14.5 18.5 12 21M12 3C9.5 5.5 8.2 8.5 8.2 12S9.5 18.5 12 21"/></svg>',
  tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8" cy="8" r="1"/></svg>',
  map: '<svg viewBox="0 0 24 24"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>',
  "layout-left": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M8.5 4.5v15"/></svg>',
  "layout-right": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M15.5 4.5v15"/></svg>',
  "teaching-tools": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16v11H4z"/><path d="M9 8V5h6v3M4 12h16M9 12v2M15 12v2"/></svg>',
  "toolbar-panel": '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>',
  "sliders-horizontal": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>',
  audio: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  "type-minus": '<svg viewBox="0 0 24 24"><path d="M4 7V4h12v3M10 4v16M7 20h6M16 15h6"/></svg>',
  "type-plus": '<svg viewBox="0 0 24 24"><path d="M4 7V4h12v3M10 4v16M7 20h6M19 13v6M16 16h6"/></svg>',
  "return-lecture": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 5v7a4 4 0 0 1-4 4H5"/><path d="m9 12-4 4 4 4"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5z"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>',
};

function hydrateIcons() {
  $$("[data-icon]").forEach((node) => {
    const icon = icons[node.dataset.icon];
    if (icon) node.innerHTML = icon;
  });
}

function setPageTitle(title, icon) {
  if (!icon) {
    els.pageTitle.textContent = title;
    return;
  }
  els.pageTitle.innerHTML = `<span class="page-title-icon" data-icon="${icon}" aria-hidden="true"></span><span>${title}</span>`;
  hydrateIcons();
}

let appNoticeTimer = null;
let appDialogAction = null;

function showAppNotice(message, type = "info") {
  const notice = $("#appNotice");
  clearTimeout(appNoticeTimer);
  notice.className = `app-notice app-notice-${type}`;
  $("#appNoticeText").textContent = message;
  notice.classList.remove("hidden");
  appNoticeTimer = setTimeout(() => notice.classList.add("hidden"), 5200);
}

function hideAppNotice() {
  clearTimeout(appNoticeTimer);
  $("#appNotice").classList.add("hidden");
}

function openAppDialog({ title, message, confirmText = "确定", danger = false, onConfirm }) {
  const dialog = $("#appDialog");
  dialog.querySelector(".app-dialog-panel").classList.toggle("password-confirm-panel", title === "重置学生 APP 密码");
  $("#appDialogTitle").textContent = title;
  $("#appDialogMessage").textContent = message;
  $("#appDialogConfirm").textContent = confirmText;
  $("#appDialogConfirm").classList.toggle("danger-action", danger);
  appDialogAction = onConfirm;
  dialog.classList.remove("hidden");
  requestAnimationFrame(() => $("#appDialogConfirm").focus());
}

function closeAppDialog() {
  $("#appDialog").classList.add("hidden");
  appDialogAction = null;
}

function bindAppFeedback() {
  $("#appNoticeClose").addEventListener("click", hideAppNotice);
  $("#appDialogCancel").addEventListener("click", closeAppDialog);
  $("#appDialog").querySelector("[data-dialog-cancel]").addEventListener("click", closeAppDialog);
  $("#appDialogConfirm").addEventListener("click", () => {
    const action = appDialogAction;
    closeAppDialog();
    if (action) action();
  });
  $$('[data-full-option-students-close]').forEach((button) => button.addEventListener("click", closeFullOptionStudentDialog));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && (document.fullscreenElement || resourceImageFullscreenActive)) {
      event.preventDefault();
      document.exitFullscreen?.();
      return;
    }
    if (event.key === "Escape" && !$("#appDialog").classList.contains("hidden")) closeAppDialog();
    if (event.key === "Escape" && !$("#passwordResetDialog").classList.contains("hidden")) closePasswordResetDialog();
    if (event.key === "Escape" && !$("#studentEditDialog").classList.contains("hidden")) closeStudentEdit();
    if (event.key === "Escape" && !$("#bookAssignmentDialog").classList.contains("hidden")) closeBookAssignmentDialog();
    if (event.key === "Escape" && !$("#fullOptionStudentDialog").classList.contains("hidden")) closeFullOptionStudentDialog();
    if (event.key === "Escape" && !els.popover.classList.contains("hidden")) {
      if (resourceImageFullscreenActive) {
        resourceImageFullscreenActive = false;
      } else {
        dismissResourcePopover();
      }
    }
  });
  $$('[data-password-reset-close]').forEach((button) => button.addEventListener("click", closePasswordResetDialog));
  $("#copyResetPassword").addEventListener("click", async () => {
    if (!state.lastResetPassword) return;
    try {
      await navigator.clipboard.writeText(`${$("#passwordResetAccount").textContent}  ${state.lastResetPassword}`);
      showAppNotice("学生账号和重置后密码已复制。", "success");
    } catch {
      showAppNotice("浏览器未允许自动复制，请手动复制学生账号和密码。", "warning");
    }
  });
}

const els = {
  loginPage: $("#loginPage"),
  loginForm: $("#loginForm"),
  pageTitle: $("#pageTitle"),
  homePage: $("#homePage"),
  profilePage: $("#profilePage"),
  booksPage: $("#booksPage"),
  bookOverviewPage: $("#bookOverviewPage"),
  bookDetailPage: $("#bookDetailPage"),
  questionBankPage: $("#questionBankPage"),
  myPaperPanel: $("#myPaperPanel"),
  aiAssignmentPanel: $("#aiAssignmentPanel"),
  listeningPage: $("#listeningPage"),
  listeningWorkspaceAnchor: $("#listeningWorkspaceAnchor"),
  listeningTablePanel: $("#listeningPage .table-panel"),
  classPage: $("#classPage"),
  workPage: $("#workPage"),
  workReportPage: $("#workReportPage"),
  dictationPage: $("#dictationPage"),
  dictationPublishPage: $("#dictationPublishPage"),
  paperPage: $("#paperPage"),
  bottomBar: $("#bottomBar"),
  questionRows: $("#questionRows"),
  addAllFilteredToBasket: $("#addAllFilteredToBasket"),
  pageInfo: $("#pageInfo"),
  basket: $("#basket"),
  basketTotal: $("#basketTotal"),
  basketTitle: $("#basketTitle"),
  basketGroups: $("#basketGroups"),
  columnFilterMenu: $("#columnFilterMenu"),
  rateThreshold: $("#rateThreshold"),
  classValue: $("#classValue"),
  timeValue: $("#timeValue"),
  dateRangePanel: $("#dateRangePanel"),
  fullscreenPage: $("#fullscreenPage"),
  globalAssistToolbar: $("#globalAssistToolbar"),
  globalAssistToggle: $("#globalAssistToggle"),
  globalAssistActions: $("#globalAssistToolbar .global-assist-actions"),
  globalZoomIn: $("#globalZoomIn"),
  globalZoomOut: $("#globalZoomOut"),
  globalHalfScreen: $("#globalHalfScreen"),
  globalHalfScreenRestore: $("#globalHalfScreenRestore"),
  fullTitle: $("#fullTitle"),
  fullQuestion: $("#fullQuestion"),
  transcriptPanel: $("#transcriptPanel"),
  transcript: $("#transcript"),
  leftKnowledgeRail: $("#leftKnowledgeRail"),
  classRate: $("#classRate"),
  wrongNavItems: $("#wrongNavItems"),
  questionPickerScrollbar: $("#questionPickerScrollbar"),
  questionPickerScrollThumb: $("#questionPickerScrollThumb"),
  audio: $("#audio"),
  practiceInstructionAudio: $("#practiceInstructionAudio"),
  popover: $("#popover"),
  popoverBackdrop: $("#resourcePopoverBackdrop"),
  onlinePage: $("#onlinePage"),
  onlineAudio: $("#onlineAudio"),
};

const bookQuestionAudio = new Audio();
bookQuestionAudio.preload = "metadata";

async function boot() {
  hydrateIcons();
  const [data, timecodes] = await loadPrototypeData();
  state.questions = applyPrototypeNationalStats(data.questions)
    .sort((a, b) => classCorrectRateExact(a) - classCorrectRateExact(b));
  state.textResources = data.textResources || {};
  state.timecodes = timecodes;
  renderStats();
  renderSchoolBookSummary();
  renderClassPage();
  bindEvents();
  bindGlobalAssistToolbar();
  bindLoginEvents();
  setupDateRange();
  const preview = new URLSearchParams(location.hash.slice(1));
  const bypassLogin = preview.has("preview") || preview.has("full") || preview.has("listening");
  if (bypassLogin) enterTeacherApp(preview.has("full") || preview.has("listening") ? "listening" : "home");
  else showLoginPage();
  renderTable();
  renderBasket();
  if (preview.has("full")) {
    const ids = (preview.get("full") || state.questions[0]?.id || "").split(",").filter(Boolean);
    openFull(ids, ids[0]);
    if (preview.has("answer")) {
      state.showAnswer = true;
      renderFull();
    }
    if (preview.has("analysis")) {
      state.showAnalysis = true;
      renderFull();
      requestAnimationFrame(scrollToClue);
    }
  }
}

function showLoginPage() {
  els.loginPage.classList.remove("hidden");
  $("#app").classList.add("hidden");
  $("#app").setAttribute("aria-hidden", "true");
  document.body.classList.add("login-active");
  applyGlobalAssistState();
  requestAnimationFrame(() => $("#loginAccount").focus());
}

function enterTeacherApp(page = "home") {
  document.body.classList.remove("login-active");
  els.loginPage.classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#app").setAttribute("aria-hidden", "false");
  syncRoute(page);
}

function globalAssistFullscreenSuspended() {
  return els.fullscreenPage && !els.fullscreenPage.classList.contains("hidden");
}

function applyGlobalAssistState() {
  if (!els.globalAssistToolbar) return;
  const suspended = globalAssistFullscreenSuspended();
  const shifted = !suspended && state.globalAssistHalfScreen;
  document.body.classList.toggle("global-assist-half-screen", shifted);
  els.globalAssistToolbar.classList.toggle("hidden", suspended);
  els.globalAssistToolbar.classList.toggle("expanded", state.globalAssistExpanded);
  els.globalAssistToggle.setAttribute("aria-expanded", String(state.globalAssistExpanded));
  els.globalAssistToggle.setAttribute("aria-label", state.globalAssistExpanded ? "折叠全局辅助工具栏" : "展开全局辅助工具栏");
  els.globalAssistToggle.textContent = state.globalAssistExpanded ? "›" : "‹";
  els.globalAssistActions.setAttribute("aria-hidden", String(!state.globalAssistExpanded));
  els.globalZoomIn.disabled = suspended;
  els.globalZoomOut.disabled = suspended;
  els.globalHalfScreen.disabled = suspended;
  els.globalHalfScreen.textContent = state.globalAssistHalfScreen ? "恢复" : "降半屏";
  els.globalHalfScreen.setAttribute("aria-pressed", String(state.globalAssistHalfScreen));
}

function showGlobalAssistZoomPending() {
  showAppNotice("缩放功能待开发。", "info");
}

function setGlobalAssistHalfScreen(active) {
  state.globalAssistHalfScreen = active;
  saveGlobalAssistState();
  applyGlobalAssistState();
}

function bindGlobalAssistToolbar() {
  if (!els.globalAssistToolbar) return;
  els.globalAssistToggle.addEventListener("click", () => {
    state.globalAssistExpanded = !state.globalAssistExpanded;
    saveGlobalAssistState();
    applyGlobalAssistState();
  });
  els.globalZoomIn.addEventListener("click", showGlobalAssistZoomPending);
  els.globalZoomOut.addEventListener("click", showGlobalAssistZoomPending);
  els.globalHalfScreen.addEventListener("click", () => setGlobalAssistHalfScreen(!state.globalAssistHalfScreen));
  els.globalHalfScreenRestore.addEventListener("click", () => setGlobalAssistHalfScreen(false));
  applyGlobalAssistState();
}

function setLoginBusy(busy) {
  const button = $("#loginSubmit");
  button.disabled = busy;
  button.classList.toggle("loading", busy);
  button.querySelector("span").textContent = busy ? "登录中…" : "登录";
  $("#loginAccount").disabled = busy;
  $("#loginPassword").disabled = busy;
}

function bindLoginEvents() {
  const form = els.loginForm;
  const account = $("#loginAccount");
  const password = $("#loginPassword");
  const error = $("#loginError");
  const toggle = $("#loginPasswordToggle");
  const setError = (message = "") => {
    error.textContent = message;
    form.classList.toggle("has-error", Boolean(message));
  };
  [account, password].forEach((input) => input.addEventListener("input", () => setError()));
  toggle.addEventListener("click", () => {
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";
    toggle.setAttribute("aria-label", showing ? "显示密码" : "隐藏密码");
    toggle.setAttribute("aria-pressed", String(!showing));
    toggle.querySelector("[data-icon]").dataset.icon = showing ? "eye" : "eye-off";
    hydrateIcons();
    password.focus();
  });
  $("#loginForgot").addEventListener("click", () => {
    setError("请联系学校管理员重置密码。");
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const accountValue = account.value.trim();
    const passwordValue = password.value;
    if (!accountValue || !passwordValue) {
      setError(!accountValue ? "请输入账号。" : "请输入密码。");
      (!accountValue ? account : password).focus();
      return;
    }
    if (accountValue !== state.teacherPhone || passwordValue !== state.teacherPassword) {
      setError("账号或密码错误，请检查后重试。");
      password.focus();
      password.select();
      return;
    }
    setError();
    setLoginBusy(true);
    window.setTimeout(() => {
      setLoginBusy(false);
      enterTeacherApp("home");
    }, 520);
  });
}

async function loadPrototypeData() {
  if (window.PROTOTYPE_DATA && window.TIMECODES_DATA) {
    return [window.PROTOTYPE_DATA, window.TIMECODES_DATA];
  }
  return Promise.all([
    fetch("./data/prototype-data.json").then((res) => res.json()),
    fetch("./data/timecodes.json").then((res) => res.json()),
  ]);
}

function applyPrototypeNationalStats(questions = []) {
  return questions.map((question) => {
    if (question.statisticsAvailable === false || (question.nationalRate !== null && question.nationalRate !== undefined)) return question;
    const setId = Number(question.setId);
    const questionNo = Math.max(1, Number(question.questionNo) || 1);
    const pattern = PROTOTYPE_NATIONAL_RATE_PATTERNS[setId] || PROTOTYPE_NATIONAL_RATE_PATTERNS[14255];
    const nationalRate = pattern[(questionNo - 1) % pattern.length];
    const nationalAttemptCount = 1500 + questionNo * 100 + (setId === 14256 ? 200 : 0);
    return {
      ...question,
      nationalRate,
      nationalAttemptCount,
      nationalCorrectCount: nationalAttemptCount * nationalRate / 100,
      nationalStatisticsSource: "prototype-demo",
    };
  });
}

function bindEvents() {
  bindAppFeedback();
  bindBookOptionStudentTooltip();
  bindProfileEvents();
  $("#enterListening").addEventListener("click", () => syncRoute("listening"));
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => syncRoute(button.dataset.page));
  });
  const closeSidebarRoleMenu = () => {
    $("#sidebarRoleMenu").classList.add("hidden");
    $("#sidebarRoleToggle").setAttribute("aria-expanded", "false");
  };
  $("#sidebarProfileButton").addEventListener("click", () => {
    closeSidebarRoleMenu();
    syncRoute("profile");
  });
  $("#sidebarRoleToggle").addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = $("#sidebarRoleMenu").classList.contains("hidden");
    $("#sidebarRoleMenu").classList.toggle("hidden", !willOpen);
    $("#sidebarRoleToggle").setAttribute("aria-expanded", String(willOpen));
  });
  $("#sidebarRoleMenu").addEventListener("click", (event) => {
    const roleButton = event.target.closest("[data-sidebar-role]");
    if (!roleButton) return;
    $("#sidebarRoleLabel").textContent = roleButton.textContent;
    $$("[data-sidebar-role]").forEach((button) => {
      button.setAttribute("aria-selected", String(button === roleButton));
    });
    closeSidebarRoleMenu();
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".sidebar-role-picker")) closeSidebarRoleMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebarRoleMenu();
  });
  $$("[data-book-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.bookTab;
      $$("[data-book-tab]").forEach((item) => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      $$("[data-book-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.bookPanel !== tab));
    });
  });
  $$("[data-book-action]").forEach((button) => {
    button.addEventListener("click", () => {
      showAppNotice(`“${button.dataset.bookAction}”页面暂未开发，本次仅展示入口交互。`, "info");
    });
  });
  document.addEventListener("click", (event) => {
    if (els.popover.classList.contains("hidden")) return;
    if (event.target.closest("#popover") || event.target.closest("[data-resource-highlight]")) return;
    dismissResourcePopover();
  });
  els.popoverBackdrop.addEventListener("click", dismissResourcePopover);
  $$("[data-book-detail-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      window.SingleBookCatalog?.selectBook(button.closest("[data-book-key]")?.dataset.bookKey || "legacy-book");
      openBookDetailForClass(state.bookClassName, button.dataset.bookDetailMode);
    });
  });
  $("#bookDetailTabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-book-workbench-tab]");
    if (!button) return;
    openBookWorkbenchTab(button.dataset.bookWorkbenchTab);
  });
  $("#backToBooksFromOverview").addEventListener("click", () => syncRoute("books"));
  $("#bookOverviewTabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-book-workbench-tab]");
    if (!button) return;
    const nextTab = button.dataset.bookWorkbenchTab;
    if (nextTab === "compose") {
      openBookDetailForClass(state.bookClassName, "questions", state.bookActiveSetId || 14255);
      return;
    }
    if (state.bookOverviewTab === "mistakes" && nextTab !== "mistakes") leaveBookMistakesWorkspace();
    if (nextTab !== "catalog") {
      state.bookOverviewSetDetailId = null;
      state.bookOverviewSetDetailStudentId = null;
    }
    if (nextTab === "catalog" && state.bookOverviewTab === "catalog") {
      state.bookOverviewSetDetailId = null;
      state.bookOverviewSetDetailStudentId = null;
    }
    state.bookOverviewTab = nextTab;
    if (nextTab === "mistakes") state.currentPage = 1;
    renderBookOverview();
  });
  $("#bookOverviewClassSelect").addEventListener("change", (event) => {
    state.bookClassName = event.target.value;
    state.bookOverviewSetDetailId = null;
    state.bookOverviewSetDetailStudentId = null;
    state.bookOverviewStudentId = null;
    renderBookOverview();
  });
  $("#bookDetailHeaderClassSelect").addEventListener("change", (event) => {
    state.bookClassName = event.target.value;
    renderBookDetail();
  });
  $("#backToBooks").addEventListener("click", () => syncRoute("books"));
  $("#toggleBookTranscript").addEventListener("change", (event) => {
    state.bookTranscriptVisible = event.target.checked;
    const activeSet = activeBookCatalogDisplaySet();
    if (activeSet) {
      renderBookQuestionSelection(activeSet);
      hydrateIcons();
    }
  });
  $("#bookQuestionFilters").addEventListener("change", (event) => {
    const sortInput = event.target.closest("[data-book-question-sort]");
    if (!sortInput) return;
    if (sortInput) state.bookQuestionSortKey = sortInput.dataset.bookQuestionSort;
    const activeSet = activeBookCatalogDisplaySet();
    if (activeSet) {
      renderBookQuestionSelection(activeSet);
      hydrateIcons();
    }
  });
  $("#bookClassSelect").addEventListener("change", (event) => {
    state.bookClassName = event.target.value;
    renderBookDetail();
  });
  $("#bookDataTabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-book-data-tab]");
    if (!button) return;
    state.bookDataTab = button.dataset.bookDataTab;
    state.bookStudentDataPage = 1;
    state.bookQuestionDataPage = 1;
    renderBookDetail();
  });
  $("#bookClassSwitch").addEventListener("click", (event) => {
    const button = event.target.closest("[data-book-class-switch]");
    if (!button) return;
    state.bookClassName = button.dataset.bookClassSwitch;
    state.bookStudentDataPage = 1;
    state.bookQuestionDataPage = 1;
    renderBookDetail();
  });
  $("#backToWorkReport").addEventListener("click", () => syncRoute("work"));
  $("#workReportTabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-work-report-tab]");
    if (!button) return;
    const nextTab = button.dataset.workReportTab;
    if (state.workReportTab === "mistakes" && nextTab !== "mistakes") leaveBookMistakesWorkspace();
    if (nextTab !== "catalog") {
      state.bookOverviewSetDetailId = null;
      state.bookOverviewSetDetailStudentId = null;
    }
    state.workReportTab = button.dataset.workReportTab;
    state.workReportStudentPage = 1;
    state.workReportQuestionPage = 1;
    renderWorkReport();
  });
  $("#workReportClassSwitch").addEventListener("change", (event) => {
    state.workReportClassName = event.target.value;
    state.bookClassName = state.workReportClassName;
    state.bookOverviewSetDetailId = null;
    state.bookOverviewSetDetailStudentId = null;
    state.bookOverviewStudentId = null;
    state.workReportStudentPage = 1;
    state.workReportQuestionPage = 1;
    renderWorkReport();
  });
  $("#bookPaperAction").addEventListener("click", () => {
    if (!prepareBookSelection()) return;
    openPaperSetupDialog("direct");
  });
  $("#bookDictationAction").addEventListener("click", () => {
    if (!prepareBookSelection()) return;
    openDictationFromBasket();
  });
  $("#bookQuestionAssignmentAction").addEventListener("click", () => {
    if (!prepareBookSelection()) return;
    openPaperSetupDialog("publish");
  });
  $("#bookBasketClearAll").addEventListener("click", () => {
    state.bookSelectedQuestionIds.clear();
    state.bookBasketExpandedTypes.clear();
    saveBookBasket();
    const activeSet = activeBookCatalogDisplaySet();
    if (activeSet) renderBookQuestionSelection(activeSet);
    else renderBookBasket();
    hydrateIcons();
  });
  ["loadedmetadata", "timeupdate", "play", "pause", "ended"].forEach((eventName) => {
    bookQuestionAudio.addEventListener(eventName, updateBookQuestionAudioControls);
  });
  bookQuestionAudio.addEventListener("timeupdate", stopBookTranscriptSegmentIfNeeded);
  $("#bookQuestionAudioToggle").addEventListener("click", () => {
    const set = bookSets().find((item) => item.setId === Number(bookQuestionAudio.dataset.setId));
    const textNo = Number(bookQuestionAudio.dataset.textNo);
    if (set && textNo) playBookQuestionText(set, textNo, false);
  });
  $("#bookQuestionAudioSeek").addEventListener("input", (event) => {
    if (!bookQuestionAudio.dataset.key) return;
    bookQuestionAudio.currentTime = Number(event.currentTarget.value);
    updateBookQuestionAudioControls();
  });
  $("#exitDictationEditor").addEventListener("click", () => leaveContentEditor("dictation"));
  $("#exitPaperEditor").addEventListener("click", () => leaveContentEditor("paper"));
  $("#clearBasket").addEventListener("click", () => {
    const scopeIds = new Set(listeningScopeQuestions().map((question) => question.id));
    scopeIds.forEach((id) => state.selectedIds.delete(id));
    saveBasket();
    renderTable();
    renderBasket();
  });
  els.addAllFilteredToBasket.addEventListener("click", () => {
    const ids = filteredQuestions().map((q) => q.id);
    ids.forEach((id) => state.selectedIds.add(id));
    saveBasket();
    renderTable();
    renderBasket();
  });
  $("#prevPage").addEventListener("click", () => {
    state.currentPage = Math.max(1, state.currentPage - 1);
    renderTable();
  });
  $("#nextPage").addEventListener("click", () => {
    const maxPage = Math.max(1, Math.ceil(filteredQuestions().length / state.pageSize));
    state.currentPage = Math.min(maxPage, state.currentPage + 1);
    renderTable();
  });
  $("#pageSizeValue").textContent = String(state.pageSize);
  $$('[data-page-size]').forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.pageSize) === state.pageSize);
    button.addEventListener("click", () => {
      const nextSize = Number(button.dataset.pageSize);
      if (![10, 20, 30, 40, 50].includes(nextSize)) return;
      state.pageSize = nextSize;
      state.currentPage = 1;
      demoStorage.setItem("victor:pageSize", String(nextSize));
      $("#pageSizeValue").textContent = String(nextSize);
      $$('[data-page-size]').forEach((item) => item.classList.toggle("selected", item === button));
      $("#pageSizeSelect").open = false;
      renderTable();
    });
  });
  $("#rateMinus").addEventListener("click", () => {
    state.rateThreshold = Math.max(10, state.rateThreshold - 10);
    demoStorage.setItem("victor:rateThreshold", String(state.rateThreshold));
    state.currentPage = 1;
    renderTable();
    updateBottomBar();
  });
  $("#ratePlus").addEventListener("click", () => {
    state.rateThreshold = Math.min(100, state.rateThreshold + 10);
    demoStorage.setItem("victor:rateThreshold", String(state.rateThreshold));
    state.currentPage = 1;
    renderTable();
    updateBottomBar();
  });
  $$("[data-class-value]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextClass = button.dataset.classValue;
      if (nextClass !== state.filterClass) {
        state.filterClass = nextClass;
        state.selectedIds = new Set(loadBasketForClass(nextClass));
      }
      if (state.listeningWorkspaceMode === "book-mistakes") {
        state.bookClassName = nextClass;
        $("#bookOverviewClassSelect").value = nextClass;
      }
      els.classValue.textContent = state.filterClass;
      $$("[data-class-value]").forEach((item) => item.classList.toggle("selected", item === button));
      $("#classSelect").open = false;
      state.currentPage = 1;
      renderStats();
      renderTable();
      renderBasket();
    });
  });
  $$("[data-time-value]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filterTime = button.dataset.timeValue;
      els.timeValue.textContent = state.filterTime;
      $$("[data-time-value]").forEach((item) => item.classList.toggle("selected", item === button));
      $("#timeSelect").open = false;
      els.dateRangePanel.classList.add("hidden");
      state.currentPage = 1;
      renderTable();
    });
  });
  $("#customTimeToggle").addEventListener("click", () => els.dateRangePanel.classList.toggle("hidden"));
  $("#cancelDateRange").addEventListener("click", () => els.dateRangePanel.classList.add("hidden"));
  $("#applyDateRange").addEventListener("click", applyDateRange);
  $$("[data-filter-column]").forEach((button) => button.addEventListener("click", (event) => openColumnFilter(event, button.dataset.filterColumn)));
  document.addEventListener("click", (event) => {
    if (!els.columnFilterMenu.classList.contains("hidden") && !event.target.closest(".column-filter-menu") && !event.target.closest("[data-filter-column]")) {
      els.columnFilterMenu.classList.add("hidden");
    }
  });
  $("#clearFilters").addEventListener("click", clearListeningFilters);
  $("#filterComposedQuestions").addEventListener("change", (event) => {
    state.filterComposedQuestions = event.target.checked;
    state.currentPage = 1;
    renderTable();
  });
  $("#filteredFullBtn").addEventListener("click", () => {
    const ids = filteredQuestions().map((q) => q.id);
    if (ids.length) openFull(ids, ids[0]);
  });
  $("#dictationBtn").addEventListener("click", openDictationFromBasket);
  $("#paperBtn").addEventListener("click", () => openPaperSetupDialog("direct"));
  $("#basketPublishBtn").addEventListener("click", () => openPaperSetupDialog("publish"));
  $("#answerToggle").addEventListener("click", () => {
    if (state.followReadActive) return;
    state.showAnswer = !state.showAnswer;
    renderFull();
  });
  $("#answerAnalysisToggle").addEventListener("click", () => {
    if (state.followReadActive || state.practiceModeActive) return;
    state.showAnswerAnalysis = !state.showAnswerAnalysis;
    renderFull();
  });
  $("#analysisToggle").addEventListener("click", () => {
    if (state.followReadActive || state.practiceModeActive) return;
    state.showAnalysis = !state.showAnalysis;
    if (!state.showAnalysis) state.questionPanelCollapsed = false;
    renderFull();
    if (state.showAnalysis) requestAnimationFrame(scrollToClue);
  });
  $("#questionPanelCollapse").addEventListener("click", () => {
    const isSimilar = els.fullscreenPage.dataset.mode === "similar";
    if (!state.followReadActive && !state.showAnalysis) return;
    state.questionPanelCollapsed = !state.questionPanelCollapsed;
    renderFull();
  });
  $("#followReadBtn").addEventListener("click", toggleFollowRead);
  $("#maskTranscriptBtn").addEventListener("click", toggleTranscriptMask);
  $("#questionTranslate").addEventListener("click", () => {
    if (state.followReadActive || state.practiceModeActive) return;
    state.showQuestionTranslation = !state.showQuestionTranslation;
    renderFull();
  });
  $("#similarBtn").addEventListener("click", () => {
    if (state.followReadActive || state.practiceModeActive) return;
    openSimilar();
  });
  $("#swapSimilarQuestion").addEventListener("click", swapCurrentSimilarQuestion);
  $$("[data-similar-source]").forEach((button) => button.addEventListener("click", () => setSimilarSource(button.dataset.similarSource)));
  $("#returnToLecture").addEventListener("click", handleFullReturn);
  $("#orderRate").addEventListener("click", () => setExplainOrder("rate"));
  $("#orderNatural").addEventListener("click", () => setExplainOrder("natural"));
  $("#playPause").addEventListener("click", toggleAudio);
  $("#speedMenuToggle").addEventListener("click", toggleSpeedMenu);
  $$("[data-playback-rate]").forEach((button) => {
    button.addEventListener("click", () => setPlaybackRate(Number(button.dataset.playbackRate)));
  });
  setPlaybackRate(state.playbackRate, false);
  $("#setSelect").addEventListener("click", (event) => {
    if ($("#setSelect").classList.contains("single-option") && event.target.closest("summary")) {
      event.preventDefault();
    }
  });
  $("#dockLayoutSwitch").addEventListener("click", switchClassroomDockSide);
  $("#classroomDockToggle").addEventListener("click", toggleClassroomDock);
  $("#interfaceSettingsToggle").addEventListener("click", toggleInterfaceSettings);
  $("#closeInterfaceSettings").addEventListener("click", closeInterfaceSettings);
  $("#currentQuestionPicker").addEventListener("click", openQuestionPicker);
  $("#closeQuestionPicker").addEventListener("click", closeQuestionPicker);
  els.wrongNavItems.addEventListener("scroll", updateQuestionPickerScrollbar, { passive: true });
  els.questionPickerScrollbar.addEventListener("pointerdown", startQuestionPickerScroll);
  $("#prevQuestion").addEventListener("click", () => navigateQuestion(-1));
  $("#nextQuestion").addEventListener("click", () => navigateQuestion(1));
  syncPracticeSettingsUi();
  $("#practiceQuestionVisibilityBtn").addEventListener("click", () => {
    setPracticeQuestionsVisible(!state.practiceQuestionsVisible);
  });
  $("#practiceShortOnceBtn").addEventListener("click", () => {
    if (els.fullscreenPage.dataset.mode === "similar") {
      setSimilarPracticeRepeats(state.similarPracticeRepeats === 1 ? 2 : 1);
      return;
    }
    setPracticeShortDialogueRepeats(state.practiceShortDialogueRepeats === 1 ? 2 : 1);
  });
  $("#practiceInstructionBtn").addEventListener("click", () => {
    setPracticeChineseInstruction(!state.practiceChineseInstruction);
  });
  $("#audioSeek").addEventListener("input", (event) => {
    if (state.practiceModeActive && state.practicePhase !== "recording") return;
    if (!Number.isFinite(els.audio.duration)) return;
    const nextTime = Number(event.target.value) / 1000 * els.audio.duration;
    if (state.followReadActive) state.followReadPendingSeekTime = nextTime;
    else els.audio.currentTime = nextTime;
    updateSeekBubble(true);
  });
  $("#audioSeek").addEventListener("pointerdown", () => updateSeekBubble(true));
  $("#audioSeek").addEventListener("pointerup", () => {
    applyFollowReadSeek();
    hideSeekBubble();
  });
  $("#audioSeek").addEventListener("change", () => {
    applyFollowReadSeek();
    hideSeekBubble();
  });
  $("#audioSeek").addEventListener("blur", () => hideSeekBubble());
  window.addEventListener("resize", () => {
    if (!els.fullscreenPage.classList.contains("hidden")) clampClassroomDock();
    if (state.practiceModeActive) requestAnimationFrame(updatePracticeOptionLayouts);
    if (state.followReadActive) syncFollowReadWaveform();
    requestAnimationFrame(updateQuestionPickerScrollbar);
  });
  $$(".lecture-select").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      $$(".lecture-select").filter((item) => item !== details).forEach((item) => item.removeAttribute("open"));
    });
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#speedSelect")) closeSpeedMenu();
    if (!event.target.closest("#onlineSpeedSelect")) closeOnlineSpeedMenu();
    if (!event.target.closest(".work-more-menu")) closeWorkMoreMenus();
    if (!event.target.closest("#interfaceSettingsPanel") && !event.target.closest("#interfaceSettingsToggle")) {
      closeInterfaceSettings();
    }
    if (!event.target.closest("#onlineSettingsPanel") && !event.target.closest("#onlineSettingsToggle")) {
      closeOnlineSettings();
    }
    if (!event.target.closest(".lecture-select")) {
      $$(".lecture-select").forEach((details) => details.removeAttribute("open"));
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSpeedMenu();
      closeOnlineSpeedMenu();
      closeOnlineSettings();
      closeWorkMoreMenus();
    }
  });
  $$("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      state.theme = button.dataset.themeChoice;
      demoStorage.setItem("victor:theme", state.theme);
      applyTheme();
    });
  });
  $("#fontDown").addEventListener("click", () => setFullFont(state.fullFont - 2));
  $("#fontUp").addEventListener("click", () => setFullFont(state.fullFont + 2));
  els.audio.addEventListener("timeupdate", updatePlayingSegment);
  els.audio.addEventListener("loadedmetadata", updateAudioProgress);
  els.audio.addEventListener("ended", () => {
    if (state.practiceModeActive && state.practicePhase === "recording") {
      advancePracticeRecording();
      return;
    }
    if (state.followReadActive && state.followReadPhase === "playing") {
      beginFollowReadWait();
      return;
    }
    setPlayButton(false);
    state.playingSegmentIndex = null;
    state.playbackStopTime = null;
    state.playbackScope = null;
    markPlayingSegment();
    updateAudioProgress();
  });
  els.practiceInstructionAudio.addEventListener("ended", handlePracticeInstructionAudioEnded);
  els.practiceInstructionAudio.addEventListener("error", handlePracticeInstructionAudioEnded);
  bindDictationEvents();
  bindPaperEvents();
  bindQuestionBankEvents();
  bindWorkEvents();
  bindOnlineEvents();
  bindClassEvents();
}

function renderProfilePage() {
  $("#profileSummaryName").textContent = state.teacherName;
  $("#profileInfoName").textContent = state.teacherName;
  $("#profileInfoPhone").textContent = state.teacherPhone;
  $("#profileInfoSchool").textContent = state.teacherSchools.join("、");
  $("#profileSchoolSelect").value = state.teacherSchool;
  $("#sidebarProfileButton").title = `${state.teacherName} · 个人中心`;
  $("#sidebarProfileButton").setAttribute("aria-label", `打开${state.teacherName}的个人中心`);
  $("#sidebarProfileButton img").alt = `${state.teacherName}课堂机器人头像`;
}

function bindProfileEvents() {
  const passwordForm = $("#profilePasswordForm");
  const passwordError = $("#profilePasswordError");
  const clearPasswordError = () => { passwordError.textContent = ""; };

  const switchSchool = (event) => {
    state.teacherSchool = event.currentTarget.value;
    $("#profileSchoolSelect").value = state.teacherSchool;
    showAppNotice(`已切换至${state.teacherSchool}。`, "success");
  };
  $("#profileSchoolSelect").addEventListener("change", switchSchool);
  $("#profileLogout").addEventListener("click", () => {
    passwordForm.reset();
    clearPasswordError();
    hideAppNotice();
    showLoginPage();
  });
  [$("#profileCurrentPassword"), $("#profileNewPassword"), $("#profileConfirmPassword")].forEach((input) => input.addEventListener("input", clearPasswordError));

  passwordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const currentPassword = $("#profileCurrentPassword").value;
    const newPassword = $("#profileNewPassword").value;
    const confirmPassword = $("#profileConfirmPassword").value;
    if (currentPassword !== state.teacherPassword) {
      passwordError.textContent = "当前密码不正确。";
      $("#profileCurrentPassword").focus();
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 20) {
      passwordError.textContent = "新密码需为 6–20 位。";
      $("#profileNewPassword").focus();
      return;
    }
    if (newPassword === currentPassword) {
      passwordError.textContent = "新密码不能与当前密码相同。";
      $("#profileNewPassword").focus();
      return;
    }
    if (newPassword !== confirmPassword) {
      passwordError.textContent = "两次输入的新密码不一致。";
      $("#profileConfirmPassword").focus();
      return;
    }
    state.teacherPassword = newPassword;
    $("#loginPassword").value = newPassword;
    passwordForm.reset();
    clearPasswordError();
    showAppNotice("密码修改成功。", "success");
  });
}

function syncRoute(page) {
  if (page === "listening" && state.listeningWorkspaceMode !== "book-mistakes") window.SingleBookCatalog?.selectBook("legacy-book");
  if (state.page === "book-overview" && state.bookOverviewTab === "mistakes" && page !== "book-overview") {
    restoreListeningWorkspace();
    leaveBookMistakesWorkspace();
  }
  state.page = page;
  $("#app").classList.toggle("page-home", page === "home");
  $("#app").classList.toggle("page-profile", page === "profile");
  $("#app").classList.toggle("page-listening", listeningWorkspaceIsActive());
  $("#app").classList.toggle("page-question-bank", page === "question-bank");
  $("#app").classList.toggle("page-classes", page === "classes");
  $("#app").classList.toggle("page-book-overview", page === "book-overview");
  $("#app").classList.toggle("page-book-detail", page === "book-detail");
  $("#app").classList.toggle("page-work", page === "work");
  $("#app").classList.toggle("page-work-report", page === "work-report");
  $("#app").classList.toggle("page-dictation", page === "dictation" || page === "paper" || page === "dictation-publish");
  document.body.classList.toggle("page-dictation-active", page === "dictation" || page === "paper" || page === "dictation-publish");
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.page === page || ((page === "book-detail" || page === "book-overview") && item.dataset.page === "books") || (page === "work-report" && item.dataset.page === "work") || (page === "listening" && item.dataset.page === "home")));
  $("#sidebarProfileButton").classList.toggle("active", page === "profile");
  els.homePage.classList.toggle("hidden", page !== "home");
  els.profilePage.classList.toggle("hidden", page !== "profile");
  els.booksPage.classList.toggle("hidden", page !== "books");
  els.bookOverviewPage.classList.toggle("hidden", page !== "book-overview");
  els.bookDetailPage.classList.toggle("hidden", page !== "book-detail");
  els.questionBankPage.classList.toggle("hidden", page !== "question-bank");
  els.listeningPage.classList.toggle("hidden", page !== "listening");
  els.classPage.classList.toggle("hidden", page !== "classes");
  els.workPage.classList.toggle("hidden", page !== "work");
  els.workReportPage.classList.toggle("hidden", page !== "work-report");
  els.dictationPage.classList.toggle("hidden", page !== "dictation");
  els.dictationPublishPage.classList.toggle("hidden", page !== "dictation-publish");
  els.paperPage.classList.toggle("hidden", page !== "paper");
  els.dictationPage.classList.toggle("content-view-only", page === "dictation" && state.contentViewOnly);
  els.paperPage.classList.toggle("content-view-only", page === "paper" && state.contentViewOnly);
  $("#dictationName").readOnly = state.contentViewOnly;
  $("#paperName").readOnly = state.contentViewOnly;
  const contentReturnLabel = state.editorReturnPage === "question-bank" ? "返回我的试卷" : "返回作业";
  $("#exitDictationEditor b").textContent = state.contentViewOnly ? contentReturnLabel : "返回";
  $("#exitPaperEditor b").textContent = state.contentViewOnly ? contentReturnLabel : "返回";
  syncListeningWorkspaceChrome();
  if (page === "home") {
    setPageTitle("老师，您好");
  } else if (page === "profile") {
    setPageTitle("个人中心", "user");
    renderProfilePage();
  } else if (page === "books") {
    setPageTitle("校本书籍", "library");
    renderSchoolBookSummary();
  } else if (page === "book-overview") {
    setPageTitle("书籍详情", "library");
    renderBookOverview();
  } else if (page === "book-detail") {
    setPageTitle("书籍目录", "book");
    renderBookDetail();
  } else if (page === "question-bank") {
    setPageTitle("题库组卷", "database");
    renderQuestionBank();
  } else if (page === "listening") {
    setPageTitle("听力错题精讲", "headphones");
  } else if (page === "work") {
    setPageTitle("学生端作业", "paper");
    renderWorkList();
  } else if (page === "work-report") {
    setPageTitle("作业报告", "chart");
    renderWorkReport();
  } else if (page === "classes") {
    setPageTitle("班级", "users");
    renderClassPage();
  } else if (page === "dictation") {
    setPageTitle(state.contentViewOnly ? "查看精听挖空" : state.editingTaskId ? "修改精听挖空" : "精听挖空");
  } else if (page === "dictation-publish") {
    setPageTitle("学生端作答设置");
    renderDictationPublishSetup();
  } else if (page === "paper") {
    setPageTitle(state.contentViewOnly ? "查看听力组卷" : "听力组卷预览");
  } else {
    setPageTitle("页面");
  }
  applyGlobalAssistState();
}

function leaveContentEditor(kind) {
  const dirty = kind === "dictation" ? state.dictationDirty : state.paperDirty;
  const leave = () => syncRoute(state.editorReturnPage || "listening");
  if (!dirty) {
    leave();
    return;
  }
  openAppDialog({
    title: "放弃未保存修改？",
    message: "返回后，本次尚未保存的编辑内容将不会保留。",
    confirmText: "放弃并返回",
    danger: true,
    onConfirm: leave,
  });
}

function openColumnFilter(event, column) {
  event.stopPropagation();
  const trigger = event.currentTarget;
  const unitSelected = state.columnFilters.unit;
  const unitLimited = state.listeningWorkspaceMode === "book-mistakes" && column === "setName" && unitSelected.size > 0;
  const scope = unitLimited
    ? listeningScopeQuestions().filter((q) => unitSelected.has(String(columnFilterValue(q, "unit"))))
    : listeningScopeQuestions();
  const values = [...new Set(scope.map((q) => String(columnFilterValue(q, column))))]
    .sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }));
  const setFilterDisabled = state.listeningWorkspaceMode === "book-mistakes" && column === "setName" && unitSelected.size === 0;
  const selected = state.columnFilters[column];
  const allSelected = selected.size === 0;
  els.columnFilterMenu.dataset.column = column;
  els.columnFilterMenu.innerHTML = setFilterDisabled ? `
    <div class="column-filter-empty">请先筛选一个或多个单元</div>
    <div class="column-filter-actions"><button data-filter-clear>清除筛选</button><button data-filter-close>确定</button></div>` : `
    <label class="filter-check-row filter-check-all"><input type="checkbox" data-filter-all ${allSelected ? "checked" : ""} /><span>全选</span></label>
    <div class="column-filter-options">
      ${values.map((value) => `<label class="filter-check-row" data-filter-option-row><input type="checkbox" value="${value}" ${allSelected || selected.has(value) ? "checked" : ""} /><span>${value}</span></label>`).join("")}
    </div>
    <div class="column-filter-actions"><button data-filter-clear>清除筛选</button><button data-filter-apply>确定</button></div>`;
  els.columnFilterMenu.classList.remove("hidden");
  const rect = trigger.getBoundingClientRect();
  const menuWidth = 252;
  els.columnFilterMenu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - menuWidth - 12))}px`;
  els.columnFilterMenu.style.top = `${rect.bottom + 6}px`;
  hydrateIcons();

  if (setFilterDisabled) {
    els.columnFilterMenu.querySelector("[data-filter-clear]").addEventListener("click", () => {
      state.columnFilters.setName = new Set();
      state.currentPage = 1;
      els.columnFilterMenu.classList.add("hidden");
      renderTable();
    });
    els.columnFilterMenu.querySelector("[data-filter-close]").addEventListener("click", () => els.columnFilterMenu.classList.add("hidden"));
    return;
  }

  const optionInputs = () => Array.from(els.columnFilterMenu.querySelectorAll("[data-filter-option-row] input"));
  const allInput = els.columnFilterMenu.querySelector("[data-filter-all]");
  allInput.indeterminate = !allSelected && !selected.has(EMPTY_FILTER_VALUE);
  allInput.addEventListener("change", () => optionInputs().forEach((input) => { input.checked = allInput.checked; }));
  optionInputs().forEach((input) => input.addEventListener("change", () => {
    allInput.checked = optionInputs().every((item) => item.checked);
    allInput.indeterminate = !allInput.checked && optionInputs().some((item) => item.checked);
  }));
  els.columnFilterMenu.querySelector("[data-filter-clear]").addEventListener("click", () => {
    state.columnFilters[column] = new Set();
    if (column === "unit") state.columnFilters.setName = new Set();
    state.currentPage = 1;
    els.columnFilterMenu.classList.add("hidden");
    renderTable();
  });
  els.columnFilterMenu.querySelector("[data-filter-apply]").addEventListener("click", () => {
    const checked = optionInputs().filter((input) => input.checked).map((input) => input.value);
    state.columnFilters[column] = checked.length === values.length
      ? new Set()
      : new Set(checked.length ? checked : [EMPTY_FILTER_VALUE]);
    if (column === "unit") {
      const nextUnits = state.columnFilters.unit;
      if (nextUnits.size === 0) {
        state.columnFilters.setName = new Set();
      } else if (state.columnFilters.setName.size > 0) {
        const allowedSets = new Set(listeningScopeQuestions()
          .filter((question) => nextUnits.has(String(columnFilterValue(question, "unit"))))
          .map((question) => String(columnFilterValue(question, "setName"))));
        state.columnFilters.setName = new Set([...state.columnFilters.setName].filter((value) => allowedSets.has(value)));
      }
    }
    state.currentPage = 1;
    els.columnFilterMenu.classList.add("hidden");
    renderTable();
  });
}

function setupDateRange() {
  const daysInput = $("#customTimeDays");
  if (daysInput) {
    daysInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") applyDateRange();
    });
  }
  const startInput = $("#dateStart");
  const endInput = $("#dateEnd");
  const today = toInputDate(new Date());
  if (startInput && endInput) {
    startInput.max = today;
    endInput.max = today;
    startInput.addEventListener("change", () => {
      if (endInput.value && startInput.value && endInput.value < startInput.value) endInput.value = "";
      endInput.min = startInput.value || "";
    });
  }
  $$(".bottom-select").forEach((details) => details.addEventListener("toggle", () => {
    if (details.open) $$(".bottom-select").filter((item) => item !== details).forEach((item) => { item.open = false; });
  }));
}

function updateTimeCustomMode() {
  const isRange = state.listeningWorkspaceMode === "book-mistakes";
  $("#customTimeToggle").textContent = isRange ? "自定义日期" : "自定义近 X 天";
  els.dateRangePanel.querySelectorAll("[data-time-custom='days']").forEach((item) => item.classList.toggle("hidden", isRange));
  els.dateRangePanel.querySelectorAll("[data-time-custom='range']").forEach((item) => item.classList.toggle("hidden", !isRange));
}

function toInputDate(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function applyDateRange() {
  if (state.listeningWorkspaceMode === "book-mistakes") {
    const startValue = $("#dateStart").value;
    const endValue = $("#dateEnd").value;
    if (!startValue || !endValue || endValue < startValue) {
      showAppNotice("请选择有效的开始日期和结束日期。", "warning");
      return;
    }
    state.filterTime = `${startValue.slice(5).replace("-", "/")} - ${endValue.slice(5).replace("-", "/")}`;
    els.timeValue.textContent = state.filterTime;
    $$("[data-time-value]").forEach((item) => item.classList.remove("selected"));
    els.dateRangePanel.classList.add("hidden");
    $("#timeSelect").open = false;
    state.currentPage = 1;
    renderTable();
    return;
  }
  const days = Math.floor(Number($("#customTimeDays")?.value || 0));
  if (!Number.isFinite(days) || days < 1) {
    showAppNotice("请输入大于 0 的天数。", "warning");
    return;
  }
  state.filterTime = `近${days}天`;
  els.timeValue.textContent = state.filterTime;
  $$("[data-time-value]").forEach((item) => item.classList.remove("selected"));
  els.dateRangePanel.classList.add("hidden");
  $("#timeSelect").open = false;
  state.currentPage = 1;
  renderTable();
}

function filteredQuestions() {
  return listeningScopeQuestions()
    .filter((q) => classCorrectRate(q) < state.rateThreshold)
    .filter((q) => !state.filterComposedQuestions || !state.selectedIds.has(q.id))
    .filter((q) => Object.entries(state.columnFilters).every(([key, values]) => values.size === 0 || values.has(String(columnFilterValue(q, key)))))
    .sort((a, b) => classCorrectRate(a) - classCorrectRate(b) || a.setId - b.setId || a.questionNo - b.questionNo);
}

function columnFilterValue(question, column) {
  if (column === "unit") return catalogSetRecord(question.setId)?.group.code || String(question.setName || "").split(/\s+/)[0] || "";
  if (column === "setName") {
    const catalogSet = catalogSetRecord(question.setId);
    const unitName = catalogSet?.group.code || String(question.setName || "").split(/\s+/)[0] || "";
    const setName = catalogSet ? shortCatalogSetName(catalogSet) : (String(question.setName || "").replace(new RegExp(`^${unitName}\\s*`), "") || question.setName);
    return state.listeningWorkspaceMode === "book-mistakes" ? `${unitName}·${setName}` : question.setName;
  }
  return question[column];
}

function renderTable() {
  const rows = filteredQuestions();
  updateTimeCustomMode();
  const showBookColumn = new Set(listeningScopeQuestions().map((q) => q.bookName)).size > 1;
  $(".table-panel").classList.toggle("hide-book-column", !showBookColumn);
  const maxPage = Math.max(1, Math.ceil(rows.length / state.pageSize));
  state.currentPage = Math.min(Math.max(1, Math.trunc(Number(state.currentPage) || 1)), maxPage);
  const start = (state.currentPage - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);
  els.questionRows.innerHTML = pageRows.length
    ? pageRows.map(renderTableRow).join("")
    : '<tr><td class="table-empty" colspan="9">暂无符合当前筛选条件的错题</td></tr>';
  els.questionRows.querySelectorAll("[data-explain]").forEach((button) => {
    button.addEventListener("click", () => openFull(rows.map((q) => q.id), button.dataset.explain));
  });
  els.questionRows.querySelectorAll("[data-basket-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.basketToggle;
      if (state.selectedIds.has(id)) state.selectedIds.delete(id);
      else state.selectedIds.add(id);
      saveBasket();
      renderTable();
      renderBasket();
    });
  });
  const allFilteredSelected = rows.length > 0 && rows.every((q) => state.selectedIds.has(q.id));
  els.addAllFilteredToBasket.disabled = rows.length === 0 || allFilteredSelected;
  els.pageInfo.textContent = `第 ${state.currentPage}/${maxPage} 页，共 ${rows.length} 题`;
  $("#filterSummary").textContent = `当前筛选：${renderFilterSummary(showBookColumn)}`;
  $("#prevPage").disabled = state.currentPage <= 1;
  $("#nextPage").disabled = state.currentPage >= maxPage;
  $$("[data-filter-column]").forEach((button) => button.classList.toggle("filtered", state.columnFilters[button.dataset.filterColumn].size > 0));
  const hasFilters = state.rateThreshold !== DEFAULT_RATE_THRESHOLD
    || state.filterTime !== "近7天"
    || state.filterComposedQuestions
    || Object.values(state.columnFilters).some((values) => values.size > 0);
  $("#clearFilters").classList.toggle("hidden", !hasFilters);
  $("#filterComposedQuestions").checked = state.filterComposedQuestions;
  hydrateIcons();
  updateBottomBar();
}

function renderTableRow(q) {
  const rate = classCorrectRate(q);
  const catalogSet = catalogSetRecord(q.setId);
  const unitName = catalogSet?.group.code || String(q.setName || "").split(/\s+/)[0] || "--";
  const setName = catalogSet ? shortCatalogSetName(catalogSet) : (String(q.setName || "").replace(new RegExp(`^${unitName}\\s*`), "") || q.setName);
  return `
    <tr data-listening-question-row="${q.id}">
      <td class="book-column"><div class="book-cell" title="${q.bookName}">${q.bookName}</div></td>
      <td class="listening-unit-cell"><strong>${escapeHtml(unitName)}</strong></td>
      <td class="listening-set-cell">${escapeHtml(setName)}</td>
      <td>${q.questionNo}</td>
      <td>${q.questionType}</td>
      <td>${renderCorrectRate(rate)}</td>
      <td>${formatQuestionAnswerTime(q)}</td>
      <td><span class="wrong-count-cell">${q.realOnly && !classResultForQuestion(q).total ? "-- / --" : `${wrongCountForQuestion(q)} / ${classResultForQuestion(q).total}`}</span></td>
      <td><div class="row-actions"><button class="link-button" data-explain="${q.id}"><span data-icon="expand"></span>全屏讲解</button><button class="link-button ${state.selectedIds.has(q.id) ? "selected" : ""}" data-basket-toggle="${q.id}"><span data-icon="cart"></span>${state.selectedIds.has(q.id) ? "移出试题篮" : "加入试题篮"}</button></div></td>
    </tr>`;
}

function formatQuestionAnswerTime(q) {
  const setOffset = Number(q.setId || 0) % 5;
  const date = new Date(2026, 7, 2 + setOffset);
  return toInputDate(date);
}

function renderCorrectRate(rate) {
  return `<div class="rate-cell rate-number-only ${rateClass(rate)}"><strong>${rate}%</strong></div>`;
}

function wrongCountForQuestion(q) {
  const result = classResultForQuestion(q);
  if (!result.total) return 0;
  return result.total - result.correctCount;
}

function renderFilterSummary(showBookColumn) {
  const columnLabels = {
    bookName: "书籍",
    unit: "单元",
    setName: "套题",
    questionType: "题型",
  };
  const parts = [
    state.filterClass,
    state.filterTime,
    `正答率低于 ${state.rateThreshold}%`,
  ];
  Object.entries(columnLabels).forEach(([key, label]) => {
    if (!showBookColumn && key === "bookName") return;
    const values = [...state.columnFilters[key]];
    parts.push(values.length ? `${label}：${values.join("、")}` : `全部${label}`);
  });
  return parts.join(" · ");
}

function normalizePercentages(items) {
  const values = items.map((item) => Math.max(0, Number(item.percent) || 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return items.map((item) => ({ ...item, percent: 0 }));
  const scaled = values.map((value) => value * 100 / total);
  const rounded = scaled.map(Math.floor);
  let remainder = 100 - rounded.reduce((sum, value) => sum + value, 0);
  scaled
    .map((value, index) => ({ index, fraction: value - rounded[index] }))
    .sort((a, b) => b.fraction - a.fraction)
    .forEach(({ index }) => {
      if (remainder > 0) {
        rounded[index] += 1;
        remainder -= 1;
      }
    });
  return items.map((item, index) => ({ ...item, percent: rounded[index] }));
}

function allocateCounts(items, totalPeople, answerKey, wrongCount) {
  const correctIndex = items.findIndex((item) => item.key === answerKey);
  const hasAuthoritativeCounts = correctIndex >= 0 && Number.isFinite(wrongCount) && wrongCount >= 0 && wrongCount <= totalPeople;
  const targetCounts = items.map((_, index) => index === correctIndex && hasAuthoritativeCounts ? totalPeople - wrongCount : 0);
  const targetTotal = hasAuthoritativeCounts ? wrongCount : totalPeople;
  const candidateIndexes = items.map((_, index) => index).filter((index) => !hasAuthoritativeCounts || index !== correctIndex);
  const weightTotal = candidateIndexes.reduce((sum, index) => sum + items[index].percent, 0);
  if (!weightTotal) return targetCounts;
  const raw = candidateIndexes.map((index) => targetTotal * items[index].percent / weightTotal);
  raw.forEach((value, position) => { targetCounts[candidateIndexes[position]] = Math.floor(value); });
  let remainder = targetTotal - raw.reduce((sum, value) => sum + Math.floor(value), 0);
  raw
    .map((value, position) => ({ index: candidateIndexes[position], fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)
    .forEach(({ index }) => {
      if (remainder > 0) {
        targetCounts[index] += 1;
        remainder -= 1;
      }
    });
  return targetCounts;
}

function rateClass(rate) {
  if (rate < 70) return "rate-red";
  if (rate < 100) return "rate-yellow";
  return "rate-green";
}

function classResultForQuestion(q, className = state.filterClass) {
  const stored = q.classResults?.[className] || q.classResults?.[DEFAULT_CLASS];
  if (stored && Number(stored.total) > 0) {
    const total = Math.max(0, Number(stored.total) || 0);
    const correctCount = Math.max(0, Math.min(total, Number(stored.correctCount) || 0));
    return { total, correctCount };
  }
  const sourceTotal = Math.max(0, Number(q.classTotal) || 0);
  if (!sourceTotal && (q.realOnly || q.bookKey === "test-single-book")) return { total: 0, correctCount: 0 };
  if (!sourceTotal) return prototypeClassResultForQuestion(q, className);
  const total = sourceTotal;
  const correctCount = Number.isFinite(Number(q.classCorrectCount)) ? Number(q.classCorrectCount) : Math.round(total * (Number(q.correctRate) || 0) / 100);
  return { total, correctCount: Math.max(0, Math.min(total, correctCount)) };
}

function prototypeClassResultForQuestion(q, className = state.filterClass) {
  const total = CLASS_STUDENTS[className]?.length || TEACHER_CLASSES.find((item) => item.id === className)?.studentCount || 40;
  const patterns = {
    14255: [25, 28, 33, 38, 42, 20, 23, 25, 27, 29, 31, 32, 34, 35, 37, 39, 20, 24, 28, 36],
    14256: [27, 30, 34, 39, 42, 19, 22, 24, 26, 28, 30, 31, 33, 34, 36, 36, 22, 26, 29, 35],
  };
  const pattern = patterns[Number(q.setId)] || patterns[14255];
  const baseCorrect = pattern[Math.max(0, Math.min(19, Number(q.questionNo || 1) - 1))];
  const classAdjustment = { "1班": 0, "2班": -0.035, "3班": 0.025 }[className] || 0;
  const rate = Math.max(0.35, Math.min(0.98, baseCorrect / 42 + classAdjustment));
  return { total, correctCount: Math.max(0, Math.min(total, Math.round(total * rate))) };
}

function classCorrectRateExact(q, className = state.filterClass) {
  const result = classResultForQuestion(q, className);
  return result.total ? result.correctCount / result.total * 100 : 0;
}

function classCorrectRate(q, className = state.filterClass) {
  return Math.round(classCorrectRateExact(q, className));
}

function bookSets() {
  const grouped = new Map();
  state.questions.filter((question) => state.activeBookKey === "test-single-book"
    ? question.bookKey === "test-single-book" : question.bookKey !== "test-single-book").forEach((question) => {
    if (!grouped.has(question.setId)) grouped.set(question.setId, { setId: question.setId, setName: question.setName, questions: [] });
    grouped.get(question.setId).questions.push(question);
  });
  return [...grouped.values()]
    .map((item) => ({ ...item, questions: item.questions.sort((a, b) => a.questionNo - b.questionNo) }))
    .sort((a, b) => a.setId - b.setId);
}

function bookSetIsGraded(setId, className = state.bookClassName) {
  return BOOK_CLASS_GRADING[className]?.has(Number(setId)) || false;
}

function bookQuestionResult(question, className = state.bookClassName, forceClass = false) {
  if (forceClass || bookSetIsGraded(question.setId, className)) {
    const result = classResultForQuestion(question, className);
    return { ...result, rate: result.total ? result.correctCount / result.total * 100 : 0, source: "class" };
  }
  const total = Math.max(0, Number(question.nationalAttemptCount) || 0);
  const correctCount = Math.max(0, Math.min(total, Number(question.nationalCorrectCount) || 0));
  const sourceRate = Number(question.nationalRate);
  const rate = Number.isFinite(sourceRate) ? sourceRate : (total ? correctCount / total * 100 : 0);
  return { total, correctCount, rate, source: "national" };
}

function bookSetMetrics(set, className = state.bookClassName, forceClass = false) {
  const questions = Array.isArray(set?.questions) ? set.questions : [];
  const results = questions.map((question) => bookQuestionResult(question, className, forceClass));
  const correctCount = results.reduce((sum, result) => sum + result.correctCount, 0);
  const total = results.reduce((sum, result) => sum + result.total, 0);
  const lowCount = results.filter((result) => result.rate < 70).length;
  return {
    graded: forceClass || bookSetIsGraded(set.setId, className),
    correctCount,
    total,
    rate: total ? correctCount / total * 100 : 0,
    lowCount,
  };
}

function formatBookRate(value) {
  if (value === null || value === undefined || value === "" || !Number.isFinite(Number(value))) return "--";
  return `${Math.round(Number(value))}%`;
}

function bookRateClass(value) {
  if (Number(value) >= 100) return "is-perfect";
  if (Number(value) >= 70) return "is-mid";
  return "is-low";
}

function teacherClassLabel(className = DEFAULT_CLASS) {
  return TEACHER_CLASSES.find((item) => item.id === className)?.name || `高一${className}`;
}

function renderSchoolBookSummary() {
  if (!state.questions.length || !$("#schoolBookClassSummary")) return;
  const catalogTotal = BOOK_CATALOG_GROUPS.reduce((sum, group) => sum + group.sets.length, 0);
  $("#schoolBookClassSummary").innerHTML = ["1班", "2班", "3班"].map((className) => {
    const gradedSets = allBookCatalogSets()
      .filter((set) => bookSetIsGraded(set.setId, className))
      .map((set) => bookCatalogDisplaySet(set))
      .filter(Boolean);
    const correct = gradedSets.reduce((sum, set) => sum + bookSetMetrics(set, className).correctCount, 0);
    const total = gradedSets.reduce((sum, set) => sum + bookSetMetrics(set, className).total, 0);
    const rate = total ? formatBookRate(correct / total * 100) : "--";
    const width = catalogTotal ? gradedSets.length / catalogTotal * 100 : 0;
    const classLabel = teacherClassLabel(className);
    return `<button type="button" class="school-book-class-row" data-book-class-detail="${className}" aria-label="查看${classLabel}的本书详情">
      <div class="school-book-class-header"><strong>${classLabel}</strong><span>正答率 <em>${rate}</em></span></div>
      <div class="school-book-progress-row"><b>已作答 ${gradedSets.length} / ${catalogTotal} 套</b><div class="school-book-progress"><i style="width:${width}%"></i></div></div>
    </button>`;
  }).join("");
  $("#schoolBookClassSummary").querySelectorAll("[data-book-class-detail]").forEach((button) => {
    button.addEventListener("click", () => {
      window.SingleBookCatalog?.selectBook("legacy-book");
      openBookOverviewForClass(button.dataset.bookClassDetail, "catalog");
    });
  });
  hydrateIcons();
}

function openBookOverviewForClass(className = DEFAULT_CLASS, tab = "whole") {
  state.bookClassName = TEACHER_CLASSES.some((item) => item.id === className) ? className : DEFAULT_CLASS;
  state.bookOverviewTab = ["catalog", "whole", "knowledge", "mistakes", "students"].includes(tab) ? tab : "whole";
  state.bookOverviewUnit = "all";
  state.bookOverviewSelectedSetId = "all";
  state.bookOverviewSetDetailId = null;
  state.bookOverviewSetDetailStudentId = null;
  syncRoute("book-overview");
}

function openBookDetailForClass(className = DEFAULT_CLASS, mode = "catalog", setId = 14255) {
  state.bookClassName = TEACHER_CLASSES.some((item) => item.id === className) ? className : DEFAULT_CLASS;
  if (mode === "catalog" || mode === "sets") {
    openBookOverviewForClass(state.bookClassName, "catalog");
    return;
  }
  if (["whole", "knowledge", "mistakes", "students", "data"].includes(mode)) {
    openBookOverviewForClass(state.bookClassName, mode === "data" ? "whole" : mode);
    return;
  }
  const catalogSet = catalogSetRecord(setId) || catalogSetRecord(14255);
  state.bookActiveSetId = Number(catalogSet?.setId || 14255);
  state.bookCatalogGroupCode = catalogSet?.group?.code || "WELCOME";
  state.bookDetailView = "workspace";
  state.bookWorkspaceTab = "questions";
  syncRoute("book-detail");
}

function openBookWorkbenchTab(tab) {
  if (tab === "compose") {
    openBookDetailForClass(state.bookClassName, "questions", state.bookActiveSetId || 14255);
    return;
  }
  if (!["catalog", "whole", "knowledge", "mistakes", "students"].includes(tab)) return;
  state.bookOverviewTab = tab;
  if (tab !== "catalog") {
    state.bookOverviewSetDetailId = null;
    state.bookOverviewSetDetailStudentId = null;
  }
  syncRoute("book-overview");
}

function allBookCatalogSets() {
  return BOOK_CATALOG_GROUPS.flatMap((group) => group.sets.map((set) => ({ ...set, group })));
}

function bookSetById(setId) {
  return bookSets().find((set) => set.setId === Number(setId)) || null;
}

function bookCatalogSourceSet(catalogSetOrId) {
  const catalogSet = typeof catalogSetOrId === "object" ? catalogSetOrId : catalogSetRecord(catalogSetOrId);
  const sourceId = Number(catalogSet?.sourceSetId || catalogSet?.setId || 14255);
  return bookSetById(sourceId) || bookSets()[0] || null;
}

function bookCatalogDisplaySet(catalogSetOrId) {
  const catalogSet = typeof catalogSetOrId === "object" ? catalogSetOrId : catalogSetRecord(catalogSetOrId);
  const sourceSet = bookCatalogSourceSet(catalogSet);
  if (!catalogSet || !sourceSet) return null;
  return {
    ...sourceSet,
    setName: catalogSet.name,
    questions: sourceSet.questions.map((question) => ({
      ...question,
      setName: catalogSet.name,
      catalogSetId: Number(catalogSet.setId),
      displaySetName: catalogSet.name,
      sourceSetId: sourceSet.setId,
    })),
    catalogSetId: Number(catalogSet.setId),
    displaySetName: catalogSet.name,
    sourceSetId: sourceSet.setId,
    isPreview: Number(sourceSet.setId) !== Number(catalogSet.setId),
  };
}

function activeBookCatalogDisplaySet() {
  return bookCatalogDisplaySet(state.bookActiveSetId);
}

function bookCatalogTotal(unit = "all") {
  return allBookCatalogSets().filter((set) => unit === "all" || set.group.code === unit).length;
}

function gradedBookSetsForClass(className = state.bookClassName, unit = "all") {
  return bookSets().filter((set) => bookSetIsGraded(set.setId, className) && (unit === "all" || catalogSetRecord(set.setId)?.group.code === unit));
}

function bookClassBookMetrics(className = state.bookClassName, unit = "all") {
  const gradedSets = gradedBookSetsForClass(className, unit);
  const rowsBySet = gradedSets.map((set) => ({ set, rows: bookStudentRows(set, className, true), metrics: bookSetMetrics(set, className, true) }));
  const totalCorrect = rowsBySet.reduce((sum, item) => sum + item.metrics.correctCount, 0);
  const totalAnswers = rowsBySet.reduce((sum, item) => sum + item.metrics.total, 0);
  const setScores = rowsBySet.map((item) => {
    const scores = item.rows.map((row) => row.score).filter(Number.isFinite);
    return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
  }).filter(Number.isFinite);
  const averageScore = setScores.length ? setScores.reduce((sum, score) => sum + score, 0) / setScores.length : null;
  const averageRate = totalAnswers ? totalCorrect / totalAnswers * 100 : null;
  return {
    gradedSets,
    rowsBySet,
    totalSets: bookCatalogTotal(unit),
    gradedCount: gradedSets.length,
    averageScore,
    averageRate,
  };
}

function bookStudentAverageRows(className = state.bookClassName) {
  const students = CLASS_STUDENTS[className] || [];
  const gradedSets = gradedBookSetsForClass(className);
  return students.map((student, index) => {
    const setRows = gradedSets.map((set) => bookStudentRows(set, className, true)[index]).filter(Boolean);
    const scores = setRows.map((row) => row.score).filter(Number.isFinite);
    const correct = setRows.reduce((sum, row) => sum + (Number(row.correctCount) || 0), 0);
    const questionTotal = gradedSets.reduce((sum, set) => sum + set.questions.length, 0);
    return {
      ...student,
      index,
      averageScore: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null,
      correctCount: correct,
      questionTotal,
      wrongCount: Math.max(0, questionTotal - correct),
      rate: questionTotal ? correct / questionTotal * 100 : null,
      gradedSetCount: gradedSets.length,
    };
  });
}

function bookAverageScoreDistribution(className = state.bookClassName, unit = "all") {
  if (unit === "all") return bookScoreDistribution(bookStudentAverageRows(className).map((row) => ({ score: row.averageScore })))
    .map((item) => ({ ...item, label: `${item.label}分` }));
  const sets = gradedBookSetsForClass(className, unit);
  const students = CLASS_STUDENTS[className] || [];
  const scores = students.map((student, index) => {
    const values = sets.map((set) => bookStudentRows(set, className, true)[index]?.score).filter(Number.isFinite);
    return { score: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null };
  });
  return bookScoreDistribution(scores).map((item) => ({ ...item, label: `${item.label}分` }));
}

const BOOK_EXAM_POINT_LABELS = {
  1: "无固定分类",
  2: "数字与计算",
  3: "地点与去向",
  4: "人物与事件",
  5: "请求与建议",
  6: "方式与方法",
  7: "原因与目的",
  8: "谈话背景/谈话者关系、身份",
  9: "谈话者观点/态度",
  10: "主旨与要义",
  11: "其他",
};

function bookOverviewExamPointLabel(question) {
  return BOOK_EXAM_POINT_LABELS[Number(question.examPointId)] || question.examPoint || `考点 ${question.examPointId || "--"}`;
}

function aggregateBookQuestionRates(className = state.bookClassName, keyGetter = (question) => question.questionType || "听力理解", unit = "all") {
  const grouped = new Map();
  gradedBookSetsForClass(className, unit).forEach((set) => {
    set.questions.forEach((question) => {
      const label = keyGetter(question);
      if (!grouped.has(label)) grouped.set(label, { label, correct: 0, total: 0, count: 0 });
      const bucket = grouped.get(label);
      const result = bookQuestionResult(question, className, true);
      bucket.correct += result.correctCount;
      bucket.total += result.total;
      bucket.count += 1;
    });
  });
  return [...grouped.values()]
    .map((item) => ({ ...item, rate: item.total ? item.correct / item.total * 100 : null }))
    .sort((a, b) => (Number(b.rate) || 0) - (Number(a.rate) || 0));
}

function bookSetAverageScore(set, className = state.bookClassName) {
  if (!set || !bookSetIsGraded(set.setId, className)) return null;
  const rows = bookStudentRows(set, className, true);
  const scores = rows.map((row) => row.score).filter(Number.isFinite);
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
}

function bookSetNationalAverageScore(set) {
  if (!set?.questions?.length) return null;
  const totals = set.questions.reduce((result, question) => {
    const attempts = Math.max(0, Number(question.nationalAttemptCount) || 0);
    const correct = Math.max(0, Math.min(attempts, Number(question.nationalCorrectCount) || 0));
    result.attempts += attempts;
    result.correct += correct;
    return result;
  }, { attempts: 0, correct: 0 });
  if (totals.attempts) return totals.correct / totals.attempts * 30;
  const rates = set.questions
    .filter((question) => question.nationalRate !== null && question.nationalRate !== undefined)
    .map((question) => Number(question.nationalRate))
    .filter(Number.isFinite);
  return rates.length ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length * .3 : null;
}

function captureListeningWorkspaceSnapshot() {
  return {
    filterClass: state.filterClass,
    filterTime: state.filterTime,
    rateThreshold: state.rateThreshold,
    sortDirection: state.sortDirection,
    currentPage: state.currentPage,
    columnFilters: Object.fromEntries(Object.entries(state.columnFilters).map(([key, values]) => [key, [...values]])),
  };
}

function applyListeningWorkspaceSnapshot(snapshot, className = snapshot?.filterClass) {
  const safeClass = TEACHER_CLASSES.some((item) => item.id === className) ? className : DEFAULT_CLASS;
  state.filterClass = safeClass;
  state.filterTime = snapshot?.filterTime || "近7天";
  state.rateThreshold = Number.isFinite(Number(snapshot?.rateThreshold)) ? Number(snapshot.rateThreshold) : DEFAULT_RATE_THRESHOLD;
  state.sortDirection = snapshot?.sortDirection === "desc" ? "desc" : "asc";
  state.currentPage = Math.max(1, Number(snapshot?.currentPage) || 1);
  Object.keys(state.columnFilters).forEach((key) => {
    state.columnFilters[key] = new Set(snapshot?.columnFilters?.[key] || []);
  });
  state.selectedIds = new Set(loadBasketForClass(safeClass));
  syncListeningFilterControls();
}

function syncListeningFilterControls() {
  els.classValue.textContent = state.filterClass;
  els.timeValue.textContent = state.filterTime;
  els.rateThreshold.textContent = `${state.rateThreshold}%`;
  $$('[data-class-value]').forEach((button) => button.classList.toggle("selected", button.dataset.classValue === state.filterClass));
  $$('[data-time-value]').forEach((button) => button.classList.toggle("selected", button.dataset.timeValue === state.filterTime));
}

function enterBookMistakesWorkspace(className = state.bookClassName) {
  if (state.listeningWorkspaceMode !== "book-mistakes") {
    state.listeningWorkspaceSnapshot = captureListeningWorkspaceSnapshot();
    applyListeningWorkspaceSnapshot(state.bookMistakesSnapshot, className);
    state.listeningWorkspaceMode = "book-mistakes";
  } else if (state.filterClass !== className) {
    saveBasket();
    state.filterClass = className;
    state.selectedIds = new Set(loadBasketForClass(className));
    state.currentPage = 1;
    syncListeningFilterControls();
  }
  state.bookClassName = className;
}

function leaveBookMistakesWorkspace() {
  if (state.listeningWorkspaceMode !== "book-mistakes") return;
  state.bookMistakesSnapshot = captureListeningWorkspaceSnapshot();
  state.listeningWorkspaceMode = "listening";
  applyListeningWorkspaceSnapshot(state.listeningWorkspaceSnapshot);
  demoStorage.setItem("victor:rateThreshold", String(state.rateThreshold));
  demoStorage.setItem("victor:tableSort", state.sortDirection);
}

function restoreListeningWorkspace() {
  if (!els.listeningWorkspaceAnchor || !els.listeningTablePanel || !els.basket) return;
  els.listeningWorkspaceAnchor.after(els.listeningTablePanel, els.basket);
}

function mountBookMistakesWorkspace(hostSelector = "#bookOverviewListeningHost") {
  const host = $(hostSelector);
  if (!host || !els.listeningTablePanel || !els.basket) return;
  host.append(els.listeningTablePanel, els.basket);
}

function isBookMistakesWorkspace() {
  return (state.page === "book-overview" && state.bookOverviewTab === "mistakes")
    || (state.page === "work-report" && state.workReportTab === "mistakes");
}

function listeningWorkspaceIsActive() {
  return state.page === "listening" || isBookMistakesWorkspace();
}

function syncListeningWorkspaceChrome() {
  const active = listeningWorkspaceIsActive();
  $("#app").classList.toggle("page-listening", active);
  els.bottomBar.classList.toggle("hidden", !active);
  els.basket.classList.toggle("hidden", !active);
}

function listeningScopeQuestions() {
  if (state.listeningWorkspaceMode !== "book-mistakes") return state.questions.filter(question => question.bookKey !== "test-single-book");
  const connectedSetIds = new Set(bookSets().map((set) => Number(set.setId)));
  return state.questions.filter((question) => {
    if (!connectedSetIds.has(Number(question.setId))) return false;
    if (state.bookOverviewMistakeUnit !== "all" && catalogSetRecord(question.setId)?.group.code !== state.bookOverviewMistakeUnit) return false;
    return state.bookOverviewMistakeSetId === "all" || Number(question.setId) === Number(state.bookOverviewMistakeSetId);
  });
}

function renderBookOverview() {
  if (!$("#bookOverviewContent")) return;
  restoreListeningWorkspace();
  disposeBookOverviewCharts();
  disposeBookDataCharts();
  const classInfo = TEACHER_CLASSES.find((item) => item.id === state.bookClassName) || TEACHER_CLASSES[0];
  state.bookClassName = classInfo.id;
  $("#bookOverviewClassSelect").value = classInfo.id;
  const renderers = {
    catalog: renderBookOverviewSets,
    whole: renderBookOverviewWhole,
    knowledge: renderBookOverviewKnowledge,
    mistakes: renderBookOverviewMistakes,
    students: renderBookOverviewStudents,
  };
  if (!renderers[state.bookOverviewTab]) state.bookOverviewTab = "catalog";
  $("#bookOverviewTabs").querySelectorAll("[data-book-workbench-tab]").forEach((button) => {
    const active = button.dataset.bookWorkbenchTab === state.bookOverviewTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $("#bookOverviewContent").innerHTML = (renderers[state.bookOverviewTab] || renderBookOverviewWhole)(classInfo.id);
  bindBookOverviewContentEvents(classInfo.id);
  if (state.bookOverviewTab === "catalog" && state.bookOverviewSetDetailId) mountBookOverviewSetDetail(classInfo.id);
  if (state.bookOverviewTab === "mistakes") {
    enterBookMistakesWorkspace(classInfo.id);
    mountBookMistakesWorkspace();
    renderTable();
    renderBasket();
  }
  syncListeningWorkspaceChrome();
  hydrateIcons();
  if (state.bookOverviewTab === "whole") renderBookOverviewCharts(classInfo.id);
  if (state.bookOverviewTab === "students") renderBookOverviewStudentCharts(classInfo.id);
}

function disposeBookOverviewCharts() {
  bookOverviewChartInstances.forEach((chart) => chart.dispose());
  bookOverviewChartInstances.clear();
}

function bookOverviewAbilityValue(items, label) {
  const exact = items.find((item) => item.label === label);
  const partial = items.find((item) => String(item.label).includes(label));
  const value = Number((exact || partial)?.rate);
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function renderBookOverviewMetricCards(metrics, abilityItems = [], { scope = "class", idPrefix = "bookOverview" } = {}) {
  const useWholeReference = idPrefix === "bookOverview" && state.bookClassName === BOOK_OVERVIEW_REFERENCE.className;
  const progressPercent = useWholeReference
    ? BOOK_OVERVIEW_REFERENCE.progressPercent
    : (metrics.totalSets ? metrics.gradedCount / metrics.totalSets * 100 : 0);
  const score = formatBookScoreValue(metrics.averageScore);
  const rate = metrics.averageRate === null ? "--" : Math.round(metrics.averageRate);
  const isStudent = scope === "student";
  const showRateCard = false;
  const progressUnit = "套";
  const abilities = [
    { key: "short", label: "短对话", value: bookOverviewAbilityValue(abilityItems, "短对话") },
    { key: "solo", label: "独白", value: bookOverviewAbilityValue(abilityItems, "独白") },
    { key: "long", label: "长对话", value: bookOverviewAbilityValue(abilityItems, "长对话") },
  ];
  return `<div class="book-overview-metrics ${showRateCard ? "has-rate" : "is-compact"}">
    <article class="book-overview-metric is-progress">
      <header><strong>${isStudent ? "完成进度" : "批改进度"}</strong></header>
      <div class="book-overview-progress-body">
        <div id="${idPrefix}ProgressChart" class="book-overview-ring is-progress-ring" role="img" aria-label="${isStudent ? "完成" : "批改"}进度 ${Math.round(progressPercent)}%"></div>
        <div class="book-overview-progress-copy">
          <small>${isStudent ? "已完成" : "已批改"}</small>
          <strong>${metrics.gradedCount} / ${metrics.totalSets}<em>${progressUnit}</em></strong>
        </div>
      </div>
    </article>
    <article class="book-overview-metric is-score">
      <header><strong>${isStudent ? "学生平均分" : "班级平均分"}</strong></header>
      <div class="book-overview-value-body">
        <span class="book-overview-value-icon" data-icon="chart"></span>
        <div><strong>${score}<em>/ 30分</em></strong></div>
      </div>
    </article>
    ${showRateCard ? `<article class="book-overview-metric is-rate">
      <header><strong>${isStudent ? "学生平均正答率" : "班级平均正答率"}</strong></header>
      <div class="book-overview-value-body">
        <span class="book-overview-value-icon" data-icon="check-filled"></span>
        <div><strong>${rate}${rate === "--" ? "" : "%"}</strong></div>
      </div>
    </article>` : ""}
    <article class="book-overview-metric is-ability">
      <header><strong>听力正确率细分</strong></header>
      <div class="book-overview-ability-grid">
        ${abilities.map((item) => `<div class="book-overview-ability-item">
          <div id="${idPrefix}Ability${item.key}" class="book-overview-ring" role="img" aria-label="${item.label}正确率 ${item.value}%" data-ability-label="${item.label}"></div>
        </div>`).join("")}
      </div>
    </article>
  </div>`;
}

function renderBookOverviewEmpty(label = "暂无数据") {
  return `<div class="book-overview-empty"><span data-icon="detail"></span><strong>${label}</strong></div>`;
}

function renderBookOverviewScoreDistribution(className) {
  const distribution = bookAverageScoreDistribution(className, "all");
  return distribution.length
    ? `<div id="bookOverviewScoreDistribution" class="book-overview-chart book-overview-score-chart" role="img" aria-label="学生平均分分布"></div>`
    : renderBookOverviewEmpty();
}

function bookOverviewSetScoreItems(className = state.bookClassName, unit = "all") {
  const gradedSets = gradedBookSetsForClass(className, unit);
  if (!gradedSets.length) return [];
  if (className === BOOK_OVERVIEW_REFERENCE.className && unit === "all") {
    return allBookCatalogSets().slice(0, BOOK_OVERVIEW_REFERENCE.setScores.length).map((catalogSet, index) => ({
      label: catalogSet.name,
      score: normalizeBookScore(BOOK_OVERVIEW_REFERENCE.setScores[index]),
      nationalScore: normalizeBookScore(BOOK_OVERVIEW_REFERENCE.nationalSetScores[index]),
      rate: Math.round(normalizeBookScore(BOOK_OVERVIEW_REFERENCE.setScores[index]) / 30 * 1000) / 10,
      nationalRate: Math.round(normalizeBookScore(BOOK_OVERVIEW_REFERENCE.nationalSetScores[index]) / 30 * 1000) / 10,
      setId: bookSetIsGraded(catalogSet.setId, className) ? catalogSet.setId : null,
    }));
  }
  return gradedSets.map((set) => ({
    label: set.setName,
    score: normalizeBookScore(bookSetAverageScore(set, className) || 0),
    nationalScore: normalizeBookScore(bookSetNationalAverageScore(set) || 0),
    rate: Math.round(normalizeBookScore(bookSetAverageScore(set, className) || 0) / 30 * 1000) / 10,
    nationalRate: Math.round(normalizeBookScore(bookSetNationalAverageScore(set) || 0) / 30 * 1000) / 10,
    setId: set.setId,
  }));
}

function renderBookOverviewPointBars(items) {
  if (!items.length) return renderBookOverviewEmpty();
  const icons = ["message", "target", "headphones", "files", "gauge", "clock", "clipboard", "users"];
  return `<div class="book-overview-point-list">
    ${items.map((item, index) => {
      const value = Math.round(Number(item.rate) || 0);
      return `<div class="book-overview-point-row">
        <span class="book-overview-point-icon" data-icon="${icons[index % icons.length]}"></span>
        <strong>${escapeHtml(item.label)}</strong>
        <i><em style="width:${Math.max(3, value)}%"></em></i>
        <b>${value}%</b>
      </div>`;
    }).join("")}
  </div>`;
}

function renderBookOverviewSetScoreChart(className) {
  return bookOverviewSetScoreItems(className, "all").length
    ? `<div id="bookOverviewQuestionScoreChart" class="book-overview-chart book-overview-question-chart" role="img" aria-label="试题班级与全国平均分对比分布"></div>`
    : renderBookOverviewEmpty();
}

function renderBookOverviewWhole(className = state.bookClassName) {
  const metrics = bookClassBookMetrics(className, "all");
  const abilityItems = aggregateBookQuestionRates(className, (question) => question.questionType || "听力理解", "all");
  const pointItems = aggregateBookQuestionRates(className, bookOverviewExamPointLabel, "all").slice(0, 8);
  return `<div class="book-overview-report-page is-whole">
    ${renderBookOverviewMetricCards(metrics, abilityItems)}
    <div class="book-overview-grid">
      <section class="book-overview-card">
        <header><strong>学生平均分分布</strong></header>
        ${metrics.gradedCount ? renderBookOverviewScoreDistribution(className) : renderBookOverviewEmpty()}
      </section>
      <section class="book-overview-card">
        <header><strong>考点分布-正答率</strong></header>
        ${renderBookOverviewPointBars(pointItems)}
      </section>
      <section class="book-overview-card full">
        <header><strong>试题平均分分布</strong></header>
        ${renderBookOverviewSetScoreChart(className)}
      </section>
    </div>
  </div>`;
}

function renderBookOverviewKnowledge(className = state.bookClassName) {
  const resourceItems = [
    { title: "词汇", icon: "message", rows: [{ label: "charge", type: "熟词生义", count: 40 }, { label: "duck", type: "熟词生义", count: 30 }, { label: "please", type: "词义拓展", count: 26 }, { label: "room", type: "熟词生义", count: 23 }, { label: "mashed potatoes", type: "复合名词", count: 18 }] },
    { title: "语音", icon: "headphones", rows: [{ label: "shan't", type: "缩略式", count: 38 }, { label: "pudding", type: "音译词", count: 32 }, { label: "opposite", type: "不完全爆破", count: 29 }, { label: "contents", type: "重音", count: 24 }, { label: "Mardi Gras", type: "连读", count: 21 }] },
    { title: "实用表达", icon: "files", rows: [{ label: "There is an atmosphere of excitement in the air.", type: "场景表达", count: 36 }, { label: "Only family and friends can.", type: "情感表达", count: 31 }, { label: "with all its contents untouched", type: "with 复合结构", count: 27 }, { label: "I look forward to welcoming visitors", type: "宣传表达", count: 22 }, { label: "Could you start by telling us", type: "采访开场", count: 19 }] },
    { title: "语法", icon: "clipboard", rows: [{ label: "Do have the rest of the mashed potatoes.", type: "祈使句强调", count: 35 }, { label: "What really got me into them was that...", type: "主从复合句", count: 30 }, { label: "If I were you...", type: "虚拟语气", count: 25 }, { label: "something that people can relate to", type: "定语从句", count: 22 }, { label: "who takes care of trees", type: "定语从句", count: 18 }] },
    { title: "微技能", icon: "gauge", rows: [{ label: "判断采访类听力场景", type: "关系推断", count: 34 }, { label: "判断演讲目的", type: "意图推断", count: 31 }, { label: "快速抓取说话人核心意图", type: "目的识别", count: 28 }, { label: "锁定高频关键词", type: "信息定位", count: 23 }, { label: "捕捉实用信息", type: "细节判断", count: 20 }] },
    { title: "话题词汇", icon: "clock", rows: [{ label: "Halloween", type: "节假日", count: 37 }, { label: "costume", type: "节假日", count: 32 }, { label: "action film", type: "电影", count: 27 }, { label: "family ticket", type: "购票", count: 22 }, { label: "dress up", type: "庆祝活动", count: 18 }] },
    { title: "百科知识", icon: "book", rows: [{ label: "Halloween（万圣节前夕）", type: "节日文化", count: 35 }, { label: "jack-o'-lantern（南瓜灯）", type: "文化符号", count: 30 }, { label: "Mardi Gras（马蒂·格拉斯狂欢节）", type: "节日文化", count: 26 }, { label: "New Orleans", type: "地域文化", count: 21 }, { label: "Sydney Opera House", type: "城市地标", count: 17 }] },
  ];
  const filteredItems = bookKnowledgeFilterResourceItems(resourceItems, className);
  return `<div class="book-overview-report-page is-knowledge">
    ${renderBookOverviewKnowledgeSetFilterCard(className)}
    <div class="book-knowledge-grid">
      ${filteredItems.map((item) => {
        const max = Math.max(...item.rows.map((row) => row.count), 1);
        return `<section class="book-overview-card book-knowledge-card">
          <header><div class="book-knowledge-title"><span data-icon="${item.icon}"></span><strong>${escapeHtml(item.title)}-学生点击Top5</strong></div><button type="button" class="book-knowledge-view-all" data-book-knowledge-view-all="${escapeHtml(item.title)}">查看全部</button></header>
          <div class="book-knowledge-bars ${item.rows.length ? "" : "is-empty"}">
            ${item.rows.length ? item.rows.map((row) => `<div class="book-knowledge-bar-row">
              <span title="${escapeHtml(`${row.label}（${row.type}）`)}">${escapeHtml(row.label)}<em>（${escapeHtml(row.type)}）</em></span>
              <i aria-hidden="true"><b style="width:${Math.max(8, Math.round(row.count / max * 100))}%"></b></i>
              <strong>${row.count}人点击</strong>
            </div>`).join("") : `<div class="book-knowledge-empty">暂无${escapeHtml(item.title)}点击数据</div>`}
          </div>
        </section>`;
      }).join("")}
    </div>
  </div>`;
}

function renderBookOverviewKnowledgeSetFilterCard(className = state.bookClassName) {
  const activeUnit = state.bookKnowledgeUnit || "all";
  const activeSetId = state.bookKnowledgeSetId || "all";
  const setOptions = activeUnit === "all" ? [] : allBookCatalogSets().filter((set) => set.group.code === activeUnit);
  return `<section class="book-workbench-selector-panel book-knowledge-selector-panel" aria-label="知识点筛选">
    <section class="book-catalog-view book-overview-catalog-view" aria-label="知识点套题目录">
      <div class="book-set-list">
        <div class="book-direct-selector">
          <div class="book-selector-row">
            <span>单元</span>
            <div class="book-unit-options" role="tablist" aria-label="筛选单元">
              <button type="button" class="${activeUnit === "all" ? "active" : ""}" data-book-knowledge-unit="all" role="tab" aria-selected="${activeUnit === "all"}">全部</button>
              ${BOOK_CATALOG_GROUPS.map((group) => `<button type="button" class="${activeUnit === group.code ? "active" : ""}" data-book-knowledge-unit="${group.code}" role="tab" aria-selected="${activeUnit === group.code}">${group.code}</button>`).join("")}
            </div>
          </div>
          <div class="book-selector-row">
            <span>套题</span>
            <div class="book-set-options" aria-label="筛选套题">
              <button type="button" class="${activeSetId === "all" ? "active" : ""}" data-book-knowledge-set-filter="all">全部</button>
              ${setOptions.map((set) => {
                const active = String(activeSetId) === String(set.setId);
                const label = set.name.replace(new RegExp(`^${set.group.code}\\s*`), "") || set.name;
                return `<button type="button" class="${active ? "active" : ""}" data-book-knowledge-set-filter="${set.setId}">${escapeHtml(label)}</button>`;
              }).join("")}
            </div>
          </div>
        </div>
      </div>
    </section>
  </section>`;
}

function bookKnowledgeFilterResourceItems(resourceItems, className = state.bookClassName) {
  const unit = state.bookKnowledgeUnit || "all";
  const setId = state.bookKnowledgeSetId || "all";
  const unitSeed = unit === "all" ? 0 : BOOK_CATALOG_GROUPS.findIndex((group) => group.code === unit) + 1;
  const setSeed = setId === "all" ? 0 : Number(setId) || 0;
  const sparseTitles = new Set(setId !== "all" && setSeed % 2 === 0 ? ["微技能", "话题词汇", "实用表达"] : []);
  return resourceItems.map((item, itemIndex) => {
    if (sparseTitles.has(item.title)) return { ...item, rows: [] };
    const rows = item.rows.map((row, rowIndex) => {
      const delta = ((unitSeed * 5 + setSeed * 3 + itemIndex * 4 + rowIndex * 2) % 9) - 4;
      return { ...row, count: Math.max(1, row.count + delta) };
    });
    return { ...item, rows };
  });
}

function bookStudentRealTrendData(className, studentId) {
  const sets = gradedBookSetsForClass(className);
  const students = CLASS_STUDENTS[className] || [];
  const studentIndex = students.findIndex((student) => student.id === studentId);
  return sets.map((set) => {
    const rows = bookStudentRows(set, className, true);
    const classScores = rows.map((row) => row.score).filter(Number.isFinite);
    const classAvg = classScores.length ? normalizeBookScore(classScores.reduce((sum, value) => sum + value, 0) / classScores.length) : null;
    const row = studentIndex >= 0 ? rows[studentIndex] : null;
    const wrong = row ? Math.max(0, set.questions.length - row.correctCount) : null;
    const classWrong = rows.length ? rows.reduce((sum, item) => sum + Math.max(0, set.questions.length - item.correctCount), 0) / rows.length : null;
    return { label: set.setName, score: row?.score ?? null, classScore: classAvg, wrong, classWrong, setId: set.setId };
  });
}

function bookStudentTrendData(className, studentId) {
  const students = CLASS_STUDENTS[className] || [];
  const studentIndex = students.findIndex((student) => student.id === studentId);
  const classIndex = Math.max(0, TEACHER_CLASSES.findIndex((item) => item.id === className));
  const realItems = new Map(bookStudentRealTrendData(className, studentId).map((item) => [Number(item.setId), item]));
  return allBookCatalogSets().slice(0, 10).map((catalogSet, index) => {
    const real = realItems.get(Number(catalogSet.setId));
    const classScore = real?.classScore ?? normalizeBookScore(19.2 + ((index * 17 + classIndex * 7) % 58) / 10);
    const scoreOffset = studentIndex >= 0 ? (((studentIndex * 3 + index * 2) % 7) - 3) * .6 : 0;
    const personalScore = real?.score ?? (studentIndex >= 0 ? normalizeBookScore(classScore + scoreOffset) : null);
    const classWrong = real?.classWrong ?? Math.round((20 - classScore / 30 * 20) * 10) / 10;
    const personalWrong = real?.wrong ?? (Number.isFinite(personalScore) ? Math.max(0, Math.round(20 - personalScore / 30 * 20)) : null);
    return {
      label: catalogSet.name,
      name: catalogSet.name,
      setId: catalogSet.setId,
      score: personalScore,
      classScore,
      wrong: personalWrong,
      classWrong,
      rate: Number.isFinite(personalScore) ? personalScore / 30 * 100 : null,
      classRate: classScore / 30 * 100,
      uploadTime: `2026-08-${String(2 + index).padStart(2, "0")} 08:${String(38 + index).padStart(2, "0")}:14`,
      demo: !real,
    };
  });
}

function bookStudentAbilityItems(rate) {
  const base = Number(rate) || 0;
  return [
    { label: "短对话", rate: Math.max(0, Math.min(100, base + 4)) },
    { label: "独白", rate: Math.max(0, Math.min(100, base - 1)) },
    { label: "长对话", rate: Math.max(0, Math.min(100, base - 4)) },
  ];
}

function bookStudentSetDetailRows(className, studentId) {
  const demoItems = new Map(bookStudentTrendData(className, studentId).map((item) => [Number(item.setId), item]));
  return allBookCatalogSets().map((catalogSet) => {
    const item = demoItems.get(Number(catalogSet.setId));
    if (!item) return { ...catalogSet, graded: false, score: null, wrong: null, rate: null, uploadTime: "--" };
    const personal = Boolean(studentId);
    return {
      ...catalogSet,
      graded: true,
      score: personal ? item.score : item.classScore,
      wrong: personal ? item.wrong : item.classWrong,
      rate: personal ? item.rate : item.classRate,
      uploadTime: item.uploadTime,
      demo: item.demo,
      detailAvailable: Boolean(bookSetById(catalogSet.setId)),
    };
  });
}

function renderBookOverviewStudents(className = state.bookClassName) {
  const allStudents = CLASS_STUDENTS[className] || [];
  const query = state.bookOverviewStudentSearch.trim().toLowerCase();
  const students = allStudents.filter((student) => !query || student.name.toLowerCase().includes(query));
  const selected = students.find((student) => student.id === state.bookOverviewStudentId) || students[0] || null;
  state.bookOverviewStudentId = selected?.id || null;
  const trendItems = bookStudentTrendData(className, selected?.id);
  const scoreValues = trendItems.map((item) => selected ? item.score : item.classScore).filter(Number.isFinite);
  const rateValues = trendItems.map((item) => selected ? item.rate : item.classRate).filter(Number.isFinite);
  const scoreValue = scoreValues.length ? normalizeBookScore(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length) : null;
  const rateValue = rateValues.length ? rateValues.reduce((sum, value) => sum + value, 0) / rateValues.length : null;
  const studentMetrics = {
    gradedCount: trendItems.length,
    totalSets: bookCatalogTotal("all"),
    averageScore: scoreValue,
    averageRate: rateValue,
  };
  const abilityItems = bookStudentAbilityItems(rateValue);
  const detailRows = bookStudentSetDetailRows(className, selected?.id);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(detailRows.length / pageSize));
  state.bookOverviewStudentSetPage = Math.min(Math.max(1, state.bookOverviewStudentSetPage), pageCount);
  const pageStart = (state.bookOverviewStudentSetPage - 1) * pageSize;
  const pageRows = detailRows.slice(pageStart, pageStart + pageSize);
  return `<div class="book-overview-report-page is-students">
    <div class="book-student-overview">
      <aside class="book-student-roster"><header><strong>学生列表</strong><label><span data-icon="search"></span><input id="bookOverviewStudentSearch" value="${escapeHtml(state.bookOverviewStudentSearch)}" placeholder="搜索学生" /></label></header><div class="book-student-roster-list">${students.map((student) => `<button type="button" class="${selected?.id === student.id ? "active" : ""}" data-book-student="${student.id}">${escapeHtml(student.name)}<small>${escapeHtml(student.studentNo)}</small></button>`).join("")}</div></aside>
      <section class="book-student-main">
        <div class="book-student-report-metrics">${renderBookOverviewMetricCards(studentMetrics, abilityItems, { scope: selected ? "student" : "class", idPrefix: "bookStudentOverview" })}</div>
        <div class="book-student-charts is-score-only"><section class="book-overview-card"><header><strong>各套题得分趋势</strong></header><div id="bookStudentScoreTrend" class="book-student-trend-chart" role="img" aria-label="各套题得分趋势"></div></section></div>
        <section class="book-overview-card student-set-table"><header><strong>${selected ? `${escapeHtml(selected.name)} · 各套题明细` : "班级各套题明细"}</strong></header><div class="student-set-table-wrap"><table><thead><tr><th>套题名称</th><th>${selected ? "个人得分" : "班级平均分"}</th><th>最新作答时长</th><th>最新作答时间</th><th>操作</th></tr></thead><tbody>${pageRows.map((item) => {
          const canOpenDetail = Boolean(selected && item.detailAvailable);
          const score = formatBookScore(item.score);
          const rate = Number.isFinite(item.rate) ? Math.round(item.rate) : null;
          return `<tr><td>${escapeHtml(item.name)}</td><td>${rate !== null ? `<button type="button" class="book-attempt-rate" data-book-attempt-history data-book-attempt-metric="score" data-book-attempt-rate="${rate}" data-book-attempt-seed="${escapeHtml(item.setId)}">${score}（作答3次）</button>` : score}</td><td>${rate !== null ? latestAttemptDuration(item.setId, rate) : "--"}</td><td>${rate !== null ? latestAttemptTime(item.setId, rate) : item.uploadTime}</td><td><button type="button" class="${canOpenDetail ? "" : "disabled"}" data-book-student-detail="${item.setId}" ${canOpenDetail ? "" : "disabled"}><span data-icon="detail"></span>作答详情</button></td></tr>`;
        }).join("")}</tbody></table></div><footer class="student-set-table-pager"><span>共 ${detailRows.length} 套</span><div><button type="button" data-book-student-set-page="${state.bookOverviewStudentSetPage - 1}" ${state.bookOverviewStudentSetPage === 1 ? "disabled" : ""}>上一页</button><strong>${state.bookOverviewStudentSetPage} / ${pageCount}</strong><button type="button" data-book-student-set-page="${state.bookOverviewStudentSetPage + 1}" ${state.bookOverviewStudentSetPage === pageCount ? "disabled" : ""}>下一页</button></div></footer></section>
      </section>
    </div>
  </div>`;
}

function initBookOverviewChart(id, option, onClick) {
  const element = document.getElementById(id);
  if (!element || !window.echarts) return null;
  const chart = window.echarts.init(element, null, { renderer: "svg" });
  chart.setOption(option);
  if (onClick) chart.on("click", onClick);
  bookOverviewChartInstances.set(id, chart);
  return chart;
}

function bookOverviewRingOption(value, color, track, fontSize = 24, label = "") {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const titleText = label ? `{value|${Math.round(safeValue)}%}\n{label|${label}}` : `${Math.round(safeValue)}%`;
  return {
    animationDuration: 650,
    aria: { enabled: true },
    tooltip: { show: false },
    title: {
      text: titleText,
      left: "center",
      top: "middle",
      textStyle: {
        color,
        fontSize,
        fontWeight: 700,
        lineHeight: label ? 20 : fontSize + 4,
        fontFamily: "Inter, PingFang SC, Microsoft YaHei, sans-serif",
        rich: label ? {
          value: { color, fontSize, fontWeight: 700, lineHeight: 24 },
          label: { color: "#17213f", fontSize: 11, fontWeight: 500, lineHeight: 16 },
        } : undefined,
      },
    },
    series: [{
      type: "pie",
      radius: ["72%", "86%"],
      center: ["50%", "50%"],
      startAngle: 90,
      clockwise: true,
      silent: true,
      label: { show: false },
      itemStyle: { borderRadius: 8 },
      data: [
        { value: safeValue, itemStyle: { color } },
        { value: 100 - safeValue, itemStyle: { color: track } },
      ],
    }],
  };
}

function bookStudentMetricRingOption(value, max, color) {
  const safeMax = Math.max(1, Number(max) || 1);
  const safeValue = Math.max(0, Math.min(safeMax, Number(value) || 0));
  return {
    animationDuration: 600,
    aria: { enabled: true },
    tooltip: { show: false },
    series: [{
      type: "pie",
      radius: ["68%", "88%"],
      center: ["50%", "50%"],
      startAngle: 90,
      clockwise: true,
      silent: true,
      label: { show: false },
      itemStyle: { borderRadius: 8 },
      data: [
        { value: safeValue, itemStyle: { color } },
        { value: safeMax - safeValue, itemStyle: { color: "#e8eef7" } },
      ],
    }],
  };
}

function renderBookOverviewCharts(className = state.bookClassName, options = {}) {
  const onSetClick = options.onSetClick || renderBookOverview;
  if (!window.echarts) {
    $("#bookOverviewContent")?.classList.add("charts-unavailable");
    return;
  }
  const metrics = bookClassBookMetrics(className, "all");
  const abilityItems = aggregateBookQuestionRates(className, (question) => question.questionType || "听力理解", "all");
  const progress = className === BOOK_OVERVIEW_REFERENCE.className
    ? BOOK_OVERVIEW_REFERENCE.progressPercent
    : (metrics.totalSets ? metrics.gradedCount / metrics.totalSets * 100 : 0);
  initBookOverviewChart("bookOverviewProgressChart", bookOverviewRingOption(progress, "#176cf2", "#e8eef7", 23));
  [
    ["bookOverviewAbilityshort", bookOverviewAbilityValue(abilityItems, "短对话"), "#2f7af5", "#e7eefb"],
    ["bookOverviewAbilitysolo", bookOverviewAbilityValue(abilityItems, "独白"), "#18b7ad", "#dff2f2"],
    ["bookOverviewAbilitylong", bookOverviewAbilityValue(abilityItems, "长对话"), "#7947e8", "#eee8fb"],
  ].forEach(([id, value, color, track]) => {
    const label = document.getElementById(id)?.dataset.abilityLabel || "";
    initBookOverviewChart(id, bookOverviewRingOption(value, color, track, 20, label));
  });

  const distribution = bookAverageScoreDistribution(className, "all");
  if (distribution.length) {
    const values = className === BOOK_OVERVIEW_REFERENCE.className
      ? BOOK_OVERVIEW_REFERENCE.scoreDistribution
      : distribution.map((item) => Math.round(item.count / Math.max(1, (CLASS_STUDENTS[className] || []).length) * 100));
    const studentTotal = Math.max(1, (CLASS_STUDENTS[className] || []).length);
    const counts = className === BOOK_OVERVIEW_REFERENCE.className
      ? values.map((value) => Math.round(value / 100 * studentTotal))
      : distribution.map((item) => item.count);
    const distributionColors = ["#ff5f57", "#ff8a2a", "#f6bd16", "#46c86f", "#3d82f6"];
    initBookOverviewChart("bookOverviewScoreDistribution", {
      animationDuration: 700,
      aria: { enabled: true },
      grid: { left: 85, right: 36, top: 24, bottom: 40 },
      tooltip: { trigger: "axis", formatter: (params) => {
        const index = Number(params[0]?.dataIndex) || 0;
        return `${params[0].axisValue}<br/>${params[0].value}% · ${counts[index]}人`;
      } },
      xAxis: {
        type: "category",
        boundaryGap: true,
        data: distribution.map((item) => item.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#dfe7f2" } },
        axisLabel: { color: "#506a9b", fontSize: 13, margin: 16 },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: Math.max(50, Math.ceil(Math.max(...values, 1) / 10) * 10),
        interval: 10,
        axisLabel: { color: "#506a9b", fontSize: 12, margin: 58, formatter: "{value}%" },
        splitLine: { lineStyle: { color: "#e7edf6" } },
      },
      series: [{
        type: "bar",
        barWidth: 38,
        data: values.map((value, index) => ({ value, itemStyle: { color: distributionColors[index] } })),
        itemStyle: {
          borderRadius: [5, 5, 0, 0],
        },
        emphasis: { itemStyle: { opacity: .82 } },
        label: { show: true, position: "top", distance: 8, color: "#101d3d", fontSize: 12, fontWeight: 700, lineHeight: 17, formatter: (params) => `${params.value}%\n${counts[params.dataIndex]}人` },
      }],
    });
  }

  const setItems = bookOverviewSetScoreItems(className, "all");
  if (setItems.length) {
    const classSeriesName = "班级平均分";
    const nationalSeriesName = "全国平均分";
    initBookOverviewChart("bookOverviewQuestionScoreChart", {
      animationDuration: 700,
      aria: { enabled: true },
      grid: { left: 36, right: 10, top: 46, bottom: 68 },
      legend: {
        top: 0,
        right: 10,
        itemWidth: 14,
        itemHeight: 9,
        itemGap: 18,
        textStyle: { color: "#506a9b", fontSize: 11 },
        data: [classSeriesName, nationalSeriesName],
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const values = Object.fromEntries(params.map((item) => [item.seriesName, Number(item.value)]));
          return `${params[0]?.axisValue || ""}<br/>${classSeriesName} ${Number(values[classSeriesName] || 0).toFixed(1)}<br/>${nationalSeriesName} ${Number(values[nationalSeriesName] || 0).toFixed(1)}`;
        },
      },
      xAxis: {
        type: "category",
        data: setItems.map((item) => item.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#dfe7f2" } },
        axisLabel: {
          color: "#506a9b",
          fontSize: 11,
          interval: 0,
          lineHeight: 16,
          margin: 12,
          formatter: (value) => String(value).replace(" ", "\n"),
        },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 30,
        interval: 10,
        axisLabel: { color: "#506a9b", fontSize: 12 },
        splitLine: { lineStyle: { color: "#e7edf6", type: "dashed" } },
      },
      series: [
        {
          name: classSeriesName,
          type: "bar",
          barWidth: 22,
          z: 3,
          data: setItems.map((item) => ({ value: item.score, ...item })),
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(40, 122, 244, .78)" },
              { offset: 1, color: "rgba(185, 210, 251, .46)" },
            ]),
          },
          emphasis: { itemStyle: { color: "rgba(23, 108, 242, .88)" } },
          label: { show: true, position: "top", color: "#101d3d", fontSize: 12, formatter: (params) => Number(params.value).toFixed(1) },
        },
        {
          name: nationalSeriesName,
          type: "line",
          z: 1,
          data: setItems.map((item) => ({ value: item.nationalScore, ...item })),
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { width: 2.5, color: "#f0445b" },
          itemStyle: { color: "#f0445b", borderColor: "#fff", borderWidth: 1 },
          emphasis: { lineStyle: { width: 3.5 } },
        },
      ],
    }, (params) => {
      const setId = Number(params.data?.setId);
      if (setId) {
        state.bookOverviewTab = "catalog";
        state.bookOverviewSetDetailId = setId;
        state.bookOverviewSetDetailTab = "overview";
        state.bookOverviewSetDetailStudentId = null;
        onSetClick();
      }
    });
  }
}

function renderBookOverviewStudentCharts(className = state.bookClassName) {
  if (!window.echarts) {
    $("#bookOverviewContent")?.classList.add("charts-unavailable");
    return;
  }
  const selected = (CLASS_STUDENTS[className] || []).find((student) => student.id === state.bookOverviewStudentId) || null;
  const items = bookStudentTrendData(className, selected?.id);
  const rateValues = items.map((item) => selected ? item.rate : item.classRate).filter(Number.isFinite);
  const averageRate = rateValues.length ? rateValues.reduce((sum, value) => sum + value, 0) / rateValues.length : 0;
  const abilityItems = bookStudentAbilityItems(averageRate);
  initBookOverviewChart("bookStudentOverviewProgressChart", bookOverviewRingOption(items.length / bookCatalogTotal("all") * 100, "#176cf2", "#e8eef7", 23));
  [
    ["bookStudentOverviewAbilityshort", bookOverviewAbilityValue(abilityItems, "短对话"), "#2f7af5", "#e7eefb"],
    ["bookStudentOverviewAbilitysolo", bookOverviewAbilityValue(abilityItems, "独白"), "#18b7ad", "#dff2f2"],
    ["bookStudentOverviewAbilitylong", bookOverviewAbilityValue(abilityItems, "长对话"), "#7947e8", "#eee8fb"],
  ].forEach(([id, value, color, track]) => {
    const label = document.getElementById(id)?.dataset.abilityLabel || "";
    initBookOverviewChart(id, bookOverviewRingOption(value, color, track, 20, label));
  });
  const baseOption = (metric, title) => {
    const classKey = metric === "wrong" ? "classWrong" : metric === "rate" ? "classRate" : "classScore";
    const personalKey = metric;
    const classValues = items.map((item) => metric === "rate" ? (Number.isFinite(item.classScore) ? item.classScore / 30 * 100 : null) : item[classKey]);
    const personalValues = items.map((item) => metric === "rate" ? (Number.isFinite(item.score) ? item.score / 30 * 100 : null) : item[personalKey]);
    const max = metric === "score" ? 30 : metric === "rate" ? 100 : Math.max(5, Math.ceil(Math.max(...classValues.filter(Number.isFinite), ...personalValues.filter(Number.isFinite), 1) + 2));
    const series = [{ name: "班级平均", type: "line", smooth: false, symbol: "circle", symbolSize: 8, data: classValues, lineStyle: { width: 3, color: "#176cf2" }, itemStyle: { color: "#176cf2" } }];
    if (selected) series.push({ name: "个人", type: "line", smooth: false, symbol: "circle", symbolSize: 8, data: personalValues, lineStyle: { width: 3, color: "#f0445b" }, itemStyle: { color: "#f0445b" } });
    return {
      animationDuration: 600,
      aria: { enabled: true, description: title },
      color: ["#176cf2", "#f0445b"],
      grid: { left: 44, right: 22, top: 36, bottom: 52 },
      legend: { top: 2, right: 4, itemWidth: 16, itemHeight: 8, textStyle: { color: "#66758b", fontSize: 11 } },
      tooltip: { trigger: "axis", valueFormatter: (value) => `${Number(value).toFixed(metric === "wrong" ? 1 : 0)}${metric === "rate" ? "%" : ""}` },
      xAxis: { type: "category", boundaryGap: false, data: items.map((item) => item.label), axisTick: { show: false }, axisLine: { lineStyle: { color: "#dfe7f2" } }, axisLabel: { color: "#718198", fontSize: 10, interval: 0, hideOverlap: false, lineHeight: 14, margin: 12, formatter: (value) => String(value).replace(/^Welcome Unit\b/i, "WU") } },
      yAxis: { type: "value", min: 0, max, interval: metric === "wrong" ? 2 : metric === "score" ? 5 : 20, axisLabel: { color: "#718198", fontSize: 11, formatter: metric === "rate" ? "{value}%" : "{value}" }, splitLine: { lineStyle: { color: "#e8eef6", type: "dashed" } } },
      series,
    };
  };
  if (items.length) {
    initBookOverviewChart("bookStudentScoreTrend", baseOption("score", "班级与个人得分趋势"));
  }
}

window.addEventListener("resize", () => {
  bookOverviewChartInstances.forEach((chart) => chart.resize());
  bookDataChartInstances.forEach((chart) => chart.resize());
});

function renderBookOverviewUnitFilters() {
  return `<div class="book-overview-unit-filter" role="tablist" aria-label="筛选单元">
    ${BOOK_CATALOG_GROUPS.map((group) => `<button type="button" class="${state.bookOverviewUnit === group.code ? "active" : ""}" data-book-overview-unit="${group.code}">${group.code}</button>`).join("")}
  </div>`;
}

function renderBookOverviewSelectorPanel(className = state.bookClassName, { context = "reports", showSetSelector = true } = {}) {
  const isMistakes = context === "mistakes";
  const activeUnit = isMistakes ? state.bookOverviewMistakeUnit : state.bookOverviewUnit;
  const selectedSetId = isMistakes ? state.bookOverviewMistakeSetId : state.bookOverviewSelectedSetId;
  const activeGroup = BOOK_CATALOG_GROUPS.find((group) => group.code === activeUnit) || BOOK_CATALOG_GROUPS[0];
  const setButtons = [{ setId: "all", name: "全部" }, ...(activeUnit === "all" ? [] : activeGroup.sets)].map((set) => {
      if (set.setId === "all") {
        const action = isMistakes ? 'data-book-mistake-set="all"' : 'data-book-overview-set-filter="all"';
        return `<button type="button" class="${selectedSetId === "all" ? "active" : ""}" ${action} aria-pressed="${selectedSetId === "all"}">全部</button>`;
      }
      const catalogSet = catalogSetRecord(set.setId);
      const available = Boolean(catalogSet?.available);
      const graded = available && bookSetIsGraded(set.setId, className);
      const selected = Number(selectedSetId) === Number(set.setId);
      const shortName = set.name.replace(new RegExp(`^${activeGroup.code}\\s*`), "");
      const action = isMistakes ? `data-book-mistake-set="${set.setId}"` : `data-book-overview-set-filter="${set.setId}"`;
      return `<button type="button" class="${selected ? "active " : ""}${available ? "" : "disabled"}" ${available ? action : "disabled"} aria-pressed="${selected}" title="${available ? `${set.name}${graded ? "：已批改" : "：未批改"}` : `${set.name}：数据待接入`}">${shortName}</button>`;
    }).join("");
  return `<section class="book-workbench-selector-panel book-overview-selector-panel" aria-label="筛选范围">
    <section class="book-catalog-view book-overview-catalog-view" aria-label="报告套题目录">
      <div class="book-set-list">
        <div class="book-direct-selector">
          <div class="book-selector-row">
            <span>单元</span>
            <div class="book-unit-options" role="tablist" aria-label="筛选单元">
              <button type="button" class="${activeUnit === "all" ? "active" : ""}" ${isMistakes ? 'data-book-mistake-unit="all"' : 'data-book-overview-unit="all"'} role="tab" aria-selected="${activeUnit === "all"}">全部</button>
              ${BOOK_CATALOG_GROUPS.map((group) => `<button type="button" class="${activeUnit === group.code ? "active" : ""}" ${isMistakes ? `data-book-mistake-unit="${group.code}"` : `data-book-overview-unit="${group.code}"`} role="tab" aria-selected="${activeUnit === group.code}">${group.code}</button>`).join("")}
            </div>
          </div>
          ${showSetSelector ? `<div class="book-selector-row">
            <span>套题</span>
            <div class="book-set-options" aria-label="${activeUnit === "all" ? "全部套题" : `${activeGroup.code}套题`}">
              ${setButtons}
            </div>
          </div>` : ""}
        </div>
      </div>
    </section>
  </section>`;
}

function renderBookOverviewSetFilterCard(className = state.bookClassName) {
  return renderBookOverviewSelectorPanel(className, { showSetSelector: false });
}

function renderBookOverviewSetDetail(className = state.bookClassName) {
  const set = bookCatalogDisplaySet(state.bookOverviewSetDetailId);
  if (!set) {
    state.bookOverviewSetDetailId = null;
    return renderBookOverviewSets(className);
  }
  const tabs = [
    ["overview", "总览"],
    ["questions", "题目正确率统计"],
    ["students", "学生得分统计"],
  ];
  return `<div class="book-overview-report-page is-set-detail">
    <section class="book-overview-set-detail-shell">
      <header class="book-overview-set-detail-head">
        <button type="button" data-book-overview-back-to-sets><span data-icon="arrow-left"></span>返回试题详情</button>
        <nav class="book-data-tabs book-overview-set-detail-tabs" role="tablist" aria-label="套题报告视图">
          ${tabs.map(([key, label]) => `<button type="button" class="${state.bookOverviewSetDetailTab === key ? "active" : ""}" data-book-overview-set-detail-tab="${key}" role="tab" aria-selected="${state.bookOverviewSetDetailTab === key}">${label}</button>`).join("")}
        </nav>
        <span class="book-overview-set-detail-head-spacer" aria-hidden="true"></span>
      </header>
      <section id="bookOverviewSetDetailContent" class="book-data-panel book-overview-set-detail-content" aria-label="${escapeHtml(set.displaySetName || set.setName)}报告内容"></section>
    </section>
  </div>`;
}

function mountBookOverviewSetDetail(className = state.bookClassName) {
  const set = bookCatalogDisplaySet(state.bookOverviewSetDetailId);
  const target = $("#bookOverviewSetDetailContent");
  if (!set || !target) return;
  renderBookDataPanel(set, {
    target,
    className,
    tab: state.bookOverviewSetDetailTab,
    studentPageKey: "bookOverviewSetStudentPage",
    questionPageKey: "bookOverviewSetQuestionPage",
    returnPage: "book-overview",
    highlightStudentId: state.bookOverviewSetDetailStudentId,
    forceClass: true,
    forceGraded: true,
  });
}

function bookCatalogRowData(catalogSet, className = state.bookClassName) {
  const sourceSet = bookCatalogSourceSet(catalogSet);
  const sourceCatalog = catalogSetRecord(sourceSet?.setId);
  const graded = bookSetIsGraded(catalogSet.setId, className);
  const metrics = sourceSet && graded ? bookSetMetrics(sourceSet, className, true) : null;
  return {
    sourceSet,
    graded,
    rate: metrics?.total ? metrics.correctCount / metrics.total * 100 : null,
    score: metrics?.total ? normalizeBookScore(metrics.correctCount / metrics.total * 30) : null,
    activity: bookCatalogClassActivity(sourceCatalog || catalogSet, className, graded),
  };
}

function normalizeBookScore(value, total = 30) {
  if (!Number.isFinite(Number(value))) return "--";
  return Math.max(0, Math.min(total, Math.round(Number(value) / 1.5) * 1.5));
}

function formatBookScoreValue(value) {
  const rounded = normalizeBookScore(value);
  if (rounded === "--") return "--";
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatBookScore(value, total = 30) {
  const rounded = normalizeBookScore(value, total);
  if (rounded === "--") return "--";
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}/${total}`;
}

function bookCatalogMetricMode() {
  if (state.page !== "work-report") return "score";
  const task = workTaskById(state.workReportTaskId);
  return workReportUsesSetScore(task) ? "score" : "rate";
}

function workReportUsesSetScore(task) {
  if (!task) return true;
  if (task.type === "schoolbook") return true;
  return task.responseMode === "app"
    && (task.assignmentSource === "sets" || task.publishRules?.quantityMode === "set");
}

function renderBookCatalogSortHeader(key, label) {
  const active = state.bookCatalogSortKey === key;
  const direction = active ? state.bookCatalogSortDirection : "none";
  return `<button type="button" class="book-question-sort-trigger ${active ? "active" : ""}" data-book-catalog-sort="${key}" aria-label="按${label}${active && direction === "asc" ? "升序" : "降序"}排列"><span>${label}</span><i class="sort-stepper" data-sort-state="${direction}" aria-hidden="true"><b></b><b></b></i></button>`;
}

function formatListDate(value) {
  const text = String(value || "").trim();
  if (!text || text === "--") return "--";
  return text.split(/\s+/)[0];
}

function sortedBookCatalogSets(className = state.bookClassName) {
  const items = allBookCatalogSets()
    .filter((set) => state.bookOverviewUnit === "all" || set.group.code === state.bookOverviewUnit)
    .map((catalogSet, sourceIndex) => ({ catalogSet, sourceIndex, ...bookCatalogRowData(catalogSet, className) }));
  const direction = state.bookCatalogSortDirection === "desc" ? -1 : 1;
  if (state.bookCatalogSortKey === "latest") {
    items.sort((a, b) => String(a.activity.latest).localeCompare(String(b.activity.latest), "zh-CN") * direction || a.sourceIndex - b.sourceIndex);
  } else if (state.bookCatalogSortDirection === "desc") {
    items.reverse();
  }
  return items;
}

function renderBookOverviewSets(className = state.bookClassName) {
  if (state.bookOverviewSetDetailId) return renderBookOverviewSetDetail(className);
  const catalogRows = sortedBookCatalogSets(className);
  const catalogSets = catalogRows.map((item) => item.catalogSet);
  const selectedVisibleSetCount = catalogSets.filter((set) => state.bookSelectedSetIds.has(Number(set.setId))).length;
  const metricMode = bookCatalogMetricMode();
  const metricLabel = metricMode === "score" ? "平均分" : "正答率";
  return `<div class="book-overview-report-page is-sets">
    <div class="book-assignment-sets-layout book-catalog-report-layout">
      <section class="table-panel book-assignment-set-table-card book-catalog-report-table-card">
        <div class="panel-title-row"><div class="panel-title-main"><h2>试题详情</h2></div><button id="bookCatalogBatchAssignmentAction" class="book-catalog-batch-assignment" type="button" ${selectedVisibleSetCount ? "" : "disabled"} aria-disabled="${selectedVisibleSetCount ? "false" : "true"}"><span data-icon="phone"></span>批量布置到学生端</button></div>
        <div class="table-wrap">
        <table class="listening-data-table">
          <colgroup><col class="book-set-check" /><col class="book-set-number" /><col class="book-set-unit" /><col class="book-set-name" /><col class="book-set-rate" /><col class="book-set-progress" /><col class="book-set-latest" /><col class="book-set-lecture" /><col class="book-set-actions" /></colgroup>
          <thead><tr><th class="check-col"><label class="checkbox-wrap" title="全选当前目录套题"><input type="checkbox" data-book-catalog-select-all aria-label="全选当前目录套题" ${catalogSets.length && catalogSets.every((set) => state.bookSelectedSetIds.has(Number(set.setId))) ? "checked" : ""} /><span aria-hidden="true"></span></label></th><th>序号</th><th><button type="button" class="column-filter-trigger ${state.bookOverviewUnit !== "all" ? "filtered" : ""}" data-book-catalog-unit-filter title="筛选单元"><span>单元</span><i data-icon="filter"></i></button></th><th>套题</th><th class="answer-dist-heading">${metricLabel}</th><th>作答情况</th><th>${renderBookCatalogSortHeader("latest", "最新作答时间")}</th><th>操作</th><th>布置到学生端</th></tr></thead>
          <tbody>
            ${catalogRows.map(({ catalogSet, graded, rate, score, activity }, index) => {
              const setName = shortCatalogSetName(catalogSet);
              const selected = state.bookSelectedSetIds.has(Number(catalogSet.setId));
              const metricValue = metricMode === "score" ? formatBookScore(score) : (Number.isFinite(rate) ? formatBookRate(rate) : "--");
              return `<tr>
                <td class="book-set-check"><label class="checkbox-wrap"><input type="checkbox" data-book-catalog-select="${catalogSet.setId}" ${selected ? "checked" : ""} aria-label="选择${escapeHtml(catalogSet.name)}" /><span aria-hidden="true"></span></label></td>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(catalogSet.group.code)}</strong></td>
                <td><strong>${escapeHtml(setName)}</strong></td>
                <td>${metricValue}</td>
                <td><div class="book-catalog-answer-progress"><span><b>${activity.answered}</b>/${activity.total}</span></div></td>
                <td>${formatListDate(activity.latest)}</td>
                <td>
                  <div class="row-actions book-catalog-lecture-actions">
                    <button type="button" class="link-button" data-book-overview-play-set="${catalogSet.setId}"><span data-icon="headphones"></span>播放音频</button>
                    <button type="button" class="link-button" data-book-overview-full-set="${catalogSet.setId}"><span data-icon="expand"></span>全屏讲解</button>
                    <button type="button" class="link-button" data-book-catalog-scan="${catalogSet.setId}"><span data-icon="scan"></span>${activity.answered ? "继续扫描" : "扫描答题卡"}</button>
                    <button type="button" class="link-button" data-book-overview-open-set="${catalogSet.setId}" ${graded ? "" : "disabled"}><span data-icon="chart"></span>查看报告</button>
                  </div>
                </td>
                <td>
                  <div class="row-actions book-catalog-operation-actions">
                    <button type="button" class="link-button" data-book-catalog-assign="${catalogSet.setId}"><span data-icon="phone"></span>布置</button>
                  </div>
                </td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
        </div>
        <div id="bookCatalogFilterMenu" class="column-filter-menu hidden" aria-label="单元筛选"></div>
      </section>
    </div>
  </div>`;
}

function renderBookOverviewMistakes(className = state.bookClassName) {
  return `<div class="book-overview-report-page is-mistakes">
    <section id="bookOverviewListeningHost" class="page listening-page book-overview-listening-host" aria-label="本书高频错题讲评工作台" data-book-class="${escapeHtml(className)}"></section>
  </div>`;
}

function bindBookOverviewContentEvents(className = state.bookClassName, options = {}) {
  const rootSelector = options.rootSelector || "#bookOverviewContent";
  const rerender = options.rerender || renderBookOverview;
  const returnPage = options.returnPage || "book-overview";
  const root = $(rootSelector);
  if (!root) return;

  root.querySelector("[data-book-catalog-unit-filter]")?.addEventListener("click", (event) => {
    const menu = root.querySelector("#bookCatalogFilterMenu");
    if (!menu) return;
    const trigger = event.currentTarget;
    menu.innerHTML = `<div class="column-filter-options book-catalog-unit-filter-options">
      <label class="filter-check-row"><input type="radio" name="bookCatalogUnitFilter" value="all" ${state.bookOverviewUnit === "all" ? "checked" : ""} /><span>全部</span></label>
      ${BOOK_CATALOG_GROUPS.map((group) => `<label class="filter-check-row"><input type="radio" name="bookCatalogUnitFilter" value="${group.code}" ${state.bookOverviewUnit === group.code ? "checked" : ""} /><span>${group.code}</span></label>`).join("")}
    </div><div class="column-filter-actions"><button type="button" data-book-catalog-unit-clear>清除筛选</button><button type="button" data-book-catalog-unit-apply>确定</button></div>`;
    const rect = trigger.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - 264))}px`;
    menu.style.top = `${rect.bottom + 6}px`;
    menu.classList.remove("hidden");
    menu.querySelector("[data-book-catalog-unit-clear]").addEventListener("click", () => {
      state.bookOverviewUnit = "all";
      rerender();
    });
    menu.querySelector("[data-book-catalog-unit-apply]").addEventListener("click", () => {
      state.bookOverviewUnit = menu.querySelector('[name="bookCatalogUnitFilter"]:checked')?.value || "all";
      rerender();
    });
  });
  root.querySelectorAll("[data-book-catalog-sort]").forEach((button) => button.addEventListener("click", () => {
    const key = button.dataset.bookCatalogSort;
    if (state.bookCatalogSortKey === key) state.bookCatalogSortDirection = state.bookCatalogSortDirection === "asc" ? "desc" : "asc";
    else {
      state.bookCatalogSortKey = key;
      state.bookCatalogSortDirection = key === "latest" ? "desc" : "asc";
    }
    rerender();
  }));
  const studentSearch = root.querySelector("#bookOverviewStudentSearch");
  if (studentSearch) studentSearch.addEventListener("input", (event) => {
    state.bookOverviewStudentSearch = event.target.value;
    state.bookOverviewStudentSetPage = 1;
    rerender();
    requestAnimationFrame(() => { const input = root.querySelector("#bookOverviewStudentSearch"); input?.focus(); input?.setSelectionRange(input.value.length, input.value.length); });
  });
  root.querySelectorAll("[data-book-student]").forEach((button) => button.addEventListener("click", () => {
    state.bookOverviewStudentId = button.dataset.bookStudent || null;
    state.bookOverviewStudentSetPage = 1;
    rerender();
  }));
  root.querySelectorAll("[data-book-student-set-page]").forEach((button) => button.addEventListener("click", () => {
    if (button.disabled) return;
    state.bookOverviewStudentSetPage = Number(button.dataset.bookStudentSetPage) || 1;
    rerender();
  }));
  root.querySelectorAll("[data-book-student-metric]").forEach((button) => button.addEventListener("click", () => {
    state.bookOverviewStudentMetric = button.dataset.bookStudentMetric;
    rerender();
  }));
  root.querySelectorAll("[data-book-overview-set-metric]").forEach((button) => button.addEventListener("click", () => {
    state.bookOverviewSetMetric = button.dataset.bookOverviewSetMetric;
    rerender();
  }));
  root.querySelectorAll("[data-book-knowledge-unit]").forEach((button) => button.addEventListener("click", () => {
    state.bookKnowledgeUnit = button.dataset.bookKnowledgeUnit || "all";
    state.bookKnowledgeSetId = "all";
    rerender();
  }));
  root.querySelectorAll("[data-book-knowledge-set-filter]").forEach((button) => button.addEventListener("click", () => {
    state.bookKnowledgeSetId = button.dataset.bookKnowledgeSetFilter || "all";
    rerender();
  }));
  root.querySelectorAll("[data-book-knowledge-view-all]").forEach((button) => button.addEventListener("click", () => {
    showAppNotice(`${button.dataset.bookKnowledgeViewAll || "知识点"}查看全部功能待开发`, "info");
  }));
  root.querySelectorAll("[data-book-student-detail]").forEach((button) => button.addEventListener("click", () => {
    showAppNotice("作答详情弹窗将在下一步细化，本次先保留入口样式。", "info");
  }));
  root.querySelector("[data-book-overview-back-to-sets]")?.addEventListener("click", () => {
    state.bookOverviewSetDetailId = null;
    state.bookOverviewSetDetailStudentId = null;
    rerender();
  });
  root.querySelectorAll("[data-book-overview-set-detail-tab]").forEach((button) => button.addEventListener("click", () => {
    state.bookOverviewSetDetailTab = button.dataset.bookOverviewSetDetailTab;
    rerender();
  }));
  root.querySelectorAll("[data-book-mistake-unit]").forEach((button) => button.addEventListener("click", () => {
    state.bookOverviewMistakeUnit = button.dataset.bookMistakeUnit;
    state.bookOverviewMistakeSetId = "all";
    state.currentPage = 1;
    rerender();
  }));
  root.querySelectorAll("[data-book-mistake-set]").forEach((button) => button.addEventListener("click", () => {
    state.bookOverviewMistakeSetId = button.dataset.bookMistakeSet;
    state.currentPage = 1;
    rerender();
  }));
  root.querySelectorAll("[data-book-overview-unit]").forEach((button) => {
    button.addEventListener("click", () => {
      state.bookOverviewUnit = button.dataset.bookOverviewUnit;
      state.bookOverviewSelectedSetId = "all";
      state.bookOverviewSetDetailId = null;
      state.bookOverviewSetDetailStudentId = null;
      rerender();
    });
  });
  root.querySelectorAll("[data-book-overview-set-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.bookOverviewSelectedSetId = button.dataset.bookOverviewSetFilter;
      state.bookOverviewSetDetailId = null;
      state.bookOverviewSetDetailStudentId = null;
      rerender();
    });
  });
  root.querySelectorAll("[data-book-overview-open-set]").forEach((button) => {
    button.addEventListener("click", () => {
      const set = bookCatalogDisplaySet(button.dataset.bookOverviewOpenSet);
      if (!set) {
        showAppNotice("当前套题暂无可展示数据。", "warning");
        return;
      }
      state.bookOverviewTab = "catalog";
      const catalogSet = catalogSetRecord(button.dataset.bookOverviewOpenSet);
      state.bookOverviewUnit = catalogSet?.group?.code || state.bookOverviewUnit;
      state.bookOverviewSelectedSetId = Number(button.dataset.bookOverviewOpenSet);
      state.bookOverviewSetDetailId = Number(button.dataset.bookOverviewOpenSet);
      state.bookOverviewSetDetailTab = "overview";
      state.bookOverviewSetDetailStudentId = null;
      state.bookOverviewSetStudentPage = 1;
      state.bookOverviewSetQuestionPage = 1;
      rerender();
    });
  });
  root.querySelectorAll("[data-book-overview-full-set]").forEach((button) => {
    button.addEventListener("click", () => {
      const catalogSet = catalogSetRecord(Number(button.dataset.bookOverviewFullSet));
      const set = catalogSet && bookAssignmentSetRecord(catalogSet);
      if (!set?.questions.length) return;
      const ids = set.questions.map((question) => question.id);
      const focus = button.dataset.bookOverviewFullQuestion || ids[0];
      openFull(ids, focus, returnPage, { order: "natural", keepScopeOrder: true, setName: catalogSet.name });
    });
  });
  root.querySelectorAll("[data-book-overview-play-set]").forEach((button) => {
    button.addEventListener("click", () => {
      const catalogSet = catalogSetRecord(Number(button.dataset.bookOverviewPlaySet));
      const set = catalogSet && bookAssignmentSetRecord(catalogSet);
      if (!set?.questions.length) return;
      const ids = set.questions.map((question) => question.id);
      openFull(ids, ids[0], returnPage, {
        order: "natural",
        keepScopeOrder: true,
        setName: catalogSet.name,
        audioOnly: true,
      });
    });
  });
  root.querySelectorAll("[data-book-catalog-select]").forEach((control) => control.addEventListener("click", () => {
    const setId = Number(control.dataset.bookCatalogSelect);
    if (state.bookSelectedSetIds.has(setId)) state.bookSelectedSetIds.delete(setId);
    else state.bookSelectedSetIds.add(setId);
    rerender();
  }));
  root.querySelector("[data-book-catalog-select-all]")?.addEventListener("change", (event) => {
    const filteredSets = allBookCatalogSets()
      .filter((set) => state.bookOverviewUnit === "all" || set.group.code === state.bookOverviewUnit)
      .filter((set) => state.bookOverviewSelectedSetId === "all" || Number(set.setId) === Number(state.bookOverviewSelectedSetId));
    filteredSets.forEach((set) => event.target.checked ? state.bookSelectedSetIds.add(Number(set.setId)) : state.bookSelectedSetIds.delete(Number(set.setId)));
    rerender();
  });
  root.querySelectorAll("[data-book-catalog-scan]").forEach((button) => button.addEventListener("click", () => {
    const catalogSet = catalogSetRecord(Number(button.dataset.bookCatalogScan));
    showAppNotice(`“${catalogSet?.name || "当前套题"}”扫描答题卡页面暂未开发，本次仅展示入口交互。`, "info");
  }));
  root.querySelector("#bookCatalogBatchAssignmentAction")?.addEventListener("click", (event) => {
    if (event.currentTarget.disabled) return;
    openBookCatalogBatchPublish();
  });
  root.querySelectorAll("[data-book-catalog-assign]").forEach((button) => button.addEventListener("click", () => {
    openBookCatalogSetPublish(button.dataset.bookCatalogAssign);
  }));
}

function selectedTeacherClasses() {
  const selected = TEACHER_CLASSES.filter((item) => state.classManagementClasses.has(item.id));
  if (selected.length) return selected;
  state.classManagementClasses.add(DEFAULT_CLASS);
  return [TEACHER_CLASSES[0]];
}

function filteredClassStudents() {
  const query = state.studentSearch.trim().toLowerCase();
  return selectedTeacherClasses()
    .flatMap((classInfo) => CLASS_STUDENTS[classInfo.id] || [])
    .filter((student) => !query || student.name.toLowerCase().includes(query));
}

function classManagementStudent(studentId) {
  return selectedTeacherClasses()
    .flatMap((classInfo) => CLASS_STUDENTS[classInfo.id] || [])
    .find((student) => student.id === studentId) || null;
}

function renderClassPage() {
  if (!$("#studentClassFilterOptions") || !$("#studentRows")) return;
  const selectedClasses = selectedTeacherClasses();
  const visibleStudents = filteredClassStudents();
  const allClassesSelected = selectedClasses.length === TEACHER_CLASSES.length;
  const rosterScopeLabel = allClassesSelected ? "全部班级" : selectedClasses[0].name;
  $("#studentRosterTitle").textContent = `学生名单（${rosterScopeLabel}）`;
  $("#studentClassFilterSummary").textContent = allClassesSelected ? "全选" : selectedClasses[0].name;
  const totalStudentCount = TEACHER_CLASSES.reduce((sum, item) => sum + item.studentCount, 0);
  const allOption = `<label class="student-class-filter-option">
    <input type="radio" name="studentClassFilterChoice" value="all" data-student-class-filter ${allClassesSelected ? "checked" : ""} />
    <span>全选</span><small>${totalStudentCount}人</small>
  </label>`;
  const classOptions = TEACHER_CLASSES.map((item) => {
    const selected = !allClassesSelected && state.classManagementClasses.has(item.id);
    return `<label class="student-class-filter-option">
      <input type="radio" name="studentClassFilterChoice" value="${item.id}" data-student-class-filter ${selected ? "checked" : ""} />
      <span>${item.name}</span><small>${item.studentCount}人</small>
    </label>`;
  }).join("");
  $("#studentClassFilterOptions").innerHTML = allOption + classOptions;
  $("#studentRows").innerHTML = visibleStudents.map((student) => {
    return `<tr>
      <td><code>${student.account}</code></td>
      <td><code>${student.studentNo}</code></td>
      <td><span class="student-class-name">${student.className}（${student.cohort}）</span></td>
      <td><div class="student-name-cell"><strong>${student.name}</strong></div></td>
      <td><button type="button" class="student-level-button" data-student-trend="${student.id}" aria-label="${student.name}的听力等级，功能敬请期待"><span>Lv.${student.listeningLevel}</span></button></td>
      <td><div class="student-row-actions"><button type="button" data-edit-student="${student.id}">修改</button><button type="button" data-reset-password="${student.id}">重置密码</button></div></td>
    </tr>`;
  }).join("");
  const empty = visibleStudents.length === 0;
  $(".student-table-wrap").classList.toggle("hidden", empty);
  $("#studentEmptyState").classList.toggle("hidden", !empty);
  hydrateIcons();
}

function classRosterExportTimestamp(date = new Date()) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${mi}`;
}

function safeExportFilename(name) {
  return String(name).replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "");
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function exportClassRoster(format) {
  const selectedClasses = selectedTeacherClasses();
  const rows = selectedClasses.flatMap((classInfo) => CLASS_STUDENTS[classInfo.id] || []);
  const classLabel = selectedClasses.map((item) => item.id).join("、");
  const filenameClassLabel = selectedClasses.map((item) => item.id).join("_");
  const rosterRows = rows.map((student) => [student.account, student.studentNo, `${student.className}（${student.cohort}）`, student.name]);
  const header = ["登录账号", "学号", "班级", "姓名"];
  if (format === "text") {
    await copyTextToClipboard([header, ...rosterRows].map((row) => row.join("，")).join("\n"));
    $("#studentExportMenu")?.removeAttribute("open");
    showAppNotice(`已复制${classLabel}共 ${rows.length} 名学生名单。`, "success");
    return;
  }
  const tableRows = [header, ...rosterRows]
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");
  const filename = safeExportFilename(`${state.teacherSchool}${filenameClassLabel}学生名单_${classRosterExportTimestamp()}`);
  const blob = new Blob([`\ufeff<table>${tableRows}</table>`], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
  $("#studentExportMenu")?.removeAttribute("open");
  showAppNotice(`已导出${classLabel}共 ${rows.length} 名学生。`, "success");
}

function openStudentEdit(student) {
  state.editingStudentId = student.id;
  $("#studentEditName").value = student.name;
  $("#studentEditNo").value = student.studentNo;
  $("#studentEditError").textContent = "";
  $("#studentEditDialog").classList.remove("hidden");
  requestAnimationFrame(() => $("#studentEditName").focus());
}

function closeStudentEdit() {
  state.editingStudentId = null;
  $("#studentEditDialog").classList.add("hidden");
  $("#studentEditError").textContent = "";
}

function saveStudentEdit(event) {
  event.preventDefault();
  const student = classManagementStudent(state.editingStudentId);
  if (!student) return closeStudentEdit();
  const name = $("#studentEditName").value.trim();
  const studentNo = $("#studentEditNo").value.trim();
  const duplicate = Object.values(CLASS_STUDENTS).flat().some((item) => item.id !== student.id && item.studentNo === studentNo);
  const error = !name ? "请输入学生姓名。"
    : !/^\d{7}$/.test(studentNo) ? "学号需为 7 位数字。"
      : duplicate ? "该学号已被其他学生使用。" : "";
  if (error) {
    $("#studentEditError").textContent = error;
    return;
  }
  student.name = name;
  student.studentNo = studentNo;
  student.account = `YMJO${studentNo}`;
  closeStudentEdit();
  renderClassPage();
  showAppNotice("学生姓名和学号已更新。", "success");
}

function bindClassEvents() {
  $("#studentExportMenu")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-student-export]");
    if (!button) return;
    event.preventDefault();
    exportClassRoster(button.dataset.studentExport).catch(() => {
      $("#studentExportMenu")?.removeAttribute("open");
      showAppNotice("导出失败，请稍后重试。", "error");
    });
  });
  $("#studentClassFilterOptions").addEventListener("change", (event) => {
    const input = event.target.closest("[data-student-class-filter]");
    if (!input?.checked) return;
    if (input.value !== "all" && state.studentSearch) {
      state.studentSearch = "";
      $("#studentSearch").value = "";
    }
    state.classManagementClasses = input.value === "all"
      ? new Set(TEACHER_CLASSES.map((item) => item.id))
      : new Set([input.value]);
    renderClassPage();
  });
  $("#studentSearch").addEventListener("input", (event) => {
    state.studentSearch = event.target.value;
    if (state.studentSearch.trim()) {
      state.classManagementClasses = new Set(TEACHER_CLASSES.map((item) => item.id));
    }
    renderClassPage();
  });
  $("#clearStudentFilters").addEventListener("click", () => {
    state.studentSearch = "";
    $("#studentSearch").value = "";
    renderClassPage();
  });
  $("#studentRows").addEventListener("click", (event) => {
    const trendButton = event.target.closest("[data-student-trend]");
    if (trendButton) {
      showAppNotice("敬请期待", "info");
      return;
    }
    const editButton = event.target.closest("[data-edit-student]");
    if (editButton) {
      const student = classManagementStudent(editButton.dataset.editStudent);
      if (student) openStudentEdit(student);
      return;
    }
    const button = event.target.closest("[data-reset-password]");
    if (!button) return;
    const student = classManagementStudent(button.dataset.resetPassword);
    if (!student) return;
    openAppDialog({
      title: "重置学生 APP 密码",
      message: `将把${student.name}（账号 ${student.account}）的学生 APP 密码重置为默认密码 123456，原密码会立即失效。`,
      confirmText: "重置密码",
      danger: true,
      onConfirm: () => completePasswordReset(student),
    });
  });
  $$("[data-student-edit-close]").forEach((button) => button.addEventListener("click", closeStudentEdit));
  $("#studentEditForm").addEventListener("submit", saveStudentEdit);
  $$("[data-book-assignment-close]").forEach((button) => button.addEventListener("click", closeBookAssignmentDialog));
  $("#assignmentClassList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-assignment-class]");
    if (!button) return;
    state.assignmentClassId = button.dataset.assignmentClass;
    renderBookAssignmentTargets();
  });
  $("#assignmentStudentGrid").addEventListener("change", (event) => {
    const input = event.target.closest("[data-assignment-student]");
    if (!input) return;
    if (input.checked) state.assignmentStudentIds.add(input.dataset.assignmentStudent);
    else state.assignmentStudentIds.delete(input.dataset.assignmentStudent);
    renderBookAssignmentTargets();
  });
  $("#assignmentSelectClass").addEventListener("change", (event) => {
    const currentStudents = CLASS_STUDENTS[state.assignmentClassId] || [];
    currentStudents.forEach((student) => {
      if (event.target.checked) state.assignmentStudentIds.add(student.id);
      else state.assignmentStudentIds.delete(student.id);
    });
    renderBookAssignmentTargets();
  });
  $("#confirmBookAssignment").addEventListener("click", createBookAssignment);
}

function completePasswordReset(student) {
  const temporaryPassword = "123456";
  student.passwordResetAt = "刚刚重置密码";
  state.lastResetPassword = temporaryPassword;
  $("#passwordResetStudent").textContent = student.name;
  $("#passwordResetAccount").textContent = student.account;
  $("#passwordResetValue").textContent = temporaryPassword;
  $("#passwordResetDialog").classList.remove("hidden");
  renderClassPage();
  requestAnimationFrame(() => $("#copyResetPassword").focus());
}

function closePasswordResetDialog() {
  $("#passwordResetDialog").classList.add("hidden");
}

function openBookAssignmentDialog({ questionsOnly = false } = {}) {
  const selectedSets = questionsOnly ? [] : selectedBookAssignmentSets();
  if (!state.bookSelectedQuestionIds.size && !selectedSets.length) {
    showAppNotice(questionsOnly ? "请先将试题加入试题篮。" : "请先选择需要布置的套题。", "warning");
    return;
  }
  state.bookAssignmentSource = questionsOnly ? "questions" : "sets";
  state.assignmentClassId = state.bookClassName;
  state.assignmentStudentIds.clear();
  renderBookAssignmentTargets();
  const questionCount = selectedSets.length ? selectedSets.reduce((total, set) => total + set.questions.length, 0) : state.bookSelectedQuestionIds.size;
  $("#bookAssignmentSummary").textContent = selectedSets.length
    ? `已选 ${selectedSets.length} 套 · ${questionCount} 题，请选择布置对象。`
    : `${activeBookCatalogDisplaySet()?.setName || "当前套题"} · 已选 ${questionCount} 题，请选择布置对象。`;
  $("#bookAssignmentDialog").classList.remove("hidden");
  requestAnimationFrame(() => $("#assignmentClassList [data-assignment-class]")?.focus());
}

function closeBookAssignmentDialog() {
  $("#bookAssignmentDialog").classList.add("hidden");
}

function renderBookAssignmentTargets() {
  const currentClass = TEACHER_CLASSES.find((item) => item.id === state.assignmentClassId) || TEACHER_CLASSES[0];
  const students = CLASS_STUDENTS[currentClass.id] || [];
  $("#assignmentClassList").innerHTML = TEACHER_CLASSES.map((item) => {
    const selectedCount = (CLASS_STUDENTS[item.id] || []).filter((student) => state.assignmentStudentIds.has(student.id)).length;
    return `<button type="button" class="${item.id === currentClass.id ? "active" : ""}" data-assignment-class="${item.id}">
      <span><strong>${item.name}</strong><small>${item.studentCount} 人</small></span><em>${selectedCount ? `已选 ${selectedCount}` : "未选择"}</em><i data-icon="arrow-right"></i>
    </button>`;
  }).join("");
  $("#assignmentStudentClass").textContent = currentClass.name;
  $("#assignmentStudentGrid").innerHTML = students.map((student) => `
    <label class="${state.assignmentStudentIds.has(student.id) ? "selected" : ""}">
      <input type="checkbox" data-assignment-student="${student.id}" ${state.assignmentStudentIds.has(student.id) ? "checked" : ""} />
      <span></span><b>${student.name}</b><small>${student.studentNo}</small>
    </label>`).join("");
  const selectedInClass = students.filter((student) => state.assignmentStudentIds.has(student.id)).length;
  $("#assignmentSelectClass").checked = selectedInClass === students.length && students.length > 0;
  $("#assignmentSelectClass").indeterminate = selectedInClass > 0 && selectedInClass < students.length;
  const selectedStudents = Object.values(CLASS_STUDENTS).flat().filter((student) => state.assignmentStudentIds.has(student.id));
  const selectedClassCount = TEACHER_CLASSES.filter((item) => (CLASS_STUDENTS[item.id] || []).some((student) => state.assignmentStudentIds.has(student.id))).length;
  $("#assignmentSelectedCount").textContent = `本班已选 ${selectedInClass} 人`;
  $("#assignmentTargetSummary").textContent = selectedStudents.length ? `已选 ${selectedStudents.length} 人 · ${selectedClassCount} 个班级` : "请选择至少 1 名学生";
  $("#confirmBookAssignment").disabled = selectedStudents.length === 0;
  hydrateIcons();
}

function createBookAssignment() {
  const selectedStudents = Object.values(CLASS_STUDENTS).flat().filter((student) => state.assignmentStudentIds.has(student.id));
  if (!selectedStudents.length) {
    showAppNotice("请至少选择 1 名学生。", "warning");
    return;
  }
  const selectedSets = state.bookAssignmentSource === "questions" ? [] : selectedBookAssignmentSets();
  const selectedQuestions = selectedSets.length
    ? selectedSets.flatMap((set) => set.questions)
    : state.questions.filter((question) => state.bookSelectedQuestionIds.has(question.id));
  const activeSet = activeBookCatalogDisplaySet();
  const classes = TEACHER_CLASSES.filter((item) => (CLASS_STUDENTS[item.id] || []).some((student) => state.assignmentStudentIds.has(student.id))).map((item) => item.id);
  const tasks = loadTasks();
  tasks.unshift({
    id: `task-${Date.now()}`,
    name: `${selectedSets.length > 1 ? `${selectedSets.length}套听力训练` : String(activeSet?.setName || selectedSets[0]?.setName || "校本套题").replace("听力训练", "训练")} · 校本作业`,
    type: "schoolbook",
    responseMode: "app",
    classes,
    studentIds: selectedStudents.map((student) => student.id),
    studentNames: selectedStudents.map((student) => student.name),
    questions: selectedQuestions.map((question) => ({ id: question.id, questionNo: question.questionNo, setId: question.setId, textNo: question.textNo })),
    bookName: "听力进阶 高一上",
    setName: selectedSets.length > 1 ? `${selectedSets.length} 套题` : activeSet?.setName || selectedSets[0]?.setName || "校本套题",
    gradingStatus: "pending",
    updatedAt: new Date().toISOString(),
  });
  saveTasks(tasks);
  closeBookAssignmentDialog();
  syncRoute("work");
  showAppNotice(`作业已生成并推送给 ${selectedStudents.length} 名学生。`, "success");
}

function catalogSetRecord(setId) {
  for (const group of BOOK_CATALOG_GROUPS) {
    const set = group.sets.find((item) => item.setId === Number(setId));
    if (set) return { ...set, group };
  }
  return null;
}

function shortCatalogSetName(catalogSet) {
  const name = String(catalogSet?.name || "").trim();
  return name.match(/听力训练[（(][^）)]+[）)]/)?.[0] || name;
}

function bookCatalogClassActivity(catalogSet, className = state.bookClassName, graded = false) {
  const total = CLASS_STUDENTS[className]?.length || 40;
  if (!graded) return { answered: 0, total, percent: 0, latest: "--" };
  const classOffset = Math.max(0, TEACHER_CLASSES.findIndex((item) => item.id === className));
  const setOffset = Math.max(0, Number(catalogSet.setId) - 14255);
  const answered = Math.max(1, Math.min(total, total - ((classOffset * 7 + setOffset * 5) % 13)));
  const day = String(2 + classOffset + setOffset).padStart(2, "0");
  const minute = String(38 + (setOffset * 7 + classOffset * 3) % 20).padStart(2, "0");
  return {
    answered,
    total,
    percent: Math.round(answered / total * 100),
    latest: `2026-08-${day} 08:${minute}`,
  };
}

function renderBookDetail() {
  if (!state.questions.length || !$("#bookSetList")) return;
  renderBookCatalog();
  $("#bookDetailHeaderClassSelect").value = state.bookClassName;
  const showingWorkspace = state.bookDetailView === "workspace";
  $("#bookCatalogView").classList.remove("hidden");
  $("#bookQuestionFilters").classList.toggle("hidden", !showingWorkspace || state.bookWorkspaceTab !== "questions");
  $("#bookSetWorkspace").classList.toggle("hidden", !showingWorkspace);
  $("#bookQuestionAudioBar").classList.toggle("hidden", !showingWorkspace || state.bookWorkspaceTab !== "questions");
  if (showingWorkspace && state.bookWorkspaceTab !== "questions") resetBookQuestionAudio();
  $("#bookDetailTabs").querySelectorAll("[data-book-workbench-tab]").forEach((button) => {
    const active = button.dataset.bookWorkbenchTab === "compose";
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  if (!showingWorkspace) {
    hydrateIcons();
    return;
  }

  const activeSet = activeBookCatalogDisplaySet();
  const catalogSet = catalogSetRecord(state.bookActiveSetId);
  if (!activeSet || !catalogSet) {
    state.bookDetailView = "catalog";
    state.bookActiveSetId = null;
    renderBookDetail();
    return;
  }
  $("#bookClassSelect").value = state.bookClassName;
  $("#bookClassSwitch").innerHTML = TEACHER_CLASSES.map((item) => `<button type="button" class="${item.id === state.bookClassName ? "active" : ""}" data-book-class-switch="${item.id}" role="tab" aria-selected="${item.id === state.bookClassName}">${item.name}</button>`).join("");
  $$("[data-book-data-tab]").forEach((button) => {
    const active = button.dataset.bookDataTab === state.bookDataTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $("#bookQuestionsView").classList.toggle("hidden", state.bookWorkspaceTab !== "questions");
  $("#bookDataView").classList.toggle("hidden", state.bookWorkspaceTab !== "data");
  syncBookQuestionFilters();
  if (state.bookWorkspaceTab === "questions") renderBookQuestionSelection(activeSet);
  else renderBookDataPanel(activeSet);
  hydrateIcons();
}

function selectedBookAssignmentSets() {
  return allBookCatalogSets()
    .filter((set) => state.bookSelectedSetIds.has(Number(set.setId)))
    .map((set) => bookAssignmentSetRecord(set));
}

function bookAssignmentSetRecord(set) {
  const source = bookCatalogDisplaySet(set);
  return source ? { ...source, setId: Number(set.setId), setName: set.name } : null;
}

const BOOK_SPECIAL_POINT_OPTIONS = [
  ["2", "数字与计算"],
  ["3", "地点与去向"],
  ["4", "人物与事件"],
  ["5", "请求与建议"],
  ["6", "方式与方法"],
  ["7", "原因与目的"],
  ["8", "谈话背景/谈话者关系、身份"],
  ["9", "谈话者观点/态度"],
  ["10", "主旨与要义"],
  ["11", "其他"],
];

const BOOK_SPECIAL_TOPIC_OPTIONS = [
  ["topic-rent", "租房"],
  ["topic-travel", "旅行"],
  ["topic-traffic", "交通"],
  ["topic-holiday", "节假日活动"],
  ["topic-people", "周围的人"],
  ["topic-environment", "周围的环境"],
  ["topic-work", "工作与职业"],
  ["topic-shopping", "购物"],
  ["topic-hobby", "兴趣与爱好"],
  ["topic-entertainment", "文娱"],
  ["topic-sports", "运动"],
  ["topic-food", "饮食"],
  ["topic-health", "健康"],
  ["topic-weather", "天气"],
  ["topic-school", "学校生活"],
  ["topic-daily", "日常生活"],
  ["topic-other", "其他"],
];

const BOOK_SPECIAL_GENRE_OPTIONS = [
  ["genre-narrative", "叙述类"],
  ["genre-practical", "应用类"],
  ["genre-speech", "演说类"],
  ["genre-news", "新闻报道类"],
];

function bookSpecialSecondaryFilterConfig(type) {
  if (type === "长对话") return { label: "话题", options: BOOK_SPECIAL_TOPIC_OPTIONS, kind: "topic" };
  if (type === "独白") return { label: "体裁", options: BOOK_SPECIAL_GENRE_OPTIONS, kind: "genre" };
  return { label: "考点", options: BOOK_SPECIAL_POINT_OPTIONS, kind: "point" };
}

function fakeBookSpecialTopic(question) {
  return BOOK_SPECIAL_TOPIC_OPTIONS[(Number(question.questionNo) + Number(question.textNo || 0)) % BOOK_SPECIAL_TOPIC_OPTIONS.length][0];
}

function fakeBookSpecialGenre(question) {
  return BOOK_SPECIAL_GENRE_OPTIONS[(Number(question.questionNo) + Number(question.textNo || 0)) % BOOK_SPECIAL_GENRE_OPTIONS.length][0];
}

function bookSpecialSecondaryMatched(question) {
  if (state.bookQuestionPointFilter === "all") return true;
  const activeType = state.bookQuestionTypeFilters.size === 1 ? [...state.bookQuestionTypeFilters][0] : question.questionType;
  const config = bookSpecialSecondaryFilterConfig(activeType);
  if (config.kind === "topic") return fakeBookSpecialTopic(question) === state.bookQuestionPointFilter;
  if (config.kind === "genre") return fakeBookSpecialGenre(question) === state.bookQuestionPointFilter;
  return String(question.examPointId || "") === String(state.bookQuestionPointFilter);
}

function renderBookCatalog() {
  const activeGroup = BOOK_CATALOG_GROUPS.find((group) => group.code === state.bookCatalogGroupCode) || BOOK_CATALOG_GROUPS[0];
  state.bookCatalogGroupCode = activeGroup.code;
  const activeSpecialType = state.bookQuestionTypeFilters.size === 1 ? [...state.bookQuestionTypeFilters][0] : "短对话";
  const secondaryConfig = bookSpecialSecondaryFilterConfig(activeSpecialType);
  const typeFilterRow = `<div class="book-selector-row book-special-selector-row">
      <span>题型</span>
      <div class="book-question-chip-options book-catalog-type-options" role="radiogroup" aria-label="按题型筛选专项题目">
        <button type="button" data-book-question-type-choice="all" aria-pressed="true">全部</button>
        <button type="button" data-book-question-type-choice="短对话" aria-pressed="false">短对话</button>
        <button type="button" data-book-question-type-choice="长对话" aria-pressed="false">长对话</button>
        <button type="button" data-book-question-type-choice="独白" aria-pressed="false">独白</button>
      </div>
    </div>`;
  const secondaryFilterRow = `<div class="book-selector-row book-special-selector-row">
      <span>${secondaryConfig.label}</span>
      <div class="book-question-chip-options book-catalog-point-options" role="radiogroup" aria-label="按考点筛选专项题目">
        <button type="button" data-book-question-point="all" aria-pressed="true">全部</button>
        ${secondaryConfig.options.map(([key, label]) => `<button type="button" data-book-question-point="${key}" aria-pressed="false">${label}</button>`).join("")}
      </div>
    </div>`;
  const setSelectorRows = `<div class="book-selector-row">
      <span>单元</span>
      <div class="book-unit-options" role="tablist" aria-label="选择单元">
        ${BOOK_CATALOG_GROUPS.map((group) => `<button type="button" class="${group.code === activeGroup.code ? "active" : ""}" data-book-group="${group.code}" role="tab" aria-selected="${group.code === activeGroup.code}">${group.code}</button>`).join("")}
      </div>
    </div>
    <div class="book-selector-row">
      <span>套题</span>
      <div class="book-set-options" aria-label="${activeGroup.code}套题">
        ${activeGroup.sets.map((set) => {
          const shortName = set.name.replace(new RegExp(`^${activeGroup.code}\\s*`), "");
          const active = state.bookDetailView === "workspace" && Number(state.bookActiveSetId) === set.setId;
          return `<button type="button" class="${active ? "active" : ""}" data-book-set-open="${set.setId}" aria-pressed="${active}" title="${set.name}">${shortName}</button>`;
        }).join("")}
      </div>
    </div>`;
  $("#bookQuestionModeTabs").innerHTML = `
    <button type="button" class="${state.bookQuestionMode === "sets" ? "active" : ""}" data-book-question-mode="sets" role="tab" aria-selected="${state.bookQuestionMode === "sets"}">套题</button>
    <button type="button" class="${state.bookQuestionMode === "special" ? "active" : ""}" data-book-question-mode="special" role="tab" aria-selected="${state.bookQuestionMode === "special"}">专项</button>
  `;
  $("#bookSetList").innerHTML = `<div class="book-direct-selector">
    ${state.bookQuestionMode === "special" ? `${typeFilterRow}${secondaryFilterRow}` : setSelectorRows}
  </div>`;
  $("#bookQuestionModeTabs").querySelectorAll("[data-book-question-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.bookQuestionMode = button.dataset.bookQuestionMode === "special" ? "special" : "sets";
      if (state.bookQuestionMode === "special" && state.bookQuestionTypeFilters.size === 0) {
        state.bookQuestionTypeFilters = new Set(["短对话", "长对话", "独白"]);
      }
      if (state.bookDetailView !== "workspace") {
        const firstSet = activeGroup.sets[0];
        if (firstSet) {
          state.bookActiveSetId = firstSet.setId;
          state.bookDetailView = "workspace";
        }
      }
      renderBookDetail();
    });
  });
  $("#bookSetList").querySelectorAll("[data-book-question-type-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.bookQuestionTypeChoice;
      state.bookQuestionTypeFilters = type === "all"
        ? new Set(["短对话", "长对话", "独白"])
        : new Set([type]);
      state.bookQuestionPointFilter = "all";
      renderBookDetail();
      hydrateIcons();
    });
  });
  $("#bookSetList").querySelectorAll("[data-book-question-point]").forEach((button) => {
    button.addEventListener("click", () => {
      state.bookQuestionPointFilter = button.dataset.bookQuestionPoint || "all";
      const activeSet = activeBookCatalogDisplaySet();
      if (activeSet) renderBookQuestionSelection(activeSet);
      else syncBookQuestionFilters();
      hydrateIcons();
    });
  });
  $("#bookSetList").querySelectorAll("[data-book-group]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.bookGroup === state.bookCatalogGroupCode) return;
      state.bookCatalogGroupCode = button.dataset.bookGroup;
      const nextGroup = BOOK_CATALOG_GROUPS.find((group) => group.code === state.bookCatalogGroupCode);
      state.bookActiveSetId = Number(nextGroup?.sets?.[0]?.setId || 14255);
      state.bookDetailView = "workspace";
      resetBookQuestionAudio();
      renderBookDetail();
    });
  });
  $("#bookSetList").querySelectorAll("[data-book-set-open]:not(:disabled)").forEach((button) => {
    button.addEventListener("click", () => {
      state.bookActiveSetId = Number(button.dataset.bookSetOpen);
      state.bookDetailView = "workspace";
      resetBookQuestionAudio();
      renderBookDetail();
    });
  });
}

function bookOrderedQuestionGroups(set) {
  const groups = new Map();
  set.questions
    .filter((question) => {
      if (state.bookQuestionMode !== "special") return true;
      const typeMatched = state.bookQuestionTypeFilters.has(question.questionType);
      const pointMatched = bookSpecialSecondaryMatched(question);
      return typeMatched && pointMatched;
    })
    .forEach((question) => {
      if (!groups.has(question.textNo)) groups.set(question.textNo, []);
      groups.get(question.textNo).push(question);
    });
  const orderedGroups = [...groups.entries()].map(([textNo, questions]) => {
    const orderedQuestions = [...questions].sort((a, b) => Number(a.questionNo) - Number(b.questionNo));
    return [textNo, orderedQuestions];
  });
  const sortKey = state.bookQuestionSortKey;
  orderedGroups.sort((a, b) => {
    if (sortKey === "questionNo") return Number(a[1][0]?.questionNo || 0) - Number(b[1][0]?.questionNo || 0);
    return bookGroupSortRate(a[1], sortKey) - bookGroupSortRate(b[1], sortKey)
      || Number(a[1][0]?.questionNo || 0) - Number(b[1][0]?.questionNo || 0);
  });
  return orderedGroups;
}

function bookLectureQuestionIds(set) {
  return bookOrderedQuestionGroups(set).flatMap(([, questions]) => questions.map((question) => question.id));
}

function renderBookQuestionSelection(set) {
  const orderedGroups = bookOrderedQuestionGroups(set);
  const visibleQuestions = orderedGroups.flatMap(([, questions]) => questions);
  const previousActiveQuestionId = state.bookActiveQuestionId;
  if (!visibleQuestions.some((question) => question.id === state.bookActiveQuestionId)) {
    state.bookActiveQuestionId = visibleQuestions[0]?.id || null;
  }
  if (previousActiveQuestionId && previousActiveQuestionId !== state.bookActiveQuestionId) resetBookQuestionAudio();
  $("#bookQuestionCards").innerHTML = orderedGroups.length ? orderedGroups.map(([textNo, questions]) => `
    <section class="book-text-question-group" data-book-text-group="${textNo}">
      <header>
        <div><span>Text ${textNo}</span><strong>${questions[0]?.questionType || "听力理解"}</strong><small>${questions.length} 题</small></div>
        <div class="book-text-group-actions"><button type="button" data-book-text-group-toggle="${textNo}" aria-pressed="${questions.every((question) => state.bookSelectedQuestionIds.has(question.id))}"><span data-icon="cart"></span>${questions.every((question) => state.bookSelectedQuestionIds.has(question.id)) ? "取消本段全选" : "本段全选"}</button></div>
      </header>
      ${questions.map((question) => {
        const selected = state.bookSelectedQuestionIds.has(question.id);
        const classResult = bookQuestionResult(question, state.bookClassName, true);
        const nationalRateValue = Number(question.nationalRate);
        const hasNationalRate = question.nationalRate !== null && question.nationalRate !== undefined && Number.isFinite(nationalRateValue);
        return `<article class="book-question-card ${selected ? "selected" : ""}" data-book-question-audio="${textNo}" data-book-question-card="${question.id}">
          <div class="book-question-copy">
            <div class="book-question-heading">
              <h4>${escapeHtml(question.stem)}</h4>
              <div class="book-question-meta" aria-label="题目考点与正答率">
                <div class="book-question-meta-row is-point"><span>考点</span><strong>${escapeHtml(examPointLabel(question))}</strong></div>
                <div class="book-question-meta-row is-rate ${classResult.total ? `book-rate-${classResult.rate < 70 ? "low" : classResult.rate < 100 ? "mid" : "perfect"}` : "book-rate-missing"}"><span>班级正答率</span><strong>${classResult.total ? formatBookRate(classResult.rate) : "--"}</strong></div>
                <div class="book-question-meta-row is-rate ${hasNationalRate ? `book-rate-${nationalRateValue < 70 ? "low" : nationalRateValue < 100 ? "mid" : "perfect"}` : "book-rate-missing"}"><span>全国正答率</span><strong>${hasNationalRate ? formatBookRate(nationalRateValue) : "--"}</strong></div>
              </div>
            </div>
            <ul>${question.options.map((option) => `<li>${escapeHtml(option.text)}</li>`).join("")}</ul>
          </div>
          <div class="book-question-actions row-actions" aria-label="题目操作">
            <button type="button" class="link-button ${selected ? "selected" : ""}" data-book-question-toggle="${question.id}" aria-pressed="${selected}"><span data-icon="cart"></span>${selected ? "移出试题篮" : "加入试题篮"}</button>
          </div>
        </article>`;
      }).join("")}
      ${state.bookTranscriptVisible ? renderBookTextTranscript(questions[0]) : ""}
    </section>`).join("") : `<div class="book-question-empty"><span data-icon="filter"></span><strong>暂无符合条件的题目</strong><p>可切换专项题型或考点后继续查看。</p></div>`;
  $("#bookQuestionCards").querySelectorAll("[data-book-text-group-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const questions = orderedGroups.find(([textNo]) => String(textNo) === button.dataset.bookTextGroupToggle)?.[1] || [];
      const allSelected = questions.length > 0 && questions.every((question) => state.bookSelectedQuestionIds.has(question.id));
      questions.forEach((question) => allSelected ? state.bookSelectedQuestionIds.delete(question.id) : state.bookSelectedQuestionIds.add(question.id));
      saveBookBasket();
      renderBookQuestionSelection(set);
      hydrateIcons();
    });
  });
  $("#bookQuestionCards").querySelectorAll("[data-book-question-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.bookQuestionToggle;
      if (state.bookSelectedQuestionIds.has(id)) state.bookSelectedQuestionIds.delete(id);
      else state.bookSelectedQuestionIds.add(id);
      saveBookBasket();
      renderBookQuestionSelection(set);
      hydrateIcons();
    });
  });
  $("#bookQuestionCards").querySelectorAll("[data-book-question-audio]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, input")) return;
      state.bookActiveQuestionId = card.dataset.bookQuestionCard;
      playBookQuestionText(set, Number(card.dataset.bookQuestionAudio), true);
    });
  });
  $("#bookQuestionCards").querySelectorAll("[data-book-transcript-segment]").forEach((segment) => {
    segment.addEventListener("click", (event) => {
      event.stopPropagation();
      playBookTranscriptSegment(Number(segment.dataset.setId), Number(segment.dataset.textNo), Number(segment.dataset.start), Number(segment.dataset.end));
    });
    segment.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      playBookTranscriptSegment(Number(segment.dataset.setId), Number(segment.dataset.textNo), Number(segment.dataset.start), Number(segment.dataset.end));
    });
  });
  $("#bookQuestionCards").querySelectorAll("[data-book-transcript-speaker]").forEach((speaker) => {
    speaker.addEventListener("click", (event) => {
      event.stopPropagation();
      playBookTranscriptSegment(Number(speaker.dataset.setId), Number(speaker.dataset.textNo), Number(speaker.dataset.start), Number(speaker.dataset.end));
    });
  });
  renderBookBasket();
  syncBookQuestionFilters();
  updateBookQuestionAudioControls();
}

function bookQuestionSortRate(question, sortKey = state.bookQuestionSortKey) {
  if (sortKey === "nationalRate") {
    if (question.nationalRate === null || question.nationalRate === undefined) return Number.POSITIVE_INFINITY;
    const nationalRate = Number(question.nationalRate);
    return Number.isFinite(nationalRate) ? nationalRate : Number.POSITIVE_INFINITY;
  }
  return classCorrectRateExact(question, state.bookClassName);
}

function bookGroupSortRate(questions, sortKey = state.bookQuestionSortKey) {
  if (!questions.length) return Number.POSITIVE_INFINITY;
  return Math.min(...questions.map((question) => bookQuestionSortRate(question, sortKey)));
}

function syncBookQuestionFilters() {
  $("#toggleBookTranscript").checked = state.bookTranscriptVisible;
  $(".book-transcript-switch").classList.toggle("active", state.bookTranscriptVisible);
  $("#bookQuestionFilters").dataset.mode = state.bookQuestionMode;
  $$("[data-book-question-mode]").forEach((button) => {
    const active = button.dataset.bookQuestionMode === state.bookQuestionMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-selected", String(active));
  });
  $$("[data-book-question-point]").forEach((button) => {
    const active = String(button.dataset.bookQuestionPoint) === String(state.bookQuestionPointFilter);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $$("[data-book-question-type-choice]").forEach((button) => {
    const type = button.dataset.bookQuestionTypeChoice;
    const active = type === "all"
      ? state.bookQuestionTypeFilters.size === 3
      : state.bookQuestionTypeFilters.size === 1 && state.bookQuestionTypeFilters.has(type);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $$("[data-book-question-sort]").forEach((button) => {
    const active = button.dataset.bookQuestionSort === state.bookQuestionSortKey;
    button.checked = active;
  });
}

function renderBookTextTranscript(question) {
  const segments = transcriptSegmentsForQuestion(question);
  if (!segments.length) return `<div class="book-text-transcript"><p>暂无录音稿。</p></div>`;
  return `<div class="book-text-transcript" aria-label="Text ${question.textNo} 录音稿">
    ${groupMaterialSegments(segments).map((group) => {
      const firstSegment = group.segments[0] || {};
      const lastSegment = group.segments[group.segments.length - 1] || firstSegment;
      return `<div class="editor-speaker-paragraph">
      <button type="button" class="speaker ${speakerClassName(group.speaker)}" data-book-transcript-speaker data-set-id="${question.setId}" data-text-no="${question.textNo}" data-start="${Number(firstSegment.start || 0)}" data-end="${Number(lastSegment.end || lastSegment.start || 0)}" title="播放${group.speaker}当前完整话轮" aria-label="播放${group.speaker}当前完整话轮">${group.speaker}</button>
      <p>${group.segments.map((segment) => `<span class="paper-transcript-segment" role="button" tabindex="0" data-book-transcript-segment data-set-id="${question.setId}" data-text-no="${question.textNo}" data-start="${Number(segment.start || 0)}" data-end="${Number(segment.end || segment.start || 0)}">${escapeHtml(segment.text)}</span>`).join(" ")}</p>
    </div>`;
    }).join("")}
  </div>`;
}

function selectedBookQuestions() {
  return bookSets()
    .flatMap((set) => set.questions)
    .filter((question) => state.bookSelectedQuestionIds.has(question.id))
    .sort((a, b) => a.setId - b.setId || a.questionNo - b.questionNo);
}

function renderBookBasket() {
  const selected = selectedBookQuestions();
  $("#bookBasketCount").textContent = `${selected.length} 题`;
  $("#bookBasketClearAll").disabled = selected.length === 0;
  const basketGroups = ["短对话", "长对话", "独白"].map((type) => [type, selected.filter((question) => question.questionType === type)]).filter(([, questions]) => questions.length);
  const unmatched = selected.filter((question) => !["短对话", "长对话", "独白"].includes(question.questionType));
  if (unmatched.length) basketGroups.push(["其他", unmatched]);
  $("#bookBasketItems").innerHTML = selected.length ? basketGroups.map(([type, questions]) => `
    <section class="book-basket-group ${state.bookBasketExpandedTypes.has(type) ? "expanded" : ""}" data-book-basket-group="${type}">
      <header>
        <button type="button" data-book-basket-toggle-type="${type}" aria-expanded="${state.bookBasketExpandedTypes.has(type)}"><span data-icon="chevron-down"></span><strong>${type}</strong><small>${questions.length} 题</small></button>
        <button type="button" data-book-basket-clear-type="${type}">清空</button>
      </header>
      <div class="book-basket-group-body">
      ${questions.map((question) => {
        const basketLabel = `${question.setName.replace(/^B3U\d+\s*/, "")} · 第 ${question.questionNo} 题 · Text ${question.textNo}`;
        return `<article>
        <button type="button" data-book-basket-jump="${question.id}" title="${escapeHtml(basketLabel)}"><span class="book-basket-question-label">${escapeHtml(basketLabel)}</span></button>
        <button type="button" data-book-basket-remove="${question.id}" title="移出试题篮"><span data-icon="x"></span></button>
      </article>`;
      }).join("")}
      </div>
    </section>`).join("") : `<div class="book-basket-empty"><span data-icon="cart"></span><strong>试题篮为空</strong></div>`;
  $("#bookBasketItems").querySelectorAll("[data-book-basket-toggle-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.bookBasketToggleType;
      if (state.bookBasketExpandedTypes.has(type)) state.bookBasketExpandedTypes.delete(type);
      else state.bookBasketExpandedTypes.add(type);
      renderBookBasket();
      hydrateIcons();
    });
  });
  $("#bookBasketItems").querySelectorAll("[data-book-basket-clear-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.bookBasketClearType;
      selected.filter((question) => question.questionType === type || (type === "其他" && !["短对话", "长对话", "独白"].includes(question.questionType))).forEach((question) => state.bookSelectedQuestionIds.delete(question.id));
      state.bookBasketExpandedTypes.delete(type);
      saveBookBasket();
      const activeSet = activeBookCatalogDisplaySet();
      if (activeSet) renderBookQuestionSelection(activeSet);
      else renderBookBasket();
      hydrateIcons();
    });
  });
  $("#bookBasketItems").querySelectorAll("[data-book-basket-jump]").forEach((button) => {
    button.addEventListener("click", () => jumpToBookBasketQuestion(button.dataset.bookBasketJump));
  });
  $("#bookBasketItems").querySelectorAll("[data-book-basket-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      state.bookSelectedQuestionIds.delete(button.dataset.bookBasketRemove);
      saveBookBasket();
      const activeSet = activeBookCatalogDisplaySet();
      if (activeSet) renderBookQuestionSelection(activeSet);
      else renderBookBasket();
      hydrateIcons();
    });
  });
  const disabled = selected.length === 0;
  ["#bookPaperAction", "#bookDictationAction", "#bookQuestionAssignmentAction"].forEach((selector) => {
    $(selector).disabled = disabled;
  });
}

function jumpToBookBasketQuestion(questionId) {
  const question = state.questions.find((item) => item.id === questionId);
  if (!question) return;
  const catalog = catalogSetRecord(question.setId);
  state.bookCatalogGroupCode = catalog?.group.code || state.bookCatalogGroupCode;
  state.bookActiveSetId = Number(question.setId);
  state.bookDetailView = "workspace";
  state.bookWorkspaceTab = "questions";
  state.bookQuestionTypeFilters = new Set(["短对话", "长对话", "独白"]);
  renderBookDetail();
  requestAnimationFrame(() => {
    const card = document.querySelector(`[data-book-question-card="${CSS.escape(questionId)}"]`);
    card?.scrollIntoView({ block: "center", behavior: "smooth" });
    card?.classList.add("locating");
    window.setTimeout(() => card?.classList.remove("locating"), 900);
  });
}

function openBookQuestionFull(questionId) {
  const activeSet = activeBookCatalogDisplaySet();
  const activeQuestion = activeSet?.questions.find((item) => item.id === String(questionId));
  const question = activeQuestion || state.questions.find((item) => item.id === String(questionId));
  if (!question) return;
  const lectureSet = activeQuestion ? activeSet : bookSets().find((item) => item.setId === question.setId);
  if (!lectureSet) return;
  state.bookActiveQuestionId = question.id;
  bookQuestionAudio.pause();
  openFull(bookLectureQuestionIds(lectureSet), question.id, "book-detail", {
    order: state.bookQuestionSortKey === "questionNo" ? "natural" : "rate",
    keepScopeOrder: true,
    setName: activeQuestion ? activeSet.setName : "",
  });
}

function setBookQuestionAudioSource(set, textNo) {
  const key = `${set.setId}-${textNo}`;
  if (bookQuestionAudio.dataset.key === key) return;
  bookQuestionAudio.pause();
  bookQuestionAudio.dataset.key = key;
  bookQuestionAudio.dataset.setId = String(set.setId);
  bookQuestionAudio.dataset.textNo = String(textNo);
  bookQuestionAudio.src = materialAudioURL({ setId: set.setId, bookKey: set.bookKey, textNo: Number(textNo) });
}

function playBookQuestionText(set, textNo, restart) {
  const sameSource = bookQuestionAudio.dataset.key === `${set.setId}-${textNo}`;
  state.bookTranscriptSegmentEnd = null;
  setBookQuestionAudioSource(set, textNo);
  if (restart || !sameSource) bookQuestionAudio.currentTime = 0;
  if (!restart && sameSource && !bookQuestionAudio.paused) bookQuestionAudio.pause();
  else bookQuestionAudio.play().catch(updateBookQuestionAudioControls);
  updateBookQuestionAudioControls();
}

function playBookTranscriptSegment(setId, textNo, start, end) {
  const set = bookSets().find((item) => item.setId === Number(setId));
  if (!set || !Number.isFinite(start)) return;
  const question = set.questions.find((item) => item.textNo === Number(textNo));
  if (question) state.bookActiveQuestionId = question.id;
  setBookQuestionAudioSource(set, textNo);
  state.bookTranscriptSegmentEnd = Number.isFinite(end) && end > start ? end : null;
  bookQuestionAudio.currentTime = start;
  bookQuestionAudio.play().catch(updateBookQuestionAudioControls);
  updateBookQuestionAudioControls();
}

function stopBookTranscriptSegmentIfNeeded() {
  if (!Number.isFinite(state.bookTranscriptSegmentEnd)) return;
  if (bookQuestionAudio.currentTime >= state.bookTranscriptSegmentEnd) {
    bookQuestionAudio.pause();
    state.bookTranscriptSegmentEnd = null;
  }
}

function updateBookQuestionAudioControls() {
  const bar = $("#bookQuestionAudioBar");
  if (!bar) return;
  const toggle = $("#bookQuestionAudioToggle");
  const seek = $("#bookQuestionAudioSeek");
  const time = $("#bookQuestionAudioTime");
  const title = $("#bookQuestionAudioTitle");
  const meta = $("#bookQuestionAudioMeta");
  const hasSource = Boolean(bookQuestionAudio.dataset.key);
  const set = hasSource ? bookSets().find((item) => item.setId === Number(bookQuestionAudio.dataset.setId)) : null;
  const textNo = Number(bookQuestionAudio.dataset.textNo);
  const question = set?.questions.find((item) => item.textNo === textNo);
  const fallbackDuration = question ? Number(findTimecode(question)?.segments?.at(-1)?.end || 0) : 0;
  const duration = hasSource && Number.isFinite(bookQuestionAudio.duration) ? bookQuestionAudio.duration : fallbackDuration;
  const current = hasSource ? bookQuestionAudio.currentTime : 0;
  toggle.disabled = !hasSource;
  seek.disabled = !hasSource;
  seek.max = String(Math.max(0.01, duration || 0.01));
  seek.value = String(Math.min(current, duration || current));
  time.textContent = `${formatAudioTime(current)} / ${formatAudioTime(duration)}`;
  title.textContent = hasSource ? `Text ${textNo} · ${question?.questionType || "听力材料"}` : "点击题目播放录音";
  const activeSet = activeBookCatalogDisplaySet();
  const displaySetName = activeSet && Number(activeSet.sourceSetId || activeSet.setId) === Number(set?.setId)
    ? activeSet.setName
    : set?.setName || "";
  meta.textContent = hasSource ? displaySetName : "";
  const icon = toggle.querySelector("[data-icon]");
  icon.dataset.icon = hasSource && !bookQuestionAudio.paused ? "pause" : "play";
  bar.classList.toggle("playing", hasSource && !bookQuestionAudio.paused);
  hydrateIcons();
}

function resetBookQuestionAudio() {
  bookQuestionAudio.pause();
  bookQuestionAudio.removeAttribute("src");
  bookQuestionAudio.dataset.key = "";
  bookQuestionAudio.dataset.setId = "";
  bookQuestionAudio.dataset.textNo = "";
  state.bookActiveQuestionId = null;
  bookQuestionAudio.load();
  updateBookQuestionAudioControls();
}

function bookStudentCorrectForQuestion(question, className, studentIndex) {
  const result = classResultForQuestion(question, className);
  if (!result.total) return false;
  const rank = (studentIndex * 11 + Number(question.questionNo) * 7 + Number(question.textNo) * 3 + Number(question.setId)) % result.total;
  return rank < result.correctCount;
}

function bookStudentAnswerForQuestion(question, className, studentIndex) {
  if (bookStudentCorrectForQuestion(question, className, studentIndex)) return question.answerKey;
  const wrongOptions = question.options.map((option) => option.key).filter((key) => key !== question.answerKey);
  if (!wrongOptions.length) return question.answerKey;
  return wrongOptions[(studentIndex + Number(question.questionNo) + Number(question.textNo)) % wrongOptions.length];
}

function bookStudentRows(set, className = state.bookClassName, forceGraded = null) {
  const graded = forceGraded === null ? bookSetIsGraded(set.setId, className) : Boolean(forceGraded);
  const students = CLASS_STUDENTS[className] || [];
  if (!graded) return students.map((student, index) => ({
    ...student,
    index,
    correctCount: 0,
    score: null,
    uploadTime: "--",
    graded: false,
  }));
  return students.map((student, index) => {
    const correctCount = set.questions.filter((question) => bookStudentCorrectForQuestion(question, className, index)).length;
    const score = normalizeBookScore(correctCount * 30 / Math.max(1, set.questions.length));
    const minute = String(38 + (index * 7) % 20).padStart(2, "0");
    const second = String((index * 13 + Number(set.setId)) % 60).padStart(2, "0");
    return {
      ...student,
      index,
      correctCount,
      score,
      uploadTime: `2026-08-02 08:${minute}:${second}`,
      graded: true,
    };
  });
}

function bookScoreDistribution(rows) {
  const bins = [
    { label: "0-6", min: 0, max: 6 },
    { label: "7-12", min: 7, max: 12 },
    { label: "13-18", min: 13, max: 18 },
    { label: "19-24", min: 19, max: 24 },
    { label: "25-30", min: 25, max: 30 },
  ];
  return bins.map((bin) => ({
    ...bin,
    count: rows.filter((row) => Number.isFinite(row.score) && row.score >= bin.min && row.score <= bin.max).length,
  }));
}

function bookOptionStats(question, className = state.bookClassName) {
  const students = CLASS_STUDENTS[className] || [];
  const counts = new Map(question.options.map((option) => [option.key, 0]));
  const choices = new Map(question.options.map((option) => [option.key, []]));
  students.forEach((student, index) => {
    const answer = bookStudentAnswerForQuestion(question, className, index);
    counts.set(answer, (counts.get(answer) || 0) + 1);
    if (!choices.has(answer)) choices.set(answer, []);
    choices.get(answer).push(student);
  });
  return question.options.map((option) => ({
    key: option.key,
    count: counts.get(option.key) || 0,
    percent: students.length ? (counts.get(option.key) || 0) / students.length * 100 : 0,
    correct: option.key === question.answerKey,
    students: (choices.get(option.key) || []).slice().sort((a, b) => String(a.studentNo).localeCompare(String(b.studentNo), "zh-Hans-CN", { numeric: true })),
  }));
}

let activeBookOptionNode = null;
let activeBookAttemptNode = null;

function getBookOptionStudentTooltip() {
  let tooltip = $("#bookOptionStudentTooltip");
  if (tooltip) return tooltip;
  tooltip = document.createElement("div");
  tooltip.id = "bookOptionStudentTooltip";
  tooltip.className = "book-option-student-tooltip hidden";
  tooltip.setAttribute("role", "tooltip");
  document.body.append(tooltip);
  return tooltip;
}

function positionBookOptionStudentTooltip(x, y) {
  const tooltip = getBookOptionStudentTooltip();
  const gap = 14;
  const rect = tooltip.getBoundingClientRect();
  const left = Math.max(12, Math.min(x + gap, window.innerWidth - rect.width - 12));
  const preferredTop = y + gap;
  const top = preferredTop + rect.height <= window.innerHeight - 12
    ? preferredTop
    : Math.max(12, y - rect.height - gap);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function showBookOptionStudents(node, pointer = null) {
  const question = state.questions.find((item) => item.id === node.dataset.bookOptionQuestion);
  const optionKey = node.dataset.bookOptionKey;
  const className = node.dataset.bookOptionClass || state.bookClassName;
  const option = question ? bookOptionStats(question, className).find((item) => item.key === optionKey) : null;
  if (!option) return;
  const tooltip = getBookOptionStudentTooltip();
  const columnCount = Math.max(1, Math.min(3, Math.ceil(option.students.length / 20)));
  const rowsPerColumn = Math.ceil(option.students.length / columnCount);
  const columns = Array.from({ length: columnCount }, (_, index) => option.students.slice(index * rowsPerColumn, (index + 1) * rowsPerColumn));
  tooltip.dataset.columns = String(columnCount);
  delete tooltip.dataset.mode;
  tooltip.innerHTML = `<strong>${escapeHtml(optionKey)} 选项 · ${option.students.length} 人</strong><div class="book-option-student-columns">${option.students.length
    ? columns.map((students) => `<div class="book-option-student-column">${students.map((student) => `<span><b>${escapeHtml(student.studentNo)}</b><em>${escapeHtml(student.name)}</em></span>`).join("")}</div>`).join("")
    : "<small>暂无学生选择此项</small>"}</div>`;
  tooltip.classList.remove("hidden");
  activeBookOptionNode = node;
  if (pointer) positionBookOptionStudentTooltip(pointer.clientX, pointer.clientY);
  else {
    const rect = node.getBoundingClientRect();
    positionBookOptionStudentTooltip(rect.right, rect.bottom);
  }
}

function hideBookOptionStudents() {
  activeBookOptionNode = null;
  $("#bookOptionStudentTooltip")?.classList.add("hidden");
}

function attemptHistoryForSeed(seed = 0, rate = 60) {
  const base = Math.round(Number(rate) || 60);
  return [0, 1, 2].map((_, index) => ({
    time: `2026-08-${String(2 + index * 2).padStart(2, "0")} 08:${String(24 + ((seed + index * 7) % 30)).padStart(2, "0")}`,
    rate: `${Math.max(0, Math.min(100, base - 8 + index * 4))}%`,
    score: formatBookScore(Math.max(0, Math.min(100, base - 8 + index * 4)) / 100 * 30),
    duration: `${20 + ((Number(seed) + index * 5) % 11)}分钟${index === 1 ? "30秒" : ""}`,
  }));
}

function latestAttemptDuration(seed = 0, rate = 60) {
  return attemptHistoryForSeed(seed, rate).at(-1)?.duration || "30分钟";
}

function latestAttemptTime(seed = 0, rate = 60) {
  return attemptHistoryForSeed(seed, rate).at(-1)?.time || "--";
}

function showBookAttemptHistory(node, pointer = null) {
  const rate = Number(node.dataset.bookAttemptRate || 0);
  const seed = Number(node.dataset.bookAttemptSeed || 0);
  const metric = node.dataset.bookAttemptMetric || "rate";
  const metricTitle = metric === "score" ? "作答得分变化" : "作答正答率变化";
  const metricLabel = metric === "score" ? "得分" : "正答率";
  const rows = attemptHistoryForSeed(seed, rate);
  const tooltip = getBookOptionStudentTooltip();
  tooltip.dataset.columns = "1";
  tooltip.dataset.mode = "attempt-history";
  tooltip.innerHTML = `<strong>${metricTitle} · ${rows.length} 次</strong><div class="book-attempt-history"><header><b>作答时间</b><b>${metricLabel}</b><b>作答时长</b></header>${rows.map((row) => `<span><b>${escapeHtml(row.time)}</b><em>${escapeHtml(metric === "score" ? row.score : row.rate)}</em><i>${escapeHtml(row.duration)}</i></span>`).join("")}</div>`;
  tooltip.classList.remove("hidden");
  activeBookAttemptNode = node;
  if (pointer) positionBookOptionStudentTooltip(pointer.clientX, pointer.clientY);
  else {
    const rect = node.getBoundingClientRect();
    positionBookOptionStudentTooltip(rect.right, rect.bottom);
  }
}

function hideBookAttemptHistory() {
  activeBookAttemptNode = null;
  $("#bookOptionStudentTooltip")?.classList.add("hidden");
}

function bindBookOptionStudentTooltip() {
  document.addEventListener("pointerover", (event) => {
    if (!(event.target instanceof Element)) return;
    const node = event.target.closest("[data-book-option-question]");
    if (!node || node.contains(event.relatedTarget)) return;
    showBookOptionStudents(node, event);
  });
  document.addEventListener("pointerover", (event) => {
    if (!(event.target instanceof Element)) return;
    const node = event.target.closest("[data-book-attempt-history]");
    if (!node || node.contains(event.relatedTarget)) return;
    showBookAttemptHistory(node, event);
  });
  document.addEventListener("pointermove", (event) => {
    if (activeBookOptionNode) positionBookOptionStudentTooltip(event.clientX, event.clientY);
    if (activeBookAttemptNode) positionBookOptionStudentTooltip(event.clientX, event.clientY);
  });
  document.addEventListener("pointerout", (event) => {
    if (!(event.target instanceof Element)) return;
    const node = event.target.closest("[data-book-option-question]");
    if (!node || node.contains(event.relatedTarget)) return;
    hideBookOptionStudents();
  });
  document.addEventListener("pointerout", (event) => {
    if (!(event.target instanceof Element)) return;
    const node = event.target.closest("[data-book-attempt-history]");
    if (!node || node.contains(event.relatedTarget)) return;
    hideBookAttemptHistory();
  });
  document.addEventListener("focusin", (event) => {
    if (event.target instanceof Element && event.target.matches("[data-book-option-question]")) showBookOptionStudents(event.target);
    if (event.target instanceof Element && event.target.matches("[data-book-attempt-history]")) showBookAttemptHistory(event.target);
  });
  document.addEventListener("focusout", (event) => {
    if (event.target instanceof Element && event.target.matches("[data-book-option-question]")) hideBookOptionStudents();
    if (event.target instanceof Element && event.target.matches("[data-book-attempt-history]")) hideBookAttemptHistory();
  });
}

function bookSetRateBand(rate) {
  const value = Number(rate) || 0;
  if (value >= 70) return "ok";
  if (value >= 65) return "warn";
  if (value >= 60) return "risk";
  return "danger";
}

function disposeBookDataCharts() {
  bookDataChartInstances.forEach((chart) => chart.dispose());
  bookDataChartInstances.clear();
}

function initBookDataChart(id, option) {
  const element = document.getElementById(id);
  if (!element || !window.echarts) return null;
  const chart = window.echarts.init(element, null, { renderer: "svg" });
  chart.setOption(option);
  bookDataChartInstances.set(id, chart);
  return chart;
}

function mountBookDataOverviewCharts(set, metrics, rows, graded, context = {}) {
  if (!window.echarts) return;
  const distribution = bookScoreDistribution(rows);
  const distributionColors = ["#ff5f57", "#ff8a2a", "#f6bd16", "#46c86f", "#3d82f6"];
  initBookDataChart("bookDataScoreDistributionChart", {
    animationDuration: 650,
    aria: { enabled: true, description: "学生得分分布" },
    grid: { left: 44, right: 18, top: 28, bottom: 42 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (params) => `${params[0].axisValue}<br/>${params[0].value} 人` },
    xAxis: {
      type: "category",
      data: distribution.map((item) => `${item.label}分`),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#dfe7f2" } },
      axisLabel: { color: "#66758b", fontSize: 12, margin: 14 },
    },
    yAxis: {
      type: "value",
      min: 0,
      minInterval: 1,
      axisLabel: { color: "#718198", fontSize: 11 },
      splitLine: { lineStyle: { color: "#e8eef6", type: "dashed" } },
    },
    series: [{
      type: "bar",
      barWidth: 34,
      data: distribution.map((item, index) => ({ value: graded ? item.count : 0, itemStyle: { color: distributionColors[index] } })),
      itemStyle: { borderRadius: [5, 5, 0, 0] },
      emphasis: { itemStyle: { opacity: .82 } },
      label: { show: true, position: "top", distance: 8, color: "#263854", fontSize: 12, fontWeight: 700 },
    }],
  });

  const questionRates = set.questions.map((question) => {
    const result = bookQuestionResult(question, context.className || state.bookClassName, Boolean(context.forceClass));
    return { question, rate: graded ? result.rate : 0 };
  });
  const averageRate = Number(metrics.rate) || 0;
  const rateBarColor = new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: "rgba(40, 122, 244, .76)" },
    { offset: 1, color: "rgba(185, 210, 251, .42)" },
  ]);
  initBookDataChart("bookDataQuestionRateChart", {
    animationDuration: 650,
    aria: { enabled: true, description: "整套题各题班级正答率" },
    grid: { left: 48, right: 78, top: 34, bottom: 42 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (params) => `第 ${params[0].axisValue} 题<br/>班级正答率 ${Number(params[0].value).toFixed(2)}%` },
    xAxis: {
      type: "category",
      data: questionRates.map((item) => item.question.questionNo),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#dfe7f2" } },
      axisLabel: { color: "#66758b", fontSize: 11, margin: 12 },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      interval: 20,
      axisLabel: { color: "#718198", fontSize: 11, formatter: "{value}%" },
      splitLine: { lineStyle: { color: "#e8eef6", type: "dashed" } },
    },
    series: [
      {
        name: "班级正答率",
        type: "bar",
        z: 3,
        barMaxWidth: 24,
        data: questionRates.map((item) => ({ value: item.rate, itemStyle: { color: rateBarColor } })),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: "top", distance: 7, color: "#51647f", fontSize: 10, formatter: (params) => `${Number(params.value).toFixed(1)}%` },
      },
      {
        name: "套题正答率",
        type: "line",
        z: 1,
        silent: true,
        symbol: "none",
        data: questionRates.map(() => averageRate),
        lineStyle: { color: "#f0445b", width: 3, type: "solid" },
        endLabel: {
          show: true,
          formatter: () => `${Number(averageRate).toFixed(2)}%`,
          color: "#d92d46",
          fontWeight: 700,
          distance: 8,
        },
        labelLayout: { moveOverlap: "shiftY" },
      },
    ],
  });
}

function renderBookDataOverview(set, metrics, rows, graded, context = {}) {
  const reviewed = rows.filter((row) => row.graded).length;
  const pending = Math.max(0, rows.length - reviewed);
  const scores = rows.map((row) => row.score).filter(Number.isFinite);
  const averageScore = scores.length ? normalizeBookScore(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const maxScore = scores.length ? Math.max(...scores) : 0;
  const minScore = scores.length ? Math.min(...scores) : 0;
  const fullScoreCount = rows.filter((row) => row.score === 30).length;
  return `
    <div class="book-data-overview">
      <div class="book-review-line"><span data-icon="check-filled"></span><strong>已批改 ${reviewed}/${rows.length}</strong>${pending ? `<em>未批改 ${pending} 人</em>` : ""}</div>
      <section class="book-data-chart-card book-score-overview-card">
        <div class="book-score-summary">
          <div class="book-data-card-title"><strong>得分概况</strong></div>
          <div class="book-score-grid">
            <div><span>平均分</span><strong>${graded ? formatBookScoreValue(averageScore) : "--"}</strong></div>
            <div><span>最高分</span><strong>${graded ? maxScore.toFixed(1) : "--"}</strong></div>
            <div><span>最低分</span><strong>${graded ? minScore.toFixed(1) : "--"}</strong></div>
            <div><span>满分人数</span><strong>${graded ? `${fullScoreCount} 人` : "--"}</strong></div>
          </div>
        </div>
        <div class="book-score-distribution">
          <div class="book-data-card-title"><strong>学生得分分布</strong></div>
          <div id="bookDataScoreDistributionChart" class="book-data-echart" role="img" aria-label="学生得分分布柱状图"></div>
        </div>
      </section>
      <section class="book-data-chart-card">
        <div class="book-data-card-title">
          <strong>整套题正答率</strong>
          <span class="book-rate-summary">套题正答率：${graded ? `${Number(metrics.rate).toFixed(1)}%` : "--"}</span>
        </div>
        <div id="bookDataQuestionRateChart" class="book-data-echart is-rate" role="img" aria-label="整套题各题班级正答率"></div>
      </section>
    </div>`;
}

function renderBookDataStudents(set, rows, graded, context = {}) {
  const pageSize = 10;
  const questionTotal = set.questions.length;
  const sorted = [...rows].sort((a, b) => String(a.studentNo).localeCompare(String(b.studentNo), "zh-Hans-CN", { numeric: true }));
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageKey = context.studentPageKey || "bookStudentDataPage";
  state[pageKey] = Math.min(Math.max(1, state[pageKey]), pageCount);
  const start = (state[pageKey] - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);
  return `<div class="book-data-table-card">
    <table class="book-student-data">
      <thead><tr><th>学号</th><th>姓名</th><th>得分</th><th>最新作答时长</th><th>最新作答时间</th><th>操作</th></tr></thead>
      <tbody>
        ${pageRows.map((row) => {
          const rowGraded = graded && row.graded !== false;
          const rate = questionTotal ? (Number(row.correctCount) || 0) / questionTotal * 100 : null;
          const score = formatBookScore(row.score);
          return `<tr class="${context.highlightStudentId === row.id ? "is-highlighted-student" : ""}">
          <td>${escapeHtml(row.studentNo)}</td>
          <td><strong>${escapeHtml(row.name)}</strong></td>
          <td>${rowGraded && rate !== null ? `<button type="button" class="book-attempt-rate" data-book-attempt-history data-book-attempt-metric="score" data-book-attempt-rate="${Math.round(rate)}" data-book-attempt-seed="${escapeHtml(row.studentNo)}">${score}（作答3次）</button>` : "--"}</td>
          <td>${rowGraded && rate !== null ? latestAttemptDuration(row.studentNo, Math.round(rate)) : "--"}</td>
          <td>${rowGraded && rate !== null ? latestAttemptTime(row.studentNo, Math.round(rate)) : "--"}</td>
          <td><div class="book-table-actions"><button type="button" data-book-data-action="作答详情"><span data-icon="detail"></span>作答详情</button></div></td>
        </tr>`;
        }).join("")}
      </tbody>
    </table>
    ${renderBookDataPager("students", state[pageKey], pageCount, sorted.length, pageSize)}
  </div>`;
}

function renderBookQuestionSortHeader(key, label) {
  const active = state.bookOverviewQuestionSortKey === key;
  const direction = active ? state.bookOverviewQuestionSortDirection : "none";
  return `<button type="button" class="book-question-sort-trigger ${active ? "active" : ""}" data-book-question-sort="${key}" aria-label="按${label}${active && direction === "asc" ? "升序" : "降序"}排列">
    <span>${label}</span><i class="sort-stepper" data-sort-state="${direction}" aria-hidden="true"><b></b><b></b></i>
  </button>`;
}

function renderBookDataQuestions(set, graded, context = {}) {
  const pageSize = 10;
  const className = context.className || state.bookClassName;
  const direction = state.bookOverviewQuestionSortDirection === "desc" ? -1 : 1;
  const questions = set.questions.map((question, sourceIndex) => {
    const classResult = classResultForQuestion(question, className);
    const classRate = classResult.total ? classResult.correctCount / classResult.total * 100 : 0;
    return { question, sourceIndex, classResult, classRate };
  }).sort((a, b) => {
    const first = state.bookOverviewQuestionSortKey === "classRate" ? a.classRate : Number(a.question.questionNo);
    const second = state.bookOverviewQuestionSortKey === "classRate" ? b.classRate : Number(b.question.questionNo);
    return (first - second) * direction || a.sourceIndex - b.sourceIndex;
  });
  const pageCount = Math.max(1, Math.ceil(questions.length / pageSize));
  const pageKey = context.questionPageKey || "bookQuestionDataPage";
  state[pageKey] = Math.min(Math.max(1, state[pageKey]), pageCount);
  const start = (state[pageKey] - 1) * pageSize;
  const pageQuestions = questions.slice(start, start + pageSize);
  return `<div class="book-data-table-card">
    <table class="book-question-data">
      <thead><tr><th>${renderBookQuestionSortHeader("questionNo", "题号")}</th><th>Text</th><th>题型</th><th>全国正答率</th><th>${renderBookQuestionSortHeader("classRate", "班级正答率")}</th><th>错误人数/班级人数</th><th>操作</th></tr></thead>
      <tbody>
        ${pageQuestions.map(({ question, classResult, classRate }) => {
          const hasNationalRate = question.nationalRate !== null && question.nationalRate !== undefined && Number.isFinite(Number(question.nationalRate));
          const nationalRateValue = hasNationalRate ? Number(question.nationalRate) : null;
          const wrongCount = Math.max(0, classResult.total - classResult.correctCount);
          return `<tr>
            <td>${question.questionNo}</td>
            <td>T${question.textNo}</td>
            <td>${escapeHtml(question.questionType || "--")}</td>
            <td>${hasNationalRate ? `<b class="book-table-rate ${nationalRateValue < 70 ? "low" : ""}">${formatBookRate(nationalRateValue)}</b>` : "<span class=\"muted\">--</span>"}</td>
            <td>${graded ? `<b class="book-table-rate ${classRate < 70 ? "low" : ""}">${formatBookRate(classRate)}</b>` : "<span class=\"muted\">未批改</span>"}</td>
            <td>${graded ? `<strong>${wrongCount}</strong><small>/ ${classResult.total}</small>` : "<span class=\"muted\">--</span>"}</td>
            <td><button type="button" data-book-question-full="${question.id}"><span data-icon="expand"></span>全屏讲解</button></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
    ${renderBookDataPager("questions", state[pageKey], pageCount, questions.length, pageSize)}
  </div>`;
}

function renderBookDataPager(type, page, pageCount, total, pageSize) {
  return `<footer class="book-data-pager" data-book-data-pager="${type}">
    <span>共 ${total} 条 · ${pageSize} 条/页</span>
    <div>
      <button type="button" data-book-data-page="${type}" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""} aria-label="上一页"><span data-icon="arrow-left"></span></button>
      ${Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => `<button type="button" class="${item === page ? "active" : ""}" data-book-data-page="${type}" data-page="${item}">${item}</button>`).join("")}
      <button type="button" data-book-data-page="${type}" data-page="${page + 1}" ${page >= pageCount ? "disabled" : ""} aria-label="下一页"><span data-icon="arrow-right"></span></button>
    </div>
  </footer>`;
}

function renderBookDataPanel(set, options = {}) {
  if (!set) return;
  disposeBookDataCharts();
  const className = options.className || state.bookClassName;
  const tab = options.tab || state.bookDataTab;
  const target = options.target || $("#bookDataContent");
  const forceClass = Boolean(options.forceClass);
  const studentPageKey = options.studentPageKey || "bookStudentDataPage";
  const questionPageKey = options.questionPageKey || "bookQuestionDataPage";
  const metrics = options.metrics || bookSetMetrics(set, className, forceClass);
  const graded = options.graded ?? metrics.graded;
  const rows = options.rows || bookStudentRows(set, className, options.forceGraded ?? null);
  const context = { className, forceClass, studentPageKey, questionPageKey, highlightStudentId: options.highlightStudentId || null };
  const content = tab === "students"
    ? renderBookDataStudents(set, rows, graded, context)
    : tab === "questions"
      ? renderBookDataQuestions(set, graded, context)
      : renderBookDataOverview(set, metrics, rows, graded, context);
  target.innerHTML = content;
  if (tab === "overview") mountBookDataOverviewCharts(set, metrics, rows, graded, context);
  target.querySelectorAll("[data-book-data-action]").forEach((button) => {
    button.addEventListener("click", () => showAppNotice(`${button.dataset.bookDataAction}弹窗将在下一步细化，本次先完成批改数据页结构。`, "info"));
  });
  target.querySelectorAll("[data-book-question-full]").forEach((button) => {
    button.addEventListener("click", () => {
      const ids = set.questions.map((question) => question.id);
      openFull(ids, button.dataset.bookQuestionFull, options.returnPage || "book-detail");
    });
  });
  target.querySelectorAll("[data-book-data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const page = Number(button.dataset.page);
      if (!Number.isFinite(page)) return;
      if (button.dataset.bookDataPage === "students") state[studentPageKey] = page;
      if (button.dataset.bookDataPage === "questions") state[questionPageKey] = page;
      renderBookDataPanel(set, options);
    });
  });
  target.querySelectorAll("[data-book-question-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextKey = button.dataset.bookQuestionSort;
      if (state.bookOverviewQuestionSortKey === nextKey) {
        state.bookOverviewQuestionSortDirection = state.bookOverviewQuestionSortDirection === "asc" ? "desc" : "asc";
      } else {
        state.bookOverviewQuestionSortKey = nextKey;
        state.bookOverviewQuestionSortDirection = nextKey === "questionNo" ? "asc" : "desc";
      }
      state[questionPageKey] = 1;
      renderBookDataPanel(set, options);
    });
  });
  hydrateIcons();
}

function prepareBookSelection() {
  const questions = state.questions.filter((question) => state.bookSelectedQuestionIds.has(question.id));
  if (!questions.length) return false;
  state.selectedIds = new Set(questions.map((question) => question.id));
  saveBasket();
  renderTable();
  renderBasket();
  return true;
}

function optionDistributionForQuestion(q) {
  const result = classResultForQuestion(q);
  const keys = q.options.map((option) => option.key);
  const correctKey = keys.includes(q.answerKey) ? q.answerKey : keys[0];
  const wrongKeys = keys.filter((key) => key !== correctKey);
  const wrongTotal = result.total - result.correctCount;
  const sourceWeights = new Map((q.optionDist || []).map((item) => [item.key, Number(item.percent) || 0]));
  const weightTotal = wrongKeys.reduce((sum, key) => sum + (sourceWeights.get(key) || 0), 0);
  const counts = new Map([[correctKey, result.correctCount]]);
  let allocated = 0;
  wrongKeys.forEach((key, index) => {
    if (index === wrongKeys.length - 1) {
      counts.set(key, wrongTotal - allocated);
      return;
    }
    const weight = weightTotal ? (sourceWeights.get(key) || 0) / weightTotal : 1 / wrongKeys.length;
    const count = Math.round(wrongTotal * weight);
    counts.set(key, count);
    allocated += count;
  });
  return keys.map((key) => {
    const count = counts.get(key) || 0;
    return {
      key,
      count,
      percent: result.total ? Math.round(count / result.total * 100) : 0,
    };
  });
}

function nationalOptionDistributionForQuestion(q) {
  if (q.realOnly && q.nationalOptionProportions) return q.options.map(option => ({ key: option.key, percent: Number(q.nationalOptionProportions[option.key]) }));
  const classDistribution = optionDistributionForQuestion(q);
  const nationalCorrectRate = Math.max(0, Math.min(100, Number(q.nationalRate) || 0));
  const wrongItems = classDistribution.filter((item) => item.key !== q.answerKey);
  const wrongClassTotal = wrongItems.reduce((sum, item) => sum + item.percent, 0);
  const nationalWrongTotal = Math.max(0, 100 - nationalCorrectRate);
  return classDistribution.map((item) => ({
    key: item.key,
    percent: item.key === q.answerKey
      ? nationalCorrectRate
      : wrongClassTotal
        ? nationalWrongTotal * item.percent / wrongClassTotal
        : nationalWrongTotal / Math.max(1, wrongItems.length),
  }));
}

function formatOptionRate(value) {
  const rounded = Math.round((Number(value) || 0) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, "").replace(/\.$/, "");
}

function fullOptionStudents(question, optionKey) {
  if (question.realOnly || question.bookKey === "test-single-book") return [];
  const students = [...(CLASS_STUDENTS[state.filterClass] || [])];
  const distribution = optionDistributionForQuestion(question);
  const ordered = students.length
    ? students.map((_, index) => students[(index + Number(question.questionNo || 0) * 7) % students.length])
    : [];
  let cursor = 0;
  const assignments = new Map();
  distribution.forEach((item) => {
    assignments.set(item.key, ordered.slice(cursor, cursor + item.count));
    cursor += item.count;
  });
  return (assignments.get(optionKey) || []).slice().sort((a, b) => String(a.studentNo).localeCompare(String(b.studentNo), "zh-Hans-CN", { numeric: true }));
}

function closeFullOptionStudentDialog() {
  $("#fullOptionStudentDialog")?.classList.add("hidden");
}

function openFullOptionStudentDialog(questionId, optionKey) {
  const question = getQuestion(questionId);
  const option = question?.options.find((item) => item.key === optionKey);
  if (!question || !option) return;
  const students = fullOptionStudents(question, optionKey);
  const missingStudentDetails = question.realOnly || question.bookKey === "test-single-book";
  const dialog = $("#fullOptionStudentDialog");
  const columnCount = Math.max(1, Math.min(3, Math.ceil(students.length / 20)));
  const rowsPerColumn = Math.ceil(students.length / columnCount);
  const columns = Array.from({ length: columnCount }, (_, index) => students.slice(index * rowsPerColumn, (index + 1) * rowsPerColumn));
  $("#fullOptionStudentTitle").textContent = `${optionKey} 选项 · ${missingStudentDetails ? "--" : students.length} 人`;
  $("#fullOptionStudentSummary").textContent = "";
  $("#fullOptionStudentList").innerHTML = students.length
    ? columns.map((column) => `<div class="full-option-student-column">${column.map((student) => `<span><b>${escapeHtml(student.studentNo)}</b><em>${escapeHtml(student.name)}</em></span>`).join("")}</div>`).join("")
    : missingStudentDetails ? "<small>--</small>" : "<small>暂无学生选择此项</small>";
  $("#fullOptionStudentList").dataset.columns = String(columnCount);
  dialog.classList.toggle("light-mode", state.theme === "light");
  dialog.classList.remove("hidden");
  requestAnimationFrame(() => dialog.querySelector("[data-full-option-students-close]")?.focus());
}

function renderStats() {
  const questions = listeningScopeQuestions();
  const aggregateRate = (items) => {
    const totals = items.reduce((result, question) => {
      const classResult = classResultForQuestion(question);
      result.correct += classResult.correctCount;
      result.total += classResult.total;
      return result;
    }, { correct: 0, total: 0 });
    return totals.total ? Math.round(totals.correct / totals.total * 100) : 0;
  };
  const classSize = classResultForQuestion(questions[0] || {}).total;
  const setCount = new Set(questions.map((question) => question.setId)).size;
  $("#participantCount").textContent = `参与学生 ${classSize * setCount} 人次`;
  $("#overallRate").textContent = `${aggregateRate(questions)}%`;
  $("#shortRate").textContent = `${aggregateRate(questions.filter((question) => question.questionType === "短对话"))}%`;
  $("#longRate").textContent = `${aggregateRate(questions.filter((question) => question.questionType === "长对话"))}%`;
  $("#monologueRate").textContent = `${aggregateRate(questions.filter((question) => question.questionType === "独白"))}%`;
}

function clearListeningFilters() {
  state.rateThreshold = DEFAULT_RATE_THRESHOLD;
  state.filterTime = "近7天";
  state.sortDirection = "asc";
  state.filterComposedQuestions = false;
  Object.keys(state.columnFilters).forEach((key) => { state.columnFilters[key] = new Set(); });
  demoStorage.setItem("victor:rateThreshold", String(DEFAULT_RATE_THRESHOLD));
  demoStorage.setItem("victor:tableSort", "asc");
  els.timeValue.textContent = state.filterTime;
  $("#filterComposedQuestions").checked = false;
  state.currentPage = 1;
  renderTable();
}

function saveBasket() {
  demoStorage.setItem(basketStorageKey(state.filterClass), JSON.stringify([...state.selectedIds]));
}

function switchClassroomDockSide() {
  const dock = $("#classroomDock");
  const side = dock.classList.contains("dock-left") ? "right" : "left";
  applyClassroomDockSide(side, true, true);
}

function applyClassroomDockSide(side, persist = false, closePanel = false) {
  const dock = $("#classroomDock");
  const layoutSwitch = $("#dockLayoutSwitch");
  dock.classList.toggle("dock-left", side === "left");
  dock.classList.toggle("dock-right", side !== "left");
  dock.style.removeProperty("top");
  dock.style.removeProperty("left");
  dock.style.removeProperty("right");
  els.fullscreenPage.classList.toggle("dock-left-layout", side === "left");
  els.fullscreenPage.classList.toggle("dock-right-layout", side !== "left");
  layoutSwitch.innerHTML = side === "left"
    ? `<span>${icons["layout-right"]}</span><b>右布局</b>`
    : `<span>${icons["layout-left"]}</span><b>左布局</b>`;
  layoutSwitch.setAttribute('aria-label',side==='left'?'右布局':'左布局');
  layoutSwitch.title = side === "left" ? "切换到右布局" : "切换到左布局";
  if (closePanel) closeInterfaceSettings();
  updateClassroomDockToggle();
  if (persist) saveClassroomDockPreference();
}

function restoreClassroomDock() {
  let saved = null;
  try {
    saved = JSON.parse(demoStorage.getItem("victor:classroomDock") || "null");
  } catch {
    saved = null;
  }
  const side = saved?.side === "right" ? "right" : "left";
  state.classroomDockCollapsed = saved?.collapsed === true;
  applyClassroomDockSide(side);
  applyClassroomDockCollapsed();
}

function clampClassroomDock() {
  const dock = $("#classroomDock");
  const side = dock.classList.contains("dock-left") ? "left" : "right";
  applyClassroomDockSide(side);
}

function saveClassroomDockPreference() {
  const dock = $("#classroomDock");
  const side = dock.classList.contains("dock-right") ? "right" : "left";
  demoStorage.setItem("victor:classroomDock", JSON.stringify({
    side,
    collapsed: state.classroomDockCollapsed,
  }));
}

function updateClassroomDockToggle() {
  const dock = $("#classroomDock");
  const button = $("#classroomDockToggle");
  if (!button) return;
  const collapsed = dock.classList.contains("collapsed");
  const side = dock.classList.contains("dock-right") ? "right" : "left";
  const label = collapsed ? "展开课堂工具" : "收起课堂工具";
  button.innerHTML = `<span>${collapsed ? icons["teaching-tools"] : icons[side === "left" ? "arrow-left" : "arrow-right"]}</span>`;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-expanded", String(!collapsed));
}

function applyClassroomDockCollapsed() {
  const dock = $("#classroomDock");
  dock.classList.toggle("collapsed", state.classroomDockCollapsed);
  if (state.classroomDockCollapsed) closeInterfaceSettings();
  updateClassroomDockToggle();
}

function toggleClassroomDock() {
  state.classroomDockCollapsed = !state.classroomDockCollapsed;
  applyClassroomDockCollapsed();
  saveClassroomDockPreference();
}

function updateClassroomDock() {
  const dock = $("#classroomDock");
  dock.classList.remove("expanded");
  closeInterfaceSettings();
  requestAnimationFrame(clampClassroomDock);
}

function toggleInterfaceSettings() {
  const panel = $("#interfaceSettingsPanel");
  const willOpen = panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !willOpen);
  $("#interfaceSettingsToggle").classList.toggle("active", willOpen);
  $("#interfaceSettingsToggle").setAttribute("aria-expanded", String(willOpen));
}

function closeInterfaceSettings() {
  const panel = $("#interfaceSettingsPanel");
  if (!panel || panel.classList.contains("hidden")) return;
  panel.classList.add("hidden");
  $("#interfaceSettingsToggle").classList.remove("active");
  $("#interfaceSettingsToggle").setAttribute("aria-expanded", "false");
}

function renderBasket() {
  const scopeQuestions = listeningScopeQuestions();
  const selected = scopeQuestions.filter((q) => state.selectedIds.has(q.id));
  els.basketTotal.textContent = `${selected.length} 题`;
  els.basketTitle.textContent = `试题篮（${state.filterClass}）`;
  const basketGroups = ["短对话", "长对话", "独白"]
    .map((type) => [type, selected.filter((q) => q.questionType === type)])
    .filter(([, questions]) => questions.length);
  const unmatched = selected.filter((q) => !["短对话", "长对话", "独白"].includes(q.questionType));
  if (unmatched.length) basketGroups.push(["其他", unmatched]);
  els.basketGroups.innerHTML = selected.length ? basketGroups.map(([type, questions]) => `
    <section class="book-basket-group ${state.basketExpandedTypes.has(type) ? "expanded" : ""}" data-listening-basket-group="${type}">
      <header>
        <button type="button" data-listening-basket-toggle="${type}" aria-expanded="${state.basketExpandedTypes.has(type)}"><span data-icon="chevron-down"></span><strong>${type}</strong><small>${questions.length} 题</small></button>
        <button type="button" data-clear-type="${type}">清空</button>
      </header>
      <div class="book-basket-group-body">
      ${questions.map((question) => {
        const basketLabel = `${question.setName.replace(/^B3U\d+\s*/, "")} · 第 ${question.questionNo} 题 · Text ${question.textNo}`;
        return `<article>
        <button type="button" data-listening-basket-jump="${question.id}" title="${escapeHtml(basketLabel)}"><span class="book-basket-question-label">${escapeHtml(basketLabel)}</span></button>
        <button type="button" data-listening-basket-remove="${question.id}" title="移出试题篮"><span data-icon="x"></span></button>
      </article>`;
      }).join("")}
      </div>
    </section>`).join("") : `<div class="basket-empty"><span data-icon="cart"></span><strong>试题篮为空</strong></div>`;
  els.basketGroups.querySelectorAll("[data-listening-basket-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.listeningBasketToggle;
      if (state.basketExpandedTypes.has(type)) state.basketExpandedTypes.delete(type);
      else state.basketExpandedTypes.add(type);
      renderBasket();
    });
  });
  els.basketGroups.querySelectorAll("[data-clear-type]").forEach((button) => {
    button.addEventListener("click", () => {
      scopeQuestions.filter((q) => q.questionType === button.dataset.clearType).forEach((q) => state.selectedIds.delete(q.id));
      state.basketExpandedTypes.delete(button.dataset.clearType);
      saveBasket();
      renderTable();
      renderBasket();
    });
  });
  els.basketGroups.querySelectorAll("[data-listening-basket-jump]").forEach((button) => {
    button.addEventListener("click", () => jumpToListeningBasketQuestion(button.dataset.listeningBasketJump));
  });
  els.basketGroups.querySelectorAll("[data-listening-basket-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedIds.delete(button.dataset.listeningBasketRemove);
      saveBasket();
      renderTable();
      renderBasket();
    });
  });
  hydrateIcons();
  updateBottomBar();
}

function jumpToListeningBasketQuestion(questionId) {
  const row = document.querySelector(`[data-listening-question-row="${CSS.escape(questionId)}"]`);
  if (!row) return;
  row.scrollIntoView({ block: "center", behavior: "smooth" });
  row.classList.add("locating");
  window.setTimeout(() => row.classList.remove("locating"), 900);
}

function updateBottomBar() {
  const n = listeningScopeQuestions().filter((question) => state.selectedIds.has(question.id)).length;
  const filterCount = filteredQuestions().length;
  els.rateThreshold.textContent = `${state.rateThreshold}%`;
  const bookField = $("#listeningBookField");
  const bookSelect = $("#listeningBookSelect");
  const availableBookCount = bookSelect?.options.length || 0;
  if (bookField) bookField.classList.toggle("hidden", state.listeningWorkspaceMode !== "listening");
  if (bookSelect) {
    bookSelect.disabled = availableBookCount <= 1;
    bookSelect.title = availableBookCount <= 1 ? "当前只有一本可用书籍" : "切换书籍";
  }
  const fullButton = $("#filteredFullBtn");
  fullButton.disabled = filterCount === 0;
  fullButton.textContent = `去全屏讲解（${filterCount}）`;
  [
    ["#dictationBtn", "去精听挖空"],
    ["#paperBtn", "去组卷"],
    ["#basketPublishBtn", "布置到学生端"],
  ].forEach(([selector, label]) => {
    const button = $(selector);
    button.disabled = n === 0;
    button.textContent = `${label}（${n}）`;
  });
}

function openFull(ids, focusId, returnPage = "", options = {}) {
  const { order = "rate", keepScopeOrder = false } = options;
  state.fullSetNameOverride = options.setName || "";
  state.fullReturnPage = returnPage || (state.page === "book-detail" || state.page === "book-overview" ? state.page : "listening");
  state.similarExamPoint = "";
  state.lectureSnapshot = null;
  state.similarQuestionMemory = {};
  invalidateResourceMainAudioResume();
  state.originalExplainIds = [...ids];
  state.activeExplainSetId = "all";
  state.explainOrder = order;
  const expanded = keepScopeOrder ? [...ids] : expandExplainIds(ids);
  state.explainIds = keepScopeOrder ? expanded : sortExplainIds(expanded);
  const focusQuestion = getQuestion(focusId);
  state.currentQuestionId = focusId || preferredQuestionId(activeSetExplainIds(), ids);
  if (!activeSetExplainIds().includes(state.currentQuestionId)) {
    state.currentQuestionId = preferredQuestionId(activeSetExplainIds(), ids);
  }
  state.lastQuestionBySet = {};
  state.showAnswer = false;
  state.showAnswerAnalysis = false;
  state.showAnalysis = false;
  state.questionPanelCollapsed = false;
  state.showQuestionTranslation = false;
  state.showTranscriptTranslation = false;
  state.activeKnowledgeType = null;
  state.playbackStopTime = null;
  state.playbackScope = null;
  resetTranscriptTeachingModes({ restoreAnalysis: false, pauseAudio: false });
  state.audioOnlyPlayback = options.audioOnly === true;
  state.practiceQuestionsVisible = true;
  state.practiceModeActive = state.audioOnlyPlayback;
  state.practicePhase = "idle";
  state.practicePaused = false;
  state.practiceRepeatIndex = 0;
  state.practiceTextKey = "";
  state.practiceIntroducedSections = new Set();
  state.practiceClosingStagesStarted = false;
  state.practiceRestoreSnapshot = null;
  els.fullscreenPage.classList.remove("hidden");
  els.fullscreenPage.dataset.mode = state.audioOnlyPlayback ? "audio-only" : "";
  applyGlobalAssistState();
  applyTheme();
  setFullFont(state.fullFont);
  renderFull();
  updateClassroomDock();
  updateAudioProgressVisibility();
  requestAnimationFrame(restoreClassroomDock);
  if (state.audioOnlyPlayback) startPracticeSequence();
}

function expandExplainIds(ids) {
  const selected = state.questions.filter((q) => ids.includes(q.id));
  const groups = new Map();
  selected.forEach((q) => {
    const key = q.questionType === "短对话" ? q.id : `${q.setId}-${q.textNo}`;
    groups.set(key, q);
  });
  const expanded = [];
  groups.forEach((q) => {
    if (q.questionType === "短对话") {
      expanded.push(q.id);
    } else {
      state.questions
        .filter((item) => item.setId === q.setId && item.textNo === q.textNo)
        .forEach((item) => expanded.push(item.id));
    }
  });
  return [...new Set(expanded)];
}

function sortExplainIds(ids) {
  const questions = ids.map(getQuestion).filter(Boolean);
  const groups = new Map();
  questions.forEach((q) => {
    const key = `${q.setId}-${q.textNo}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(q);
  });
  return [...groups.values()]
    .map((questions) => {
      questions.sort((a, b) => a.questionNo - b.questionNo);
      return {
        questions,
        setId: questions[0].setId,
        textNo: questions[0].textNo,
        rate: Math.min(...questions.map(classCorrectRate)),
      };
    })
    .sort((a, b) => {
      if (state.explainOrder === "rate") return a.rate - b.rate || a.setId - b.setId || a.questions[0].questionNo - b.questions[0].questionNo;
      if (a.setId !== b.setId) return a.setId - b.setId;
      return a.questions[0].questionNo - b.questions[0].questionNo;
    })
    .flatMap((group) => group.questions.map((q) => q.id));
}

function preferredQuestionId(expanded, originalIds) {
  const first = expanded.map(getQuestion).find(Boolean);
  if (!first) return expanded[0];
  const group = state.questions.filter((q) => q.setId === first.setId && q.textNo === first.textNo && originalIds.includes(q.id));
  if (group.length) return group.sort((a, b) => a.questionNo - b.questionNo)[0].id;
  return first.id;
}

function setExplainOrder(order) {
  if (state.activeExplainSetId === "all") order = "rate";
  const currentId = state.currentQuestionId;
  state.explainOrder = order;
  demoStorage.setItem("victor:explainOrder", order);
  $("#orderRate").classList.toggle("active", order === "rate");
  $("#orderNatural").classList.toggle("active", order === "natural");
  state.explainIds = sortExplainIds(state.explainIds);
  state.currentQuestionId = activeSetExplainIds().includes(currentId)
    ? currentId
    : preferredQuestionId(activeSetExplainIds(), state.originalExplainIds);
  $("#orderSelect").removeAttribute("open");
  renderFull();
  if (state.practiceModeActive) {
    state.practiceIntroducedSections = new Set();
    state.practiceClosingStagesStarted = false;
    startPracticeSequence();
  }
}

function explainSetIds() {
  return [...new Set(state.explainIds.map(getQuestion).filter(Boolean).map((q) => q.setId))].sort((a, b) => a - b);
}

function activeSetExplainIds() {
  if (state.activeExplainSetId === "all") return state.explainIds;
  return state.explainIds.filter((id) => getQuestion(id)?.setId === state.activeExplainSetId);
}

function setActiveExplainSet(setId) {
  if (state.followReadActive) stopFollowRead({ render: false });
  const previousPracticeTextKey = state.practiceModeActive ? state.practiceTextKey : "";
  if (state.maskTranscriptActive) state.maskRevealedSegments.clear();
  const current = getQuestion(state.currentQuestionId);
  if (current) state.lastQuestionBySet[current.setId] = current.id;
  state.activeExplainSetId = setId === "all" ? "all" : Number(setId);
  if (state.activeExplainSetId === "all") {
    state.explainOrder = "rate";
  }
  state.explainIds = sortExplainIds(state.explainIds);
  const ids = activeSetExplainIds();
  const remembered = state.lastQuestionBySet[state.activeExplainSetId];
  state.currentQuestionId = ids.includes(remembered)
    ? remembered
    : preferredQuestionId(ids, state.originalExplainIds);
  $("#setSelect").removeAttribute("open");
  renderFull();
  if (state.practiceModeActive && previousPracticeTextKey !== practiceTextKey()) {
    state.practiceIntroducedSections = new Set();
    state.practiceClosingStagesStarted = false;
    startPracticeSequence();
  }
}

function getQuestion(id) {
  return state.questions.find((q) => q.id === String(id))
    || state.similarPool.find((q) => q.id === String(id));
}

function fullPathLabel(isSimilar = false) {
  const base = state.fullReturnPage === "book-overview"
    ? "校本/书籍详情"
    : state.fullReturnPage === "book-detail"
    ? "校本/试题详情"
    : state.fullReturnPage === "work-report"
      ? "作业/作业报告"
    : state.fullReturnPage === "question-bank"
      ? "题库组卷/我的试卷"
    : state.fullReturnPage === "work"
      ? "检查作业"
      : "首页/听力讲评";
  if (state.audioOnlyPlayback) return `${base}/播放音频`;
  return `${base}/全屏讲解${isSimilar ? "/同类题" : ""}`;
}

function renderFull() {
  const q = getQuestion(state.currentQuestionId);
  if (!q) return;
  const hasAnswerAnalysis = Boolean(String(q.analysis || "").trim());
  if (!hasAnswerAnalysis) state.showAnswerAnalysis = false;
  const isSimilar = els.fullscreenPage.dataset.mode === "similar";
  const isAudioOnly = state.audioOnlyPlayback;
  els.fullscreenPage.dataset.path = fullPathLabel(isSimilar);
  els.fullTitle.textContent = isSimilar
    ? `同类题——${state.similarExamPoint || examPointLabel(q)}`
    : `${q.bookName} - ${state.fullSetNameOverride || q.setName}`;
  const transcriptForcedVisible = isTranscriptForcedVisible();
  const canCollapseQuestion = state.followReadActive || state.showAnalysis;
  if (!canCollapseQuestion) state.questionPanelCollapsed = false;
  els.fullscreenPage.classList.toggle("analysis-open", state.showAnalysis || transcriptForcedVisible);
  els.fullscreenPage.classList.toggle("multi-question-mode", (state.practiceModeActive || isAudioOnly) && !state.showAnalysis && !transcriptForcedVisible);
  els.fullscreenPage.classList.toggle("practice-mode", state.practiceModeActive || isAudioOnly);
  els.fullscreenPage.classList.toggle("audio-only-mode", isAudioOnly);
  els.fullscreenPage.classList.toggle("audio-only-questions-hidden", isAudioOnly && !state.practiceQuestionsVisible);
  $("#classroomDock").classList.toggle("audio-only-complete", isAudioOnly && !state.practiceModeActive);
  els.fullscreenPage.classList.toggle("answer-analysis-open", state.showAnswerAnalysis && !state.practiceModeActive);
  els.fullscreenPage.classList.toggle("question-panel-collapsed", state.questionPanelCollapsed);
  $("#questionPanel").classList.toggle("question-collapsed", state.questionPanelCollapsed);
  $("#similarBtn").classList.toggle("hidden", isSimilar);
  const returnTitle = isSimilar ? "返回讲评" : isAudioOnly ? "返回音频列表" : "返回试题详情";
  $("#returnToLecture").title = returnTitle;
  $("#returnToLecture").setAttribute("aria-label", returnTitle);
  $("#returnToLectureLabel").textContent = "返回";
  $("#similarSourceSwitch").classList.toggle("hidden", !isSimilar);
  $("#swapSimilarQuestion").classList.toggle("hidden", !isSimilar);
  $("#similarQuestionStamp").classList.toggle("hidden", !isSimilar);
  $("#swapSimilarQuestion").disabled = isSimilar && state.practiceModeActive;
  $("#swapSimilarQuestion").title = state.practiceModeActive ? "请先退出当前播放" : "换一道同类题";
  $$('[data-similar-source]').forEach((button) => {
    button.disabled = isSimilar && state.practiceModeActive;
  });
  const collapseButton = $("#questionPanelCollapse");
  collapseButton.classList.toggle("hidden", !canCollapseQuestion);
  collapseButton.setAttribute("aria-expanded", String(!state.questionPanelCollapsed));
  collapseButton.title = state.questionPanelCollapsed ? "展开试题卡片" : "折叠试题卡片";
  collapseButton.setAttribute("aria-label", collapseButton.title);
  const collapseIcon = collapseButton.querySelector("[data-icon]");
  collapseIcon.dataset.icon = state.questionPanelCollapsed ? "chevron-down" : "chevron-up";
  collapseIcon.innerHTML = icons[collapseIcon.dataset.icon];
  $("#setSelect").classList.toggle("hidden", isSimilar);
  $("#orderSelect").classList.toggle("hidden", isSimilar);
  const currentClassResult = classResultForQuestion(q);
  const currentClassRate = classCorrectRate(q);
  $("#examPoint").textContent = examPointLabel(q);
  els.classRate.textContent = currentClassResult.total ? `${currentClassRate}%` : "--";
  els.classRate.style.color = currentClassResult.total ? rateColor(currentClassRate) : "";
  const nationalRate = Number(q.nationalRate);
  const hasNationalRate = q.nationalRate !== null && q.nationalRate !== undefined && Number.isFinite(nationalRate);
  $("#nationalRate").textContent = hasNationalRate ? `${nationalRate}%` : "--";
  $("#nationalRate").style.color = hasNationalRate ? rateColor(nationalRate) : "";
  const practiceLocksTeachingTools = state.practiceModeActive;
  const followReadLocksTeachingTools = state.followReadActive;
  const teachingToolsLocked = practiceLocksTeachingTools || followReadLocksTeachingTools;
  $("#answerToggle").classList.toggle("active", state.showAnswer);
  $("#answerToggle").setAttribute("aria-pressed", String(state.showAnswer));
  $("#answerToggle").disabled = followReadLocksTeachingTools;
  $("#answerToggle").title = followReadLocksTeachingTools ? "请先退出跟读" : "显示或隐藏答案";
  $("#answerAnalysisToggle").classList.toggle("active", state.showAnswerAnalysis);
  $("#answerAnalysisToggle").classList.toggle("hidden", !hasAnswerAnalysis);
  $("#answerAnalysisToggle").setAttribute("aria-pressed", String(state.showAnswerAnalysis));
  $("#answerAnalysisToggle").disabled = teachingToolsLocked || !hasAnswerAnalysis;
  $("#answerAnalysisToggle").title = !hasAnswerAnalysis ? "本题无答案解析" : teachingToolsLocked ? "请先退出当前模式" : "显示或隐藏答案解析";
  $("#analysisToggle").classList.toggle("active", state.showAnalysis);
  $("#analysisToggle").setAttribute("aria-pressed", String(state.showAnalysis));
  $("#analysisToggle").disabled = state.followReadActive || practiceLocksTeachingTools;
  $("#analysisToggle").title = practiceLocksTeachingTools ? "套题播放中暂不可开启原文讲解" : state.followReadActive ? "跟读中暂不可开启原文讲解" : "显示或隐藏原文讲解";
  $("#followReadBtn").classList.toggle("active", state.followReadActive);
  $("#followReadBtn").setAttribute("aria-pressed", String(state.followReadActive));
  $("#followReadBtn").disabled = practiceLocksTeachingTools;
  $("#followReadBtn").title = practiceLocksTeachingTools ? "请先退出当前播放" : state.followReadActive ? "关闭跟读" : "开启跟读";
  $("#followReadTools").classList.toggle("visible", state.followReadActive);
  $("#followReadTools").setAttribute("aria-hidden", String(!state.followReadActive));
  $("#maskTranscriptBtn").classList.toggle("active", state.maskTranscriptActive);
  $("#maskTranscriptBtn").setAttribute("aria-pressed", String(state.maskTranscriptActive));
  $("#maskTranscriptBtn").title = state.maskTranscriptActive ? "关闭遮挡原文" : "开启遮挡原文";
  $("#questionTranslate").classList.toggle("active", state.showQuestionTranslation);
  $("#questionTranslate").setAttribute("aria-pressed", String(state.showQuestionTranslation));
  $("#questionTranslate").disabled = teachingToolsLocked;
  $("#questionTranslate").title = teachingToolsLocked ? "请先退出当前模式" : "显示或隐藏题目翻译";
  $("#similarBtn").disabled = teachingToolsLocked;
  $("#similarBtn").title = teachingToolsLocked ? "请先退出当前模式" : "进入同类题";
  $("#practiceModeTools").classList.toggle("visible", isAudioOnly && state.practiceModeActive);
  $("#practiceModeTools").setAttribute("aria-hidden", String(!(isAudioOnly && state.practiceModeActive)));
  syncPracticePlaybackStatus();
  syncPracticeSettingsUi();
  syncFollowReadWaveform();
  renderLectureSelectors(q, isSimilar);
  renderFullQuestion(q);
  renderWrongNav();
  renderKnowledgeRail(q);
  renderTranscript(q);
  bindAudio(q);
}

function renderLectureSelectors(q, isSimilar) {
  if (isSimilar) return;
  const setQuestions = explainSetIds()
    .map((setId) => state.explainIds.map(getQuestion).find((item) => item?.setId === setId))
    .filter(Boolean);
  if (setQuestions.length === 1 && state.activeExplainSetId === "all") {
    state.activeExplainSetId = setQuestions[0].setId;
  }
  const activeSet = setQuestions.find((item) => item.setId === state.activeExplainSetId) || setQuestions[0];
  const activeSetIndex = Math.max(0, setQuestions.findIndex((item) => item.setId === activeSet?.setId));
  $("#setSelectValue").textContent = setQuestions.length === 1
    ? "1"
    : state.activeExplainSetId === "all"
      ? "全部"
      : `${activeSetIndex + 1}`;
  $("#setSelectValue").title = state.fullSetNameOverride || activeSet?.setName || q.setName;
  $("#setSelect").classList.toggle("single-option", setQuestions.length === 1);
  $("#setSelectMenu").innerHTML = (setQuestions.length > 1
    ? `<button class="${state.activeExplainSetId === "all" ? "active" : ""}" data-explain-set="all"><span>${icons.check}</span><b>全部</b></button>`
    : "") + setQuestions.map((item, index) => `
    <button class="${item.setId === state.activeExplainSetId ? "active" : ""}" data-explain-set="${item.setId}" title="${escapeHtml(state.fullSetNameOverride || item.setName)}">
      <span>${icons.check}</span><b>${index + 1} · ${escapeHtml(state.fullSetNameOverride || item.setName)}</b>
    </button>
  `).join("");
  $("#setSelectMenu").querySelectorAll("[data-explain-set]").forEach((button) => {
    button.addEventListener("click", () => setActiveExplainSet(button.dataset.explainSet));
  });
  $("#orderSelectValue").textContent = state.explainOrder === "rate" ? "正答率" : "套题顺序";
  $("#orderRate").classList.toggle("active", state.explainOrder === "rate");
  $("#orderNatural").classList.toggle("active", state.explainOrder === "natural");
  $("#orderNatural").classList.remove("hidden");
  $("#orderSelect").classList.remove("single-option");
}

function renderFullQuestion(q) {
  if ((state.practiceModeActive || state.audioOnlyPlayback) && !state.showAnalysis) {
    renderFullQuestionList(q);
    return;
  }
  const optionDistribution = optionDistributionForQuestion(q);
  const missingClassStatistics = Boolean(q.realOnly && !classResultForQuestion(q).total);
  els.fullQuestion.innerHTML = `
    <div class="question-copy-line">
      <h3 class="full-stem"><span>${decorateResourceHighlights(q.stem, q, "题干")}</span>${q.examSource ? `<small class="gaokao-question-source">${escapeHtml(q.examSource)}</small>` : ""}</h3>
      ${state.showQuestionTranslation && q.questionTranslation ? `<div class="line-translation">${escapeHtml(q.questionTranslation)}</div>` : ""}
    </div>
    ${q.options.map((option) => {
      const dist = optionDistribution.find((item) => item.key === option.key) || { percent: 0, count: 0 };
      const correct = state.showAnswer && option.key === q.answerKey;
      return `
        <div class="full-option ${state.showAnswer ? "answer-visible" : "answer-hidden"} ${correct ? "correct" : ""}">
          <div class="option-copy">
            <div class="option-copy-main">
              <span>${decorateResourceHighlights(option.text, q, [`选项${option.key}`, ...(correct ? ["答案"] : [])])}</span>
              ${state.showQuestionTranslation && option.translation ? `<span class="line-translation">${escapeHtml(option.translation)}</span>` : ""}
            </div>
            ${correct ? `<i class="correct-check">${icons["check-filled"]}</i>` : ""}
          </div>
          ${state.showAnswer ? `<div class="option-bar"><span style="width:${dist.percent}%"></span></div><button type="button" class="option-stat" data-full-option-question="${escapeHtml(q.id)}" data-full-option-key="${escapeHtml(option.key)}" title="${missingClassStatistics ? "暂无班级作答记录" : "查看选择此选项的学生"}" ${missingClassStatistics ? "disabled" : ""}>${missingClassStatistics ? "班级 --" : `班级${formatOptionRate(dist.percent)}% ${dist.count}人`}</button>` : ""}
        </div>`;
    }).join("")}
    ${state.showAnswerAnalysis && q.analysis ? `<section class="full-answer-analysis"><strong>答案解析</strong><p>${escapeHtml(stripMarkup(q.analysis))}</p></section>` : ""}`;
  els.fullQuestion.querySelectorAll("[data-full-option-question]").forEach((button) => {
    button.addEventListener("click", () => openFullOptionStudentDialog(button.dataset.fullOptionQuestion, button.dataset.fullOptionKey));
  });
  bindQuestionResourceHighlights(q);
}

function renderFullQuestionList(currentQuestion) {
  const ids = state.audioOnlyPlayback
    ? audioOnlyVisibleQuestionIds(currentQuestion)
    : currentTextLectureIds(currentQuestion);
  els.fullQuestion.innerHTML = `<div class="full-question-list">
    ${ids.map((id, index) => {
      const item = getQuestion(id);
      if (!item) return "";
      const stemMatch = String(item.stem || "").match(/^(\d+[.．、])\s*(.*)$/);
      const stemNumber = stemMatch?.[1] || `${item.questionNo}.`;
      const stemText = stemMatch?.[2] || item.stem;
      return `
        <article class="full-question-item" data-full-item="${item.id}">
          <div class="full-question-body">
            <div class="full-question-copy">
              <div class="question-copy-line">
                <h3 class="full-stem"><span class="practice-question-number">${escapeHtml(stemNumber)}</span><span class="practice-question-stem">${decorateResourceHighlights(stemText, item, "题干")}</span>${item.examSource ? `<small class="gaokao-question-source">${escapeHtml(item.examSource)}</small>` : ""}</h3>
                ${state.showQuestionTranslation && item.questionTranslation ? `<div class="line-translation">${escapeHtml(item.questionTranslation)}</div>` : ""}
              </div>
              <div class="practice-option-row">
              ${item.options.map((option) => {
                const correct = state.showAnswer && option.key === item.answerKey;
                return `
                  <div class="full-option ${state.showAnswer ? "answer-visible" : "answer-hidden"} ${correct ? "correct" : ""}">
                    <div class="option-copy">
                      <b class="practice-option-key">${escapeHtml(option.key)}</b>
                      <div class="option-copy-main">
                        <span>${decorateResourceHighlights(cleanOptionText(option.text), item, [`选项${option.key}`, ...(correct ? ["答案"] : [])])}</span>
                        ${state.showQuestionTranslation && option.translation ? `<span class="line-translation">${escapeHtml(cleanOptionText(option.translation))}</span>` : ""}
                      </div>
                    </div>
                  </div>`;
              }).join("")}
              </div>
              ${state.showAnswerAnalysis && item.analysis ? `<section class="full-answer-analysis"><strong>答案解析</strong><p>${escapeHtml(stripMarkup(item.analysis))}</p></section>` : ""}
            </div>
          </div>
        </article>`;
    }).join("")}
  </div>`;
  if (!state.audioOnlyPlayback) {
    els.fullQuestion.querySelectorAll("[data-full-item]").forEach((node) => {
      node.addEventListener("click", () => setCurrentLectureQuestion(node.dataset.fullItem));
    });
  }
  bindQuestionResourceHighlights(currentQuestion);
  updatePracticeOptionLayouts();
}

function updatePracticeOptionLayouts() {
  if (!state.practiceModeActive || !els.fullQuestion) return;
  const rows = [...els.fullQuestion.querySelectorAll(".practice-option-row")];
  if (!rows.length) return;
  rows.forEach((row) => row.classList.remove("stacked-options"));
  void els.fullQuestion.offsetWidth;
  rows.forEach((row) => {
    const optionCopies = [...row.querySelectorAll(".option-copy-main")];
    const needsStacking = optionCopies.some((copy) => copy.scrollWidth > copy.clientWidth + 1);
    row.classList.toggle("stacked-options", needsStacking);
  });
}

const KNOWLEDGE_ORDER = ["词汇", "语音", "语法", "微技能", "百科知识", "话题词汇", "实用表达"];
const KNOWLEDGE_SUBTYPE_LABELS = {
  "词汇": {
    1: "常用搭配", 2: "动词短语", 3: "熟词生义", 4: "重难点词汇", 5: "构词点拨",
    6: "日常用语", 7: "短语动词", 8: "日常口语", 9: "单词读音", 10: "实用表达",
  },
  "语音": { 1: "人名读音", 2: "地名读音", 3: "语音现象", 4: "单词读音" },
  "语法": {
    1: "长难句", 2: "虚拟语气", 3: "倒装句", 4: "省略句", 5: "with 复合结构",
    6: "长难句分析", 7: "部分倒装", 8: "祈使句", 9: "独立主格", 10: "强调句",
    24: "复合句", 25: "否定式反问句", 26: "并列复合句", 27: "虚拟语气 + 省略句",
    28: "虚拟语气 + 感叹句", 29: "时间状语从句",
  },
  "实用表达": { 13: "实用表达" },
  "话题词汇": {
    14: "退换货", 16: "机场", 17: "服装店购物", 18: "健身房（gym）", 19: "看牙",
    20: "饮食", 21: "健身", 22: "健身房", 23: "理发", 24: "看病", 25: "健身中心",
    26: "身材管理", 27: "影片类型", 28: "电影类型", 29: "节日庆祝", 30: "购票",
    31: "音乐类型", 32: "摇滚乐队成员", 33: "租房", 34: "健康与饮食", 35: "医院",
    36: "电视节目类型", 37: "套餐优惠", 38: "酒店服务", 39: "大学中的场所", 40: "租房/买房",
    41: "电影", 42: "体重管理", 43: "开车", 44: "就医", 45: "图书类型", 46: "广播",
    47: "天气", 48: "描述人物性格", 49: "酒店", 50: "酒店退房", 51: "复印 & 打印",
    52: "戏剧表演", 53: "银行", 54: "餐厅", 55: "电脑入门使用", 56: "邮局",
    57: "快餐与饮食健康", 58: "航班与舱位", 59: "衣服尺码", 60: "面试", 61: "旅行（方式）",
    62: "电视节目/电影", 63: "工作场景", 64: "购买车票", 65: "天气（晴&雨）", 66: "做饭",
    67: "医疗", 68: "酒店订房", 69: "电影拍摄", 70: "打电话常用语", 71: "兴趣班课程类型",
    72: "物品报失", 73: "改衣服务", 74: "环境保护（Environment Protection）",
    75: "水上主题乐园（Water Parks）", 76: "工作", 77: "租车", 78: "文学与出版",
    79: "促销优惠", 80: "运动场地及设施", 81: "学车/练车", 82: "图书馆", 83: "酒店房间",
    84: "杂志拍摄与发行", 85: "交通事故", 86: "下雨", 87: "大学教育", 88: "常见绘画类型",
    89: "表演", 90: "交通场所", 91: "影视娱乐", 92: "工作", 93: "住宿", 94: "文学与出版",
    95: "打印机使用", 96: "环保建筑设施", 97: "文学类型", 98: "影视职业称谓",
    99: "健身场所", 100: "酒店订房", 101: "影视娱乐", 102: "手机使用", 103: "表达“不喜欢”",
    104: "航空旅行", 105: "公司职位", 106: "historic sights（历史名胜）", 107: "餐馆菜肴",
    108: "值机", 109: "常见舞种", 110: "体育比赛", 111: "舞蹈类型", 112: "课程类别",
    113: "厨房用具", 114: "表示方位的词", 115: "电视节目&电影类型", 116: "小说",
    117: "酒店入住", 118: "人物描述", 119: "处理邮件", 120: "实验室安全守则（lab safety rules）",
    121: "指路",
  },
  "微技能": {
    1: "场景预测（购物）", 2: "谈话目的（询问信息）", 3: "话语标记（序列标记）", 4: "话语标记",
    5: "话语标记（anyway）", 6: "话语标记（转折 but）", 7: "场景预测",
    8: "话语标记（强调 obviously）", 9: "表示方位的词及同义转换", 10: "场景预测（演播室）",
    11: "话语标记（excuse me）", 12: "场景判断（面试）", 13: "谈话者关系推断（同学）",
    14: "场景推断（电视演播室）", 15: "推断说话人观点和态度", 16: "谈话目的（投诉）",
    17: "价格推算", 18: "谈话目的（寻求建议）", 19: "话语标记（anyway）02",
    20: "场景预测（采访）", 21: "演讲目的（宣传推广）", 22: "话语标记（above all）",
    23: "话语标记（in that case）", 24: "方位词及同义转换", 25: "常见货币单位及其符号",
    26: "场景预测（餐馆）", 27: "话语标记（强调 actually）", 28: "街道名称", 29: "时间推算",
    30: "预判谈话者关系（夫妻）", 31: "话语标记（most importantly）", 32: "it 指代",
    33: "that 指代", 34: "话语标记（though）", 35: "话语标记（强调 In fact）",
    36: "话语标记（To tell you the truth）", 37: "场景预测（书店）", 38: "数字读法（时刻）",
    39: "数字读法（年份）", 40: "场景预测（问路）", 41: "话语标记（I mean）",
    42: "场景预测（医院）", 43: "话语标记（for example）", 44: "图式与应用（访谈结构）",
    45: "识别“预期与实际差异”的信号结构", 46: "预测谈话者关系（同事）",
    47: "场景预测（图书馆）", 48: "识别请求", 49: "场景预测（交警处理事故）", 50: "提建议",
    51: "场景预测（机场）", 52: "场景预测（街头采访）", 53: "场景预测（旅行社）",
    54: "场景预测（主持新闻连线）", 55: "场景预测（餐馆/咖啡馆）", 56: "场景预测（出租车）",
    57: "wish 虚拟语气", 58: "英语货币金额的读法", 59: "话语标记（强调 actually）",
    60: "马拉松比赛时间的读法", 61: "话语标记（In other words）", 62: "判断人物关系（夫妻）",
    63: "捕捉计划变更与最终决定", 64: "场景预测（火车站）", 65: "场景预测（面试）",
    66: "场景预测（酒店）", 67: "人物与事件（街头调查）",
    68: "话语标记（强调 most importantly）",
  },
};
const FULLSCREEN_KNOWLEDGE_LIBRARY = window.FULLSCREEN_KNOWLEDGE_LIBRARY || { words: [], contextMappings: [], analysisResources: [], contrasts: [], assets: {} };
const FULLSCREEN_KNOWLEDGE_WORDS = new Map(FULLSCREEN_KNOWLEDGE_LIBRARY.words.map((word) => [Number(word.id), word]));
const FULLSCREEN_KNOWLEDGE_CONTEXTS = new Map(FULLSCREEN_KNOWLEDGE_LIBRARY.contextMappings.map((mapping) => [Number(mapping.analysisRow), mapping]));
const FULLSCREEN_KNOWLEDGE_RESOURCES = new Map((FULLSCREEN_KNOWLEDGE_LIBRARY.analysisResources || []).map((resource) => [Number(resource.analysisRow), resource]));
const FULLSCREEN_KNOWLEDGE_ALIASES = new Map();
FULLSCREEN_KNOWLEDGE_LIBRARY.words.forEach((word) => {
  (word.aliases || [word.word]).forEach((alias) => FULLSCREEN_KNOWLEDGE_ALIASES.set(normalizeKnowledgeLookup(alias), word));
});
function resolveDemoAudioURL(source) {
  return window.V1230AAC?.resolveURL?.(source) ?? source;
}
const resourceDetailAudio = new Audio();
resourceDetailAudio.preload = "metadata";
let activeResourceAudioButton = null;
let resourceImageFullscreenActive = false;
let resourceMainAudioSnapshot = null;
let resourceAudioPlaySerial = 0;
let resourceAudioSegment = null;

function invalidateResourceMainAudioResume() {
  resourceMainAudioSnapshot = null;
}

function suspendMainAudioForResource() {
  if (resourceMainAudioSnapshot) return;
  resourceMainAudioSnapshot = {
    questionId: state.currentQuestionId,
    source: els.audio.getAttribute("src"),
    wasPlaying: !els.audio.paused && !els.audio.ended,
  };
  if (resourceMainAudioSnapshot.wasPlaying) {
    els.audio.pause();
    setPlayButton(false);
  }
}

function restoreMainAudioAfterResource() {
  const snapshot = resourceMainAudioSnapshot;
  resourceMainAudioSnapshot = null;
  if (!snapshot?.wasPlaying || snapshot.questionId !== state.currentQuestionId
    || snapshot.source !== els.audio.getAttribute("src")
    || els.fullscreenPage.classList.contains("hidden") || state.audioOnlyPlayback) return;
  els.audio.play().then(() => setPlayButton(true)).catch(() => setPlayButton(false));
}

function reportResourceAudioError(button, error) {
  if (button?.dataset.audioState === "error") return;
  if (button) {
    button.classList.add("unavailable");
    button.dataset.audioState = "error";
    button.dataset.audioError = String(error?.code || error?.name || "playback");
    button.title = "音频暂时无法播放，请重试";
    updateResourceAudioButton(button, false);
  }
  showAppNotice("音频暂时无法播放，请重试。", "error");
  // Keep the existing notice visible above the active word dialog/backdrop.
  const notice=document.getElementById("appNotice"),layer=button?.closest?.(".resource-popover");
  if (notice && layer) {
    if (!Object.prototype.hasOwnProperty.call(notice.dataset,"resourceAudioZBefore")) notice.dataset.resourceAudioZBefore=notice.style.zIndex;
    const marker=String(resourceAudioPlaySerial);
    notice.dataset.resourceAudioNotice=marker;
    notice.style.zIndex=String(Math.max(240,(Number(getComputedStyle(layer).zIndex)||0)+2));
    setTimeout(()=>{
      if (notice.dataset.resourceAudioNotice!==marker) return;
      notice.style.zIndex=notice.dataset.resourceAudioZBefore;
      delete notice.dataset.resourceAudioZBefore;
      delete notice.dataset.resourceAudioNotice;
    },5300);
  }
}
// Both dialogs keep the existing single resource player and main-audio lifecycle.
window.DemoResourceAudio = {
  audio: resourceDetailAudio,
  async play(source, button = null) {
    source = resolveDemoAudioURL(source);
    if (!source) return false;
    const ticket = ++resourceAudioPlaySerial;
    resourceAudioSegment = null;
    updateResourceAudioButton(activeResourceAudioButton, false);
    els.popover.querySelectorAll("video,audio").forEach((media) => media.pause());
    suspendMainAudioForResource();
    resourceDetailAudio.pause();
    resourceDetailAudio.dataset.source = source;
    if (resourceDetailAudio.getAttribute("src") !== source) resourceDetailAudio.src = source;
    activeResourceAudioButton = button;
    if (button) {
      button.dataset.resourceAudio = source;
      button.dataset.audioOriginalTitle ||= button.title || button.getAttribute("aria-label") || "播放音频";
      button.dataset.audioState = "loading";
      button.classList.remove("unavailable");
      delete button.dataset.audioError;
      button.title = button.dataset.audioOriginalTitle;
    }
    try {
      const start=Number(button?.dataset.resourceStart);
      const end=Number(button?.dataset.resourceEnd);
      const bounded=button?.hasAttribute('data-resource-start') && Number.isFinite(start) && start>=0 && Number.isFinite(end) && end>start;
      if(bounded && resourceDetailAudio.readyState<1){
        await new Promise((resolve,reject)=>{
          const clean=()=>{resourceDetailAudio.removeEventListener('loadedmetadata',loaded);resourceDetailAudio.removeEventListener('error',failed);};
          const loaded=()=>{clean();resolve();};
          const failed=()=>{clean();reject(resourceDetailAudio.error||new Error('Audio metadata unavailable'));};
          resourceDetailAudio.addEventListener('loadedmetadata',loaded,{once:true});
          resourceDetailAudio.addEventListener('error',failed,{once:true});
        });
      }
      if(ticket!==resourceAudioPlaySerial || activeResourceAudioButton!==button)return null;
      if(bounded){
        const clipEnd=Math.min(end,Number.isFinite(resourceDetailAudio.duration)?resourceDetailAudio.duration:end);
        if(clipEnd<=start)throw new Error('Audio segment is outside the recording');
        resourceAudioSegment={start,end:clipEnd,ticket,stopped:false};
      }
      resourceDetailAudio.currentTime = bounded ? start : 0;
      await resourceDetailAudio.play();
      if (ticket !== resourceAudioPlaySerial || activeResourceAudioButton !== button) return null;
      if (button) button.dataset.audioState = "playing";
      updateResourceAudioButton(button, true);
      return true;
    } catch (error) {
      if (ticket !== resourceAudioPlaySerial || activeResourceAudioButton !== button) return null;
      reportResourceAudioError(button, error);
      restoreMainAudioAfterResource();
      return false;
    }
  },
  toggle(source, button = null) {
    source = resolveDemoAudioURL(source);
    if (activeResourceAudioButton === button && resourceDetailAudio.dataset.source === source && !resourceDetailAudio.paused) {
      this.pause();
      return Promise.resolve(true);
    }
    return this.play(source, button);
  },
  pause({ resumeMain = false } = {}) {
    ++resourceAudioPlaySerial;
    resourceDetailAudio.pause();
    if (activeResourceAudioButton) activeResourceAudioButton.dataset.audioState = "paused";
    updateResourceAudioButton(activeResourceAudioButton, false);
    if (resumeMain) restoreMainAudioAfterResource();
  },
  invalidate() { ++resourceAudioPlaySerial; invalidateResourceMainAudioResume(); },
  restoreMain() { restoreMainAudioAfterResource(); },
};
resourceDetailAudio.addEventListener("ended", () => {
  if (activeResourceAudioButton) activeResourceAudioButton.dataset.audioState = "ended";
  updateResourceAudioButton(activeResourceAudioButton, false);
  restoreMainAudioAfterResource();
});
resourceDetailAudio.addEventListener("error", () => {
  reportResourceAudioError(activeResourceAudioButton, resourceDetailAudio.error);
  restoreMainAudioAfterResource();
});
resourceDetailAudio.addEventListener('timeupdate',()=>{
  const clip=resourceAudioSegment;
  if(!clip || clip.ticket!==resourceAudioPlaySerial || clip.stopped || resourceDetailAudio.paused || resourceDetailAudio.currentTime<clip.end)return;
  clip.stopped=true;
  resourceDetailAudio.pause();
  resourceDetailAudio.currentTime=clip.end;
  if(activeResourceAudioButton)activeResourceAudioButton.dataset.audioState='ended';
  updateResourceAudioButton(activeResourceAudioButton,false);
  syncResourceGuidancePlayer();
  restoreMainAudioAfterResource();
});

function textResourceForQuestion(q) {
  return state.textResources[`${q.setId}-${q.textNo}`] || null;
}

function examPointLabel(q) {
  return BOOK_EXAM_POINT_LABELS[Number(q.examPointId)] || q.examPoint || "--";
}

function availableKnowledgeTypes(q) {
  const categories = textResourceForQuestion(q)?.categories || {};
  return KNOWLEDGE_ORDER.filter((type) => knowledgeItemsForQuestion(q, type).length);
}

function knowledgeItemsForQuestion(q, type) {
  const items = textResourceForQuestion(q)?.categories?.[type] || [];
  const questionNumber = Number(q?.questionNo || 0);
  return items.filter((item) => {
    const itemQuestionNumber = Number(item?.questionNumber || 0);
    const targetArea = String(item?.targetArea || "录音稿");
    return targetArea === "录音稿" || !itemQuestionNumber || !questionNumber || itemQuestionNumber === questionNumber;
  });
}

function renderKnowledgeRail(q) {
  const dockKnowledge = $("#dockKnowledge");
  closeResourcePopover();
  els.leftKnowledgeRail.classList.add("hidden");
  els.leftKnowledgeRail.innerHTML = "";
  els.transcriptPanel.classList.add("no-knowledge");
  if (!state.showAnalysis) {
    dockKnowledge.innerHTML = "";
    dockKnowledge.classList.remove("visible");
    requestAnimationFrame(restoreClassroomDock);
    return;
  }

  const resource = textResourceForQuestion(q);
  const keys = availableKnowledgeTypes(q);
  if (state.activeKnowledgeType && !keys.includes(state.activeKnowledgeType)) {
    state.activeKnowledgeType = null;
  }
  const controls = resource?.sourceTranslation ? [...keys, "原文翻译"] : keys;
  dockKnowledge.innerHTML = controls.map((key) => {
    const active = key === "原文翻译"
      ? state.showTranscriptTranslation
      : state.activeKnowledgeType === key;
    return `<button class="${active ? "active" : ""}" data-knowledge="${key}" title="${key}" aria-pressed="${active}">${key}</button>`;
  }).join("");
  dockKnowledge.classList.toggle("visible", controls.length > 0);
  dockKnowledge.querySelectorAll("[data-knowledge]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const type = button.dataset.knowledge;
      if (type === "原文翻译") {
        state.showTranscriptTranslation = !state.showTranscriptTranslation;
      } else {
        state.activeKnowledgeType = state.activeKnowledgeType === type ? null : type;
      }
      renderKnowledgeRail(q);
      renderTranscript(q);
      renderFullQuestion(q);
      if (type !== "原文翻译" && state.activeKnowledgeType) {
        requestAnimationFrame(() => highlightKnowledgeWord(state.activeKnowledgeType));
        const items = knowledgeItemsForQuestion(q, state.activeKnowledgeType);
        if (!items.some((item) => item.highlightTarget)) {
          showResourceCollectionPopover(event, state.activeKnowledgeType, items);
        }
      }
    });
  });

  if (state.activeKnowledgeType) {
    els.leftKnowledgeRail.classList.add("hidden");
    els.transcriptPanel.classList.add("no-knowledge");
  }
  requestAnimationFrame(clampClassroomDock);
}

function normalizeKnowledgeLookup(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ");
}

function knowledgePosFamily(value) {
  const normalized = normalizeKnowledgeLookup(value).replace(/\./g, "");
  if (["v", "vt", "vi", "vi & vt", "vt & vi"].includes(normalized)) return "v";
  if (["phr v", "phrv"].includes(normalized)) return "phr v";
  return normalized;
}

function libraryWordForEntry(entry, item) {
  const mapping = FULLSCREEN_KNOWLEDGE_CONTEXTS.get(Number(item?.analysisRow || item?.sourceAnalysisRow || 0));
  const explicitId = Number(entry?.word_id || entry?.wordId || item?.wordId || mapping?.wordId || 0);
  if (explicitId && FULLSCREEN_KNOWLEDGE_WORDS.has(explicitId)) return FULLSCREEN_KNOWLEDGE_WORDS.get(explicitId);
  const lookup = normalizeKnowledgeLookup(entry?.word);
  if (!lookup) return null;
  return FULLSCREEN_KNOWLEDGE_ALIASES.get(lookup)
    || (lookup.endsWith("s") ? FULLSCREEN_KNOWLEDGE_ALIASES.get(lookup.slice(0, -1)) : null)
    || null;
}

function libraryContextForEntry(entry, item) {
  const mapping = FULLSCREEN_KNOWLEDGE_CONTEXTS.get(Number(item?.analysisRow || item?.sourceAnalysisRow || 0));
  const word = libraryWordForEntry(entry, item);
  if (!word) return null;
  const explicitPartId = Number(entry?.part_id || entry?.partId || item?.partId || mapping?.partId || 0);
  const wantedPos = knowledgePosFamily(entry?.part_of_speech);
  let part = word.parts.find((candidate) => explicitPartId && Number(candidate.id) === explicitPartId)
    || word.parts.find((candidate) => wantedPos && knowledgePosFamily(candidate.partOfSpeech) === wantedPos)
    || word.parts[0]
    || null;
  const explicitSenseId = Number(entry?.sense_id || entry?.senseId || item?.contextSenseId || item?.senseId || mapping?.senseId || 0);
  const normalizedMeaning = normalizeKnowledgeLookup(entry?.chinese);
  const allSenses = word.parts.flatMap((candidate) => candidate.senses.map((sense) => ({ ...sense, part: candidate })));
  const selected = allSenses.find((sense) => explicitSenseId && Number(sense.id) === explicitSenseId)
    || allSenses.find((sense) => normalizedMeaning && normalizeKnowledgeLookup(sense.chinese) === normalizedMeaning)
    || allSenses.find((sense) => {
      const candidateMeaning = normalizeKnowledgeLookup(sense.chinese);
      return normalizedMeaning && candidateMeaning && (candidateMeaning.includes(normalizedMeaning) || normalizedMeaning.includes(candidateMeaning));
    })
    || (part?.senses.length === 1 ? { ...part.senses[0], part } : null);
  if (selected?.part) part = selected.part;
  return { word, part, selected, allSenses };
}

function libraryResourceForItem(item) {
  return FULLSCREEN_KNOWLEDGE_RESOURCES.get(Number(item?.analysisRow || item?.sourceAnalysisRow || 0)) || null;
}

function resourceSubtypeId(type, item) {
  const source = libraryResourceForItem(item);
  const explicit = item?.resourceSubtype ?? source?.resourceSubtype;
  if (explicit !== undefined && explicit !== null && String(explicit).trim()) return Number(explicit);
  if (type === "话题词汇" && /^\d+$/.test(String(item?.title || "").trim())) return Number(item.title);
  return 0;
}

function resourceSubtypeLabel(type, item) {
  return KNOWLEDGE_SUBTYPE_LABELS[type]?.[resourceSubtypeId(type, item)] || "";
}

function resourcePopoverHeading(type, items) {
  if (type === "微技能") return type;
  const labels = [...new Set(items.map((item) => resourceSubtypeLabel(type, item)).filter(Boolean))];
  return labels.length ? `${type}-${labels.join("、")}` : type;
}

function resourceItemHeading(type, item) {
  if (type === "微技能") return resourceSubtypeLabel(type, item) || item.prominent || item.title || "";
  const title = item.prominent || item.title || "";
  const numericTopicTitle = type === "话题词汇" && /^\d+$/.test(String(item.title || "").trim());
  return numericTopicTitle ? resourceSubtypeLabel(type, item) || title : title;
}

function knowledgeAssetAvailable(group, filename) {
  return Boolean(filename && (FULLSCREEN_KNOWLEDGE_LIBRARY.assets?.[group] || []).includes(filename));
}

function knowledgeAssetUrl(group, filename) {
  const folders = {
    ukAudio: "audio/UK",
    usAudio: "audio/US",
    guidanceAudio: "audio/guidance",
    images: "images",
    videos: "video",
  };
  return `./assets/knowledge/${folders[group]}/${encodeURIComponent(filename)}`;
}

function displayPhonetic(value) {
  const phonetic = String(value || "")
    .trim()
    .replace(/\s*\r?\n\s*/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/^\/+|\/+$/g, "");
  return phonetic ? `/${phonetic}/` : "";
}

function resourcePronunciationButton(accent, phonetic, filename, assetGroup) {
  const available = knowledgeAssetAvailable(assetGroup, filename);
  const original = available ? knowledgeAssetUrl(assetGroup, filename) : "";
  const question = getQuestion(state.currentQuestionId);
  const exclusive = question?.bookKey === "test-single-book";
  const src = exclusive ? (window.V1230AAC?.resolvePronunciationURL?.(original) || "") : resolveDemoAudioURL(original);
  const hasAudio = Boolean(src);
  if (!phonetic && !hasAudio) return "";
  const label = `${accent}音 ${displayPhonetic(phonetic)}`.trim();
  return `<span class="resource-pronunciation-item">
    <b>${escapeHtml(accent)}</b>
    ${phonetic ? `<em>${escapeHtml(displayPhonetic(phonetic))}</em>` : ""}
    ${hasAudio ? resourceInlineAudioButton(src, `播放${label}`) : ""}
  </span>`;
}

function libraryPronunciationGroups(word) {
  const groups = new Map();
  (word?.parts || []).forEach((part) => {
    const key = JSON.stringify([
      part.ukPhonetic || "",
      part.ukAudio || "",
      part.usPhonetic || "",
      part.usAudio || "",
    ]);
    if (!groups.has(key)) groups.set(key, { ...part, partLabels: [] });
    const label = String(part.partOfSpeech || "").trim();
    if (label && !groups.get(key).partLabels.includes(label)) groups.get(key).partLabels.push(label);
  });
  return [...groups.values()];
}

function renderLibraryPronunciations(word) {
  const groups = libraryPronunciationGroups(word);
  const showPartLabels = groups.length > 1;
  const rows = groups.map((group) => {
    const controls = [
      resourcePronunciationButton("英", group.ukPhonetic, group.ukAudio, "ukAudio"),
      resourcePronunciationButton("美", group.usPhonetic, group.usAudio, "usAudio"),
    ].filter(Boolean).join("");
    if (!controls) return "";
    return `<div class="resource-pronunciation-row ${showPartLabels ? "has-pos" : ""}">
      ${showPartLabels && group.partLabels.length ? `<span class="resource-pronunciation-pos">${escapeHtml(group.partLabels.join(" / "))}</span>` : ""}
      <div class="resource-pronunciations">${controls}</div>
    </div>`;
  }).filter(Boolean).join("");
  return rows ? `<div class="resource-pronunciation-groups">${rows}</div>` : "";
}

function renderPartPronunciations(part) {
  if (!part) return "";
  const controls = [
    resourcePronunciationButton("英", part.ukPhonetic, part.ukAudio, "ukAudio"),
    resourcePronunciationButton("美", part.usPhonetic, part.usAudio, "usAudio"),
  ].filter(Boolean).join("");
  return controls ? `<div class="resource-pronunciations">${controls}</div>` : "";
}

function renderResourceSenseHeading(part, showPronunciation) {
  const pronunciation = showPronunciation ? renderPartPronunciations(part) : "";
  return `<div class="resource-sense-heading">
    <span class="resource-sense-pos">${escapeHtml(part?.partOfSpeech || "")}</span>
    ${pronunciation}
  </div>`;
}

function resourceInlineAudioButton(src, label) {
  src = resolveDemoAudioURL(src);
  if (!src) return "";
  return `<button type="button" class="resource-inline-audio" data-resource-audio="${escapeHtml(src)}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">
    <span class="resource-audio-icon">${icons.audio}</span>
  </button>`;
}

function renderPronunciationGuidanceCard(audio) {
  if (!audio) return "";
  return `<section class="resource-guidance-card" data-resource-guidance-card>
    <img class="resource-guidance-avatar" src="${escapeHtml(knowledgeAssetUrl("images", "pronunciation-expert-yanling-v1.png"))}" alt="燕翎老师" />
    <div class="resource-guidance-content">
      <div class="resource-guidance-profile">
        <strong>燕翎老师（语音指导）</strong>
        <span>北大外语学院副教授，语音学专家</span>
      </div>
      <div class="resource-guidance-player">
        ${resourceInlineAudioButton(audio, "播放发音指导")}
        <input type="range" min="0" max="100" value="0" step="0.1" data-resource-guidance-progress aria-label="发音指导播放进度" />
        <time data-resource-guidance-time>00:00 / 00:00</time>
      </div>
    </div>
  </section>`;
}

function resourceUsageTags(sense) {
  return [sense.transitivity, sense.countability, sense.emphasis, sense.register]
    .filter(Boolean)
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join("");
}

function renderResourceSenseLine(sense, selected = false, element = "div") {
  const tags = resourceUsageTags(sense);
  return `<${element} class="resource-sense-line ${selected ? "is-context" : ""}">
    <span class="resource-sense-copy">
      ${tags ? `<span class="resource-sense-meta">${tags}</span>` : ""}
      ${sense?.chinese ? `<span class="resource-sense-meaning">${escapeHtml(sense.chinese)}</span>` : ""}
      ${sense?.chunk ? `<span class="resource-sense-chunk">${escapeHtml(sense.chunk)}${sense.chunkChinese ? ` ${escapeHtml(sense.chunkChinese)}` : ""}</span>` : ""}
    </span>
    ${selected ? "<b>当前语境</b>" : ""}
  </${element}>`;
}

function contextMeaningFromExplanation(item) {
  const explanation = String(item?.explainOne || item?.explainTwo || "").trim();
  const match = explanation.match(/此处意为\s*[“"]([^”"]+)[”"]/);
  return match?.[1]?.trim() || "";
}

function renderLibrarySenses(context, fallbackMeaning) {
  const selected = context?.selected || (fallbackMeaning ? { chinese: fallbackMeaning } : null);
  const selectedPartOfSpeech = selected?.part?.partOfSpeech || context?.part?.partOfSpeech || "";
  const showPartPronunciations = libraryPronunciationGroups(context?.word).length > 1;
  const count = context?.allSenses?.length || 1;
  if (!context && !selected) return "";
  if (context && !selected) return renderLibrarySenseOverview(context, "词库暂未收录当前语境义，以下为全部释义");
  if (!context || count <= 1) {
    if (!selected) return "";
    return `<section class="resource-meanings is-single ${showPartPronunciations ? "has-part-pronunciations" : ""}">
      ${showPartPronunciations ? renderResourceSenseHeading(selected?.part || context?.part, true) : ""}
      ${renderResourceSenseLine(selected, true)}
    </section>`;
  }
  const selectedSenseId = Number(context?.selected?.id || 0);
  return `<details class="resource-meanings resource-all-senses">
    <summary class="resource-current-summary ${showPartPronunciations ? "has-part-pronunciations" : ""}">
      <span class="resource-current-copy">
        ${showPartPronunciations ? renderResourceSenseHeading(selected?.part || context?.part, true) : selectedPartOfSpeech ? `<span class="resource-collapsed-pos">${escapeHtml(selectedPartOfSpeech)}</span>` : ""}
        ${selected ? renderResourceSenseLine(selected, true, "span") : ""}
      </span>
      <span class="resource-senses-action">
        <span class="when-closed">展开所有释义</span>
        <span class="when-open">收起所有释义</span>
        <i>${icons["chevron-down"]}</i>
      </span>
    </summary>
    <div class="resource-sense-groups">
      ${context.word.parts.map((part) => {
        const senses = part.senses.filter((sense) => !selectedSenseId || Number(sense.id) !== selectedSenseId);
        if (!senses.length) return "";
        const continuesCurrentPart = selectedSenseId && Number(context.selected?.part?.id) === Number(part.id);
        return `<section class="${continuesCurrentPart ? "continues-current-part" : ""} ${showPartPronunciations ? "has-part-pronunciations" : ""}">
        ${showPartPronunciations ? renderResourceSenseHeading(part, true) : `<div class="resource-sense-pos">${continuesCurrentPart ? "" : escapeHtml(part.partOfSpeech || "")}</div>`}
        <div class="resource-sense-list">
          ${senses.map((sense) => renderResourceSenseLine(sense)).join("")}
        </div>
      </section>`;
      }).join("")}
    </div>
  </details>`;
}

function renderResourceExamples(entry) {
  const examples = Array.isArray(entry?.sub) ? entry.sub.filter((item) => item?.sentence || item?.translate) : [];
  if (!examples.length) return "";
  return `<section class="resource-examples">
    <h4>例句</h4>
    ${examples.map((example) => `<div>
      ${example.sentence ? `<p>${renderResourceMarkup(example.sentence)}</p>` : ""}
      ${example.translate ? `<small>${renderResourceMarkup(example.translate)}</small>` : ""}
    </div>`).join("")}
  </section>`;
}

function renderLibrarySenseOverview(context, notice = "") {
  if (!context?.word?.parts?.length) return "";
  const showPartPronunciations = libraryPronunciationGroups(context.word).length > 1;
  return `<section class="resource-meanings resource-sense-overview">
    ${notice ? `<p class="resource-sense-unmatched">${escapeHtml(notice)}</p>` : ""}
    ${context.word.parts.map((part) => `<section class="${showPartPronunciations ? "has-part-pronunciations" : ""}">
      ${showPartPronunciations ? renderResourceSenseHeading(part, true) : `<div class="resource-sense-pos">${escapeHtml(part.partOfSpeech || "")}</div>`}
      <div class="resource-sense-list">
        ${part.senses.map((sense) => renderResourceSenseLine(sense)).join("")}
      </div>
    </section>`).join("")}
  </section>`;
}

function renderResourceImageFrame(image, alt) {
  if (!image || !knowledgeAssetAvailable("images", image)) return "";
  return `<div class="resource-image-frame">
    <img src="${escapeHtml(knowledgeAssetUrl("images", image))}" alt="${escapeHtml(alt || "讲解配图")}" />
    <button type="button" class="resource-image-fullscreen" data-resource-image-fullscreen aria-label="全屏查看配图" title="全屏查看配图">${icons.expand}<span>全屏查看</span></button>
  </div>`;
}

function renderLibraryWordNotes(word, item) {
  if (!word) return "";
  const notes = [
    ...(resourceSubtypeLabel("词汇", item) === "构词点拨"
      ? [{ title: "构词点拨", content: word.derivation, image: "" }]
      : []),
    { title: "语义点拨", content: word.semanticNote, image: "" },
    { title: "词源点拨", content: word.etymology, image: "" },
  ];
  const contrasts = ((getQuestion(state.currentQuestionId)?.realOnly || state.activeBookKey === "test-single-book"
    ? window.TEST_SINGLE_BOOK?.knowledgeLibrary?.contrasts : FULLSCREEN_KNOWLEDGE_LIBRARY.contrasts) || []).filter((item) => item.wordIds.includes(Number(word.id)));
  contrasts.forEach((item) => notes.push({ title: "词义辨析", content: item.content, image: item.image || "" }));
  const available = notes.filter(({ content }) => String(content || "").trim());
  if (!available.length) return "";
  return `<div class="resource-word-notes">
    ${available.map(({ title, content, image }) => `<section class="resource-word-note ${image ? "has-media" : ""}">
      <div class="resource-word-note-copy">
        <h4>${escapeHtml(title)}</h4>
        <p>${renderResourceMarkup(content)}</p>
      </div>
      ${image ? `<aside class="resource-word-note-media">${renderResourceImageFrame(image, `${word.word}词义辨析配图`)}</aside>` : ""}
    </section>`).join("")}
  </div>`;
}

function renderDictionaryEntry(entry, item) {
  const context = libraryContextForEntry(entry, item);
  const contextMeaning = context?.selected?.chinese || entry.chinese || contextMeaningFromExplanation(item);
  const pronunciationGroups = libraryPronunciationGroups(context?.word).length > 1 ? "" : renderLibraryPronunciations(context?.word);
  const guidanceAudio = context?.word?.guidanceAudio;
  const guidanceControl = knowledgeAssetAvailable("guidanceAudio", guidanceAudio)
    ? renderPronunciationGuidanceCard(knowledgeAssetUrl("guidanceAudio", guidanceAudio))
    : "";
  return `<article class="knowledge-entry ${context ? "has-library-entry" : ""}">
    <div class="knowledge-term">
      ${entry.word ? `<span class="knowledge-word ${context ? "is-library-word" : ""}">${escapeHtml(entry.word)}</span>` : ""}
      ${!context && entry.part_of_speech ? `<i class="knowledge-pos">${escapeHtml(entry.part_of_speech)}</i>` : ""}
    </div>
    ${pronunciationGroups}
    ${guidanceControl}
    ${renderLibrarySenses(context, contextMeaning)}
    ${renderLibraryWordNotes(context?.word, item)}
    ${renderResourceExamples(entry)}
  </article>`;
}

function resourceMediaDetail(item, contexts) {
  const source = libraryResourceForItem(item);
  const itemImage = item.imageUrl || item.image || item.videoCover || item.coverUrl || item.cover || source?.image || source?.videoCover || "";
  const itemVideo = item.videoUrl || item.video || source?.video || "";
  let image = knowledgeAssetAvailable("images", itemImage) ? itemImage : "";
  if (!image) {
    image = contexts.map((context) => context?.selected?.image || context?.word?.image).find((filename) => knowledgeAssetAvailable("images", filename)) || "";
  }
  const hasVideo = knowledgeAssetAvailable("videos", itemVideo);
  if (!image && !hasVideo) return "";
  return `<aside class="resource-media-panel">
    ${hasVideo ? `<video controls playsinline preload="metadata" ${image ? `poster="${escapeHtml(knowledgeAssetUrl("images", image))}"` : ""}><source src="${escapeHtml(knowledgeAssetUrl("videos", itemVideo))}" type="video/mp4"></video>` : renderResourceImageFrame(image, item.title || source?.title || item.prominent || "讲解配图")}
  </aside>`;
}

function analysisAudioUrl(filename) {
  return filename ? `./assets/knowledge/audio/analysis/${encodeURIComponent(filename)}` : "";
}

function resourceAnalysisAudioButton(filename, label) {
  if (!filename) return "";
  return resourceInlineAudioButton(analysisAudioUrl(filename), label);
}

function resourceAnalysisExample(source, item) {
  const example = item?.example || source?.example || "";
  const translation = item?.exampleTranslation || source?.exampleTranslation || "";
  const audio = item?.exampleAudio || source?.exampleAudio || "";
  if (!example && !translation && !audio) return "";
  return `<section class="resource-examples"><h4>例句</h4><div>
    ${example ? `<p class="resource-example-line"><span>${renderResourceMarkup(example)}</span>${audio ? resourceAnalysisAudioButton(audio, "播放例句") : ""}</p>` : ""}
    ${translation ? `<small>${renderResourceMarkup(translation)}</small>` : ""}
    ${!example && audio ? `<div class="resource-example-audio">${resourceAnalysisAudioButton(audio, "播放例句")}</div>` : ""}
  </div></section>`;
}

function renderPronunciationResource(item, source) {
  const word = item.word || source?.word || "";
  const partOfSpeech = item.partOfSpeech || source?.partOfSpeech || "";
  const context = word ? libraryContextForEntry({ word, part_of_speech: partOfSpeech }, item) : null;
  const pronunciationGroups = libraryPronunciationGroups(context?.word).length > 1 ? "" : renderLibraryPronunciations(context?.word);
  const target = word || item.prominent || item.highlightTarget || source?.prominent || "";
  const pronunciation = item.pronunciationPhenomenon || source?.pronunciationPhenomenon || "";
  const pronunciationAudio = item.pronunciationAudio || source?.pronunciationAudio || "";
  const explanation = item.content || source?.content || "";
  const pronunciationLines = String(pronunciation).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const pronunciationSentence = pronunciationLines.shift() || "";
  const pronunciationNotes = pronunciationLines.join("\n");
  return `<article class="knowledge-entry pronunciation-entry ${word ? "" : "is-phrase"} ${pronunciation ? "has-phenomenon" : ""}">
    ${target && !pronunciation ? `<div class="knowledge-term"><span class="knowledge-word ${context ? "is-library-word" : ""}">${renderResourceTargetLabel(target)}</span>${!context && partOfSpeech ? `<i class="knowledge-pos">${escapeHtml(partOfSpeech)}</i>` : ""}</div>` : ""}
    ${pronunciationGroups}
    ${renderLibrarySenses(context, "")}
    ${pronunciation ? `<section class="pronunciation-phenomenon"><p class="pronunciation-sentence"><span>${renderPronunciationMarkup(pronunciationSentence)}</span>${pronunciationAudio ? resourceAnalysisAudioButton(pronunciationAudio, "播放语音现象") : ""}</p>${pronunciationNotes ? `<p class="pronunciation-notes">${renderPronunciationMarkup(pronunciationNotes)}</p>` : ""}</section>` : pronunciationAudio ? `<div class="resource-pronunciations">${resourceAnalysisAudioButton(pronunciationAudio, "播放语音现象")}</div>` : ""}
    ${String(explanation).trim() ? `<section class="knowledge-explanation is-unlabeled"><p>${renderResourceMarkup(explanation)}</p></section>` : ""}
    ${resourceAnalysisExample(source, item)}
  </article>`;
}

function resourceItemDetail(item) {
  const source = libraryResourceForItem(item);
  const examplesFirst = item.resourceType === "实用表达" || source?.resourceType === "实用表达";
  if (item.resourceType === "语音" || source?.resourceType === "语音") {
    return `<div class="resource-detail-layout"><div class="resource-detail-copy">${renderPronunciationResource(item, source)}</div></div>`;
  }
  if (Array.isArray(item.content)) {
    const contexts = item.content.map((entry) => libraryContextForEntry(entry, item));
    const entries = item.content.map((entry) => renderDictionaryEntry(entry, item)).join("");
    const explanation = item.explainOne || item.explainTwo;
    const explanationMarkup = explanation ? `<section class="knowledge-explanation is-unlabeled"><p>${renderResourceMarkup(explanation)}</p></section>` : "";
    const primary = `<div class="resource-detail-copy">${entries + explanationMarkup}</div>`;
    const media = resourceMediaDetail(item, contexts);
    return `<div class="resource-detail-layout ${media ? "has-media" : ""}">${primary}${media}</div>`;
  }
  if (item.content && typeof item.content === "object") {
    const summary = Object.values(item.content)
      .filter((value) => typeof value === "string" && value.trim())
      .slice(0, 3)
      .join("\n");
    const copy = summary ? `<p class="resource-markup-copy">${renderResourceMarkup(summary)}</p>` : source?.content ? `<p class="resource-markup-copy">${renderResourceMarkup(source.content)}</p>` : "";
    const media = resourceMediaDetail(item, []);
    const examples = resourceAnalysisExample(source, item);
    if (media && !copy && !examples) return `<div class="resource-detail-layout media-only">${media}</div>`;
    const body = examplesFirst
      ? `${examples}${copy || `<p class="knowledge-empty">暂无文字说明</p>`}`
      : `${copy || `<p class="knowledge-empty">暂无文字说明</p>`}${examples}`;
    return `<div class="resource-detail-layout ${media ? "has-media" : ""}"><div class="resource-detail-copy">${body}</div>${media}</div>`;
  }
  const text = item.content || item.explainOne || item.explainTwo || source?.content || "";
  const copy = String(text).trim() ? `<p class="resource-markup-copy">${renderResourceMarkup(text)}</p>` : "";
  const media = resourceMediaDetail(item, []);
  const examples = resourceAnalysisExample(source, item);
  if (media && !copy && !examples) return `<div class="resource-detail-layout media-only">${media}</div>`;
  const body = examplesFirst
      ? `${examples}${copy || `<p class="knowledge-empty">暂无文字说明</p>`}`
      : `${copy || `<p class="knowledge-empty">暂无文字说明</p>`}${examples}`;
  return `<div class="resource-detail-layout ${media ? "has-media" : ""}"><div class="resource-detail-copy">${body}</div>${media}</div>`;
}

function stripMarkup(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderResourceMarkup(value) {
  let source = String(value ?? "").replace(/[\u200B-\u200D\uFEFF]/g, "");
  const centerFirstLine = source.includes("*update*");
  source = source.replace(/\*update\*/g, "");
  let html = escapeHtml(source)
    .replace(/###([\s\S]*?)###/g, '<strong class="resource-mark-strong">$1</strong>')
    .replace(/\*\*([\s\S]*?)\*\*/g, '<em class="resource-mark-emphasis">$1</em>')
    .replace(/\$\$([\s\S]*?)\$\$/g, '<span class="resource-phonetic-mark">$1</span>')
    .replace(/@([^@\n]+)@/g, '<span class="resource-phonetic-mark">$1</span>')
    .replace(/\{([^{}\n]+)\}/g, '<span class="resource-mark-red">$1</span>')
    .replace(/《([^《》]+)》/g, '<span class="resource-mark-title">$1</span>');
  if (centerFirstLine) {
    const newlineIndex = html.indexOf("\n");
    const firstLine = newlineIndex >= 0 ? html.slice(0, newlineIndex) : html;
    const rest = newlineIndex >= 0 ? html.slice(newlineIndex + 1) : "";
    html = `<span class="resource-centered-first-line">${firstLine}</span>${rest ? `\n${rest}` : ""}`;
  }
  return html.replace(/\r?\n/g, "<br>");
}

function renderPronunciationMarkup(value) {
  return escapeHtml(String(value ?? "").replace(/[\u200B-\u200D\uFEFF]/g, ""))
    .replace(/《([^《》]+)》/g, '<span class="resource-linking-mark">$1</span>')
    .replace(/\$\$([\s\S]*?)\$\$/g, '<span class="resource-pronunciation-mark">$1</span>')
    .replace(/@([^@\n]+)@/g, '<span class="resource-pronunciation-mark">$1</span>')
    .replace(/\{([^{}\n]+)\}/g, '<span class="resource-pronunciation-mark">$1</span>')
    .replace(/\r?\n/g, "<br>");
}

function renderResourceTargetLabel(value) {
  const source = String(value ?? "")
    .replace(/_\d+\s*$/, "")
    .replace(/\s*#\s*/g, " … ");
  return renderResourceMarkup(source);
}

function sliceSentenceMarkup(markup, start, end) {
  const holder=document.createElement("div");holder.innerHTML=markup;
  const walker=document.createTreeWalker(holder,NodeFilter.SHOW_TEXT),nodes=[],markers=[];let offset=0,node;
  while((node=walker.nextNode())){
    const marker=node.parentElement?.closest(".demo-clue-number");
    if(marker){markers.push({element:marker,position:offset});continue;}
    nodes.push({node,start:offset,end:offset+node.textContent.length});offset+=node.textContent.length;
  }
  const a=nodes.find(x=>x.end>start),b=[...nodes].reverse().find(x=>x.start<end);
  if(!a||!b)return "";
  const range=document.createRange(),marker=markers.find(x=>x.position===start);
  if(marker)range.setStartBefore(marker.element);else range.setStart(a.node,Math.max(0,start-a.start));
  range.setEnd(b.node,Math.min(b.node.textContent.length,end-b.start));
  let content=range.cloneContents();
  let ancestor=range.commonAncestorContainer.nodeType===Node.TEXT_NODE ? range.commonAncestorContainer.parentElement : range.commonAncestorContainer;
  while(ancestor&&ancestor!==holder){
    if(ancestor.matches?.(".resource-highlight,.demo-clue")){const wrapper=ancestor.cloneNode(false);wrapper.append(content);content=wrapper;}
    ancestor=ancestor.parentElement;
  }
  const copy=document.createElement("div");copy.append(content);return copy.innerHTML;
}

function renderTranscript(q) {
  const visible = state.showAnalysis || isTranscriptForcedVisible();
  els.transcriptPanel.classList.toggle("hidden", !visible);
  if (!visible) {
    els.transcript.innerHTML = "";
    return;
  }
  const time = findTimecode(q);
  const segments = time?.segments || [];
  const clueIndex = findClueIndex(segments, q);
  const speakerGroups = buildSpeakerGroups(segments);
  const translationGroups = time?.translationGroups?.length
    ? time.translationGroups
    : canonicalTranslationGroups(q);
  const englishTranscript = speakerGroups.map((group, groupIndex) => `
    <div class="turn-group ${speakerClassName(group.speaker)}-group" data-speaker-group-row="${groupIndex}">
      <div class="speaker-track">
        <button class="speaker ${speakerClassName(group.speaker)}" data-speaker-group="${groupIndex}" title="播放${group.speaker}当前完整话轮" aria-label="播放${group.speaker}当前完整话轮">${group.speaker}</button>
        <span></span>
      </div>
      <div class="speaker-paragraph">
        ${state.showTranscriptTranslation ? "" : '<p class="transcript-paragraph">'}
        ${group.items.map(({ seg, index }) => {
          const masked = state.maskTranscriptActive && !state.maskRevealedSegments.has(index);
          const label = state.maskTranscriptActive ? masked ? "点击显示本句原文" : "点击重新遮挡本句" : "播放本句录音";
          const sourceHTML = decorateResourceHighlights(seg.text, q, "录音稿");
          const sentence = (text, unit) => `<span class="sentence ${index === clueIndex ? "clue" : ""} ${masked ? "transcript-masked" : ""}" data-play-segment="${index}" data-sentence-start="${unit?.startChar ?? 0}" data-sentence-end="${unit?.endChar ?? seg.text.length}" aria-label="${label}">${text}</span>`;
          if (!state.showTranscriptTranslation) return sentence(sourceHTML);
          const units = seg.sentenceUnits || [{ text: seg.text, translation: seg.translation || (group.items.length === 1 ? translationGroups[group.turnIndex]?.text : "") }];
          // Split already-decorated DOM ranges so clue/resource offsets continue to refer to the original segment.
          return units.map((unit) => {
            let html = sourceHTML;
            if (Number.isInteger(unit.startChar) && Number.isInteger(unit.endChar) && units.length > 1) {
              html = sliceSentenceMarkup(sourceHTML,unit.startChar,unit.endChar);
            }
            return `<div class="transcript-sentence-pair"><p class="transcript-paragraph">${sentence(html,unit)}</p>${unit.translation ? `<p class="turn-translation" lang="zh-CN">${decorateTranslationClue(unit.translation,q)}</p>` : ""}</div>`;
          }).join("");
        }).join(" ")}
        ${state.showTranscriptTranslation ? "" : "</p>"}
      </div>
    </div>`).join("");
  els.transcript.innerHTML = englishTranscript;
  els.transcript.querySelectorAll("[data-play-segment]").forEach((node) => {
    node.addEventListener("click", (event) => {
      const index = Number(node.dataset.playSegment);
      if (state.maskTranscriptActive) {
        event.preventDefault();
        const revealed = state.maskRevealedSegments.has(index);
        if (revealed) {
          state.maskRevealedSegments.delete(index);
          els.transcript.querySelectorAll(`[data-play-segment="${index}"]`).forEach(copy=>copy.classList.add("transcript-masked"));
          node.setAttribute("aria-label", "点击显示本句原文");
        } else {
          state.maskRevealedSegments.add(index);
          els.transcript.querySelectorAll(`[data-play-segment="${index}"]`).forEach(copy=>copy.classList.remove("transcript-masked"));
          node.setAttribute("aria-label", "点击重新遮挡本句");
        }
        return;
      }
      const resourceNode = event.target.closest("[data-resource-highlight]");
      if (resourceNode) {
        event.preventDefault();
        const type = resourceNode.dataset.resourceHighlight;
        const index = Number(resourceNode.dataset.resourceIndex);
        const item = knowledgeItemsForQuestion(q, type)[index];
        if (item) showResourcePopover(event, type, item);
        return;
      }
      if (state.followReadActive) startFollowRead([index], { endAfterQueue: true });
      else playSegment(index);
    });
  });
  els.transcript.querySelectorAll("[data-speaker-group]").forEach((node) => {
    const group = speakerGroups[Number(node.dataset.speakerGroup)];
    const first = group?.items[0]?.index;
    const last = group?.items[group.items.length - 1]?.index;
    node.addEventListener("click", () => {
      const indices = group?.items.map((item) => item.index) || [];
      if (state.followReadActive) startFollowRead(indices, { endAfterQueue: true });
      else playSpeakerRange(first, last);
    });
  });
}

function buildSpeakerGroups(segments) {
  const groups = [];
  const firstExplicitSpeaker = segments
    .map((seg) => String(seg.speaker || "").trim().toUpperCase())
    .find((speaker) => ["M", "W"].includes(speaker));
  let previousSpeaker = firstExplicitSpeaker || "M";
  segments.forEach((seg, index) => {
    const rawSpeaker = String(seg.speaker || "").trim();
    const explicitSpeaker = ["M", "W"].includes(rawSpeaker.toUpperCase()) ? rawSpeaker.toUpperCase() : null;
    const speaker = explicitSpeaker || previousSpeaker;
    const last = groups[groups.length - 1];
    const turnIndex = Number.isInteger(seg.turnIndex) ? seg.turnIndex : null;
    const sameTurn = turnIndex === null
      ? last?.speaker === speaker
      : last?.turnIndex === turnIndex;
    if (last && sameTurn) {
      last.items.push({ seg, index });
    } else {
      groups.push({
        speaker,
        turnIndex: turnIndex === null ? groups.length : turnIndex,
        items: [{ seg, index }],
      });
    }
    previousSpeaker = speaker;
  });
  return groups;
}

function speakerClassName(speaker) {
  if (speaker === "W") return "w";
  return "m";
}

function canonicalTranslationGroups(q) {
  const resource = textResourceForQuestion(q);
  if (!resource?.sourceTranslation) return [];
  const lines = resource.sourceTranslation.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.map((line, index) => {
    const match = line.match(/^(W|M)\s*[：:]\s*(.*)$/i);
    return match
      ? { speaker: match[1].toUpperCase(), text: match[2] }
      : { speaker: resource.canonicalTurns?.[index]?.speaker || "M", text: line };
  });
}

const CIRCLED_QUESTION_NUMBERS = [
  "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩",
  "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳",
];

function decorateTranslationClue(text, q) {
  const value = String(text || "");
  const marker = CIRCLED_QUESTION_NUMBERS[Number(q.questionNo) - 1];
  const markerIndex = marker ? value.indexOf(marker) : -1;
  if (markerIndex < 0) return escapeHtml(value);

  let start = markerIndex;
  while (start > 0 && CIRCLED_QUESTION_NUMBERS.includes(value[start - 1])) start -= 1;
  const punctuationOffset = value.slice(markerIndex).search(/[。！？!?]/);
  const end = punctuationOffset < 0 ? value.length : markerIndex + punctuationOffset + 1;
  return `${escapeHtml(value.slice(0, start))}<span class="translation-clue">${escapeHtml(value.slice(start, end))}</span>${escapeHtml(value.slice(end))}`;
}

function decorateResourceHighlights(text, q, targetAreas = "录音稿") {
  const type = state.activeKnowledgeType;
  if (!type) return escapeHtml(text);
  const areas = new Set(Array.isArray(targetAreas) ? targetAreas : [targetAreas]);
  const items = knowledgeItemsForQuestion(q, type);
  const targets = items
    .map((item, index) => ({ index, text: String(item.highlightTarget || "").trim() }))
    .filter((target) => target.text && areas.has(items[target.index]?.targetArea || "录音稿"))
    .sort((a, b) => b.text.length - a.text.length);
  if (!targets.length) return escapeHtml(text);

  const matches = [];
  for (const target of targets) {
    const matcher = resourceTargetPattern(target.text);
    const pattern = matcher.pattern;
    let occurrenceIndex = 0;
    let match;
    while ((match = pattern.exec(text))) {
      occurrenceIndex += 1;
      if (matcher.occurrence && occurrenceIndex !== matcher.occurrence) {
        if (!match[0].length || occurrenceIndex > matcher.occurrence) break;
        continue;
      }
      if (!matches.some((item) => match.index < item.end && match.index + match[0].length > item.start)) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          index: target.index,
        });
      }
      if (matcher.occurrence) break;
      if (!match[0].length) break;
    }
  }
  if (!matches.length) return escapeHtml(text);
  matches.sort((a, b) => a.start - b.start);
  let cursor = 0;
  let output = "";
  for (const match of matches) {
    output += escapeHtml(text.slice(cursor, match.start));
    output += `<button type="button" class="resource-highlight resource-${knowledgeClassName(type)}" data-resource-highlight="${escapeHtml(type)}" data-resource-index="${match.index}" data-resource-question-id="${escapeHtml(q.id)}" title="查看${escapeHtml(type)}讲解">${escapeHtml(text.slice(match.start, match.end))}</button>`;
    cursor = match.end;
  }
  return output + escapeHtml(text.slice(cursor));
}

function bindQuestionResourceHighlights(defaultQuestion) {
  els.fullQuestion.querySelectorAll("[data-resource-highlight]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const question = getQuestion(button.dataset.resourceQuestionId) || defaultQuestion;
      const type = button.dataset.resourceHighlight;
      const item = knowledgeItemsForQuestion(question, type)[Number(button.dataset.resourceIndex)];
      if (item) showResourcePopover(event, type, item);
    });
  });
}

function resourceTargetPattern(target) {
  const occurrenceMatch = String(target).match(/_(\d+)\s*$/);
  const source = String(target)
    .replace(/_\d+\s*$/, "")
    .replace(/[《》]/g, "");
  const escaped = source
    .split("#")
    .map((part) => part
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+")
      .replace(/[’']/g, "[’']")
      .replace(/[-–—]/g, "[-–—]"))
    .join("[\\s\\S]*?");
  const wholeTarget = `(?<![A-Za-z0-9'])${escaped}(?![A-Za-z0-9'])`;
  return {
    pattern: new RegExp(wholeTarget, "gu"),
    occurrence: occurrenceMatch ? Number(occurrenceMatch[1]) : 0,
  };
}

function knowledgeClassName(type) {
  return {
    词汇: "vocabulary",
    语音: "phonetics",
    语法: "grammar",
    微技能: "skill",
    百科知识: "encyclopedia",
    话题词汇: "topic",
    实用表达: "expression",
  }[type] || "generic";
}

function findClueIndex(segments, q) {
  const clue = normalize(q.clueSentence);
  if (clue) {
    const found = segments.findIndex((seg) => {
      const text = normalize(seg.text);
      return text.includes(clue.slice(0, Math.min(24, clue.length))) || clue.includes(text.slice(0, Math.min(24, text.length)));
    });
    if (found >= 0) return found;
  }
  return 0;
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function findTimecode(q) {
  const set = state.timecodes.sets.find((item) => item.setId === q.setId);
  return set?.texts.find((item) => item.textNo === q.textNo);
}

function timecodeAudioUrl(timecode) {
  const source = String(timecode?.audioPath || timecode?.sourceAudioPath || "").replace(/\\/g, "/").trim();
  if (!source) return "";
  if (source.startsWith("prototype/")) return `./${source.slice("prototype/".length)}`;
  if (source.startsWith("./") || source.startsWith("../") || source.startsWith("/")) return source;
  return `./${source}`;
}

function isTranscriptForcedVisible() {
  return state.followReadActive || state.maskTranscriptActive;
}

function clearFollowReadTimer() {
  if (state.followReadTimer) window.clearTimeout(state.followReadTimer);
  state.followReadTimer = null;
}

function ensureFollowReadWaveformBars(container) {
  const bars = $(".follow-read-waveform-bars", container);
  if (!bars || bars.childElementCount) return;
  const fragment = document.createDocumentFragment();
  const profile = [
    12, 16, 22, 30, 38, 28, 24, 32,
    44, 58, 72, 60, 46, 34, 26, 22,
    30, 48, 40, 64, 82, 70, 54, 42,
    58, 76, 94, 80, 66, 52, 44, 60,
    48, 38, 32, 42, 58, 70, 54, 38,
    30, 44, 56, 46, 34, 28, 38, 48,
    38, 30, 26, 32, 28, 22, 18, 14,
  ];
  const levels = profile.flatMap((level, index) => {
    const next = profile[index + 1] ?? level;
    return [level, Math.round((level + next) / 2)];
  });
  levels.forEach((level, index) => {
    const bar = document.createElement("i");
    bar.style.setProperty("--level", String(level));
    bar.style.setProperty("--duration", `${1180 + (index % 7) * 120}ms`);
    bar.style.setProperty("--delay", `${-((index * 137) % 2200)}ms`);
    fragment.appendChild(bar);
  });
  bars.appendChild(fragment);
}

function syncFollowReadWaveform() {
  const container = $("#followReadWaveform");
  if (!container) return;
  ensureFollowReadWaveformBars(container);
  const visible = state.followReadActive && ["waiting", "waiting-paused"].includes(state.followReadPhase);
  container.classList.toggle("visible", visible);
  container.classList.toggle("paused", state.followReadPhase === "waiting-paused");
  container.setAttribute("aria-hidden", String(!visible));
}

function followReadRecordingKey(q = getQuestion(state.currentQuestionId)) {
  return q ? `${q.setId}:${q.textNo}` : "";
}

function restoreFollowReadSnapshot(restore) {
  const snapshot = state.followReadRestoreSnapshot;
  if (restore && snapshot) {
    const { recordingKey, ...teachingState } = snapshot;
    Object.assign(state, teachingState);
    // Leaving this recording must not resurrect translations from another script.
    if (recordingKey !== followReadRecordingKey()) {
      state.showTranscriptTranslation = false;
      state.showQuestionTranslation = false;
    }
  }
  state.followReadRestoreSnapshot = null;
}

function resetTranscriptTeachingModes({ restoreAnalysis = false, pauseAudio = true } = {}) {
  if (state.practiceModeActive) stopPracticeMode({ restore: restoreAnalysis, render: false });
  clearFollowReadTimer();
  if (pauseAudio) els.audio.pause();
  restoreFollowReadSnapshot(restoreAnalysis);
  state.followReadActive = false;
  state.followReadQueue = [];
  state.followReadQueueIndex = -1;
  state.followReadPhase = null;
  state.followReadWaitRemainingMs = 0;
  state.followReadWaitStartedAt = 0;
  state.followReadEndAfterQueue = false;
  state.followReadPendingSeekTime = null;
  state.maskTranscriptActive = false;
  state.maskRevealedSegments.clear();
  state.playbackStopTime = null;
  state.playbackScope = null;
  state.playingSegmentIndex = null;
  setPlayButton(false);
  syncFollowReadWaveform();
}

function stopFollowRead({ restoreAnalysis = true, render = true, pauseAudio = true } = {}) {
  clearFollowReadTimer();
  if (pauseAudio) els.audio.pause();
  try { els.audio.currentTime = 0; } catch {}
  restoreFollowReadSnapshot(restoreAnalysis);
  state.followReadActive = false;
  state.followReadQueue = [];
  state.followReadQueueIndex = -1;
  state.followReadPhase = null;
  state.followReadWaitRemainingMs = 0;
  state.followReadWaitStartedAt = 0;
  state.followReadEndAfterQueue = false;
  state.followReadPendingSeekTime = null;
  state.maskTranscriptActive = false;
  state.maskRevealedSegments.clear();
  state.playbackStopTime = null;
  state.playbackScope = null;
  state.playingSegmentIndex = null;
  setPlayButton(false);
  syncFollowReadWaveform();
  if (render && !els.fullscreenPage.classList.contains("hidden")) renderFull();
}

function toggleFollowRead() {
  if (state.practiceModeActive) return;
  if (state.followReadActive) {
    stopFollowRead();
    return;
  }
  const q = getQuestion(state.currentQuestionId);
  const segments = findTimecode(q)?.segments || [];
  if (!segments.length) return;
  state.followReadRestoreSnapshot = {
    showAnswer: state.showAnswer,
    showAnswerAnalysis: state.showAnswerAnalysis,
    showAnalysis: state.showAnalysis,
    showQuestionTranslation: state.showQuestionTranslation,
    showTranscriptTranslation: state.showTranscriptTranslation,
    activeKnowledgeType: state.activeKnowledgeType,
    recordingKey: followReadRecordingKey(),
    questionPanelCollapsed: state.questionPanelCollapsed,
  };
  state.showAnswer = false;
  state.showAnswerAnalysis = false;
  state.showAnalysis = false;
  state.showQuestionTranslation = false;
  state.questionPanelCollapsed = true;
  state.maskTranscriptActive = true;
  state.maskRevealedSegments.clear();
  state.activeKnowledgeType = null;
  state.showTranscriptTranslation = false;
  closeResourcePopover();
  state.followReadActive = true;
  renderFull();
  startFollowRead(segments.map((_, index) => index));
}

function startFollowRead(indices, { endAfterQueue = false } = {}) {
  if (!state.followReadActive) return;
  const q = getQuestion(state.currentQuestionId);
  const segments = findTimecode(q)?.segments || [];
  const queue = [...new Set(indices.filter((index) => Number.isInteger(index) && segments[index]))];
  if (!queue.length) {
    stopFollowRead();
    return;
  }
  clearFollowReadTimer();
  els.audio.pause();
  state.followReadQueue = queue;
  state.followReadQueueIndex = 0;
  state.followReadPhase = "playing";
  state.followReadWaitRemainingMs = 0;
  state.followReadEndAfterQueue = endAfterQueue;
  state.playbackStopTime = null;
  state.playbackScope = null;
  syncFollowReadWaveform();
  playCurrentFollowReadSentence();
}

function playCurrentFollowReadSentence() {
  const q = getQuestion(state.currentQuestionId);
  const index = state.followReadQueue[state.followReadQueueIndex];
  const segment = findTimecode(q)?.segments?.[index];
  if (!state.followReadActive || !segment) {
    stopFollowRead();
    return;
  }
  state.followReadPhase = "playing";
  syncFollowReadWaveform();
  state.playingSegmentIndex = index;
  const questionId = state.currentQuestionId;
  const begin = () => {
    if (!state.followReadActive || state.currentQuestionId !== questionId
      || state.followReadQueue[state.followReadQueueIndex] !== index || state.followReadPhase !== "playing") return;
    els.audio.currentTime = Number(segment.start || 0);
    els.audio.play().then(() => {
      if (state.followReadActive && state.currentQuestionId === questionId && state.followReadPhase === "playing") setPlayButton(true);
    }).catch(() => setPlayButton(false));
  };
  if (els.audio.readyState >= 1) begin();
  else els.audio.addEventListener("loadedmetadata", begin, { once: true });
  markPlayingSegment();
}

function beginFollowReadWait() {
  const q = getQuestion(state.currentQuestionId);
  const index = state.followReadQueue[state.followReadQueueIndex];
  const segment = findTimecode(q)?.segments?.[index];
  if (!state.followReadActive || !segment) {
    stopFollowRead();
    return;
  }
  els.audio.pause();
  els.audio.currentTime = Number(segment.end || els.audio.currentTime);
  state.followReadPhase = "waiting";
  state.followReadWaitRemainingMs = Math.max(0, Number(segment.end || 0) - Number(segment.start || 0)) * 1300;
  syncFollowReadWaveform();
  scheduleFollowReadWait();
  setPlayButton(true);
}

function scheduleFollowReadWait() {
  clearFollowReadTimer();
  state.followReadWaitStartedAt = Date.now();
  state.followReadTimer = window.setTimeout(() => {
    state.followReadTimer = null;
    advanceFollowRead();
  }, state.followReadWaitRemainingMs);
}

function pauseFollowReadWait() {
  if (state.followReadPhase !== "waiting") return;
  const elapsed = Math.max(0, Date.now() - state.followReadWaitStartedAt);
  state.followReadWaitRemainingMs = Math.max(0, state.followReadWaitRemainingMs - elapsed);
  clearFollowReadTimer();
  state.followReadPhase = "waiting-paused";
  syncFollowReadWaveform();
  setPlayButton(false);
}

function resumeFollowReadWait() {
  if (state.followReadPhase !== "waiting-paused") return;
  state.followReadPhase = "waiting";
  syncFollowReadWaveform();
  scheduleFollowReadWait();
  setPlayButton(true);
}

function completeFollowReadQueue() {
  clearFollowReadTimer();
  els.audio.pause();
  try { els.audio.currentTime = 0; } catch {}
  state.followReadQueueIndex = -1;
  state.followReadPhase = "completed";
  state.followReadWaitRemainingMs = 0;
  state.followReadPendingSeekTime = null;
  state.playingSegmentIndex = null;
  setPlayButton(false);
  markPlayingSegment();
  syncFollowReadWaveform();
  updateAudioProgress();
}

function advanceFollowRead() {
  if (!state.followReadActive) return;
  state.followReadQueueIndex += 1;
  if (state.followReadQueueIndex >= state.followReadQueue.length) {
    completeFollowReadQueue();
    return;
  }
  playCurrentFollowReadSentence();
}

function applyFollowReadSeek() {
  if (!state.followReadActive || !Number.isFinite(state.followReadPendingSeekTime)) return;
  const target = state.followReadPendingSeekTime;
  state.followReadPendingSeekTime = null;
  const q = getQuestion(state.currentQuestionId);
  const segments = findTimecode(q)?.segments || [];
  const index = segments.findIndex((segment) => target >= Number(segment.start || 0) && target < Number(segment.end || 0));
  const nextIndex = index >= 0 ? index : segments.findIndex((segment) => Number(segment.start || 0) > target);
  if (nextIndex < 0) {
    completeFollowReadQueue();
    return;
  }
  startFollowRead(segments.slice(nextIndex).map((_, offset) => nextIndex + offset));
}

function toggleTranscriptMask() {
  if (!state.followReadActive) return;
  state.maskTranscriptActive = !state.maskTranscriptActive;
  state.maskRevealedSegments.clear();
  renderFull();
}

const PRACTICE_AUDIO_ROOT = "./assets/audio/practice";
const PRACTICE_SECONDS_PER_QUESTION = 5;
const PRACTICE_CHECK_SECONDS = 60;
const PRACTICE_GLOBAL_INSTRUCTION_FILES = {
  first: "section-1-instruction.mp3",
  second: "section-2-instruction.mp3",
  ending: "ending-instruction.mp3",
};
const PRACTICE_INSTRUCTION_FILES = {
  "1": "question-1.wav",
  "2": "question-2.wav",
  "3": "question-3.wav",
  "4": "question-4.wav",
  "5": "question-5.wav",
  "6-7": "questions-6-7.wav",
  "8-9": "questions-8-9.wav",
  "10-12": "questions-10-12.wav",
  "13-16": "questions-13-16.wav",
  "17-20": "questions-17-20.wav",
};

function practiceTextKey(q = getQuestion(state.currentQuestionId)) {
  if (els.fullscreenPage.dataset.mode === "similar") return q ? String(q.id) : "";
  return q ? `${q.setId}-${q.textNo}` : "";
}

function practiceSection(q = getQuestion(state.currentQuestionId)) {
  return q?.questionType === "短对话" ? "first" : "second";
}

function practiceUsesFullPaperStages() {
  return state.explainOrder === "natural" && els.fullscreenPage.dataset.mode !== "similar";
}

function practiceSectionKey(q, section = practiceSection(q)) {
  return q ? `${q.setId}-${section}` : "";
}

function nextPracticeTextQuestionId() {
  if (els.fullscreenPage.dataset.mode === "similar") {
    const ids = currentLectureIds();
    const currentIndex = ids.indexOf(state.currentQuestionId);
    return currentIndex >= 0 ? ids[currentIndex + 1] || null : ids[0] || null;
  }
  const currentKey = state.practiceTextKey || practiceTextKey();
  const seen = new Set();
  let currentFound = false;
  for (const id of currentLectureIds()) {
    const q = getQuestion(id);
    const key = practiceTextKey(q);
    if (!q || seen.has(key)) continue;
    seen.add(key);
    if (currentFound) return q.id;
    if (key === currentKey) currentFound = true;
  }
  return null;
}

function practiceConfig(q = getQuestion(state.currentQuestionId)) {
  if (!q) return null;
  const isSimilar = els.fullscreenPage.dataset.mode === "similar";
  const questions = (isSimilar ? [q] : currentTextLectureIds(q).map(getQuestion))
    .filter(Boolean)
    .sort((a, b) => a.questionNo - b.questionNo);
  if (!questions.length || !findTimecode(q) || !cleanAudioFilename(q)) return null;
  const first = Number(questions[0].questionNo);
  const last = Number(questions.at(-1).questionNo);
  const range = first === last ? String(first) : `${first}-${last}`;
  const instructionFile = PRACTICE_INSTRUCTION_FILES[range] || "";
  return {
    q,
    questions,
    instructionSrc: !isSimilar && instructionFile ? `${PRACTICE_AUDIO_ROOT}/${instructionFile}` : "",
    repeats: isSimilar ? state.similarPracticeRepeats : q.questionType === "短对话" ? state.practiceShortDialogueRepeats : 2,
    readingMs: Math.max(1, questions.length) * PRACTICE_SECONDS_PER_QUESTION * 1000,
    answeringMs: Math.max(1, questions.length) * PRACTICE_SECONDS_PER_QUESTION * 1000,
  };
}

function clearPracticeTimer({ keepCallback = false } = {}) {
  if (state.practiceTimer) window.clearTimeout(state.practiceTimer);
  if (state.practiceCountdownTicker) window.clearInterval(state.practiceCountdownTicker);
  state.practiceTimer = null;
  state.practiceCountdownTicker = null;
  if (!keepCallback) state.practiceTimerCallback = null;
}

function practiceTimerRemaining() {
  if (!state.practiceTimerStartedAt || state.practicePaused) return state.practiceTimerRemainingMs;
  return Math.max(0, state.practiceTimerRemainingMs - (Date.now() - state.practiceTimerStartedAt));
}

function formatPracticeCountdown(seconds) {
  const total = Math.max(0, Math.ceil(seconds || 0));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function syncPracticePlaybackStatus() {
  const status = $("#practicePlaybackStatus");
  if (!status) return;
  status.classList.toggle("hidden", !state.practiceModeActive);
  if (!state.practiceModeActive) {
    status.textContent = "";
    return;
  }
  const remaining = Math.ceil(practiceTimerRemaining() / 1000);
  const isSimilar = els.fullscreenPage.dataset.mode === "similar";
  const similarIndex = Math.max(0, currentLectureIndex());
  const similarTotal = currentLectureIds().length;
  const labels = {
    instruction: "听指令",
    reading: `请阅读相关小题 ${formatPracticeCountdown(remaining)}`,
    ding: "听指令",
    recording: isSimilar
      ? `第${similarIndex + 1}/${similarTotal}题 · 第${state.practiceRepeatIndex}遍`
      : `听录音 · 第${state.practiceRepeatIndex}遍`,
    answering: `请回答 ${formatPracticeCountdown(remaining)}`,
    checking: `请检查 ${formatPracticeCountdown(remaining)}`,
    ending: "听指令",
    completed: "本次练习完成",
  };
  status.textContent = labels[state.practicePhase] || "套题播放";
  status.classList.toggle("paused", state.practicePaused);
}

function lockPracticeProgress() {
  els.audio.pause();
  try { els.audio.currentTime = 0; } catch {}
  $("#audioSeek").value = "0";
  $("#audioSeek").disabled = true;
  $("#audioCurrentTime").textContent = "00:00";
  updateSeekBubble(false);
}

function startPracticeDelay(phase, durationMs, callback) {
  clearPracticeTimer();
  state.practicePhase = phase;
  state.practicePaused = false;
  state.practiceTimerRemainingMs = durationMs;
  state.practiceTimerStartedAt = Date.now();
  state.practiceTimerCallback = callback;
  lockPracticeProgress();
  const complete = () => {
    const next = state.practiceTimerCallback;
    clearPracticeTimer();
    state.practiceTimerRemainingMs = 0;
    if (state.practiceModeActive) next?.();
  };
  state.practiceTimer = window.setTimeout(complete, durationMs);
  state.practiceCountdownTicker = window.setInterval(syncPracticePlaybackStatus, 250);
  setPlayButton(true);
  syncPracticePlaybackStatus();
}

function pausePracticeDelay() {
  state.practiceTimerRemainingMs = practiceTimerRemaining();
  state.practicePaused = true;
  clearPracticeTimer({ keepCallback: true });
  setPlayButton(false);
  syncPracticePlaybackStatus();
}

function resumePracticeDelay() {
  const callback = state.practiceTimerCallback;
  startPracticeDelay(state.practicePhase, state.practiceTimerRemainingMs, callback);
}

function playPracticeAuxiliary(src, phase, playbackRate = 1, callback = null) {
  clearPracticeTimer();
  els.practiceInstructionAudio.pause();
  state.practicePhase = phase;
  state.practicePaused = false;
  state.practiceAuxiliaryCallback = callback;
  lockPracticeProgress();
  els.practiceInstructionAudio.src = resolveDemoAudioURL(src);
  els.practiceInstructionAudio.playbackRate = playbackRate;
  els.practiceInstructionAudio.currentTime = 0;
  els.practiceInstructionAudio.play().then(() => setPlayButton(true)).catch(handlePracticeInstructionAudioEnded);
  syncPracticePlaybackStatus();
}

function playPracticeDing(callback) {
  playPracticeAuxiliary(`${PRACTICE_AUDIO_ROOT}/ding.wav`, "ding", 1, callback);
}

function playPracticeRecording(repeatIndex = 1) {
  const config = practiceConfig();
  if (!config) {
    finishPracticeSequence();
    return;
  }
  clearPracticeTimer();
  els.practiceInstructionAudio.pause();
  state.practiceAuxiliaryCallback = null;
  state.practicePhase = "recording";
  state.practicePaused = false;
  state.practiceRepeatIndex = repeatIndex;
  state.playbackStopTime = null;
  state.playbackScope = null;
  els.audio.currentTime = 0;
  els.audio.playbackRate = state.playbackRate;
  $("#audioSeek").disabled = false;
  updateAudioProgress();
  els.audio.play().then(() => setPlayButton(true)).catch(() => setPlayButton(false));
  syncPracticePlaybackStatus();
}

function advancePracticeRecording() {
  const config = practiceConfig();
  if (!config) {
    finishPracticeSequence();
    return;
  }
  if (state.practiceRepeatIndex < config.repeats) {
    playPracticeRecording(state.practiceRepeatIndex + 1);
    return;
  }
  if (els.fullscreenPage.dataset.mode === "similar") {
    finishPracticeSequence();
    return;
  }
  startPracticeDelay("answering", config.answeringMs, finishPracticeSequence);
}

function handlePracticeInstructionAudioEnded() {
  if (!state.practiceModeActive || state.practicePaused) return;
  const callback = state.practiceAuxiliaryCallback;
  state.practiceAuxiliaryCallback = null;
  callback?.();
}

function playPracticeInstruction(src, callback, phase = "instruction") {
  if (!state.practiceChineseInstruction || !src) {
    callback?.();
    return;
  }
  playPracticeAuxiliary(src, phase, state.playbackRate, callback);
}

function startPracticeTextFlow(config) {
  if (!config || !state.practiceModeActive) return;
  if (els.fullscreenPage.dataset.mode === "similar") {
    playPracticeRecording(1);
    return;
  }
  if (config.q.questionType === "短对话") {
    startPracticeDelay("reading", config.readingMs, () => {
      playPracticeDing(() => playPracticeInstruction(config.instructionSrc, () => playPracticeRecording(1)));
    });
    return;
  }
  playPracticeDing(() => {
    playPracticeInstruction(config.instructionSrc, () => {
      startPracticeDelay("reading", config.readingMs, () => playPracticeRecording(1));
    });
  });
}

function startPracticeTextWithSectionInstruction(config) {
  const section = practiceSection(config?.q);
  const sectionKey = practiceSectionKey(config?.q, section);
  if (!practiceUsesFullPaperStages() || !sectionKey || state.practiceIntroducedSections.has(sectionKey)) {
    startPracticeTextFlow(config);
    return;
  }
  state.practiceIntroducedSections.add(sectionKey);
  const instructionFile = PRACTICE_GLOBAL_INSTRUCTION_FILES[section];
  playPracticeInstruction(`${PRACTICE_AUDIO_ROOT}/${instructionFile}`, () => startPracticeTextFlow(config));
}

function completePracticeSequence() {
  state.practicePhase = "completed";
  state.practicePaused = false;
  state.practiceAuxiliaryCallback = null;
  $("#audioSeek").disabled = false;
  setPlayButton(false);
  syncPracticePlaybackStatus();
  updateAudioProgress();
  window.setTimeout(() => {
    if (!state.practiceModeActive || state.practicePhase !== "completed") return;
    stopPracticeMode({ restore: false, render: false });
    resetTranscriptTeachingModes({ restoreAnalysis: false, pauseAudio: false });
    state.showAnswer = false;
    state.showAnswerAnalysis = false;
    state.showAnalysis = false;
    state.questionPanelCollapsed = false;
    state.showQuestionTranslation = false;
    state.showTranscriptTranslation = false;
    state.activeKnowledgeType = null;
    closeResourcePopover();
    if (!els.fullscreenPage.classList.contains("hidden")) renderFull();
  }, 600);
}

function startPracticeClosingStages() {
  state.practiceClosingStagesStarted = true;
  startPracticeDelay("checking", PRACTICE_CHECK_SECONDS * 1000, () => {
    const endingSrc = `${PRACTICE_AUDIO_ROOT}/${PRACTICE_GLOBAL_INSTRUCTION_FILES.ending}`;
    playPracticeInstruction(endingSrc, completePracticeSequence, "ending");
  });
}

function finishPracticeSequence() {
  clearPracticeTimer();
  els.audio.pause();
  els.practiceInstructionAudio.pause();
  const nextQuestionId = nextPracticeTextQuestionId();
  if (nextQuestionId) {
    setCurrentLectureQuestion(nextQuestionId);
    requestAnimationFrame(() => {
      const scroller = els.fullscreenPage.querySelector(".full-grid");
      if (scroller) scroller.scrollTop = 0;
    });
    return;
  }
  if (practiceUsesFullPaperStages() && !state.practiceClosingStagesStarted) {
    startPracticeClosingStages();
    return;
  }
  completePracticeSequence();
}

function startPracticeSequence() {
  const config = practiceConfig();
  if (!state.practiceModeActive || !config) return;
  clearPracticeTimer();
  els.audio.pause();
  els.practiceInstructionAudio.pause();
  state.practiceTextKey = practiceTextKey(config.q);
  state.practiceRepeatIndex = 0;
  state.practicePaused = false;
  state.practiceAuxiliaryCallback = null;
  lockPracticeProgress();
  startPracticeTextWithSectionInstruction(config);
}

function stopPracticeMode({ restore = true, render = true } = {}) {
  clearPracticeTimer();
  els.audio.pause();
  els.practiceInstructionAudio.pause();
  if (restore && state.practiceRestoreSnapshot) {
    Object.assign(state, state.practiceRestoreSnapshot);
  }
  state.practiceModeActive = false;
  state.practicePhase = "idle";
  state.practicePaused = false;
  state.practiceRepeatIndex = 0;
  state.practiceTextKey = "";
  state.practiceAuxiliaryCallback = null;
  state.practiceIntroducedSections = new Set();
  state.practiceClosingStagesStarted = false;
  state.practiceRestoreSnapshot = null;
  $("#audioSeek").disabled = false;
  setPlayButton(false);
  if (render && !els.fullscreenPage.classList.contains("hidden")) renderFull();
}

function togglePracticeMode() {
  if (state.practiceModeActive) {
    stopPracticeMode();
    return;
  }
  const config = practiceConfig();
  const isSimilar = els.fullscreenPage.dataset.mode === "similar";
  if (!config || (!isSimilar && !config.instructionSrc)) {
    showAppNotice("当前材料暂不支持套题播放。", "warning");
    return;
  }
  if (state.followReadActive) stopFollowRead({ restoreAnalysis: true, render: false });
  state.practiceRestoreSnapshot = {
    showAnswer: state.showAnswer,
    showAnswerAnalysis: state.showAnswerAnalysis,
    showAnalysis: state.showAnalysis,
    questionPanelCollapsed: state.questionPanelCollapsed,
    showQuestionTranslation: state.showQuestionTranslation,
    showTranscriptTranslation: state.showTranscriptTranslation,
    activeKnowledgeType: state.activeKnowledgeType,
  };
  state.showAnswer = false;
  state.showAnswerAnalysis = false;
  state.showAnalysis = false;
  state.questionPanelCollapsed = false;
  state.showQuestionTranslation = false;
  state.showTranscriptTranslation = false;
  state.activeKnowledgeType = null;
  state.practiceModeActive = true;
  state.practiceIntroducedSections = new Set();
  state.practiceClosingStagesStarted = false;
  closeResourcePopover();
  renderFull();
  startPracticeSequence();
}

function setPracticeShortDialogueRepeats(repeats) {
  state.practiceShortDialogueRepeats = repeats === 1 ? 1 : 2;
  demoStorage.setItem("victor:practiceShortDialogueRepeats", String(state.practiceShortDialogueRepeats));
  syncPracticeSettingsUi();
}

function setPracticeQuestionsVisible(visible) {
  state.practiceQuestionsVisible = Boolean(visible);
  if (!els.fullscreenPage.classList.contains("hidden")) renderFull();
}

function setSimilarPracticeRepeats(repeats) {
  state.similarPracticeRepeats = repeats === 1 ? 1 : 2;
  demoStorage.setItem("victor:similarPracticeRepeats", String(state.similarPracticeRepeats));
  syncPracticeSettingsUi();
}

function setPracticeChineseInstruction(enabled) {
  state.practiceChineseInstruction = Boolean(enabled);
  demoStorage.setItem("victor:practiceChineseInstruction", String(state.practiceChineseInstruction));
  syncPracticeSettingsUi();
  if (!state.practiceModeActive || state.practiceChineseInstruction) return;
  if (["instruction", "ending"].includes(state.practicePhase)) {
    els.practiceInstructionAudio.pause();
    const callback = state.practiceAuxiliaryCallback;
    state.practiceAuxiliaryCallback = null;
    callback?.();
  }
}

function syncPracticeSettingsUi() {
  const questionVisibilityButton = $("#practiceQuestionVisibilityBtn");
  if (questionVisibilityButton) {
    const visible = state.practiceQuestionsVisible;
    questionVisibilityButton.classList.toggle("active", visible);
    questionVisibilityButton.setAttribute("aria-pressed", String(visible));
    questionVisibilityButton.textContent = visible ? "显示试题" : "隐藏试题";
    questionVisibilityButton.setAttribute("aria-label", questionVisibilityButton.textContent);
    questionVisibilityButton.title = visible ? "当前显示试题；点击隐藏试题" : "当前隐藏试题；点击显示试题";
  }
  const shortOnceButton = $("#practiceShortOnceBtn");
  const isSimilar = els.fullscreenPage.dataset.mode === "similar";
  const repeats = isSimilar ? state.similarPracticeRepeats : state.practiceShortDialogueRepeats;
  const shortOnce = repeats === 1;
  if (shortOnceButton) {
    shortOnceButton.classList.toggle("active", !shortOnce);
    shortOnceButton.setAttribute("aria-pressed", String(!shortOnce));
    shortOnceButton.querySelector("span:first-child").textContent = isSimilar ? "播放" : "短对话";
    shortOnceButton.querySelector("span:last-child").textContent = `${repeats}遍`;
    shortOnceButton.setAttribute("aria-label", `${isSimilar ? "同类题" : "短对话"}播放${repeats}遍`);
    shortOnceButton.title = `${isSimilar ? "同类题" : "短对话"}当前播放${repeats}遍；点击改为${shortOnce ? 2 : 1}遍`;
  }
  const instructionButton = $("#practiceInstructionBtn");
  if (instructionButton) {
    instructionButton.classList.toggle("hidden", isSimilar);
    instructionButton.setAttribute("aria-hidden", String(isSimilar));
    instructionButton.classList.toggle("active", state.practiceChineseInstruction);
    instructionButton.setAttribute("aria-pressed", String(state.practiceChineseInstruction));
    instructionButton.textContent = state.practiceChineseInstruction ? "播放指令" : "跳过指令";
    instructionButton.title = state.practiceChineseInstruction ? "当前播放指令；点击跳过指令" : "当前跳过指令；点击播放指令";
  }
}

function bindAudio(q) {
  const time = findTimecode(q);
  const audioSource = resolveDemoAudioURL(timecodeAudioUrl(time));
  const available = Boolean(time && audioSource);
  $("#playPause").disabled = !available;
  $("#audioSeek").disabled = !available || (state.practiceModeActive && state.practicePhase !== "recording" && state.practicePhase !== "completed");
  if (!available) {
    els.audio.pause();
    $("#audioSeek").value = "0";
    $("#audioDuration").textContent = "--:--";
    setPlayButton(false);
    return;
  }
  const currentSrc = new URL(els.audio.getAttribute("src") || "", location.href).pathname;
  const nextSrc = new URL(audioSource, location.href).pathname;
  if (currentSrc !== nextSrc) {
    els.audio.src = audioSource;
    els.audio.load();
    els.audio.playbackRate = state.playbackRate;
    $("#audioSeek").value = "0";
    $("#audioDuration").textContent = "--:--";
  }
}

function playSegment(index, preserveScope = false) {
  const q = getQuestion(state.currentQuestionId);
  const seg = findTimecode(q)?.segments[index];
  if (!seg) return;
  if (!preserveScope) {
    state.playbackStopTime = seg.end;
    state.playbackScope = "sentence";
  }
  const start = Number(seg.start || 0);
  els.audio.dataset.pendingSegmentStart = String(start);
  state.playingSegmentIndex = index;
  markPlayingSegment();
  const beginPlayback = () => {
    if (Number(els.audio.dataset.pendingSegmentStart) !== start) return;
    delete els.audio.dataset.pendingSegmentStart;
    els.audio.currentTime = start;
    els.audio.play().then(() => setPlayButton(true)).catch(() => {
      state.playbackStopTime = null;
      state.playbackScope = null;
      state.playingSegmentIndex = null;
      setPlayButton(false);
      markPlayingSegment();
    });
  };
  if (els.audio.readyState >= 1) beginPlayback();
  else els.audio.addEventListener("loadedmetadata", beginPlayback, { once: true });
}

function playSpeakerGroup(groupIndex) {
  const q = getQuestion(state.currentQuestionId);
  const segments = findTimecode(q)?.segments || [];
  const indices = buildSpeakerGroups(segments)[groupIndex]?.items.map((item) => item.index) || [];
  playSpeakerRange(indices[0], indices[indices.length - 1]);
}

function playSpeakerRange(first, last) {
  const q = getQuestion(state.currentQuestionId);
  const segments = findTimecode(q)?.segments || [];
  if (!Number.isInteger(first) || !Number.isInteger(last) || !segments[first] || !segments[last]) return;
  state.playbackStopTime = segments[last].end;
  state.playbackScope = "group";
  playSegment(first, true);
}

function toggleAudio() {
  invalidateResourceMainAudioResume();
  if (state.practiceModeActive) {
    if (state.practicePhase === "completed") {
      startPracticeSequence();
      return;
    }
    if (["reading", "answering", "checking"].includes(state.practicePhase)) {
      if (state.practicePaused) resumePracticeDelay();
      else pausePracticeDelay();
      return;
    }
    if (["instruction", "ding"].includes(state.practicePhase)) {
      if (state.practicePaused) {
        state.practicePaused = false;
        els.practiceInstructionAudio.play().then(() => setPlayButton(true)).catch(() => setPlayButton(false));
      } else {
        state.practicePaused = true;
        els.practiceInstructionAudio.pause();
        setPlayButton(false);
      }
      syncPracticePlaybackStatus();
      return;
    }
    if (els.audio.paused) {
      state.practicePaused = false;
      els.audio.play().then(() => setPlayButton(true)).catch(() => setPlayButton(false));
    } else {
      state.practicePaused = true;
      els.audio.pause();
      setPlayButton(false);
    }
    syncPracticePlaybackStatus();
    return;
  }
  if (state.followReadActive) {
    if (state.followReadPhase === "completed") {
      const segments = findTimecode(getQuestion(state.currentQuestionId))?.segments || [];
      startFollowRead(segments.map((_, index) => index));
      return;
    }
    if (state.followReadPhase === "waiting") {
      pauseFollowReadWait();
      return;
    }
    if (state.followReadPhase === "waiting-paused") {
      resumeFollowReadWait();
      return;
    }
    if (els.audio.paused) {
      els.audio.play().then(() => setPlayButton(true)).catch(() => setPlayButton(false));
    } else {
      els.audio.pause();
      setPlayButton(false);
    }
    return;
  }
  if (els.audio.paused) {
    els.audio.play();
    setPlayButton(true);
  } else {
    els.audio.pause();
    setPlayButton(false);
  }
}

function updatePlayingSegment() {
  updateAudioProgress();
  const q = getQuestion(state.currentQuestionId);
  const segments = findTimecode(q)?.segments || [];
  const current = segments.findIndex((seg) => els.audio.currentTime >= seg.start && els.audio.currentTime <= seg.end);
  if (current !== state.playingSegmentIndex) {
    state.playingSegmentIndex = current;
    markPlayingSegment();
  }
  if (state.followReadActive && state.followReadPhase === "playing") {
    const index = state.followReadQueue[state.followReadQueueIndex];
    const segment = segments[index];
    if (segment && els.audio.currentTime >= Number(segment.end || 0)) beginFollowReadWait();
    return;
  }
  if (Number.isFinite(state.playbackStopTime) && els.audio.currentTime >= state.playbackStopTime) {
    const mustStop = true;
    state.playbackStopTime = null;
    state.playbackScope = null;
    if (mustStop) {
      els.audio.pause();
      setPlayButton(false);
    }
  }
}

function formatAudioTime(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
}

function formatChineseDuration(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safe / 60);
  const remainingSeconds = safe % 60;
  if (!minutes) return `${remainingSeconds}秒`;
  if (!remainingSeconds) return `${minutes}分钟`;
  return `${minutes}分钟${remainingSeconds}秒`;
}

function updateAudioProgress() {
  const duration = Number.isFinite(els.audio.duration) ? els.audio.duration : 0;
  if (state.practiceModeActive && state.practicePhase !== "recording" && state.practicePhase !== "completed") {
    $("#audioCurrentTime").textContent = "00:00";
    $("#audioDuration").textContent = duration ? formatAudioTime(duration) : "--:--";
    $("#audioSeek").value = "0";
    updateSeekBubble(false);
    return;
  }
  $("#audioCurrentTime").textContent = formatAudioTime(els.audio.currentTime);
  $("#audioDuration").textContent = duration ? formatAudioTime(duration) : "--:--";
  $("#audioSeek").value = duration ? String(Math.round(els.audio.currentTime / duration * 1000)) : "0";
  updateSeekBubble(false);
}

function updateAudioProgressVisibility() {
  $("#audioProgressFloat").classList.remove("hidden");
}

function updateSeekBubble(show) {
  const seek = $("#audioSeek");
  const bubble = $("#audioSeekBubble");
  const duration = Number.isFinite(els.audio.duration) ? els.audio.duration : 0;
  const value = Number(seek.value || 0);
  const percent = Math.max(0, Math.min(100, value / 10));
  const seconds = duration ? value / 1000 * duration : els.audio.currentTime;
  seek.style.setProperty("--seek-percent", `${percent}%`);
  bubble.textContent = formatAudioTime(seconds);
  bubble.style.left = `${percent}%`;
  if (show) $("#audioProgressFloat").classList.add("seeking");
}

function hideSeekBubble() {
  $("#audioProgressFloat").classList.remove("seeking");
}

function toggleSpeedMenu() {
  const menu = $("#speedMenu");
  const willOpen = menu.classList.contains("hidden");
  menu.classList.toggle("hidden", !willOpen);
  if (willOpen) {
    const bounds = $("#speedMenuToggle").getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(bounds.left, innerWidth - menu.offsetWidth - 12))}px`;
    menu.style.bottom = `${innerHeight - bounds.top + 8}px`;
  }
  $("#speedMenuToggle").setAttribute("aria-expanded", String(willOpen));
}

function closeSpeedMenu() {
  $("#speedMenu").classList.add("hidden");
  $("#speedMenuToggle").setAttribute("aria-expanded", "false");
}

function setPlaybackRate(rate, closeMenu = true) {
  const validRate = PLAYBACK_RATES.includes(rate) ? rate : 1;
  state.playbackRate = validRate;
  els.audio.playbackRate = state.playbackRate;
  if (state.practiceModeActive && state.practicePhase === "instruction") {
    els.practiceInstructionAudio.playbackRate = state.playbackRate;
  }
  $("#speedValue").textContent = `${state.playbackRate.toFixed(1)}x`;
  $$("[data-playback-rate]").forEach((button) => {
    const selected = Number(button.dataset.playbackRate) === state.playbackRate;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-checked", String(selected));
  });
  if (closeMenu) closeSpeedMenu();
}

function markPlayingSegment() {
  els.transcript.querySelectorAll("[data-play-segment]").forEach((node) => {
    node.classList.toggle("playing", Number(node.dataset.playSegment) === state.playingSegmentIndex);
  });
  els.transcript.querySelectorAll("[data-speaker-group-row]").forEach((node) => {
    const active = Boolean(node.querySelector(`[data-play-segment="${state.playingSegmentIndex}"]`));
    node.classList.toggle("playing-turn", active);
  });
}

function scrollToClue() {
  const clue = els.transcript.querySelector(".sentence.clue") || els.transcript.querySelector(".sentence");
  if (clue) clue.scrollIntoView({ block: "center", behavior: "smooth" });
}

function renderWrongNav() {
  const ids = currentLectureIds();
  const isSimilar = els.fullscreenPage.dataset.mode === "similar";
  const isAudioOnly = state.audioOnlyPlayback;
  const setIds = explainSetIds();
  const renderQuestionButton = (id, displayNo) => {
    const q = getQuestion(id);
    const original = state.originalExplainIds.includes(id);
    const rate = classCorrectRate(q);
    const missingClassStatistics = Boolean(q.realOnly && !classResultForQuestion(q).total);
    const rateLabel = missingClassStatistics ? "--" : `${rate}%`;
    const ringStyle = isSimilar || isAudioOnly ? "" : `style="--ring:${missingClassStatistics ? "var(--lecture-border)" : rateColor(rate)};--rate:${rate * 3.6}deg"`;
    const title = isSimilar
      ? `同类题第${displayNo}题`
      : isAudioOnly
        ? `${q.setName} · 第${q.questionNo}题`
        : `${q.setName} · Text ${q.textNo} · 第${q.questionNo}题 · 正答率${rateLabel}`;
    return `<button class="nav-dot ${isSimilar || isAudioOnly ? "similar-nav-dot" : ""} ${id === state.currentQuestionId ? "current" : ""} ${original ? "original-selected" : ""}" ${ringStyle} data-jump="${id}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">
      <span class="nav-number">${displayNo}</span>
      ${isSimilar || isAudioOnly ? "" : `<span class="nav-rate">${rateLabel}</span>`}
      ${original && !isSimilar && !isAudioOnly ? '<i class="original-marker" aria-hidden="true"></i>' : ""}
    </button>`;
  };

  const groups = [];
  ids.forEach((id, index) => {
    const q = getQuestion(id);
    if (!q) return;
    const key = isSimilar ? id : `${q.setId}-${q.textNo}`;
    let group = groups.find((item) => item.key === key);
    if (!group) {
      group = {
        key,
        ids: [],
        firstIndex: index,
        setId: q.setId,
        setName: q.setName,
        textNo: q.textNo,
      };
      groups.push(group);
    }
    group.ids.push(id);
  });

  const renderTextColumn = (group) => {
    const setIndex = setIds.indexOf(group.setId) + 1;
    const label = isSimilar ? "同类题" : `${setIndex} · T${group.textNo}`;
    return `
      <div class="nav-text-column">
        <span class="nav-text-label">${label}</span>
        <div class="nav-text-questions">
          ${group.ids.map((id, groupIndex) => {
            const q = getQuestion(id);
            const absoluteIndex = group.firstIndex + groupIndex;
            const displayNo = isSimilar ? absoluteIndex + 1 : q.questionNo;
            return renderQuestionButton(id, displayNo);
          }).join("")}
        </div>
      </div>
    `;
  };

  if (!isSimilar) {
    els.wrongNavItems.innerHTML = `
      <section class="nav-set-section" aria-label="${state.activeExplainSetId === "all" ? "全部 Text 题池" : "当前套题 Text"}">
        <div class="nav-text-matrix">
          ${groups.map(renderTextColumn).join("")}
        </div>
      </section>
    `;
    els.wrongNavItems.querySelectorAll("[data-jump]").forEach((button) => {
      button.addEventListener("click", () => setCurrentLectureQuestion(button.dataset.jump));
    });
    updateLectureStepper();
    requestAnimationFrame(updateQuestionPickerScrollbar);
    return;
  }

  const setSections = [];
  groups.forEach((group) => {
    let section = setSections.find((item) => item.setId === group.setId);
    if (!section) {
      section = { setId: group.setId, setName: group.setName, groups: [] };
      setSections.push(section);
    }
    section.groups.push(group);
  });

  els.wrongNavItems.innerHTML = setSections.map((section) => `
    <section class="nav-set-section">
      ${setSections.length > 1 && !isSimilar ? `<div class="nav-set-title">${escapeHtml(section.setName)}</div>` : ""}
      <div class="nav-text-matrix ${isSimilar ? "similar-matrix" : ""}">
        ${section.groups.map(renderTextColumn).join("")}
      </div>
    </section>
  `).join("");
  els.wrongNavItems.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => setCurrentLectureQuestion(button.dataset.jump));
  });
  updateLectureStepper();
  requestAnimationFrame(updateQuestionPickerScrollbar);
}

function updateQuestionPickerScrollbar() {
  const viewportHeight = els.wrongNavItems.clientHeight;
  const contentHeight = els.wrongNavItems.scrollHeight;
  const trackHeight = els.questionPickerScrollbar.clientHeight;
  if (!viewportHeight || !trackHeight) return;

  const scrollRange = Math.max(0, contentHeight - viewportHeight);
  const hasOverflow = scrollRange > 1;
  const thumbHeight = hasOverflow
    ? Math.max(36, trackHeight * viewportHeight / contentHeight)
    : trackHeight;
  const thumbTravel = Math.max(0, trackHeight - thumbHeight);
  const scrollRatio = hasOverflow ? els.wrongNavItems.scrollTop / scrollRange : 0;
  const position = Math.round(Math.min(1, Math.max(0, scrollRatio)) * 100);

  els.questionPickerScrollbar.classList.toggle("no-overflow", !hasOverflow);
  els.questionPickerScrollThumb.style.height = `${thumbHeight}px`;
  els.questionPickerScrollThumb.style.transform = `translateY(${thumbTravel * scrollRatio}px)`;
  els.questionPickerScrollbar.setAttribute("aria-valuenow", String(position));
  els.questionPickerScrollbar.setAttribute("aria-valuetext", hasOverflow ? `当前滚动到 ${position}%` : "全部内容已显示");
  els.questionPickerScrollbar.title = hasOverflow ? `题目列表：当前滚动到 ${position}%` : "题目列表：全部内容已显示";
}

function startQuestionPickerScroll(event) {
  const track = els.questionPickerScrollbar;
  if (track.classList.contains("no-overflow")) return;
  event.preventDefault();

  const viewportHeight = els.wrongNavItems.clientHeight;
  const scrollRange = els.wrongNavItems.scrollHeight - viewportHeight;
  const trackHeight = track.clientHeight;
  const thumbHeight = els.questionPickerScrollThumb.offsetHeight;
  const thumbTravel = Math.max(1, trackHeight - thumbHeight);

  if (event.target !== els.questionPickerScrollThumb) {
    const trackRect = track.getBoundingClientRect();
    const targetOffset = Math.min(thumbTravel, Math.max(0, event.clientY - trackRect.top - thumbHeight / 2));
    els.wrongNavItems.scrollTop = targetOffset / thumbTravel * scrollRange;
    updateQuestionPickerScrollbar();
  }

  const startY = event.clientY;
  const startScrollTop = els.wrongNavItems.scrollTop;
  track.classList.add("is-dragging");
  track.setPointerCapture(event.pointerId);

  const move = (moveEvent) => {
    const delta = moveEvent.clientY - startY;
    els.wrongNavItems.scrollTop = startScrollTop + delta / thumbTravel * scrollRange;
  };
  const stop = (stopEvent) => {
    track.classList.remove("is-dragging");
    if (track.hasPointerCapture(stopEvent.pointerId)) track.releasePointerCapture(stopEvent.pointerId);
    track.removeEventListener("pointermove", move);
    track.removeEventListener("pointerup", stop);
    track.removeEventListener("pointercancel", stop);
  };
  track.addEventListener("pointermove", move);
  track.addEventListener("pointerup", stop);
  track.addEventListener("pointercancel", stop);
}

function currentLectureIds() {
  const isSimilar = els.fullscreenPage.dataset.mode === "similar";
  return isSimilar ? state.explainIds : activeSetExplainIds();
}

function currentTextLectureIds(q) {
  if (!q || els.fullscreenPage.dataset.mode === "similar") return currentLectureIds();
  return currentLectureIds().filter((id) => {
    const item = getQuestion(id);
    return item && item.setId === q.setId && item.textNo === q.textNo;
  });
}

function audioOnlyVisibleQuestionIds(q) {
  if (!q) return [];
  if (q.questionType === "短对话") {
    return currentLectureIds().filter((id) => {
      const item = getQuestion(id);
      return item && item.setId === q.setId && item.questionType === "短对话";
    }).slice(0, 5);
  }
  return currentTextLectureIds(q);
}

function currentLectureIndex() {
  return currentLectureIds().indexOf(state.currentQuestionId);
}

function lectureQuestionLabel(q, index = currentLectureIndex()) {
  if (els.fullscreenPage.dataset.mode === "similar") return `第 ${index + 1} 题`;
  return `第 ${q.questionNo} 题`;
}

function updateLectureStepper() {
  const ids = currentLectureIds();
  const index = currentLectureIndex();
  const q = getQuestion(state.currentQuestionId);
  $("#currentQuestionPicker").textContent = q ? lectureQuestionLabel(q, index) : "选择题目";
  $("#prevQuestion").disabled = index <= 0;
  $("#nextQuestion").disabled = index < 0 || index >= ids.length - 1;
  els.fullscreenPage.classList.toggle("question-picker-open", !$("#questionPickerPanel").classList.contains("hidden"));
}

function navigateQuestion(delta) {
  const ids = currentLectureIds();
  const index = currentLectureIndex();
  if (index < 0) return;
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= ids.length) return;
  setCurrentLectureQuestion(ids[nextIndex]);
}

function setCurrentLectureQuestion(id) {
  invalidateResourceMainAudioResume();
  const continueFollowRead = state.followReadActive;
  if (continueFollowRead) {
    clearFollowReadTimer();
    els.audio.pause();
    state.maskRevealedSegments.clear();
  }
  const previousPracticeTextKey = state.practiceModeActive ? state.practiceTextKey : "";
  if (state.maskTranscriptActive) state.maskRevealedSegments.clear();
  state.currentQuestionId = String(id);
  const q = getQuestion(state.currentQuestionId);
  if (q) state.lastQuestionBySet[q.setId] = q.id;
  state.showAnswer = false;
  state.showAnswerAnalysis = false;
  state.questionPanelCollapsed = false;
  state.showQuestionTranslation = false;
  renderFull();
  if (state.practiceModeActive && previousPracticeTextKey !== practiceTextKey()) startPracticeSequence();
  if (continueFollowRead) {
    state.questionPanelCollapsed = true;
    state.showTranscriptTranslation = false;
    renderFull();
    const segments = findTimecode(q)?.segments || [];
    startFollowRead(segments.map((_, index) => index));
  }
  if (state.showAnalysis) requestAnimationFrame(scrollToClue);
}

function openQuestionPicker() {
  const panel = $("#questionPickerPanel");
  panel.classList.remove("hidden");
  closeInterfaceSettings();
  updateLectureStepper();
  requestAnimationFrame(updateQuestionPickerScrollbar);
}

function closeQuestionPicker() {
  const panel = $("#questionPickerPanel");
  if (!panel || panel.classList.contains("hidden")) return;
  panel.classList.add("hidden");
  updateLectureStepper();
}

function setPlayButton(playing) {
  const button = $("#playPause");
  button.innerHTML = `<span>${playing ? icons.pause : icons.play}</span>`;
  button.classList.toggle("playing", playing);
  button.title = playing ? "暂停" : "播放";
  button.setAttribute("aria-label", playing ? "暂停" : "播放");
}

function rateColor(rate) {
  if (rate < 70) return "#ef4444";
  if (rate < 100) return "#facc15";
  return "#16a34a";
}

function applyTheme() {
  [els.fullscreenPage, els.onlinePage].forEach((page) => {
    page.classList.toggle("light-mode", state.theme === "light");
    page.classList.toggle("dark-mode", state.theme !== "light");
  });
  $$("[data-theme-choice]").forEach((button) => {
    const selected = button.dataset.themeChoice === state.theme;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-checked", String(selected));
  });
}

function setFullFont(size) {
  state.fullFont = Math.max(24, Math.min(42, size));
  const panelHeight = state.fullFont <= 26
    ? 272
    : state.fullFont <= 30
      ? 296
      : state.fullFont <= 34
        ? 320
        : state.fullFont <= 38
          ? 352
          : 384;
  demoStorage.setItem("victor:fullFont", String(state.fullFont));
  els.fullscreenPage.style.setProperty("--full-font", `${state.fullFont}px`);
  els.onlinePage.style.setProperty("--full-font", `${state.fullFont}px`);
  els.fullscreenPage.style.setProperty("--question-panel-height", `${panelHeight}px`);
  $("#fontDown").disabled = state.fullFont <= 24;
  $("#fontUp").disabled = state.fullFont >= 42;
  $("#onlineFontDown").disabled = state.fullFont <= 24;
  $("#onlineFontUp").disabled = state.fullFont >= 42;
  if (state.practiceModeActive) requestAnimationFrame(updatePracticeOptionLayouts);
}

function closeFull() {
  invalidateResourceMainAudioResume();
  closeResourcePopover();
  resetTranscriptTeachingModes({ restoreAnalysis: false });
  closeSpeedMenu();
  closeInterfaceSettings();
  closeQuestionPicker();
  els.fullscreenPage.classList.add("hidden");
  els.fullscreenPage.classList.remove("audio-only-mode");
  els.fullscreenPage.dataset.mode = "";
  state.audioOnlyPlayback = false;
  els.fullscreenPage.dataset.path = state.fullReturnPage === "book-overview"
    ? "校本/书籍详情"
    : state.fullReturnPage === "book-detail"
    ? "校本/试题详情"
    : state.fullReturnPage === "work-report"
      ? "作业/作业报告"
    : state.fullReturnPage === "question-bank"
      ? "题库组卷/我的试卷"
    : state.fullReturnPage === "work"
      ? "检查作业"
      : "首页/听力讲评";
  state.lectureSnapshot = null;
  syncRoute(state.fullReturnPage);
  applyGlobalAssistState();
}

function handleFullReturn() {
  if (els.fullscreenPage.dataset.mode === "similar" && state.lectureSnapshot) {
    returnToLecture();
    return;
  }
  closeFull();
}

function openSimilar() {
  invalidateResourceMainAudioResume();
  resetTranscriptTeachingModes({ restoreAnalysis: false });
  const q = getQuestion(state.currentQuestionId);
  const transcriptScroll = $(".transcript-scroll");
  state.lectureSnapshot = {
    explainIds: [...state.explainIds],
    originalExplainIds: [...state.originalExplainIds],
    activeExplainSetId: state.activeExplainSetId,
    lastQuestionBySet: { ...state.lastQuestionBySet },
    currentQuestionId: state.currentQuestionId,
    showAnswer: state.showAnswer,
    showAnswerAnalysis: state.showAnswerAnalysis,
    showAnalysis: state.showAnalysis,
    questionPanelCollapsed: state.questionPanelCollapsed,
    showQuestionTranslation: state.showQuestionTranslation,
    showTranscriptTranslation: state.showTranscriptTranslation,
    activeKnowledgeType: state.activeKnowledgeType,
    transcriptScrollTop: transcriptScroll?.scrollTop || 0,
  };
  state.similarExamPoint = examPointLabel(q);
  state.similarSourceQuestionId = q.id;
  state.similarSource = "book";
  buildSimilarPool(q);
  state.explainIds = state.similarPool.map((item) => item.id);
  state.originalExplainIds = [...state.explainIds];
  state.activeExplainSetId = "all";
  state.currentQuestionId = state.explainIds[0];
  state.showAnswer = false;
  state.showAnswerAnalysis = false;
  state.showAnalysis = false;
  state.questionPanelCollapsed = false;
  state.showQuestionTranslation = false;
  state.showTranscriptTranslation = false;
  state.activeKnowledgeType = null;
  state.playbackStopTime = null;
  state.playbackScope = null;
  closeResourcePopover();
  els.fullscreenPage.dataset.mode = "similar";
  renderFull();
}

function similarLocalCandidates(sourceQuestion) {
  const sameType = state.questions.filter((item) => item.id !== sourceQuestion.id
    && item.questionType === sourceQuestion.questionType && item.bookName === sourceQuestion.bookName);
  const samePoint = sameType.filter((item) => examPointLabel(item) === examPointLabel(sourceQuestion));
  return samePoint.length ? samePoint : sameType;
}

function buildSimilarPool(sourceQuestion) {
  state.similarSourceQuestionId = sourceQuestion.id;
  const candidates = similarLocalCandidates(sourceQuestion);
  const memoryKey = `${sourceQuestion.id}:${state.similarSource}`;
  const rememberedIds = Array.isArray(state.similarQuestionMemory[memoryKey])
    ? state.similarQuestionMemory[memoryKey].map(String)
    : [];
  const picked = rememberedIds
    .map((id) => candidates.find((item) => item.id === id))
    .filter(Boolean);
  const available = candidates.filter((item) => !picked.some((saved) => saved.id === item.id));
  while (picked.length < Math.min(3, candidates.length) && available.length) {
    const randomIndex = Math.floor(Math.random() * available.length);
    picked.push(available.splice(randomIndex, 1)[0]);
  }
  state.similarQuestionMemory[memoryKey] = picked.map((item) => item.id);
  // Keep this selection in the current lecture session.
  state.similarPool = picked.map((item) => ({
    ...item,
    id: `similar-${state.similarSource}-${sourceQuestion.id}-${item.id}`,
    baseId: item.id,
    similarSourceQuestionId: sourceQuestion.id,
    setName: item.setName,
    examSource: "",
    correctRate: item.correctRate,
  }));
  $$("[data-similar-source]").forEach((button) => {
    const unavailable = button.dataset.similarSource === "gaokao";
    button.classList.toggle("hidden", unavailable);
    button.disabled = unavailable;
    button.title = unavailable ? "暂无真实高考题池" : "本书同类题";
    button.classList.toggle("active", button.dataset.similarSource === state.similarSource);
  });
}

function setSimilarSource(source) {
  if (source === "gaokao") {
    showAppNotice("暂无真实高考题池，当前使用本书同类题。", "info");
    return;
  }
  if (source !== "book" || state.similarSource === source) return;
  const current = state.questions.find((item) => item.id === state.similarSourceQuestionId) || state.questions[0];
  state.similarSource = source;
  buildSimilarPool(current);
  state.explainIds = state.similarPool.map((item) => item.id);
  state.originalExplainIds = [...state.explainIds];
  state.currentQuestionId = state.explainIds[0];
  state.showAnswer = false;
  state.showAnswerAnalysis = false;
  state.showAnalysis = false;
  state.questionPanelCollapsed = false;
  renderFull();
}

function swapCurrentSimilarQuestion() {
  if (els.fullscreenPage.dataset.mode !== "similar") return;
  const sourceQuestion = state.questions.find((item) => item.id === state.similarSourceQuestionId);
  if (!sourceQuestion) return;
  const currentIndex = Math.max(0, state.similarPool.findIndex((item) => item.id === state.currentQuestionId));
  const usedIds = new Set(state.similarPool.map((item) => item.baseId || item.id));
  const candidates = similarLocalCandidates(sourceQuestion).filter((item) => !usedIds.has(item.id));
  if (!candidates.length) {
    showAppNotice("暂无可替换同类题。", "warning");
    return;
  }
  const replacement = candidates[Math.floor(Math.random() * candidates.length)];
  const memoryKey = `${sourceQuestion.id}:${state.similarSource}`;
  const rememberedIds = state.similarPool.map((item) => item.baseId || item.id);
  rememberedIds[currentIndex] = replacement.id;
  state.similarQuestionMemory[memoryKey] = rememberedIds;
  // Keep this selection in the current lecture session.
  buildSimilarPool(sourceQuestion);
  state.explainIds = state.similarPool.map((item) => item.id);
  state.originalExplainIds = [...state.explainIds];
  state.currentQuestionId = state.explainIds[currentIndex] || state.explainIds[0];
  state.showAnswer = false;
  state.showAnswerAnalysis = false;
  state.showAnalysis = false;
  state.showQuestionTranslation = false;
  state.showTranscriptTranslation = false;
  state.questionPanelCollapsed = false;
  renderFull();
  showAppNotice("已更换同类题，并记住本次选择。", "success");
}

function returnToLecture() {
  invalidateResourceMainAudioResume();
  closeResourcePopover();
  resetTranscriptTeachingModes({ restoreAnalysis: false, render: false });
  const snapshot = state.lectureSnapshot;
  if (!snapshot) return;
  els.audio.pause();
  state.explainIds = [...snapshot.explainIds];
  state.originalExplainIds = [...snapshot.originalExplainIds];
  state.activeExplainSetId = snapshot.activeExplainSetId;
  state.lastQuestionBySet = { ...snapshot.lastQuestionBySet };
  state.currentQuestionId = snapshot.currentQuestionId;
  state.showAnswer = snapshot.showAnswer;
  state.showAnswerAnalysis = snapshot.showAnswerAnalysis;
  state.showAnalysis = snapshot.showAnalysis;
  state.questionPanelCollapsed = snapshot.questionPanelCollapsed;
  state.showQuestionTranslation = snapshot.showQuestionTranslation;
  state.showTranscriptTranslation = snapshot.showTranscriptTranslation;
  state.activeKnowledgeType = snapshot.activeKnowledgeType || null;
  state.playbackStopTime = null;
  state.playbackScope = null;
  state.similarExamPoint = "";
  state.similarSourceQuestionId = null;
  state.lectureSnapshot = null;
  els.fullscreenPage.dataset.mode = "";
  renderFull();
  updateClassroomDock();
  requestAnimationFrame(() => {
    const transcriptScroll = $(".transcript-scroll");
    if (transcriptScroll) transcriptScroll.scrollTop = snapshot.transcriptScrollTop;
    restoreClassroomDock();
  });
}

function highlightKnowledgeWord(type) {
  const first = els.fullQuestion.querySelector(`[data-resource-highlight="${CSS.escape(type)}"]`)
    || els.transcript.querySelector(`[data-resource-highlight="${CSS.escape(type)}"]`);
  if (first) first.scrollIntoView({ block: "center", behavior: "smooth" });
}

function closeResourcePopover() {
  ++resourceAudioPlaySerial;
  resourceDetailAudio.pause();
  resourceDetailAudio.removeAttribute("src");
  resourceDetailAudio.load();
  activeResourceAudioButton = null;
  els.popover.querySelectorAll("video").forEach((video) => video.pause());
  els.popover.classList.add("hidden");
  els.popoverBackdrop.classList.add("hidden");
  els.popoverBackdrop.setAttribute("aria-hidden", "true");
  restoreMainAudioAfterResource();
}

function dismissResourcePopover() {
  closeResourcePopover();
  if (!state.activeKnowledgeType) return;
  const q = getQuestion(state.currentQuestionId);
  const items = knowledgeItemsForQuestion(q, state.activeKnowledgeType);
  const hasInlineHighlights = items.some((item) => String(item.highlightTarget || "").trim());
  if (hasInlineHighlights) return;
  state.activeKnowledgeType = null;
  if (!q || !state.showAnalysis) return;
  renderKnowledgeRail(q);
  renderTranscript(q);
  renderFullQuestion(q);
}

function updateResourceAudioButton(button, playing) {
  if (!button) return;
  button.classList.toggle("playing", playing);
  const icon = button.querySelector(".resource-audio-icon");
  if (icon) icon.innerHTML = icons.audio;
  button.setAttribute("aria-pressed", String(playing));
}

function syncResourceGuidancePlayer() {
  const card = els.popover.querySelector("[data-resource-guidance-card]");
  if (!card) return;
  const button = card.querySelector("[data-resource-audio]");
  const progress = card.querySelector("[data-resource-guidance-progress]");
  const time = card.querySelector("[data-resource-guidance-time]");
  const isCurrent = activeResourceAudioButton === button && resourceDetailAudio.dataset.source === button?.dataset.resourceAudio;
  const clip=isCurrent&&resourceAudioSegment?.ticket===resourceAudioPlaySerial?resourceAudioSegment:null;
  const duration = clip?clip.end-clip.start:isCurrent && Number.isFinite(resourceDetailAudio.duration) ? resourceDetailAudio.duration : 0;
  const current = isCurrent && Number.isFinite(resourceDetailAudio.currentTime) ? Math.max(0,resourceDetailAudio.currentTime-(clip?.start||0)) : 0;
  if (progress) progress.value = duration ? String((current / duration) * 100) : "0";
  if (time) time.textContent = `${formatAudioTime(current)} / ${formatAudioTime(duration)}`;
}

function bindResourcePopoverInteractions() {
  els.popover.querySelectorAll("video,audio").forEach((media) => {
    if (media.dataset.mainAudioCoordinated) return;
    media.dataset.mainAudioCoordinated = "true";
    media.addEventListener("play", () => {
      resourceDetailAudio.pause();
      els.popover.querySelectorAll("video,audio").forEach((other) => { if (other !== media) other.pause(); });
      suspendMainAudioForResource();
    });
    media.addEventListener("ended", restoreMainAudioAfterResource);
    media.addEventListener("error", restoreMainAudioAfterResource);
  });
  const closeButton = els.popover.querySelector("[data-close-resource-popover]");
  if (closeButton) closeButton.onclick = dismissResourcePopover;
  els.popover.querySelectorAll("[data-resource-image-fullscreen]").forEach((button) => {
    button.addEventListener("click", () => {
      const frame = button.closest(".resource-image-frame");
      if (!frame) return;
      if (document.fullscreenElement === frame) {
        document.exitFullscreen?.();
      } else {
        resourceImageFullscreenActive = true;
        const request = frame.requestFullscreen?.();
        request?.catch?.(() => {
          resourceImageFullscreenActive = false;
        });
      }
    });
    const frame = button.closest(".resource-image-frame");
    const image = frame?.querySelector("img");
    image?.addEventListener("click", () => {
      if (document.fullscreenElement === frame) document.exitFullscreen?.();
    });
  });
  // Enhancers replace pronunciation buttons after this binder runs. One scoped
  // delegate keeps those new buttons live without duplicate per-button listeners.
  if (!els.popover.dataset.resourceAudioDelegated) {
    els.popover.dataset.resourceAudioDelegated = "true";
    els.popover.addEventListener("click", (event) => {
      const button = event.target.closest?.("[data-resource-audio]");
      if (!button || !els.popover.contains(button) || button.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      window.DemoResourceAudio.toggle(button.dataset.resourceAudio, button).then(() => syncResourceGuidancePlayer());
    });
  }
  const guidanceProgress = els.popover.querySelector("[data-resource-guidance-progress]");
  guidanceProgress?.addEventListener("input", () => {
    const button = guidanceProgress.closest("[data-resource-guidance-card]")?.querySelector("[data-resource-audio]");
    if (activeResourceAudioButton !== button || !Number.isFinite(resourceDetailAudio.duration)) return;
    const clip=resourceAudioSegment?.ticket===resourceAudioPlaySerial?resourceAudioSegment:null;
    const start=clip?.start||0,duration=clip?clip.end-clip.start:resourceDetailAudio.duration;
    resourceDetailAudio.currentTime = start+duration * (Number(guidanceProgress.value) / 100);
    syncResourceGuidancePlayer();
  });
  resourceDetailAudio.onloadedmetadata = syncResourceGuidancePlayer;
  resourceDetailAudio.ontimeupdate = syncResourceGuidancePlayer;
  resourceDetailAudio.onended = () => {
    updateResourceAudioButton(activeResourceAudioButton, false);
    syncResourceGuidancePlayer();
    restoreMainAudioAfterResource();
  };
  resourceDetailAudio.onpause = () => {
    updateResourceAudioButton(activeResourceAudioButton, false);
    syncResourceGuidancePlayer();
  };
  syncResourceGuidancePlayer();
}

function syncResourceImageFullscreenButton() {
  const fullscreenFrame = document.fullscreenElement?.closest?.(".resource-image-frame") || null;
  if (fullscreenFrame) {
    resourceImageFullscreenActive = true;
  } else {
    setTimeout(() => {
      resourceImageFullscreenActive = false;
    }, 0);
  }
  document.querySelectorAll("[data-resource-image-fullscreen]").forEach((button) => {
    const active = button.closest(".resource-image-frame") === fullscreenFrame;
    const label = active ? "退出全屏" : "全屏查看";
    button.setAttribute("aria-label", `${label}配图`);
    button.title = `${label}配图`;
    const text = button.querySelector("span");
    if (text) text.textContent = label;
  });
}

document.addEventListener("fullscreenchange", syncResourceImageFullscreenButton);

function showResourcePopover(event, type, item) {
  event.stopPropagation();
  closeResourcePopover();
  els.popover.classList.toggle("light-mode", state.theme === "light");
  els.popoverBackdrop.classList.remove("hidden");
  els.popoverBackdrop.setAttribute("aria-hidden", "false");
  els.popover.innerHTML = `
    <div class="resource-popover-head">
      <div><span>${escapeHtml(resourcePopoverHeading(type, [item]))}</span></div>
      <button type="button" data-close-resource-popover title="关闭" aria-label="关闭知识讲解">${icons.x}</button>
    </div>
    <div class="resource-popover-body">${resourceItemDetail(item)}</div>`;
  els.popover.classList.remove("hidden");
  bindResourcePopoverInteractions();
  requestAnimationFrame(() => els.popover.querySelector("[data-close-resource-popover]")?.focus());
}

function showResourceCollectionPopover(event, type, items, startIndex = 0) {
  event.stopPropagation();
  items = Array.isArray(items) ? items.filter(Boolean) : [];
  closeResourcePopover();
  if (!items.length) return;
  els.popover.classList.toggle("light-mode", state.theme === "light");
  els.popoverBackdrop.classList.remove("hidden");
  els.popoverBackdrop.setAttribute("aria-hidden", "false");
  let pageIndex = Math.max(0, Math.min(items.length - 1, Math.trunc(Number(startIndex) || 0)));
  els.popover.innerHTML = `
    <div class="resource-popover-head">
      <div><span>${escapeHtml(resourcePopoverHeading(type, [items[pageIndex]]))}</span></div>
      <button type="button" data-close-resource-popover title="关闭" aria-label="关闭知识讲解">${icons.x}</button>
    </div>
    <div class="resource-popover-page" data-resource-page></div>`;
  const renderPage = () => {
    ++resourceAudioPlaySerial;
    resourceDetailAudio.pause();
    restoreMainAudioAfterResource();
    resourceDetailAudio.removeAttribute("src");
    resourceDetailAudio.load();
    activeResourceAudioButton = null;
    els.popover.querySelectorAll("video").forEach((video) => video.pause());
    const page = els.popover.querySelector("[data-resource-page]");
    const item = items[pageIndex];
    const heading = ["词汇", "语音"].includes(type) ? "" : resourceItemHeading(type, item);
    const header = els.popover.querySelector(".resource-popover-head > div > span");
    if (header) header.textContent = resourcePopoverHeading(type, [item]);
    els.popover.dataset.resourcePageIndex = String(pageIndex);
    els.popover.querySelectorAll(".resource-popover-pager").forEach((pager) => pager.remove());
    page.innerHTML = `
      <article>
        ${heading ? `<strong>${renderResourceTargetLabel(heading)}</strong>` : ""}
        <div class="resource-popover-body">${resourceItemDetail(item)}</div>
      </article>
      ${items.length > 1 ? `<footer class="resource-popover-pager">
        <button type="button" data-resource-page-prev ${pageIndex === 0 ? "disabled" : ""}>${icons["arrow-left"]}<span>上一条</span></button>
        <span>${pageIndex + 1} / ${items.length}</span>
        <button type="button" data-resource-page-next ${pageIndex === items.length - 1 ? "disabled" : ""}><span>下一条</span>${icons["arrow-right"]}</button>
      </footer>` : ""}`;
    // Shared classroom tools move these original nodes into the modal footer.
    const resourcePagePrevious = page.querySelector("[data-resource-page-prev]");
    const resourcePageNext = page.querySelector("[data-resource-page-next]");
    bindResourcePopoverInteractions();
    resourcePagePrevious?.addEventListener("click", (event) => {
      event.stopPropagation();
      if (resourcePagePrevious.disabled || pageIndex <= 0) return;
      pageIndex = Math.max(0, pageIndex - 1);
      renderPage();
    });
    resourcePageNext?.addEventListener("click", (event) => {
      event.stopPropagation();
      if (resourcePageNext.disabled || pageIndex >= items.length - 1) return;
      pageIndex = Math.min(items.length - 1, pageIndex + 1);
      renderPage();
    });
  };
  els.popover.classList.remove("hidden");
  renderPage();
  requestAnimationFrame(() => els.popover.querySelector("[data-close-resource-popover]")?.focus());
}

const editorAudio = new Audio();

function taskStorageKey() {
  return "victor:dictationTasks";
}

function loadTasks() {
  try {
    const tasks = JSON.parse(demoStorage.getItem(taskStorageKey()) || "[]");
    return Array.isArray(tasks) ? tasks : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  demoStorage.setItem(taskStorageKey(), JSON.stringify(tasks));
}

function materialKey(q) {
  return `${q.setId}-${q.textNo}`;
}

function snapshotListeningFilters() {
  return {
    className: state.filterClass,
    time: state.filterTime,
    rateThreshold: state.rateThreshold,
    columnFilters: Object.fromEntries(Object.entries(state.columnFilters).map(([key, values]) => [key, [...values]])),
  };
}

function cloneFilterSnapshot(snapshot = snapshotListeningFilters()) {
  return {
    className: snapshot.className || DEFAULT_CLASS,
    time: snapshot.time || "近7天",
    rateThreshold: Number(snapshot.rateThreshold || DEFAULT_RATE_THRESHOLD),
    setName: snapshot.columnFilters?.setName?.[0] || "",
    questionType: snapshot.columnFilters?.questionType?.[0] || "",
    bookName: snapshot.columnFilters?.bookName?.[0] || "",
  };
}

function transcriptSegmentsForQuestion(q) {
  return findTimecode(q)?.segments || [];
}

function createMaterial(q, index) {
  const relatedQuestions = state.questions
    .filter((item) => item.setId === q.setId && item.textNo === q.textNo)
    .sort((a, b) => a.questionNo - b.questionNo);
  const segments = transcriptSegmentsForQuestion(q);
  return {
    id: `material-${Date.now()}-${index}`,
    setId: q.setId,
    setName: q.setName,
    textNo: q.textNo,
    bookName: q.bookName,
    questionType: q.questionType,
    questionIds: relatedQuestions.map((item) => item.id),
    segments,
    audioPath: findTimecode(q)?.audioPath || "",
    blanks: [],
  };
}

function buildTokenMap(segments) {
  const result = [];
  segments.forEach((segment, segmentIndex) => {
    const parts = String(segment.text || "").match(/[A-Za-z]+(?:['’][A-Za-z]+)*|\d+(?:[.,:]\d+)*|[^A-Za-z\d\s]+|\s+/g) || [];
    parts.forEach((text, tokenIndex) => {
      result.push({
        id: `${segmentIndex}-${tokenIndex}`,
        segmentIndex,
        tokenIndex,
        text,
        word: /^[A-Za-z]+(?:['’][A-Za-z]+)*$/.test(text),
      });
    });
  });
  return result;
}

const SMART_BLANK_SET_IDS = new Set([14255, 14256]);
const SMART_BLANK_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "for", "from", "had", "has", "have",
  "he", "her", "him", "his", "i", "if", "in", "is", "it", "me", "my", "of", "on", "or", "our", "she",
  "so", "that", "the", "their", "them", "there", "they", "this", "to", "us", "was", "we", "were", "what",
  "when", "where", "which", "who", "will", "with", "you", "your",
]);

function normalizeSmartBlankWord(value) {
  return String(value || "").toLowerCase().replaceAll("’", "'").replace(/[^a-z']/g, "");
}

function smartBlankWordRefs(material) {
  return buildTokenMap(material.segments)
    .filter((item) => item.word)
    .map((item, index) => ({ ...item, index, normalized: normalizeSmartBlankWord(item.text) }));
}

function markedPronunciationPhrases(value) {
  const line = String(value || "").split(/\r?\n/)[0];
  if (!line || (!line.includes("$$") && !line.includes("《"))) return [];
  let plain = "";
  let marked = false;
  const markedIndexes = new Set();
  for (let index = 0; index < line.length; index += 1) {
    if (line.slice(index, index + 2) === "$$") {
      marked = !marked;
      index += 1;
      continue;
    }
    if (line[index] === "《") {
      marked = true;
      continue;
    }
    if (line[index] === "》") {
      marked = false;
      continue;
    }
    if (marked) markedIndexes.add(plain.length);
    plain += line[index];
  }
  const words = [...plain.matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)*/g)];
  const selected = words.filter((match) => {
    const start = Number(match.index || 0);
    return [...match[0]].some((_, offset) => markedIndexes.has(start + offset));
  });
  if (!selected.length) return [];
  const phrases = [];
  let current = [];
  selected.forEach((match, index) => {
    const previous = selected[index - 1];
    const previousEnd = previous ? Number(previous.index || 0) + previous[0].length : -1;
    const between = previous ? plain.slice(previousEnd, Number(match.index || 0)) : "";
    if (previous && /^[\s'-]*$/.test(between)) current.push(match[0]);
    else {
      if (current.length) phrases.push(current.join(" "));
      current = [match[0]];
    }
  });
  if (current.length) phrases.push(current.join(" "));
  return phrases;
}

function smartBlankResourcePhrases(material) {
  const resource = state.textResources[`${material.setId}-${material.textNo}`];
  const pronunciation = resource?.categories?.["语音"] || [];
  const phrases = [];
  pronunciation.forEach((item) => {
    const phenomena = String(item.phoneticPhenomena || "");
    phrases.push(...markedPronunciationPhrases(phenomena));
    [...phenomena.matchAll(/([A-Za-z'’]*)\s*\$\$([A-Za-z'’]+)\$\$([A-Za-z'’]*)/g)].forEach((match) => {
      const reconstructed = `${match[1]}${match[2]}${match[3]}`;
      if (reconstructed) phrases.push(reconstructed);
    });
    const target = String(item.prominent || item.highlightTarget || "").trim();
    const targetWords = target.match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g) || [];
    if (targetWords.length && targetWords.length <= 3) phrases.push(targetWords.join(" "));
  });
  return [...new Set(phrases.map((phrase) => phrase.trim()).filter(Boolean))];
}

function matchingSmartBlankIds(wordRefs, phrase) {
  const target = (String(phrase).match(/[A-Za-z]+(?:['’][A-Za-z]+)*/g) || []).map(normalizeSmartBlankWord).filter(Boolean);
  if (!target.length) return [];
  for (let start = 0; start <= wordRefs.length - target.length; start += 1) {
    if (target.every((word, offset) => wordRefs[start + offset].normalized === word)) {
      return wordRefs.slice(start, start + target.length).map((item) => item.id);
    }
  }
  return [];
}

function smartBlankFallbackScore(wordRefs, index) {
  const current = wordRefs[index];
  const next = wordRefs[index + 1];
  const word = current.normalized;
  if (!word || SMART_BLANK_STOP_WORDS.has(word)) return -100;
  let score = Math.min(5, Math.max(0, word.length - 4));
  if (word.includes("'")) score += 7;
  if (/(tion|sion|ture|ough|ght|ould|cial|tial|ary|ory)$/.test(word)) score += 5;
  if (next && /[ptkbdg]$/.test(word) && /^[bcdfghjklmnpqrstvwxyz]/.test(next.normalized)) score += 6;
  if (next && /[bcdfghjklmnpqrstvwxyz]$/.test(word) && /^[aeiou]/.test(next.normalized)) score += 3;
  return score;
}

function recommendedSmartBlankIds(material) {
  const wordRefs = smartBlankWordRefs(material);
  if (!wordRefs.length) return [];
  const desired = Math.min(5, Math.max(2, Math.round(wordRefs.length / 32)));
  const selected = new Set();
  smartBlankResourcePhrases(material).forEach((phrase) => {
    matchingSmartBlankIds(wordRefs, phrase).forEach((id) => {
      if (selected.size < desired + 1) selected.add(id);
    });
  });
  wordRefs
    .map((item, index) => ({ item, score: smartBlankFallbackScore(wordRefs, index) }))
    .sort((a, b) => b.score - a.score || a.item.segmentIndex - b.item.segmentIndex || a.item.tokenIndex - b.item.tokenIndex)
    .forEach(({ item, score }) => {
      if (selected.size >= desired || score < 0) return;
      selected.add(item.id);
    });
  if (!selected.size) selected.add(wordRefs[Math.floor(wordRefs.length / 2)].id);
  return [...selected];
}

function applySmartDictationBlanks() {
  let materialCount = 0;
  let addedCount = 0;
  let skippedCount = 0;
  state.dictationMaterials.forEach((material) => {
    if (!SMART_BLANK_SET_IDS.has(Number(material.setId))) {
      skippedCount += 1;
      return;
    }
    materialCount += 1;
    const blanks = new Set(material.blanks || []);
    recommendedSmartBlankIds(material).forEach((id) => {
      if (!blanks.has(id)) addedCount += 1;
      blanks.add(id);
    });
    material.blanks = [...blanks];
  });
  if (!materialCount) {
    showAppNotice("智能挖空目前仅支持 Welcome Unit 听力训练（一）、（二）。", "warning");
    return;
  }
  if (addedCount) state.dictationDirty = true;
  renderDictationEditor();
  const skippedText = skippedCount ? `，已跳过 ${skippedCount} 段其他套题材料` : "";
  showAppNotice(addedCount
    ? `已为 ${materialCount} 段材料添加 ${addedCount} 个语音难点空，已保留手动挖空${skippedText}。`
    : `当前 ${materialCount} 段材料已包含推荐的语音难点空${skippedText}。`, "success");
}

function openDictationFromBasket() {
  const selected = listeningScopeQuestions().filter((q) => state.selectedIds.has(q.id));
  if (!selected.length) return;
  state.editorReturnPage = ["book-detail", "book-overview"].includes(state.page) ? state.page : "listening";
  const seen = new Set();
  state.dictationMaterials = selected
    .sort((a, b) => a.setId - b.setId || a.textNo - b.textNo)
    .filter((q) => {
      const key = materialKey(q);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(createMaterial);
  state.activeMaterialIndex = 0;
  state.editorPlayingSegmentIndex = null;
  state.editingTaskId = null;
  state.contentViewOnly = false;
  state.dictationDirty = false;
  state.dictationSourceVisible = false;
  state.dictationSourceFilter = snapshotListeningFilters();
  $("#previewDictation").checked = false;
  $(".material-editor").classList.remove("preview-mode");
  $("#dictationName").value = dictationDateName();
  setResponseMode("none");
  state.publishClassId = state.filterClass;
  state.publishStudentIds = new Set((CLASS_STUDENTS[state.publishClassId] || []).map((student) => student.id));
  syncRoute("dictation");
  renderDictationEditor();
}

function editDictationTask(taskId) {
  const task = loadTasks().find((item) => item.id === taskId);
  if (!task) return;
  state.editorReturnPage = task.responseMode === "app" ? "work" : "question-bank";
  state.dictationMaterials = JSON.parse(JSON.stringify(task.materials));
  state.activeMaterialIndex = 0;
  state.editorPlayingSegmentIndex = null;
  state.editingTaskId = task.id;
  state.contentViewOnly = false;
  state.dictationDirty = false;
  state.dictationSourceVisible = false;
  state.dictationSourceFilter = task.sourceFilter || snapshotListeningFilters();
  $("#previewDictation").checked = false;
  $(".material-editor").classList.remove("preview-mode");
  $("#dictationName").value = task.name;
  const mode = task.responseMode || "none";
  setResponseMode(mode);
  state.publishClassId = task.classes?.[0] || state.filterClass;
  const restoredStudents = new Set(task.studentIds || []);
  if (!restoredStudents.size) {
    (task.classes || [state.publishClassId]).forEach((classId) => {
      (CLASS_STUDENTS[classId] || []).forEach((student) => restoredStudents.add(student.id));
    });
  }
  state.publishStudentIds = restoredStudents;
  syncRoute("dictation");
  renderDictationEditor();
}

function openPaperTaskAsDictation(taskId) {
  const task = loadTasks().find((item) => item.id === taskId && item.type === "paper");
  if (!task) return;
  const materials = task.materials?.length ? task.materials : paperItemsToMaterials(task.questions || []);
  if (!materials.length) {
    showAppNotice("该听力组卷暂无可用于挖空的录音稿。", "warning");
    return;
  }
  state.editorReturnPage = task.responseMode === "app" ? "work" : "question-bank";
  state.dictationMaterials = JSON.parse(JSON.stringify(materials));
  state.activeMaterialIndex = 0;
  state.editorPlayingSegmentIndex = null;
  state.editingTaskId = null;
  state.contentViewOnly = false;
  state.dictationDirty = false;
  state.dictationSourceVisible = false;
  state.dictationSourceFilter = task.sourceFilter || snapshotListeningFilters();
  $("#previewDictation").checked = false;
  $(".material-editor").classList.remove("preview-mode");
  $("#dictationName").value = String(task.name || "").replace("听力组卷", "精听挖空") || dictationDateName();
  setResponseMode(task.responseMode || "none");
  state.publishClassId = task.classes?.[0] || state.filterClass;
  state.publishStudentIds = new Set(task.studentIds || []);
  if (!state.publishStudentIds.size) {
    (task.classes || [state.publishClassId]).forEach((classId) => {
      (CLASS_STUDENTS[classId] || []).forEach((student) => state.publishStudentIds.add(student.id));
    });
  }
  syncRoute("dictation");
  renderDictationEditor();
}

function bindDictationEvents() {
  $("#smartBlankDictation").addEventListener("click", applySmartDictationBlanks);
  $("#previewDictation").addEventListener("change", (event) => {
    $(".material-editor").classList.toggle("preview-mode", event.target.checked);
    renderMaterialTranscript();
  });
  $("#toggleSourceQuestions").addEventListener("change", (event) => {
    state.dictationSourceVisible = event.target.checked;
    renderMaterialTranscript();
  });
  $("#addMaterialEntry").addEventListener("click", openAddMaterialDialog);
  $$("[data-add-material-cancel]").forEach((button) => button.addEventListener("click", closeAddMaterialDialog));
  ["#addMaterialClass", "#addMaterialTime", "#addMaterialRate", "#addMaterialSet", "#addMaterialType"].forEach((selector) => {
    $(selector).addEventListener("change", updateAddMaterialFilter);
  });
  $("#addMaterialConfirm").addEventListener("click", confirmAddMaterials);
  $("#saveDictation").addEventListener("click", saveDictationTask);
  $("#backToDictationEditor").addEventListener("click", closePublishPage);
  $("#dictationName").addEventListener("input", () => { state.dictationDirty = true; });
  $$('[name="publishAnswerMode"]').forEach((input) => input.addEventListener("change", () => {
    applyPublishAnswerModePreset(input.value);
    markPublishDirty();
    updatePublishRuleFields();
  }));
  $("#publishClassList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-publish-class]");
    if (!button) return;
    const classId = button.dataset.publishClass;
    const students = CLASS_STUDENTS[classId] || [];
    const selectedCount = students.filter((student) => state.publishStudentIds.has(student.id)).length;
    const shouldSelectAll = selectedCount < students.length;
    students.forEach((student) => {
      if (shouldSelectAll) state.publishStudentIds.add(student.id);
      else state.publishStudentIds.delete(student.id);
    });
    state.publishClassId = classId;
    markPublishDirty();
    renderDictationPublishSetup();
  });
  $("#publishStudentGrid").addEventListener("change", (event) => {
    const input = event.target.closest("[data-publish-student]");
    if (!input) return;
    if (input.checked) state.publishStudentIds.add(input.dataset.publishStudent);
    else state.publishStudentIds.delete(input.dataset.publishStudent);
    markPublishDirty();
    renderDictationPublishSetup();
  });
  $("#publishStudentSearch").addEventListener("input", (event) => {
    state.publishStudentSearch = event.target.value.trim();
    state.publishStudentSearchOpen = Boolean(state.publishStudentSearch);
    renderPublishStudentSearchResults();
  });
  $("#publishStudentSearch").addEventListener("focus", () => {
    state.publishStudentSearchOpen = Boolean(state.publishStudentSearch);
    renderPublishStudentSearchResults();
  });
  $("#publishStudentSearch").addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    state.publishStudentSearchOpen = false;
    renderPublishStudentSearchResults();
  });
  $("#publishStudentSearchResults").addEventListener("change", (event) => {
    const input = event.target.closest("[data-publish-search-student]");
    if (!input) return;
    if (input.checked) state.publishStudentIds.add(input.dataset.publishSearchStudent);
    else state.publishStudentIds.delete(input.dataset.publishSearchStudent);
    markPublishDirty();
    renderDictationPublishSetup();
  });
  $$('[name="publishStart"], [name="publishEnd"], [name="publishVisible"]').forEach((input) => {
    input.addEventListener("change", () => {
      markPublishDirty();
      updatePublishTimeFields();
    });
  });
  ["#publishStartDate", "#publishStartTime", "#publishEndDate", "#publishEndTime", "#publishVisibleDate", "#publishVisibleTime"].forEach((selector) => {
    $(selector).addEventListener("input", () => {
      markPublishDirty();
    });
  });
  $$('[name="publishScoreRelease"], [name="publishMakeup"], [name="publishUnlockMode"], [name="publishTargetRate"], [name="publishRetryLimit"], [name="publishQuestionOrder"], [name="publishAnswerMode"], #publishPlanDays, #publishTargetCustomValue, #publishRetryCustomValue').forEach((input) => {
    input.addEventListener("input", () => {
      markPublishDirty();
      updatePublishRuleFields();
    });
    input.addEventListener("change", () => {
      markPublishDirty();
      updatePublishRuleFields();
    });
  });
  $("#publishConfirm").addEventListener("click", persistPublishTask);
  $("#editorPlay").addEventListener("click", () => {
    state.editorPlayingSegmentIndex = null;
    setEditorAudioForMaterial(state.activeMaterialIndex);
    updateEditorSentencePlaying();
    if (editorAudio.paused) editorAudio.play().catch(() => updateEditorAudioControls());
    else editorAudio.pause();
  });
  $("#editorProgress").addEventListener("input", (event) => {
    if (Number.isFinite(editorAudio.duration)) editorAudio.currentTime = Number(event.target.value) / 100 * editorAudio.duration;
  });
  editorAudio.addEventListener("timeupdate", () => {
    $("#editorProgress").value = editorAudio.duration ? String(editorAudio.currentTime / editorAudio.duration * 100) : "0";
    $("#editorTime").textContent = `${formatAudioTime(editorAudio.currentTime)} / ${formatAudioTime(editorAudio.duration)}`;
    updateEditorAudioControls();
    const material = state.dictationMaterials[state.activeMaterialIndex];
    const segment = material?.segments[state.editorPlayingSegmentIndex];
    if (segment && editorAudio.currentTime >= Number(segment.end || 0) - 0.03) {
      editorAudio.pause();
      state.editorPlayingSegmentIndex = null;
      updateEditorSentencePlaying();
    }
  });
  editorAudio.addEventListener("ended", () => {
    state.editorPlayingSegmentIndex = null;
    updateEditorSentencePlaying();
  });
  editorAudio.addEventListener("play", updateEditorAudioControls);
  editorAudio.addEventListener("pause", updateEditorAudioControls);
}

function selectedBasketQuestions() {
  return listeningScopeQuestions()
    .filter((q) => state.selectedIds.has(q.id))
    .sort((a, b) => a.setId - b.setId || a.textNo - b.textNo || a.questionNo - b.questionNo);
}

function paperDateName() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}听力组卷`;
}

function studentAppDateName() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}学生端`;
}

function dictationDateName() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}精听挖空`;
}

function openPaperSetupDialog(entryMode = "direct") {
  const selected = selectedBasketQuestions();
  if (!selected.length) return;
  state.paperEntryMode = entryMode === "publish" ? "publish" : "direct";
  state.paperSimilarEnabled = true;
  state.paperSimilarScope = "gaokao";
  $("#includeSimilarPaper").checked = true;
  $("#paperSimilarScope").classList.remove("hidden");
  $("#paperSimilarScope").querySelectorAll("label").forEach((label) => label.classList.toggle("active", label.querySelector("input").value === "gaokao"));
  $("#paperSimilarScope").querySelector('[value="gaokao"]').checked = true;
  $("#paperSetupWrongCount").textContent = `${selected.length} 题`;
  updatePaperSetupConfirm();
  $("#paperSetupDialog").classList.remove("hidden");
}

function closePaperSetupDialog() {
  $("#paperSetupDialog").classList.add("hidden");
}

function updatePaperSetupConfirm() {
  const wrongCount = selectedBasketQuestions().length;
  const similarCount = state.paperSimilarEnabled ? buildPaperItems({ preview: true }).filter((item) => item.kind === "similar").length : 0;
  $("#paperSetupConfirm").textContent = `预览试卷 · ${wrongCount + similarCount} 题`;
}

function bindPaperEvents() {
  $$("[data-paper-setup-cancel]").forEach((button) => button.addEventListener("click", closePaperSetupDialog));
  $("#includeSimilarPaper").addEventListener("change", (event) => {
    state.paperSimilarEnabled = event.target.checked;
    $("#paperSimilarScope").classList.toggle("hidden", !state.paperSimilarEnabled);
    updatePaperSetupConfirm();
  });
  $("#paperSimilarScope").addEventListener("change", (event) => {
    state.paperSimilarScope = event.target.value;
    $("#paperSimilarScope").querySelectorAll("label").forEach((label) => label.classList.toggle("active", label.querySelector("input").checked));
    updatePaperSetupConfirm();
  });
  $("#paperSetupConfirm").addEventListener("click", openPaperFromBasket);
  $("#togglePaperTranscript").addEventListener("change", (event) => {
    state.paperTranscriptVisible = event.target.checked;
    renderPaperEditor();
  });
  $("#paperName").addEventListener("input", () => { state.paperDirty = true; });
  $("#savePaper").addEventListener("click", savePaperFromEditor);
  $("#paperPlay").addEventListener("click", () => {
    state.paperPlayingSegmentIndex = null;
    setPaperAudioForIndex(state.activePaperIndex);
    if (editorAudio.paused) editorAudio.play().catch(() => updatePaperAudioControls());
    else editorAudio.pause();
    updatePaperAudioControls();
  });
  $("#paperProgress").addEventListener("input", (event) => {
    if (Number.isFinite(editorAudio.duration)) editorAudio.currentTime = Number(event.target.value) / 100 * editorAudio.duration;
  });
  editorAudio.addEventListener("timeupdate", () => {
    updatePaperAudioControls();
    const item = state.paperItems[state.activePaperIndex];
    const segment = transcriptSegmentsForQuestion(item?.question)[state.paperPlayingSegmentIndex];
    if (segment && editorAudio.currentTime >= Number(segment.end || 0) - 0.03) {
      editorAudio.pause();
      state.paperPlayingSegmentIndex = null;
      updatePaperOrderActive();
    }
  });
  editorAudio.addEventListener("play", updatePaperAudioControls);
  editorAudio.addEventListener("pause", updatePaperAudioControls);
  editorAudio.addEventListener("ended", () => {
    state.paperPlayingSegmentIndex = null;
    updatePaperOrderActive();
    updatePaperAudioControls();
  });
}

function buildPaperItems({ preview = false } = {}) {
  const selected = selectedBasketQuestions();
  const items = [];
  const usedIds = new Set(selected.map((q) => q.id));
  selected.forEach((q, index) => {
    items.push(createPaperItem(q, "wrong", index));
    if (!state.paperSimilarEnabled) return;
    const similar = findSimilarQuestion(q, usedIds, 0, state.paperSimilarScope);
    if (!similar) return;
    usedIds.add(similar.baseId || similar.id);
    items.push(createPaperItem(similar, "similar", index, q.id, 0));
  });
  return preview ? items : items.map((item, index) => ({ ...item, orderId: `paper-item-${Date.now()}-${index}` }));
}

function createPaperItem(q, kind, index, sourceId = "", similarOffset = 0) {
  return {
    orderId: `paper-item-${index}-${kind}-${q.id}`,
    kind,
    sourceId,
    similarOffset,
    similarScope: state.paperSimilarScope,
    question: JSON.parse(JSON.stringify(q)),
  };
}

function paperTextGroups(items = state.paperItems) {
  const groups = [];
  const grouped = new Map();
  items.forEach((item) => {
    const key = materialKey(item.question);
    if (!grouped.has(key)) {
      const group = { key, items: [] };
      grouped.set(key, group);
      groups.push(group);
    }
    grouped.get(key).items.push(item);
  });
  return groups;
}

function normalizePaperTextGroups() {
  const activeOrderId = state.paperItems[state.activePaperIndex]?.orderId;
  state.paperItems = paperTextGroups().flatMap((group) => group.items);
  const activeIndex = state.paperItems.findIndex((item) => item.orderId === activeOrderId);
  state.activePaperIndex = activeIndex >= 0 ? activeIndex : 0;
}

function findSimilarQuestion(sourceQuestion, usedIds, offset = 0, scope = "book") {
  const sourceRate = classCorrectRate(sourceQuestion);
  const candidates = state.questions
    .filter((item) => item.id !== sourceQuestion.id)
    .filter((item) => !usedIds.has(item.id))
    .filter((item) => item.questionType === sourceQuestion.questionType)
    .filter((item) => scope === "gaokao" || item.bookName === sourceQuestion.bookName)
    .map((item) => {
      const examScore = item.examPoint === sourceQuestion.examPoint ? 0 : 40;
      const rateScore = Math.abs(classCorrectRate(item) - sourceRate);
      const distanceScore = Math.abs(item.questionNo - sourceQuestion.questionNo) / 10;
      return { item, score: examScore + rateScore + distanceScore };
    })
    .sort((a, b) => a.score - b.score || a.item.setId - b.item.setId || a.item.questionNo - b.item.questionNo)
    .map(({ item }) => item);
  const picked = candidates[offset % Math.max(1, candidates.length)];
  if (!picked) return null;
  return {
    ...picked,
    id: `paper-similar-${scope}-${sourceQuestion.id}-${picked.id}-${offset}`,
    baseId: picked.id,
    setName: scope === "gaokao" ? "高考同考点精选" : picked.setName,
  };
}

function openPaperFromBasket() {
  const selected = selectedBasketQuestions();
  if (!selected.length) return;
  state.editorReturnPage = ["book-detail", "book-overview"].includes(state.page) ? state.page : "listening";
  state.paperItems = buildPaperItems();
  state.publishSetCount = Math.max(1, new Set(selected.map((question) => Number(question.setId))).size);
  state.publishQuantityMode = state.paperEntryMode === "publish" ? "question" : "set";
  state.activePaperIndex = 0;
  state.paperPlayingSegmentIndex = null;
  state.editingPaperTaskId = null;
  state.contentViewOnly = false;
  state.paperTranscriptVisible = false;
  state.paperDirty = false;
  $("#paperName").value = state.paperEntryMode === "publish" ? studentAppDateName() : paperDateName();
  $("#togglePaperTranscript").checked = false;
  state.publishClassId = state.filterClass;
  state.publishStudentIds = new Set((CLASS_STUDENTS[state.publishClassId] || []).map((student) => student.id));
  closePaperSetupDialog();
  syncRoute("paper");
  renderPaperEditor();
}

function savePaperFromEditor() {
  if (state.paperEntryMode === "publish") {
    openPaperPublishPage();
    return;
  }
  setResponseMode("paper");
  persistPaperTask();
  showAppNotice("听力组卷已保存到我的试卷。", "success");
}

function paperDuration() {
  const seen = new Set();
  return state.paperItems.reduce((sum, item) => {
    const q = item.question;
    const key = materialKey(q);
    if (seen.has(key)) return sum;
    seen.add(key);
    const segments = transcriptSegmentsForQuestion(q);
    return sum + Number(segments.at(-1)?.end || 0);
  }, 0);
}

function renderPaperEditor() {
  normalizePaperTextGroups();
  const total = state.paperItems.length;
  const groups = paperTextGroups();
  const materialCount = groups.length;
  $("#paperSummary").textContent = `共 ${materialCount} 段材料，${total} 题，音频总时长 ${formatAudioTime(paperDuration())}`;
  $("#savePaper").textContent = state.paperEntryMode === "publish" ? "保存并进入下一步" : "生成作业";
  $("#paperOrderList").innerHTML = groups.map((group, groupIndex) => {
    const firstItem = group.items[0];
    const q = firstItem.question;
    const firstIndex = state.paperItems.indexOf(firstItem);
    const active = group.items.includes(state.paperItems[state.activePaperIndex]);
    return `<div draggable="${state.contentViewOnly ? "false" : "true"}" data-paper-group="${groupIndex}" class="material-order-item paper-order-item ${state.contentViewOnly ? "is-readonly" : ""} ${active ? "active" : ""}">
      ${state.contentViewOnly ? `<span class="material-readonly-index">${groupIndex + 1}</span>` : `<span class="material-grip" data-icon="grip"></span><input class="material-position-input" data-paper-position="${groupIndex}" type="number" min="1" max="${materialCount}" value="${groupIndex + 1}" aria-label="将 Text ${q.textNo} 移动到第几组" />`}
      <button class="material-order-content" data-paper-open="${firstIndex}">
        <span><strong>Text ${q.textNo}</strong><em>${q.questionType} · ${group.items.length}题</em></span><i>${group.items.some((item) => item.kind === "similar") ? "同类题" : ""}</i>
      </button>
      ${state.contentViewOnly ? "" : `<button class="material-delete-button" data-delete-paper-group="${groupIndex}" title="${materialCount <= 1 ? "组卷至少保留 1 题" : `删除 Text ${q.textNo}`}" aria-label="删除 Text ${q.textNo} 及其 ${group.items.length} 道题" ${materialCount <= 1 ? "disabled" : ""}><span data-icon="trash"></span></button>`}
    </div>`;
  }).join("");
  $("#paperQuestionList").innerHTML = renderPaperQuestionGroups();
  hydrateIcons();
  bindPaperEditorRows();
  updatePaperAudioControls();
}

function renderPaperQuestionGroups() {
  const groups = paperTextGroups().map((group, groupIndex) => ({
    groupIndex,
    key: group.key,
    item: group.items[0],
    entries: group.items.map((item) => ({ item, index: state.paperItems.indexOf(item) })),
  }));
  return groups.map((group) => {
    const q = group.item.question;
    const transcriptEntry = group.entries.find(({ index }) => index === state.activePaperIndex) || group.entries[0];
    return `<section class="paper-text-question-group" data-paper-text-group="${escapeHtml(group.key)}">
      <header>
        <div>
          <span>Text ${q.textNo}</span>
          <strong>${escapeHtml(q.questionType || "听力理解")}</strong>
          <em>${escapeHtml(q.setName)} · ${group.entries.length}题</em>
        </div>
        ${state.contentViewOnly ? "" : `<button type="button" class="paper-group-delete-button" data-delete-paper-group="${group.groupIndex}" title="${state.paperItems.length === group.entries.length ? "组卷至少保留 1 题" : `删除 Text ${q.textNo}`}" aria-label="删除 Text ${q.textNo} 及其 ${group.entries.length} 道题" ${state.paperItems.length === group.entries.length ? "disabled" : ""}><span data-icon="trash"></span></button>`}
      </header>
      ${group.entries.map(({ item, index }) => renderPaperQuestionCard(item, index)).join("")}
      ${state.paperTranscriptVisible && transcriptEntry ? renderPaperTranscript(transcriptEntry.item.question, transcriptEntry.index) : ""}
    </section>`;
  }).join("");
}

function bindPaperEditorRows() {
  $("#paperOrderList").querySelectorAll("[data-paper-open]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePaperIndex = Number(button.dataset.paperOpen);
      scrollToPaperItem(state.activePaperIndex);
      updatePaperOrderActive();
      updatePaperAudioControls();
    });
  });
  if (!state.contentViewOnly) $("#paperOrderList").querySelectorAll("[data-paper-position]").forEach((input) => {
    const applyPosition = () => movePaperGroupToPosition(Number(input.dataset.paperPosition), Number(input.value));
    input.addEventListener("change", applyPosition);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyPosition();
      }
    });
  });
  if (!state.contentViewOnly) $("#paperOrderList").querySelectorAll("[data-delete-paper-group]").forEach((button) => {
    button.addEventListener("click", () => deletePaperGroupAt(Number(button.dataset.deletePaperGroup)));
  });
  if (!state.contentViewOnly) $("#paperOrderList").querySelectorAll("[data-paper-group]").forEach((row) => {
    row.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", row.dataset.paperGroup));
    row.addEventListener("dragover", (event) => event.preventDefault());
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      reorderPaperGroups(Number(event.dataTransfer.getData("text/plain")), Number(row.dataset.paperGroup));
    });
  });
  $("#paperQuestionList").querySelectorAll("[data-paper-card]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      state.activePaperIndex = Number(card.dataset.paperCard);
      updatePaperOrderActive();
      updatePaperAudioControls();
    });
  });
  $("#paperQuestionList").querySelectorAll("[data-play-paper-segment]").forEach((button) => {
    const play = (event) => {
      event.stopPropagation();
      playPaperSegment(Number(button.dataset.paperIndex), Number(button.dataset.playPaperSegment));
    };
    button.addEventListener("click", play);
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        play(event);
      }
    });
  });
  if (!state.contentViewOnly) $("#paperQuestionList").querySelectorAll("[data-swap-similar]").forEach((button) => {
    button.addEventListener("click", () => swapSimilarQuestion(Number(button.dataset.swapSimilar)));
  });
  if (!state.contentViewOnly) $("#paperQuestionList").querySelectorAll("[data-delete-paper-item]").forEach((button) => {
    button.addEventListener("click", () => deletePaperItemAt(Number(button.dataset.deletePaperItem)));
  });
  if (!state.contentViewOnly) $("#paperQuestionList").querySelectorAll("[data-delete-paper-group]").forEach((button) => {
    button.addEventListener("click", () => deletePaperGroupAt(Number(button.dataset.deletePaperGroup)));
  });
}

function renderPaperQuestionCard(item, index) {
  const q = item.question;
  const isSimilar = item.kind === "similar";
  return `<article class="paper-question-card ${index === state.activePaperIndex ? "active" : ""}" data-paper-card="${index}">
    <header class="paper-question-head">
      <div class="paper-card-meta">
        <div class="paper-card-tags">${isSimilar ? '<b class="similar-label">同类题</b>' : ""}<span class="exam-point-label">考点：${escapeHtml(examPointLabel(q))}</span></div>
        ${isSimilar && !state.contentViewOnly ? `<button type="button" class="swap-similar-button" data-swap-similar="${index}"><span data-icon="refresh"></span>换一换</button>` : ""}
      </div>
    </header>
    <h3>${escapeHtml(renumberPaperStem(q.stem, index + 1))}</h3>
    <div class="paper-options">${renderPaperOptions(q, !isSimilar)}</div>
    ${state.contentViewOnly ? "" : `<button type="button" class="paper-question-delete-button" data-delete-paper-item="${index}" title="${state.paperItems.length <= 1 ? "组卷至少保留 1 题" : `删除第 ${index + 1} 题`}" aria-label="删除第 ${index + 1} 题" ${state.paperItems.length <= 1 ? "disabled" : ""}><span data-icon="trash"></span></button>`}
  </article>`;
}

function renumberPaperStem(stem, number) {
  const text = String(stem || "").trim();
  const body = text.replace(/^\d+\s*[.．、]\s*/, "");
  return `${number}. ${body}`;
}

function renderPaperOptions(q, showData = true) {
  const normalized = optionDistributionForQuestion(q);
  return q.options.map((option) => {
    const distIndex = normalized.findIndex((item) => item.key === option.key);
    const dist = normalized[distIndex] || { percent: 0, count: 0 };
    const correct = option.key === q.answerKey;
    return `<div class="paper-option ${correct ? "correct" : ""} ${showData ? "" : "no-data"}">
      <div class="paper-option-copy"><b>${option.key}</b><span>${escapeHtml(cleanOptionText(option.text))}</span>${correct ? `<i>${icons["check-filled"]}</i>` : ""}</div>
      ${showData ? `<div class="paper-option-data"><span><em style="width:${dist.percent}%"></em></span><strong>${dist.percent}% · ${dist.count}人</strong></div>` : ""}
    </div>`;
  }).join("");
}

function cleanOptionText(text) {
  return String(text || "").trim().replace(/^[A-Z]\s*[.．、]\s*/i, "");
}

function renderPaperTranscript(q, index) {
  const segments = transcriptSegmentsForQuestion(q);
  if (!segments.length) return '<div class="paper-transcript"><p>暂无录音稿。</p></div>';
  return `<div class="paper-transcript">
    <div class="material-section-transcript">
      ${groupMaterialSegments(segments).map((group) => `<div class="editor-speaker-paragraph">
        <span class="speaker ${speakerClassName(group.speaker)}">${group.speaker}</span>
        <p>${group.segments.map((segment) => `<span class="paper-transcript-segment ${index === state.activePaperIndex && segment.segmentIndex === state.paperPlayingSegmentIndex ? "playing" : ""}" role="button" tabindex="0" data-paper-index="${index}" data-play-paper-segment="${segment.segmentIndex}">${escapeHtml(segment.text)}</span>`).join(" ")}</p>
      </div>`).join("")}
    </div>
  </div>`;
}

function setPaperAudioForIndex(index) {
  const item = state.paperItems[index];
  const q = item?.question;
  const filename = materialAudioFilename(q);
  if (filename && editorAudio.dataset.filename !== filename) {
    editorAudio.pause();
    editorAudio.dataset.filename = filename;
    editorAudio.src = materialAudioURL(q);
  }
}

function updatePaperAudioControls() {
  const item = state.paperItems[state.activePaperIndex];
  if (!item) return;
  const q = item.question;
  setPaperAudioForIndex(state.activePaperIndex);
  $("#paperPlayerTitle").textContent = `第 ${q.questionNo} 题 · Text ${q.textNo}`;
  $("#paperPlayerSource").textContent = `${q.bookName} · ${q.setName}`;
  $("#paperProgress").value = editorAudio.duration ? String(editorAudio.currentTime / editorAudio.duration * 100) : "0";
  $("#paperTime").textContent = `${formatAudioTime(editorAudio.currentTime)} / ${formatAudioTime(editorAudio.duration || Number(transcriptSegmentsForQuestion(q).at(-1)?.end || 0))}`;
  const icon = $("#paperPlay")?.querySelector("[data-icon]");
  if (icon) icon.dataset.icon = editorAudio.paused ? "play" : "pause";
  hydrateIcons();
}

function playPaperSegment(index, segmentIndex) {
  state.activePaperIndex = index;
  setPaperAudioForIndex(index);
  const segment = transcriptSegmentsForQuestion(state.paperItems[index]?.question)[segmentIndex];
  if (!segment) return;
  state.paperPlayingSegmentIndex = segmentIndex;
  editorAudio.currentTime = Math.max(0, Number(segment.start || 0));
  editorAudio.play().catch(updatePaperAudioControls);
  updatePaperOrderActive();
  updatePaperAudioControls();
}

function updatePaperOrderActive() {
  const activeKey = materialKey(state.paperItems[state.activePaperIndex]?.question || {});
  $("#paperOrderList")?.querySelectorAll("[data-paper-group]").forEach((row) => {
    const group = paperTextGroups()[Number(row.dataset.paperGroup)];
    row.classList.toggle("active", group?.key === activeKey);
  });
  $("#paperQuestionList")?.querySelectorAll("[data-paper-card]").forEach((card) => card.classList.toggle("active", Number(card.dataset.paperCard) === state.activePaperIndex));
  $("#paperQuestionList")?.querySelectorAll("[data-play-paper-segment]").forEach((segment) => {
    segment.classList.toggle("playing", Number(segment.dataset.paperIndex) === state.activePaperIndex && Number(segment.dataset.playPaperSegment) === state.paperPlayingSegmentIndex);
  });
}

function scrollToPaperItem(index) {
  requestAnimationFrame(() => {
    $(`[data-paper-card="${index}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" });
  });
}

function reorderPaperGroups(from, to) {
  if (from === to || from < 0 || to < 0) return;
  const groups = paperTextGroups();
  if (!groups[from] || !groups[to]) return;
  const activeOrderId = state.paperItems[state.activePaperIndex]?.orderId;
  const [moved] = groups.splice(from, 1);
  groups.splice(to, 0, moved);
  state.paperItems = groups.flatMap((group) => group.items);
  state.activePaperIndex = Math.max(0, state.paperItems.findIndex((item) => item.orderId === activeOrderId));
  state.paperDirty = true;
  renderPaperEditor();
}

function movePaperGroupToPosition(from, position) {
  if (!Number.isFinite(position)) return renderPaperEditor();
  const to = Math.min(paperTextGroups().length, Math.max(1, Math.round(position))) - 1;
  if (from === to) return renderPaperEditor();
  reorderPaperGroups(from, to);
}

function removePaperItems(orderIds, fallbackIndex) {
  const removedIds = new Set(orderIds);
  const activeOrderId = state.paperItems[state.activePaperIndex]?.orderId;
  state.paperItems = state.paperItems.filter((item) => !removedIds.has(item.orderId));
  const retainedActiveIndex = state.paperItems.findIndex((item) => item.orderId === activeOrderId);
  state.activePaperIndex = retainedActiveIndex >= 0
    ? retainedActiveIndex
    : Math.max(0, Math.min(fallbackIndex, state.paperItems.length - 1));
  state.paperPlayingSegmentIndex = null;
  editorAudio.pause();
  editorAudio.currentTime = 0;
  state.paperDirty = true;
  renderPaperEditor();
}

function deletePaperItemAt(index) {
  if (state.paperItems.length <= 1) {
    showAppNotice("组卷至少保留 1 题。", "warning");
    return;
  }
  const item = state.paperItems[index];
  if (!item) return;
  const q = item.question;
  openAppDialog({
    title: `删除第 ${index + 1} 题`,
    message: `该题将从当前组卷中删除，但不会移出原试题篮。Text ${q.textNo} 内的其他题目会继续保留。`,
    confirmText: "删除",
    danger: true,
    onConfirm: () => removePaperItems([item.orderId], index),
  });
}

function deletePaperGroupAt(groupIndex) {
  const groups = paperTextGroups();
  const group = groups[groupIndex];
  if (!group) return;
  if (group.items.length >= state.paperItems.length) {
    showAppNotice("组卷至少保留 1 题。", "warning");
    return;
  }
  const q = group.items[0].question;
  const firstIndex = state.paperItems.indexOf(group.items[0]);
  openAppDialog({
    title: `删除 Text ${q.textNo}`,
    message: `该 Text 及其 ${group.items.length} 道题将从当前组卷中删除，但不会移出原试题篮。`,
    confirmText: "删除",
    danger: true,
    onConfirm: () => removePaperItems(group.items.map((item) => item.orderId), firstIndex),
  });
}

function swapSimilarQuestion(index) {
  const item = state.paperItems[index];
  if (!item || item.kind !== "similar") return;
  const source = state.questions.find((q) => q.id === item.sourceId);
  if (!source) return;
  const used = new Set(state.paperItems.map((paperItem) => paperItem.question.baseId || paperItem.question.id));
  used.delete(item.question.baseId || item.question.id);
  const nextOffset = (item.similarOffset || 0) + 1;
  const replacement = findSimilarQuestion(source, used, nextOffset, item.similarScope);
  if (!replacement || (replacement.baseId || replacement.id) === (item.question.baseId || item.question.id)) {
    showAppNotice("暂无可替换同类题。", "warning");
    return;
  }
  state.paperItems[index] = createPaperItem(replacement, "similar", index, source.id, nextOffset);
  state.paperItems[index].similarScope = item.similarScope;
  state.activePaperIndex = index;
  state.paperDirty = true;
  renderPaperEditor();
  showAppNotice("已更换同类题。", "success");
}

function editPaperTask(taskId) {
  const task = loadTasks().find((item) => item.id === taskId && item.type === "paper");
  if (!task) return;
  state.editorReturnPage = task.responseMode === "app" ? "work" : "question-bank";
  state.paperItems = hydratePaperItems(task.questions || []);
  state.activePaperIndex = 0;
  state.paperPlayingSegmentIndex = null;
  state.editingPaperTaskId = task.id;
  state.contentViewOnly = false;
  state.paperSimilarEnabled = task.similarEnabled !== false;
  state.paperSimilarScope = task.similarScope || "gaokao";
  state.paperTranscriptVisible = false;
  state.paperDirty = false;
  $("#paperName").value = task.name || paperDateName();
  $("#togglePaperTranscript").checked = false;
  state.publishClassId = task.classes?.[0] || state.filterClass;
  const restoredStudents = new Set(task.studentIds || []);
  if (!restoredStudents.size) {
    (task.classes || [state.publishClassId]).forEach((classId) => {
      (CLASS_STUDENTS[classId] || []).forEach((student) => restoredStudents.add(student.id));
    });
  }
  state.publishStudentIds = restoredStudents;
  syncRoute("paper");
  renderPaperEditor();
}

function openPaperTaskPublish(taskId) {
  editPaperTask(taskId);
  if (state.editingPaperTaskId !== taskId) return;
  state.publishSource = "paper";
  setResponseMode("app");
  restorePublishFormSettings(loadTasks().find((task) => task.id === taskId));
  ensurePublishSelection();
  syncRoute("dictation-publish");
  requestAnimationFrame(() => $("#backToDictationEditor").focus());
}

function openPaperTaskDeadline(taskId) {
  openPaperTaskPublish(taskId);
  if (state.editingPaperTaskId !== taskId) return;
  state.publishDeadlineOnly = true;
  renderDictationPublishSetup();
  showAppNotice("该作业已有答题数据，本次只能修改任务完成期限。", "info");
}

function viewWorkTask(taskId) {
  const task = loadTasks().find((item) => item.id === taskId);
  if (!task) return;
  state.editorReturnPage = task.responseMode === "app" || task.type === "schoolbook" ? "work" : "question-bank";
  state.contentViewOnly = true;
  if (task.type === "dictation") {
    state.dictationMaterials = JSON.parse(JSON.stringify(task.materials || []));
    state.activeMaterialIndex = 0;
    state.editorPlayingSegmentIndex = null;
    state.editingTaskId = task.id;
    state.dictationDirty = false;
    state.dictationSourceVisible = false;
    $("#previewDictation").checked = false;
    $(".material-editor").classList.remove("preview-mode");
    $("#dictationName").value = task.name || "未命名精听挖空";
    syncRoute("dictation");
    renderDictationEditor();
    return;
  }
  const paperItems = task.type === "paper"
    ? hydratePaperItems(task.questions || [])
    : (task.questions || []).map((item, index) => {
      const question = getQuestion(item.id);
      return question ? { orderId: `view-${task.id}-${index}`, kind: "wrong", sourceId: "", question } : null;
    }).filter(Boolean);
  state.paperItems = JSON.parse(JSON.stringify(paperItems));
  state.activePaperIndex = 0;
  state.paperPlayingSegmentIndex = null;
  state.editingPaperTaskId = task.id;
  state.paperTranscriptVisible = false;
  state.paperDirty = false;
  $("#paperName").value = task.name || "未命名作业";
  $("#togglePaperTranscript").checked = false;
  syncRoute("paper");
  renderPaperEditor();
}

function openPaperTaskFull(taskId, classId = "") {
  const task = loadTasks().find((item) => item.id === taskId && item.type === "paper");
  const ids = (task?.questions || [])
    .map((item) => paperTaskQuestionId(item))
    .filter((id) => state.questions.some((q) => q.id === id));
  if (!ids.length) {
    showAppNotice("当前组卷暂无可讲解题目。", "warning");
    return;
  }
  if (classId) state.filterClass = classId;
  const returnPage = task.responseMode === "app" ? "work" : "question-bank";
  if (returnPage === "question-bank") state.questionBankTab = "my-paper";
  openFull(ids, ids[0], returnPage);
}

function persistPaperTask() {
  if (!validatePaperItems()) return;
  const mode = selectedResponseMode();
  const classes = mode === "app" ? selectedPublishClasses() : [];
  const students = mode === "app" ? selectedPublishStudents() : [];
  if (mode === "app" && !students.length) {
    showAppNotice("请至少选择 1 名学生。", "warning");
    return;
  }
  const tasks = loadTasks();
  const oldTask = tasks.find((item) => item.id === state.editingPaperTaskId);
  const shouldCompactPayload = mode === "app";
  const questions = shouldCompactPayload
    ? compactPaperItems(state.paperItems)
    : JSON.parse(JSON.stringify(state.paperItems));
  const materials = shouldCompactPayload
    ? compactPaperMaterials(state.paperItems)
    : paperItemsToMaterials(state.paperItems);
  const task = {
    id: state.editingPaperTaskId || `task-${Date.now()}`,
    name: $("#paperName").value.trim() || "未命名听力组卷",
    type: "paper",
    responseMode: mode,
    classes,
    studentIds: students.map((student) => student.id),
    studentNames: students.map((student) => student.name),
    questions,
    materials,
    assignmentSource: mode === "app" ? (publishQuantityMode() === "set" ? "sets" : "questions") : oldTask?.assignmentSource || null,
    sourceClass: oldTask?.sourceClass || state.filterClass,
    publishTime: mode === "app" ? publishTimeSettings() : null,
    publishRules: mode === "app" ? publishRuleSettings() : null,
    similarEnabled: state.paperSimilarEnabled,
    similarScope: state.paperSimilarScope,
    updatedAt: new Date().toISOString(),
  };
  if (oldTask) tasks.splice(tasks.indexOf(oldTask), 1, task);
  else tasks.unshift(task);
  saveTasks(tasks);
  state.paperDirty = false;
  state.editingPaperTaskId = null;
  if (task.responseMode === "app") syncRoute("work");
  else openMyPaperPage();
}

function paperItemsToMaterials(items) {
  const groups = new Map();
  items.forEach((item) => {
    const q = item.question || getQuestion(paperTaskQuestionId(item));
    if (!q) return;
    const key = materialKey(q);
    if (!groups.has(key)) groups.set(key, createMaterial(q, groups.size));
  });
  return [...groups.values()];
}

function compactPaperItems(items) {
  return items.map((item, index) => {
    const q = item.question || getQuestion(paperTaskQuestionId(item)) || item;
    return {
      orderId: item.orderId || `paper-ref-${index}`,
      kind: item.kind || "book",
      sourceId: item.sourceId || q.setId || "",
      similarOffset: item.similarOffset || 0,
      similarScope: item.similarScope || state.paperSimilarScope,
      id: q.id,
      baseId: q.baseId || q.id,
      setId: q.setId,
      setName: q.setName,
      textNo: q.textNo,
      questionNo: q.questionNo,
      bookName: q.bookName,
      questionType: q.questionType,
    };
  }).filter((item) => item.id);
}

function hydratePaperItems(items = []) {
  return items.map((item, index) => {
    const question = item.question || getQuestion(paperTaskQuestionId(item));
    if (!question) return null;
    return {
      orderId: item.orderId || `paper-item-${Date.now()}-${index}`,
      kind: item.kind || "book",
      sourceId: item.sourceId || question.setId || "",
      similarOffset: item.similarOffset || 0,
      similarScope: item.similarScope || state.paperSimilarScope,
      question: JSON.parse(JSON.stringify(question)),
    };
  }).filter(Boolean);
}

function compactPaperMaterials(items) {
  return paperItemsToMaterials(items).map((material) => ({
    id: material.id,
    setId: material.setId,
    setName: material.setName,
    textNo: material.textNo,
    bookName: material.bookName,
    questionType: material.questionType,
    questionIds: material.questionIds,
    audioPath: material.audioPath,
  }));
}

function renderDictationEditor() {
  const material = state.dictationMaterials[state.activeMaterialIndex];
  const blankCount = state.dictationMaterials.reduce((sum, item) => sum + item.blanks.length, 0);
  $("#dictationSummary").textContent = `共 ${state.dictationMaterials.length} 段材料，${blankCount} 空，音频总时长 ${formatAudioTime(totalMaterialDuration())}`;
  $("#materialOrderList").innerHTML = state.dictationMaterials.map((item, index) => `
    <div draggable="${state.contentViewOnly ? "false" : "true"}" data-material-row="${index}" class="material-order-item ${state.contentViewOnly ? "is-readonly" : ""} ${index === state.activeMaterialIndex ? "active" : ""}">
      ${state.contentViewOnly ? `<span class="material-readonly-index">${index + 1}</span>` : `<span class="material-grip" data-icon="grip"></span><input class="material-position-input" data-material-position="${index}" type="number" min="1" max="${state.dictationMaterials.length}" value="${index + 1}" aria-label="将 Text ${item.textNo} 移动到第几位" />`}
      <button class="material-order-content" data-material-open="${index}">
        <span><strong>Text ${item.textNo}</strong></span><i>${item.blanks.length} 空</i>
      </button>
      ${state.contentViewOnly ? "" : `<button class="material-delete-button" data-delete-material="${index}" title="${state.dictationMaterials.length <= 1 ? "任务至少保留一段 Text" : `删除 Text ${item.textNo}`}" aria-label="删除 Text ${item.textNo}" ${state.dictationMaterials.length <= 1 ? "disabled" : ""}><span data-icon="trash"></span></button>`}
    </div>`).join("");
  hydrateIcons();
  $("#materialOrderList").querySelectorAll("[data-material-open]").forEach((button) => {
    button.addEventListener("click", () => {
      editorAudio.pause();
      state.editorPlayingSegmentIndex = null;
      state.activeMaterialIndex = Number(button.dataset.materialOpen);
      renderDictationEditor();
      scrollToDictationMaterial(state.activeMaterialIndex);
    });
  });
  if (!state.contentViewOnly) $("#materialOrderList").querySelectorAll("[data-material-row]").forEach((row) => {
    row.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", row.dataset.materialRow));
    row.addEventListener("dragover", (event) => event.preventDefault());
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      reorderMaterials(Number(event.dataTransfer.getData("text/plain")), Number(row.dataset.materialRow));
    });
  });
  if (!state.contentViewOnly) $("#materialOrderList").querySelectorAll("[data-material-position]").forEach((input) => {
    const applyPosition = () => moveMaterialToPosition(Number(input.dataset.materialPosition), Number(input.value));
    input.addEventListener("change", applyPosition);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyPosition();
      }
    });
  });
  if (!state.contentViewOnly) $("#materialOrderList").querySelectorAll("[data-delete-material]").forEach((button) => {
    button.addEventListener("click", () => deleteMaterialAt(Number(button.dataset.deleteMaterial)));
  });
  if (!material) {
    $(".material-editor").innerHTML = '<div class="editor-empty">至少保留一段 Text 材料</div>';
    return;
  }
  renderMaterialTranscript();
  updateEditorAudioControls();
}

function openAddMaterialDialog() {
  state.addMaterialFilters = cloneFilterSnapshot(state.dictationSourceFilter || snapshotListeningFilters());
  state.addMaterialSelectedKeys = new Set();
  populateAddMaterialFilters();
  renderAddMaterialDialog();
  $("#addMaterialDialog").classList.remove("hidden");
}

function closeAddMaterialDialog() {
  $("#addMaterialDialog").classList.add("hidden");
  state.addMaterialSelectedKeys = new Set();
}

function populateAddMaterialFilters() {
  const setOptions = [...new Set(state.questions.map((q) => q.setName))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const typeOptions = [...new Set(state.questions.map((q) => q.questionType))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  $("#addMaterialSet").innerHTML = `<option value="">全部套题</option>${setOptions.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}`;
  $("#addMaterialType").innerHTML = `<option value="">全部题型</option>${typeOptions.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}`;
  $("#addMaterialClass").value = state.addMaterialFilters.className;
  $("#addMaterialTime").value = ["近7天", "近15天", "近30天"].includes(state.addMaterialFilters.time) ? state.addMaterialFilters.time : "近7天";
  $("#addMaterialRate").value = String(state.addMaterialFilters.rateThreshold);
  $("#addMaterialSet").value = state.addMaterialFilters.setName;
  $("#addMaterialType").value = state.addMaterialFilters.questionType;
}

function updateAddMaterialFilter(event) {
  const target = event.target;
  const key = {
    addMaterialClass: "className",
    addMaterialTime: "time",
    addMaterialRate: "rateThreshold",
    addMaterialSet: "setName",
    addMaterialType: "questionType",
  }[target.id];
  if (!key) return;
  state.addMaterialFilters[key] = key === "rateThreshold" ? Number(target.value) : target.value;
  state.addMaterialSelectedKeys = new Set();
  renderAddMaterialDialog();
}

function addMaterialCandidates() {
  const filters = state.addMaterialFilters || cloneFilterSnapshot();
  const groups = new Map();
  state.questions
    .filter((q) => classCorrectRate(q) < filters.rateThreshold)
    .filter((q) => !filters.setName || q.setName === filters.setName)
    .filter((q) => !filters.questionType || q.questionType === filters.questionType)
    .forEach((q) => {
      const key = materialKey(q);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(q);
    });
  return [...groups.entries()].map(([key, questions]) => {
    const sorted = questions.sort((a, b) => a.questionNo - b.questionNo);
    const first = sorted[0];
    const avgRate = Math.round(sorted.reduce((sum, q) => sum + classCorrectRate(q), 0) / sorted.length);
    const types = [...new Set(sorted.map((q) => q.questionType))].join("、");
    return { key, first, questions: sorted, avgRate, types };
  }).sort((a, b) => a.first.setId - b.first.setId || a.first.textNo - b.first.textNo);
}

function renderAddMaterialDialog() {
  const existingKeys = new Set(state.dictationMaterials.map((material) => `${material.setId}-${material.textNo}`));
  const rows = addMaterialCandidates();
  $("#addMaterialSummary").textContent = `当前筛选：${state.addMaterialFilters.className} · ${state.addMaterialFilters.time} · 正答率低于 ${state.addMaterialFilters.rateThreshold}% · ${state.addMaterialFilters.setName || "全部套题"} · ${state.addMaterialFilters.questionType || "全部题型"}`;
  $("#addMaterialRows").innerHTML = rows.length ? rows.map(({ key, first, questions, avgRate, types }) => {
    const added = existingKeys.has(key);
    const checked = state.addMaterialSelectedKeys.has(key);
    const questionRange = questions.length === 1 ? `第 ${questions[0].questionNo} 题` : `第 ${questions[0].questionNo}-${questions.at(-1).questionNo} 题`;
    return `<tr class="${added ? "is-added" : `is-selectable${checked ? " is-selected" : ""}`}" ${added ? "" : `data-add-material-row="${key}"`}>
      <td><label class="checkbox-wrap"><input data-add-material="${key}" type="checkbox" ${checked ? "checked" : ""} ${added ? "disabled" : ""} /><span></span></label></td>
      <td>${escapeHtml(first.setName)}</td>
      <td><strong>Text ${first.textNo}</strong><small>${questionRange}</small></td>
      <td>${escapeHtml(types)}</td>
      <td>${questions.length} 题</td>
      <td>${avgRate}%</td>
      <td>${added ? '<span class="added-tag">已添加</span>' : '<span class="addable-tag">可添加</span>'}</td>
    </tr>`;
  }).join("") : '<tr><td colspan="7" class="table-empty">暂无符合当前筛选的 Text 材料</td></tr>';
  $("#addMaterialRows").querySelectorAll("[data-add-material]").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) state.addMaterialSelectedKeys.add(input.dataset.addMaterial);
      else state.addMaterialSelectedKeys.delete(input.dataset.addMaterial);
      input.closest("tr")?.classList.toggle("is-selected", input.checked);
      $("#addMaterialSelected").textContent = `已选 ${state.addMaterialSelectedKeys.size} 段`;
      $("#addMaterialConfirm").disabled = state.addMaterialSelectedKeys.size === 0;
    });
  });
  $("#addMaterialRows").querySelectorAll("[data-add-material-row]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("input, label, button, a")) return;
      const input = row.querySelector("[data-add-material]");
      if (!input || input.disabled) return;
      input.checked = !input.checked;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
  $("#addMaterialSelected").textContent = `已选 ${state.addMaterialSelectedKeys.size} 段`;
  $("#addMaterialConfirm").disabled = state.addMaterialSelectedKeys.size === 0;
}

function confirmAddMaterials() {
  const selected = new Set(state.addMaterialSelectedKeys);
  if (!selected.size) return;
  const candidates = addMaterialCandidates().filter((item) => selected.has(item.key));
  const editor = $(".material-editor");
  const scrollTop = editor?.scrollTop || 0;
  const added = candidates.map((item, index) => createMaterial(item.first, state.dictationMaterials.length + index));
  state.dictationMaterials.push(...added);
  state.dictationDirty = true;
  renderDictationEditor();
  if (editor) editor.scrollTop = scrollTop;
  closeAddMaterialDialog();
  showAppNotice(`已添加 ${added.length} 段材料，原有挖空已保留。`, "success");
}

function totalMaterialDuration() {
  return state.dictationMaterials.reduce((sum, material) => {
    const last = material.segments[material.segments.length - 1];
    return sum + Number(last?.end || 0);
  }, 0);
}

function groupMaterialSegments(segments) {
  return segments.reduce((groups, segment, segmentIndex) => {
    const speaker = segment.speaker || "M";
    const last = groups.at(-1);
    const entry = { ...segment, segmentIndex };
    if (last && last.speaker === speaker) last.segments.push(entry);
    else groups.push({ speaker, segments: [entry] });
    return groups;
  }, []);
}

function renderEditorSegmentText(segment, materialIndex, blankSet, preview) {
  const parts = String(segment.text || "").match(/[A-Za-z]+(?:['’][A-Za-z]+)*|\d+(?:[.,:]\d+)*|[^A-Za-z\d\s]+|\s+/g) || [];
  return parts.map((text, tokenIndex) => {
    const id = `${segment.segmentIndex}-${tokenIndex}`;
    const word = /^[A-Za-z]+(?:['’][A-Za-z]+)*$/.test(text);
    if (!word) return escapeHtml(text);
    const blank = blankSet.has(id);
    if (state.contentViewOnly) return `<span class="word-token is-readonly ${blank ? "blanked" : ""}">${escapeHtml(text)}</span>`;
    if (preview && blank) return `<button class="blank-preview" data-material-index="${materialIndex}" data-token="${id}" style="--blank-width:${Math.max(4, text.length)}ch" title="点击显示答案"><span>${escapeHtml(text)}</span></button>`;
    return `<button class="word-token ${blank ? "blanked" : ""}" data-material-index="${materialIndex}" data-token="${id}">${escapeHtml(text)}</button>`;
  }).join("");
}

function renderMaterialTranscript() {
  const preview = $(".material-editor").classList.contains("preview-mode");
  $("#materialTranscript").innerHTML = state.dictationMaterials.map((material, materialIndex) => {
    const blankSet = new Set(material.blanks);
    const active = materialIndex === state.activeMaterialIndex;
    return `<article class="material-section" data-material-section="${materialIndex}">
      <header class="material-section-head">
        <div><strong>Text ${material.textNo}</strong><span>${escapeHtml(material.setName)}</span><i>${material.blanks.length} 空</i></div>
        ${state.contentViewOnly ? "" : `<button type="button" class="clear-material-blanks" data-clear-material-blanks="${materialIndex}" ${material.blanks.length ? "" : "disabled"}>清除挖空</button>`}
      </header>
      <div class="material-section-transcript">
        ${groupMaterialSegments(material.segments).map((group) => `<div class="editor-speaker-paragraph">
          <button class="speaker ${speakerClassName(group.speaker)}" tabindex="-1">${group.speaker}</button>
          <p>${group.segments.map((segment) => `<span class="editor-segment ${active && state.editorPlayingSegmentIndex === segment.segmentIndex ? "playing" : ""}" data-material-index="${materialIndex}" data-editor-segment="${segment.segmentIndex}" role="button" tabindex="0">${renderEditorSegmentText(segment, materialIndex, blankSet, preview)}</span>`).join(" ")}</p>
        </div>`).join("")}
      </div>
      ${state.dictationSourceVisible ? renderMaterialSourceQuestions(material) : ""}
    </article>`;
  }).join("");
  $("#toggleSourceQuestions").checked = state.dictationSourceVisible;
  $(".source-switch").classList.toggle("active", state.dictationSourceVisible);
  hydrateIcons();
  if (!state.contentViewOnly) $("#materialTranscript").querySelectorAll("[data-token]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (preview) {
        button.classList.toggle("revealed");
        return;
      }
      toggleMaterialBlank(Number(button.dataset.materialIndex), button.dataset.token);
    });
  });
  if (!state.contentViewOnly) $("#materialTranscript").querySelectorAll("[data-clear-material-blanks]").forEach((button) => {
    button.addEventListener("click", () => clearMaterialBlanks(Number(button.dataset.clearMaterialBlanks)));
  });
  $("#materialTranscript").querySelectorAll("[data-editor-segment]").forEach((row) => {
    const play = () => playEditorSegment(Number(row.dataset.materialIndex), Number(row.dataset.editorSegment));
    row.addEventListener("click", play);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        play();
      }
    });
  });
}

function materialDuration(material) {
  return Number(material?.segments.at(-1)?.end || 0);
}

function cleanAudioFilename(source) {
  if (!source) return "";
  if (source.setId && source.textNo) return `${source.setId}-Text${String(source.textNo).padStart(2, "0")}-clean.mp3`;
  return source.audioPath?.split("/").pop()?.replace("-英美混音-clean", "-clean") || "";
}

function materialAudioFilename(material) {
  return cleanAudioFilename(material);
}

function materialAudioURL(material) {
  if (!material) return "";
  const displaySet = state.timecodes?.sets?.find((set) => set.bookKey === "test-single-book"
    && Number(set.setId) === Number(material.setId));
  if (displaySet || material.bookKey === "test-single-book") {
    const timecode = displaySet?.texts?.find((text) => Number(text.textNo) === Number(material.textNo));
    return resolveDemoAudioURL(timecodeAudioUrl(timecode));
  }
  const filename = materialAudioFilename(material);
  return filename ? resolveDemoAudioURL(`./assets/audio/clean/${filename}`) : "";
}

function setEditorAudioForMaterial(materialIndex) {
  const material = state.dictationMaterials[materialIndex];
  const filename = materialAudioFilename(material);
  if (filename && editorAudio.dataset.filename !== filename) {
    editorAudio.pause();
    state.editorPlayingSegmentIndex = null;
    editorAudio.dataset.filename = filename;
    editorAudio.src = materialAudioURL(material);
  }
}

function scrollToDictationMaterial(materialIndex) {
  requestAnimationFrame(() => {
    $(`[data-material-section="${materialIndex}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" });
  });
}

function updateMaterialOrderActive() {
  $("#materialOrderList")?.querySelectorAll("[data-material-row]").forEach((row) => {
    row.classList.toggle("active", Number(row.dataset.materialRow) === state.activeMaterialIndex);
  });
}

function updateEditorAudioControls() {
  const activeMaterial = state.dictationMaterials[state.activeMaterialIndex];
  if (activeMaterial) {
    setEditorAudioForMaterial(state.activeMaterialIndex);
    $("#materialTitle").textContent = `Text ${activeMaterial.textNo}`;
    $("#materialSource").textContent = `${activeMaterial.bookName} · ${activeMaterial.setName}`;
    $("#editorProgress").value = editorAudio.duration ? String(editorAudio.currentTime / editorAudio.duration * 100) : "0";
    $("#editorTime").textContent = `${formatAudioTime(editorAudio.currentTime)} / ${formatAudioTime(editorAudio.duration || materialDuration(activeMaterial))}`;
  }
  const globalIcon = $("#editorPlay")?.querySelector("[data-icon]");
  if (globalIcon) globalIcon.dataset.icon = !editorAudio.paused ? "pause" : "play";
  hydrateIcons();
}

function playEditorSegment(materialIndex, segmentIndex) {
  state.activeMaterialIndex = materialIndex;
  setEditorAudioForMaterial(materialIndex);
  const material = state.dictationMaterials[state.activeMaterialIndex];
  const segment = material?.segments[segmentIndex];
  if (!segment) return;
  state.editorPlayingSegmentIndex = segmentIndex;
  editorAudio.currentTime = Math.max(0, Number(segment.start || 0));
  updateEditorSentencePlaying();
  editorAudio.play().catch(() => {
    state.editorPlayingSegmentIndex = null;
    updateEditorSentencePlaying();
  });
}

function updateEditorSentencePlaying() {
  $("#materialTranscript")?.querySelectorAll("[data-editor-segment]").forEach((row) => {
    row.classList.toggle("playing", Number(row.dataset.materialIndex) === state.activeMaterialIndex && Number(row.dataset.editorSegment) === state.editorPlayingSegmentIndex);
  });
  updateMaterialOrderActive();
  updateEditorAudioControls();
}

function toggleMaterialBlank(materialIndex, tokenId) {
  state.activeMaterialIndex = materialIndex;
  const material = state.dictationMaterials[materialIndex];
  const blanks = new Set(material.blanks);
  if (blanks.has(tokenId)) blanks.delete(tokenId);
  else blanks.add(tokenId);
  material.blanks = [...blanks];
  state.dictationDirty = true;
  renderDictationEditor();
}

function clearMaterialBlanks(materialIndex) {
  const material = state.dictationMaterials[materialIndex];
  if (!material?.blanks.length) return;
  const blankCount = material.blanks.length;
  openAppDialog({
    title: `清除 Text ${material.textNo} 挖空`,
    message: `将清除当前材料的 ${blankCount} 个挖空，材料内容和顺序不会改变。`,
    confirmText: "清除",
    danger: true,
    onConfirm: () => {
      material.blanks = [];
      state.activeMaterialIndex = materialIndex;
      state.dictationDirty = true;
      renderDictationEditor();
      showAppNotice(`Text ${material.textNo} 的挖空已清除。`, "success");
    },
  });
}

function renderMaterialSourceQuestions(material) {
  const questions = material.questionIds.map(getQuestion).filter(Boolean);
  if (!questions.length) return '<div class="source-questions"><p>该 Text 暂无原题信息。</p></div>';
  return `<div class="source-questions">
    ${questions.map((q) => `<article><strong>${escapeHtml(q.stem)}</strong>${q.options.map((option) => `<span>${escapeHtml(option.text)}</span>`).join("")}</article>`).join("")}
  </div>`;
}

function reorderMaterials(from, to) {
  if (from === to || from < 0 || to < 0) return;
  const [moved] = state.dictationMaterials.splice(from, 1);
  state.dictationMaterials.splice(to, 0, moved);
  state.activeMaterialIndex = to;
  state.dictationDirty = true;
  renderDictationEditor();
}

function moveMaterialToPosition(from, position) {
  if (!Number.isFinite(position)) return renderDictationEditor();
  const to = Math.min(state.dictationMaterials.length, Math.max(1, Math.round(position))) - 1;
  if (from === to) return renderDictationEditor();
  reorderMaterials(from, to);
}

function deleteMaterialAt(index) {
  if (state.dictationMaterials.length <= 1) {
    showAppNotice("任务至少保留一段 Text 材料。", "warning");
    return;
  }
  const material = state.dictationMaterials[index];
  if (!material) return;
  openAppDialog({
    title: `删除 Text ${material.textNo}`,
    message: "该 Text 及已设置的挖空将从当前任务中删除。",
    confirmText: "删除",
    danger: true,
    onConfirm: () => {
      editorAudio.pause();
      state.editorPlayingSegmentIndex = null;
      state.dictationMaterials.splice(index, 1);
      if (state.activeMaterialIndex > index) state.activeMaterialIndex -= 1;
      else if (state.activeMaterialIndex === index) state.activeMaterialIndex = Math.min(index, state.dictationMaterials.length - 1);
      state.dictationDirty = true;
      renderDictationEditor();
      showAppNotice(`Text ${material.textNo} 已删除。`, "success");
    },
  });
}

function selectedResponseMode() {
  return state.page === "dictation-publish" ? "app" : "paper";
}

function setResponseMode(mode) {
  state.publishResponseMode = mode === "app" ? "app" : "paper";
}

function setPublishRadioValue(name, value, fallback) {
  const input = $(`[name='${name}'][value='${value}']`) || $(`[name='${name}'][value='${fallback}']`);
  if (input) input.checked = true;
}

function restorePublishTimeSettings(task = null) {
  const time = task?.publishTime || {};
  setPublishRadioValue("publishStart", time.start, "now");
  setPublishRadioValue("publishEnd", time.end, "week");
  setPublishRadioValue("publishVisible", time.visible, "now");
  $("#publishStartDate").value = time.startDate || "";
  $("#publishStartTime").value = time.startTime || "";
  $("#publishEndDate").value = time.endDate || "";
  $("#publishEndTime").value = time.endTime || "";
  $("#publishVisibleDate").value = time.visibleDate || "";
  $("#publishVisibleTime").value = time.visibleTime || "";
}

function restorePublishFormSettings(task = null) {
  restorePublishTimeSettings(task);
  const rules = task?.publishRules;
  if (!rules) {
    applyPublishAnswerModePreset("exam");
    $("#publishPlanDays").value = "2";
    return;
  }
  setPublishRadioValue("publishScoreRelease", rules.scoreRelease, "after-end");
  setPublishRadioValue("publishMakeup", rules.makeup, "allow");
  setPublishRadioValue("publishUnlockMode", rules.unlockMode, "all");
  setPublishRadioValue("publishTargetRate", rules.targetRate, "none");
  setPublishRadioValue("publishRetryLimit", rules.retryLimit, "2");
  setPublishRadioValue("publishQuestionOrder", rules.questionOrder, "random");
  setPublishRadioValue("publishAnswerMode", rules.answerMode, "exam");
  $("#publishPlanDays").value = String(rules.planDays || 2);
  $("#publishTargetCustomValue").value = String(rules.customTargetRate || 75);
  $("#publishRetryCustomValue").value = String(rules.customRetryLimit || 5);
}

function applyPublishAnswerModePreset(mode) {
  const examMode = mode === "exam";
  setPublishRadioValue("publishAnswerMode", examMode ? "exam" : "practice", "exam");
  setPublishRadioValue("publishScoreRelease", examMode ? "after-end" : "after-completion", "after-completion");
  setPublishRadioValue("publishMakeup", "allow", "allow");
  setPublishRadioValue("publishUnlockMode", "all", "all");
  setPublishRadioValue("publishTargetRate", "none", "none");
  setPublishRadioValue("publishQuestionOrder", examMode ? "random" : "ordered", "ordered");
}

function markPublishDirty() {
  state.paperDirty = true;
}

function selectedPublishStudents() {
  return Object.values(CLASS_STUDENTS).flat().filter((student) => state.publishStudentIds.has(student.id));
}

function allPublishStudentOptions() {
  return TEACHER_CLASSES.flatMap((classInfo) => (CLASS_STUDENTS[classInfo.id] || []).map((student) => ({
    ...student,
    classId: classInfo.id,
    className: classInfo.name,
  })));
}

function publishStudentSearchResults() {
  const keyword = state.publishStudentSearch.trim();
  if (!keyword) return [];
  return allPublishStudentOptions()
    .filter((student) => student.name.includes(keyword))
    .slice(0, 12);
}

function selectedPublishClasses() {
  return TEACHER_CLASSES
    .filter((item) => (CLASS_STUDENTS[item.id] || []).some((student) => state.publishStudentIds.has(student.id)))
    .map((item) => item.id);
}

function ensurePublishSelection() {
  if (state.publishStudentIds.size) return;
  state.publishClassId = state.filterClass;
  state.publishStudentIds = new Set((CLASS_STUDENTS[state.publishClassId] || []).map((student) => student.id));
}

function isoDateOffset(days = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function ensurePublishTimeDefaults() {
  if (!$("#publishStartDate").value) $("#publishStartDate").value = isoDateOffset(0);
  if (!$("#publishStartTime").value) $("#publishStartTime").value = "08:00";
  if (!$("#publishEndDate").value) $("#publishEndDate").value = isoDateOffset(7);
  if (!$("#publishEndTime").value) $("#publishEndTime").value = "23:59";
  if (!$("#publishVisibleDate").value) $("#publishVisibleDate").value = isoDateOffset(0);
  if (!$("#publishVisibleTime").value) $("#publishVisibleTime").value = "08:00";
  updatePublishTimeFields();
}

function updatePublishTimeFields() {
  const scheduled = $("#publishStartScheduled").checked;
  const customEnd = $("#publishEndCustom").checked;
  const scheduledVisible = $("#publishVisibleScheduled").checked;
  const lockStartAndVisible = Boolean(state.publishDeadlineOnly);
  $("[data-publish-time-fields='start']").classList.toggle("active", scheduled);
  $("[data-publish-time-fields='end']").classList.toggle("active", customEnd);
  $("[data-publish-time-fields='visible']").classList.toggle("active", scheduledVisible);
  [$("#publishStartDate"), $("#publishStartTime")].forEach((input) => { input.disabled = lockStartAndVisible || !scheduled; });
  [$("#publishEndDate"), $("#publishEndTime")].forEach((input) => { input.disabled = !customEnd; });
  [$("#publishVisibleDate"), $("#publishVisibleTime")].forEach((input) => { input.disabled = lockStartAndVisible || !scheduledVisible; });
  $$("[name='publishStart'], [name='publishVisible']").forEach((input) => { input.disabled = lockStartAndVisible; });
  $$("[name='publishStart'], [name='publishVisible']").forEach((input) => {
    input.closest(".publish-time-rule-row")?.classList.toggle("is-locked", lockStartAndVisible);
  });
}

function ensurePublishRuleDefaults() {
  if (!$("#publishPlanDays").value) $("#publishPlanDays").value = "2";
  updatePublishRuleFields();
}

function publishTotalSets() {
  const explicit = Number(state.publishSetCount);
  if (Number.isFinite(explicit) && explicit > 0) return Math.ceil(explicit);
  const setIds = new Set(state.paperItems.map((item) => Number(item.sourceId || item.question?.setId)).filter(Number.isFinite));
  return Math.max(1, setIds.size || Math.ceil((state.paperItems.length || 1) / 20));
}

function publishTotalQuestions() {
  return Math.max(1, state.paperItems.length || 1);
}

function publishQuantityMode() {
  return state.publishQuantityMode === "set" ? "set" : "question";
}

function publishPlanDays() {
  return Math.max(1, Number($("#publishPlanDays").value) || 1);
}

function publishDailySets() {
  return Math.max(1, Math.ceil(publishTotalSets() / publishPlanDays()));
}

function publishDailyQuestions() {
  return Math.max(1, Math.ceil(publishTotalQuestions() / publishPlanDays()));
}

function updatePublishRuleFields() {
  const targetRate = $("[name='publishTargetRate']:checked")?.value || "none";
  const retryVisible = targetRate !== "none";
  const useSetCount = publishQuantityMode() === "set";
  $("#publishDailyUnitLabel").textContent = useSetCount ? "每日完成套数" : "每日完成题数";
  $("#publishDailySets").textContent = useSetCount ? `${publishDailySets()} 套` : `${publishDailyQuestions()} 题`;
  $("#publishTargetCustomValue").disabled = !$("#publishTargetCustom").checked;
  $("#publishRetryLimitRow").classList.toggle("hidden", !retryVisible);
  $$("[name='publishRetryLimit']").forEach((input) => { input.disabled = !retryVisible; });
  $("#publishRetryCustomValue").disabled = !retryVisible || !$("#publishRetryCustom").checked;
}

function currentPublishPayload() {
  const duration = state.publishSource === "paper" ? "30分钟" : formatChineseDuration(paperDuration());
  return {
    name: $("#paperName").value.trim() || paperDateName(),
    meta: `来源：${state.paperItems[0]?.question?.bookName || "听力讲评"}`,
    duration,
    generateMode: "生成试卷",
    appMode: "学生端作答",
  };
}

function renderDictationPublishSetup() {
  if (!els.dictationPublishPage || state.page !== "dictation-publish") return;
  const payload = currentPublishPayload();
  const currentClass = TEACHER_CLASSES.find((item) => item.id === state.publishClassId) || TEACHER_CLASSES[0];
  const students = CLASS_STUDENTS[currentClass.id] || [];
  const selectedStudents = selectedPublishStudents();
  const selectedClasses = selectedPublishClasses();
  const appEnabled = true;
  $("#publishPracticeName").textContent = payload.name;
  $("#publishPracticeMeta").textContent = payload.meta;
  $("#publishPracticeDuration").textContent = `预计 ${payload.duration}`;
  $("#publishTargetSection").classList.toggle("hidden", !appEnabled);
  $("#publishTimeSection").classList.toggle("hidden", !appEnabled);
  $("#publishRuleSection").classList.toggle("hidden", !appEnabled);
  els.dictationPublishPage.classList.toggle("publish-deadline-only", appEnabled && state.publishDeadlineOnly);
  $("#publishClassList").innerHTML = TEACHER_CLASSES.map((item) => {
    const selectedCount = (CLASS_STUDENTS[item.id] || []).filter((student) => state.publishStudentIds.has(student.id)).length;
    const selectedState = selectedCount === item.studentCount ? "complete" : selectedCount > 0 ? "partial" : "empty";
    return `<button type="button" class="${item.id === currentClass.id ? "active" : ""}" data-publish-class="${item.id}">
      <span class="publish-class-check publish-class-check-${selectedState}" aria-hidden="true"></span>
      <span><strong>${item.name}（${selectedCount}/${item.studentCount}人）</strong><small>${item.studentCount} 人</small></span>
    </button>`;
  }).join("");
  $("#publishStudentGrid").innerHTML = students.map((student) => `
    <label class="${state.publishStudentIds.has(student.id) ? "selected" : ""}">
      <input type="checkbox" data-publish-student="${student.id}" ${state.publishStudentIds.has(student.id) ? "checked" : ""} />
      <span></span><b>${student.name}</b>
    </label>`).join("");
  $("#publishStudentSearch").value = state.publishStudentSearch;
  $("#publishTargetSummary").textContent = selectedStudents.length
    ? `已选 ${selectedStudents.length} 人，${selectedClasses.length} 个班级`
    : "请选择至少 1 名学生";
  renderPublishStudentSearchResults();
  $("#publishConfirm").disabled = appEnabled && selectedStudents.length === 0;
  ensurePublishTimeDefaults();
  ensurePublishRuleDefaults();
  hydrateIcons();
}

function renderPublishStudentSearchResults() {
  const panel = $("#publishStudentSearchResults");
  if (!panel) return;
  const results = publishStudentSearchResults();
  const shouldShow = state.publishStudentSearchOpen && Boolean(state.publishStudentSearch);
  panel.classList.toggle("hidden", !shouldShow);
  if (!shouldShow) {
    panel.innerHTML = "";
    return;
  }
  panel.innerHTML = results.length ? results.map((student) => `
    <label class="publish-student-search-row" role="option" aria-selected="${state.publishStudentIds.has(student.id) ? "true" : "false"}">
      <input type="checkbox" data-publish-search-student="${student.id}" ${state.publishStudentIds.has(student.id) ? "checked" : ""} />
      <span>${escapeHtml(student.name)}</span>
      <em>${escapeHtml(student.className)}</em>
    </label>`).join("") : `<div class="publish-student-search-empty">未找到学生</div>`;
}

function validateDictationMaterials() {
  if (!state.dictationMaterials.length) {
    showAppNotice("任务至少需要一段 Text 材料。", "warning");
    return false;
  }
  const invalidIndex = state.dictationMaterials.findIndex((material) => !material.blanks.length);
  if (invalidIndex >= 0) {
    state.activeMaterialIndex = invalidIndex;
    renderDictationEditor();
    scrollToDictationMaterial(invalidIndex);
    showAppNotice(`Text ${state.dictationMaterials[invalidIndex].textNo} 还没有设置空，请至少设置 1 个空或删除该 Text。`, "warning");
    return false;
  }
  return true;
}

function validatePaperItems() {
  if (state.paperItems.length) return true;
  showAppNotice("组卷至少需要 1 题。", "warning");
  return false;
}

function openPaperPublishPage() {
  if (!validatePaperItems()) return;
  if (state.paperEntryMode !== "publish") state.publishQuantityMode = "question";
  state.publishSetCount = publishQuantityMode() === "set" ? publishTotalSets() : Math.max(1, new Set(state.paperItems.map((item) => Number(item.sourceId || item.question?.setId)).filter(Number.isFinite)).size);
  state.publishSource = "paper";
  state.publishDeadlineOnly = false;
  state.publishReturnPage = state.editorReturnPage === "book-overview" ? "book-overview" : "paper";
  setResponseMode("app");
  restorePublishFormSettings(loadTasks().find((task) => task.id === state.editingPaperTaskId));
  ensurePublishSelection();
  syncRoute("dictation-publish");
  requestAnimationFrame(() => $("#backToDictationEditor").focus());
}

function openBookCatalogSetPublish(setId) {
  const catalogSet = catalogSetRecord(Number(setId));
  const sourceSet = bookAssignmentSetRecord(catalogSet);
  if (!catalogSet || !sourceSet?.questions?.length) {
    showAppNotice("当前套题暂无可布置题目。", "warning");
    return;
  }
  state.paperItems = sourceSet.questions.map((question, index) => createPaperItem(question, "book", index, catalogSet.setId));
  state.publishSetCount = 1;
  state.publishQuantityMode = "set";
  state.activePaperIndex = 0;
  state.editingPaperTaskId = null;
  state.contentViewOnly = false;
  state.publishSource = "paper";
  state.publishDeadlineOnly = false;
  state.publishReturnPage = "book-overview";
  $("#paperName").value = catalogSet.name;
  setResponseMode("app");
  restorePublishFormSettings(null);
  ensurePublishSelection();
  syncRoute("dictation-publish");
}

function openBookCatalogBatchPublish() {
  const selectedSets = [...state.bookSelectedSetIds]
    .map((setId) => catalogSetRecord(Number(setId)))
    .filter(Boolean);
  const sourceQuestions = [];
  selectedSets.forEach((catalogSet) => {
    const sourceSet = bookAssignmentSetRecord(catalogSet);
    if (!sourceSet?.questions?.length) return;
    sourceSet.questions.forEach((question) => sourceQuestions.push({ question, catalogSet }));
  });
  if (!sourceQuestions.length) {
    showAppNotice("当前勾选套题暂无可布置题目。", "warning");
    return;
  }
  state.paperItems = sourceQuestions.map(({ question, catalogSet }, index) => createPaperItem(question, "book", index, catalogSet.setId));
  state.publishSetCount = Math.max(1, selectedSets.length);
  state.publishQuantityMode = "set";
  state.activePaperIndex = 0;
  state.editingPaperTaskId = null;
  state.contentViewOnly = false;
  state.publishSource = "paper";
  state.publishDeadlineOnly = false;
  state.publishReturnPage = "book-overview";
  $("#paperName").value = selectedSets.length === 1 ? selectedSets[0].name : `${selectedSets.length}套题学生端作答`;
  setResponseMode("app");
  restorePublishFormSettings(null);
  ensurePublishSelection();
  syncRoute("dictation-publish");
}

function closePublishPage() {
  state.publishDeadlineOnly = false;
  if (state.publishReturnPage === "book-overview") {
    openBookOverviewForClass(state.bookClassName, "catalog");
    return;
  }
  syncRoute("paper");
}

function publishTimeSettings() {
  return {
    start: $("[name='publishStart']:checked")?.value || "now",
    startDate: $("#publishStartDate").value,
    startTime: $("#publishStartTime").value,
    end: $("[name='publishEnd']:checked")?.value || "week",
    endDate: $("#publishEndDate").value,
    endTime: $("#publishEndTime").value,
    visible: $("[name='publishVisible']:checked")?.value || "now",
    visibleDate: $("#publishVisibleDate").value,
    visibleTime: $("#publishVisibleTime").value,
  };
}

function publishRuleSettings() {
  const targetRate = $("[name='publishTargetRate']:checked")?.value || "none";
  const retryLimit = targetRate === "none" ? null : $("[name='publishRetryLimit']:checked")?.value || "2";
  const dailySets = publishDailySets();
  const dailyQuestions = publishDailyQuestions();
  const quantityMode = publishQuantityMode();
  return {
    quantityMode,
    planDays: publishPlanDays(),
    dailySets: quantityMode === "set" ? dailySets : null,
    totalSets: publishTotalSets(),
    dailyQuestions: quantityMode === "question" ? dailyQuestions : null,
    totalQuestions: publishTotalQuestions(),
    scoreRelease: $("[name='publishScoreRelease']:checked")?.value || "after-completion",
    makeup: $("[name='publishMakeup']:checked")?.value || "allow",
    unlockMode: $("[name='publishUnlockMode']:checked")?.value || "all",
    targetRate,
    customTargetRate: targetRate === "custom" ? Number($("#publishTargetCustomValue").value) || 0 : null,
    retryLimit,
    customRetryLimit: retryLimit === "custom" ? Number($("#publishRetryCustomValue").value) || 0 : null,
    questionOrder: $("[name='publishQuestionOrder']:checked")?.value || "ordered",
    answerMode: $("[name='publishAnswerMode']:checked")?.value || "exam",
  };
}

function persistPublishTask() {
  persistPaperTask();
}

function saveDictationTask() {
  if (!validateDictationMaterials()) return;
  const tasks = loadTasks();
  const oldTask = tasks.find((task) => task.id === state.editingTaskId);
  const task = {
    id: state.editingTaskId || `task-${Date.now()}`,
    name: $("#dictationName").value.trim() || "未命名精听挖空",
    type: "dictation",
    responseMode: oldTask?.responseMode === "app" ? "app" : "online",
    classes: oldTask?.responseMode === "app" ? oldTask.classes || [] : [],
    studentIds: oldTask?.responseMode === "app" ? oldTask.studentIds || [] : [],
    studentNames: oldTask?.responseMode === "app" ? oldTask.studentNames || [] : [],
    publishTime: oldTask?.responseMode === "app" ? oldTask.publishTime || null : null,
    materials: JSON.parse(JSON.stringify(state.dictationMaterials)),
    sourceClass: oldTask?.sourceClass || state.filterClass,
    sourceFilter: state.dictationSourceFilter || snapshotListeningFilters(),
    updatedAt: new Date().toISOString(),
  };
  const index = tasks.findIndex((item) => item.id === task.id);
  if (index >= 0) tasks[index] = task;
  else tasks.unshift(task);
  saveTasks(tasks);
  state.dictationDirty = false;
  state.editingTaskId = null;
  if (task.responseMode === "app") syncRoute("work");
  else openMyPaperPage();
}

function leaveDictationEditor(force = false) {
  if (state.dictationDirty && !force) {
    openAppDialog({
      title: "离开精听挖空",
      message: "当前修改尚未保存，离开后本次修改不会保留。",
      confirmText: "确认离开",
      danger: true,
      onConfirm: () => leaveDictationEditor(true),
    });
    return;
  }
  state.dictationDirty = false;
  syncRoute(state.editingTaskId ? state.editorReturnPage : "listening");
}

function setDefaultDateRange(stateStartKey, stateEndKey) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  state[stateStartKey] = toInputDate(start);
  state[stateEndKey] = toInputDate(end);
}

function applyDateRangeInputs(startInput, endInput, stateStartKey, stateEndKey, rerender) {
  const start = new Date(`${startInput.value}T00:00:00`);
  const end = new Date(`${endInput.value}T23:59:59`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
  if (end < start) {
    showAppNotice("结束日期不能早于开始日期。", "warning");
    rerender();
    return;
  }
  const maxEnd = new Date(start);
  maxEnd.setDate(maxEnd.getDate() + 29);
  state[stateStartKey] = startInput.value;
  if (end > maxEnd) {
    state[stateEndKey] = toInputDate(maxEnd);
    showAppNotice("自定义时间范围最多30天，已自动调整结束日期。", "warning");
  } else {
    state[stateEndKey] = endInput.value;
  }
  rerender();
}

function bindQuestionBankEvents() {
  $("#questionBankPage .question-bank-tabs").addEventListener("click", (event) => {
    const tab = event.target.closest(".question-bank-tab");
    if (!tab) return;
    state.questionBankTab = tab.id === "aiAssignmentTab" ? "ai" : "my-paper";
    renderQuestionBank();
  });
  $("#myPaperFilterSwitches").addEventListener("click", (event) => {
    const typeButton = event.target.closest("[data-my-paper-type-filter]");
    const timeButton = event.target.closest("[data-my-paper-time-filter]");
    if (typeButton) state.myPaperTypeFilter = typeButton.dataset.myPaperTypeFilter;
    if (timeButton) {
      state.myPaperTimeFilter = timeButton.dataset.myPaperTimeFilter;
      if (state.myPaperTimeFilter === "custom" && (!state.myPaperDateStart || !state.myPaperDateEnd)) {
        setDefaultDateRange("myPaperDateStart", "myPaperDateEnd");
      }
    }
    if (typeButton || timeButton) renderMyPaperList();
  });
  [$("#myPaperDateStart"), $("#myPaperDateEnd")].forEach((input) => input.addEventListener("change", () => {
    applyDateRangeInputs($("#myPaperDateStart"), $("#myPaperDateEnd"), "myPaperDateStart", "myPaperDateEnd", renderMyPaperList);
  }));
  $$(".question-bank-action").forEach((button) => button.addEventListener("click", () => {
    showAppNotice("AI 作业布置入口已预留。", "info");
  }));
}

function bindWorkEvents() {
  $("#workFilterSwitches").addEventListener("click", (event) => {
    const timeButton = event.target.closest("[data-work-time-filter]");
    if (timeButton) {
      state.workTimeFilter = timeButton.dataset.workTimeFilter;
      if (state.workTimeFilter === "custom" && (!state.workDateStart || !state.workDateEnd)) {
        setDefaultDateRange("workDateStart", "workDateEnd");
      }
    }
    if (!timeButton) return;
    renderWorkList();
  });
  [$("#workDateStart"), $("#workDateEnd")].forEach((input) => input.addEventListener("change", () => {
    applyDateRangeInputs($("#workDateStart"), $("#workDateEnd"), "workDateStart", "workDateEnd", renderWorkList);
  }));
}

function schoolbookTaskStatus(task) {
  const status = task.gradingStatus || "pending";
  if (status === "graded") return { key: "graded", label: "已完成", note: "" };
  if (status === "submitted") return { key: "submitted", label: "待批改", note: "学生已提交，等待教师确认批改" };
  return { key: "pending", label: "待提交", note: "作业已推送到学生 APP，等待学生提交" };
}

function advanceSchoolbookTask(taskId) {
  const tasks = loadTasks();
  const task = tasks.find((item) => item.id === taskId && item.type === "schoolbook");
  if (!task) return;
  const current = schoolbookTaskStatus(task).key;
  task.gradingStatus = current === "pending" ? "submitted" : "graded";
  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);
  renderWorkList();
  showAppNotice(task.gradingStatus === "submitted" ? "已记录学生提交，作业进入待批改状态。" : "批改已完成，班级数据已生成。", "success");
}

function openSchoolbookTaskData(taskId) {
  const task = loadTasks().find((item) => item.id === taskId && item.type === "schoolbook");
  if (!task || schoolbookTaskStatus(task).key !== "graded") return;
  const firstQuestion = task.questions?.[0];
  if (!firstQuestion) return;
  state.bookClassName = task.classes?.[0] || DEFAULT_CLASS;
  state.bookActiveSetId = Number(firstQuestion.setId);
  state.bookOverviewTab = "catalog";
  state.bookOverviewUnit = catalogSetRecord(state.bookActiveSetId)?.group.code || "WELCOME";
  state.bookOverviewSelectedSetId = state.bookActiveSetId;
  state.bookOverviewSetDetailId = state.bookActiveSetId;
  state.bookOverviewSetDetailTab = "overview";
  syncRoute("book-overview");
}

function formatWorkTaskTime(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "--";
  const dateLabel = date.toLocaleDateString("zh-CN", { year: "numeric", month: "numeric", day: "numeric" });
  const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
  const timeLabel = date.toLocaleTimeString("zh-CN", { hour12: false });
  return `${dateLabel} ${weekday} ${timeLabel}`;
}

function formatWorkTaskDate(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "numeric", day: "numeric" });
}

function formatWorkTaskDateRange(task) {
  const start = task.publishTime?.start === "custom" && task.publishTime?.startDate
    ? task.publishTime.startDate.replaceAll("-", "/")
    : formatWorkTaskDate(task.createdAt || task.updatedAt);
  const end = formatWorkTaskDeadline(task);
  return `${start}～${end}`;
}

function formatWorkTaskCardDate(task) {
  if (workTaskHasClassProgress(task)) return formatWorkTaskDateRange(task);
  return formatWorkTaskDate(task.createdAt || task.updatedAt);
}

function formatWorkTaskDeadline(task) {
  if (!workTaskHasClassProgress(task) || !task.publishTime) return "--";
  const settings = task.publishTime;
  if (settings.end === "custom" && settings.endDate) {
    return `${settings.endDate.replaceAll("-", "/")} ${settings.endTime || "23:59"}`;
  }
  const date = new Date(task.updatedAt || task.createdAt || Date.now());
  const offsets = { today: 0, tomorrow: 1, "day-after": 2, week: 7 };
  date.setDate(date.getDate() + (offsets[settings.end] ?? 7));
  const dateLabel = date.toLocaleDateString("zh-CN", { year: "numeric", month: "numeric", day: "numeric" });
  return `${dateLabel} 23:59`;
}

function workTaskClassStudentCount(task, classId) {
  const ids = new Set(task.studentIds || []);
  const students = CLASS_STUDENTS[classId] || [];
  const selected = students.filter((student) => ids.has(student.id)).length;
  if (selected) return selected;
  if (classId && task.classes?.includes(classId)) return students.length;
  return ids.size || 0;
}

function workTaskClassRate(task, classId) {
  if (!classId) return null;
  const totals = workReportQuestionSet(task).questions
    .map((question) => classResultForQuestion(question, classId))
    .filter((result) => result.total > 0);
  const total = totals.reduce((sum, result) => sum + result.total, 0);
  if (!total) return null;
  const correctCount = totals.reduce((sum, result) => sum + result.correctCount, 0);
  return correctCount / total * 100;
}

function paperTaskQuestionId(item) {
  return item?.question?.baseId || item?.question?.id || item?.baseId || item?.id || "";
}

function workTaskTypeMeta(task) {
  if (task.type === "schoolbook") return { label: "校本作业", icon: "book", tone: "schoolbook" };
  if (task.responseMode === "app") return { label: "学生端作答", icon: "phone", tone: "student-app" };
  if (task.type === "paper") return { label: "听力组卷", icon: "paper", tone: "paper" };
  return { label: "精听挖空", icon: "cloze", tone: "dictation" };
}

function workTaskSource(task) {
  if (task.type === "schoolbook") return task.bookName || "校本书籍";
  if (task.type === "paper") return task.materials?.[0]?.bookName || "听力讲评";
  return task.materials?.[0]?.bookName || "校本书籍";
}

function workTaskMetaLine(task) {
  const source = escapeHtml(workTaskSource(task));
  if (task.type === "schoolbook") {
    return `${source} · ${escapeHtml(task.setName || "校本套题")} · ${task.questions?.length || 0} 题`;
  }
  if (task.type === "paper") {
    const questionCount = task.questions?.length || 0;
    const duration = (task.materials || []).reduce((sum, material) => sum + Number(material.segments.at(-1)?.end || 0), 0);
    return `${source} · ${questionCount} 题 · ${formatAudioTime(duration)}`;
  }
  const duration = (task.materials || []).reduce((sum, material) => sum + Number(material.segments.at(-1)?.end || 0), 0);
  return `${source} · ${task.materials?.length || 0} 段 Text · ${formatAudioTime(duration)}`;
}

function workTaskMode(task) {
  if (task.type === "schoolbook") return "学生端作答 / 教师扫描";
  if (task.responseMode === "app") return "学生端作答";
  if (task.responseMode === "paper") return "生成试卷";
  return "在线精听";
}

function workTaskIsOnlineOnly(task) {
  return task.type === "dictation" && !["app", "paper"].includes(task.responseMode);
}

function workTaskHasClassProgress(task) {
  return task.type === "schoolbook" || task.responseMode === "app";
}

function withWorkCardDemoData(task, index) {
  if (task.type === "schoolbook") return task;
  const next = {
    ...task,
    classProgress: { ...(task.classProgress || {}) },
  };
  if (next.type === "dictation" && next.responseMode === "paper") next.responseMode = "online";
  if (!workTaskHasClassProgress(next)) return next;
  const classIds = next.classes?.length ? next.classes : [""];
  const gaps = [6, 0, 3, 10, 0, 8, 14, 2];
  classIds.forEach((classId, offset) => {
    const total = workTaskClassStudentCount(next, classId);
    if (!total) return;
    const key = "completed";
    const existing = next.classProgress[classId]?.[key];
    if (Number.isFinite(existing)) return;
    const gap = gaps[(index + offset) % gaps.length];
    next.classProgress[classId] = {
      ...(next.classProgress[classId] || {}),
      [key]: Math.max(0, total - gap),
    };
  });
  return next;
}

function workTaskById(taskId) {
  const tasks = loadTasks();
  const index = tasks.findIndex((task) => task.id === taskId);
  return index < 0 ? null : withWorkCardDemoData(tasks[index], index);
}

function workReportQuestionSet(task) {
  const candidates = task.type === "paper"
    ? [
        ...(task.questions || []).map((item) => getQuestion(paperTaskQuestionId(item)) || item.question || item),
        ...(task.materials || []).flatMap((material) => (material.questionIds || []).map(getQuestion)),
      ]
    : task.type === "dictation"
      ? (task.materials || []).flatMap((material) => (material.questionIds || []).map(getQuestion))
      : (task.questions || []).map((item) => getQuestion(item.id) || item);
  const seen = new Set();
  const questions = candidates.filter(Boolean).filter((question) => {
    if (!question.id || seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
  return {
    setId: questions[0]?.setId || 0,
    setName: task.setName || task.name,
    questions,
  };
}

function workReportStudentRows(set, task, className) {
  const status = task.type === "schoolbook" ? schoolbookTaskStatus(task) : { key: "ready" };
  const progress = workTaskClassProgress(task, status, className);
  return bookStudentRows(set, className, true).map((row, index) => index < progress.done
    ? row
    : { ...row, score: null, correctCount: 0, uploadTime: "--", graded: false });
}

function openWorkReport(taskId, className = "") {
  const task = workTaskById(taskId);
  if (!task) return;
  const classes = task.classes?.length ? task.classes : [className || DEFAULT_CLASS];
  state.workReportTaskId = task.id;
  state.workReportClassName = classes.includes(className) ? className : classes[0];
  state.workReportTab = "catalog";
  state.workReportStudentPage = 1;
  state.workReportQuestionPage = 1;
  state.bookClassName = state.workReportClassName;
  state.bookOverviewUnit = "all";
  state.bookOverviewSetDetailId = null;
  state.bookOverviewSetDetailStudentId = null;
  syncRoute("work-report");
}

function workReportSetLabel(set) {
  return set?.displaySetName || set?.setName || "作业试题";
}

function workReportSetActivity(task, className, index = 0) {
  const total = workTaskClassStudentCount(task, className);
  const progress = workTaskClassProgress(task, task.type === "schoolbook" ? schoolbookTaskStatus(task) : { key: "ready" }, className);
  const spread = Math.max(0, Math.min(total, total - progress.done));
  const answered = Math.max(progress.done, Math.min(total, progress.done + Math.max(0, spread - index % Math.max(1, spread + 1))));
  const date = new Date(task.updatedAt || task.createdAt || Date.now());
  date.setDate(date.getDate() + index);
  return {
    answered,
    total,
    percent: total ? Math.round(answered / total * 100) : 0,
    latest: date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).replace(/\//g, "-"),
  };
}

function renderWorkReport() {
  if (!els.workReportPage || state.page !== "work-report") return;
  const task = workTaskById(state.workReportTaskId);
  if (!task) {
    syncRoute("work");
    showAppNotice("未找到对应作业，已返回作业列表。", "warning");
    return;
  }
  const classes = task.classes?.length ? task.classes : [DEFAULT_CLASS];
  if (!classes.includes(state.workReportClassName)) state.workReportClassName = classes[0];
  const status = task.type === "schoolbook" ? schoolbookTaskStatus(task) : { key: "ready" };
  const progress = workTaskClassProgress(task, status, state.workReportClassName);
  const set = workReportQuestionSet(task);
  state.bookClassName = state.workReportClassName;
  $("#workReportTitle").textContent = task.name || "未命名作业";
  $("#workReportMeta").innerHTML = `<span><span data-icon="clock"></span>作答时间：${escapeHtml(formatWorkTaskDateRange(task))}</span><span><span data-icon="users"></span>${escapeHtml(teacherClassLabel(state.workReportClassName))}</span><span>${escapeHtml(progress.summary)}</span>`;
  $("#workReportTabs").querySelectorAll("[data-work-report-tab]").forEach((button) => {
    const selected = button.dataset.workReportTab === state.workReportTab;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  $("#workReportClassSwitch").innerHTML = classes.map((className) => `<option value="${escapeHtml(className)}">${escapeHtml(teacherClassLabel(className))}</option>`).join("");
  $("#workReportClassSwitch").value = state.workReportClassName;
  if (!set.questions.length) {
    leaveBookMistakesWorkspace();
    restoreListeningWorkspace();
    syncListeningWorkspaceChrome();
    $("#workReportContent").innerHTML = '<div class="work-report-empty"><span data-icon="chart"></span><strong>暂无可统计的试题</strong><p>该作业当前没有关联到题目数据。</p></div>';
    hydrateIcons();
    return;
  }
  const renderers = {
    catalog: renderBookOverviewSets,
    overall: renderBookOverviewWhole,
    knowledge: renderBookOverviewKnowledge,
    mistakes: renderBookOverviewMistakes,
    students: renderBookOverviewStudents,
  };
  if (!renderers[state.workReportTab]) state.workReportTab = "catalog";
  if (state.workReportTab !== "mistakes") leaveBookMistakesWorkspace();
  restoreListeningWorkspace();
  disposeBookOverviewCharts();
  disposeBookDataCharts();
  const bookOverviewContent = $("#bookOverviewContent");
  if (bookOverviewContent) bookOverviewContent.innerHTML = "";
  $("#workReportContent").innerHTML = renderers[state.workReportTab](state.workReportClassName);
  bindBookOverviewContentEvents(state.workReportClassName, { rootSelector: "#workReportContent", rerender: renderWorkReport, returnPage: "work-report" });
  if (state.workReportTab === "catalog") {
    if (state.bookOverviewSetDetailId) mountBookOverviewSetDetail(state.workReportClassName);
  } else if (state.workReportTab === "mistakes") {
    enterBookMistakesWorkspace(state.workReportClassName);
    mountBookMistakesWorkspace("#workReportContent #bookOverviewListeningHost");
    renderTable();
    renderBasket();
  } else {
    leaveBookMistakesWorkspace();
    if (state.workReportTab === "overall") renderBookOverviewCharts(state.workReportClassName, { onSetClick: () => {
      state.workReportTab = "catalog";
      renderWorkReport();
    } });
    if (state.workReportTab === "students") renderBookOverviewStudentCharts(state.workReportClassName);
  }
  syncListeningWorkspaceChrome();
  hydrateIcons();
}

function renderWorkActionButton(attribute, icon, label, options = {}) {
  const classes = ["work-action-button"];
  if (options.primary) classes.push("primary");
  if (options.tone) classes.push(`tone-${options.tone}`);
  if (options.danger) classes.push("danger-text");
  if (options.wide) classes.push("wide");
  return `<button type="button" class="${classes.join(" ")}" ${attribute}><span data-icon="${icon}"></span><b>${label}</b></button>`;
}

function renderWorkTableLink(attribute, label, options = {}) {
  const classes = ["link-button", "work-table-link"];
  if (options.danger) classes.push("danger-text");
  return `<button type="button" class="${classes.join(" ")}" ${attribute}>${label}</button>`;
}

function renderWorkMoreButton(attribute, icon, label, options = {}) {
  const classes = ["work-more-action"];
  if (options.danger) classes.push("danger-text");
  return `<button type="button" class="${classes.join(" ")}" role="menuitem" ${attribute}><span data-icon="${icon}"></span><b>${label}</b></button>`;
}

function renderWorkMoreMenu(task, status) {
  const taskId = escapeHtml(task.id);
  const editAction = task.type === "paper"
    ? task.responseMode === "app" ? renderWorkMoreButton(`data-edit-paper-deadline="${taskId}"`, "pencil", "修改") : renderWorkMoreButton(`data-edit-paper-task="${taskId}"`, "pencil", "修改")
    : task.type === "dictation"
      ? renderWorkMoreButton(`data-edit-task="${taskId}"`, "pencil", "修改")
      : renderWorkMoreButton(`data-modify-task="${taskId}"`, "pencil", "修改");
  return `
    <div class="work-more-menu" aria-label="更多操作">
      ${renderWorkActionButton(`data-work-more-toggle="${taskId}" aria-haspopup="menu" aria-expanded="false"`, "more", "更多")}
      <div class="work-more-popover hidden" role="menu">
        ${renderWorkMoreButton(`data-view-task="${taskId}"`, "detail", "查看")}
        ${editAction}
        ${renderWorkMoreButton(`data-delete-task="${taskId}"`, "trash", "删除", { danger: true })}
      </div>
    </div>`;
}

function renderWorkTableMoreMenu(task) {
  const taskId = escapeHtml(task.id);
  const editAction = task.type === "paper"
    ? task.responseMode === "app" ? "" : renderWorkMoreButton(`data-edit-paper-task="${taskId}"`, "pencil", "修改")
    : task.type === "dictation"
      ? renderWorkMoreButton(`data-edit-task="${taskId}"`, "pencil", "修改")
      : renderWorkMoreButton(`data-modify-task="${taskId}"`, "pencil", "修改");
  return `<div class="work-more-menu work-table-more-menu" aria-label="更多操作">
    ${renderWorkTableLink(`data-work-more-toggle="${taskId}" aria-haspopup="menu" aria-expanded="false"`, "更多")}
    <div class="work-more-popover hidden" role="menu">
      ${renderWorkMoreButton(`data-view-task="${taskId}"`, "detail", "查看")}
      ${editAction}
      ${renderWorkMoreButton(`data-delete-task="${taskId}"`, "trash", "删除", { danger: true })}
    </div>
  </div>`;
}

function closeWorkMoreMenus(keepMenu = null, root = null) {
  const roots = root ? [root] : [$("#workRows"), $("#myPaperRows")];
  roots.filter(Boolean).forEach((list) => list.querySelectorAll(".work-more-menu").forEach((menu) => {
    const open = menu === keepMenu;
    menu.querySelector(".work-more-popover")?.classList.toggle("hidden", !open);
    menu.querySelector("[data-work-more-toggle]")?.setAttribute("aria-expanded", String(open));
  }));
}

function renderWorkInlineActions(task, status) {
  const taskId = escapeHtml(task.id);
  const downloadAction = renderWorkActionButton(`data-download-task="${taskId}"`, "download", "下载");
  if (task.type === "schoolbook") {
    const statusAction = status.key === "pending"
      ? renderWorkActionButton(`data-advance-schoolbook-task="${taskId}"`, "check-filled", "记录提交")
      : status.key === "submitted"
        ? renderWorkActionButton(`data-advance-schoolbook-task="${taskId}"`, "pencil", "完成批改")
        : "";
    return `
      ${statusAction}
      ${downloadAction}
      ${renderWorkMoreMenu(task, status)}`;
  }
  const remindAction = task.responseMode === "app"
    ? renderWorkActionButton(`data-remind-task="${taskId}"`, "bell", "一键催促", { tone: "info" })
    : "";
  const appPaperProgress = task.type === "paper" && task.responseMode === "app" ? workTaskOverallProgress(task, status) : null;
  const reportDownloadAction = appPaperProgress
    ? renderWorkActionButton(`data-download-report-task="${taskId}"`, "download", "下载报告")
    : "";
  const dictationAction = task.type === "paper" && task.responseMode !== "app"
    ? renderWorkActionButton(`data-paper-to-dictation="${taskId}"`, "cloze", "去挖空", { tone: "success" })
    : "";
  const generatedPaperFullAction = task.type === "paper" && task.responseMode !== "app"
    ? renderWorkActionButton(`data-full-paper-task="${taskId}"`, "expand", "全屏讲解", { primary: true, wide: true })
    : "";
  const onlineAction = workTaskIsOnlineOnly(task)
    ? renderWorkActionButton(`data-online-task="${taskId}"`, "headphones", "在线精听", { primary: true, wide: true })
    : "";
  return `
    ${remindAction}
    ${reportDownloadAction}
    ${dictationAction}
    ${generatedPaperFullAction}
    ${onlineAction}
    ${appPaperProgress ? "" : downloadAction}
    ${renderWorkMoreMenu(task, status)}`;
}

function renderWorkTableActions(task, status) {
  const taskId = escapeHtml(task.id);
  if (task.type === "schoolbook") {
    const statusAction = status.key === "pending"
      ? renderWorkTableLink(`data-advance-schoolbook-task="${taskId}"`, "记录提交")
      : status.key === "submitted"
        ? renderWorkTableLink(`data-advance-schoolbook-task="${taskId}"`, "完成批改")
        : "";
    return `${statusAction}${renderWorkTableLink(`data-download-task="${taskId}"`, "下载")}${renderWorkTableMoreMenu(task)}`;
  }
  const links = [];
  if (task.responseMode === "app") links.push(renderWorkTableLink(`data-remind-task="${taskId}"`, "一键催促"));
  const appPaperProgress = task.type === "paper" && task.responseMode === "app" ? workTaskOverallProgress(task, status) : null;
  if (appPaperProgress) {
    links.push(renderWorkTableLink(`${appPaperProgress.done > 0 ? "data-edit-paper-deadline" : "data-edit-paper-task"}="${taskId}"`, "修改"));
    links.push(renderWorkTableLink(`data-download-report-task="${taskId}"`, "下载报告"));
  }
  if (task.type === "paper") links.push(renderWorkTableLink(`data-paper-to-dictation="${taskId}"`, "去挖空"));
  if (task.type === "paper" && task.responseMode !== "app") links.push(renderWorkTableLink(`data-full-paper-task="${taskId}"`, "全屏讲解"));
  if (workTaskIsOnlineOnly(task)) links.push(renderWorkTableLink(`data-online-task="${taskId}"`, "在线精听"));
  if (!appPaperProgress) links.push(renderWorkTableLink(`data-download-task="${taskId}"`, "下载"));
  links.push(renderWorkTableMoreMenu(task));
  return links.join("");
}

function renderWorkClassActions(task, status, classId) {
  const taskId = escapeHtml(task.id);
  const classAttr = escapeHtml(classId || "");
  const report = renderWorkActionButton(`data-class-report-task="${taskId}" data-work-class="${classAttr}"`, "chart", "作业报告");
  if (task.type === "paper") {
    if (task.responseMode === "app") return report;
    return `${renderWorkActionButton(`data-full-paper-task="${taskId}" data-work-class="${classAttr}"`, "expand", "全屏讲解", { primary: true, wide: true })}${report}`;
  }
  if (task.type === "schoolbook" && status.key === "graded") {
    return report;
  }
  if (task.type === "dictation") {
    const online = renderWorkActionButton(`data-online-task="${taskId}" data-work-class="${classAttr}"`, "headphones", "在线精听", { primary: true, wide: true });
    return `${online}${report}`;
  }
  return report;
}

function workTaskClassProgress(task, status, classId) {
  const total = workTaskClassStudentCount(task, classId);
  let done = total;
  let summary = total ? `${total}/${total} 人已完成` : "未设置对象";
  if (task.type !== "schoolbook" && total) {
    const progressValue = task.classProgress?.[classId]?.completed;
    if (Number.isFinite(progressValue)) {
      done = Math.max(0, Math.min(total, Math.round(progressValue)));
      summary = `${done}/${total} 人已完成`;
    }
  }
  if (task.type === "schoolbook") {
    if (status.key === "pending") {
      done = 0;
      summary = total ? `0/${total} 人已提交` : "未设置对象";
    } else if (status.key === "submitted") {
      summary = total ? `${total}/${total} 人已提交` : "未设置对象";
    } else {
      summary = `${total}/${total} 人已完成`;
    }
  }
  const percent = total ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0;
  return { total, done, summary, percent };
}

function workTaskSegmentCount(task) {
  const rules = task.publishRules || {};
  if (Number.isFinite(rules.totalSets) && rules.totalSets > 0) return Math.min(60, Math.round(rules.totalSets));
  if (Number.isFinite(rules.planDays) && rules.planDays > 0) return Math.min(60, Math.round(rules.planDays));
  const setIds = new Set((workReportQuestionSet(task).questions || []).map((question) => question.setId).filter(Boolean));
  return Math.max(1, Math.min(60, setIds.size || task.materials?.length || 1));
}

function workTaskSegmentProgress(task, progress, classId) {
  const count = workTaskSegmentCount(task);
  const total = progress.total || 0;
  const completedAll = progress.done || 0;
  const remaining = Math.max(0, total - completedAll);
  return Array.from({ length: count }, (_, index) => {
    const slope = count <= 1 ? 0 : (count - 1 - index) / (count - 1);
    const variation = ((index + Math.max(0, TEACHER_CLASSES.findIndex((item) => item.id === classId))) % 3) / 10;
    const done = total ? Math.max(completedAll, Math.min(total, Math.round(completedAll + remaining * Math.max(0, slope - variation)))) : 0;
    return { index, done, total, percent: total ? Math.round(done / total * 100) : 0 };
  });
}

function renderWorkSegmentedProgress(task, progress, classId) {
  const segments = workTaskSegmentProgress(task, progress, classId);
  return `<span class="work-class-progress work-class-segment-progress" style="--segment-count:${segments.length}" aria-label="每日任务完成进度">
    ${segments.map((segment) => `<i tabindex="0" data-tooltip="第 ${segment.index + 1} 天任务：${segment.done}/${segment.total} 人完成" aria-label="第 ${segment.index + 1} 天任务，${segment.done}/${segment.total} 人完成" style="--segment-percent:${segment.percent}%"><b></b></i>`).join("")}
  </span>`;
}

function workTaskOverallProgress(task, status) {
  const classIds = task.classes?.length ? task.classes : [""];
  const progress = classIds.map((classId) => workTaskClassProgress(task, status, classId));
  const total = progress.reduce((sum, item) => sum + item.total, 0);
  const done = progress.reduce((sum, item) => sum + item.done, 0);
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { total, done, percent };
}

function renderWorkClassRows(task, status) {
  const classIds = task.classes?.length ? task.classes : [""];
  return classIds.map((classId) => {
    const label = classId ? teacherClassLabel(classId) : "未设置班级";
    const progress = workTaskClassProgress(task, status, classId);
    const progressTone = progress.total && progress.percent < 100 ? "partial" : "complete";
    return `
      <div class="work-card-class-row ${progressTone}">
        <span class="work-class-pill">${escapeHtml(label)}</span>
        ${renderWorkSegmentedProgress(task, progress, classId)}
        <strong>${escapeHtml(progress.summary)}</strong>
        <span class="work-class-actions">${renderWorkClassActions(task, status, classId)}</span>
      </div>`;
  }).join("");
}

function renderWorkTaskCard(task) {
  const typeMeta = workTaskTypeMeta(task);
  const status = task.type === "schoolbook" ? schoolbookTaskStatus(task) : { key: "ready", label: "", note: "" };
  const statusBadge = task.type === "schoolbook" ? `<span class="task-status task-status-${status.key}">${status.label}</span>` : "";
  return `
    <article class="work-card work-card-${typeMeta.tone} work-card-mode-${task.responseMode || "online"} ${workTaskIsOnlineOnly(task) ? "work-card-online-only" : ""}">
      <div class="work-card-main">
        <div class="work-card-summary">
          <div class="work-card-copy">
            <div class="work-card-left-row">
              <img class="work-book-cover" src="./assets/book-covers/listening-advanced-grade-1-semester-1-2026.jpg" alt="${escapeHtml(workTaskSource(task))}封面" />
              <div class="work-card-title-block">
                <div class="work-card-title-row">
                  <h3>${escapeHtml(task.name)}</h3>
                  <span class="work-card-type-badge">${escapeHtml(typeMeta.label)}</span>
                  ${statusBadge}
                </div>
                <div class="work-card-subtitle-row">
                  <div class="work-card-time">
                    <span data-icon="clock"></span>
                    <strong>${formatWorkTaskCardDate(task)}</strong>
                  </div>
                </div>
                ${task.type === "schoolbook" && status.note ? `<p>${escapeHtml(status.note)}</p>` : ""}
              </div>
            </div>
          </div>
          <div class="work-card-inline-actions">${renderWorkInlineActions(task, status)}</div>
        </div>
        ${workTaskHasClassProgress(task) ? `<div class="work-card-progress-panel">
          <div class="work-card-classes">${renderWorkClassRows(task, status)}</div>
        </div>` : ""}
      </div>
    </article>`;
}

function renderWorkTableClassProgress(task, status) {
  if (!workTaskHasClassProgress(task)) return "";
  return `<tr class="work-table-progress-row"><td colspan="6"><div class="work-table-class-progress">${renderWorkClassRows(task, status)}</div></td></tr>`;
}

function renderWorkTaskTableRows(task) {
  const typeMeta = workTaskTypeMeta(task);
  const status = task.type === "schoolbook" ? schoolbookTaskStatus(task) : { key: "ready", label: "", note: "" };
  const statusBadge = task.type === "schoolbook" ? `<span class="task-status task-status-${status.key}">${status.label}</span>` : "";
  return `<tr class="work-table-task-row">
    <td><div class="work-table-title"><strong>${escapeHtml(task.name)}</strong>${statusBadge}</div></td>
    <td><span class="work-card-type-badge work-table-type-${typeMeta.tone}">${escapeHtml(typeMeta.label)}</span></td>
    <td>${escapeHtml(workTaskMode(task))}</td>
    <td>${escapeHtml(formatWorkTaskTime(task.updatedAt || task.createdAt))}</td>
    <td>${escapeHtml(formatWorkTaskDeadline(task))}</td>
    <td><div class="work-table-actions">${renderWorkTableActions(task, status)}</div></td>
  </tr>${renderWorkTableClassProgress(task, status)}`;
}

function renderWorkTableFilterHeading(label, filterKey) {
  const filtered = filterKey === "type" ? state.workTypeFilter !== "all" : state.workAppFilter !== "all";
  return `<button type="button" class="column-filter-trigger work-table-filter-trigger ${filtered ? "filtered" : ""}" data-work-table-filter="${filterKey}"><span>${label}</span><i data-icon="filter"></i></button>`;
}

function renderWorkTaskTable(tasks) {
  return `<div class="table-wrap work-table-wrap"><table class="data-table work-table">
    <thead><tr><th>作业标题</th><th>${renderWorkTableFilterHeading("类型", "type")}</th><th>${renderWorkTableFilterHeading("作答方式", "mode")}</th><th>布置时间</th><th>截止时间</th><th>操作</th></tr></thead>
    <tbody>${tasks.map(renderWorkTaskTableRows).join("")}</tbody>
  </table></div>`;
}

function openWorkTableFilter(trigger, filterKey) {
  const values = filterKey === "type"
    ? [{ value: "all", label: "全部" }, { value: "paper", label: "听力组卷" }, { value: "dictation", label: "精听挖空" }]
    : [{ value: "all", label: "全部" }, { value: "app", label: "学生端作答" }, { value: "paper", label: "试卷" }];
  const current = filterKey === "type" ? state.workTypeFilter : state.workAppFilter;
  els.columnFilterMenu.dataset.column = `work-${filterKey}`;
  els.columnFilterMenu.innerHTML = `<div class="column-filter-options work-table-filter-options">${values.map((item) => `<label class="filter-check-row"><input type="radio" name="workTableFilter" value="${item.value}" ${item.value === current ? "checked" : ""} /><span>${item.label}</span></label>`).join("")}</div>
    <div class="column-filter-actions"><button type="button" data-work-filter-clear>清除筛选</button><button type="button" data-work-filter-apply>确定</button></div>`;
  els.columnFilterMenu.classList.remove("hidden");
  const rect = trigger.getBoundingClientRect();
  const menuWidth = 252;
  els.columnFilterMenu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - menuWidth - 12))}px`;
  els.columnFilterMenu.style.top = `${rect.bottom + 6}px`;
  els.columnFilterMenu.querySelector("[data-work-filter-clear]").addEventListener("click", () => {
    if (filterKey === "type") state.workTypeFilter = "all";
    else state.workAppFilter = "all";
    state.workListPage = 1;
    els.columnFilterMenu.classList.add("hidden");
    renderWorkList();
  });
  els.columnFilterMenu.querySelector("[data-work-filter-apply]").addEventListener("click", () => {
    const value = els.columnFilterMenu.querySelector("[name='workTableFilter']:checked")?.value || "all";
    if (filterKey === "type") state.workTypeFilter = value;
    else state.workAppFilter = value;
    state.workListPage = 1;
    els.columnFilterMenu.classList.add("hidden");
    renderWorkList();
  });
}

function renderWorkPagination(total, page, pageSize) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (!total || pageCount <= 1) {
    return total ? `<span>共 ${total} 个作业</span>` : "";
  }
  return `<span>共 ${total} 个作业，每页 ${pageSize} 个</span><div>
    <button type="button" data-work-page="${page - 1}" ${page <= 1 ? "disabled" : ""} aria-label="上一页"><span data-icon="arrow-left"></span></button>
    ${Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => `<button type="button" class="${item === page ? "active" : ""}" data-work-page="${item}">${item}</button>`).join("")}
    <button type="button" data-work-page="${page + 1}" ${page >= pageCount ? "disabled" : ""} aria-label="下一页"><span data-icon="arrow-right"></span></button>
  </div>`;
}

function taskMatchesDateRange(task, filter, startValue, endValue) {
  const taskDate = new Date(task.updatedAt || task.createdAt || 0);
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  if (filter === "7" || filter === "15") {
    const earliest = new Date(now);
    earliest.setDate(earliest.getDate() - Number(filter));
    return taskDate >= earliest && taskDate <= todayEnd;
  }
  if (filter === "custom" && startValue && endValue) {
    return taskDate >= new Date(`${startValue}T00:00:00`) && taskDate <= new Date(`${endValue}T23:59:59`);
  }
  return true;
}

function bindWorkCardListActions(root, rerender) {
  root.querySelectorAll("[data-work-more-toggle]").forEach((button) => button.addEventListener("click", () => {
    const menu = button.closest(".work-more-menu");
    const popover = menu?.querySelector(".work-more-popover");
    closeWorkMoreMenus(popover?.classList.contains("hidden") ? menu : null, root);
  }));
  root.querySelectorAll(".work-more-action").forEach((button) => button.addEventListener("click", () => closeWorkMoreMenus(null, root)));
  root.querySelectorAll("[data-edit-task]").forEach((button) => button.addEventListener("click", () => editDictationTask(button.dataset.editTask)));
  root.querySelectorAll("[data-edit-paper-task]").forEach((button) => button.addEventListener("click", () => editPaperTask(button.dataset.editPaperTask)));
  root.querySelectorAll("[data-edit-paper-deadline]").forEach((button) => button.addEventListener("click", () => openPaperTaskDeadline(button.dataset.editPaperDeadline)));
  root.querySelectorAll("[data-full-paper-task]").forEach((button) => button.addEventListener("click", () => openPaperTaskFull(button.dataset.fullPaperTask, button.dataset.workClass || "")));
  root.querySelectorAll("[data-publish-paper-task]").forEach((button) => button.addEventListener("click", () => openPaperTaskPublish(button.dataset.publishPaperTask)));
  root.querySelectorAll("[data-full-schoolbook-task]").forEach((button) => button.addEventListener("click", () => {
    const task = loadTasks().find((item) => item.id === button.dataset.fullSchoolbookTask);
    const ids = (task?.questions || []).map((item) => item.id).filter((id) => getQuestion(id));
    if (button.dataset.workClass) state.filterClass = button.dataset.workClass;
    if (ids.length) openFull(ids, ids[0], "work");
  }));
  root.querySelectorAll("[data-advance-schoolbook-task]").forEach((button) => button.addEventListener("click", () => advanceSchoolbookTask(button.dataset.advanceSchoolbookTask)));
  root.querySelectorAll("[data-schoolbook-task-data]").forEach((button) => button.addEventListener("click", () => openSchoolbookTaskData(button.dataset.schoolbookTaskData)));
  root.querySelectorAll("[data-online-task]").forEach((button) => button.addEventListener("click", () => openOnlineTask(button.dataset.onlineTask)));
  root.querySelectorAll("[data-class-report-task]").forEach((button) => button.addEventListener("click", () => openWorkReport(button.dataset.classReportTask, button.dataset.workClass || "")));
  root.querySelectorAll("[data-remind-task]").forEach((button) => button.addEventListener("click", () => showAppNotice("已向未完成学生发送 APP 催促提醒。", "success")));
  root.querySelectorAll("[data-paper-to-dictation]").forEach((button) => button.addEventListener("click", () => openPaperTaskAsDictation(button.dataset.paperToDictation)));
  root.querySelectorAll("[data-view-task]").forEach((button) => button.addEventListener("click", () => viewWorkTask(button.dataset.viewTask)));
  root.querySelectorAll("[data-modify-task]").forEach((button) => button.addEventListener("click", () => showAppNotice("该类型作业的修改入口已预留，后续接入完整编辑流程。", "info")));
  root.querySelectorAll("[data-download-task]").forEach((button) => button.addEventListener("click", () => showAppNotice("下载内容包括任务材料、答题卡和按 Text 独立音频文件（ZIP）。", "info")));
  root.querySelectorAll("[data-download-report-task]").forEach((button) => button.addEventListener("click", () => showAppNotice("作业报告已生成，正在准备下载。", "success")));
  root.querySelectorAll("[data-delete-task]").forEach((button) => button.addEventListener("click", () => {
    const task = loadTasks().find((item) => item.id === button.dataset.deleteTask);
    const studentTask = task?.responseMode === "app" || task?.type === "schoolbook";
    openAppDialog({
      title: studentTask ? "删除作业" : "删除试卷",
      message: studentTask ? "删除后，已推送班级将立即失去该作业的查看权限。" : "删除后无法恢复，确认删除这份试卷吗？",
      confirmText: "删除",
      danger: true,
      onConfirm: () => {
        saveTasks(loadTasks().filter((item) => item.id !== button.dataset.deleteTask));
        rerender();
        showAppNotice(studentTask ? "作业已删除。" : "试卷已删除。", "success");
      },
    });
  }));
}

function renderQuestionBank() {
  if (!els.questionBankPage || state.page !== "question-bank") return;
  const showingMyPapers = state.questionBankTab !== "ai";
  $("#myPaperTab").classList.toggle("active", showingMyPapers);
  $("#myPaperTab").setAttribute("aria-selected", String(showingMyPapers));
  $("#aiAssignmentTab").classList.toggle("active", !showingMyPapers);
  $("#aiAssignmentTab").setAttribute("aria-selected", String(!showingMyPapers));
  $("#app").classList.toggle("question-bank-ai-active", !showingMyPapers);
  els.myPaperPanel.classList.toggle("hidden", !showingMyPapers);
  els.aiAssignmentPanel.classList.toggle("hidden", showingMyPapers);
  if (showingMyPapers) renderMyPaperList();
  hydrateIcons();
}

function openMyPaperPage() {
  state.questionBankTab = "my-paper";
  syncRoute("question-bank");
}

function renderMyPaperList() {
  if (!els.myPaperPanel || state.page !== "question-bank" || state.questionBankTab === "ai") return;
  $("#myPaperFilterSwitches").querySelectorAll("[data-my-paper-type-filter]").forEach((button) => {
    const active = button.dataset.myPaperTypeFilter === state.myPaperTypeFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#myPaperFilterSwitches").querySelectorAll("[data-my-paper-time-filter]").forEach((button) => {
    const active = button.dataset.myPaperTimeFilter === state.myPaperTimeFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#myPaperCustomDateRange").classList.toggle("hidden", state.myPaperTimeFilter !== "custom");
  $("#myPaperDateStart").value = state.myPaperDateStart;
  $("#myPaperDateEnd").value = state.myPaperDateEnd;
  const tasks = loadTasks().map((task, index) => withWorkCardDemoData(task, index)).filter((task) => {
    const isLocalPaper = task.responseMode !== "app" && (task.type === "paper" || task.type === "dictation");
    const matchesType = state.myPaperTypeFilter === "all" || task.type === state.myPaperTypeFilter;
    return isLocalPaper && matchesType && taskMatchesDateRange(task, state.myPaperTimeFilter, state.myPaperDateStart, state.myPaperDateEnd);
  }).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  const root = $("#myPaperRows");
  root.innerHTML = tasks.length
    ? tasks.map((task) => renderWorkTaskCard(task)).join("")
    : `<div class="work-empty-card"><span data-icon="clipboard"></span><strong>暂无符合筛选条件的试卷</strong><p>切换试卷类型或创建时间查看其他内容。</p></div>`;
  hydrateIcons();
  bindWorkCardListActions(root, renderMyPaperList);
}

function renderWorkList() {
  if (!els.workPage || state.page !== "work") return;
  $("#workFilterSwitches").querySelectorAll("[data-work-time-filter]").forEach((button) => {
    const active = button.dataset.workTimeFilter === state.workTimeFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#workCustomDateRange").classList.toggle("hidden", state.workTimeFilter !== "custom");
  $("#workDateStart").value = state.workDateStart;
  $("#workDateEnd").value = state.workDateEnd;
  const tasks = loadTasks().map((task, index) => withWorkCardDemoData(task, index)).filter((task) => {
    const isStudentTask = task.responseMode === "app" || task.type === "schoolbook";
    return isStudentTask && taskMatchesDateRange(task, state.workTimeFilter, state.workDateStart, state.workDateEnd);
  }).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  const root = $("#workRows");
  root.classList.add("work-card-list");
  root.classList.remove("work-table-list");
  root.innerHTML = tasks.length
    ? tasks.map((task) => renderWorkTaskCard(task)).join("")
    : `<div class="work-empty-card"><span data-icon="clipboard"></span><strong>暂无符合时间条件的学生端作业</strong><p>调整上方布置时间查看其他任务。</p></div>`;
  hydrateIcons();
  bindWorkCardListActions(root, renderWorkList);
}

function bindOnlineEvents() {
  $("#closeOnline").addEventListener("click", closeOnline);
  $("#onlinePlay").addEventListener("click", () => {
    state.onlinePlayingSegmentIndex = null;
    updateOnlineSegmentPlaying();
    if (els.onlineAudio.paused) els.onlineAudio.play();
    else els.onlineAudio.pause();
  });
  $("#onlineSpeedMenuToggle").addEventListener("click", toggleOnlineSpeedMenu);
  $$("[data-online-playback-rate]").forEach((button) => {
    button.addEventListener("click", () => setOnlinePlaybackRate(Number(button.dataset.onlinePlaybackRate)));
  });
  setOnlinePlaybackRate(state.onlinePlaybackRate, false);
  $("#onlineProgress").addEventListener("input", (event) => {
    if (Number.isFinite(els.onlineAudio.duration)) els.onlineAudio.currentTime = Number(event.target.value) / 1000 * els.onlineAudio.duration;
    updateOnlineSeekBubble(true);
  });
  $("#onlineProgress").addEventListener("pointerdown", () => updateOnlineSeekBubble(true));
  $("#onlineProgress").addEventListener("pointerup", hideOnlineSeekBubble);
  $("#onlineProgress").addEventListener("change", hideOnlineSeekBubble);
  $("#onlineProgress").addEventListener("blur", hideOnlineSeekBubble);
  els.onlineAudio.addEventListener("play", updateOnlineAudioControls);
  els.onlineAudio.addEventListener("pause", updateOnlineAudioControls);
  els.onlineAudio.addEventListener("timeupdate", updateOnlineAudioControls);
  els.onlineAudio.addEventListener("timeupdate", stopOnlineSegmentIfNeeded);
  els.onlineAudio.addEventListener("loadedmetadata", updateOnlineAudioControls);
  els.onlineAudio.addEventListener("ended", () => {
    state.onlinePlayingSegmentIndex = null;
    updateOnlineSegmentPlaying();
    updateOnlineAudioControls();
  });
  $("#revealNext").addEventListener("click", revealNextOnlineBlank);
  $("#revealAll").addEventListener("click", () => {
    state.onlineRevealAll = true;
    const material = state.onlineTask?.materials[state.onlineMaterialIndex];
    if (material) state.onlineRevealedBlankIds = new Set(material.blanks || []);
    renderOnlineMaterial();
  });
  $("#toggleOnlineQuestions").addEventListener("click", () => {
    state.onlineShowQuestions = !state.onlineShowQuestions;
    renderOnlineMaterial();
  });
  $("#onlinePrevSegment").addEventListener("click", () => switchOnlineMaterial(-1));
  $("#onlineNextSegment").addEventListener("click", () => switchOnlineMaterial(1));
  $("#onlineCurrentSegment").addEventListener("click", () => {});
  $("#onlineFontDown").addEventListener("click", () => setFullFont(state.fullFont - 2));
  $("#onlineFontUp").addEventListener("click", () => setFullFont(state.fullFont + 2));
  $("#onlineDockToggle").addEventListener("click", toggleOnlineDockCollapsed);
  $("#onlineSettingsToggle").addEventListener("click", toggleOnlineSettings);
  $("#closeOnlineSettings").addEventListener("click", closeOnlineSettings);
  $("#onlineLayoutSwitch").addEventListener("click", () => {
    state.onlineDockSide = state.onlineDockSide === "left" ? "right" : "left";
    demoStorage.setItem("victor:onlineDockSide", state.onlineDockSide);
    closeOnlineSettings();
    applyOnlinePreferences();
  });
}

function openOnlineTask(taskId) {
  const task = loadTasks().find((item) => item.id === taskId);
  if (!task) return;
  state.onlineTask = task;
  state.onlineMaterialIndex = 0;
  state.onlineRevealAll = false;
  state.onlineRevealedBlankIds = new Set();
  state.onlineShowQuestions = false;
  state.onlinePlayingSegmentIndex = null;
  $("#app").classList.add("hidden");
  els.onlinePage.classList.remove("hidden");
  applyOnlinePreferences();
  renderOnlineMaterial();
}

function renderOnlineMaterial() {
  const task = state.onlineTask;
  const materials = Array.isArray(task?.materials) ? task.materials : [];
  state.onlineMaterialIndex = Math.min(Math.max(0, Math.trunc(Number(state.onlineMaterialIndex) || 0)), Math.max(0, materials.length - 1));
  const material = materials[state.onlineMaterialIndex];
  updateOnlineSegmentNav();
  if (!material) return;
  $("#onlineTitle").textContent = task.name;
  $("#onlineMaterialTitle").textContent = `Text ${material.textNo}`;
  $("#onlineMaterialSource").textContent = `${material.bookName} · ${material.setName}`;
  const blanks = new Set(material.blanks);
  $("#onlineTranscript").innerHTML = groupMaterialSegments(material.segments).map((group) => {
    return `<div class="turn-group ${speakerClassName(group.speaker)}-group online-turn-group">
      <div class="speaker-track">
        <button class="speaker ${speakerClassName(group.speaker)}" tabindex="-1">${group.speaker}</button>
        <span></span>
      </div>
      <div class="speaker-paragraph">
        <p class="transcript-paragraph">${group.segments.map((segment) => `<span class="sentence online-segment ${state.onlinePlayingSegmentIndex === segment.segmentIndex ? "playing" : ""}" data-online-segment="${segment.segmentIndex}" role="button" tabindex="0">${renderOnlineSegmentText(segment, blanks)}</span>`).join("")}</p>
      </div>
    </div>`;
  }).join("");
  $("#onlineQuestionPanel").classList.toggle("hidden", !state.onlineShowQuestions);
  $("#onlineSourceQuestions").innerHTML = state.onlineShowQuestions ? renderOnlineSourceQuestions(material) : "";
  $("#onlineTranscript").querySelectorAll(".online-blank").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const id = button.dataset.onlineBlank;
    if (!id) return;
    if (state.onlineRevealedBlankIds.has(id)) state.onlineRevealedBlankIds.delete(id);
    else state.onlineRevealedBlankIds.add(id);
    state.onlineRevealAll = material.blanks.every((blankId) => state.onlineRevealedBlankIds.has(blankId));
    renderOnlineMaterial();
  }));
  $("#onlineTranscript").querySelectorAll("[data-online-segment]").forEach((segment) => {
    segment.addEventListener("click", () => playOnlineSegment(Number(segment.dataset.onlineSegment)));
    segment.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      playOnlineSegment(Number(segment.dataset.onlineSegment));
    });
  });
  updateOnlineToolState();
  setOnlineAudioForMaterial(material);
  updateOnlineAudioControls();
}

function setOnlineAudioForMaterial(material) {
  const filename = materialAudioFilename(material);
  if (!filename) return;
  const nextSrc = materialAudioURL(material);
  if (!nextSrc) return;
  if (els.onlineAudio.src !== new URL(nextSrc, location.href).href) {
    els.onlineAudio.src = nextSrc;
  }
}

function renderOnlineSegmentText(segment, blanks) {
  const parts = tokenizeOnlineSegment(segment.text);
  return parts.map((text, tokenIndex) => {
    const id = `${segment.segmentIndex}-${tokenIndex}`;
    if (!blanks.has(id)) return escapeHtml(text);
    const revealed = state.onlineRevealAll || state.onlineRevealedBlankIds.has(id);
    return `<button class="online-blank ${revealed ? "revealed" : ""}" data-online-blank="${id}" style="--blank-width:${Math.max(4, text.length)}ch"><span>${escapeHtml(text)}</span></button>`;
  }).join("");
}

function tokenizeOnlineSegment(text) {
  return String(text || "").match(/[A-Za-z]+(?:['’][A-Za-z]+)*|\d+(?:[.,:]\d+)*|[^A-Za-z\d\s]+|\s+/g) || [];
}

function orderedOnlineBlankIds(material) {
  const blankIds = new Set(material?.blanks || []);
  return (material?.segments || []).flatMap((segment) => tokenizeOnlineSegment(segment.text)
    .map((_, tokenIndex) => `${segment.segmentIndex}-${tokenIndex}`)
    .filter((id) => blankIds.has(id)));
}

function playOnlineSegment(segmentIndex) {
  const material = state.onlineTask?.materials[state.onlineMaterialIndex];
  const segment = material?.segments[segmentIndex];
  if (!segment) return;
  const filename = materialAudioFilename(material);
  if (filename) setOnlineAudioForMaterial(material);
  state.onlinePlayingSegmentIndex = segmentIndex;
  els.onlineAudio.currentTime = Math.max(0, Number(segment.start || 0));
  updateOnlineSegmentPlaying();
  els.onlineAudio.play().catch(() => {
    state.onlinePlayingSegmentIndex = null;
    updateOnlineSegmentPlaying();
  });
}

function updateOnlineSegmentPlaying() {
  $("#onlineTranscript")?.querySelectorAll("[data-online-segment]").forEach((segment) => {
    segment.classList.toggle("playing", Number(segment.dataset.onlineSegment) === state.onlinePlayingSegmentIndex);
  });
}

function stopOnlineSegmentIfNeeded() {
  const material = state.onlineTask?.materials[state.onlineMaterialIndex];
  const segment = material?.segments[state.onlinePlayingSegmentIndex];
  if (!segment) return;
  if (els.onlineAudio.currentTime >= Number(segment.end || 0) - 0.03) {
    els.onlineAudio.pause();
    state.onlinePlayingSegmentIndex = null;
    updateOnlineSegmentPlaying();
  }
}

function renderOnlineSourceQuestions(material) {
  const questions = (material.questionIds || []).map(getQuestion).filter(Boolean);
  if (!questions.length) return '<div class="empty-state"><strong>暂无原题</strong><span>该 Text 暂无原题信息。</span></div>';
  return `<div class="full-question-list online-source-questions">
    ${questions.map((q) => `<article class="full-question-item online-source-question">
      <p class="full-stem">${escapeHtml(q.stem)}</p>
      ${q.options.map((option) => `<div class="full-option answer-hidden">${escapeHtml(option.text)}</div>`).join("")}
    </article>`).join("")}
  </div>`;
}

function revealNextOnlineBlank() {
  const material = state.onlineTask?.materials[state.onlineMaterialIndex];
  if (!material) return;
  const orderedBlankIds = orderedOnlineBlankIds(material);
  const nextId = orderedBlankIds.find((id) => !state.onlineRevealedBlankIds.has(id));
  if (!nextId) {
    state.onlineRevealAll = true;
    updateOnlineToolState();
    showAppNotice("本段答案已全部显示。", "info");
    return;
  }
  state.onlineRevealedBlankIds.add(nextId);
  state.onlineRevealAll = orderedBlankIds.every((id) => state.onlineRevealedBlankIds.has(id));
  renderOnlineMaterial();
}

function updateOnlineToolState() {
  const material = state.onlineTask?.materials[state.onlineMaterialIndex];
  const blanks = orderedOnlineBlankIds(material);
  $("#revealNext").disabled = !blanks.length || blanks.every((id) => state.onlineRevealAll || state.onlineRevealedBlankIds.has(id));
  $("#revealAll").classList.toggle("active", state.onlineRevealAll);
  $("#toggleOnlineQuestions").classList.toggle("active", state.onlineShowQuestions);
}

function switchOnlineMaterial(direction) {
  const task = state.onlineTask;
  if (!Array.isArray(task?.materials) || !task.materials[state.onlineMaterialIndex]) return;
  const nextIndex = state.onlineMaterialIndex + direction;
  if (nextIndex < 0 || nextIndex >= task.materials.length) return;
  els.onlineAudio.pause();
  state.onlinePlayingSegmentIndex = null;
  state.onlineMaterialIndex = nextIndex;
  state.onlineRevealAll = false;
  state.onlineRevealedBlankIds = new Set();
  renderOnlineMaterial();
}

function updateOnlineSegmentNav() {
  const task = state.onlineTask;
  const materials = Array.isArray(task?.materials) ? task.materials : [];
  const index = state.onlineMaterialIndex;
  const material = materials[index];
  $("#onlinePrevSegment").disabled = !material || index <= 0;
  $("#onlineNextSegment").disabled = !material || index >= materials.length - 1;
  $("#onlineCurrentSegment").textContent = material ? `Text ${material.textNo}` : "选择 Text";
}

function applyOnlinePreferences() {
  applyTheme();
  setFullFont(state.fullFont);
  els.onlinePage.classList.toggle("dock-left-layout", state.onlineDockSide === "left");
  els.onlinePage.classList.toggle("dock-right-layout", state.onlineDockSide !== "left");
  const onlineDock = $(".online-dock");
  onlineDock.classList.toggle("dock-left", state.onlineDockSide === "left");
  onlineDock.classList.toggle("dock-right", state.onlineDockSide !== "left");
  onlineDock.classList.toggle("collapsed", state.onlineDockCollapsed);
  const layoutSwitchIcon = $("#onlineLayoutSwitch [data-icon]");
  const layoutSwitchLabel = $("#onlineLayoutSwitch b");
  const nextSide = state.onlineDockSide === "left" ? "right" : "left";
  if (layoutSwitchIcon) layoutSwitchIcon.dataset.icon = nextSide === "right" ? "layout-right" : "layout-left";
  if (layoutSwitchLabel) layoutSwitchLabel.textContent = nextSide === "right" ? "右布局" : "左布局";
  $("#onlineLayoutSwitch").title = `切换到${nextSide === "right" ? "右" : "左"}布局`;
  updateOnlineDockToggle();
  hydrateIcons();
}

function updateOnlineDockToggle() {
  const button = $("#onlineDockToggle");
  const collapsed = state.onlineDockCollapsed;
  const side = state.onlineDockSide === "left" ? "left" : "right";
  const label = collapsed ? "展开在线精听工具" : "收起在线精听工具";
  const icon = collapsed ? "toolbar-panel" : (side === "left" ? "arrow-left" : "arrow-right");
  button.innerHTML = `<span>${icons[icon]}</span>`;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-expanded", String(!collapsed));
}

function toggleOnlineDockCollapsed() {
  state.onlineDockCollapsed = !state.onlineDockCollapsed;
  demoStorage.setItem("victor:onlineDockCollapsed", String(state.onlineDockCollapsed));
  if (state.onlineDockCollapsed) closeOnlineSettings();
  applyOnlinePreferences();
}

function toggleOnlineSpeedMenu() {
  const menu = $("#onlineSpeedMenu");
  const willOpen = menu.classList.contains("hidden");
  menu.classList.toggle("hidden", !willOpen);
  $("#onlineSpeedMenuToggle").setAttribute("aria-expanded", String(willOpen));
}

function closeOnlineSpeedMenu() {
  $("#onlineSpeedMenu").classList.add("hidden");
  $("#onlineSpeedMenuToggle").setAttribute("aria-expanded", "false");
}

function setOnlinePlaybackRate(rate, closeMenu = true) {
  const validRate = PLAYBACK_RATES.includes(rate) ? rate : 1;
  state.onlinePlaybackRate = validRate;
  els.onlineAudio.playbackRate = state.onlinePlaybackRate;
  demoStorage.setItem("victor:onlinePlaybackRate", String(state.onlinePlaybackRate));
  $("#onlineSpeedValue").textContent = `${state.onlinePlaybackRate.toFixed(1)}x`;
  $$("[data-online-playback-rate]").forEach((button) => {
    const selected = Number(button.dataset.onlinePlaybackRate) === state.onlinePlaybackRate;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-checked", String(selected));
  });
  if (closeMenu) closeOnlineSpeedMenu();
}

function toggleOnlineSettings() {
  const panel = $("#onlineSettingsPanel");
  const button = $("#onlineSettingsToggle");
  const nextOpen = panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !nextOpen);
  button.classList.toggle("active", nextOpen);
  button.setAttribute("aria-expanded", String(nextOpen));
}

function closeOnlineSettings() {
  $("#onlineSettingsPanel").classList.add("hidden");
  $("#onlineSettingsToggle").classList.remove("active");
  $("#onlineSettingsToggle").setAttribute("aria-expanded", "false");
}

function updateOnlineAudioControls() {
  const playing = !els.onlineAudio.paused && !els.onlineAudio.ended;
  const icon = $("#onlinePlay [data-icon]");
  if (icon) icon.dataset.icon = playing ? "pause" : "play";
  $("#onlinePlay").classList.toggle("playing", playing);
  $("#onlinePlay").setAttribute("aria-label", playing ? "暂停" : "播放");
  const progress = $("#onlineProgress");
  const duration = Number.isFinite(els.onlineAudio.duration) ? els.onlineAudio.duration : 0;
  const currentTime = formatAudioTime(els.onlineAudio.currentTime);
  progress.value = duration ? String(els.onlineAudio.currentTime / duration * 1000) : "0";
  $("#onlineSeekBubble").textContent = currentTime;
  $("#onlineCurrentTime").textContent = currentTime;
  $("#onlineDuration").textContent = formatAudioTime(duration);
  hydrateIcons();
}

function updateOnlineSeekBubble(show = false) {
  const progress = $("#onlineProgress");
  const bubble = $("#onlineSeekBubble");
  const value = Number(progress.value || 0);
  const max = Number(progress.max || 1000);
  bubble.style.left = `${max ? value / max * 100 : 0}%`;
  bubble.textContent = formatAudioTime(els.onlineAudio.currentTime);
  if (show) $("#onlineAudioProgressFloat").classList.add("seeking");
}

function hideOnlineSeekBubble() {
  $("#onlineAudioProgressFloat").classList.remove("seeking");
}

function closeOnline() {
  els.onlineAudio.pause();
  closeOnlineSettings();
  closeOnlineSpeedMenu();
  els.onlinePage.classList.add("hidden");
  $("#app").classList.remove("hidden");
  state.onlineTask = null;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

boot().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre style="padding:24px;color:#b42318">原型数据加载失败：${escapeHtml(error.message)}</pre>`;
});
