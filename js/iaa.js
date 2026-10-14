// IAA Secret Service: the private section of the portal (route #/iaa/...).
// Every read and write goes through Supabase with the visitor's own session, so the database's
// row-level security (_supabase/iaa.sql) decides what each rank sees and may change. The interface
// only hides what a rank could not use anyway.

const TB = {
  members: "lspd_iaa_members", posts: "lspd_iaa_posts", cases: "lspd_iaa_cases", entries: "lspd_iaa_case_entries",
  tasks: "lspd_iaa_tasks", assignees: "lspd_iaa_task_assignees", taskEvents: "lspd_iaa_task_events", events: "lspd_iaa_events",
  attendance: "lspd_iaa_attendance", messages: "lspd_iaa_messages", notifications: "lspd_iaa_notifications",
  regulations: "lspd_iaa_regulations", records: "lspd_iaa_records", audit: "lspd_audit_log",
  economy: "lspd_iaa_economy", wallets: "lspd_iaa_wallets", ledger: "lspd_iaa_ledger", payouts: "lspd_iaa_payouts"
};
const BUCKET = "lspd-iaa";
const LEVEL = { owner: 4, chief: 3, deputy: 2, member: 1 };
const OPEN = ["pending", "in_progress", "revision"];
const MAX_FILE = 20 * 1024 * 1024;

// ---------------------------------------------------------------- words (English / Arabic)
const WORDS = {
  en: {
    brand: "IAA · Secret Service", tagline: "Internal operations, cases and personnel",
    nav: { dashboard: "Dashboard", tasks: "Tasks", cases: "Classified files", archives: "Archives", schedule: "Schedule", inbox: "Communications", wallet: "Wallet", personnel: "Personnel", records: "Records", regulations: "Regulations", admin: "Admin panel", search: "Search" },
    searchHint: "Search personnel, tasks, cases, files, regulations…", refresh: "Refresh", save: "Save", cancel: "Cancel", remove: "Delete", edit: "Edit", close: "Close", send: "Send", open: "Open", back: "Back", all: "All",
    none: "Nothing here yet.", unknown: "Unknown", you: "you", noAccess: "Only IAA members can open this section.", setup: "The IAA isn't switched on yet: run _supabase/iaa.sql once in Supabase, then refresh.",
    confirmDelete: "Delete this for good? This can't be undone.", saved: "Saved.", sent: "Sent.", required: "Fill in the required fields.", tooBig: "{name} is larger than 20 MB.",
    ranks: { owner: "Website owner", chief: "IAA Chief", deputy: "IAA Deputy Chief", member: "IAA Member" },
    levels: { 1: "Restricted", 2: "Confidential", 3: "Secret" }, clearance: "Clearance",
    welcome: "Welcome back, {name}", openTasks: "Open tasks", overdue: "Overdue", unreadMessages: "Unread messages", nextEvent: "Next on the schedule", noneScheduled: "Nothing scheduled",
    board: "Announcements", myDeadlines: "My deadlines", awaitingReview: "Waiting for review", upcoming: "Upcoming", notifications: "Notifications", markAllRead: "Mark all read",
    postKinds: { announcement: "Announcement", notice: "Notice", update: "Update", alert: "Alert" }, newPost: "Post to the board", kind: "Type", title: "Title", body: "Text", pin: "Pin to the top", pinned: "Pinned",
    statuses: { pending: "Pending", in_progress: "In progress", submitted: "Awaiting review", revision: "Revision requested", completed: "Completed", rejected: "Rejected", overdue: "Overdue" },
    taskFilters: { open: "Open", overdue: "Overdue", submitted: "Awaiting review", completed: "Completed", rejected: "Rejected", all: "All" },
    priorities: { low: "Low", normal: "Normal", high: "High", critical: "Critical" },
    mine: "Assigned to me", everyone: "All tasks", newTask: "New task", editTask: "Edit task", priority: "Priority", deadline: "Deadline", noDeadline: "No deadline",
    description: "Description", requirements: "Requirements", assignees: "Assign to", groups: "Quick groups", groupAll: "Everyone", groupDeputies: "Deputies", groupMembers: "Members",
    linkedCase: "Linked case", noCase: "None", progress: "Progress", updateProgress: "Update progress", progressNote: "What did you do? (optional)",
    submitReport: "Submit completion report", reportHint: "Describe what was done and attach evidence.", attachments: "Attachments (up to 10 files, 20 MB each)",
    review: "Review", reviewNote: "Note to the assignees", approve: "Approve", requestRevision: "Request revision", reject: "Reject", approveChiefOnly: "Only the IAA Chief or the owner can approve.",
    history: "History", addComment: "Add a comment", assignedBy: "Assigned by", created: "Created", pickOne: "Choose at least one person.",
    taskEvents: { created: "created the task", assigned: "assigned {who}", unassigned: "removed {who}", progress: "set progress to {n}%", report: "submitted a completion report", approved: "approved the task", revision: "requested a revision", rejected: "rejected the task", comment: "commented" },
    caseStatuses: { open: "Open", active: "Active", closed: "Closed", archived: "Archived" }, caseFilters: { live: "Open & active", closed: "Closed", all: "All" },
    newCase: "New case", editCase: "Edit case", classification: "Classification", lead: "Lead investigator", summary: "Summary", caseFile: "Case file", addEntry: "Add to the case file",
    entryKinds: { note: "Note", evidence: "Evidence", report: "Report", document: "Document" }, linkedTasks: "Tasks on this case", updated: "Updated", noLead: "No lead",
    archives: { cases: "Closed cases", tasks: "Finished tasks", events: "Past events" },
    eventKinds: { meeting: "Meeting", operation: "Operation", event: "Event", training: "Training" }, newEvent: "Schedule something", editEvent: "Edit", starts: "Starts", ends: "Ends", location: "Location",
    rsvp: { going: "Going", maybe: "Maybe", absent: "Can't attend" }, attendanceMarks: { present: "Present", excused: "Excused", missed: "Missed" }, attendance: "Attendance", noAnswer: "No answer",
    responses: "{going} going · {maybe} maybe · {absent} can't attend", today: "Today", tomorrow: "Tomorrow", past: "Past events",
    inboxTabs: { in: "Inbox", sent: "Sent", notes: "Notifications" }, compose: "New message", to: "To", subject: "Subject", message: "Message", reply: "Reply", leadership: "All IAA leadership", from: "From",
    addMember: "Add member", editMember: "Edit member", findAccount: "Search site accounts by name or e-mail", chosen: "Selected", rank: "Rank", position: "Position", callsign: "Call sign",
    active: "Active", inactive: "Inactive", joined: "Joined", notes: "Internal notes", removeMember: "Remove from the IAA", profile: "Profile", higherRank: "Only a higher rank can change this member.",
    stats: { assigned: "Tasks assigned", completed: "Completed", overdue: "Overdue", attendance: "Attendance" },
    newRecord: "Add record", recordKinds: { promotion: "Promotion", demotion: "Demotion", assignment: "Assignment", disciplinary: "Disciplinary", commendation: "Commendation", transfer: "Transfer", note: "Note" },
    member: "Member", date: "Date", details: "Details", everyoneFilter: "Everyone",
    regCats: { law: "Laws", instruction: "Instructions", procedure: "Procedures", form: "Forms" }, newRegulation: "Add regulation", code: "Code", category: "Category",
    overview: "Overview", permissions: "Permissions by rank", activity: "Activity log", activityHint: "Logins, file access, permission changes and every edit to IAA data.",
    capabilities: [
      ["View dashboard, schedule, regulations, personnel list", 1], ["Work on own tasks, submit reports, message members", 1], ["Open cases up to own clearance", 1],
      ["Assign tasks, review reports, request revisions", 2], ["Add and edit Members, write records, schedule events", 2], ["See every case and every task", 2],
      ["Approve completed tasks", 3], ["Create and manage cases and regulations", 3], ["Appoint Deputies, read the activity log", 3], ["Appoint the Chief, full access", 4]
    ],
    myWallet: "My wallet", treasury: "Treasury", balance: "Balance", reward: "Reward", rewardEach: "{amount} for each assignee, paid on approval", rewardPaid: "{amount} each · paid",
    rewardHint: "Paid from the treasury to every assignee when the task is approved. Only the owner sets money.", sendMoney: "Send money", requestPayout: "Request payout",
    payoutHint: "The amount leaves your wallet now and comes back if the owner refuses.", amount: "Amount", note: "Note", recipient: "Send to", transactions: "Transactions",
    ledgerKinds: { deposit: "Treasury deposit", reward: "Task reward", bonus: "Bonus", fine: "Fine", transfer: "Transfer", payout: "Payout request", payout_refund: "Payout refunded", adjustment: "Adjustment" },
    earned30: "Earned from tasks · 30 days", received: "Received", sentTotal: "Sent", pendingPayouts: "Pending payouts", payouts: "Payout requests",
    payoutStatus: { pending: "Pending", paid: "Paid", rejected: "Refused" }, markPaid: "Mark as paid", refuse: "Refuse & refund", refuseAsk: "Refuse this payout and return the money to the wallet?",
    leaderboard: "Top earners · 30 days", tasksDone: "{n} tasks", deposit: "Add to treasury", grant: "Bonus or fine", bonus: "Bonus", fine: "Fine",
    currency: "Currency", currencyName: "Currency name", symbol: "Symbol", wallets: "All wallets", inCirculation: "In wallets", paidRewards: "Rewards paid · 30 days",
    treasuryWord: "Treasury", paidOut: "Paid out", fromPerson: "From {name}", toPerson: "To {name}", byPerson: "By {name}", noMoney: "No transactions yet.",
    results: "{n} results for “{q}”", noResults: "No results.", searchTypes: { people: "Personnel", tasks: "Tasks", cases: "Cases", files: "Case files", regulations: "Regulations", records: "Records", events: "Schedule" }
  },
  ar: {
    brand: "IAA · الخدمة السرية", tagline: "العمليات الداخلية والقضايا والأفراد",
    nav: { dashboard: "لوحة القيادة", tasks: "المهام", cases: "الملفات السرية", archives: "الأرشيف", schedule: "الجدول", inbox: "الاتصالات", wallet: "المحفظة", personnel: "الأفراد", records: "السجلات الإدارية", regulations: "اللوائح", admin: "لوحة الإدارة", search: "بحث" },
    searchHint: "ابحث في الأفراد والمهام والقضايا والملفات واللوائح…", refresh: "تحديث", save: "حفظ", cancel: "إلغاء", remove: "حذف", edit: "تعديل", close: "إغلاق", send: "إرسال", open: "فتح", back: "رجوع", all: "الكل",
    none: "لا يوجد شيء بعد.", unknown: "غير معروف", you: "أنت", noAccess: "هذا القسم لأعضاء IAA فقط.", setup: "قسم IAA غير مفعّل بعد: شغّل ملف _supabase/iaa.sql مرة واحدة في Supabase ثم حدّث الصفحة.",
    confirmDelete: "حذف نهائي؟ لا يمكن التراجع.", saved: "تم الحفظ.", sent: "تم الإرسال.", required: "املأ الحقول المطلوبة.", tooBig: "{name} أكبر من 20 ميغابايت.",
    ranks: { owner: "مالك الموقع", chief: "رئيس IAA", deputy: "نائب رئيس IAA", member: "عضو IAA" },
    levels: { 1: "مقيّد", 2: "سري", 3: "سري للغاية" }, clearance: "مستوى التصريح",
    welcome: "أهلاً بعودتك، {name}", openTasks: "مهام مفتوحة", overdue: "متأخرة", unreadMessages: "رسائل غير مقروءة", nextEvent: "التالي في الجدول", noneScheduled: "لا يوجد موعد",
    board: "الإعلانات", myDeadlines: "مواعيدي النهائية", awaitingReview: "بانتظار المراجعة", upcoming: "القادم", notifications: "الإشعارات", markAllRead: "تحديد الكل كمقروء",
    postKinds: { announcement: "إعلان", notice: "تنويه", update: "تحديث", alert: "تنبيه" }, newPost: "نشر في اللوحة", kind: "النوع", title: "العنوان", body: "النص", pin: "تثبيت في الأعلى", pinned: "مثبّت",
    statuses: { pending: "قيد الانتظار", in_progress: "قيد التنفيذ", submitted: "بانتظار المراجعة", revision: "مطلوب تعديل", completed: "مكتملة", rejected: "مرفوضة", overdue: "متأخرة" },
    taskFilters: { open: "مفتوحة", overdue: "متأخرة", submitted: "بانتظار المراجعة", completed: "مكتملة", rejected: "مرفوضة", all: "الكل" },
    priorities: { low: "منخفضة", normal: "عادية", high: "عالية", critical: "حرجة" },
    mine: "المسندة إليّ", everyone: "كل المهام", newTask: "مهمة جديدة", editTask: "تعديل المهمة", priority: "الأولوية", deadline: "الموعد النهائي", noDeadline: "بدون موعد",
    description: "الوصف", requirements: "المتطلبات", assignees: "إسناد إلى", groups: "مجموعات سريعة", groupAll: "الجميع", groupDeputies: "النواب", groupMembers: "الأعضاء",
    linkedCase: "القضية المرتبطة", noCase: "لا يوجد", progress: "التقدم", updateProgress: "تحديث التقدم", progressNote: "ماذا أنجزت؟ (اختياري)",
    submitReport: "تقديم تقرير الإنجاز", reportHint: "اشرح ما تم إنجازه وأرفق الأدلة.", attachments: "المرفقات (حتى 10 ملفات، 20 ميغابايت لكل ملف)",
    review: "المراجعة", reviewNote: "ملاحظة للمكلّفين", approve: "اعتماد", requestRevision: "طلب تعديل", reject: "رفض", approveChiefOnly: "الاعتماد لرئيس IAA أو المالك فقط.",
    history: "السجل", addComment: "أضف تعليقاً", assignedBy: "أسندها", created: "أُنشئت", pickOne: "اختر شخصاً واحداً على الأقل.",
    taskEvents: { created: "أنشأ المهمة", assigned: "أسندها إلى {who}", unassigned: "أزال {who}", progress: "حدّث التقدم إلى {n}%", report: "قدّم تقرير الإنجاز", approved: "اعتمد المهمة", revision: "طلب تعديلاً", rejected: "رفض المهمة", comment: "علّق" },
    caseStatuses: { open: "مفتوحة", active: "نشطة", closed: "مغلقة", archived: "مؤرشفة" }, caseFilters: { live: "المفتوحة والنشطة", closed: "المغلقة", all: "الكل" },
    newCase: "قضية جديدة", editCase: "تعديل القضية", classification: "التصنيف", lead: "المحقق المسؤول", summary: "الملخص", caseFile: "ملف القضية", addEntry: "إضافة إلى ملف القضية",
    entryKinds: { note: "ملاحظة", evidence: "دليل", report: "تقرير", document: "مستند" }, linkedTasks: "مهام هذه القضية", updated: "آخر تحديث", noLead: "بدون مسؤول",
    archives: { cases: "القضايا المغلقة", tasks: "المهام المنتهية", events: "الأحداث السابقة" },
    eventKinds: { meeting: "اجتماع", operation: "عملية", event: "فعالية", training: "تدريب" }, newEvent: "جدولة موعد", editEvent: "تعديل", starts: "يبدأ", ends: "ينتهي", location: "المكان",
    rsvp: { going: "سأحضر", maybe: "ربما", absent: "لن أحضر" }, attendanceMarks: { present: "حاضر", excused: "معذور", missed: "غائب" }, attendance: "الحضور", noAnswer: "لم يرد",
    responses: "{going} سيحضر · {maybe} ربما · {absent} لن يحضر", today: "اليوم", tomorrow: "غداً", past: "الأحداث السابقة",
    inboxTabs: { in: "الوارد", sent: "المرسل", notes: "الإشعارات" }, compose: "رسالة جديدة", to: "إلى", subject: "الموضوع", message: "الرسالة", reply: "رد", leadership: "كل قيادة IAA", from: "من",
    addMember: "إضافة عضو", editMember: "تعديل العضو", findAccount: "ابحث في حسابات الموقع بالاسم أو البريد", chosen: "المختار", rank: "الرتبة", position: "المنصب", callsign: "النداء",
    active: "نشط", inactive: "غير نشط", joined: "تاريخ الانضمام", notes: "ملاحظات داخلية", removeMember: "إزالة من IAA", profile: "الملف الشخصي", higherRank: "فقط رتبة أعلى يمكنها تعديل هذا العضو.",
    stats: { assigned: "مهام مسندة", completed: "مكتملة", overdue: "متأخرة", attendance: "الحضور" },
    newRecord: "إضافة سجل", recordKinds: { promotion: "ترقية", demotion: "تخفيض", assignment: "تكليف", disciplinary: "إجراء تأديبي", commendation: "إشادة", transfer: "نقل", note: "ملاحظة" },
    member: "العضو", date: "التاريخ", details: "التفاصيل", everyoneFilter: "الجميع",
    regCats: { law: "القوانين", instruction: "التعليمات", procedure: "الإجراءات", form: "النماذج" }, newRegulation: "إضافة لائحة", code: "الرمز", category: "الفئة",
    overview: "نظرة عامة", permissions: "الصلاحيات حسب الرتبة", activity: "سجل النشاط", activityHint: "تسجيلات الدخول وفتح الملفات وتغيير الصلاحيات وكل تعديل على بيانات IAA.",
    capabilities: [
      ["عرض اللوحة والجدول واللوائح وقائمة الأفراد", 1], ["العمل على المهام الخاصة وتقديم التقارير ومراسلة الأعضاء", 1], ["فتح القضايا حتى مستوى التصريح", 1],
      ["إسناد المهام ومراجعة التقارير وطلب التعديل", 2], ["إضافة الأعضاء وتعديلهم وكتابة السجلات وجدولة الأحداث", 2], ["رؤية كل القضايا وكل المهام", 2],
      ["اعتماد المهام المكتملة", 3], ["إنشاء القضايا واللوائح وإدارتها", 3], ["تعيين النواب وقراءة سجل النشاط", 3], ["تعيين الرئيس، صلاحية كاملة", 4]
    ],
    myWallet: "محفظتي", treasury: "الخزينة", balance: "الرصيد", reward: "المكافأة", rewardEach: "{amount} لكل مكلّف، تُصرف عند الاعتماد", rewardPaid: "{amount} لكل مكلّف · صُرفت",
    rewardHint: "تُصرف من الخزينة لكل مكلّف عند اعتماد المهمة. المالك فقط يحدد المبلغ.", sendMoney: "تحويل أموال", requestPayout: "طلب صرف",
    payoutHint: "يُخصم المبلغ من محفظتك الآن ويعود إذا رفض المالك.", amount: "المبلغ", note: "ملاحظة", recipient: "إلى", transactions: "العمليات",
    ledgerKinds: { deposit: "إيداع في الخزينة", reward: "مكافأة مهمة", bonus: "مكافأة إضافية", fine: "غرامة", transfer: "تحويل", payout: "طلب صرف", payout_refund: "إرجاع طلب صرف", adjustment: "تسوية" },
    earned30: "أرباح المهام · 30 يوماً", received: "المستلم", sentTotal: "المرسل", pendingPayouts: "طلبات صرف معلّقة", payouts: "طلبات الصرف",
    payoutStatus: { pending: "معلّق", paid: "مصروف", rejected: "مرفوض" }, markPaid: "تأكيد الصرف", refuse: "رفض وإرجاع", refuseAsk: "رفض طلب الصرف وإرجاع المبلغ للمحفظة؟",
    leaderboard: "الأعلى ربحاً · 30 يوماً", tasksDone: "{n} مهام", deposit: "إيداع في الخزينة", grant: "مكافأة أو غرامة", bonus: "مكافأة إضافية", fine: "غرامة",
    currency: "العملة", currencyName: "اسم العملة", symbol: "الرمز", wallets: "كل المحافظ", inCirculation: "في المحافظ", paidRewards: "مكافآت مصروفة · 30 يوماً",
    treasuryWord: "الخزينة", paidOut: "صرف خارجي", fromPerson: "من {name}", toPerson: "إلى {name}", byPerson: "بواسطة {name}", noMoney: "لا توجد عمليات بعد.",
    results: "{n} نتيجة لـ «{q}»", noResults: "لا توجد نتائج.", searchTypes: { people: "الأفراد", tasks: "المهام", cases: "القضايا", files: "ملفات القضايا", regulations: "اللوائح", records: "السجلات", events: "الجدول" }
  }
};

