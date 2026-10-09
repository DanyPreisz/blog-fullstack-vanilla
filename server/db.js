import { MongoClient, ObjectId } from "mongodb";
const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB || "blog";
let db;
export function isReady() { return Boolean(db); }
export async function connect() {
  if (!uri) throw new Error("Falta MONGODB_URI");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  db = client.db(dbName);
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("posts").createIndex({ createdAt: -1 });
  await db.collection("comments").createIndex({ postId: 1, createdAt: 1 });
  console.log(`MongoDB conectado (${dbName})`);
  return db;
}
export const users = () => db.collection("users");
export const posts = () => db.collection("posts");
export const comments = () => db.collection("comments");
export function toId(value) { return ObjectId.isValid(value) ? new ObjectId(String(value)) : null; }
export function mapPost(doc) { return { id: String(doc._id), title: doc.title, body: doc.body, authorId: doc.userId, author: doc.author, createdAt: doc.createdAt }; }
export function mapComment(doc) { return { id: String(doc._id), postId: doc.postId, body: doc.body, author: doc.author, createdAt: doc.createdAt }; }
