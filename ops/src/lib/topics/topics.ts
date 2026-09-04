import { randomUUID } from "node:crypto";

import { readRuntimeJson, updateRuntimeJson } from "@/lib/data/json-store";
import { CONTENT_TYPE_IDS, type ContentTypeId, type Topic, type TopicsData, type TopicStatus } from "@/lib/types";

type TopicOptions = {
  dataDir?: string;
  now?: () => Date;
  idFactory?: () => string;
};

export type TopicInput = {
  title: string;
  angle: string;
  contentTypes: ContentTypeId[];
  tags?: string[];
  notes?: string;
};

export type TopicPatch = Partial<TopicInput> & {
  status?: TopicStatus;
  lastUsedAt?: string | null;
};

function cleanText(value: string, field: string, maxLength: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) throw new Error(`${field} is required.`);
  if (Array.from(text).length > maxLength) throw new Error(`${field} is too long.`);
  return text;
}

function validateContentTypes(value: ContentTypeId[]) {
  if (!Array.isArray(value) || value.length < 1 || value.some((id) => !CONTENT_TYPE_IDS.includes(id))) {
    throw new Error("Topic content types must use the supported library.");
  }
  return [...new Set(value)];
}

function cleanTags(tags: string[] | undefined) {
  if (!tags) return [];
  return [...new Set(tags.map((tag) => tag.replace(/\s+/g, " ").trim()).filter(Boolean))].slice(0, 12);
}

export function validateTopicInput(input: TopicInput): TopicInput {
  return {
    title: cleanText(input.title, "Topic title", 160),
    angle: cleanText(input.angle, "Topic angle", 500),
    contentTypes: validateContentTypes(input.contentTypes),
    tags: cleanTags(input.tags),
    notes: input.notes?.trim().slice(0, 1000) ?? "",
  };
}

export async function readTopics(options: TopicOptions = {}): Promise<TopicsData> {
  return readRuntimeJson<TopicsData>("topics.json", "topics.example.json", options.dataDir);
}

export async function createTopic(input: TopicInput, options: TopicOptions = {}): Promise<Topic> {
  const cleaned = validateTopicInput(input);
  const now = (options.now ?? (() => new Date()))().toISOString();
  const topic: Topic = {
    id: (options.idFactory ?? randomUUID)(),
    ...cleaned,
    tags: cleaned.tags ?? [],
    notes: cleaned.notes ?? "",
    source: "manual",
    status: "backlog",
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
  };
  await updateRuntimeJson<TopicsData>(
    "topics.json",
    "topics.example.json",
    (data) => ({ ...data, topics: [topic, ...data.topics] }),
    options.dataDir,
  );
  return topic;
}

export async function updateTopic(id: string, patch: TopicPatch, options: TopicOptions = {}): Promise<Topic> {
  if (patch.status && !["backlog", "used", "archived"].includes(patch.status)) {
    throw new Error("Invalid topic status.");
  }
  let saved: Topic | undefined;
  const now = (options.now ?? (() => new Date()))().toISOString();
  await updateRuntimeJson<TopicsData>(
    "topics.json",
    "topics.example.json",
    (data) => {
      const index = data.topics.findIndex((topic) => topic.id === id);
      if (index < 0) throw new Error("Topic not found.");
      const current = data.topics[index];
      const candidate: TopicInput = {
        title: patch.title ?? current.title,
        angle: patch.angle ?? current.angle,
        contentTypes: patch.contentTypes ?? current.contentTypes,
        tags: patch.tags ?? current.tags,
        notes: patch.notes ?? current.notes,
      };
      const cleaned = validateTopicInput(candidate);
      saved = {
        ...current,
        ...cleaned,
        tags: cleaned.tags ?? [],
        notes: cleaned.notes ?? "",
        status: patch.status ?? current.status,
        lastUsedAt: patch.lastUsedAt === undefined ? current.lastUsedAt : patch.lastUsedAt,
        updatedAt: now,
      };
      const topics = [...data.topics];
      topics[index] = saved;
      return { ...data, topics };
    },
    options.dataDir,
  );
  if (!saved) throw new Error("Topic not found.");
  return saved;
}

export async function deleteTopic(id: string, options: TopicOptions = {}) {
  await updateRuntimeJson<TopicsData>(
    "topics.json",
    "topics.example.json",
    (data) => {
      if (!data.topics.some((topic) => topic.id === id)) throw new Error("Topic not found.");
      return { ...data, topics: data.topics.filter((topic) => topic.id !== id) };
    },
    options.dataDir,
  );
}
