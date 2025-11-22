📘 Manual de Usuario: Guardia de Clase
Sistema de Monitoreo de Atención Basado en Machine Learning
Bienvenido a Class Guard.
Sabemos que la educación virtual presenta retos únicos, tanto para quien enseña como para quien aprende. Este manual está diseñado para guiarte paso a paso en el uso de nuestra plataforma, la cual utiliza modelos de Machine Learning entrenados para interpretar señales no verbales (como el parpadeo y los gestos) y traducirlas en métricas útiles de atención y energía.

📑 Tabla de Contenidos Interactiva
¿Cómo funciona Class Guard?

Primeros Pasos: Acceso al Sistema

Guía para el Estudiante

Tu Panel de Energía

Durante la clase

Guía para el Profesor

Panel de Control de Clases

Monitoreo en Tiempo Real

Alertas Inteligentes

Mejorando tu Metodología

Preguntas Frecuentes y Soluciones

1. ¿Cómo funciona Class Guard?
Class Guard no graba vídeo. En su lugar, utilice un proceso avanzado de procesamiento de datos en tiempo real. Aquí te explicamos el flujo lógico de lo que sucede "bajo el capó":

🧠 Flujo de Procesamiento de Datos
texto
graph TD
    A[👤 Estudiante frente a Cámara] -->|Captura de video en vivo| B(🔍 Detección de Puntos Faciales)
    B -->|Extracción de características| C{⚙️ Algoritmo de Machine Learning}
    
    subgraph "Análisis Biomético"
    C -->|Frecuencia de Parpadeo| D[Cálculo de Fatiga Ocular]
    C -->|Apertura de Boca| E[Detección de Bostezos]
    end
    
    D & E --> F[📊 Cálculo de Nivel de Atención]
    F --> G{¿Nivel Crítico?}
    
    G -->|No| H[Actualizar Dashboard Estudiante]
    G -->|Sí| I[🚨 Enviar Alerta al Profesor]
    
    I --> J[Profesor recibe notificación específica]
    H --> K[Estudiante ve su nivel de energía]
2. Primeros Pasos: Acceso al Sistema
Para comenzar, necesitamos identificar su rol en la institución. El sistema es seguro y tus datos están protegidos.

📸 INSERTAR AQUÍ: Captura de la pantalla de inicio de sesión
Toma la captura en la ruta:/login

En la imagen superior puedes observar:
Nuestra interfaz de bienvenida. Aquí deberás ingresar tu correo institucional y contraseña. El sistema, gracias a su backend robusto, detectará automáticamente si eres Profesor o Estudiante y te llevará al entorno adecuado para ti.

3. Guía para el Estudiante
Tu bienestar es importante. Class Guard te ayuda a ser consciente de tu cansancio para que puedas gestionar mejor tu energía durante el estudio.

3.1 Tu Panel de Energía
Al entrar, verás un resumen de tu estado actual. No es para juzgarte, sino para informarte.

📸 INSERTAR AQUÍ: Captura del Dashboard Principal del Estudiante
Toma la captura en la ruta:/dashboard/student

En la imagen superior puedes observar:

Tu Nivel de Energía: Un indicador visual que te dice si estás "Fresco", "Estable" o "Necesitas un descanso".

Historial Reciente: Una gráfica amigable que muestra cómo ha fluctuado tu atención en las últimas sesiones.

3.2 Durante la Clase
Cuando te unes a una clase en vivo, el sistema te acompaña silenciosamente.

📸 INSERTAR AQUÍ: Captura de la Vista "Live" del Estudiante
Toma la captura en la ruta: /dashboard/student/livecon la cámara activa.

En la imagen superior puedes observar:

Tu Espejo Digital: Un recuadro pequeño donde puedes verificar que tu cámara te enfoca bien.

Feedback en Vivo: Si el sistema detecta, por ejemplo, muchos bostezos seguidos, verás un aviso suave sugiriéndote estirarte o tomar agua. ¡Es como un asistente personal de salud!

