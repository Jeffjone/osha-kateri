import { escapeHtml, readStorage, writeStorage } from "./icons.js";

const profilesKey = "osha-kateri.preview-profiles.v1";
const sessionKey = "osha-kateri.preview-session.v1";
const demoNote = "Storefront preview. Use a test email and a unique preview password. Accounts are stored in this browser.";
const emailInput = '<label for="account-email">Email</label><input id="account-email" name="email" type="email" required autocomplete="email">';

function passwordInput(isNew) {
  return `<label for="account-password">${isNew ? "New preview password" : "Preview password"}</label>
    <input id="account-password" name="password" type="password" required minlength="8" maxlength="128" autocomplete="${isNew ? "new-password" : "current-password"}">`;
}

function profiles() {
  const value = readStorage(profilesKey, []);
  return Array.isArray(value) ? value : [];
}

function session(email) {
  try {
    if (email) sessionStorage.setItem(sessionKey, email);
    else sessionStorage.removeItem(sessionKey);
  } catch {
    // Account storage can be disabled by the browser.
  }
}

export function signedInProfile() {
  try {
    const email = sessionStorage.getItem(sessionKey);
    return profiles().find((profile) => profile.email === email);
  } catch {
    return undefined;
  }
}

export function accountPage(mode, breadcrumb) {
  const profile = signedInProfile();
  const title = profile ? "Your Account" : { login: "Log In", register: "Create an Account", recover: "Reset Your Password" }[mode];
  let content = "";
  if (profile) {
    content = `<p>Welcome, ${escapeHtml(profile.name)}.</p>
      <div class="account-actions"><a class="button" href="#wishlist">View wishlist</a><button class="text-link" type="button" id="sign-out">Sign out</button></div>`;
  } else {
    const intro = mode === "login" ? '<p>New to Osha Kateri? <a class="text-link" href="#account/register">Create an account</a></p>'
      : mode === "recover" ? "<p>Enter the recovery key provided when you created your preview account.</p>"
      : '<p>Already registered? <a class="text-link" href="#account">Log in</a></p>';
    const fields = mode === "register" ? '<label for="account-name">First name</label><input id="account-name" name="name" required maxlength="60" autocomplete="given-name">'
      : mode === "recover" ? '<label for="account-recovery">Recovery key</label><input id="account-recovery" name="recovery" required autocomplete="off">'
      : "";
    const label = { login: "Sign in", register: "Create account", recover: "Reset password" }[mode];
    content = `${intro}<form id="account-form" class="account-form" data-mode="${mode}">
      ${fields}${emailInput}${passwordInput(mode !== "login")}
      <div class="account-actions"><button type="submit" class="button">${label}</button>
      ${mode === "login" ? '<a class="text-link" href="#account/recover">Forgot your password?</a>' : '<a class="text-link" href="#account">Back to log in</a>'}</div>
      <p class="form-status" id="account-feedback" role="status"></p>
    </form><p class="preview-note">${demoNote}</p>`;
  }
  return `<section class="lined-page account-page">${breadcrumb(title)}
    <div class="account-layout"><h1>${title}</h1>${content}<a class="text-link return-link" href="#home">Return to store</a></div>
  </section>`;
}

function toHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function passwordDigest(password, salt) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 600000 }, key, 256);
  return toHex(new Uint8Array(bits));
}

async function recoveryDigest(key) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return toHex(new Uint8Array(hash));
}

export function bindAccount(container, refresh) {
  container.querySelector("#sign-out")?.addEventListener("click", () => {
    session();
    if (location.hash === "#account") refresh();
    else location.hash = "#account";
  });

  const form = container.querySelector("#account-form");
  if (!form) return;
  const feedback = form.querySelector("#account-feedback");
  const submit = form.querySelector('[type="submit"]');
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    feedback.textContent = "";
    const fields = new FormData(form);
    const mode = form.dataset.mode;
    const email = fields.get("email").trim().toLowerCase();
    const password = fields.get("password");
    const profile = profiles().find((entry) => entry.email === email);
    try {
      if (mode === "login") {
        if (!profile || await passwordDigest(password, profile.salt) !== profile.password) {
          feedback.textContent = "That email and preview password did not match.";
          return;
        }
        session(email);
        refresh();
        return;
      }

      if (mode === "register" && profile) {
        feedback.textContent = "An account already exists for that email in this browser.";
        return;
      }
      const name = mode === "register" ? fields.get("name").trim() : profile?.name;
      if (mode === "register" && !name) {
        feedback.textContent = "Enter a first name.";
        return;
      }
      if (mode === "recover" && (!profile || await recoveryDigest(fields.get("recovery").trim().toLowerCase()) !== profile.recovery)) {
        feedback.textContent = "That email and recovery key did not match.";
        return;
      }

      const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
      const recoveryKey = toHex(crypto.getRandomValues(new Uint8Array(16)));
      const record = { email, name, salt, password: await passwordDigest(password, salt), recovery: await recoveryDigest(recoveryKey) };
      const current = profiles();
      const existing = current.find((entry) => entry.email === email);
      if (mode === "register" ? existing : existing?.password !== profile.password) {
        feedback.textContent = "This account changed in another tab. Try again.";
        return;
      }
      if (!writeStorage(profilesKey, [...current.filter((entry) => entry.email !== email), record])) {
        feedback.textContent = "This browser could not save your preview account.";
        return;
      }
      session(email);
      const confirmation = document.createElement("div");
      confirmation.className = "account-confirmation";
      confirmation.innerHTML = `<p>${mode === "recover" ? "Password updated." : "Account created."} Keep this recovery key for your preview account.</p>
        <p class="recovery-key">${recoveryKey}</p><a class="button" href="#account">Continue to your account</a>`;
      form.replaceWith(confirmation);
      confirmation.querySelector("a").focus();
    } catch {
      feedback.textContent = "Preview accounts require a secure connection and browser storage.";
    } finally {
      submit.disabled = false;
    }
  });
}
