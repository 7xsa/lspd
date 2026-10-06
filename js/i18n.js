// Interface text (English / Arabic) and the application question bank.

export const strings = {
  en: {
    pageTitle: "FT | LSPD Command Portal",
    brandKicker: "LSPD // Los Santos Police Department",
    brandPortal: "Command Portal",
    statusOnline: "System online",
    statusOffline: "Offline",
    online: "{n} online",
    login: "Login",
    register: "Create account",
    logout: "Logout",
    account: "Account",
    settings: "Settings",

    // tabs
    tabHub: "HUB", tabRegulations: "Regulations", tabSop: "Police SOP", tabFto: "FTO", tabCrew: "LSPD Crew",
    tabMedia: "Media", tabStreams: "Streams", tabCredits: "Credits", tabRoster: "LSPD Schedule",
    tabAdmin: "Admin", tabReview: "Review", tabArchives: "Archives",

    // roles
    roleOwner: "Owner", roleAdmin: "Admin", roleFto: "FTO", roleMedia: "Media", roleIa: "IA",
    roleApplicant: "Applicant", roleGuest: "Guest",

    // hub
    hubKicker: "Los Santos Police Department",
    hubTitle: "<span>LSPD</span> <em>Command Hub</em>",
    hubCopy: "Regulations, roster and recruitment for First Town's police department.",
    connect: "Connect to First Town",
    recruitment: "Recruitment",
    transfer: "Transfer",
    statOfficers: "Officers",
    statOfficersText: "on the active schedule",
    statLive: "Live now",
    statLiveText: "department streams",
    statOnline: "Online",
    statOnlineText: "on the portal",
    brandSub: "Command Portal",
    more: "More",
    search: "Search",
    railMission: "Mission", railPeople: "People", railCommunity: "Community",
    transferLink: "Coming from another department? Request a transfer",
    mottoCity: "Los Santos", mottoState: "California", motto: "To protect and serve",
    quickTitle: "Quick access",
    quickRegs: "Every rule, sorted by degree", quickSop: "The handbook, searchable", quickRoster: "Ranks, wings and status", quickFto: "From application to solo patrol",
    trackerTitle: "Application status",
    stepSubmitted: "Submitted", stepReview: "Under review", stepInterview: "Interview", stepDecision: "Decision",
    notifications: "Notifications", notesMarkRead: "Mark all read", notesClear: "Clear", notesEmpty: "You're all caught up.", justNow: "Just now",
    noteWelcome: "Welcome to the LSPD portal", noteWelcomeText: "Read the Police SOP and the regulations before you apply.",
    noteSop: "The Police SOP has been rebuilt", noteSopText: "Sections, tables, study questions and full-text search.",
    noteSubmitted: "{type} application received", noteSubmittedText: "You'll be notified here as soon as it's reviewed.",
    noteAccepted: "Your {type} application was accepted", noteAcceptedText: "Open your account for the interview details.",
    noteRejected: "Your {type} application was not accepted", noteRejectedText: "You can apply again once the cooldown ends.",
    noteRole: "Your role is now {role}", noteRoleText: "{from} → {role}. New sections may be available to you.",
    notePending: "{n} new applications to review", notePendingText: "Open the review queue.",
    paletteHint: "Search pages, SOP chapters, regulations and actions",
    palettePages: "Pages", paletteSop: "Police SOP", paletteRegs: "Regulations", paletteActions: "Actions", paletteEmpty: "No matches.",
    actLang: "Switch to Arabic", backToTop: "Back to top", localTime: "Los Santos time",
    myApplications: "Your applications",
    cooldownAccepted: "Accepted. You can apply again after {date}.",
    cooldownRejected: "You can apply again after {date}.",
    pendingNotice: "Your {type} application is under review.",

    // regulations
    regTitle: "Regulations",
    regAll: "All degrees",
    regDegree: "Degree {n}",
    regCritical: "Degree 0 · Critical",
    regSearch: "Search code, title or text",
    regCount: "{n} records",
    regEmpty: "Nothing matches that search.",
    regNote: "Wording stays in the official Arabic source.",
    regExpand: "Expand all",
    regCollapse: "Collapse all",
    regAdd: "Add regulation",
    regUpdate: "Save regulation",
    regCode: "Code, e.g. 7-3",
    regName: "Title",
    regText: "Description",
    regDeleteAsk: "Delete this regulation?",

    // sop
    sopTitle: "Police SOP",
    sopSearch: "Search the handbook",
    sopEmpty: "Nothing in the handbook matches that search.",
    sopChapter: "Chapter {n} of {total}",
    sopSections: "{n} sections",
    sopMinutes: "{n} min read",
    sopQuestions: "{n} questions",
    sopOnPage: "In this chapter",
    sopPrev: "Previous",
    sopNext: "Next",
    sopResults: "{n} results for “{q}”",
    sopMore: "{n} more. Refine the search to see them.",
    sopAllResults: "All results",
    sopClear: "Clear search",
    sopShowAnswers: "Show all answers",
    sopHideAnswers: "Hide all answers",

    // fto
    ftoTitle: "Field Training",
    ftoCopy: "Apply, train, certify.",
    ftoDesk: "Join the department",
    ftoDeskText: "New to LSPD or moving from another department.",
    applyRecruitment: "Apply",
    applyTransfer: "Request transfer",
    ftoOne: "Orientation", ftoOneText: "SOP, radio discipline, uniform and call sign.",
    ftoTwo: "Ride-along", ftoTwoText: "Traffic stops, reports, pursuits and officer safety.",
    ftoThree: "Certification", ftoThreeText: "Scenario judgement, de-escalation, solo patrol.",

    // roster
    rosterTitle: "LSPD Schedule",
    rosterAdd: "Add officer",
    rosterUpdate: "Save officer",
    rosterEmpty: "No officers on the schedule yet.",
    badge: "#BN", name: "Name", insignia: "Insignia", rank: "Rank", department: "Department", adminRank: "Admin rank",
    status: "Status", punishment: "Punishment", lastPromotion: "Last promotion", discordUser: "Discord",
    points: "Points", privilege: "Privilege", wings: "Wings",
    insigniaUrl: "Insignia URL", insigniaFile: "Insignia image",

    // crew
    crewTitle: "LSPD Crew",
    crewDirectory: "Command staff",
    crewAdd: "Add member",
    crewUpdate: "Save member",
    crewEmpty: "No crew profiles yet.",
    discordId: "Discord ID",
    photoUrl: "Photo URL",
    photoFile: "Photo",

    // media
    mediaTitle: "Media",
    mediaAdd: "Add post",
    mediaUpdate: "Save post",
    mediaEmpty: "No media yet.",
    mediaUrl: "Image, GIF or MP4 URL",
    mediaFile: "File",
    title: "Title", caption: "Caption",
    reactLogin: "Log in to react.",

    // streams
    streamsTitle: "Streams",
    streamAdd: "Add stream",
    streamUpdate: "Save stream",
    streamsEmpty: "No streamers yet.",
    logoUrl: "Logo URL",
    kickUrl: "Kick link",
    live: "Live", offline: "Offline",
    viewers: "{n} watching",
    watch: "Watch on Kick",

    // credits
    creditsTitle: "Credits",
    creditsNote: "Built in First Town for the LSPD.",

    // admin
    adminTitle: "Admin",
    mPending: "Pending", mArchived: "Archived", mOfficers: "Officers", mMedia: "Media posts",
    manageAccounts: "Accounts",
    optimizeImages: "Optimize images",
    optimizeText: "Moves heavy and embedded images into storage as small WebP files.",
    optimizeWorking: "Optimizing {done}/{total}…",
    optimizeDone: "{done} optimized, {skipped} skipped.",
    optimizeNothing: "All images are already optimized.",
    recentActivity: "Recent activity",
    activityEmpty: "No activity logged yet.",

    // review / archives
    reviewTitle: "Review",
    reviewSearch: "Search applications",
    reviewEmpty: "No pending applications.",
    clearPending: "Clear queue",
    clearAsk: "Delete every pending {type} application?",
    approve: "Approve", reject: "Reject",
    archivesTitle: "Archives",
    acceptedRecruitment: "Accepted · Recruitment", acceptedTransfer: "Accepted · Transfer",
    rejectedRecruitment: "Rejected · Recruitment", rejectedTransfer: "Rejected · Transfer",
    archiveEmpty: "No records here.",
    resetAll: "Reset archives",
    resetAsk: "Delete all accepted and rejected records? Cooldowns reset too.",
    deleteRecord: "Delete",
    deleteAsk: "Delete this record?",
    loadMore: "Load more",
    needAccess: "Staff access required.",
    by: "by {name}",
    answers: "Answers",

    // application
    appRecruitment: "Recruitment application",
    appTransfer: "Transfer request",
    step: "Step {n} of 2",
    back: "Back", next: "Next", submit: "Submit",
    transferRules: "Transfer requirements",
    transferAgree: "I meet these requirements",
    continue: "Continue",
    needLogin: "Log in or create an account first.",
    needProfile: "Add your name and link Discord first.",
    fillRequired: "Fill in the required fields.",
    appSent: "Application sent.",
    decisionApprove: "Approve application",
    decisionReject: "Reject application",
    decisionMessage: "Message to applicant",
    decisionDefault: "Your application has been accepted. Please attend one of the interview dates.",
    monday: "Monday interview", friday: "Friday interview",
    reason: "Reason",
    interview: "Interview",
    decisionSaved: "Decision saved.",
    pending: "Pending", accepted: "Accepted", rejected: "Rejected",

    // account
    profileTitle: "Finish your profile",
    profileText: "A name and a linked Discord are required to apply.",
    displayName: "Display name",
    linkDiscord: "Link Discord",
    discordLinked: "Discord linked",
    discordMissing: "Discord not linked",
    accountTitle: "Account",
    changeName: "Name", changeEmail: "Email", changePassword: "Password",
    newPassword: "New password ({n}+ characters)",
    save: "Save",
    emailSent: "Check your inbox to confirm the new email.",
    passwordSaved: "Password updated.",
    noApplications: "No applications yet.",
    accountsTitle: "Accounts",
    accountsSearch: "Search name or email",
    accountsEmpty: "No accounts found.",
    roleSaved: "Role updated.",

    // settings
    sound: "Sound effects", volume: "Volume", animations: "Animations",
    accentRed: "Red accent", accentBlue: "Blue accent", reset: "Reset",

    // generic
    add: "Add", edit: "Edit", remove: "Remove", cancel: "Cancel", close: "Close", confirm: "Confirm",
    saved: "Saved.", removed: "Removed.", orderSaved: "Order saved.",
    noPermission: "You don't have permission for that.",
    offlineError: "Can't reach the server. Try again.",
    genericError: "Something went wrong.",
    uploadError: "Upload failed.",
    fileType: "Use PNG, JPG, WebP, GIF or MP4.",
    loggedOut: "Logged out.",
    welcome: "Welcome, {name}.",
    dragHint: "Drag to reorder"
  },

  ar: {
    pageTitle: "بوابة قيادة شرطة لوس سانتوس",
    brandKicker: "LSPD // شرطة لوس سانتوس",
    brandPortal: "بوابة القيادة",
    statusOnline: "النظام متصل",
    statusOffline: "غير متصل",
    online: "{n} متصل",
    login: "دخول",
    register: "حساب جديد",
    logout: "خروج",
    account: "الحساب",
    settings: "الإعدادات",

    tabHub: "الرئيسية", tabRegulations: "اللوائح", tabSop: "دليل الإجراءات", tabFto: "FTO", tabCrew: "طاقم LSPD",
    tabMedia: "الإعلام", tabStreams: "البثوث", tabCredits: "الاعتمادات", tabRoster: "جدول LSPD",
    tabAdmin: "الإدارة", tabReview: "المراجعة", tabArchives: "الأرشيف",

    roleOwner: "مالك", roleAdmin: "أدمن", roleFto: "FTO", roleMedia: "إعلام", roleIa: "IA",
    roleApplicant: "متقدم", roleGuest: "زائر",

    hubKicker: "شرطة لوس سانتوس",
    hubTitle: "<span>LSPD</span> <em>مركز القيادة</em>",
    hubCopy: "اللوائح والجدول والتقديم لشرطة First Town.",
    connect: "ادخل First Town",
    recruitment: "التوظيف",
    transfer: "النقل",
    statOfficers: "الأفراد",
    statOfficersText: "في الجدول الحالي",
    statLive: "مباشر الآن",
    statLiveText: "بثوث القطاع",
    statOnline: "متصل",
    statOnlineText: "في البوابة",
    brandSub: "بوابة القيادة",
    more: "المزيد",
    search: "بحث",
    railMission: "المهمة", railPeople: "الأفراد", railCommunity: "المجتمع",
    transferLink: "قادم من قطاع آخر؟ اطلب النقل",
    mottoCity: "لوس سانتوس", mottoState: "كاليفورنيا", motto: "لنحمي ونخدم",
    quickTitle: "وصول سريع",
    quickRegs: "كل اللوائح حسب الدرجة", quickSop: "الدليل كاملاً مع البحث", quickRoster: "الرتب والونقات والحالة", quickFto: "من التقديم إلى الدورية المستقلة",
    trackerTitle: "حالة الطلب",
    stepSubmitted: "تم الإرسال", stepReview: "قيد المراجعة", stepInterview: "المقابلة", stepDecision: "القرار",
    notifications: "الإشعارات", notesMarkRead: "تحديد الكل كمقروء", notesClear: "مسح", notesEmpty: "لا توجد إشعارات جديدة.", justNow: "الآن",
    noteWelcome: "مرحباً بك في بوابة LSPD", noteWelcomeText: "اقرأ دليل الإجراءات واللوائح قبل التقديم.",
    noteSop: "تم تحديث دليل الإجراءات", noteSopText: "أقسام وجداول وأسئلة مراجعة وبحث كامل.",
    noteSubmitted: "تم استلام طلب {type}", noteSubmittedText: "سيصلك إشعار هنا فور مراجعته.",
    noteAccepted: "تم قبول طلب {type}", noteAcceptedText: "افتح حسابك لمعرفة تفاصيل المقابلة.",
    noteRejected: "لم يتم قبول طلب {type}", noteRejectedText: "يمكنك التقديم مجدداً بعد انتهاء المهلة.",
    noteRole: "رتبتك الآن {role}", noteRoleText: "من {from} إلى {role}. قد تظهر لك أقسام جديدة.",
    notePending: "{n} طلبات جديدة بانتظار المراجعة", notePendingText: "افتح قائمة المراجعة.",
    paletteHint: "ابحث في الصفحات وفصول الدليل واللوائح والإجراءات",
    palettePages: "الصفحات", paletteSop: "دليل الإجراءات", paletteRegs: "اللوائح", paletteActions: "إجراءات", paletteEmpty: "لا نتائج.",
    actLang: "Switch to English", backToTop: "العودة للأعلى", localTime: "توقيت لوس سانتوس",
    myApplications: "طلباتك",
    cooldownAccepted: "تم قبولك. يمكنك التقديم مجدداً بعد {date}.",
    cooldownRejected: "يمكنك التقديم مجدداً بعد {date}.",
    pendingNotice: "طلب {type} قيد المراجعة.",

    regTitle: "اللوائح",
    regAll: "كل الدرجات",
    regDegree: "الدرجة {n}",
    regCritical: "الدرجة 0 · حرجة",
    regSearch: "ابحث بالرقم أو العنوان أو النص",
    regCount: "{n} بند",
    regEmpty: "لا توجد نتائج.",
    regNote: "الصياغة بالنص العربي الرسمي.",
    regExpand: "فتح الكل",
    regCollapse: "إغلاق الكل",
    regAdd: "إضافة بند",
    regUpdate: "حفظ البند",
    regCode: "الرقم، مثال 7-3",
    regName: "العنوان",
    regText: "الوصف",
    regDeleteAsk: "حذف هذا البند؟",

    sopTitle: "دليل الإجراءات",
    sopSearch: "ابحث في الدليل",
    sopEmpty: "لا يوجد في الدليل ما يطابق البحث.",
    sopChapter: "الفصل {n} من {total}",
    sopSections: "{n} أقسام",
    sopMinutes: "{n} دقائق قراءة",
    sopQuestions: "{n} سؤال",
    sopOnPage: "في هذا الفصل",
    sopPrev: "السابق",
    sopNext: "التالي",
    sopResults: "{n} نتيجة لـ «{q}»",
    sopMore: "و{n} نتائج أخرى. حدّد البحث أكثر لعرضها.",
    sopAllResults: "كل النتائج",
    sopClear: "مسح البحث",
    sopShowAnswers: "إظهار كل الإجابات",
    sopHideAnswers: "إخفاء الإجابات",

    ftoTitle: "التدريب الميداني",
    ftoCopy: "قدّم، تدرّب، اعتمد.",
    ftoDesk: "انضم للقطاع",
    ftoDeskText: "متقدم جديد أو منقول من قطاع آخر.",
    applyRecruitment: "تقديم",
    applyTransfer: "طلب نقل",
    ftoOne: "التهيئة", ftoOneText: "الإجراءات، الراديو، الزي والكول ساين.",
    ftoTwo: "المرافقة", ftoTwoText: "الاستيقاف، التقارير، المطاردات وسلامة الضابط.",
    ftoThree: "الاعتماد", ftoThreeText: "تقدير المواقف، التهدئة، والدورية المستقلة.",

    rosterTitle: "جدول LSPD",
    rosterAdd: "إضافة فرد",
    rosterUpdate: "حفظ الفرد",
    rosterEmpty: "لا يوجد أفراد في الجدول.",
    badge: "#BN", name: "الاسم", insignia: "الشارة", rank: "الرتبة", department: "القسم", adminRank: "الرتبة الإدارية",
    status: "الحالة", punishment: "العقوبة", lastPromotion: "آخر ترقية", discordUser: "ديسكورد",
    points: "النقاط", privilege: "الامتياز", wings: "الونقات",
    insigniaUrl: "رابط الشارة", insigniaFile: "صورة الشارة",

    crewTitle: "طاقم LSPD",
    crewDirectory: "طاقم القيادة",
    crewAdd: "إضافة عضو",
    crewUpdate: "حفظ العضو",
    crewEmpty: "لا توجد ملفات بعد.",
    discordId: "معرف ديسكورد",
    photoUrl: "رابط الصورة",
    photoFile: "الصورة",

    mediaTitle: "الإعلام",
    mediaAdd: "إضافة منشور",
    mediaUpdate: "حفظ المنشور",
    mediaEmpty: "لا توجد مواد بعد.",
    mediaUrl: "رابط صورة أو GIF أو MP4",
    mediaFile: "ملف",
    title: "العنوان", caption: "الوصف",
    reactLogin: "سجّل الدخول للتفاعل.",

    streamsTitle: "البثوث",
    streamAdd: "إضافة بث",
    streamUpdate: "حفظ البث",
    streamsEmpty: "لا توجد بثوث بعد.",
    logoUrl: "رابط الشعار",
    kickUrl: "رابط Kick",
    live: "مباشر", offline: "غير متصل",
    viewers: "{n} مشاهد",
    watch: "شاهد على Kick",

    creditsTitle: "الاعتمادات",
    creditsNote: "صُنع في First Town لشرطة LSPD.",

    adminTitle: "الإدارة",
    mPending: "معلّقة", mArchived: "مؤرشفة", mOfficers: "الأفراد", mMedia: "منشورات الإعلام",
    manageAccounts: "الحسابات",
    optimizeImages: "تحسين الصور",
    optimizeText: "ينقل الصور الثقيلة والمضمّنة إلى التخزين بصيغة WebP خفيفة.",
    optimizeWorking: "جارٍ التحسين {done}/{total}…",
    optimizeDone: "تم تحسين {done} وتخطي {skipped}.",
    optimizeNothing: "كل الصور محسّنة.",
    recentActivity: "آخر النشاطات",
    activityEmpty: "لا يوجد نشاط مسجل.",

    reviewTitle: "المراجعة",
    reviewSearch: "ابحث في الطلبات",
    reviewEmpty: "لا توجد طلبات معلّقة.",
    clearPending: "مسح القائمة",
    clearAsk: "حذف كل طلبات {type} المعلّقة؟",
    approve: "قبول", reject: "رفض",
    archivesTitle: "الأرشيف",
    acceptedRecruitment: "مقبول · توظيف", acceptedTransfer: "مقبول · نقل",
    rejectedRecruitment: "مرفوض · توظيف", rejectedTransfer: "مرفوض · نقل",
    archiveEmpty: "لا توجد سجلات.",
    resetAll: "تصفير الأرشيف",
    resetAsk: "حذف كل سجلات القبول والرفض؟ ستُصفّر فترات الانتظار أيضاً.",
    deleteRecord: "حذف",
    deleteAsk: "حذف هذا السجل؟",
    loadMore: "عرض المزيد",
    needAccess: "يتطلب صلاحية طاقم.",
    by: "بواسطة {name}",
    answers: "الإجابات",

    appRecruitment: "طلب توظيف",
    appTransfer: "طلب نقل",
    step: "الخطوة {n} من 2",
    back: "رجوع", next: "التالي", submit: "إرسال",
    transferRules: "شروط النقل",
    transferAgree: "أستوفي هذه الشروط",
    continue: "متابعة",
    needLogin: "سجّل الدخول أو أنشئ حساباً أولاً.",
    needProfile: "أضف اسمك واربط ديسكورد أولاً.",
    fillRequired: "أكمل الحقول المطلوبة.",
    appSent: "تم إرسال الطلب.",
    decisionApprove: "قبول الطلب",
    decisionReject: "رفض الطلب",
    decisionMessage: "رسالة للمتقدم",
    decisionDefault: "Your application has been accepted. Please attend one of the interview dates.",
    monday: "مقابلة الاثنين", friday: "مقابلة الجمعة",
    reason: "السبب",
    interview: "المقابلة",
    decisionSaved: "تم حفظ القرار.",
    pending: "معلّق", accepted: "مقبول", rejected: "مرفوض",

    profileTitle: "أكمل ملفك",
    profileText: "الاسم وربط ديسكورد مطلوبان للتقديم.",
    displayName: "اسم العرض",
    linkDiscord: "ربط ديسكورد",
    discordLinked: "ديسكورد مربوط",
    discordMissing: "ديسكورد غير مربوط",
    accountTitle: "الحساب",
    changeName: "الاسم", changeEmail: "البريد", changePassword: "كلمة المرور",
    newPassword: "كلمة مرور جديدة ({n}+ حرف)",
    save: "حفظ",
    emailSent: "تحقق من بريدك لتأكيد البريد الجديد.",
    passwordSaved: "تم تحديث كلمة المرور.",
    noApplications: "لا توجد طلبات بعد.",
    accountsTitle: "الحسابات",
    accountsSearch: "ابحث بالاسم أو البريد",
    accountsEmpty: "لا توجد حسابات.",
    roleSaved: "تم تحديث الصلاحية.",

    sound: "المؤثرات الصوتية", volume: "مستوى الصوت", animations: "الحركة",
    accentRed: "اللون الأحمر", accentBlue: "اللون الأزرق", reset: "إعادة ضبط",

    add: "إضافة", edit: "تعديل", remove: "حذف", cancel: "إلغاء", close: "إغلاق", confirm: "تأكيد",
    saved: "تم الحفظ.", removed: "تم الحذف.", orderSaved: "تم حفظ الترتيب.",
    noPermission: "لا تملك صلاحية لهذا الإجراء.",
    offlineError: "تعذر الاتصال بالخادم. حاول مجدداً.",
    genericError: "حدث خطأ.",
    uploadError: "فشل الرفع.",
    fileType: "استخدم PNG أو JPG أو WebP أو GIF أو MP4.",
    loggedOut: "تم تسجيل الخروج.",
    welcome: "مرحباً، {name}.",
    dragHint: "اسحب لإعادة الترتيب"
  }
};

