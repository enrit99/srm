FROM python:3.12-slim

WORKDIR /app

# Copia prima requirements per sfruttare la cache Docker
# (se requirements.txt non cambia, questo layer non viene ricostruito)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Crea la directory per il DB se non esiste
RUN mkdir -p data uploads

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
