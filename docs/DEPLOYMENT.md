# Deployment Guide

Guida step-by-step per deployare SRM su un VPS pulito. Tempo stimato: 30-45 minuti.

## Prerequisiti

- VPS con Ubuntu 24.04 LTS (testato su Hetzner CX22, 2 vCPU / 4 GB RAM)
- Dominio con DNS gestibile (Cloudflare, Aruba, etc.)
- Account GitHub con accesso al repo
- Una chiave SSH locale (`~/.ssh/id_ed25519` o equivalente)

---

## 1. Setup VPS

### Connessione e hardening base

```bash
ssh root@VPS_IP

# Aggiorna sistema
apt update && apt upgrade -y

# Crea utente non-root
adduser enrico
usermod -aG sudo enrico
rsync --archive --chown=enrico:enrico ~/.ssh /home/enrico

# Disabilita login root via SSH
sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh   # nota: su Ubuntu 24.04 il servizio è "ssh", non "sshd"

# Installa fail2ban
apt install -y fail2ban
systemctl enable --now fail2ban

exit  # esci da root, riconnetti come enrico
ssh enrico@VPS_IP
```

### Installa Docker

```bash
sudo apt install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker

# Verifica
docker --version && docker compose version
```

---

## 2. SSH key per GitHub

```bash
ssh-keygen -t ed25519 -C "github-srm-server" -f ~/.ssh/github_ed25519
cat ~/.ssh/github_ed25519.pub
```

Aggiungi la public key in GitHub: **Settings → SSH and GPG keys → New SSH key**.

```bash
nano ~/.ssh/config
```

```
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_ed25519
    IdentitiesOnly yes
```

```bash
chmod 600 ~/.ssh/config ~/.ssh/github_ed25519
ssh -T git@github.com  # deve dire "Hi <username>! You've successfully authenticated..."
```

---

## 3. Clone repo

```bash
cd ~
git clone git@github.com:TUO_USERNAME/srm.git
cd srm
```

---

## 4. Configurazione `.env`

```bash
cp .env.example .env
nano .env
```

Genera una `SECRET_KEY` casuale di 64 caratteri:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Incolla il risultato come valore di `SECRET_KEY`. Lascia `DATABASE_URL` invariato.

---

## 5. Configurazione DNS

Sul tuo gestore DNS, crea un record:

| Type | Name | Value |
|---|---|---|
| A | `srm` (o quello che vuoi) | IP del VPS |

Se usi Cloudflare: imposta il record in modalità **DNS only** (nuvola grigia) — la modalità "Proxied" interferisce con la verifica ACME di Let's Encrypt.

Verifica propagazione:
```bash
nslookup srm.tuodominio.it
```

---

## 6. Configurazione Caddy

```bash
nano Caddyfile
```

Cambia `srm.devtse.it` con il tuo dominio:

```caddyfile
srm.tuodominio.it {
    handle /api/* {
        reverse_proxy backend:8000
    }
    handle {
        reverse_proxy frontend:5173
    }
}
```

Aggiorna anche `CORSMiddleware.allow_origins` in `backend/app/main.py` con il tuo dominio reale.

---

## 7. Avvia tutto

```bash
docker compose up -d --build
docker compose logs -f
```

Caddy ottiene il certificato Let's Encrypt automaticamente al primo avvio (può richiedere 30-60 secondi). Cerca nei log la riga `certificate obtained successfully`.

---

## 8. Inizializza il database

```bash
docker compose exec backend alembic upgrade head
```

---

## 9. Crea il primo utente

Apri `https://srm.tuodominio.it/api/v1/docs` → `POST /auth/register` → Try it out → invia username, email, password. Status 201 = utente creato.

---

## 10. Verifica finale

Apri `https://srm.tuodominio.it` nel browser. Devi vedere la pagina di login.

---

## Manutenzione comune

### Aggiornare il codice da Git
```bash
cd ~/srm
git pull
docker compose up -d --build
docker compose exec backend alembic upgrade head
```

### Backup del database
```bash
cp data/srm.db data/srm.db.backup-$(date +%Y%m%d)
```

### Visualizzare i log
```bash
docker compose logs -f backend     # solo backend
docker compose logs --tail 100     # ultime 100 righe di tutto
```

### Restart di un singolo servizio
```bash
docker compose restart caddy
```

### Reload Caddy senza downtime (dopo modifica Caddyfile)
```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```