let lang = "en";
try { lang = localStorage.getItem("lspd-language") === "ar" ? "ar" : "en"; } catch (error) { /* default */ }

export const getLang = () => lang;

export function setLang(next) {
  lang = next === "ar" ? "ar" : "en";
  try { localStorage.setItem("lspd-language", lang); } catch (error) { /* ignore */ }
}

export function t(key, values) {
  const source = strings[lang][key] ?? strings.en[key] ?? key;
  if (typeof source !== "string") return source;
  return source.replace(/\{(\w+)\}/g, (_, token) => (values && values[token] != null ? values[token] : ""));
}

const q = (key, en, ar, type) => ({ key, label: { en, ar }, type });

export const questions = {
  recruitment: [
    [
      q("full_name", "Full RP name", "الاسم الكامل داخل الرول بلاي", "text"),
      q("contact_email", "Contact email", "البريد الإلكتروني للتواصل", "email"),
      q("discord_id", "Discord ID", "معرف الديسكورد", "text"),
      q("age", "Age", "العمر", "number"),
      q("weekly_hours", "Weekly activity hours", "ساعات النشاط الأسبوعية", "number"),
      q("past_experience", "Past police or emergency experience", "خبراتك السابقة في الشرطة أو الطوارئ", "textarea")
    ],
    [
      q("scenario_traffic_stop", "A driver refuses to exit during a felony stop. What do you do?", "سائق يرفض النزول أثناء استيقاف جنائي. ماذا تفعل؟", "textarea"),
      q("scenario_hostage", "How do you handle a hostage scene before command arrives?", "كيف تتعامل مع حالة رهائن قبل وصول القيادة؟", "textarea"),
      q("lethal_force_policy", "When is lethal force justified?", "متى يكون استخدام القوة القاتلة مبرراً؟", "textarea"),
      q("department_policy", "Why do chain of command and radio discipline matter?", "ما أهمية التسلسل القيادي وانضباط الراديو؟", "textarea"),
      q("agreement", "My answers are true and I will follow LSPD regulations.", "إجاباتي صحيحة وسألتزم بلوائح LSPD.", "checkbox")
    ]
  ],
  transfer: [
    [
      q("full_name", "Full RP name", "الاسم الكامل داخل الرول بلاي", "text"),
      q("contact_email", "Contact email", "البريد الإلكتروني للتواصل", "email"),
      q("discord_id", "Discord ID", "معرف الديسكورد", "text"),
      q("current_department", "Current or previous department", "القسم الحالي أو السابق", "text"),
      q("current_rank", "Current or previous rank", "الرتبة الحالية أو السابقة", "text"),
      q("weekly_hours", "Weekly activity hours", "ساعات النشاط الأسبوعية", "number"),
      q("transfer_reason", "Why do you want to transfer to LSPD?", "لماذا ترغب في النقل إلى LSPD؟", "textarea")
    ],
    [
      q("scenario_internal_conflict", "A former colleague breaks policy in front of you. What do you do?", "زميل سابق يخالف السياسة أمامك. ماذا تفعل؟", "textarea"),
      q("scenario_pursuit", "Describe safe pursuit spacing and when a PIT is appropriate.", "اشرح مسافة المطاردة الآمنة ومتى تكون PIT مناسبة.", "textarea"),
      q("lethal_force_policy", "When is lethal force justified?", "متى يكون استخدام القوة القاتلة مبرراً؟", "textarea"),
      q("department_policy", "How will you adapt to LSPD command and SOP?", "كيف ستتأقلم مع قيادة وإجراءات LSPD؟", "textarea"),
      q("agreement", "My transfer details are true and I accept command review.", "تفاصيل النقل صحيحة وأوافق على مراجعة القيادة.", "checkbox")
    ]
  ]
};

