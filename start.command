#!/bin/bash
cd "$(dirname "$0")"
echo "=========================================================="
echo "  Iniciando Sistema de Particulas 3D con IA y Vision Web  "
echo "=========================================================="
echo "Abriendo navegador en http://localhost:5500..."

# Esperar un segundo y abrir en el navegador por defecto
(sleep 1 && open "http://localhost:5500") &

# Iniciar servidor local
python3 -m http.server 5500

