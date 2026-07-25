import type { CheckInType } from "@/lib/database.types";

// Standard public-domain clinical instruments (Spitzer, Kroenke, Williams et al.)
export const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure, or have let yourself or your family down",
  "Trouble concentrating on things, such as reading or watching television",
  "Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself in some way",
];

export const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen",
];

export const ANSWER_LABELS = ["Not at all", "Several days", "More than half the days", "Nearly every day"];

// 0-indexed: item 9 on the PHQ-9 asks about self-harm/suicidal ideation.
export const PHQ9_SELF_HARM_INDEX = 8;

export function questionsFor(type: CheckInType) {
  return type === "phq9" ? PHQ9_QUESTIONS : GAD7_QUESTIONS;
}

export function scoreBand(type: CheckInType, score: number): { label: string; color: string } {
  if (type === "phq9") {
    if (score <= 4) return { label: "Minimal", color: "#788c5d" };
    if (score <= 9) return { label: "Mild", color: "#a6ad5f" };
    if (score <= 14) return { label: "Moderate", color: "#d9a157" };
    if (score <= 19) return { label: "Moderately severe", color: "#d97757" };
    return { label: "Severe", color: "#b3452c" };
  }
  if (score <= 4) return { label: "Minimal", color: "#788c5d" };
  if (score <= 9) return { label: "Mild", color: "#a6ad5f" };
  if (score <= 14) return { label: "Moderate", color: "#d9a157" };
  return { label: "Severe", color: "#b3452c" };
}

export function maxScoreFor(type: CheckInType) {
  return type === "phq9" ? 27 : 21;
}
