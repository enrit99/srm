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

## 11. Backup automatici

Backup giornalieri cifrati su **Cloudflare R2** (10 GB free tier, no egress fees). Pipeline: snapshot consistente SQLite → tar.gz → cifratura `age` → upload `rclone` → retention automatica.

### Cosa viene backupato

- `data/srm.db` — database SQLite (snapshot consistente via `.backup` API)
- `uploads/` — allegati caricati dagli utenti
- `.env` — necessario per `SECRET_KEY` (senza, tutti i JWT esistenti diventano invalidi)

Codice e configurazione (`docker-compose.yml`, `Caddyfile`) NON sono backupati perché già in Git.

### 11.1 Crea bucket R2

Su Cloudflare Dashboard → **R2 → Crea bucket**:
- Nome: `srm-backups`
- Location: scelta più vicina (es. EU)

### 11.2 Crea API token scoped

Su **R2 → Panoramica → Account Details → Token API → Gestisci → Crea token API**:

| Campo | Valore |
|---|---|
| Nome | `srm-backup-rclone` |
| Tipo | User API Token |
| Permissions | **Object Read & Write** |
| Specify bucket(s) | **`srm-backups`** (scope minimo, principio di least privilege) |
| TTL | Forever o 1 anno con calendar reminder |

Cloudflare mostra **una sola volta**: Access Key ID, Secret Access Key, Endpoint. Salvali subito in un password manager. L'Account ID è anche derivabile dall'endpoint (la prima parte del subdominio).

### 11.3 Installa strumenti sul VPS

```bash
sudo apt update
sudo apt install -y rclone age sqlite3
```

> **Nota:** `sqlite3` è necessario sull'host per il comando `.backup`. In alternativa il backup può essere eseguito dentro al container backend (`docker compose exec backend sqlite3 ...`), ma aggiunge dipendenza Docker nello script.

### 11.4 Configura rclone

```bash
rclone config
```

Compila così:
n) New remote
name> r2
Storage> s3
provider> Cloudflare
env_auth> false
access_key_id> <Access Key ID dal token>
secret_access_key> <Secret Access Key dal token>
region> auto
endpoint> https://<account-id>.r2.cloudflarestorage.com
location_constraint>     (vuoto)
acl>                     (vuoto)

Modifica manualmente `~/.config/rclone/rclone.conf` per aggiungere `no_check_bucket = true`. Risultato finale:

```ini
[r2]
type = s3
provider = Cloudflare
access_key_id = ...
secret_access_key = ...
region = auto
endpoint = https://<account-id>.r2.cloudflarestorage.com
no_check_bucket = true
```

> **Insidia importante #1:** senza `no_check_bucket = true`, rclone fa un `HeadBucket` prima di scrivere ogni oggetto. Con un token scoped al singolo bucket questo check fallisce con 403 (manca permesso a livello account), e nessun upload funziona. L'opzione disabilita il check.

> **Insidia #2:** non aggiungere `bucket_acl = private`. Cloudflare R2 non supporta gli ACL S3 tradizionali e l'header viene ignorato (in alcuni casi causa 403).

> **Insidia #3:** non eseguire mai `rclone` con `sudo`. Il config è per-utente in `~/.config/rclone/`. `sudo` cerca in `/root/.config/rclone/` e non trova nulla.

Test connessione:
```bash
echo "ping" > /tmp/rclone-test.txt
rclone copy /tmp/rclone-test.txt r2:srm-backups/
rclone ls r2:srm-backups   # deve mostrare rclone-test.txt con dimensione 5
rclone delete r2:srm-backups/rclone-test.txt
rm /tmp/rclone-test.txt
```

### 11.5 Genera chiave di cifratura age

```bash
mkdir -p ~/.config/srm-backup
age-keygen -o ~/.config/srm-backup/key.txt
chmod 600 ~/.config/srm-backup/key.txt
```

Il file contiene chiave pubblica (commento) e chiave privata (`AGE-SECRET-KEY-...`).

> 🚨 **CRITICO:** la chiave privata è l'**unica** via per decifrare i backup. Se la perdi insieme al server, i backup sono inutilizzabili. Salva una copia su:
> - Password manager (Bitwarden / 1Password)
> - USB criptata in luogo fisico sicuro
> - Stampata su carta in cassaforte (per i paranoici metodici)

Estrai la chiave pubblica per lo script:
```bash
grep "public key" ~/.config/srm-backup/key.txt
```

### 11.6 Script di backup

```bash
nano ~/srm/backup.sh
chmod +x ~/srm/backup.sh
```

