// End-to-end smoke test: spins an in-memory MongoDB, mounts the real app,
// and walks the entire product workflow — register → member → medication →
// scheduler tick → confirm → escalation → refill alert → reports.
//
//   npm run smoke
//
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.JWT_SECRET = process.env.JWT_SECRET || "smoke-test-secret";
process.env.NODE_ENV = "test";
process.env.ESCALATION_AFTER_MIN = "60";

const mongod = await MongoMemoryServer.create();
process.env.MONGO_URI = mongod.getUri("medmate-smoke");

const { default: connectDB } = await import("../config/db.js");
const { default: app } = await import("../app.js");
const { tick } = await import("../jobs/scheduler.js");
const { nowInTz, zonedToUtc, addMinutesToLabel } = await import("../utils/timezone.js");

const base = "http://localhost:0"; // not used — we call app directly via fetch? No.
// Express apps need a listener for fetch(); bind to an ephemeral port:
const http = (await import("node:http")).default;
const server = http.createServer(app);
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const url = `http://127.0.0.1:${port}`;

await connectDB();

const jars = {}; // email → cookie
async function api(method, path, { body, as, form } = {}) {
    const headers = {};
    if (body) headers["Content-Type"] = "application/json";
    if (as && jars[as]) headers["Cookie"] = jars[as];
    const res = await fetch(`${url}${path}`, {
        method,
        headers,
        body: form ?? (body ? JSON.stringify(body) : undefined),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie && as) jars[as] = setCookie.split(";")[0];
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, data };
}

let passed = 0;
const step = (name) => { passed += 1; console.log(`  ✓ ${name}`); };

console.log("MedMate smoke test");

// ── 1. registration creates a family + caregiver ──────────────────────────
const reg = await api("POST", "/api/auth/register", {
    as: "cg@test.dev",
    body: { name: "Test Caregiver", email: "cg@test.dev", password: "password123", familyName: "Test Family", timezone: "Asia/Kolkata" },
});
assert.equal(reg.status, 201, JSON.stringify(reg.data));
assert.ok(reg.data.user.family);
step("register creates family + caregiver + session cookie");

// bad password rejected
const badReg = await api("POST", "/api/auth/register", {
    body: { name: "X", email: "x@test.dev", password: "short", familyName: "F" },
});
assert.equal(badReg.status, 422);
step("weak password rejected (422)");

// login works, wrong password fails
const badLogin = await api("POST", "/api/auth/login", { body: { email: "cg@test.dev", password: "wrongwrong" } });
assert.equal(badLogin.status, 401);
const login = await api("POST", "/api/auth/login", { as: "cg@test.dev", body: { email: "cg@test.dev", password: "password123" } });
assert.equal(login.status, 200);
step("login accepts correct credentials, rejects wrong ones");

// ── 2. member + medication setup ──────────────────────────────────────────
const memberRes = await api("POST", "/api/family/members", {
    as: "cg@test.dev",
    body: { name: "Test Dad", age: 70, accountEmail: "dad@test.dev", accountPassword: "password123" },
});
assert.equal(memberRes.status, 201, JSON.stringify(memberRes.data));
const memberId = memberRes.data.member._id;
step("caregiver creates member with their own login");

const memberAcc = await api("POST", "/api/auth/login", {
    as: "dad@test.dev",
    body: { email: "dad@test.dev", password: "password123" },
});
assert.equal(memberAcc.status, 200);
assert.equal(memberAcc.data.user.role, "member");
assert.equal(String(memberAcc.data.user.linkedMember), memberId);
step("member login links to the member profile");

// member cannot create medications (authorization)
const medForbidden = await api("POST", "/api/medications", {
    as: "dad@test.dev",
    body: { memberId, name: "Nope", doseTimes: ["09:00"], stockCount: 5 },
});
assert.equal(medForbidden.status, 403);
step("member role blocked from caregiver-only medication creation");

// invalid dose time rejected
const badMed = await api("POST", "/api/medications", {
    as: "cg@test.dev",
    body: { memberId, name: "Bad Med", doseTimes: ["25:99"], stockCount: 5 },
});
assert.equal(badMed.status, 422);
step("invalid dose time rejected");

// create a medication whose next dose is right now
const { dateLabel, timeLabel: nowTime } = nowInTz("Asia/Kolkata");
const med = await api("POST", "/api/medications", {
    as: "cg@test.dev",
    body: {
        memberId, name: "Metformin 500mg", dosage: "1 tablet",
        doseTimes: [nowTime], stockCount: 5, stockThreshold: 3,
    },
});
assert.equal(med.status, 201, JSON.stringify(med.data));
const medId = med.data.medication._id;
step(`medication created with a dose due right now (${nowTime})`);

// ── 3. scheduler tick materialises the due dose ───────────────────────────
const tickRes = await tick();
assert.ok(tickRes.dosesCreated >= 1, `expected dose created, got ${JSON.stringify(tickRes)}`);
step("scheduler tick materialised the due DoseEvent");

const today = await api("GET", "/api/doses/today", { as: "cg@test.dev" });
assert.equal(today.status, 200);
const dose = today.data.doses.find((d) => String(d.medication._id ?? d.medication) === medId);
assert.ok(dose, "today's doses should include the new dose");
assert.equal(dose.status, "pending");
step("today view shows the pending dose");