export const transferRules = [
  "ان يكون المتقدم للنقل عمره 17 سنه فأعلى",
  "ان يكون صاحب خبره اداريه في اغلب الاقسام",
  "ان يكون متفاعل ومتواجد بشكل يومي",
  "أن يكون الشخص حسن ألاسلوب",
  "أن يكون لديه CV كامل مكمل",
  "يجب أن يكون المتقدم برتبة محددة في جدول الشرطة فما فوق",
  "اعلى رتبة للنقل Officer 2"
];

export const ranks = [
  "Police Commissioner", "Deputy Police Commissioner", "Police Chief", "Deputy Police Chief", "Commander",
  "Captain III", "Captain II", "Captain I", "Lieutenant II", "Lieutenant", "Sergeant II", "Sergeant I", "Sergeant",
  "Senior Lead Officer", "Senior Officer", "Officer 3", "Officer 2", "Officer 1", "Rookie"
];

export const rosterSections = [
  ["", ["Police Commissioner", "Deputy Police Commissioner"]],
  ["Chief Office", ["Police Chief", "Deputy Police Chief", "Commander"]],
  ["Police Administration", ["Captain III", "Captain II", "Captain I"]],
  ["Command of Stations", ["Lieutenant II", "Lieutenant"]],
  ["Watch Commander", ["Sergeant II"]],
  ["Field Supervisor", ["Sergeant I", "Sergeant", "Senior Lead Officer"]],
  ["Patrol Units", ["Senior Officer", "Officer 3", "Officer 2", "Officer 1"]],
  ["Police Trainers", ["Rookie"]]
];

export const wings = [["dispatch", "Dispatch"], ["negotiator", "Negotiator"], ["motorcycle", "Motorcycle"], ["airunit", "Air Unit"], ["interceptor", "Interceptor"]];
export const reactions = ["👍", "🔥", "❤️", "😂", "🫡"];
export const staffRoles = ["admin", "fto", "media", "ia", "applicant"];
