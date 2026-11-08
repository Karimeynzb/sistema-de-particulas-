# Sistema de Partículas 3D con IA y Visión por Computadora

Web interactiva que genera sistemas de partículas en 3D interactivos, incorporando inteligencia artificial y visión por computadora mediante **Three.js** y **MediaPipe Hands**.

---

## 🚀 Cómo Ejecutar

Para permitir el acceso a la cámara web en el navegador por razones de seguridad (política de origen seguro del navegador), abre el proyecto con un servidor local:

### Opción 1: VS Code (Live Server)
1. Instala la extensión **Live Server** en Visual Studio Code.
2. Haz clic derecho en `index.html` y selecciona **"Open with Live Server"**.

### Opción 2: Python (Terminal)
Ejecuta en la terminal dentro de esta carpeta:
```bash
python3 -m http.server 5500
```
Luego abre tu navegador en:
`http://localhost:5500`

---

## 🖐️ Controles por Gestos de la Mano (Visión IA)

Pon tu mano frente a la cámara web para interactuar con las partículas en tiempo real:

| Gesto | Acción | Descripción |
| :--- | :--- | :--- |
| 🖐️ **Open Palm** (Palma Abierta) | **Expand & Rotate** | Expande la nube de partículas en 3D y acelera la rotación. |
| ✊ **Closed Fist** (Puño Cerrado) | **Switch Shape** | Cada vez que cierras el puño, cambia fluidamente a la siguiente figura (`Sphere` &rarr; `Heart` &rarr; `Flower` &rarr; `Saturn` &rarr; `Fireworks`). |
| 🤏 **Pinch** (Pellizco) | **Quick Trigger** | Alternar figura rápidamente juntando pulgar e índice. |
| ↔️ **Hand Distance** (Distancia de Mano) | **Change Colors** | Acercar o alejar la mano de la cámara altera el espectro cromático y los colores de las partículas. |
| 📍 **Hand Tracking** (Posición X, Y) | **3D Tilt** | Mover la mano rota e inclina la nube de partículas siguiendo tus movimientos. |

---

## 🖱️ Controles Alternativos (Ratón y Teclado)
Si no cuentas con cámara web o prefieres control manual:
- **Arrastrar con el ratón**: Rota la vista 3D.
- **Rueda del ratón**: Zoom in / Zoom out.
- **Teclas 1 al 5**: Selecciona directamente una figura:
  - `1`: Sphere
  - `2`: Heart
  - `3`: Flower
  - `4`: Saturn
  - `5`: Fireworks
- **Barra Espaciadora**: Cambia a la siguiente figura.
- **Tecla F**: Alterna pantalla completa (*Fullscreen*).
- **Botones inferiores**: Haz clic en cualquier figura para seleccionarla.
