/**
 * SommelierPRO — Quiz Backend (GAS) - Individual Sheet Architecture
 */

const SPREADSHEET_ID = '1GqEla06QvzTTr5_z9UYuN1-49J99bH5ewtC3QOqSFjI';

// ========== Utility ==========
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrReserveUserSheet(userName) {
  if (!userName) throw new Error("userName is required");
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(userName);
  if (!sheet) {
    sheet = ss.insertSheet(userName);
    // Header for individual progress
    sheet.appendRow(["Date", "Session", "Score", "Total", "Chapter ID", "Chapter Title", "Details", "Timestamp"]);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#f3f3f3");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function successResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getJSTDateOnly() {
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
}

function getJSTTimestamp() {
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
}

// ========== Entry Points ==========
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    switch (params.action) {
      case 'registerUser':
        return handleRegisterUser(params);
      case 'saveResult':
        return handleSaveResult(params);
      case 'saveQuestResult':
        return handleSaveQuestResult(params);
      default:
        return errorResponse('Unknown action: ' + params.action);
    }
  } catch (err) {
    return errorResponse('Server error: ' + err.message);
  }
}

function doGet(e) {
  try {
    switch (e.parameter.action || 'getHistory') {
      case 'getUsers':
        return handleGetUsers();
      case 'getHistory':
        return handleGetHistory(e.parameter);
      case 'getToday':
        return handleGetToday(e.parameter);
      case 'getUserStats':
        return handleGetUserStats(e.parameter);
      case 'getDetailedStats':
        return handleGetDetailedStats(e.parameter);
      case 'getQuestProgress':
        return handleGetQuestProgress(e.parameter);
      default:
        return errorResponse('Unknown GET action: ' + e.parameter.action);
    }
  } catch (err) {
    return errorResponse('Server error: ' + err.message);
  }
}

// ========== Handlers ==========

function handleRegisterUser(params) {
  const name = (params.name || '').trim();
  if (!name) return errorResponse('名前が必要です');
  
  const ss = getSpreadsheet();
  const isExisting = (ss.getSheetByName(name) !== null);
  getOrReserveUserSheet(name); // Ensures individual sheet exists

  const userId = 'u_' + Date.now();
  return successResponse({ user_id: userId, name: name, existing: isExisting });
}

function handleGetUsers() {
  const ss = getSpreadsheet();
  const sheets = ss.getSheets();
  const users = [];

  sheets.forEach(sheet => {
    const sName = sheet.getName();
    // 既存の古いテーブルは一覧から除外する
    if (sName !== 'users' && sName !== 'quiz_results') {
      users.push({
        user_id: 'sheet_' + sName,
        name: sName,
        registered: getJSTDateOnly()
      });
    }
  });

  return successResponse({ users: users });
}

function handleSaveResult(params) {
  const userName = params.user_name || '';
  if (!userName) return errorResponse('user_name is missing');

  const sheet = getOrReserveUserSheet(userName);
  const date = params.date || getJSTDateOnly();
  const session = params.session;
  const score = params.score;
  const total = params.total;
  const chapterId = params.chapter_id || '';
  const chapterTitle = params.chapter_title || '';
  const detailsJson = JSON.stringify(params.details || []);
  const timestamp = getJSTTimestamp();

  // UPSERT (Extraセッションは上書きせずAPPENDして成長履歴を残す)
  const data = sheet.getDataRange().getValues();
  let existingRow = -1;
  if (session !== 'extra') {
    for (let i = 1; i < data.length; i++) {
      const rowDateStr = data[i][0] instanceof Date ? Utilities.formatDate(data[i][0], 'Asia/Tokyo', 'yyyy-MM-dd') : String(data[i][0]);
      if (rowDateStr === date && String(data[i][1]) === session) {
        existingRow = i + 1;
        break;
      }
    }
  }

  const rowData = [date, session, score, total, chapterId, chapterTitle, detailsJson, timestamp];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return successResponse({ saved: true, user_name: userName, date, session, score, total });
}

function handleGetHistory(params) {
  const userName = params.user_name || '';
  if (!userName) return errorResponse('user_name is missing');

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(userName);
  if (!sheet) return successResponse({ history: [] });

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return successResponse({ history: [] });

  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const rowDateStr = data[i][0] instanceof Date ? Utilities.formatDate(data[i][0], 'Asia/Tokyo', 'yyyy-MM-dd') : String(data[i][0]);
    rows.push({
      date: rowDateStr,
      session: String(data[i][1]),
      score: Number(data[i][2]),
      total: Number(data[i][3]),
      chapter_id: String(data[i][4]),
      chapter_title: String(data[i][5]),
      timestamp: String(data[i][7])
    });
  }

  return successResponse({ history: rows.reverse() });
}

