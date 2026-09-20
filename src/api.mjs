import {
  createSession,
  DEFAULT_TTL_SECONDS,
  hashPassword,
  MIN_PASSWORD_LENGTH,
  parseCookies,
  readSession,
  serializeCookie,
  SESSION_COOKIE,
  verifyPassword,
} from "./auth.mjs";
import {
  clampChunkSize,
  clampFontSize,
  clampWpm,
  techniqueOrDefault,
} from "./text.mjs";
import { renderAuthPage } from "./render-auth.mjs";
import {
  filterTexts,
  renderEmptyLibraryPage,
  renderLibraryPanel,
  renderReaderPage,
  renderStatsTab,
} from "./render-reader.mjs";

const HTML = "text/html; charset=utf-8";
const JSON_TYPE = "application/json; charset=utf-8";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function truthy(value) {
  return value === true || value === "true" || value === "on" || value === "1";
}

export function createApi({
  db,
  secret,
  sessionTtl = DEFAULT_TTL_SECONDS,
  secureCookie = false,
} = {}) {
  function headers(extra = {}) {
    return { "content-type": HTML, "cache-control": "no-store", ...extra };
  }

  function jsonHeaders() {
    return { "content-type": JSON_TYPE, "cache-control": "no-store" };
  }

  function redirect(location, extraHeaders = {}) {
    return {
      status: 302,
      headers: headers({ location, ...extraHeaders }),
      body: "",
    };
  }

  function sessionCookie(value, maxAge) {
    return serializeCookie(SESSION_COOKIE, value, {
      maxAge,
      secure: secureCookie,
    });
  }

  async function currentUser(cookies) {
    const session = readSession(secret, cookies[SESSION_COOKIE]);
    if (!session) return null;
    return db.getUser(session.userId);
  }

  async function resolveText(userId, requestedId) {
    const stats = await db.getStats(userId);
    let text = requestedId ? await db.getText(requestedId, userId) : null;
    if (!text && stats.activeTextId) {
      text = await db.getText(stats.activeTextId, userId);
    }
    if (!text) {
      const texts = await db.listTexts(userId);
      text = texts[0] ?? null;
    }
    return { text, stats };
  }

  function validateSignup(form) {
    const errors = [];
    const name = String(form.name ?? "").trim();
    const email = String(form.email ?? "").trim();
    const password = String(form.password ?? "");
    const confirm = String(form.confirm ?? "");
    if (!name) errors.push("Informe seu nome.");
    if (!EMAIL_PATTERN.test(email)) errors.push("Informe um e-mail válido.");
    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.push(
        `A senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
    }
    if (password !== confirm) errors.push("As senhas não conferem.");
    return { errors, name, email, password };
  }

  return async function handle(request) {
    const {
      method = "GET",
      pathname = "/",
      query = {},
      form = {},
      rawCookies,
      cookies = parseCookies(rawCookies),
    } = request;

    // ------------------------------------------------------------------ auth
    if (pathname === "/signin" && method === "GET") {
      if (await currentUser(cookies)) return redirect("/");
      return {
        status: 200,
        headers: headers(),
        body: renderAuthPage({ mode: "signin" }),
      };
    }

    if (pathname === "/signup" && method === "GET") {
      if (await currentUser(cookies)) return redirect("/");
      return {
        status: 200,
        headers: headers(),
        body: renderAuthPage({ mode: "signup" }),
      };
    }

    if (pathname === "/api/register" && method === "POST") {
      const { errors, name, email, password } = validateSignup(form);
      if (errors.length) {
        return {
          status: 400,
          headers: headers(),
          body: renderAuthPage({
            mode: "signup",
            values: { name, email },
            errors,
          }),
        };
      }
      try {
        const passwordHash = await hashPassword(password);
        const user = await db.createUser({ name, email, passwordHash });
        const token = createSession(secret, user.id, {
          ttlSeconds: sessionTtl,
        });
        await db.getStats(user.id);
        return redirect("/", {
          "set-cookie": sessionCookie(token, sessionTtl),
        });
      } catch (error) {
        return {
          status: 400,
          headers: headers(),
          body: renderAuthPage({
            mode: "signup",
            values: { name, email },
            errors: [error.message],
          }),
        };
      }
    }

    if (pathname === "/api/login" && method === "POST") {
      const email = String(form.email ?? "").trim();
      const password = String(form.password ?? "");
      const user = await db.findUserByEmail(email);
      const valid = user && (await verifyPassword(password, user.passwordHash));
      if (!valid) {
        return {
          status: 401,
          headers: headers(),
          body: renderAuthPage({
            mode: "signin",
            values: { email },
            errors: ["E-mail ou senha inválidos."],
          }),
        };
      }
      const token = createSession(secret, user.id, { ttlSeconds: sessionTtl });
      return redirect("/", { "set-cookie": sessionCookie(token, sessionTtl) });
    }

    if (pathname === "/logout" && method === "GET") {
      return redirect("/signin", { "set-cookie": sessionCookie("", 0) });
    }

    if (pathname === "/api/me" && method === "GET") {
      const user = await currentUser(cookies);
      return {
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(
          user
            ? {
                authenticated: true,
                user: { id: user.id, name: user.name, email: user.email },
              }
            : { authenticated: false },
        ),
      };
    }

    // Everything below requires an authenticated user.
    const user = await currentUser(cookies);

    if (pathname === "/api/library" && method === "GET") {
      if (!user)
        return {
          status: 401,
          headers: jsonHeaders(),
          body: JSON.stringify({ error: "unauthorized" }),
        };
      const texts = await db.listTexts(user.id);
      const { stats } = await resolveText(user.id, query.text);
      return {
        status: 200,
        headers: headers(),
        body: renderLibraryPanel({
          texts: filterTexts(texts, query.q),
          activeTextId: stats.activeTextId ?? "",
        }),
      };
    }

    if (pathname === "/api/stats-panel" && method === "GET") {
      if (!user)
        return {
          status: 401,
          headers: jsonHeaders(),
          body: JSON.stringify({ error: "unauthorized" }),
        };
      const stats = await db.getStats(user.id);
      return { status: 200, headers: headers(), body: renderStatsTab(stats) };
    }

    if (pathname === "/" && method === "GET") {
      if (!user) return redirect("/signin");
      const { text, stats } = await resolveText(user.id, query.text);
      if (!text) {
        return {
          status: 200,
          headers: headers(),
          body: renderEmptyLibraryPage({ user }),
        };
      }
      const progress = (await db.getProgress(user.id, text.id)) ?? {
        ...(await db.getPreferences(user.id)),
        paragraphIndex: 0,
        wordIndex: 0,
      };
      if (stats.activeTextId !== text.id) {
        await db.saveStats(user.id, { activeTextId: text.id });
      }
      return {
        status: 200,
        headers: headers(),
        body: renderReaderPage({
          user,
          texts: await db.listTexts(user.id),
          text,
          progress,
          stats,
        }),
      };
    }

    if (pathname === "/api/texts" && method === "POST") {
      if (!user) return redirect("/signin");
      const text = await db.createText(user.id, {
        title: form.title,
        author: form.author,
        content: form.content,
      });
      await db.saveStats(user.id, { activeTextId: text.id });
      return redirect(`/?text=${encodeURIComponent(text.id)}`);
    }

    const deleteMatch = pathname.match(/^\/api\/texts\/(.+)\/delete$/);
    if (deleteMatch && method === "POST") {
      if (!user) return redirect("/signin");
      await db.deleteText(decodeURIComponent(deleteMatch[1]), user.id);
      return redirect("/");
    }

    if (pathname === "/api/stats/clear" && method === "POST") {
      if (!user) return redirect("/signin");
      await db.clearStats(user.id);
      return redirect("/");
    }

    if (pathname === "/api/progress" && method === "POST") {
      if (!user)
        return {
          status: 401,
          headers: jsonHeaders(),
          body: JSON.stringify({ error: "unauthorized" }),
        };
      const textId = String(form.textId ?? "");
      if (!textId) {
        return {
          status: 400,
          headers: jsonHeaders(),
          body: JSON.stringify({ error: "textId é obrigatório" }),
        };
      }
      const wpm = clampWpm(form.wpm);
      const settings = {
        wpm,
        technique: techniqueOrDefault(form.technique),
        chunkSize: clampChunkSize(form.chunkSize),
        fontSize: clampFontSize(form.fontSize),
        guideLines: truthy(form.guideLines),
        blurAdjacents: truthy(form.blurAdjacents),
      };
      const saved = await db.saveProgress(user.id, {
        textId,
        paragraphIndex: form.paragraphIndex,
        wordIndex: form.wordIndex,
        ...settings,
      });
      // The same settings follow the reader across texts.
      await db.savePreferences(user.id, settings);

      const stats = await db.getStats(user.id);
      const statsPatch = { activeTextId: textId, highestWpm: wpm };
      const addMinutes = Math.max(0, Math.floor(Number(form.addMinutes) || 0));
      if (addMinutes > 0) {
        statsPatch.totalMinutes = stats.totalMinutes + addMinutes;
      }
      await db.saveStats(user.id, statsPatch);
      return {
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ ok: true, progress: saved }),
      };
    }

    if (pathname === "/api/complete" && method === "POST") {
      if (!user)
        return {
          status: 401,
          headers: jsonHeaders(),
          body: JSON.stringify({ error: "unauthorized" }),
        };
      const textId = String(form.textId ?? "");
      const wpm = clampWpm(form.wpm);
      const stats = await db.getStats(user.id);
      const sessions = stats.completedTexts;
      const averageWpm = Math.round(
        (stats.averageWpm * sessions + wpm) / (sessions + 1),
      );
      const updated = await db.saveStats(user.id, {
        activeTextId: textId || stats.activeTextId,
        completedTexts: sessions + 1,
        highestWpm: wpm,
        averageWpm,
      });
      if (textId) {
        await db.saveProgress(user.id, {
          textId,
          paragraphIndex: 0,
          wordIndex: 0,
        });
      }
      return {
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ ok: true, stats: updated }),
      };
    }

    return {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
      body: "not found",
    };
  };
}
