/**
 * API Test Suite - run with: node tests/api.test.js
 */

const http = require("http");

const BASE = "http://localhost:3013";
let sessionId = null;
let passed = 0;
let failed = 0;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { "Content-Type": "application/json" },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n🧪 Running API Tests...\n");

  // ── Test 1: Health check ──
  console.log("▶ Health Check");
  const health = await request("GET", "/health");
  assert(health.status === 200, "Server is healthy");
  assert(health.body.status === "ok", "Health response has status: ok");

  // ── Test 2: Start learning - valid ──
  console.log("\n▶ POST /start-learning (valid)");
  const start = await request("POST", "/start-learning", {
    topic: "JavaScript",
    level: "beginner",
    dailyMinutes: 10,
  });
  assert(start.status === 200, "Returns 200");
  assert(start.body.sessionId, "Returns sessionId");
  assert(start.body.totalLessons > 0, "Returns totalLessons > 0");
  assert(start.body.emoji, "Returns emoji");
  sessionId = start.body.sessionId;

  // ── Test 3: Start learning - invalid inputs ──
  console.log("\n▶ POST /start-learning (invalid inputs)");
  const badTopic = await request("POST", "/start-learning", { topic: "", level: "beginner", dailyMinutes: 10 });
  assert(badTopic.status === 400, "Rejects empty topic");

  const badLevel = await request("POST", "/start-learning", { topic: "JS", level: "expert", dailyMinutes: 10 });
  assert(badLevel.status === 400, "Rejects invalid level");

  const badTime = await request("POST", "/start-learning", { topic: "JS", level: "beginner", dailyMinutes: 99 });
  assert(badTime.status === 400, "Rejects invalid dailyMinutes");

  // ── Test 4: Get next lesson ──
  console.log("\n▶ GET /next-lesson");
  const lesson = await request("GET", `/next-lesson?sessionId=${sessionId}`);
  assert(lesson.status === 200, "Returns 200");
  assert(lesson.body.lesson, "Returns lesson object");
  assert(lesson.body.lesson.id, "Lesson has id");
  assert(lesson.body.lesson.title, "Lesson has title");
  assert(lesson.body.lesson.explanation, "Lesson has explanation");
  assert(lesson.body.lesson.question, "Lesson has question");
  assert(Array.isArray(lesson.body.lesson.question.options), "Question has options array");

  // ── Test 5: Next lesson - missing sessionId ──
  const missingSession = await request("GET", "/next-lesson");
  assert(missingSession.status === 400, "Rejects missing sessionId");

  const badSession = await request("GET", "/next-lesson?sessionId=nonexistent");
  assert(badSession.status === 404, "Rejects unknown session");

  // ── Test 6: Submit correct answer ──
  console.log("\n▶ POST /submit-answer (correct)");
  const lessonId = lesson.body.lesson.id;
  const correctAnswerId = lesson.body.lesson.question.options.find((o) => o.correct).id;

  const correct = await request("POST", "/submit-answer", { sessionId, lessonId, answerId: correctAnswerId });
  assert(correct.status === 200, "Returns 200 on correct answer");
  assert(correct.body.correct === true, "correct = true");
  assert(correct.body.xpEarned > 0, "XP awarded");
  assert(correct.body.advancedToNext === true, "Advances to next lesson");

  // ── Test 7: Submit wrong answer ──
  console.log("\n▶ POST /submit-answer (wrong)");
  const lesson2 = await request("GET", `/next-lesson?sessionId=${sessionId}`);
  const lessonId2 = lesson2.body.lesson.id;
  const wrongOption = lesson2.body.lesson.question.options.find((o) => !o.correct);

  const wrong = await request("POST", "/submit-answer", { sessionId, lessonId: lessonId2, answerId: wrongOption.id });
  assert(wrong.status === 200, "Returns 200 on wrong answer");
  assert(wrong.body.correct === false, "correct = false");
  assert(wrong.body.xpEarned === 0, "No XP for wrong answer");
  assert(wrong.body.advancedToNext === false, "Does not advance");
  assert(wrong.body.correctAnswer, "Returns correctAnswer");

  // ── Test 8: Progress ──
  console.log("\n▶ GET /progress");
  const progress = await request("GET", `/progress?sessionId=${sessionId}`);
  assert(progress.status === 200, "Returns 200");
  assert(typeof progress.body.progressPercent === "number", "Has progressPercent");
  assert(progress.body.completedLessons >= 1, "Shows 1+ completed lesson");
  assert(progress.body.totalXp > 0, "Shows XP > 0");

  // ── Test 9: Explain differently ──
  console.log("\n▶ GET /explain-differently");
  const alt = await request("GET", `/explain-differently?sessionId=${sessionId}`);
  assert(alt.status === 200, "Returns 200");
  assert(alt.body.alternativeExplanation, "Has alternativeExplanation");

  // ── Test 10: Confused mode ──
  console.log("\n▶ GET /confused");
  const confused = await request("GET", `/confused?sessionId=${sessionId}`);
  assert(confused.status === 200, "Returns 200");
  assert(confused.body.simpleExplanation, "Has simpleExplanation");
  assert(confused.body.encouragement, "Has encouragement message");

  // ── Test 11: Invalid answer ID ──
  console.log("\n▶ POST /submit-answer (invalid answerId)");
  const lesson3 = await request("GET", `/next-lesson?sessionId=${sessionId}`);
  const badAnswer = await request("POST", "/submit-answer", {
    sessionId,
    lessonId: lesson3.body.lesson.id,
    answerId: "z",
  });
  assert(badAnswer.status === 400, "Rejects invalid answerId");

  // ── Test 12: 404 handler ──
  console.log("\n▶ 404 Handler");
  const notFound = await request("GET", "/nonexistent-route");
  assert(notFound.status === 404, "Returns 404 for unknown routes");

  // ── Summary ──
  const total = passed + failed;
  console.log(`\n${"─".repeat(40)}`);
  console.log(`🧪 Results: ${passed}/${total} passed`);
  if (failed > 0) {
    console.log(`⚠️  ${failed} test(s) failed`);
    process.exit(1);
  } else {
    console.log(`🎉 All tests passed!\n`);
  }
}

runTests().catch((err) => {
  console.error("Test runner error:", err.message);
  console.error("Make sure the server is running: npm run dev");
  process.exit(1);
});
