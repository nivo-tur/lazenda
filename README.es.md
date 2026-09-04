<div align="center">

# Lazenda

**CRM de código abierto creado en torno a la siguiente acción.**

Identifica quién necesita atención.<br>
Conoce el estado de cada relación.<br>
Ten claro qué hacer a continuación.

[English](README.md) · [Português](README.pt-BR.md) · [Español](README.es.md)

[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-2f6f4e)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3fcf8e?logo=supabase&logoColor=white)

</div>

Lazenda es un CRM de código abierto para startups y equipos pequeños, creado a partir de un uso operativo real.

La mayoría de los CRM están diseñados para mantener los registros al día. Lazenda también está diseñado para mantener el trabajo en movimiento.

En el centro del producto hay una pregunta sencilla:

> **¿Qué debo hacer a continuación?**

## Vista previa del producto

![Vista Hoy de Lazenda con acciones atrasadas, actuales y próximas](docs/images/lazenda-preview.png)

## Por qué Lazenda

Muchos CRM responden: «¿Qué sabemos sobre esta relación?». Lazenda también pregunta: «¿Qué tiene que ocurrir a continuación?».

El producto conecta un ciclo operativo sencillo:

**Relación → Siguiente acción → Avance → Historial → Aprendizaje**

Lazenda reúne esos pasos en un único flujo operativo. El enfoque actual está en el inicio de ese ciclo: lograr que las relaciones, la posición en el pipeline y las siguientes acciones sean lo bastante claras como para orientar el trabajo diario.

## Producto actual

Las siguientes funcionalidades están disponibles hoy.

### Hoy

- Separa oportunidades atrasadas, acciones previstas para hoy y próximas acciones.
- Facilita la priorización operativa diaria.
- Permite completar la acción actual y definir la siguiente acción y su fecha.
- Muestra contexto relevante de la oportunidad, incluido el valor potencial y un acceso directo a WhatsApp cuando está disponible.

### Pipeline

- Vista Kanban con las etapas comerciales actuales.
- Drag and drop entre etapas, persistido en Supabase.
- Búsqueda por oportunidad o contacto y filtros por etapa, municipio, distrito y estado de atención.
- Tarjetas con siguiente acción, fecha, valor potencial y acceso directo a WhatsApp.

### Gestión de oportunidades

- Creación, visualización, edición y eliminación de oportunidades.
- Almacenamiento de nombre, contacto, WhatsApp, municipio, distrito, origen, notas, valor potencial, siguiente acción y fecha.

### Estructura de ubicación

- Selección estructurada de municipio y distrito.
- Distritos asociados con su municipio.

### Persistencia

- Los datos de oportunidades y ubicaciones se leen y escriben en Supabase.
- PostgreSQL es la base de datos subyacente.

