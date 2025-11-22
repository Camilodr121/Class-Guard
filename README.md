# 📘 Manual de Usuario: Class Guard
### Sistema de Monitoreo de Atención Basado en Machine Learning

**Bienvenido a Class Guard.**
Sabemos que la educación virtual presenta retos únicos, tanto para quien enseña como para quien aprende. Este manual está diseñado para guiarte paso a paso en el uso de nuestra plataforma, la cual utiliza modelos de **Machine Learning** entrenados para interpretar señales no verbales (como el parpadeo y los gestos) y traducirlas en métricas útiles de atención y energía.

---

## 📑 Tabla de Contenidos

1.  [¿Cómo funciona Class Guard?](#1-cómo-funciona-class-guard)
2.  [Primeros Pasos: Acceso al Sistema](#2-primeros-pasos-acceso-al-sistema)
3.  [Guía para el Estudiante](#3-guía-para-el-estudiante)
    *   [Tu Panel de Energía](#31-tu-panel-de-energía)
    *   [Durante la Clase](#32-durante-la-clase)
4.  [Guía para el Profesor](#4-guía-para-el-profesor)
    *   [Panel de Control de Clases](#41-panel-de-control-de-clases)
    *   [Monitoreo en Tiempo Real](#42-monitoreo-en-tiempo-real)
    *   [Alertas Inteligentes](#43-alertas-inteligentes)
    *   [Mejorando tu Metodología](#44-mejorando-tu-metodología)
5.  [Preguntas Frecuentes y Soluciones](#5-preguntas-frecuentes-y-soluciones)

---

## 1. ¿Cómo funciona Class Guard?

Class Guard no graba video. El sistema utiliza un motor de Machine Learning que procesa señales biométricas en tiempo real para garantizar la privacidad y la eficiencia.

graph TD
subgraph Cliente [Navegador del Estudiante]
A[📷 Captura de Video] -->|Stream en vivo| B(🔍 Detección Facial)
B --> C{Extracción de Puntos}
C -->|Ojos| D[Cálculo EAR - Parpadeo]
C -->|Boca| E[Cálculo MAR - Bostezos]
end

subgraph Procesamiento [Motor de Machine Learning]
    D & E --> F[🧠 Modelo Predictivo]
    F -->|Clasificación| G[Nivel de Atención %]
end

subgraph Acciones [Respuesta del Sistema]
    G --> H{¿Atención Crítica?}
    H -->|No - Normal| I[✅ Actualizar Dashboard]
    H -->|Sí - Alerta| J[🚨 Notificar al Profesor]
    J --> K[Registro en Historial]
end

style A fill:#f9f,stroke:#333,stroke-width:2px
style F fill:#bbf,stroke:#333,stroke-width:2px
style J fill:#f96,stroke:#333,stroke-width:2px
undefined

---

## 2. Primeros Pasos: Acceso al Sistema

Para comenzar, necesitamos identificar tu rol en la institución. El sistema es seguro y tus datos están protegidos.

> **📸 INSERTAR AQUÍ: Captura de la pantalla de Login**
> *(Toma la captura en la ruta: `/login`)*
>
> **En la imagen superior puedes observar:**
> Nuestra interfaz de bienvenida. Aquí deberás ingresar tu correo institucional y contraseña. El sistema, gracias a su backend robusto, detectará automáticamente si eres **Profesor** o **Estudiante** y te llevará al entorno adecuado para ti.

---

## 3. Guía para el Estudiante

Tu bienestar es importante. Class Guard te ayuda a ser consciente de tu cansancio para que puedas gestionar mejor tu energía durante el estudio.

### 3.1 Tu Panel de Energía

Al entrar, verás un resumen de tu estado actual. No es para juzgarte, sino para informarte.

> **📸 INSERTAR AQUÍ: Captura del Dashboard Principal del Estudiante**
> *(Toma la captura en la ruta: `/dashboard/student`)*
>
> **En la imagen superior puedes observar:**
> *   **Tu Nivel de Energía:** Un indicador visual que te dice si estás "Fresco", "Estable" o "Necesitas un descanso".
> *   **Historial Reciente:** Una gráfica amigable que muestra cómo ha fluctuado tu atención en las últimas sesiones.

### 3.2 Durante la Clase

Cuando te unes a una clase en vivo, el sistema te acompaña silenciosamente.

> **📸 INSERTAR AQUÍ: Captura de la Vista "Live" del Estudiante**
> *(Toma la captura en la ruta: `/dashboard/student/live` con la cámara activa)*
>
> **En la imagen superior puedes observar:**
> *   **Tu Espejo Digital:** Un recuadro pequeño donde puedes verificar que tu cámara te enfoca bien.
> *   **Feedback en Vivo:** Si el sistema detecta, por ejemplo, muchos bostezos seguidos, verás un aviso suave sugiriéndote estirarte o tomar agua. ¡Es como un asistente personal de salud!

---

## 4. Guía para el Profesor

Class Guard es tu copiloto. Te ayuda a entender qué estudiantes se están "desconectando" para que puedas traerlos de vuelta antes de que pierdan el hilo de la clase.

### 4.1 Panel de Control de Clases

Aquí tienes la vista de pájaro de todos tus cursos.

> **📸 INSERTAR AQUÍ: Captura del Dashboard General del Profesor**
> *(Toma la captura en la ruta: `/dashboard/teacher/overview`)*
>
> **En la imagen superior puedes observar:**
> Tarjetas individuales por cada materia que dictas. De un vistazo rápido, puedes ver el **Promedio Global de Atención** de cada grupo. Si una clase está en rojo antes de empezar, sabes que tendrás que poner un extra de energía hoy.

### 4.2 Monitoreo en Tiempo Real

Esta es la herramienta más potente. Mientras dictas tu clase, ten esta ventana abierta.

> **📸 INSERTAR AQUÍ: Captura de la Grilla de Estudiantes en Vivo**
> *(Toma la captura en la ruta: `/dashboard/teacher/live/[id]`)*
>
> **En la imagen superior puedes observar:**
> Una matriz con todos tus estudiantes conectados.
> *   **Semáforo de Atención:** Los marcos de cada estudiante cambian de color (Verde, Amarillo, Rojo) según el análisis del Machine Learning.
> *   **Indicadores Específicos:** Iconos pequeños que indican "Bostezo frecuente" o "Mirada desviada" para que sepas el motivo de la distracción.

### 4.3 Alertas Inteligentes

No necesitas mirar la pantalla todo el tiempo. El sistema te avisará si algo requiere tu intervención inmediata.

> **📸 INSERTAR AQUÍ: Captura de una Notificación de Alerta**
> *(Toma la captura del panel de notificaciones o un pop-up de alerta)*
>
> **En la imagen superior puedes observar:**
> Una alerta clara y directa: *"El estudiante Juan Pérez ha bajado su atención al 30%"*. Esto te permite hacer una pregunta dirigida: *"Juan, ¿qué opinas de este punto?"*, recuperando su atención de manera natural y pedagógica.

### 4.4 Mejorando tu Metodología

El aprendizaje es de doble vía. Si todos los estudiantes pierden atención al mismo tiempo, el sistema te lo hará saber.

> **📸 INSERTAR AQUÍ: Captura de las Analíticas Históricas**
> *(Toma la captura en la ruta: `/dashboard/teacher/analytics`)*
>
> **En la imagen superior puedes observar:**
> Gráficas de tendencia de la sesión.
> *   **El "Valle de la Atención":** Si ves una caída drástica de toda la clase en el minuto 40, la gráfica te lo mostrará. Esto es un indicador valioso para que, en la próxima clase, planees una actividad dinámica justo en ese momento.

---

## 5. Preguntas Frecuentes y Soluciones

Hemos recopilado las situaciones más comunes para ayudarte a resolverlas rápido.

| Situación | ¿Por qué pasa esto? | ¿Cómo lo soluciono? |
| :--- | :--- | :--- |
| **"El sistema no detecta mi rostro"** | Generalmente es por mala iluminación o porque la cámara está muy abajo/arriba. | Asegúrate de tener una fuente de luz frente a ti (no detrás) y centra tu cara en el recuadro. |
| **"Las métricas no cambian"** | Puede haber una micro-desconexión de internet. | Refresca la página del navegador. El sistema de Machine Learning retomará el análisis en segundos. |
| **"Me dice que estoy distraído pero estoy atendiendo"** | A veces, mirar mucho hacia abajo (tomando notas) puede confundir al modelo. | Intenta levantar la mirada hacia la cámara periódicamente. El modelo aprende y se adapta. |
| **"Soy profesor y no recibo alertas"** | Es posible que las notificaciones estén desactivadas en tu navegador. | Revisa el icono de "candado" o "permisos" en la barra de dirección de tu navegador y permite las notificaciones. |

---

> **Nota Final del Equipo de Desarrollo:**
> Class Guard ha sido construido siguiendo los más altos estándares de ingeniería de software y Machine Learning. Nuestro objetivo es crear un puente tecnológico que humanice la educación virtual, no que la robotice. ¡Gracias por usar nuestra plataforma!
