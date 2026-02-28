# Installation Guide - Native Systemd Runtime

This guide covers setting up Zona Xtreme Operation System on a Fedora server without Docker, using native systemd services.

## Prerequisites

- Fedora Server (tested on Fedora 39+)
- Internet access for initial setup (optional for runtime)
- sudo/administrator access

## 1. System Dependencies

### Install PostgreSQL 16
```bash
# Install PostgreSQL
sudo dnf install -y postgresql16-server postgresql16

# Initialize database
sudo /usr/bin/postgresql-16-setup --initdb

# Enable and start service
sudo systemctl enable --now postgresql

# Configure local connections
sudo sed -i -E 's/^host[[:space:]]+all[[:space:]]+all[[:space:]]+127\.0\.0\.1\/32[[:space:]]+ident/host all all 127.0.0.1\/32 md5/' /var/lib/pgsql/data/pg_hba.conf

# Restart to apply changes
sudo systemctl restart postgresql
```

### Create Database User and Database
```bash
# Create user and database
sudo -u postgres psql <<EOF
CREATE USER zx_user WITH PASSWORD 'zx_password';
CREATE DATABASE zx_op OWNER zx_user;
GRANT ALL PRIVILEGES ON DATABASE zx_op TO zx_user;
\q
EOF
```

### Install Node.js and pnpm
```bash
# Install Node.js 20
sudo dnf install -y nodejs npm

# Install pnpm globally
npm install -g pnpm

# Verify installation
node --version
pnpm --version
```

## 2. Application User

```bash
# Create application user
sudo useradd -m -s /bin/bash zx

# Grant systemctl permissions without password (optional)
echo "zx ALL=(ALL) NOPASSWD: /usr/bin/systemctl" | sudo tee /etc/sudoers.d/zx-systemctl
```

## 3. Application Setup

```bash
# Switch to application user
sudo su - zx

# Clone repository
git clone https://github.com/galiprandi/zx-op.git
cd zx-op

# Checkout Docker-free branch
git checkout feature/server-runtime-without-docker

# Install dependencies
pnpm install --frozen-lockfile

# Create logs directory
mkdir -p ops/logs
```

## 4. Systemd Services

```bash
# Install and enable services
sudo ./ops/install-services.sh

# Verify installation
systemctl list-unit-files | grep zx-
```

## 5. Initial Startup

```bash
# Start the complete system (build + restart services)
./start-app.sh
```

## 6. Verification

```bash
# Check service status
systemctl status zx-api.service zx-ui.service

# Check logs if needed
journalctl -u zx-api.service -f
journalctl -u zx-ui.service -f

# Test endpoints
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:4173/
```

## 7. GitHub Actions Runner (Optional)

If using automated deployments:

```bash
# Install and configure GitHub Actions runner
# Follow official GitHub documentation
# Ensure runner user can execute pnpm and systemctl
```

## 8. Operations

### Quick Restart (no rebuild)
```bash
./ops/restart-services.sh
```

### Full Restart (with rebuild)
```bash
./start-app.sh
```

### View Logs
```bash
# Application logs
tail -f ops/logs/zx-api.out.log
tail -f ops/logs/zx-ui.out.log

# Systemd logs
journalctl -u zx-api.service -f
journalctl -u zx-ui.service -f
```

## 9. Environment Configuration

Edit `.env` file as needed:

```env
# Database
DATABASE_URL=postgresql://zx_user:zx_password@localhost:5432/zx_op

# Ports
API_PORT=3000
UI_PORT=4173
SOCKET_PORT=4000

# External access (auto-detected on startup)
PUBLIC_API_BASE_URL=http://127.0.0.1
VITE_API_BASE_URL=http://127.0.0.1
VITE_API_BASE_PORT=3000
```

## 10. Troubleshooting

### PostgreSQL Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U zx_user -d zx_op -c "SELECT 1;"
```

### Service Issues
```bash
# Check detailed service status
systemctl status zx-api.service
journalctl -u zx-api.service -n 50

# Manually start services
sudo systemctl start zx-api.service zx-ui.service
```

### Permission Issues
```bash
# Fix file ownership
sudo chown -R zx:zx /home/zx/zx-op

# Fix permissions
chmod +x ops/*.sh
```

## 11. Firewall Configuration

```bash
# Open required ports
sudo firewall-cmd --permanent --add-port=3000/tcp  # API
sudo firewall-cmd --permanent --add-port=4173/tcp  # UI
sudo firewall-cmd --reload
```

## 12. Reverting to Docker (if needed)

```bash
# Switch back to Docker branch
git checkout main

# Follow Docker-based README instructions
```

## 13. Offline Operation

Once installed, the system works without internet:

- IP address is auto-detected on each startup
- Services run locally using cached dependencies
- Updates only require internet when GitHub runner pulls changes

## Support

For issues:
1. Check logs in `ops/logs/` and `journalctl`
2. Verify PostgreSQL connectivity
3. Ensure all dependencies are installed
4. Review `specs/deployment-sync-spec.md` for detailed architecture
