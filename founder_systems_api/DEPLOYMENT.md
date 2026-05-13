# Founder Systems API Deployment

This API already reads `FS_`-prefixed settings from a local `.env` file and creates its tables on startup. For production, run it behind `nginx`, store data in Postgres, and keep the service working directory at the API folder so `.env` is discovered correctly.

## 1. Prepare the host

Install Python 3.12+, Postgres 15+, `nginx`, and a process user such as `founder`.

```bash
sudo mkdir -p /opt/founder-systems
sudo chown "$USER":"$USER" /opt/founder-systems
git clone <repo-url> /opt/founder-systems
cd /opt/founder-systems/founder_systems_api
python3 -m venv .venv
. .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.production.example .env
```

Update `.env` with real secrets, live frontend URLs, and a Postgres DSN before starting the service.

## 2. Create Postgres database and user

```sql
CREATE USER founder_systems WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE founder_systems OWNER founder_systems;
GRANT ALL PRIVILEGES ON DATABASE founder_systems TO founder_systems;
```

Then set:

```env
FS_DATABASE_URL=postgresql+psycopg://founder_systems:CHANGE_ME@127.0.0.1:5432/founder_systems
```

## 3. Install the systemd service

Use `deploy/systemd/founder-systems-api.service.example` as the starting point, then install it:

```bash
sudo cp deploy/systemd/founder-systems-api.service.example /etc/systemd/system/founder-systems-api.service
sudo systemctl daemon-reload
sudo systemctl enable founder-systems-api
sudo systemctl start founder-systems-api
sudo systemctl status founder-systems-api
```

The example keeps `WorkingDirectory` at `/opt/founder-systems/founder_systems_api`, which matters because `app.config.Settings` loads `.env` from the current directory.

## 4. Install the nginx site

Use `deploy/nginx/founder-systems-api.conf.example` as the starting point:

```bash
sudo cp deploy/nginx/founder-systems-api.conf.example /etc/nginx/sites-available/founder-systems-api.conf
sudo ln -s /etc/nginx/sites-available/founder-systems-api.conf /etc/nginx/sites-enabled/founder-systems-api.conf
sudo nginx -t
sudo systemctl reload nginx
```

Replace the placeholder certificate paths and `server_name` with the real API hostname. Keep `FS_SESSION_COOKIE_SECURE=true` in production when traffic is HTTPS-terminated at nginx.

## 5. Smoke checks

```bash
curl http://127.0.0.1:8000/health
curl -I https://api.foundersystems.in/health
sudo journalctl -u founder-systems-api -n 100 --no-pager
```

Expected health response:

```json
{"status":"ok","service":"Founder Systems API","env":"production"}
```

## Notes

- `FS_RESEND_API_KEY` and `FS_RESEND_FROM_EMAIL` should be set in production. If omitted, magic links are only printed to stdout.
- `FS_ALLOW_MOCK_PAYMENTS` should stay `false` in production so real Razorpay credentials and webhook signatures are required.
- The app currently relies on `Base.metadata.create_all(...)` on startup rather than migrations. That is enough for first deploys, but schema changes should add a real migration workflow before future production updates.