// ---------------------------------------------------------------- state
let C = null;          // helpers handed over by app.js
let client = null;
let root = null;
let dialog = null;
let renderToken = 0;
const S = {
  view: "dashboard", id: "", query: "", data: {}, at: {}, people: new Map(),
  filter: { tasks: "open", scope: "mine", taskQuery: "", cases: "live", caseQuery: "", archive: "cases", inbox: "in", reg: "law", regQuery: "", recKind: "all", recUser: "", personQuery: "", logQuery: "" }
};

const L = (key, vars) => {
  const words = WORDS[C.getLang()] || WORDS.en;
  const value = key.split(".").reduce((node, part) => node?.[part], words) ?? key.split(".").reduce((node, part) => node?.[part], WORDS.en) ?? key;
  return typeof value === "string" && vars ? value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "") : value;
};
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const esc = (value) => C.esc(value);
const icon = (name) => C.icon(name);
const me = () => C.iaa();
const uid = () => C.me()?.id;
const level = () => me().level || 0;
const leader = () => level() >= 2;
const chief = () => level() >= 3;
const person = (id) => S.people.get(id) || { user_id: id, name: L("unknown"), rank: "", position: "", callsign: "", clearance: 0, active: false };
const nameOf = (id) => (id === uid() ? `${person(id).name} (${L("you")})` : person(id).name);
const initials = (name) => String(name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
const isOverdue = (task) => Boolean(task.deadline) && new Date(task.deadline) < new Date() && OPEN.includes(task.status);
const statusOf = (task) => (isOverdue(task) ? "overdue" : task.status);
const closedTask = (task) => task.status === "completed" || task.status === "rejected";
const toLocalInput = (iso) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);
const bytes = (size) => (size > 1048576 ? (size / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB");
const missingSetup = (error) => /PGRST20[25]|42P01|42883|does not exist|Could not find/i.test(`${error?.code} ${error?.message}`);

// Relative time that also works for the future ("in 3 hours"), unlike the site's own "ago".
function rel(value) {
  if (!value) return "";
  const seconds = Math.round((new Date(value) - Date.now()) / 1000);
  const units = [["day", 86400], ["hour", 3600], ["minute", 60]];
  const unit = units.find(([, size]) => Math.abs(seconds) >= size);
  return new Intl.RelativeTimeFormat(C.getLang(), { numeric: "auto" }).format(unit ? Math.round(seconds / unit[1]) : 0, unit ? unit[0] : "minute");
}
const money = (amount) => `${S.data.economy?.symbol || "$"}${Number(amount || 0).toLocaleString(C.locale())}`;
const reloadMoney = () => reload("economy", "mywallet", "ledger", "payouts", "leaderboard", ...(chief() ? ["wallets"] : []));
const when = (value) => (value ? `<time datetime="${esc(value)}" title="${esc(C.fmtDateTime(value))}">${esc(rel(value))}</time>` : "");

// ---------------------------------------------------------------- data
async function call(builder) {
  const { data, error } = await builder;
  if (error) throw error;
  return data;
}

const LOADERS = {
  people: async () => {
    const rows = (await call(client.rpc("lspd_iaa_people"))) || [];
    S.people = new Map(rows.map((row) => [row.user_id, row]));
    return rows;
  },
  posts: () => call(client.from(TB.posts).select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(60)),
  tasks: async () => (await call(client.from(TB.tasks).select("*, lspd_iaa_task_assignees(user_id)").order("created_at", { ascending: false }).limit(500)))
    .map((task) => ({ ...task, assignees: (task.lspd_iaa_task_assignees || []).map((row) => row.user_id) })),
  cases: () => call(client.from(TB.cases).select("*").order("updated_at", { ascending: false }).limit(500)),
  events: async () => (await call(client.from(TB.events).select("*, lspd_iaa_attendance(user_id,status)").order("starts_at").limit(500)))
    .map((event) => ({ ...event, attendance: event.lspd_iaa_attendance || [] })),
  messages: () => call(client.from(TB.messages).select("*").order("created_at", { ascending: false }).limit(300)),
  notifications: () => call(client.from(TB.notifications).select("*").order("created_at", { ascending: false }).limit(100)),
  regulations: () => call(client.from(TB.regulations).select("*").order("category").order("position").order("title")),
  records: () => call(client.from(TB.records).select("*").order("effective_date", { ascending: false }).order("created_at", { ascending: false }).limit(600)),
  economy: () => call(client.from(TB.economy).select("*").maybeSingle()),
  mywallet: () => call(client.from(TB.wallets).select("balance").eq("user_id", uid()).maybeSingle()),
  wallets: () => call(client.from(TB.wallets).select("*").order("balance", { ascending: false })),
  ledger: () => call(client.from(TB.ledger).select("*").order("created_at", { ascending: false }).limit(500)),
  payouts: () => call(client.from(TB.payouts).select("*").order("created_at", { ascending: false }).limit(200)),
  leaderboard: () => call(client.rpc("lspd_iaa_eco_leaderboard")),
  audit: () => call(client.from(TB.audit).select("id,action,target,actor_email,actor_role,source,details,created_at").eq("event_type", "iaa").order("created_at", { ascending: false }).limit(400))
};

async function need(...names) {
  const due = names.filter((name) => !S.data[name] || Date.now() - (S.at[name] || 0) > 30000);
  await Promise.all(due.map(async (name) => { S.data[name] = await LOADERS[name](); S.at[name] = Date.now(); }));
}
const reload = (...names) => { for (const name of names) delete S.data[name]; return need(...names); };
const log = (action, target = "", details = {}) => client.rpc("lspd_iaa_log", { p_action: action, p_target: target, p_details: details }).then(() => {}, () => {});

// ---------------------------------------------------------------- shell
const VIEWS = ["dashboard", "tasks", "cases", "archives", "schedule", "inbox", "wallet", "personnel", "records", "regulations", "admin"];
const NAV_ICONS = { dashboard: "hub", tasks: "check", cases: "lock", archives: "archives", schedule: "clock", inbox: "mail", wallet: "wallet", personnel: "users", records: "file", regulations: "regulations", admin: "user-shield" };

export async function mount(element, helpers) {
  C = helpers;
  root = element;
  client = await C.sdk();
  root.innerHTML = `
    <header class="iaa-head">
      <div class="iaa-emblem" aria-hidden="true">${icon("shield")}</div>
      <div class="iaa-head-text"><p class="kicker" id="iaaKicker"></p><h1 id="iaaTitle"></h1></div>
      <form class="search iaa-search" data-form="search" role="search">${icon("search")}<input id="iaaSearch" type="search" autocomplete="off" name="q"></form>
      <div class="iaa-me" id="iaaMe"></div>
    </header>
    <div class="iaa-body">
      <nav class="iaa-nav" id="iaaNav" aria-label="IAA"></nav>
      <section class="iaa-main" id="iaaMain" aria-live="polite"></section>
    </div>`;
  dialog = document.createElement("dialog");
  dialog.className = "dialog dialog-wide glass-strong iaa-dialog";
  dialog.id = "iaaDialog";
  document.body.append(dialog);
  for (const scope of [root, dialog]) {
    scope.addEventListener("click", onClick);
    scope.addEventListener("submit", onSubmit);
    scope.addEventListener("input", onInput);
    scope.addEventListener("change", onChange);
  }
  log("iaa.open");
}

/** Shows a part of the IAA section; path = ["tasks", "<id>"]. */
export async function show(path) {
  const [view = "dashboard", id = ""] = path;
  if (level() < 1) {
    $("#iaaMain").innerHTML = `<div class="empty">${esc(me().missing ? L("setup") : L("noAccess"))}</div>`;
    return;
  }
  S.view = view === "search" || VIEWS.includes(view) ? view : "dashboard";
  if (S.view === "admin" && !chief()) S.view = "dashboard";
  S.id = view === "search" ? "" : decodeURIComponent(id || "");
  if (view === "search") S.query = decodeURIComponent(id || "");
  paintChrome();
  await render();
}

/** Clears cached data, e.g. after a sign-in change. */
export function reset() { S.data = {}; S.at = {}; }

function paintChrome() {
  $("#iaaKicker").textContent = L("brand");
  $("#iaaTitle").textContent = L("nav." + S.view);
  $("#iaaSearch").placeholder = L("searchHint");
  if (S.view === "search") $("#iaaSearch").value = S.query;
  paintMe();
  $("#iaaNav").innerHTML = VIEWS.filter((view) => view !== "admin" || chief())
    .map((view) => `<a class="iaa-nav-item" href="#/iaa/${view}"${view === S.view ? ' aria-current="page"' : ""}>${icon(NAV_ICONS[view])}<span>${esc(L("nav." + view))}</span><b class="tab-count" data-badge="${view}" hidden></b></a>`).join("");
  updateBadges();
}

function paintMe() {
  const mine = me();
  const self = person(uid());
  const wallet = S.data.mywallet === undefined ? "" : `<a class="iaa-balance" href="#/iaa/wallet" title="${esc(L("balance"))}">${icon("wallet")}${esc(money(S.data.mywallet?.balance))}</a>`;
  $("#iaaMe").innerHTML = `${avatar(uid())}<span><b>${esc(self.name !== L("unknown") ? self.name : C.me()?.name || "")}</b><small>${esc(L("ranks." + mine.rank))} · ${esc(L("clearance"))} ${mine.clearance >= 3 ? 3 : mine.clearance}</small></span>${wallet}`;
}

function updateBadges() {
  const tasks = S.data.tasks;
  const mineOpen = tasks ? tasks.filter((task) => task.assignees.includes(uid()) && OPEN.includes(task.status)).length : 0;
  const review = tasks && leader() ? tasks.filter((task) => task.status === "submitted").length : 0;
  const unread = (S.data.messages || []).filter((message) => message.recipient_id === uid() && !message.read_at).length + (S.data.notifications || []).filter((note) => !note.read_at).length;
  const set = (view, count) => { const badge = $(`[data-badge="${view}"]`, root); if (badge) { badge.hidden = !count; badge.textContent = count > 99 ? "99+" : String(count); } };
  set("tasks", mineOpen + review);
  set("inbox", unread);
  C.onCounts?.();
}

async function render() {
  const token = ++renderToken;
  const main = $("#iaaMain");
  main.innerHTML = `<div class="stack">${'<div class="skeleton"></div>'.repeat(4)}</div>`;
  try {
    await need("people", "economy", "mywallet");
    paintMe();
    const html = await RENDER[S.view]();
    if (token !== renderToken) return;
    main.innerHTML = html;
    main.classList.remove("enter");
    void main.offsetWidth;
    main.classList.add("enter");
    updateBadges();
    if (S.view === "tasks" && S.id) openTask(S.id);
    if (S.view === "inbox" && S.id) openMessage(S.id);
  } catch (error) {
    if (token !== renderToken) return;
    console.warn(error);
    main.innerHTML = `<div class="empty">${esc(missingSetup(error) ? L("setup") : error.message || String(error))}</div>`;
  }
}
const rerender = () => render();

// ---------------------------------------------------------------- shared pieces
function avatar(id, extra = "") {
  const who = person(id);
  return `<span class="iaa-avatar ${extra}" title="${esc(who.name)}">${who.avatar ? `<img src="${esc(who.avatar)}" alt="" referrerpolicy="no-referrer">` : esc(initials(who.name))}</span>`;
}
const rankChip = (rank) => `<span class="iaa-rank rank-${esc(rank)}">${esc(L("ranks." + rank))}</span>`;
const statusChip = (task) => `<span class="iaa-chip st-${statusOf(task)}">${esc(L("statuses." + statusOf(task)))}</span>`;
const prioChip = (priority) => `<span class="iaa-chip pr-${esc(priority)}">${esc(L("priorities." + priority))}</span>`;
const classChip = (value) => `<span class="iaa-chip cl-${Number(value)}">${icon("lock")}${esc(L("levels." + value))}</span>`;
const caseChip = (status) => `<span class="iaa-chip cs-${esc(status)}">${esc(L("caseStatuses." + status))}</span>`;
const empty = (text = L("none")) => `<div class="empty">${esc(text)}</div>`;
const text = (value) => `<p class="iaa-text" dir="auto">${esc(value)}</p>`;
const chips = (name, options, current) => `<div class="subtabs">${Object.entries(options).map(([key, label]) => `<button class="chip-btn" type="button" data-x="filter" data-name="${name}" data-value="${esc(key)}" aria-selected="${current === key}">${esc(label)}</button>`).join("")}</div>`;
const fileList = (files) => (files?.length ? `<div class="iaa-files">${files.map((file) => `<button class="iaa-file" type="button" data-x="file" data-path="${esc(file.path)}" data-name="${esc(file.name)}">${icon("file")}<span>${esc(file.name)}</span><small>${esc(bytes(file.size || 0))}</small></button>`).join("")}</div>` : "");
const panel = (title, body, tools = "") => `<section class="panel iaa-panel"><header class="iaa-panel-head"><h2 class="panel-title">${esc(title)}</h2>${tools}</header>${body}</section>`;
const btn = (label, x, attrs = "", style = "btn") => `<button class="${style}" type="button" data-x="${x}" ${attrs}>${label}</button>`;
const field = (label, control, wide = "") => `<label class="field ${wide}"><span>${esc(label)}</span>${control}</label>`;
const options = (entries, current) => entries.map(([value, label]) => `<option value="${esc(value)}"${String(value) === String(current ?? "") ? " selected" : ""}>${esc(label)}</option>`).join("");
const peopleOptions = (current, blank = "") => (blank ? `<option value="">${esc(blank)}</option>` : "") + options([...S.people.values()].filter((who) => who.active).sort((a, b) => LEVEL[b.rank] - LEVEL[a.rank] || a.name.localeCompare(b.name)).map((who) => [who.user_id, `${who.name} · ${L("ranks." + who.rank)}`]), current);

function openDialog(html) {
  dialog.innerHTML = html;
  if (!dialog.open) dialog.showModal();
}
const closeDialog = () => { if (dialog.open) dialog.close(); };
const dialogHead = (title, kicker = "") => `<header class="dialog-head"><div>${kicker ? `<p class="kicker">${kicker}</p>` : ""}<h2 dir="auto">${esc(title)}</h2></div><button class="icon-btn" type="button" data-close aria-label="${esc(L("close"))}">${icon("x")}</button></header>`;

async function uploadFiles(prefix, input) {
  const files = [...(input?.files || [])].slice(0, 10);
  for (const file of files) if (file.size > MAX_FILE) throw new Error(L("tooBig", { name: file.name }));
  const out = [];
  for (const file of files) {
    const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "").slice(-60) || "file";
    const path = `${prefix}/${crypto.randomUUID()}-${safe}`;
    const { error } = await client.storage.from(BUCKET).upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) throw error;
    out.push({ path, name: file.name.slice(0, 120), type: file.type, size: file.size });
  }
  return out;
}