function handleGetToday(params) {
  const userName = params.user_name || '';
  if (!userName) return errorResponse('user_name is missing');

  const today = getJSTDateOnly();
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(userName);
  const todaySessions = {};

  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rowDateStr = data[i][0] instanceof Date ? Utilities.formatDate(data[i][0], 'Asia/Tokyo', 'yyyy-MM-dd') : String(data[i][0]);
      if (rowDateStr === today) {
        todaySessions[String(data[i][1])] = {
          score: Number(data[i][2]),
          total: Number(data[i][3]),
          chapter_title: String(data[i][5])
        };
      }
    }
  }

  return successResponse({ date: today, sessions: todaySessions });
}

function handleGetUserStats(params) {
  const userName = params.user_name || '';
  if (!userName) return errorResponse('user_name is missing');

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(userName);

  if (!sheet) {
    return successResponse({ user_name: userName, total_score: 0, total_questions: 0, accuracy: 0, session_count: 0, distinct_days: 0 });
  }

  const data = sheet.getDataRange().getValues();
  let totalScore = 0, totalQuestions = 0, sessionCount = 0;
  const dateSet = new Set();

  for (let i = 1; i < data.length; i++) {
    totalScore += Number(data[i][2]);
    totalQuestions += Number(data[i][3]);
    sessionCount++;
    const rowDateStr = data[i][0] instanceof Date ? Utilities.formatDate(data[i][0], 'Asia/Tokyo', 'yyyy-MM-dd') : String(data[i][0]);
    dateSet.add(rowDateStr);
  }

  return successResponse({
    user_name: userName,
    total_score: totalScore,
    total_questions: totalQuestions,
    accuracy: totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0,
    session_count: sessionCount,
    distinct_days: dateSet.size
  });
}

