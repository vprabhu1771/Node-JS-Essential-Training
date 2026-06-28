NGINX can run on Windows for development and testing. For production, Linux is generally recommended because NGINX performs better there.

## 1. Download NGINX

Go to the official website:

[NGINX Downloads](https://nginx.org/en/download.html?utm_source=chatgpt.com)

Download the latest stable Windows ZIP package.

Example:

```
nginx-1.28.0.zip
```

## 2. Extract NGINX

Extract to a folder such as:

```text
C:\nginx
```

You should see:

```text
C:\nginx
├── conf
├── html
├── logs
├── nginx.exe
```

## 3. Start NGINX

Open Command Prompt as Administrator:

```cmd
cd C:\nginx
nginx.exe
```

Verify it is running:

```cmd
tasklist | findstr nginx
```

Open browser:

```text
http://localhost
```

You should see:

```text
Welcome to nginx!
```

## 4. Stop or Reload NGINX

Stop:

```cmd
nginx -s stop
```

Reload configuration:

```cmd
nginx -s reload
```

Quit gracefully:

```cmd
nginx -s quit
```

## 5. Configure Website Root

Edit:

```text
C:\nginx\conf\nginx.conf
```

Default configuration:

```nginx
server {
    listen       80;
    server_name  localhost;

    location / {
        root   html;
        index  index.html index.htm;
    }
}
```

Example custom website:

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root C:/web/myapp;
        index index.html;
    }
}
```

Create:

```text
C:\web\myapp\index.html
```

```html
<h1>Hello NGINX on Windows</h1>
```

Reload:

```cmd
nginx -s reload
```

## 6. Reverse Proxy for Node.js

Suppose your Node.js API runs on port 3000.

```nginx
server {
    listen 80;

    location / {
        proxy_pass http://localhost:3000;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Reload:

```cmd
nginx -s reload
```

Now:

```text
http://localhost
```

will forward requests to:

```text
http://localhost:3000
```

## 7. Use with Flutter Web

Build Flutter web:

```bash
flutter build web
```

Copy contents of:

```text
build/web
```

to:

```text
C:\nginx\html
```

Configure:

```nginx
server {
    listen 80;
    server_name localhost;

    root html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Reload NGINX:

```cmd
nginx -s reload
```

## 8. Run NGINX Automatically on Windows Startup

### Option 1: Task Scheduler

1. Open Task Scheduler
2. Create Task
3. Trigger → At startup
4. Action → Start Program
5. Program:

```text
C:\nginx\nginx.exe
```

### Option 2: Windows Service

Install service manager such as:

[NSSM (Non-Sucking Service Manager)](https://nssm.cc/?utm_source=chatgpt.com)

Then:

```cmd
nssm install nginx
```

Select:

```text
C:\nginx\nginx.exe
```

Start service:

```cmd
net start nginx
```

## Check Configuration

Before reloading:

```cmd
nginx -t
```

Expected:

```text
nginx: configuration file test is successful
```

### Common Ports

| Service               | Port |
| --------------------- | ---- |
| HTTP                  | 80   |
| HTTPS                 | 443  |
| Node.js               | 3000 |
| Laravel Artisan       | 8000 |
| Flutter Web via NGINX | 80   |

For your Flutter + Node.js sync project, a common setup is:

```text
Internet
    ↓
NGINX (80/443)
    ↓
Node.js API (3000)
    ↓
MySQL
```

This gives URL routing, SSL support, reverse proxying, and better performance.
