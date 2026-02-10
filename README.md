# Veterinaria Huellas — Taller Ingeniería de Software

Aplicación web responsive para la gestión de reservas online de la veterinaria **Huellas**.
Permite a los clientes reservar turnos y al administrador visualizar la agenda de reservas.

Proyecto desarrollado como parte del **Taller de Ingeniería de Software — ORT**.
---

## Funcionalidades principales

* Reserva de turnos online por servicio (Veterinaria / Estética-Baño)
* Generación dinámica de horarios según duración del servicio
* Validación de disponibilidad por fecha y servicio
* Confirmación de reserva por email (EmailJS)
* Persistencia de datos en LocalStorage
* Vista de agenda para administrador
* Diseño responsive (desktop y mobile)

---

## Tecnologías utilizadas

* HTML5
* CSS3
* JavaScript (Vanilla JS)
* LocalStorage
* EmailJS (envío de confirmaciones por email)

---

## Estructura del proyecto

```
src/
 ├── core/
 │    └── reservas.js   → lógica de negocio y validaciones
 ├── app.js             → interacción con la interfaz
 ├── index.html
 └── assets/
```

El proyecto sigue una separación entre:

* **Core:** lógica pura y reglas de negocio
* **App:** interacción con el DOM

---

## Cómo ejecutar el proyecto

1. Clonar el repositorio:

```
git clone <repo-url>
```

2. Abrir el proyecto en un navegador:

Abrir el archivo **index.html** o usar una extensión como *Live Server* en VS Code.

No requiere backend ni instalación de dependencias.

---

## Configuración de EmailJS

Para habilitar el envío de emails:

1. Crear cuenta en [https://emailjs.com](https://emailjs.com)
2. Crear un servicio de email (Outlook recomendado)
3. Crear un template con las variables:

```
{{email}}
{{mascota}}
{{servicio}}
{{fecha}}
{{hora}}
```

4. Configurar **Service ID**, **Template ID** y **Public Key** en `app.js`

---

## Equipo

* Mateo Rodríguez Pintos
* Lucía Castro Leira
* Sergio Altesor Casas

**Grupo N3.5 B — ORT**
