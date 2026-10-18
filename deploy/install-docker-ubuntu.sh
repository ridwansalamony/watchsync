#!/usr/bin/env bash
set -eu
if [ "$(id -u)" -ne 0 ]; then echo 'Jalankan sebagai root.'; exit 1; fi
. /etc/os-release
if [ "$ID" != ubuntu ]; then echo 'Skrip ini khusus Ubuntu.'; exit 1; fi
if command -v docker >/dev/null 2>&1; then docker --version; docker compose version; exit 0; fi
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
task_codename="${UBUNTU_CODENAME:-$VERSION_CODENAME}"
task_arch="$(dpkg --print-architecture)"
cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $task_codename
Components: stable
Architectures: $task_arch
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker --version
docker compose version