```bash
#!/bin/bash
set -euo pipefail

PROJECT_DIR="/home/enrico/srm"
BACKUP_DIR="/home/enrico/backups"
REMOTE="r2:srm-backups"
AGE_PUBKEY="age1xxxxxxxxxxxxxxxxxxxx"   # chiave pubblica age
RETENTION_LOCAL_DAYS=3
RETENTION_REMOTE_DAYS=90

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TMP_DB="${PROJECT_DIR}/data/srm.db.snapshot"
ARCHIVE="${BACKUP_DIR}/srm_${TIMESTAMP}.tar.gz.age"

# Snapshot DB consistente (gestisce scritture concorrenti)
sqlite3 "${PROJECT_DIR}/data/srm.db" ".backup '${TMP_DB}'"

# Archivia + cifra in unica pipe (zero file intermedio in chiaro)
tar -czf - \
    -C "${PROJECT_DIR}" \
    --transform 's,data/srm.db.snapshot,data/srm.db,' \
    "data/srm.db.snapshot" \
    "uploads" \
    ".env" \
    | age -r "$AGE_PUBKEY" > "$ARCHIVE"

rm -f "$TMP_DB"

# Upload
rclone copy "$ARCHIVE" "$REMOTE/" --quiet

# Retention locale
find "$BACKUP_DIR" -name "srm_*.tar.gz.age" -mtime +${RETENTION_LOCAL_DAYS} -delete

# Retention remota
rclone delete "$REMOTE" --min-age "${RETENTION_REMOTE_DAYS}d" --quiet

SIZE=$(du -h "$ARCHIVE" | cut -f1)
echo "[$(date)] Backup OK: ${ARCHIVE##*/} (${SIZE}) → ${REMOTE}"
```

> **Insidia #4:** il file `data/srm.db` è di proprietà `root:root` perché il container backend gira come root. Lo script come `enrico` non può scrivere `srm.db.snapshot` nella cartella `data/`. Fix:
> ```bash
> sudo chown -R enrico:enrico ~/srm/data ~/srm/uploads
> ```
> Da rieseguire periodicamente finché il container non gira con UID matched (Fase 6 della roadmap).

Test manuale:
```bash
~/srm/backup.sh
rclone ls r2:srm-backups   # deve mostrare srm_<timestamp>.tar.gz.age
```

### 11.7 Cron giornaliero

```bash
crontab -e
```

```cron
0 3 * * * /home/enrico/srm/backup.sh >> /home/enrico/srm/backup.log 2>&1
```

L'orario 03:00 minimizza concorrenza con eventuali utilizzi reali. Verifica successivamente:
```bash
tail -20 /home/enrico/srm/backup.log
```

### 11.8 Procedura di restore (testata, non solo teorica)

```bash
# 1. Scarica un backup specifico
mkdir -p /tmp/restore
rclone copy r2:srm-backups/srm_YYYYMMDD_HHMMSS.tar.gz.age /tmp/restore/

# 2. Decifra
age -d -i ~/.config/srm-backup/key.txt /tmp/restore/srm_*.age > /tmp/restore/backup.tar.gz

# 3. Ispeziona prima di estrarre
tar -tzf /tmp/restore/backup.tar.gz | head -20

# 4. Estrai in directory di lavoro
mkdir -p /tmp/restore/extracted
tar -xzf /tmp/restore/backup.tar.gz -C /tmp/restore/extracted/

# 5. Verifica integrità DB
sqlite3 /tmp/restore/extracted/data/srm.db "PRAGMA integrity_check;"
# deve rispondere "ok"

# 6. Restore in produzione (DESTRUTTIVO sul DB attuale!)
cd ~/srm
docker compose down
sudo chown -R enrico:enrico ~/srm/data ~/srm/uploads   # vedi insidia #4
cp -r /tmp/restore/extracted/* ~/srm/
docker compose up -d

# 7. Verifica nel browser e cleanup
rm -rf /tmp/restore
```

### 11.9 Costi e limiti del free tier

Cloudflare R2 free tier:
- **10 GB storage** — backup tipico di SRM (DB + uploads piccoli) sta sotto i 10 MB; con retention 90 giorni siamo ampiamente nel free tier per anni
- **1M Class A operations/mese** (write-like) — un upload al giorno = 30/mese
- **10M Class B operations/mese** (read-like) — irrilevante per soli backup
- **Egress: gratuito sempre** — quando dovrai fare restore non paghi nulla

Se il free tier sarà mai superato (improbabile), il costo è $0.015/GB/mese di storage.

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