4. Guía para el Profesor
Class Guard es tu copiloto. Te ayuda a entender qué estudiantes se están "desconectando" para que puedas traerlos de vuelta antes de que pierdan el hilo de la clase.

4.1 Panel de Control de Clases
Aquí tienes la vista de pájaro de todos tus cursos.

📸 INSERTAR AQUÍ: Captura del Dashboard General del Profesor
Toma la captura en la ruta:/dashboard/teacher/overview

En la imagen superior puedes observar:
Tarjetas individuales por cada materia que dicta. De un vistazo rápido, puedes ver el Promedio Global de Atención de cada grupo. Si una clase está en rojo antes de empezar, sabes que tendrás que poner un extra de energía hoy.

4.2 Monitoreo en Tiempo Real
Esta es la herramienta más potente. Mientras dictas tu clase, ten esta ventana abierta.

📸 INSERTAR AQUÍ: Captura de la Grilla de Estudiantes en Vivo
Toma la captura en la ruta:/dashboard/teacher/live/[id]

En la imagen superior puedes observar:
Una matriz con todos tus estudiantes conectados.

Semáforo de Atención: Los marcos de cada estudiante cambian de color (Verde, Amarillo, Rojo) según el análisis del Machine Learning.

Indicadores Específicos: Iconos pequeños que indican "Bostezo frecuente" o "Mirada desviada" para que sepas el motivo de la distracción.

4.3 Alertas Inteligentes
No necesitas mirar la pantalla todo el tiempo. El sistema te avisará si algo requiere tu intervención inmediata.

📸 INSERTAR AQUÍ: Captura de una Notificación de Alerta
Toma la captura del panel de notificaciones o una ventana emergente de alerta.

En la imagen superior puedes observar:
Una alerta clara y directa: "El estudiante Juan Pérez ha bajado su atención al 30%" . Esto te permite hacer una pregunta dirigida: "Juan, ¿qué opinas de este punto?" , recuperando su atención de manera natural y pedagógica.

4.4 Mejorando tu Metodología
El aprendizaje es de doble vía. Si todos los estudiantes pierden atención al mismo tiempo, el sistema te lo hará saber.

📸 INSERTAR AQUÍ: Captura de las Analíticas Históricas
Toma la captura en la ruta:/dashboard/teacher/analytics

En la imagen superior puedes observar:
Gráficas de tendencia de la sesión.

El "Valle de la Atención": Si ves una caída drástica de toda la clase en el minuto 40, la gráfica te lo mostrará. Esto es un indicador valioso para que, en la próxima clase, planees una actividad dinámica justo en ese momento.

5. Preguntas Frecuentes y Soluciones
Hemos recopilado las situaciones más comunes para ayudarte a resolverlas rápidamente.

Situación	¿Por qué pasa esto?	¿Cómo lo soluciono?
"El sistema no detecta mi rostro"	Generalmente es por mala iluminación o porque la cámara está muy abajo/arriba.	Asegúrate de tener una fuente de luz frente a ti (no detrás) y centra tu cara en el recuadro.
"Las métricas no cambian"	Puede haber una microdesconexión de internet.	Refresca la página del navegador. El sistema de Machine Learning retomará el análisis en segundos.
"Me dice que estoy distraído pero estoy atendiendo"	A veces, mirar mucho hacia abajo (tomando notas) puede confundir al modelo.	Intenta levantar la mirada hacia la cámara periódicamente. El modelo aprende y se adapta.
"Soy profesor y no recibo alertas"	Es posible que las notificaciones estén desactivadas en tu navegador.	Revisa el icono de "candado" o "permisos" en la barra de dirección de tu navegador y permite las notificaciones.
Nota Final del Equipo de Desarrollo:
Class Guard ha sido construido siguiendo los más altos estándares de ingeniería de software y Machine Learning. Nuestro objetivo es crear un puente tecnológico que humanice la educación virtual, no que la robotice. ¡Gracias por usar nuestra plataforma!
