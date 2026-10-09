import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const listEl = document.querySelector("#list");
const form = document.querySelector("#post-form");
const formError = document.querySelector("#form-error");
let mode = "login";
let me = null;
let query = "";
let timer;
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function openPost(article, post) {
  const data = await api(`/api/posts/${post.id}`);
  const box = document.createElement("div");
  data.comments.forEach((comment) => {
    const p = document.createElement("p");
    p.className = "comment";
    p.textContent = `${comment.author}: ${comment.body}`;
    box.append(p);
  });
  const row = document.createElement("form");
  row.className = "row";
  const input = document.createElement("input");
  input.placeholder = "Comentar";
  input.maxLength = 500;
  input.required = true;
  const button = document.createElement("button");
  button.className = "ghost";
  button.textContent = "Enviar";
  row.append(input, button);
  row.addEventListener("submit", async (event) => {
    event.preventDefault();
    await api(`/api/posts/${post.id}/comments`, { method: "POST", body: JSON.stringify({ body: input.value.trim() }) });
    article.querySelector(".thread")?.remove();
    await openPost(article, post);
  });
  box.append(row);
  box.className = "thread";
  article.append(box);
}
async function refresh() {
  const data = await api(`/api/posts?q=${encodeURIComponent(query)}`);
  listEl.innerHTML = "";
  data.posts.forEach((post) => {
    const article = document.createElement("article");
    article.className = "post";
    const title = document.createElement("h2");
    title.textContent = post.title;
    const meta = document.createElement("small");
    meta.textContent = post.author;
    const body = document.createElement("p");
    body.textContent = post.body;
    const read = document.createElement("button");
    read.type = "button";
    read.className = "ghost";
    read.textContent = "Comentarios";
    read.addEventListener("click", () => openPost(article, post));
    article.append(title, meta, body, read);
    if (me && me.id === post.authorId) {
      const del = document.createElement("button");
      del.type = "button";
      del.className = "ghost";
      del.textContent = "Borrar";
      del.addEventListener("click", async () => { await api(`/api/posts/${post.id}`, { method: "DELETE" }); await refresh(); });
      article.append(del);
    }
    listEl.append(article);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const data = await api("/api/auth/me");
    me = data.user;
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = me.username;
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); me = null; appView.classList.add("hidden"); authView.classList.remove("hidden"); });
document.querySelector("#search").addEventListener("input", (event) => { clearTimeout(timer); timer = setTimeout(async () => { query = event.target.value.trim(); await refresh(); }, 200); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/posts", { method: "POST", body: JSON.stringify({ title: document.querySelector("#title").value.trim(), body: document.querySelector("#body").value.trim() }) });
    form.reset();
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
