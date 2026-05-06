# Solux Tecnologia

Site institucional com páginas de serviços, contato, agendamentos, FAQ, central do cliente e envio de formulários por e-mail.

## Como rodar localmente

1. Copie o arquivo `.env.example` para `.env`.

2. Preencha o `.env` com os dados do Gmail:

```env
SMTP_USER=soluxtecnologialtda@gmail.com
SMTP_PASS=SENHA_DE_APP_DO_GMAIL
MAIL_TO=soluxtecnologialtda@gmail.com
```

3. Inicie o site:

```bash
npm start
```

4. Abra:

```text
http://127.0.0.1:5500
```

## Importante sobre Gmail

Para o envio funcionar com Gmail, use uma senha de app do Google. Não use a senha normal da conta.

O caminho no Google normalmente é:

Conta Google > Segurança > Verificação em duas etapas > Senhas de app.

## Formulários

- `agendamentos.html` envia para `/api/agendamento`.
- `contato.html` envia para `/api/contato`.
- O servidor envia os dados para `MAIL_TO`, configurado no `.env`.

## Hospedagem

Este pacote precisa de hospedagem com Node.js para o envio de e-mail funcionar. Exemplos: Render, Railway, VPS, servidor próprio ou hospedagem que aceite Node.

Se hospedar apenas como site estático, as páginas aparecem, mas o envio por e-mail do backend não funciona.

## Dependências

O servidor usa apenas recursos nativos do Node.js. Não precisa instalar pacotes externos para enviar e-mail.
