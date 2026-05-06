const http = require("http");
const fs = require("fs");
const path = require("path");
const tls = require("tls");

loadEnv();

const root = __dirname;
const port = Number(process.env.PORT || 5500);
const host = process.env.HOST || "127.0.0.1";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || "true") === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const mailTo = process.env.MAIL_TO || process.env.SMTP_USER || "soluxtecnologialtda@gmail.com";
const mailFromName = process.env.MAIL_FROM_NAME || "Solux Tecnologia";

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/agendamento") {
      await handleForm(request, response, "Novo agendamento Solux Tecnologia");
      return;
    }

    if (request.method === "POST" && request.url === "/api/contato") {
      await handleForm(request, response, "Novo contato Solux Tecnologia");
      return;
    }

    serveStatic(request, response);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    response.end(renderErrorPage());
  }
});

server.listen(port, host, () => {
  console.log(`Solux Tecnologia rodando em http://${host}:${port}`);
});

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function serveStatic(request, response) {
  let pathname = decodeURIComponent(new URL(request.url, `http://${host}:${port}`).pathname);
  if (pathname === "/") {
    pathname = "/index.html";
  }

  const filePath = path.normalize(path.join(root, pathname));
  if (!filePath.startsWith(root)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Acesso negado.");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      response.end(renderNotFoundPage());
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(data);
  });
}

async function handleForm(request, response, subject) {
  const body = await readRequestBody(request);
  const fields = Object.fromEntries(new URLSearchParams(body));

  if (fields._honey) {
    redirect(response, "/obrigado.html");
    return;
  }

  delete fields._honey;

  await sendMail({
    subject,
    fields,
    replyTo: fields.email,
  });

  redirect(response, "/obrigado.html");
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        request.destroy();
        reject(new Error("Formulário muito grande."));
      }
    });
    request.on("end", () => resolve(data));
    request.on("error", reject);
  });
}

async function sendMail({ subject, fields, replyTo }) {
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    throw new Error("Configure SMTP_USER e SMTP_PASS no arquivo .env antes de enviar e-mails.");
  }

  await sendSmtpMail({
    smtp: emailConfig,
    from: `"${mailFromName}" <${emailConfig.auth.user}>`,
    to: mailTo,
    replyTo: replyTo || undefined,
    subject,
    text: buildTextEmail(subject, fields),
    html: buildHtmlEmail(subject, fields),
  });
}

async function sendSmtpMail({ smtp, from, to, replyTo, subject, text, html }) {
  if (!smtp.secure) {
    throw new Error("Este servidor usa SMTP seguro na porta 465. Configure SMTP_SECURE=true.");
  }

  const recipients = String(to)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const socket = tls.connect({
    host: smtp.host,
    port: smtp.port,
    servername: smtp.host,
  });

  let responseBuffer = "";
  const waiters = [];

  socket.setEncoding("utf8");
  socket.on("data", (chunk) => {
    responseBuffer += chunk;
    flushResponses();
  });

  await new Promise((resolve, reject) => {
    socket.once("secureConnect", resolve);
    socket.once("error", reject);
  });

  try {
    await expectSmtp(socket, readResponse, [220]);
    await command(socket, readResponse, "EHLO soluxtecnologia.local", [250]);
    await command(socket, readResponse, "AUTH LOGIN", [334]);
    await command(socket, readResponse, Buffer.from(smtp.auth.user).toString("base64"), [334]);
    await command(socket, readResponse, Buffer.from(smtp.auth.pass).toString("base64"), [235]);
    await command(socket, readResponse, `MAIL FROM:<${smtp.auth.user}>`, [250]);

    for (const recipient of recipients) {
      await command(socket, readResponse, `RCPT TO:<${recipient}>`, [250, 251]);
    }

    await command(socket, readResponse, "DATA", [354]);
    socket.write(buildMimeMessage({ from, to: recipients.join(", "), replyTo, subject, text, html }));
    socket.write("\r\n.\r\n");
    await expectSmtp(socket, readResponse, [250]);
    await command(socket, readResponse, "QUIT", [221]);
  } finally {
    socket.end();
  }

  function readResponse() {
    return new Promise((resolve, reject) => {
      waiters.push({ resolve, reject });
      socket.once("error", reject);
      flushResponses();
    });
  }

  function flushResponses() {
    if (!waiters.length) {
      return;
    }

    const finalLine = responseBuffer.match(/(?:^|\r?\n)(\d{3}) [^\r\n]*(?:\r?\n|$)/);
    if (!finalLine) {
      return;
    }

    const endIndex = responseBuffer.indexOf(finalLine[0]) + finalLine[0].length;
    const response = responseBuffer.slice(0, endIndex);
    responseBuffer = responseBuffer.slice(endIndex);
    const waiter = waiters.shift();
    waiter.resolve(response);
  }
}

