FROM python:3.8-slim

COPY ./app /app
COPY ./entrypoint.sh /entrypoint.sh
COPY ./requirements.txt /requirements.txt

# Optimize apt-get
RUN echo "Acquire::Retries \"3\";" > /etc/apt/apt.conf.d/80-retries && \
    apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    python3-setuptools \
    tesseract-ocr \
    make \
    gcc \
    && python3 -m pip install --no-cache-dir -r requirements.txt \
    && apt-get remove -y --purge make gcc build-essential \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

RUN chmod +x entrypoint.sh

CMD [ "./entrypoint.sh" ]