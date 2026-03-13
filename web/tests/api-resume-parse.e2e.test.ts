import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/resume/parse/route";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/resume/parse", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function sampleResumeText() {
  return [
    "Simon Martin",
    "Software Engineer with 4 years of experience building scalable web services.",
    "Experience: Built API platforms, led migrations, and reduced latency by 35%.",
    "Education: MIT, B.S. Computer Science, GPA 4.0",
  ].join(" ");
}

test("POST /api/resume/parse recovers from malformed primary AI JSON using repair fixture", async () => {
  const req = makeRequest({
    resumeText: sampleResumeText(),
    __aiFixture: {
      primary: "[]",
      repair: JSON.stringify({
        personalInfo: {
          fullName: "Simon Martin",
          email: "simon.martin@example.com",
          phone: "",
          linkedin: "",
          github: "",
          portfolio: "",
          summary: "Software engineer",
        },
        education: [],
        experience: [],
        projects: [],
        skills: ["TypeScript", "Node.js"],
        certifications: [],
      }),
    },
  });

  const res = await POST(req);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.data.personalInfo.fullName, "Simon Martin");
  assert.deepEqual(data.data.skills, ["TypeScript", "Node.js"]);
});

test("POST /api/resume/parse returns json_invalid when malformed fixture has no repair output", async () => {
  const req = makeRequest({
    resumeText: sampleResumeText(),
    __aiFixture: {
      primary: "[]",
    },
  });

  const res = await POST(req);
  const data = await res.json();

  assert.equal(res.status, 502);
  assert.match(String(data.error || ""), /invalid json/i);
});