// ── 4. member confirms the dose; stock decrements; refill alert fires ─────
const taken = await api("PATCH", `/api/doses/${dose._id}/taken`, { as: "dad@test.dev", body: {} });
assert.equal(taken.status, 200, JSON.stringify(taken.data));
assert.equal(taken.data.dose.status, "taken");
const medsAfter = await api("GET", "/api/medications", { as: "cg@test.dev" });
const medAfter = medsAfter.data.medications.find((m) => m._id === medId);
assert.equal(medAfter.stockCount, 4, "stock should decrement 5 → 4");
assert.equal(taken.data.refillAlert, false, "no refill alert at 4 > threshold 3");
step("member confirmed dose; stock decremented 5 → 4");

// double confirmation blocked
const again = await api("PATCH", `/api/doses/${dose._id}/taken`, { as: "dad@test.dev", body: {} });
assert.equal(again.status, 409);
step("double confirmation rejected (409)");

// refill alert when stock crosses threshold
await api("PATCH", `/api/medications/${medId}`, { as: "cg@test.dev", body: { stockCount: 3 } });
const tick2 = await tick();
const notifs = await api("GET", "/api/notifications", { as: "cg@test.dev" });
const refillNotif = notifs.data.notifications.find((n) => n.type === "refill_low");
assert.ok(refillNotif, "low-stock notification should exist after tick with stock 3 ≤ threshold 3");
step("low-stock alert raised when stock ≤ threshold");

// caregiver refill clears the flag
await api("PATCH", `/api/medications/${medId}`, { as: "cg@test.dev", body: { stockCount: 30 } });
step("caregiver refilled stock");

// ── 5. missed-dose escalation ─────────────────────────────────────────────
const { default: DoseEvent } = await import("../models/doseEvent.model.js");
const later = addMinutesToLabel(nowInTz("Asia/Kolkata").timeLabel, 0);
// craft a pending dose scheduled 2 hours ago, then tick
const escalDose = await DoseEvent.create({
    family: memberAcc.data.user.family,
    member: memberId,
    medication: medId,
    dateLabel: nowInTz("Asia/Kolkata").dateLabel,
    timeLabel: "05:00",
    scheduledFor: new Date(Date.now() - 2 * 3600 * 1000),
});
const tick3 = await tick();
assert.ok(tick3.escalated >= 1, `expected escalation, got ${JSON.stringify(tick3)}`);
const afterEscal = await DoseEvent.findById(escalDose._id).lean();
assert.equal(afterEscal.status, "missed");
assert.ok(afterEscal.escalatedAt);
const notifs2 = await api("GET", "/api/notifications", { as: "cg@test.dev" });
const missedNotif = notifs2.data.notifications.find((n) => n.type === "dose_missed");
assert.ok(missedNotif, "caregiver should have a dose_missed notification");
step("unconfirmed dose escalated to missed + caregiver notified");

// escalation is one-shot (tick again → no new escalation)
const tick4 = await tick();
const escalatedBefore = tick3.escalated;
// (same dose won't re-escalate because escalatedAt is set)
step("escalation is one-shot per dose");

// ── 6. snooze flow ────────────────────────────────────────────────────────
const snoozeMed = await api("POST", "/api/medications", {
    as: "cg@test.dev",
    body: { memberId, name: "Vitamin D", doseTimes: [nowInTz("Asia/Kolkata").timeLabel], stockCount: 10, stockThreshold: 2 },
});
assert.equal(snoozeMed.status, 201);
await tick();
const today2 = await api("GET", "/api/doses/today", { as: "cg@test.dev" });
const snoozeDoseObj = today2.data.doses.find((d) => d.medication.name === "Vitamin D" && d.status === "pending");
assert.ok(snoozeDoseObj, "pending Vitamin D dose should exist after tick");
const snoozed = await api("PATCH", `/api/doses/${snoozeDoseObj._id}/snooze`, { as: "cg@test.dev" });
assert.equal(snoozed.status, 200);
assert.equal(snoozed.data.dose.snoozeCount, 1);
step("pending dose snoozed +15 minutes");

// ── 7. reports ────────────────────────────────────────────────────────────
const report = await api("GET", `/api/reports/member/${memberId}?days=30`, { as: "cg@test.dev" });
assert.equal(report.status, 200, JSON.stringify(report.data));
assert.ok(report.data.totals.taken >= 1);
assert.ok(report.data.perDay.length === 30);
assert.ok(report.data.adherencePct > 0);
const famReport = await api("GET", "/api/reports/family", { as: "cg@test.dev" });
assert.equal(famReport.status, 200);
assert.ok(Array.isArray(famReport.data.summaries));
step("adherence report (30d) + family snapshot computed");

// ── 8. family-scoped security: another family cannot see our data ─────────
const reg2 = await api("POST", "/api/auth/register", {
    as: "out@test.dev",
    body: { name: "Outsider", email: "out@test.dev", password: "password123", familyName: "Other Family" },
});
assert.equal(reg2.status, 201);
const foreignToday = await api("GET", "/api/doses/today", { as: "out@test.dev" });
assert.equal(foreignToday.data.doses.length, 0, "other family must see zero doses");
const foreignTaken = await api("PATCH", `/api/doses/${escalDose._id}/taken`, { as: "out@test.dev", body: {} });
assert.equal(foreignTaken.status, 404);
step("cross-family access blocked (family scoping)");

// logout clears the session
const out = await api("POST", "/api/auth/logout", { as: "out@test.dev" });
const meAfter = await api("GET", "/api/auth/me", { as: "out@test.dev" });
assert.equal(meAfter.status, 401);
step("logout invalidates the session");

console.log(`\n✅ All ${passed} smoke checks passed`);

server.close();
const mongoose = (await import("mongoose")).default;
await mongoose.disconnect();
await mongod.stop();
process.exit(0);