async function command(socket, readResponse, value, acceptedCodes) {
  socket.write(`${value}\r\n`);
  return expectSmtp(socket, readResponse, acceptedCodes);
}

async function expectSmtp(socket, readResponse, acceptedCodes) {
  const response = await readResponse();
  const finalLine = response.trim().split(/\r?\n/).pop();
  const code = Number(finalLine.slice(0, 3));
  if (!acceptedCodes.includes(code)) {
    throw new Error(`SMTP respondeu ${code}: ${response}`);
  }
  return response;
}

function buildMimeMessage({ from, to, replyTo, subject, text, html }) {
  const boundary = `solux-${Date.now()}`;
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : "",
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean);

  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(html),
    `--${boundary}--`,
    "",
  ];

  return `${headers.join("\r\n")}\r\n\r\n${body.join("\r\n")}`.replace(/^\./gm, "..");
}

function encodeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(String(value), "utf8").toString("base64")}?=`;
}

function wrapBase64(value) {
  return Buffer.from(String(value), "utf8")
    .toString("base64")
    .replace(/.{1,76}/g, "$&\r\n")
    .trim();
}

function buildTextEmail(subject, fields) {
  const lines = Object.entries(fields).map(([key, value]) => `${key}: ${value || "-"}`);
  return `${subject}\n\n${lines.join("\n")}`;
}

function buildHtmlEmail(subject, fields) {
  const rows = Object.entries(fields)
    .map(([key, value]) => {
      return `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value || "-")}</td></tr>`;
    })
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;background:#071321;color:#edf5ff;padding:24px">
      <h1 style="color:#36e4ff;margin:0 0 18px">${escapeHtml(subject)}</h1>
      <table style="width:100%;border-collapse:collapse;background:#0c1624">
        ${rows}
      </table>
    </div>
    <style>
      th,td{border:1px solid #24425c;padding:12px;text-align:left;vertical-align:top}
      th{width:230px;color:#36e4ff;background:#081321}
      td{color:#edf5ff}
    </style>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function redirect(response, location) {
  response.writeHead(303, { Location: location });
  response.end();
}

function renderErrorPage() {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Erro no envio</title><link rel="stylesheet" href="/assets/styles.css"></head><body><main class="section thanks-section"><div class="container"><div class="card thanks-panel"><span class="eyebrow">Erro no envio</span><h1>Não foi possível enviar a solicitação.</h1><p>Verifique se o servidor de e-mail está configurado no arquivo .env e tente novamente.</p><div class="hero-actions"><a class="button" href="/contato.html">Voltar ao contato</a><a class="button secondary" href="/agendamentos.html">Voltar ao agendamento</a></div></div></div></main></body></html>`;
}

function renderNotFoundPage() {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Página não encontrada</title><link rel="stylesheet" href="/assets/styles.css"></head><body><main class="section thanks-section"><div class="container"><div class="card thanks-panel"><span class="eyebrow">404</span><h1>Página não encontrada.</h1><p>O endereço solicitado não existe neste site.</p><div class="hero-actions"><a class="button" href="/index.html">Voltar ao início</a></div></div></div></main></body></html>`;
}
