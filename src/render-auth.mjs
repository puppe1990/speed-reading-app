import { escapeHtml, FAVICON } from "./html.mjs";

export const APP_NAME = "Leitor Dinâmico Imersivo";

function field({
  label,
  name,
  type,
  value,
  placeholder,
  autofocus,
  autoComplete,
}) {
  return `<label class="block">
    <span class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">${escapeHtml(label)}</span>
    <input
      name="${name}"
      type="${type}"
      value="${escapeHtml(value ?? "")}"
      placeholder="${escapeHtml(placeholder ?? "")}"
      ${autofocus ? "autofocus" : ""}
      ${autoComplete ? `autocomplete="${autoComplete}"` : ""}
      class="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50 focus:bg-white/[0.05]"
      required
    />
  </label>`;
}

function errorBox(errors) {
  if (!errors || errors.length === 0) return "";
  const items = errors
    .map((message) => `<li>${escapeHtml(message)}</li>`)
    .join("");
  return `<ul class="mb-5 list-inside list-disc space-y-1 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">${items}</ul>`;
}

function noticeBox(notice) {
  if (!notice) return "";
  return `<p class="mb-5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300">${escapeHtml(notice)}</p>`;
}

const AUTH_COPY = {
  signin: {
    title: "Entrar na sua conta",
    subtitle: "Continue de onde você parou no treino de leitura.",
    action: "/api/login",
    button: "Entrar",
    switchText: "Ainda não tem conta?",
    switchLabel: "Criar conta",
    switchHref: "/signup",
  },
  signup: {
    title: "Criar sua conta",
    subtitle: "Salve seus textos, progresso e estatísticas na nuvem.",
    action: "/api/register",
    button: "Criar conta",
    switchText: "Já tem uma conta?",
    switchLabel: "Entrar",
    switchHref: "/signin",
  },
};

export function renderAuthPage({
  mode = "signin",
  values = {},
  errors = [],
  notice = "",
} = {}) {
  const copy = AUTH_COPY[mode] ?? AUTH_COPY.signin;
  const isSignup = mode === "signup";

  const fields = isSignup
    ? field({
        label: "Nome",
        name: "name",
        type: "text",
        value: values.name,
        placeholder: "Como podemos te chamar?",
        autofocus: true,
        autoComplete: "name",
      }) +
      field({
        label: "E-mail",
        name: "email",
        type: "email",
        value: values.email,
        placeholder: "voce@exemplo.com",
        autoComplete: "email",
      }) +
      field({
        label: "Senha",
        name: "password",
        type: "password",
        placeholder: "Mínimo de 8 caracteres",
        autoComplete: "new-password",
      }) +
      field({
        label: "Confirmar senha",
        name: "confirm",
        type: "password",
        placeholder: "Repita a senha",
        autoComplete: "new-password",
      })
    : field({
        label: "E-mail",
        name: "email",
        type: "email",
        value: values.email,
        placeholder: "voce@exemplo.com",
        autofocus: true,
        autoComplete: "email",
      }) +
      field({
        label: "Senha",
        name: "password",
        type: "password",
        placeholder: "Sua senha",
        autoComplete: "current-password",
      });

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(copy.title)} · ${escapeHtml(APP_NAME)}</title>
    <link rel="icon" href="${FAVICON}" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      :root { color-scheme: dark; }
      body { font-family: "Inter", ui-sans-serif, system-ui, sans-serif; }
    </style>
  </head>
  <body class="min-h-screen bg-[#070709] text-[#e7e9ee]">
    <div class="pointer-events-none fixed inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,rgba(34,211,238,0.07),transparent_70%)]"></div>
    <main class="relative flex min-h-screen items-center justify-center p-4">
      <div class="w-full max-w-md rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 shadow-2xl backdrop-blur">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10">
            <svg class="h-5 w-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
          </div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">${escapeHtml(APP_NAME)}</p>
        </div>
        <h1 class="text-2xl font-bold text-white">${escapeHtml(copy.title)}</h1>
        <p class="mb-6 mt-1 text-sm text-white/45">${escapeHtml(copy.subtitle)}</p>
        ${noticeBox(notice)}
        ${errorBox(errors)}
        <form action="${copy.action}" method="post" class="space-y-4">
          ${fields}
          <button type="submit" class="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-black shadow-[0_8px_30px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300 active:scale-[0.99]">
            ${escapeHtml(copy.button)}
          </button>
        </form>
        <p class="mt-6 text-center text-sm text-white/45">
          ${escapeHtml(copy.switchText)}
          <a href="${copy.switchHref}" class="font-semibold text-cyan-400 transition hover:text-cyan-300">${escapeHtml(copy.switchLabel)}</a>
        </p>
      </div>
    </main>
  </body>
</html>`;
}