async function openFile(path, name) {
  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, 120);
  if (error) return C.fail(error);
  log("iaa.file.open", name, { path });
  window.open(data.signedUrl, "_blank", "noopener");
}

async function busy(button, task) {
  if (button?.classList.contains("is-busy")) return;
  button?.classList.add("is-busy");
  try { await task(); } catch (error) { C.fail(error); } finally { button?.classList.remove("is-busy"); }
}

// ---------------------------------------------------------------- views
const RENDER = {
  async dashboard() {
    await need("posts", "tasks", "events", "messages", "notifications");
    const tasks = S.data.tasks;
    const mine = tasks.filter((task) => task.assignees.includes(uid()) && OPEN.concat("submitted").includes(task.status));
    const overdue = mine.filter(isOverdue);
    const unread = S.data.messages.filter((message) => message.recipient_id === uid() && !message.read_at).length;
    const upcoming = S.data.events.filter((event) => new Date(event.ends_at || event.starts_at) > new Date());
    const next = upcoming[0];
    const tile = (iconName, value, label, href, tone = "") => `<a class="tile iaa-tile ${tone}" href="${href}"><span class="tile-icon">${icon(iconName)}</span><span class="tile-text"><b>${esc(value)}</b><strong>${esc(label)}</strong></span></a>`;
    const deadlines = mine.slice().sort((a, b) => (a.deadline ? new Date(a.deadline) : Infinity) - (b.deadline ? new Date(b.deadline) : Infinity)).slice(0, 6);
    const review = leader() ? tasks.filter((task) => task.status === "submitted").slice(0, 6) : [];
    const notes = S.data.notifications.filter((note) => !note.read_at).slice(0, 6);
    return `
      <p class="iaa-welcome">${esc(L("welcome", { name: person(uid()).name }))}</p>
      <div class="tiles iaa-tiles">
        ${tile("check", mine.length, L("openTasks"), "#/iaa/tasks")}
        ${tile("warn", overdue.length, L("overdue"), "#/iaa/tasks", overdue.length ? "is-hot" : "")}
        ${tile("mail", unread, L("unreadMessages"), "#/iaa/inbox")}
        ${tile("wallet", money(S.data.mywallet?.balance), L("balance"), "#/iaa/wallet")}
        ${tile("clock", next ? new Date(next.starts_at).toLocaleDateString(C.locale(), { day: "numeric", month: "short" }) : "–", next ? next.title : L("noneScheduled"), "#/iaa/schedule")}
      </div>
      <div class="iaa-grid-2">
        <div class="stack">
          ${panel(L("board"), (leader() ? postForm() : "") + (S.data.posts.length ? S.data.posts.map(postCard).join("") : empty()))}
        </div>
        <div class="stack">
          ${review.length ? panel(L("awaitingReview"), review.map(taskRow).join("")) : ""}
          ${panel(L("myDeadlines"), deadlines.length ? deadlines.map(taskRow).join("") : empty())}
          ${panel(L("upcoming"), upcoming.length ? upcoming.slice(0, 4).map(eventRow).join("") : empty())}
          ${panel(L("notifications"), notes.length ? notes.map(noteRow).join("") : empty(), notes.length ? btn(esc(L("markAllRead")), "notes-read", "", "link-btn") : "")}
        </div>
      </div>`;
  },

  async tasks() {
    await need("tasks", "cases");
    const f = S.filter;
    const query = f.taskQuery.toLowerCase();
    const scope = leader() ? f.scope : "mine";
    const list = S.data.tasks.filter((task) => {
      if (scope === "mine" && !task.assignees.includes(uid())) return false;
      if (f.tasks === "open" && !OPEN.concat("submitted").includes(task.status)) return false;
      if (f.tasks === "overdue" && !isOverdue(task)) return false;
      if (["submitted", "completed", "rejected"].includes(f.tasks) && task.status !== f.tasks) return false;
      return !query || `${task.title} ${task.description} ${task.assignees.map((id) => person(id).name).join(" ")}`.toLowerCase().includes(query);
    }).sort((a, b) => (isOverdue(b) - isOverdue(a)) || (a.deadline ? new Date(a.deadline) : Infinity) - (b.deadline ? new Date(b.deadline) : Infinity));
    return `
      <div class="iaa-toolbar">
        ${chips("tasks", L("taskFilters"), f.tasks)}
        <div class="tools">
          ${leader() ? chips("scope", { mine: L("mine"), all: L("everyone") }, f.scope) : ""}
          <label class="search">${icon("search")}<input data-filter="taskQuery" type="search" value="${esc(f.taskQuery)}" placeholder="${esc(L("nav.search"))}"></label>
          ${leader() ? btn(`${icon("plus")}<span>${esc(L("newTask"))}</span>`, "task-new", "", "btn btn-red") : ""}
        </div>
      </div>
      ${list.length ? `<div class="iaa-task-grid">${list.map(taskCard).join("")}</div>` : empty()}`;
  },

  async cases() {
    await need("cases", "tasks");
    if (S.id) return caseDetail(S.id);
    const f = S.filter;
    const query = f.caseQuery.toLowerCase();
    const list = S.data.cases.filter((row) => (f.cases === "all" || (f.cases === "live" ? ["open", "active"] : ["closed", "archived"]).includes(row.status))
      && (!query || `${row.case_number} ${row.title} ${person(row.lead_id).name}`.toLowerCase().includes(query)));
    return `
      <div class="iaa-toolbar">
        ${chips("cases", L("caseFilters"), f.cases)}
        <div class="tools">
          <label class="search">${icon("search")}<input data-filter="caseQuery" type="search" value="${esc(f.caseQuery)}" placeholder="${esc(L("nav.search"))}"></label>
          ${chief() ? btn(`${icon("plus")}<span>${esc(L("newCase"))}</span>`, "case-new", "", "btn btn-red") : ""}
        </div>
      </div>
      ${list.length ? caseTable(list) : empty()}`;
  },

  async archives() {
    await need("cases", "tasks", "events");
    const f = S.filter.archive;
    let body;
    if (f === "cases") { const rows = S.data.cases.filter((row) => ["closed", "archived"].includes(row.status)); body = rows.length ? caseTable(rows) : empty(); }
    else if (f === "tasks") { const rows = S.data.tasks.filter(closedTask); body = rows.length ? `<div class="iaa-task-grid">${rows.map(taskCard).join("")}</div>` : empty(); }
    else { const rows = S.data.events.filter((event) => new Date(event.ends_at || event.starts_at) < new Date()).reverse(); body = rows.length ? rows.map(eventCard).join("") : empty(); }
    return `<div class="iaa-toolbar">${chips("archive", L("archives"), f)}</div>${body}`;
  },

  async schedule() {
    await need("events");
    const now = new Date();
    const upcoming = S.data.events.filter((event) => new Date(event.ends_at || event.starts_at) >= now);
    let day = "";
    const list = upcoming.map((event) => {
      const label = dayLabel(event.starts_at);
      const head = label !== day ? `<p class="log-day">${esc(label)}</p>` : "";
      day = label;
      return head + eventCard(event);
    }).join("");
    return `
      <div class="iaa-toolbar"><span></span><div class="tools">${leader() ? btn(`${icon("plus")}<span>${esc(L("newEvent"))}</span>`, "event-new", "", "btn btn-red") : ""}${btn(`${icon("archives")}<span>${esc(L("past"))}</span>`, "go", 'data-href="#/iaa/archives" data-archive="events"')}</div></div>
      ${list || empty(L("noneScheduled"))}`;
  },

  async inbox() {
    await need("messages", "notifications");
    const f = S.filter.inbox;
    let body;
    if (f === "notes") {
      body = S.data.notifications.length ? `<div class="stack">${S.data.notifications.map(noteRow).join("")}</div>` : empty();
    } else {
      const rows = S.data.messages.filter((message) => (f === "in" ? message.recipient_id === uid() : message.sender_id === uid()));
      body = rows.length ? `<div class="stack">${rows.map((message) => {
        const other = f === "in" ? message.sender_id : message.recipient_id;
        return `<button class="iaa-row${f === "in" && !message.read_at ? " unread" : ""}" type="button" data-x="message" data-id="${esc(message.id)}">${avatar(other)}<span class="iaa-row-main"><b dir="auto">${esc(message.subject)}</b><small dir="auto">${esc(nameOf(other))} · ${esc(String(message.body).slice(0, 90))}</small></span>${when(message.created_at)}</button>`;
      }).join("")}</div>` : empty();
    }
    return `
      <div class="iaa-toolbar">${chips("inbox", L("inboxTabs"), f)}<div class="tools">
        ${f === "notes" ? btn(esc(L("markAllRead")), "notes-read") : ""}
        ${btn(`${icon("send")}<span>${esc(L("compose"))}</span>`, "compose", "", "btn btn-red")}</div></div>
      ${body}`;
  },

  async wallet() {
    const treasury = S.id === "treasury" && chief();
    await need("economy", "mywallet", "ledger", "payouts", "leaderboard", ...(treasury ? ["wallets"] : []));
    const tabs = chief() ? `<div class="subtabs"><a class="chip-btn" href="#/iaa/wallet" aria-selected="${!treasury}">${icon("wallet")}<span>${esc(L("myWallet"))}</span></a><a class="chip-btn" href="#/iaa/wallet/treasury" aria-selected="${treasury}">${icon("coins")}<span>${esc(L("treasury"))}</span></a></div>` : "<span></span>";
    return `<div class="iaa-toolbar">${tabs}<div class="tools">${treasury ? "" : btn(`${icon("send")}<span>${esc(L("sendMoney"))}</span>`, "money-send", "", "btn") + btn(`${icon("upload")}<span>${esc(L("requestPayout"))}</span>`, "money-payout", "", "btn")}</div></div>${treasury ? treasuryHtml() : walletHtml()}`;
  },

  async personnel() {
    if (leader()) await need("tasks", "events");
    const query = S.filter.personQuery.toLowerCase();
    const rows = [...S.people.values()].filter((who) => !query || `${who.name} ${who.position} ${who.callsign}`.toLowerCase().includes(query))
      .sort((a, b) => (b.active - a.active) || LEVEL[b.rank] - LEVEL[a.rank] || a.name.localeCompare(b.name));
    return `
      <div class="iaa-toolbar"><span class="pill">${esc(String(rows.filter((who) => who.active).length))} ${esc(L("active"))}</span><div class="tools">
        <label class="search">${icon("search")}<input data-filter="personQuery" type="search" value="${esc(S.filter.personQuery)}" placeholder="${esc(L("nav.search"))}"></label>
        ${leader() ? btn(`${icon("user-plus")}<span>${esc(L("addMember"))}</span>`, "member-new", "", "btn btn-red") : ""}</div></div>
      <div class="table-wrap glass"><table class="table iaa-table"><thead><tr><th>${esc(L("member"))}</th><th>${esc(L("callsign"))}</th><th>${esc(L("rank"))}</th><th>${esc(L("position"))}</th><th>${esc(L("clearance"))}</th><th>${esc(L("joined"))}</th><th></th></tr></thead><tbody>
      ${rows.map((who) => `<tr class="${who.active ? "" : "is-inactive"}">
        <td><button class="iaa-person" type="button" data-x="profile" data-id="${esc(who.user_id)}">${avatar(who.user_id)}<b>${esc(who.name)}</b></button></td>
        <td><code>${esc(who.callsign || "–")}</code></td><td>${rankChip(who.rank)}</td><td dir="auto">${esc(who.position || "–")}</td>
        <td><span class="iaa-clearance" title="${esc(L("levels." + who.clearance))}">${[1, 2, 3].map((n) => `<i class="${n <= who.clearance ? "on" : ""}"></i>`).join("")}</span></td>
        <td>${esc(who.joined_at ? C.fmtDate(who.joined_at) : "–")}${who.active ? "" : ` · <span class="muted">${esc(L("inactive"))}</span>`}</td>
        <td>${who.member_id && LEVEL[who.rank] < level() && who.user_id !== uid() ? `<button class="icon-btn" type="button" data-x="member-edit" data-id="${esc(who.user_id)}" title="${esc(L("edit"))}">${icon("edit")}</button>` : ""}</td>
      </tr>`).join("")}</tbody></table></div>`;
  },

  async records() {
    await need("records");
    const f = S.filter;
    const rows = S.data.records.filter((row) => (f.recKind === "all" || row.kind === f.recKind) && (!f.recUser || row.user_id === f.recUser));
    return `
      <div class="iaa-toolbar">${chips("recKind", { all: L("all"), ...L("recordKinds") }, f.recKind)}<div class="tools">
        ${leader() ? `<label class="select-wrap"><select data-filter="recUser">${peopleOptions(f.recUser, L("everyoneFilter"))}</select></label>` : ""}
        ${leader() ? btn(`${icon("plus")}<span>${esc(L("newRecord"))}</span>`, "record-new", "", "btn btn-red") : ""}</div></div>
      ${rows.length ? `<div class="iaa-timeline">${rows.map(recordRow).join("")}</div>` : empty()}`;
  },

  async regulations() {
    await need("regulations");
    const f = S.filter;
    const query = f.regQuery.toLowerCase();
    const rows = S.data.regulations.filter((row) => (query ? `${row.code} ${row.title} ${row.body}`.toLowerCase().includes(query) : row.category === f.reg));
    return `
      <div class="iaa-toolbar">${chips("reg", L("regCats"), query ? "" : f.reg)}<div class="tools">
        <label class="search">${icon("search")}<input data-filter="regQuery" type="search" value="${esc(f.regQuery)}" placeholder="${esc(L("nav.search"))}"></label>
        ${chief() ? btn(`${icon("plus")}<span>${esc(L("newRegulation"))}</span>`, "reg-new", "", "btn btn-red") : ""}</div></div>
      ${rows.length ? `<div class="stack">${rows.map((row) => `<details class="reg iaa-reg"><summary><span class="reg-code">${esc(row.code || L("regCats." + row.category))}</span><span class="reg-title" dir="auto">${esc(row.title)}</span>${icon("chevron")}</summary>
        <div class="reg-body">${text(row.body)}<p class="muted iaa-meta">${esc(L("updated"))} ${when(row.updated_at)}</p>${chief() ? `<div class="card-tools">${btn(icon("edit"), "reg-edit", `data-id="${esc(row.id)}" title="${esc(L("edit"))}"`, "icon-btn")}${btn(icon("trash"), "reg-delete", `data-id="${esc(row.id)}" title="${esc(L("remove"))}"`, "icon-btn danger")}</div>` : ""}</div></details>`).join("")}</div>` : empty()}`;
  },

  async admin() {
    await need("tasks", "cases", "audit");
    const people = [...S.people.values()];
    const count = (list, test) => list.filter(test).length;
    const query = S.filter.logQuery.toLowerCase();
    const logs = S.data.audit.filter((row) => !query || `${row.action} ${row.target} ${row.actor_email} ${row.actor_role}`.toLowerCase().includes(query)).slice(0, 200);
    const overview = `<div class="grid grid-4">
      ${[[L("ranks.chief"), count(people, (who) => who.rank === "chief" && who.active)], [L("ranks.deputy"), count(people, (who) => who.rank === "deputy" && who.active)], [L("ranks.member"), count(people, (who) => who.rank === "member" && who.active)], [L("inactive"), count(people, (who) => !who.active)],
        [L("taskFilters.open"), count(S.data.tasks, (task) => OPEN.includes(task.status))], [L("statuses.overdue"), count(S.data.tasks, isOverdue)], [L("statuses.submitted"), count(S.data.tasks, (task) => task.status === "submitted")], [L("caseFilters.live"), count(S.data.cases, (row) => ["open", "active"].includes(row.status))]]
        .map(([label, value]) => `<div class="card metric"><b>${esc(value)}</b><span>${esc(label)}</span></div>`).join("")}</div>`;
    const matrix = `<div class="table-wrap"><table class="table iaa-table iaa-matrix"><thead><tr><th></th>${["member", "deputy", "chief", "owner"].map((rank) => `<th>${esc(L("ranks." + rank))}</th>`).join("")}</tr></thead><tbody>
      ${L("capabilities").map(([label, min]) => `<tr><td dir="auto">${esc(label)}</td>${[1, 2, 3, 4].map((n) => `<td>${n >= min ? `<span class="iaa-yes">${icon("check")}</span>` : `<span class="muted">–</span>`}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    const activity = `<p class="muted">${esc(L("activityHint"))}</p>
      <div class="iaa-toolbar"><label class="search">${icon("search")}<input data-filter="logQuery" type="search" value="${esc(S.filter.logQuery)}" placeholder="${esc(L("nav.search"))}"></label>${btn(`${icon("refresh")}<span>${esc(L("refresh"))}</span>`, "audit-refresh")}</div>
      <div class="table-wrap"><table class="table iaa-table"><tbody>${logs.map((row) => `<tr><td><code>${esc(row.action)}</code></td><td dir="auto">${esc(String(row.target || "").slice(0, 60))}</td><td>${esc(row.actor_email || "system")}</td><td>${row.actor_role ? `<span class="role-chip">${esc(row.actor_role)}</span>` : ""}</td><td>${when(row.created_at)}</td></tr>`).join("") || `<tr><td>${esc(L("none"))}</td></tr>`}</tbody></table></div>`;
    return `${panel(L("overview"), overview)}${panel(L("permissions"), matrix)}${panel(L("activity"), activity)}`;
  },

  async search() {
    const q = S.query.trim();
    if (q.length < 2) return empty(L("searchHint"));
    await need("tasks", "cases", "regulations", "events", "records");
    const has = (...values) => values.join(" ").toLowerCase().includes(q.toLowerCase());
    const safe = q.replace(/[%,()*]/g, " ").trim();
    const files = await call(client.from(TB.entries).select("id,case_id,kind,title,created_at").or(`title.ilike.%${safe}%,body.ilike.%${safe}%`).limit(20)).catch(() => []);
    const groups = {
      people: [...S.people.values()].filter((who) => has(who.name, who.position, who.callsign)).map((who) => `<button class="iaa-row" type="button" data-x="profile" data-id="${esc(who.user_id)}">${avatar(who.user_id)}<span class="iaa-row-main"><b>${esc(who.name)}</b><small>${esc(L("ranks." + who.rank))} · ${esc(who.position)}</small></span></button>`),
      tasks: S.data.tasks.filter((task) => has(task.title, task.description, task.requirements)).map(taskRow),
      cases: S.data.cases.filter((row) => has(row.case_number, row.title, row.summary)).map((row) => `<a class="iaa-row" href="#/iaa/cases/${esc(row.id)}">${classChip(row.classification)}<span class="iaa-row-main"><b dir="auto">${esc(row.case_number)} · ${esc(row.title)}</b><small>${esc(L("caseStatuses." + row.status))}</small></span>${when(row.updated_at)}</a>`),
      files: files.map((row) => `<a class="iaa-row" href="#/iaa/cases/${esc(row.case_id)}">${icon("file")}<span class="iaa-row-main"><b dir="auto">${esc(row.title)}</b><small>${esc(L("entryKinds." + row.kind))}</small></span>${when(row.created_at)}</a>`),
      regulations: S.data.regulations.filter((row) => has(row.code, row.title, row.body)).map((row) => `<button class="iaa-row" type="button" data-x="go" data-href="#/iaa/regulations" data-reg="${esc(row.title)}">${icon("regulations")}<span class="iaa-row-main"><b dir="auto">${esc(row.title)}</b><small>${esc(L("regCats." + row.category))}</small></span></button>`),
      records: S.data.records.filter((row) => has(row.title, row.details, person(row.user_id).name)).map(recordRow),
      events: S.data.events.filter((event) => has(event.title, event.description, event.location)).map(eventRow)
    };
    const total = Object.values(groups).reduce((sum, list) => sum + list.length, 0);
    return `<p class="sop-count">${esc(L("results", { n: total, q }))}</p>` + (total ? Object.entries(groups).filter(([, list]) => list.length).map(([key, list]) => panel(L("searchTypes." + key), `<div class="stack">${list.slice(0, 25).join("")}</div>`)).join("") : empty(L("noResults")));
  }
};

// ---------------------------------------------------------------- rows and cards
const postForm = () => `<details class="composer"><summary>${icon("plus")}<span>${esc(L("newPost"))}</span></summary>
  <form class="form-grid" data-form="post">
    ${field(L("title"), `<input name="title" required maxlength="160" dir="auto">`, "wide")}
    ${field(L("kind"), `<select name="kind">${options(Object.entries(L("postKinds")), "announcement")}</select>`)}
    ${field(L("body"), `<textarea name="body" maxlength="6000" dir="auto"></textarea>`, "full")}
    <label class="check"><input type="checkbox" name="pinned"><span>${esc(L("pin"))}</span></label>
    <div class="form-actions"><button class="btn btn-red" type="submit">${icon("send")}<span>${esc(L("send"))}</span></button></div>
  </form></details>`;

const postCard = (post) => `<article class="iaa-post kind-${esc(post.kind)}">
  <header><span class="iaa-chip pk-${esc(post.kind)}">${esc(L("postKinds." + post.kind))}</span>${post.pinned ? `<span class="iaa-pin">${icon("bolt")}${esc(L("pinned"))}</span>` : ""}<span class="iaa-by">${avatar(post.created_by, "sm")}${esc(person(post.created_by).name)} · ${when(post.created_at)}</span>
  ${leader() ? btn(icon("trash"), "post-delete", `data-id="${esc(post.id)}" title="${esc(L("remove"))}"`, "icon-btn danger") : ""}</header>
  <h3 dir="auto">${esc(post.title)}</h3>${post.body ? text(post.body) : ""}</article>`;

const taskRow = (task) => `<button class="iaa-row" type="button" data-x="task" data-id="${esc(task.id)}">${prioChip(task.priority)}<span class="iaa-row-main"><b dir="auto">${esc(task.title)}</b><small>${task.deadline ? esc(L("deadline")) + " " + esc(rel(task.deadline)) : esc(L("noDeadline"))}</small></span>${statusChip(task)}</button>`;

const taskCard = (task) => `<article class="iaa-task pr-${esc(task.priority)}${isOverdue(task) ? " is-overdue" : ""}" data-x="task" data-id="${esc(task.id)}" tabindex="0">
  <header>${prioChip(task.priority)}${statusChip(task)}</header>
  <h3 dir="auto">${esc(task.title)}</h3>
  ${task.description ? `<p class="iaa-excerpt" dir="auto">${esc(task.description.slice(0, 140))}${task.description.length > 140 ? "…" : ""}</p>` : ""}
  <div class="iaa-progress" title="${task.progress}%"><i style="width:${Number(task.progress) || 0}%"></i></div>
  <footer><span class="iaa-due">${icon("clock")}${task.deadline ? when(task.deadline) : esc(L("noDeadline"))}</span>${task.reward > 0 ? `<span class="iaa-reward${task.reward_paid ? " is-paid" : ""}">${icon("coins")}${esc(money(task.reward))}</span>` : ""}<span class="iaa-avatars">${task.assignees.slice(0, 5).map((id) => avatar(id, "sm")).join("")}${task.assignees.length > 5 ? `<span class="iaa-avatar sm">+${task.assignees.length - 5}</span>` : ""}</span></footer>
</article>`;

const caseTable = (rows) => `<div class="table-wrap glass"><table class="table iaa-table"><thead><tr><th>#</th><th>${esc(L("title"))}</th><th>${esc(L("classification"))}</th><th>${esc(L("kind"))}</th><th>${esc(L("lead"))}</th><th>${esc(L("updated"))}</th></tr></thead><tbody>
  ${rows.map((row) => `<tr class="iaa-click" data-x="go" data-href="#/iaa/cases/${esc(row.id)}"><td><code>${esc(row.case_number)}</code></td><td class="name" dir="auto">${esc(row.title)}</td><td>${classChip(row.classification)}</td><td>${caseChip(row.status)}</td><td>${row.lead_id ? `${avatar(row.lead_id, "sm")} ${esc(person(row.lead_id).name)}` : `<span class="muted">${esc(L("noLead"))}</span>`}</td><td>${when(row.updated_at)}</td></tr>`).join("")}</tbody></table></div>`;

function dayLabel(value) {
  const date = new Date(value);
  const days = Math.round((new Date(date.toDateString()) - new Date(new Date().toDateString())) / 86400000);
  return days === 0 ? L("today") : days === 1 ? L("tomorrow") : date.toLocaleDateString(C.locale(), { weekday: "long", day: "numeric", month: "long" });
}
const timeOf = (value) => new Date(value).toLocaleTimeString(C.locale(), { hour: "2-digit", minute: "2-digit" });

const eventRow = (event) => `<button class="iaa-row" type="button" data-x="go" data-href="#/iaa/schedule">${icon(event.kind === "operation" ? "bolt" : event.kind === "training" ? "fto" : "clock")}<span class="iaa-row-main"><b dir="auto">${esc(event.title)}</b><small>${esc(L("eventKinds." + event.kind))} · ${esc(dayLabel(event.starts_at))} ${esc(timeOf(event.starts_at))}</small></span></button>`;

function eventCard(event) {
  const mine = event.attendance.find((row) => row.user_id === uid())?.status || "";
  const tally = (status) => event.attendance.filter((row) => row.status === status).length;
  const past = new Date(event.ends_at || event.starts_at) < new Date();
  return `<article class="iaa-event ek-${esc(event.kind)}">
    <div class="iaa-event-time"><b>${esc(timeOf(event.starts_at))}</b>${event.ends_at ? `<small>${esc(timeOf(event.ends_at))}</small>` : ""}</div>
    <div class="iaa-event-main">
      <header><span class="iaa-chip ek">${esc(L("eventKinds." + event.kind))}</span><h3 dir="auto">${esc(event.title)}</h3></header>
      ${event.location ? `<p class="muted">${icon("pin")} ${esc(event.location)}</p>` : ""}
      ${event.description ? text(event.description) : ""}
      <p class="muted iaa-meta">${esc(L("responses", { going: tally("going") + tally("present"), maybe: tally("maybe"), absent: tally("absent") + tally("missed") }))}</p>
      <div class="iaa-event-actions">
        ${past ? "" : `<div class="subtabs">${Object.entries(L("rsvp")).map(([key, label]) => `<button class="chip-btn" type="button" data-x="rsvp" data-id="${esc(event.id)}" data-status="${key}" aria-selected="${mine === key}">${esc(label)}</button>`).join("")}</div>`}
        ${leader() ? `<div class="tools">${btn(`${icon("users")}<span>${esc(L("attendance"))}</span>`, "attendance", `data-id="${esc(event.id)}"`, "btn btn-sm")}${btn(icon("edit"), "event-edit", `data-id="${esc(event.id)}" title="${esc(L("edit"))}"`, "icon-btn")}${btn(icon("trash"), "event-delete", `data-id="${esc(event.id)}" title="${esc(L("remove"))}"`, "icon-btn danger")}</div>` : ""}
      </div>
    </div>
  </article>`;
}

const noteRow = (note) => `<button class="iaa-row${note.read_at ? "" : " unread"}" type="button" data-x="note" data-id="${esc(note.id)}" data-href="${esc(note.link || "")}">${icon(note.kind === "message" ? "mail" : note.kind === "task" || note.kind === "review" ? "check" : note.kind === "overdue" || note.kind === "due_soon" ? "warn" : "bell")}<span class="iaa-row-main"><b dir="auto">${esc(note.title)}</b>${note.body ? `<small dir="auto">${esc(note.body)}</small>` : ""}</span>${when(note.created_at)}</button>`;

const recordRow = (row) => `<article class="iaa-record rk-${esc(row.kind)}"><span class="iaa-chip rk">${esc(L("recordKinds." + row.kind))}</span><div class="iaa-row-main"><b dir="auto">${esc(row.title)}</b><small>${avatar(row.user_id, "sm")} ${esc(person(row.user_id).name)} · ${esc(C.fmtDate(row.effective_date))}${row.created_by ? ` · ${esc(L("assignedBy"))} ${esc(person(row.created_by).name)}` : ""}</small>${row.details ? text(row.details) : ""}</div>${chief() ? btn(icon("trash"), "record-delete", `data-id="${esc(row.id)}" title="${esc(L("remove"))}"`, "icon-btn danger") : ""}</article>`;

// ---------------------------------------------------------------- wallet
const since = (days) => Date.now() - days * 86400000;
const sum = (rows) => rows.reduce((total, row) => total + Number(row.amount || 0), 0);

// One ledger line seen from a wallet (+ in, − out) or, on the treasury page, as "from → to".
function txRow(row, perspective) {
  const mine = perspective === "me";
  const incoming = mine ? row.to_user === uid() : row.to_user === null && row.kind !== "payout";
  const who = (id, fallback) => (id ? person(id).name : fallback);
  let title;
  if (row.kind === "transfer") title = mine ? (incoming ? L("fromPerson", { name: who(row.from_user) }) : L("toPerson", { name: who(row.to_user) })) : `${who(row.from_user)} → ${who(row.to_user)}`;
  else if (row.kind === "reward") title = row.note || L("ledgerKinds.reward");
  else if (row.kind === "bonus" || row.kind === "fine") title = mine ? L("byPerson", { name: who(row.created_by) }) : `${who(row.from_user || row.to_user)} · ${L("byPerson", { name: who(row.created_by) })}`;
  else if (row.kind === "payout" || row.kind === "payout_refund") title = mine ? L("ledgerKinds." + row.kind) : who(row.from_user || row.to_user);
  else title = L("treasuryWord");
  const note = row.kind === "reward" ? "" : row.note;
  const signed = mine ? (incoming ? "+" : "−") : "";
  return `<div class="iaa-tx tx-${esc(row.kind)}"><span class="iaa-tx-icon">${icon(row.kind === "reward" ? "check" : row.kind === "transfer" ? "transfer" : row.kind === "fine" ? "warn" : row.kind.startsWith("payout") ? "upload" : "coins")}</span>
    <span class="iaa-row-main"><b dir="auto">${esc(title)}</b><small dir="auto">${esc(L("ledgerKinds." + row.kind))}${note ? " · " + esc(note) : ""} · ${when(row.created_at)}</small></span>
    <b class="iaa-amount ${mine ? (incoming ? "in" : "out") : ""}">${signed}${esc(money(row.amount))}</b></div>`;
}

function walletHtml() {
  const rows = S.data.ledger.filter((row) => row.from_user === uid() || row.to_user === uid());
  const mine = S.data.payouts.filter((row) => row.user_id === uid());
  const recent = rows.filter((row) => new Date(row.created_at) > since(30));
  const stat = (label, value) => `<div class="card metric"><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
  const board = S.data.leaderboard || [];
  return `
    <section class="iaa-wallet-card">
      <div><p class="kicker">${esc(S.data.economy?.currency_name || "Money")}</p><p class="iaa-wallet-balance">${esc(money(S.data.mywallet?.balance))}</p><p class="muted">${esc(L("balance"))} · ${esc(person(uid()).name)}</p></div>
      <span class="iaa-wallet-mark" aria-hidden="true">${icon("wallet")}</span>
    </section>
    <div class="grid grid-4">
      ${stat(L("earned30"), money(sum(recent.filter((row) => row.kind === "reward" && row.to_user === uid()))))}
      ${stat(L("received"), money(sum(rows.filter((row) => row.to_user === uid() && ["transfer", "bonus"].includes(row.kind)))))}
      ${stat(L("sentTotal"), money(sum(rows.filter((row) => row.from_user === uid() && row.kind === "transfer"))))}
      ${stat(L("pendingPayouts"), money(sum(mine.filter((row) => row.status === "pending"))))}
    </div>
    <div class="iaa-grid-2">
      ${panel(L("transactions"), rows.length ? `<div class="stack">${rows.slice(0, 80).map((row) => txRow(row, "me")).join("")}</div>` : empty(L("noMoney")))}
      <div class="stack">
        ${panel(L("leaderboard"), board.length ? `<ol class="iaa-board">${board.map((row, index) => `<li><span class="iaa-board-n">${index + 1}</span>${avatar(row.user_id, "sm")}<span class="iaa-row-main"><b>${esc(person(row.user_id).name)}</b><small>${esc(L("tasksDone", { n: row.tasks }))}</small></span><b class="iaa-amount in">${esc(money(row.earned))}</b></li>`).join("")}</ol>` : empty())}
        ${panel(L("payouts"), mine.length ? `<div class="stack">${mine.map(payoutRow).join("")}</div>` : empty())}
      </div>
    </div>`;
}

const payoutRow = (row) => `<div class="iaa-tx"><span class="iaa-tx-icon">${icon("upload")}</span><span class="iaa-row-main"><b>${esc(person(row.user_id).name)} · ${esc(money(row.amount))}</b><small dir="auto">${row.note ? esc(row.note) + " · " : ""}${when(row.created_at)}${row.decision_note ? " · " + esc(row.decision_note) : ""}</small></span>
  ${row.status === "pending" && level() >= 4 ? `<span class="tools">${btn(`${icon("check")}<span>${esc(L("markPaid"))}</span>`, "payout-paid", `data-id="${esc(row.id)}"`, "btn btn-sm btn-ok")}${btn(`${icon("undo")}<span>${esc(L("refuse"))}</span>`, "payout-refuse", `data-id="${esc(row.id)}"`, "btn btn-sm btn-danger")}</span>` : `<span class="iaa-chip ps-${esc(row.status)}">${esc(L("payoutStatus." + row.status))}</span>`}</div>`;

function treasuryHtml() {
  const eco = S.data.economy || {};
  const wallets = S.data.wallets || [];
  const pending = S.data.payouts.filter((row) => row.status === "pending");
  const stat = (label, value, tone = "") => `<div class="card metric ${tone}"><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
  const owner = level() >= 4;
  return `
    <section class="iaa-wallet-card is-treasury">
      <div><p class="kicker">${esc(eco.currency_name || "Money")} · ${esc(L("treasury"))}</p><p class="iaa-wallet-balance">${esc(money(eco.treasury))}</p>
        <div class="actions">${owner ? btn(`${icon("plus")}<span>${esc(L("deposit"))}</span>`, "money-deposit", "", "btn btn-red") : ""}${btn(`${icon("coins")}<span>${esc(L("grant"))}</span>`, "money-grant", "", "btn btn-outline")}${owner ? btn(`${icon("sliders")}<span>${esc(L("currency"))}</span>`, "money-settings", "", "btn") : ""}</div></div>
      <span class="iaa-wallet-mark" aria-hidden="true">${icon("coins")}</span>
    </section>
    <div class="grid grid-4">
      ${stat(L("treasury"), money(eco.treasury))}
      ${stat(L("inCirculation"), money(wallets.reduce((total, row) => total + Number(row.balance), 0)))}
      ${stat(L("paidRewards"), money(sum(S.data.ledger.filter((row) => row.kind === "reward" && new Date(row.created_at) > since(30)))))}
      ${stat(L("pendingPayouts"), `${pending.length} · ${money(sum(pending))}`, pending.length ? "is-hot" : "")}
    </div>
    ${panel(L("payouts"), S.data.payouts.length ? `<div class="stack">${S.data.payouts.slice(0, 40).map(payoutRow).join("")}</div>` : empty())}
    <div class="iaa-grid-2">
      ${panel(L("transactions"), S.data.ledger.length ? `<div class="stack">${S.data.ledger.slice(0, 120).map((row) => txRow(row, "all")).join("")}</div>` : empty(L("noMoney")))}
      ${panel(L("wallets"), wallets.length ? `<div class="stack">${wallets.map((row) => `<div class="iaa-tx">${avatar(row.user_id, "sm")}<span class="iaa-row-main"><b>${esc(person(row.user_id).name)}</b><small>${esc(L("ranks." + person(row.user_id).rank))}</small></span><b class="iaa-amount ${row.balance < 0 ? "out" : ""}">${esc(money(row.balance))}</b>${btn(icon("coins"), "money-grant", `data-id="${esc(row.user_id)}" title="${esc(L("grant"))}"`, "icon-btn")}</div>`).join("")}</div>` : empty())}
    </div>`;
}

const amountField = () => field(`${L("amount")} (${S.data.economy?.symbol || "$"})`, `<input type="number" name="amount" required min="1" max="1000000000" step="1" inputmode="numeric">`);
const noteField = () => field(L("note"), `<input name="note" maxlength="500" dir="auto">`, "full");

function moneyForm(kind, presetUser = "") {
  const others = [...S.people.values()].filter((who) => who.active && who.user_id !== uid()).map((who) => [who.user_id, `${who.name} · ${L("ranks." + who.rank)}`]);
  const titles = { send: L("sendMoney"), payout: L("requestPayout"), deposit: L("deposit"), grant: L("grant"), settings: L("currency") };
  let body;
  if (kind === "send") body = field(L("recipient"), `<select name="to" required><option value="">—</option>${options(others, presetUser)}</select>`, "full") + amountField() + noteField();
  else if (kind === "payout") body = `<p class="full muted">${esc(L("payoutHint"))}</p>` + amountField() + noteField();
  else if (kind === "deposit") body = amountField() + noteField();
  else if (kind === "grant") body = field(L("member"), `<select name="to" required><option value="">—</option>${options([...S.people.values()].filter((who) => who.active).map((who) => [who.user_id, who.name]), presetUser)}</select>`, "full")
    + field(L("kind"), `<select name="kind">${options([["bonus", L("bonus")], ["fine", L("fine")]], "bonus")}</select>`) + amountField() + noteField();
  else body = field(L("currencyName"), `<input name="name" required maxlength="40" value="${esc(S.data.economy?.currency_name || "Money")}">`, "wide") + field(L("symbol"), `<input name="symbol" required maxlength="4" value="${esc(S.data.economy?.symbol || "$")}">`);
  openDialog(`${dialogHead(titles[kind], kind === "send" || kind === "payout" ? `${esc(L("balance"))}: ${esc(money(S.data.mywallet?.balance))}` : "")}
    <form class="dialog-body form-grid" data-form="money" data-kind="${kind}">${body}
      <div class="form-actions"><button class="btn btn-red" type="submit">${icon(kind === "settings" ? "save" : "send")}<span>${esc(kind === "settings" ? L("save") : L("send"))}</span></button></div></form>`);
}

// ---------------------------------------------------------------- task detail
async function openTask(id) {
  await need("tasks", "cases");
  const task = S.data.tasks.find((row) => row.id === id);
  if (!task) return;
  const events = await call(client.from(TB.taskEvents).select("*").eq("task_id", id).order("created_at"));
  const assigned = task.assignees.includes(uid());
  const open = !closedTask(task);
  const linked = S.data.cases.find((row) => row.id === task.case_id);
  const eventLine = (event) => {
    const who = event.kind === "assigned" || event.kind === "unassigned" ? person(event.body).name : "";
    const files = Array.isArray(event.files) ? event.files : [];
    return `<li class="ev-${esc(event.kind)}">${avatar(event.user_id, "sm")}<div><p><b>${esc(person(event.user_id).name)}</b> ${esc(L("taskEvents." + event.kind, { who, n: event.progress ?? "" }))} · ${when(event.created_at)}</p>${event.body && !who ? text(event.body) : ""}${fileList(files)}</div></li>`;
  };
  const progressForm = open && task.status !== "submitted" && (assigned || leader()) ? `<form class="iaa-form-inline" data-form="progress" data-id="${esc(task.id)}">
      ${field(L("progress"), `<div class="iaa-range"><input type="range" name="progress" min="0" max="100" step="5" value="${Number(task.progress) || 0}"><output>${Number(task.progress) || 0}%</output></div>`)}
      ${field(L("progressNote"), `<input name="note" maxlength="2000" dir="auto">`, "wide")}
      <button class="btn" type="submit">${icon("refresh")}<span>${esc(L("updateProgress"))}</span></button></form>` : "";
  const reportForm = assigned && OPEN.includes(task.status) ? `<form class="form-grid iaa-report" data-form="report" data-id="${esc(task.id)}">
      <p class="full muted">${esc(L("reportHint"))}</p>
      ${field(L("submitReport"), `<textarea name="report" required maxlength="6000" rows="5" dir="auto"></textarea>`, "full")}
      ${field(L("attachments"), `<input type="file" name="files" multiple>`, "full")}
      <div class="form-actions"><button class="btn btn-red" type="submit">${icon("send")}<span>${esc(L("submitReport"))}</span></button></div></form>` : "";
  const reviewForm = leader() && open ? `<form class="form-grid iaa-review" data-form="review" data-id="${esc(task.id)}">
      ${field(L("reviewNote"), `<textarea name="note" maxlength="4000" rows="3" dir="auto"></textarea>`, "full")}
      <div class="form-actions">
        ${task.status === "submitted" ? `<button class="btn btn-ok" type="submit" name="decision" value="approved"${chief() ? "" : ` disabled title="${esc(L("approveChiefOnly"))}"`}>${icon("check")}<span>${esc(L("approve"))}</span></button>
        <button class="btn" type="submit" name="decision" value="revision">${icon("undo")}<span>${esc(L("requestRevision"))}</span></button>` : ""}
        <button class="btn btn-danger" type="submit" name="decision" value="rejected">${icon("x")}<span>${esc(L("reject"))}</span></button>
      </div></form>` : "";
  openDialog(`${dialogHead(task.title, `${prioChip(task.priority)} ${statusChip(task)}`)}
    <div class="dialog-body iaa-detail">
      <dl class="iaa-facts">
        <div><dt>${esc(L("deadline"))}</dt><dd>${task.deadline ? `${esc(C.fmtDateTime(task.deadline))} · ${when(task.deadline)}` : esc(L("noDeadline"))}</dd></div>
        <div><dt>${esc(L("assignedBy"))}</dt><dd>${avatar(task.created_by, "sm")} ${esc(person(task.created_by).name)}</dd></div>
        <div><dt>${esc(L("assignees"))}</dt><dd class="iaa-avatars">${task.assignees.map((who) => `<span class="iaa-chip-person">${avatar(who, "sm")}${esc(person(who).name)}</span>`).join("")}</dd></div>
        <div><dt>${esc(L("progress"))}</dt><dd><div class="iaa-progress"><i style="width:${Number(task.progress) || 0}%"></i></div></dd></div>
        ${task.reward > 0 ? `<div class="iaa-fact-money"><dt>${esc(L("reward"))}</dt><dd>${icon("coins")} ${esc(L(task.reward_paid ? "rewardPaid" : "rewardEach", { amount: money(task.reward) }))}</dd></div>` : ""}
        ${linked ? `<div><dt>${esc(L("linkedCase"))}</dt><dd><a class="link-btn" href="#/iaa/cases/${esc(linked.id)}">${esc(linked.case_number)} · ${esc(linked.title)}</a></dd></div>` : ""}
      </dl>
      ${task.description ? `<h3 class="iaa-sub">${esc(L("description"))}</h3>${text(task.description)}` : ""}
      ${task.requirements ? `<h3 class="iaa-sub">${esc(L("requirements"))}</h3>${text(task.requirements)}` : ""}
      ${progressForm}${reportForm}
      ${reviewForm ? `<h3 class="iaa-sub">${esc(L("review"))}</h3>${reviewForm}` : ""}
      <h3 class="iaa-sub">${esc(L("history"))}</h3>
      <ol class="iaa-history">${events.map(eventLine).join("")}</ol>
      <form class="iaa-form-inline" data-form="comment" data-id="${esc(task.id)}"><input name="body" required maxlength="2000" dir="auto" placeholder="${esc(L("addComment"))}"><button class="btn" type="submit">${icon("send")}</button></form>
    </div>
    ${leader() ? `<footer class="dialog-foot">${btn(`${icon("edit")}<span>${esc(L("edit"))}</span>`, "task-edit", `data-id="${esc(task.id)}"`)}${btn(`${icon("trash")}<span>${esc(L("remove"))}</span>`, "task-delete", `data-id="${esc(task.id)}"`, "btn btn-danger")}</footer>` : ""}`);
  if (location.hash !== `#/iaa/tasks/${id}` && S.view === "tasks") history.replaceState(null, "", `#/iaa/tasks/${id}`);
  dialog.addEventListener("close", () => { if (location.hash.startsWith("#/iaa/tasks/")) history.replaceState(null, "", "#/iaa/tasks"); }, { once: true });
}

function taskForm(task = null) {
  const picked = new Set(task?.assignees || []);
  const positions = [...new Set([...S.people.values()].filter((who) => who.active && who.position).map((who) => who.position))];
  openDialog(`${dialogHead(task ? L("editTask") : L("newTask"))}
    <form class="dialog-body form-grid" data-form="task" data-id="${esc(task?.id || "")}">
      ${field(L("title"), `<input name="title" required maxlength="160" dir="auto" value="${esc(task?.title || "")}">`, "full")}
      ${field(L("priority"), `<select name="priority">${options(Object.entries(L("priorities")), task?.priority || "normal")}</select>`)}
      ${field(L("deadline"), `<input type="datetime-local" name="deadline" value="${esc(toLocalInput(task?.deadline))}">`)}
      ${level() >= 4 ? field(`${L("reward")} (${S.data.economy?.symbol || "$"})`, `<input type="number" name="reward" min="0" max="1000000000" step="1" value="${Number(task?.reward || 0)}"${task?.reward_paid ? " disabled" : ""}>`, "full") + `<p class="full muted iaa-hint">${icon("coins")} ${esc(L("rewardHint"))}</p>` : ""}
      ${field(L("linkedCase"), `<select name="case_id"><option value="">${esc(L("noCase"))}</option>${options(S.data.cases.filter((row) => ["open", "active"].includes(row.status) || row.id === task?.case_id).map((row) => [row.id, `${row.case_number} · ${row.title}`]), task?.case_id)}</select>`, "full")}
      ${field(L("description"), `<textarea name="description" maxlength="6000" rows="4" dir="auto">${esc(task?.description || "")}</textarea>`, "full")}
      ${field(L("requirements"), `<textarea name="requirements" maxlength="4000" rows="3" dir="auto">${esc(task?.requirements || "")}</textarea>`, "full")}
      <fieldset class="checks full iaa-assign"><legend>${esc(L("assignees"))}</legend>
        <div class="iaa-groups"><span class="muted">${esc(L("groups"))}:</span>
          ${btn(esc(L("groupAll")), "pick", 'data-group="all"', "chip-btn")}${btn(esc(L("groupDeputies")), "pick", 'data-group="deputy"', "chip-btn")}${btn(esc(L("groupMembers")), "pick", 'data-group="member"', "chip-btn")}
          ${positions.map((name) => btn(esc(name), "pick", `data-group="position:${esc(name)}"`, "chip-btn")).join("")}</div>
        <div class="iaa-people-pick">${[...S.people.values()].filter((who) => who.active).sort((a, b) => LEVEL[b.rank] - LEVEL[a.rank] || a.name.localeCompare(b.name)).map((who) => `<label class="check" data-rank="${esc(who.rank)}" data-position="${esc(who.position)}"><input type="checkbox" name="assignee" value="${esc(who.user_id)}"${picked.has(who.user_id) ? " checked" : ""}>${avatar(who.user_id, "sm")}<span>${esc(who.name)} <small class="muted">${esc(L("ranks." + who.rank))}</small></span></label>`).join("")}</div>
      </fieldset>
      <div class="form-actions"><button class="btn btn-red" type="submit">${icon("save")}<span>${esc(L("save"))}</span></button><button class="btn" type="button" data-close>${esc(L("cancel"))}</button></div>
    </form>`);
}

// ---------------------------------------------------------------- case detail
async function caseDetail(id) {
  const row = S.data.cases.find((entry) => entry.id === id);
  if (!row) return empty(L("none"));
  const entries = await call(client.from(TB.entries).select("*").eq("case_id", id).order("created_at", { ascending: false }));
  const tasks = S.data.tasks.filter((task) => task.case_id === id);
  log("iaa.case.open", row.case_number, { id });
  const kinds = Object.entries(L("entryKinds")).filter(([key]) => leader() || key !== "document");
  return `
    <a class="link-btn iaa-back" href="#/iaa/cases"><svg class="i flip"><use href="assets/icons.svg#i-arrow-left"/></svg> ${esc(L("back"))}</a>
    <section class="panel iaa-case-head">
      <header><code>${esc(row.case_number)}</code>${classChip(row.classification)}${caseChip(row.status)}${chief() ? btn(`${icon("edit")}<span>${esc(L("edit"))}</span>`, "case-edit", `data-id="${esc(row.id)}"`, "btn btn-sm") : ""}</header>
      <h2 dir="auto">${esc(row.title)}</h2>
      ${row.summary ? text(row.summary) : ""}
      <dl class="iaa-facts"><div><dt>${esc(L("lead"))}</dt><dd>${row.lead_id ? `${avatar(row.lead_id, "sm")} ${esc(person(row.lead_id).name)}` : esc(L("noLead"))}</dd></div>
        <div><dt>${esc(L("created"))}</dt><dd>${esc(C.fmtDate(row.created_at))} · ${esc(person(row.created_by).name)}</dd></div>
        <div><dt>${esc(L("updated"))}</dt><dd>${when(row.updated_at)}</dd></div></dl>
    </section>
    <div class="iaa-grid-2">
      ${panel(L("caseFile"), entries.length ? `<ol class="iaa-history">${entries.map((entry) => `<li class="ek-${esc(entry.kind)}">${avatar(entry.created_by, "sm")}<div><p><span class="iaa-chip">${esc(L("entryKinds." + entry.kind))}</span> <b dir="auto">${esc(entry.title)}</b> · ${esc(person(entry.created_by).name)} · ${when(entry.created_at)}${chief() ? ` ${btn(icon("trash"), "entry-delete", `data-id="${esc(entry.id)}" title="${esc(L("remove"))}"`, "icon-btn danger")}` : ""}</p>${entry.body ? text(entry.body) : ""}${fileList(entry.files)}</div></li>`).join("")}</ol>` : empty())}
      <div class="stack">
        ${panel(L("addEntry"), `<form class="form-grid" data-form="entry" data-id="${esc(row.id)}">
          ${field(L("kind"), `<select name="kind">${options(kinds, "note")}</select>`)}
          ${field(L("title"), `<input name="title" required maxlength="160" dir="auto">`, "wide")}
          ${field(L("details"), `<textarea name="body" maxlength="8000" rows="4" dir="auto"></textarea>`, "full")}
          ${field(L("attachments"), `<input type="file" name="files" multiple>`, "full")}
          <div class="form-actions"><button class="btn btn-red" type="submit">${icon("plus")}<span>${esc(L("addEntry"))}</span></button></div></form>`)}
        ${panel(L("linkedTasks"), tasks.length ? tasks.map(taskRow).join("") : empty())}
      </div>
    </div>`;
}

function caseForm(row = null) {
  openDialog(`${dialogHead(row ? L("editCase") : L("newCase"), row ? esc(row.case_number) : "")}
    <form class="dialog-body form-grid" data-form="case" data-id="${esc(row?.id || "")}">
      ${field(L("title"), `<input name="title" required maxlength="160" dir="auto" value="${esc(row?.title || "")}">`, "full")}
      ${field(L("classification"), `<select name="classification">${options([1, 2, 3].map((n) => [n, `${n} · ${L("levels." + n)}`]), row?.classification || 1)}</select>`)}
      ${field(L("kind"), `<select name="status">${options(Object.entries(L("caseStatuses")), row?.status || "open")}</select>`)}
      ${field(L("lead"), `<select name="lead_id">${peopleOptions(row?.lead_id || "", L("noLead"))}</select>`, "full")}
      ${field(L("summary"), `<textarea name="summary" maxlength="8000" rows="6" dir="auto">${esc(row?.summary || "")}</textarea>`, "full")}
      <div class="form-actions"><button class="btn btn-red" type="submit">${icon("save")}<span>${esc(L("save"))}</span></button>${row ? btn(`${icon("trash")}<span>${esc(L("remove"))}</span>`, "case-delete", `data-id="${esc(row.id)}"`, "btn btn-danger") : ""}</div>
    </form>`);
}

// ---------------------------------------------------------------- other forms
function eventForm(event = null) {
  openDialog(`${dialogHead(event ? L("editEvent") : L("newEvent"))}
    <form class="dialog-body form-grid" data-form="event" data-id="${esc(event?.id || "")}">
      ${field(L("title"), `<input name="title" required maxlength="160" dir="auto" value="${esc(event?.title || "")}">`, "full")}
      ${field(L("kind"), `<select name="kind">${options(Object.entries(L("eventKinds")), event?.kind || "meeting")}</select>`)}
      ${field(L("location"), `<input name="location" maxlength="160" dir="auto" value="${esc(event?.location || "")}">`)}
      ${field(L("starts"), `<input type="datetime-local" name="starts_at" required value="${esc(toLocalInput(event?.starts_at))}">`)}
      ${field(L("ends"), `<input type="datetime-local" name="ends_at" value="${esc(toLocalInput(event?.ends_at))}">`)}
      ${field(L("description"), `<textarea name="description" maxlength="4000" rows="4" dir="auto">${esc(event?.description || "")}</textarea>`, "full")}
      <div class="form-actions"><button class="btn btn-red" type="submit">${icon("save")}<span>${esc(L("save"))}</span></button></div>
    </form>`);
}

function attendanceForm(event) {
  const statuses = { "": L("noAnswer"), ...L("rsvp"), ...L("attendanceMarks") };
  const marks = new Map(event.attendance.map((row) => [row.user_id, row.status]));
  const people = [...S.people.values()].filter((who) => who.active).sort((a, b) => a.name.localeCompare(b.name));
  openDialog(`${dialogHead(L("attendance"), esc(event.title))}
    <div class="dialog-body"><div class="stack">${people.map((who) => `<div class="iaa-row">${avatar(who.user_id)}<span class="iaa-row-main"><b>${esc(who.name)}</b><small>${esc(L("ranks." + who.rank))}</small></span><select class="iaa-mark" data-event="${esc(event.id)}" data-user="${esc(who.user_id)}">${options(Object.entries(statuses), marks.get(who.user_id) || "")}</select></div>`).join("")}</div></div>`);
}

function composeForm(to = "", subject = "") {
  openDialog(`${dialogHead(L("compose"))}
    <form class="dialog-body form-grid" data-form="message">
      ${field(L("to"), `<select name="to" required><option value="">—</option>${leader() ? "" : `<option value="__leadership">${esc(L("leadership"))}</option>`}${options([...S.people.values()].filter((who) => who.active && who.user_id !== uid()).map((who) => [who.user_id, `${who.name} · ${L("ranks." + who.rank)}`]), to)}${leader() ? `<option value="__leadership">${esc(L("leadership"))}</option>` : ""}</select>`, "full")}
      ${field(L("subject"), `<input name="subject" required maxlength="160" dir="auto" value="${esc(subject)}">`, "full")}
      ${field(L("message"), `<textarea name="body" required maxlength="6000" rows="7" dir="auto"></textarea>`, "full")}
      <div class="form-actions"><button class="btn btn-red" type="submit">${icon("send")}<span>${esc(L("send"))}</span></button></div>
    </form>`);
}

async function openMessage(id) {
  await need("messages");
  const message = S.data.messages.find((row) => row.id === id);
  if (!message) return;
  if (message.recipient_id === uid() && !message.read_at) {
    message.read_at = new Date().toISOString();
    call(client.from(TB.messages).update({ read_at: message.read_at }).eq("id", id)).then(updateBadges, console.warn);
  }
  const other = message.recipient_id === uid() ? message.sender_id : message.recipient_id;
  openDialog(`${dialogHead(message.subject, `${esc(L(message.recipient_id === uid() ? "from" : "to"))} ${esc(nameOf(other))} · ${esc(C.fmtDateTime(message.created_at))}`)}
    <div class="dialog-body">${text(message.body)}</div>
    <footer class="dialog-foot">${btn(`${icon("send")}<span>${esc(L("reply"))}</span>`, "reply", `data-to="${esc(other)}" data-subject="${esc(/^re:/i.test(message.subject) ? message.subject : "Re: " + message.subject)}"`, "btn btn-red")}</footer>`);
}

function memberForm(who = null) {
  const ranks = ["member", "deputy", "chief"].filter((rank) => LEVEL[rank] < level());
  openDialog(`${dialogHead(who ? L("editMember") : L("addMember"), who ? esc(who.name) : "")}
    <form class="dialog-body form-grid" data-form="member" data-id="${esc(who?.user_id || "")}">
      ${who ? "" : `<div class="field full"><span>${esc(L("findAccount"))}</span><label class="search">${icon("search")}<input type="search" data-x-find autocomplete="off"></label><div class="stack iaa-found" id="iaaFound"></div><input type="hidden" name="user_id" required></div>`}
      ${field(L("rank"), `<select name="rank">${options(ranks.map((rank) => [rank, L("ranks." + rank)]), who?.rank || "member")}</select>`)}
      ${field(L("clearance"), `<select name="clearance">${options([1, 2, 3].map((n) => [n, `${n} · ${L("levels." + n)}`]), who?.clearance || 1)}</select>`)}
      ${field(L("position"), `<input name="position" maxlength="80" dir="auto" value="${esc(who?.position || "")}">`)}
      ${field(L("callsign"), `<input name="callsign" maxlength="24" value="${esc(who?.callsign || "")}">`)}
      ${who ? `<label class="check full"><input type="checkbox" name="active"${who.active ? " checked" : ""}><span>${esc(L("active"))}</span></label>` : ""}
      <div class="form-actions"><button class="btn btn-red" type="submit">${icon("save")}<span>${esc(L("save"))}</span></button>${who ? btn(`${icon("trash")}<span>${esc(L("removeMember"))}</span>`, "member-delete", `data-id="${esc(who.user_id)}"`, "btn btn-danger") : ""}</div>
    </form>`);
}

async function profile(id) {
  const who = person(id);
  const list = [];
  if (leader() || id === uid()) {
    await need("records", "tasks", "events");
    const tasks = S.data.tasks.filter((task) => task.assignees.includes(id));
    const past = S.data.events.filter((event) => new Date(event.starts_at) < new Date());
    const marked = past.map((event) => event.attendance.find((row) => row.user_id === id)?.status).filter(Boolean);
    const attended = marked.filter((status) => status === "present" || status === "going").length;
    list.push(`<div class="grid grid-4">${[[L("stats.assigned"), tasks.length], [L("stats.completed"), tasks.filter((task) => task.status === "completed").length], [L("stats.overdue"), tasks.filter(isOverdue).length], [L("stats.attendance"), past.length ? Math.round((attended / past.length) * 100) + "%" : "–"]].map(([label, value]) => `<div class="card metric"><b>${esc(value)}</b><span>${esc(label)}</span></div>`).join("")}</div>`);
    const records = S.data.records.filter((row) => row.user_id === id);
    list.push(`<h3 class="iaa-sub">${esc(L("nav.records"))}</h3>${records.length ? `<div class="iaa-timeline">${records.map(recordRow).join("")}</div>` : empty()}`);
  }
  openDialog(`${dialogHead(who.name, `${rankChip(who.rank)}`)}
    <div class="dialog-body iaa-detail">
      <div class="iaa-profile">${avatar(id, "lg")}<dl class="iaa-facts"><div><dt>${esc(L("position"))}</dt><dd dir="auto">${esc(who.position || "–")}</dd></div><div><dt>${esc(L("callsign"))}</dt><dd><code>${esc(who.callsign || "–")}</code></dd></div><div><dt>${esc(L("clearance"))}</dt><dd>${classChip(who.clearance)}</dd></div><div><dt>${esc(L("joined"))}</dt><dd>${esc(who.joined_at ? C.fmtDate(who.joined_at) : "–")}</dd></div></dl></div>
      ${list.join("")}
    </div>
    <footer class="dialog-foot">${id !== uid() ? btn(`${icon("mail")}<span>${esc(L("compose"))}</span>`, "reply", `data-to="${esc(id)}" data-subject=""`, "btn") : ""}${who.member_id && LEVEL[who.rank] < level() && id !== uid() ? btn(`${icon("edit")}<span>${esc(L("edit"))}</span>`, "member-edit", `data-id="${esc(id)}"`, "btn") : ""}</footer>`);
}

function recordForm() {
  openDialog(`${dialogHead(L("newRecord"))}
    <form class="dialog-body form-grid" data-form="record">
      ${field(L("member"), `<select name="user_id" required>${peopleOptions(S.filter.recUser, "—")}</select>`, "full")}
      ${field(L("kind"), `<select name="kind">${options(Object.entries(L("recordKinds")), "note")}</select>`)}
      ${field(L("date"), `<input type="date" name="effective_date" value="${new Date().toISOString().slice(0, 10)}">`)}
      ${field(L("title"), `<input name="title" required maxlength="160" dir="auto">`, "full")}
      ${field(L("details"), `<textarea name="details" maxlength="4000" rows="4" dir="auto"></textarea>`, "full")}
      <div class="form-actions"><button class="btn btn-red" type="submit">${icon("save")}<span>${esc(L("save"))}</span></button></div>
    </form>`);
}

function regulationForm(row = null) {
  openDialog(`${dialogHead(row ? row.title : L("newRegulation"))}
    <form class="dialog-body form-grid" data-form="regulation" data-id="${esc(row?.id || "")}">
      ${field(L("category"), `<select name="category">${options(Object.entries(L("regCats")), row?.category || S.filter.reg)}</select>`)}
      ${field(L("code"), `<input name="code" maxlength="24" value="${esc(row?.code || "")}">`)}
      ${field(L("title"), `<input name="title" required maxlength="160" dir="auto" value="${esc(row?.title || "")}">`, "full")}
      ${field(L("body"), `<textarea name="body" maxlength="12000" rows="10" dir="auto">${esc(row?.body || "")}</textarea>`, "full")}
      <div class="form-actions"><button class="btn btn-red" type="submit">${icon("save")}<span>${esc(L("save"))}</span></button></div>
    </form>`);
}

// ---------------------------------------------------------------- events
async function confirmThen(work) { if (await C.ask(L("confirmDelete"))) await work(); }

const CLICKS = {
  filter: (el) => { S.filter[el.dataset.name] = el.dataset.value; if (el.dataset.name === "reg") S.filter.regQuery = ""; rerender(); },
  go: (el) => { if (el.dataset.archive) S.filter.archive = el.dataset.archive; if (el.dataset.reg) S.filter.regQuery = el.dataset.reg; closeDialog(); location.hash = el.dataset.href; },
  task: (el) => openTask(el.dataset.id),
  "task-new": async () => { await need("cases"); taskForm(); },
  "task-edit": async (el) => { await need("cases"); taskForm(S.data.tasks.find((task) => task.id === el.dataset.id)); },
  "task-delete": (el) => confirmThen(async () => { await call(client.from(TB.tasks).delete().eq("id", el.dataset.id)); closeDialog(); await reload("tasks"); rerender(); }),
  pick: (el) => {
    const group = el.dataset.group;
    for (const label of $$(".iaa-people-pick .check", dialog)) {
      const match = group === "all" || (group.startsWith("position:") ? label.dataset.position === group.slice(9) : label.dataset.rank === group);
      if (match) label.querySelector("input").checked = true;
    }
  },
  "case-new": async () => { caseForm(); },
  "case-edit": (el) => caseForm(S.data.cases.find((row) => row.id === el.dataset.id)),
  "case-delete": (el) => confirmThen(async () => { await call(client.from(TB.cases).delete().eq("id", el.dataset.id)); closeDialog(); await reload("cases"); location.hash = "#/iaa/cases"; }),
  "entry-delete": (el) => confirmThen(async () => { await call(client.from(TB.entries).delete().eq("id", el.dataset.id)); rerender(); }),
  file: (el) => openFile(el.dataset.path, el.dataset.name),
  "post-delete": (el) => confirmThen(async () => { await call(client.from(TB.posts).delete().eq("id", el.dataset.id)); await reload("posts"); rerender(); }),
  "event-new": () => eventForm(),
  "event-edit": (el) => eventForm(S.data.events.find((event) => event.id === el.dataset.id)),
  "event-delete": (el) => confirmThen(async () => { await call(client.from(TB.events).delete().eq("id", el.dataset.id)); await reload("events"); rerender(); }),
  attendance: (el) => attendanceForm(S.data.events.find((event) => event.id === el.dataset.id)),
  rsvp: async (el) => {
    await call(client.from(TB.attendance).upsert({ event_id: el.dataset.id, user_id: uid(), status: el.dataset.status }, { onConflict: "event_id,user_id" }));
    await reload("events");
    rerender();
  },
  message: (el) => openMessage(el.dataset.id),
  compose: () => composeForm(),
  reply: (el) => composeForm(el.dataset.to, el.dataset.subject),
  note: async (el) => {
    const note = (S.data.notifications || []).find((row) => row.id === el.dataset.id);
    if (note && !note.read_at) { note.read_at = new Date().toISOString(); call(client.from(TB.notifications).update({ read_at: note.read_at }).eq("id", note.id)).then(updateBadges, console.warn); }
    if (el.dataset.href) { closeDialog(); location.hash = el.dataset.href; } else rerender();
  },
  "notes-read": async () => {
    await call(client.from(TB.notifications).update({ read_at: new Date().toISOString() }).eq("user_id", uid()).is("read_at", null));
    await reload("notifications");
    rerender();
  },
  profile: (el) => profile(el.dataset.id),
  "member-new": () => memberForm(),
  "member-edit": (el) => memberForm(person(el.dataset.id)),
  "member-delete": (el) => confirmThen(async () => { await call(client.from(TB.members).delete().eq("user_id", el.dataset.id)); closeDialog(); await reload("people"); rerender(); }),
  "found-pick": (el) => {
    const form = el.closest("form");
    form.elements.user_id.value = el.dataset.id;
    for (const row of $$(".iaa-found .iaa-row", form)) row.classList.toggle("is-picked", row === el);
  },
  "record-new": () => recordForm(),
  "record-delete": (el) => confirmThen(async () => { await call(client.from(TB.records).delete().eq("id", el.dataset.id)); await reload("records"); rerender(); }),
  "reg-new": () => regulationForm(),
  "reg-edit": (el) => regulationForm(S.data.regulations.find((row) => row.id === el.dataset.id)),
  "reg-delete": (el) => confirmThen(async () => { await call(client.from(TB.regulations).delete().eq("id", el.dataset.id)); await reload("regulations"); rerender(); }),
  "audit-refresh": async () => { await reload("audit"); rerender(); },
  "money-send": () => moneyForm("send"),
  "money-payout": () => moneyForm("payout"),
  "money-deposit": () => moneyForm("deposit"),
  "money-grant": (el) => moneyForm("grant", el.dataset.id || ""),
  "money-settings": () => moneyForm("settings"),
  "payout-paid": async (el) => { await call(client.rpc("lspd_iaa_eco_payout_decide", { p_id: el.dataset.id, p_decision: "paid", p_note: "" })); await reloadMoney(); rerender(); },
  "payout-refuse": async (el) => { if (!(await C.ask(L("refuseAsk")))) return; await call(client.rpc("lspd_iaa_eco_payout_decide", { p_id: el.dataset.id, p_decision: "rejected", p_note: "" })); await reloadMoney(); rerender(); }
};

function onClick(event) {
  const target = event.target.closest("[data-x]");
  if (!target || target.disabled) return;
  const action = CLICKS[target.dataset.x];
  if (!action) return;
  event.preventDefault();
  Promise.resolve(action(target)).catch(C.fail);
}

// Typing in a filter box repaints the list; typing in "find account" searches site accounts.
const repaintSoon = debounce(() => {
  const active = document.activeElement?.dataset?.filter;
  const caret = document.activeElement?.selectionStart;
  render().then(() => { const box = active && $(`[data-filter="${active}"]`, root); if (box) { box.focus(); box.setSelectionRange?.(caret, caret); } });
}, 220);
const findSoon = debounce(async (input) => {
  const found = $("#iaaFound", dialog);
  if (!found) return;
  const query = input.value.trim();
  if (query.length < 2) { found.innerHTML = ""; return; }
  const rows = await call(client.rpc("lspd_iaa_find_accounts", { p_query: query })).catch((error) => { C.fail(error); return []; });
  found.innerHTML = rows.length ? rows.map((row) => `<button class="iaa-row" type="button" data-x="found-pick" data-id="${esc(row.user_id)}"><span class="iaa-avatar">${row.avatar ? `<img src="${esc(row.avatar)}" alt="" referrerpolicy="no-referrer">` : esc(initials(row.name))}</span><span class="iaa-row-main"><b>${esc(row.name)}</b><small>${esc(row.email)}</small></span></button>`).join("") : empty(L("noResults"));
}, 250);

function onInput(event) {
  const target = event.target;
  if (target.dataset.filter) { S.filter[target.dataset.filter] = target.value; repaintSoon(); }
  if (target.hasAttribute("data-x-find")) findSoon(target);
  if (target.type === "range") { const output = target.parentElement.querySelector("output"); if (output) output.textContent = target.value + "%"; }
}

async function onChange(event) {
  const target = event.target;
  if (target.dataset.filter && target.tagName === "SELECT") { S.filter[target.dataset.filter] = target.value; rerender(); }
  if (target.classList.contains("iaa-mark")) {
    const query = target.value
      ? client.from(TB.attendance).upsert({ event_id: target.dataset.event, user_id: target.dataset.user, status: target.value }, { onConflict: "event_id,user_id" })
      : client.from(TB.attendance).delete().eq("event_id", target.dataset.event).eq("user_id", target.dataset.user);
    try { await call(query); C.toast(L("saved"), "ok"); await reload("events"); } catch (error) { C.fail(error); }
  }
}

function debounce(fn, ms) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }; }

// ---------------------------------------------------------------- saving
const SAVES = {
  search: async (form) => { const q = form.elements.q.value.trim(); if (q) location.hash = "#/iaa/search/" + encodeURIComponent(q); },
  post: async (form) => {
    const data = Object.fromEntries(new FormData(form));
    await call(client.from(TB.posts).insert({ title: data.title.trim(), body: data.body.trim(), kind: data.kind, pinned: Boolean(data.pinned) }));
    await reload("posts");
    rerender();
  },
  task: async (form) => {
    const data = Object.fromEntries(new FormData(form));
    const people = new FormData(form).getAll("assignee");
    if (!people.length) throw new Error(L("pickOne"));
    const row = { title: data.title.trim(), priority: data.priority, deadline: fromLocalInput(data.deadline), case_id: data.case_id || null, description: data.description.trim(), requirements: data.requirements.trim() };
    if (level() >= 4 && data.reward !== undefined) row.reward = Math.max(0, Math.floor(Number(data.reward) || 0)); // only the owner may put money on a task
    let id = form.dataset.id;
    if (id) {
      await call(client.from(TB.tasks).update(row).eq("id", id));
      const before = S.data.tasks.find((task) => task.id === id)?.assignees || [];
      const added = people.filter((who) => !before.includes(who));
      const removed = before.filter((who) => !people.includes(who));
      if (added.length) await call(client.from(TB.assignees).insert(added.map((user_id) => ({ task_id: id, user_id }))));
      if (removed.length) await call(client.from(TB.assignees).delete().eq("task_id", id).in("user_id", removed));
    } else {
      id = (await call(client.from(TB.tasks).insert(row).select("id").single())).id;
      await call(client.from(TB.assignees).insert(people.map((user_id) => ({ task_id: id, user_id }))));
    }
    closeDialog();
    await reload("tasks");
    await rerender();
    openTask(id);
  },
  progress: async (form) => {
    await call(client.rpc("lspd_iaa_task_progress", { p_task: form.dataset.id, p_progress: Number(form.elements.progress.value), p_note: form.elements.note.value.trim() }));
    await reload("tasks");
    openTask(form.dataset.id);
    rerender();
  },
  report: async (form) => {
    const files = await uploadFiles(`tasks/${form.dataset.id}`, form.elements.files);
    await call(client.rpc("lspd_iaa_task_submit", { p_task: form.dataset.id, p_report: form.elements.report.value.trim(), p_files: files }));
    await reload("tasks");
    openTask(form.dataset.id);
    rerender();
  },
  review: async (form, submitter) => {
    await call(client.rpc("lspd_iaa_task_review", { p_task: form.dataset.id, p_decision: submitter?.value || "rejected", p_note: form.elements.note.value.trim() }));
    await Promise.all([reload("tasks"), reloadMoney()]);
    paintMe();
    openTask(form.dataset.id);
    rerender();
  },
  comment: async (form) => {
    await call(client.from(TB.taskEvents).insert({ task_id: form.dataset.id, user_id: uid(), kind: "comment", body: form.elements.body.value.trim() }));
    openTask(form.dataset.id);
  },
  case: async (form) => {
    const data = Object.fromEntries(new FormData(form));
    const row = { title: data.title.trim(), summary: data.summary.trim(), classification: Number(data.classification), status: data.status, lead_id: data.lead_id || null, closed_at: ["closed", "archived"].includes(data.status) ? new Date().toISOString() : null };
    let id = form.dataset.id;
    if (id) await call(client.from(TB.cases).update(row).eq("id", id));
    else id = (await call(client.from(TB.cases).insert(row).select("id").single())).id;
    closeDialog();
    await reload("cases");
    location.hash = "#/iaa/cases/" + id;
    if (S.view === "cases" && S.id === id) rerender();
  },
  entry: async (form) => {
    const data = Object.fromEntries(new FormData(form));
    const files = await uploadFiles(`cases/${form.dataset.id}`, form.elements.files);
    await call(client.from(TB.entries).insert({ case_id: form.dataset.id, kind: data.kind, title: data.title.trim(), body: data.body.trim(), files }));
    await call(client.from(TB.cases).update({ status: S.data.cases.find((row) => row.id === form.dataset.id)?.status || "open" }).eq("id", form.dataset.id)).catch(() => {}); // bumps "updated" for leadership
    rerender();
  },
  event: async (form) => {
    const data = Object.fromEntries(new FormData(form));
    const row = { title: data.title.trim(), kind: data.kind, location: data.location.trim(), description: data.description.trim(), starts_at: fromLocalInput(data.starts_at), ends_at: fromLocalInput(data.ends_at) };
    if (form.dataset.id) await call(client.from(TB.events).update(row).eq("id", form.dataset.id));
    else await call(client.from(TB.events).insert(row));
    closeDialog();
    await reload("events");
    rerender();
  },
  message: async (form) => {
    const data = Object.fromEntries(new FormData(form));
    const to = data.to === "__leadership" ? [...S.people.values()].filter((who) => who.active && LEVEL[who.rank] >= 2 && who.user_id !== uid()).map((who) => who.user_id) : [data.to];
    if (!to.length || !to[0]) throw new Error(L("required"));
    await call(client.from(TB.messages).insert(to.map((recipient_id) => ({ recipient_id, sender_id: uid(), subject: data.subject.trim(), body: data.body.trim() }))));
    closeDialog();
    C.toast(L("sent"), "ok");
    await reload("messages");
    if (S.view === "inbox") rerender();
  },
  member: async (form) => {
    const data = Object.fromEntries(new FormData(form));
    const row = { rank: data.rank, clearance: Number(data.clearance), position: data.position.trim(), callsign: data.callsign.trim() };
    if (form.dataset.id) await call(client.from(TB.members).update({ ...row, active: Boolean(data.active) }).eq("user_id", form.dataset.id));
    else {
      if (!data.user_id) throw new Error(L("required"));
      await call(client.from(TB.members).insert({ ...row, user_id: data.user_id }));
    }
    closeDialog();
    await reload("people");
    rerender();
  },
  record: async (form) => {
    const data = Object.fromEntries(new FormData(form));
    await call(client.from(TB.records).insert({ user_id: data.user_id, kind: data.kind, title: data.title.trim(), details: data.details.trim(), effective_date: data.effective_date || null }));
    closeDialog();
    await reload("records");
    rerender();
  },
  money: async (form) => {
    const data = Object.fromEntries(new FormData(form));
    const amount = Math.floor(Number(data.amount) || 0);
    const note = String(data.note || "").trim();
    const kind = form.dataset.kind;
    if (kind === "send") await call(client.rpc("lspd_iaa_eco_transfer", { p_to: data.to, p_amount: amount, p_note: note }));
    else if (kind === "payout") await call(client.rpc("lspd_iaa_eco_payout_request", { p_amount: amount, p_note: note }));
    else if (kind === "deposit") await call(client.rpc("lspd_iaa_eco_deposit", { p_amount: amount, p_note: note }));
    else if (kind === "grant") await call(client.rpc("lspd_iaa_eco_grant", { p_user: data.to, p_kind: data.kind, p_amount: amount, p_note: note }));
    else await call(client.rpc("lspd_iaa_eco_settings", { p_name: data.name.trim(), p_symbol: data.symbol.trim() }));
    closeDialog();
    await reloadMoney();
    paintMe();
    if (S.view === "wallet") rerender();
  },
  regulation: async (form) => {
    const data = Object.fromEntries(new FormData(form));
    const row = { category: data.category, code: data.code.trim(), title: data.title.trim(), body: data.body.trim() };
    if (form.dataset.id) await call(client.from(TB.regulations).update(row).eq("id", form.dataset.id));
    else await call(client.from(TB.regulations).insert(row));
    closeDialog();
    S.filter.reg = data.category;
    await reload("regulations");
    rerender();
  }
};

async function onSubmit(event) {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const button = event.submitter || form.querySelector('[type="submit"]');
  await busy(button, async () => {
    await SAVES[form.dataset.form](form, event.submitter);
    if (!["search", "comment", "progress", "review", "message"].includes(form.dataset.form)) C.toast(L("saved"), "ok");
  });
}