La autenticación, el soporte multiusuario, el historial completo, las automatizaciones, la IA, una API pública y los webhooks **no son funcionalidades actuales**. Consulta el [roadmap](#roadmap) para conocer el trabajo planificado y exploratorio.

## Principios del producto

- **Acción antes que administración.** El CRM debe ayudar a actuar, no solo a mantener registros.
- **Toda relación abierta debe tener una siguiente acción.** El avance comienza con una acción y una fecha claras.
- **Lo simple antes que lo sofisticado.** La complejidad solo debe añadirse cuando el uso real demuestre que es necesaria.
- **Claridad operativa antes que burocracia de CRM.** El trabajo importante debe ser fácil de identificar y hacer avanzar.
- **Uso real antes de ampliar funcionalidades.** Las decisiones de producto deben basarse en flujos prácticos.
- **Código abierto, datos privados.** El software puede ser público mientras las credenciales y los datos operativos permanecen protegidos.

## Estado del proyecto

> **Lazenda está en desarrollo activo.**

El producto se usa y desarrolla de forma iterativa. El esquema de la base de datos, las API internas, el proceso de configuración y las funcionalidades pueden cambiar. El repositorio todavía no incluye migraciones reproducibles, autenticación ni políticas documentadas de Row Level Security.

No utilices Lazenda para cargas críticas de producción sin una revisión de seguridad independiente y una configuración adecuada de Supabase Auth y RLS.

## Roadmap

Todo lo que aparece a continuación es roadmap, no una descripción de las funcionalidades actuales. El orden es orientativo, no implica compromisos de fecha y puede cambiar con lo aprendido durante el uso real.

### Ahora

- Base para el proyecto de código abierto
- Autenticación
- Gestión de sesiones
- Rutas protegidas
- RLS y seguridad en Supabase

### Siguiente

- Modelo de eventos comerciales e historial
- Dashboard y métricas fiables

### Más adelante

- Vista 360 de la oportunidad
- Diagnóstico y flujo de trabajo estructurados
- Seguimiento de clientes y resultados
- Inteligencia territorial
- Automatizaciones útiles

### En exploración

- Pipelines y campos personalizados
- Espacios de trabajo
- Importación y exportación
- API pública y webhooks
- Integraciones
- Flujos asistidos por IA

## Primeros pasos

### Requisitos previos

- Git
- Una versión LTS compatible de Node.js
- npm
- Un proyecto de Supabase

### 1. Clona el repositorio

```bash
git clone https://github.com/nivo-tur/lazenda.git
cd lazenda
```

### 2. Instala las dependencias

```bash
npm install
```

### 3. Configura el entorno

```bash
cp .env.example .env.local
```

Añade la URL del proyecto de Supabase y la Publishable Key a `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Nunca coloques una Secret Key ni una clave `service_role` de Supabase en una variable `NEXT_PUBLIC_*`. Todo lo que tenga el prefijo `NEXT_PUBLIC_` está disponible para el código que se ejecuta en el navegador.

### 4. Configura Supabase

El repositorio todavía no contiene migraciones ni un esquema reproducible para los datos necesarios de `businesses` y `locations`. La configuración de la base de datos aún se está documentando; no inventes ni deduzcas tablas de producción a partir del código de la aplicación.

### 5. Ejecuta el proyecto localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | :---: | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto de Supabase utilizada por el cliente en el navegador. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sí | Publishable Key de Supabase utilizada por el cliente según el modelo de seguridad de Supabase. |

Las Publishable Keys están diseñadas para el uso en el cliente cuando el acceso a la base de datos está protegido adecuadamente. Las Secret Keys y claves `service_role` omiten o elevan permisos y nunca deben exponerse mediante `NEXT_PUBLIC_*`, enviarse al navegador ni incluirse en commits.

## Arquitectura

La aplicación actual tiene una ruta directa de datos entre el navegador y Supabase:

```text
Navegador
  ↓
Aplicación Next.js
  ↓
Cliente JavaScript de Supabase
  ↓
Supabase / PostgreSQL
```

Esto hace que Supabase Auth y RLS sean esenciales antes del uso en producción. Estos controles forman parte del roadmap actual de seguridad; no son funcionalidades terminadas.

## Estructura del proyecto

```text
app/          Página de App Router, vistas, formularios e interfaz del producto
lib/          Integraciones compartidas, actualmente el cliente de Supabase
public/       Archivos estáticos servidos por Next.js
docs/images/  Reservado para imágenes de la documentación pública
```

## Desarrollo

| Comando | Propósito |
| --- | --- |
| `npm run dev` | Inicia el servidor local de desarrollo de Next.js. |
| `npm run build` | Crea una compilación de producción. |
| `npm run start` | Sirve una compilación de producción creada previamente. |
| `npm run lint` | Ejecuta ESLint. |

Actualmente no hay un script independiente para comprobar los tipos.

## Seguridad

**Código público no significa datos públicos.** Lazenda pretende combinar código fuente público con credenciales privadas, una base de datos protegida y datos operativos privados.

Lee [SECURITY.md](SECURITY.md) antes de informar de una vulnerabilidad o configurar un despliegue. La autenticación y RLS siguen siendo tareas de seguridad necesarias; este repositorio todavía no debe considerarse seguro para producción por defecto.

## Cómo contribuir

Las issues, sugerencias y pull requests son bienvenidos. Como el proyecto aún está en una fase inicial, comenta los cambios importantes en una issue antes de invertir en su implementación. Mantén las contribuciones enfocadas, evita datos reales de clientes o producción y distingue claramente el comportamiento actual de las funcionalidades propuestas.

## Código abierto y Nivo

Lazenda es de código abierto y actualmente se desarrolla a partir del uso operativo real en Nivo. Nivo es el entorno operativo inicial, pero el objetivo a largo plazo es lograr que el núcleo sea útil más allá de una sola organización.

Este repositorio documenta el producto, no los procesos privados, la información comercial ni los datos operativos de Nivo.

## Licencia

Distribuido bajo la [Licencia MIT](LICENSE).