function handleGetDetailedStats(params) {
  const userName = params.user_name || '';
  if (!userName) return errorResponse('user_name is missing');

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(userName);

  if (!sheet) {
    return successResponse({
      user_name: userName,
      chapter_stats: [],
      daily_trend: [],
      streak: 0,
      best_streak: 0,
      total_score: 0,
      total_questions: 0,
      accuracy: 0,
      session_count: 0,
      distinct_days: 0
    });
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return successResponse({
    user_name: userName, chapter_stats: [], daily_trend: [],
    streak: 0, best_streak: 0, total_score: 0, total_questions: 0, accuracy: 0, session_count: 0, distinct_days: 0
  });

  // Aggregate by chapter
  const chapterMap = {};
  // Aggregate by date
  const dateMap = {};
  let totalScore = 0, totalQuestions = 0, sessionCount = 0;
  const dateSet = new Set();

  for (let i = 1; i < data.length; i++) {
    const rowDateStr = data[i][0] instanceof Date
      ? Utilities.formatDate(data[i][0], 'Asia/Tokyo', 'yyyy-MM-dd')
      : String(data[i][0]);
    const score = Number(data[i][2]);
    const total = Number(data[i][3]);
    const chId = String(data[i][4]);
    const chTitle = String(data[i][5]);

    totalScore += score;
    totalQuestions += total;
    sessionCount++;
    dateSet.add(rowDateStr);

    // Chapter aggregation
    if (chId) {
      if (!chapterMap[chId]) {
        chapterMap[chId] = { chapter_id: chId, chapter_title: chTitle, score: 0, total: 0, attempts: 0 };
      }
      chapterMap[chId].score += score;
      chapterMap[chId].total += total;
      chapterMap[chId].attempts++;
    }

    // Date aggregation
    if (!dateMap[rowDateStr]) {
      dateMap[rowDateStr] = { date: rowDateStr, score: 0, total: 0, sessions: 0 };
    }
    dateMap[rowDateStr].score += score;
    dateMap[rowDateStr].total += total;
    dateMap[rowDateStr].sessions++;
  }

  // Build chapter_stats array sorted by accuracy ascending (weakest first)
  const chapterStats = Object.values(chapterMap).map(c => ({
    ...c,
    accuracy: c.total > 0 ? Math.round((c.score / c.total) * 100) : 0
  })).sort((a, b) => a.accuracy - b.accuracy);

  // Build daily_trend sorted chronologically, last 30 entries
  const dailyTrend = Object.values(dateMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map(d => ({
      ...d,
      accuracy: d.total > 0 ? Math.round((d.score / d.total) * 100) : 0
    }));

  // Streak calculation
  const sortedDates = Array.from(dateSet).sort().reverse();
  let streak = 0;
  const today = getJSTDateOnly();
  let checkDate = new Date(today + 'T00:00:00+09:00');

  for (let i = 0; i < sortedDates.length; i++) {
    const d = sortedDates[i];
    const expected = Utilities.formatDate(checkDate, 'Asia/Tokyo', 'yyyy-MM-dd');
    if (d === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0 && d !== today) {
      // If today not done yet, check from yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = Utilities.formatDate(checkDate, 'Asia/Tokyo', 'yyyy-MM-dd');
      if (d === yesterdayStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // Best streak (simple scan)
  let bestStreak = 0, currentStreak = 0;
  const allSortedDates = Array.from(dateSet).sort();
  for (let i = 0; i < allSortedDates.length; i++) {
    if (i === 0) { currentStreak = 1; }
    else {
      const prev = new Date(allSortedDates[i - 1] + 'T00:00:00+09:00');
      prev.setDate(prev.getDate() + 1);
      const expectedNext = Utilities.formatDate(prev, 'Asia/Tokyo', 'yyyy-MM-dd');
      currentStreak = (allSortedDates[i] === expectedNext) ? currentStreak + 1 : 1;
    }
    bestStreak = Math.max(bestStreak, currentStreak);
  }

  return successResponse({
    user_name: userName,
    chapter_stats: chapterStats,
    daily_trend: dailyTrend,
    streak: streak,
    best_streak: bestStreak,
    total_score: totalScore,
    total_questions: totalQuestions,
    accuracy: totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0,
    session_count: sessionCount,
    distinct_days: dateSet.size
  });
}

// ========== QUEST HANDLERS ==========

function getOrCreateQuestSheet(userName) {
  const questSheetName = userName + '_Quest';
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(questSheetName);
  if (!sheet) {
    sheet = ss.insertSheet(questSheetName);
    sheet.appendRow(["TestID", "BestScore", "Total", "Passed", "LastAttempt", "AttemptCount"]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#f3f3f3");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function handleSaveQuestResult(params) {
  const userName = (params.user_name || '').trim();
  if (!userName) return errorResponse('user_name is missing');
  
  const testId = params.test_id;
  const score = Number(params.score);
  const total = Number(params.total);
  const passed = score >= Math.ceil(total * 0.9);
  const timestamp = getJSTTimestamp();

  const sheet = getOrCreateQuestSheet(userName);
  const data = sheet.getDataRange().getValues();
  
  let existingRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === testId) {
      existingRow = i + 1;
      break;
    }
  }

  if (existingRow > 0) {
    // UPSERT: only update if new score is higher
    const currentBest = Number(data[existingRow - 1][1]);
    const currentAttempts = Number(data[existingRow - 1][5]) || 1;
    const newBest = Math.max(currentBest, score);
    const newPassed = newBest >= Math.ceil(total * 0.9);
    sheet.getRange(existingRow, 1, 1, 6).setValues([[testId, newBest, total, newPassed, timestamp, currentAttempts + 1]]);
  } else {
    sheet.appendRow([testId, score, total, passed, timestamp, 1]);
  }

  return successResponse({ saved: true, test_id: testId, score, best: existingRow > 0 ? Math.max(Number(data[existingRow - 1][1]), score) : score });
}

function handleGetQuestProgress(params) {
  const userName = (params.user_name || '').trim();
  if (!userName) return errorResponse('user_name is missing');

  const questSheetName = userName + '_Quest';
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(questSheetName);

  if (!sheet) {
    return successResponse({ progress: {} });
  }

  const data = sheet.getDataRange().getValues();
  const progress = {};

  for (let i = 1; i < data.length; i++) {
    const testId = String(data[i][0]);
    progress[testId] = {
      bestScore: Number(data[i][1]),
      total: Number(data[i][2]),
      passed: Boolean(data[i][3]),
      lastAttempt: String(data[i][4]),
      attemptCount: Number(data[i][5]) || 1
    };
  }

  return successResponse({ progress: progress });
}
