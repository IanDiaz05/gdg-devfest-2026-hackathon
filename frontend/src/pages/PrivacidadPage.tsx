import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { TituloPagina } from '../components/Interfaz'

/**
 * Aviso de privacidad integral. Describe lo que la app hace hoy (revisado contra el código):
 * - GPS: useGeolocation redondea a 3 decimales; datosGuardados nunca guarda consultas con lat/lon.
 * - Dispositivo: localStorage "quesiembro-tema", sessionStorage del espacio y la caché de la PWA.
 * - Terceros: Open-Meteo (lo consulta el servidor) y Google Fonts (lo descarga el navegador).
 * Si cambia algo de esto, actualiza el aviso y la fecha.
 */
const ACTUALIZADO = '21 de noviembre de 2026'
// TODO equipo: poner aquí el correo real de contacto antes de publicar
const CONTACTO = 'el correo de contacto del equipo QUESIEMBRO (pendiente de publicar)'

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return <section aria-labelledby={id} className="etiqueta space-y-2 text-sm leading-7 sm:text-base">
    <h2 id={id} className="titulo-sobre">{titulo}</h2>
    {children}
  </section>
}

export function PrivacidadPage() {
  return <article className="mx-auto w-full max-w-3xl space-y-5 pb-4">
    <TituloPagina etiqueta="Privacidad" titulo="Aviso de privacidad">
      <p className="mt-2 text-sm text-muted-foreground">Última actualización: {ACTUALIZADO}</p>
    </TituloPagina>

    <div className="sobre space-y-3">
      <section aria-labelledby="resumen" className="rounded-2xl border-[1.5px] border-dashed border-success/50 bg-success-soft p-4 text-success">
        <h2 id="resumen" className="flex items-center gap-2 font-display text-xl font-semibold">
          <ShieldCheck size={22} strokeWidth={1.75} aria-hidden="true" /> En pocas palabras
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 sm:text-base">
          <li>No hay cuentas ni registro. No te pedimos nombre, correo ni teléfono.</li>
          <li>Solo usamos la ciudad que escribes o, si tú lo permites, tu ubicación aproximada, para decirte qué sembrar.</li>
          <li>No vendemos ni compartimos tus datos para publicidad. No usamos cookies de rastreo ni herramientas de analítica.</li>
          <li>Lo que la app guarda en tu dispositivo (tema, espacio y consultas para usarla sin internet) lo puedes borrar cuando quieras.</li>
        </ul>
      </section>

      <Seccion id="responsable" titulo="1. Quién es responsable">
        <p>
          QUESIEMBRO es un proyecto del equipo QUESIEMBRO, creado para el hackathon GDG DevFest 2026. El equipo es responsable
          del tratamiento de los datos que se describen en este aviso, conforme a la Ley Federal de Protección de Datos Personales
          en Posesión de los Particulares. Para cualquier duda sobre este aviso, escríbenos a {CONTACTO}.
        </p>
      </Seccion>

      <Seccion id="datos" titulo="2. Qué datos usamos y para qué">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>La ciudad o municipio que escribes.</strong> Se envía a nuestro servidor para buscar su clima y calcular qué
            cultivos te convienen. También la usamos para sugerirte ciudades mientras escribes.
          </li>
          <li>
            <strong>Tu ubicación, solo si tocas «Usar mi ubicación actual» y tu navegador te pide permiso.</strong> Antes de
            enviarla, la app la redondea en tu dispositivo a unos 100 metros. El servidor la usa para encontrar la ciudad más
            cercana y el clima de esa zona. Puedes negar el permiso y buscar tu ciudad por nombre.
          </li>
          <li>
            <strong>Datos técnicos de la conexión</strong> (dirección IP, tipo de navegador, fecha y página solicitada). Los
            registra el servidor de forma automática, como cualquier sitio web, y solo se usan para que el servicio funcione y
            para detectar fallas.
          </li>
        </ul>
        <p>
          La única finalidad es mostrarte recomendaciones de siembra, el clima de tu zona y las alertas de la semana. No usamos
          tus datos para publicidad, perfiles ni ningún otro fin. No tratamos datos personales sensibles.
        </p>
        <p>
          Ten en cuenta que la ciudad o las coordenadas aparecen en la dirección de la página: si compartes ese enlace, la otra
          persona las verá. El botón «Compartir» de cada cultivo envía la ficha sin tu ubicación.
        </p>
      </Seccion>

      <Seccion id="terceros" titulo="3. Con quién se comparten">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Open-Meteo</strong> (servicio de datos del clima). Cuando una zona no está guardada, nuestro servidor le pide
            el clima de esas coordenadas. La consulta sale de nuestro servidor: Open-Meteo no recibe tu IP ni ningún otro dato tuyo.
          </li>
          <li>
            <strong>Google Fonts.</strong> Tu navegador descarga de Google las tipografías de la página, por lo que Google recibe
            tu dirección IP y datos técnicos del navegador, según su propia política de privacidad.
          </li>
          <li>
            Los datos del SMN-CONAGUA, FAO ECOCROP, GeoNames, INEGI y Wikipedia están descargados en nuestro servidor; consultarlos
            no envía ningún dato tuyo a esas instituciones.
          </li>
        </ul>
        <p>No vendemos, rentamos ni transferimos tus datos a nadie más.</p>
      </Seccion>

      <Seccion id="dispositivo" titulo="4. Qué se guarda en tu dispositivo">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Tema claro u oscuro</strong>, si lo eliges con el botón de sol y luna (almacenamiento local del navegador).</li>
          <li><strong>El espacio que elegiste</strong> (maceta chica, maceta grande o patio). Se borra al cerrar la pestaña.</li>
          <li>
            <strong>Copias de consultas para usar la app sin internet</strong>: las fichas de cultivos y las búsquedas hechas por
            nombre de ciudad. Las consultas hechas con tu ubicación nunca se guardan.
          </li>
        </ul>
        <p>
          Para borrarlo todo, elimina los datos de este sitio en la configuración de tu navegador o desinstala la app. No usamos
          cookies.
        </p>
      </Seccion>

      <Seccion id="servidor" titulo="5. Qué se guarda en nuestro servidor">
        <p>
          Guardamos el clima de cada zona (cuadros de unos 10 km) para no volver a descargarlo. Esa información describe lugares,
          no personas, y no se relaciona con quién hizo la consulta. Los registros técnicos de la conexión se conservan solo el
          tiempo necesario para operar el servicio.
        </p>
      </Seccion>

      <Seccion id="derechos" titulo="6. Tus derechos">
        <p>
          Puedes solicitar el acceso, la rectificación o la cancelación de tus datos, u oponerte a su uso (derechos ARCO), así
          como retirar tu consentimiento, escribiendo a {CONTACTO}. Como la app no tiene cuentas, no podemos relacionar una
          consulta con una persona; la forma más directa de borrar tus datos es eliminar los datos del sitio en tu navegador.
        </p>
      </Seccion>

      <Seccion id="cambios" titulo="7. Cambios a este aviso">
        <p>
          Si cambiamos qué datos usamos o para qué, actualizaremos este aviso y la fecha de arriba. Te recomendamos revisarlo de
          vez en cuando.
        </p>
      </Seccion>
    </div>
  </article>
}
