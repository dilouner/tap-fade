from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = OUT_DIR / "plan_implementacion_tapfade.pdf"

BLUE = colors.HexColor("#0A49FF")
MINT = colors.HexColor("#6FE3B7")
SMOKE = colors.HexColor("#F5F7F6")
GREY = colors.HexColor("#E5E7EB")
GRAPHITE = colors.HexColor("#11151C")
TEXT = colors.HexColor("#374151")
MID = colors.HexColor("#6B7280")


def make_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=30,
            leading=34,
            textColor=GRAPHITE,
            alignment=TA_LEFT,
            spaceAfter=14,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12,
            leading=18,
            textColor=TEXT,
            spaceAfter=16,
        ),
        "eyebrow": ParagraphStyle(
            "eyebrow",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=BLUE,
            alignment=TA_LEFT,
            spaceAfter=8,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=22,
            textColor=GRAPHITE,
            spaceBefore=8,
            spaceAfter=10,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=BLUE,
            spaceBefore=8,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.4,
            leading=13.5,
            textColor=TEXT,
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=MID,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=12.8,
            textColor=TEXT,
            leftIndent=12,
            firstLineIndent=-7,
            spaceAfter=4,
        ),
        "callout": ParagraphStyle(
            "callout",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=14,
            textColor=GRAPHITE,
            alignment=TA_CENTER,
        ),
        "table_head": ParagraphStyle(
            "table_head",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.white,
        ),
        "table_cell": ParagraphStyle(
            "table_cell",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=10.5,
            textColor=TEXT,
        ),
    }


def p(text, style):
    return Paragraph(text, style)


def bullet(text, styles):
    return p(f"- {text}", styles["bullet"])


def table(data, widths, header=True):
    converted = []
    styles = make_styles()
    for row_idx, row in enumerate(data):
        row_style = styles["table_head"] if row_idx == 0 and header else styles["table_cell"]
        converted.append([p(str(cell), row_style) for cell in row])
    t = Table(converted, colWidths=widths, hAlign="LEFT", repeatRows=1 if header else 0)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BLUE if header else colors.white),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white if header else TEXT),
                ("GRID", (0, 0), (-1, -1), 0.35, GREY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
            ]
        )
    )
    return t


def draw_brand_frame(canvas, doc):
    width, height = letter
    canvas.saveState()
    canvas.setFillColor(GRAPHITE)
    canvas.rect(0, 0, width, 0.46 * inch, stroke=0, fill=1)
    canvas.setFillColor(BLUE)
    canvas.rect(0, 0.46 * inch, 0.16 * inch, height - 0.46 * inch, stroke=0, fill=1)
    canvas.setFillColor(MINT)
    canvas.rect(0.16 * inch, 0.46 * inch, 0.05 * inch, 2.15 * inch, stroke=0, fill=1)

    canvas.setStrokeColor(GREY)
    canvas.setLineWidth(0.6)
    x0 = width - 1.9 * inch
    y0 = 0.72 * inch
    step = 0.28 * inch
    for idx in range(5):
        canvas.line(x0 + idx * step, y0 + idx * step, x0 + (idx + 1) * step, y0 + idx * step)
        canvas.line(x0 + (idx + 1) * step, y0 + idx * step, x0 + (idx + 1) * step, y0 + (idx + 1) * step)

    canvas.setFillColor(MINT)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(0.7 * inch, 0.18 * inch, "TAPFADE")
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(1.35 * inch, 0.18 * inch, "PLAN MODULAR DE IMPLEMENTACION")
    canvas.setFillColor(MINT)
    canvas.drawRightString(width - 0.6 * inch, 0.18 * inch, f"{doc.page:02d}")
    canvas.restoreState()


def build_story():
    styles = make_styles()
    story = []

    story.append(p("TAPFADE", styles["eyebrow"]))
    story.append(p("Plan modular de implementacion del proyecto", styles["title"]))
    story.append(
        p(
            "Documento base para iniciar el desarrollo de TapFade con ciclos modulares de diseno, implementacion, pruebas, validacion y documentacion. Integra el FRU, la identidad de marca y los criterios de gestion del proceso de desarrollo de software.",
            styles["subtitle"],
        )
    )

    callout = Table(
        [[p("Tu corte, en el momento exacto.", styles["callout"])]],
        colWidths=[6.1 * inch],
        hAlign="LEFT",
    )
    callout.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SMOKE),
                ("BOX", (0, 0), (-1, -1), 0.8, GREY),
                ("LEFTPADDING", (0, 0), (-1, -1), 14),
                ("RIGHTPADDING", (0, 0), (-1, -1), 14),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    story.append(callout)
    story.append(Spacer(1, 14))

    story.append(p("1. Enfoque general", styles["h1"]))
    story.append(
        p(
            "La estrategia es construir TapFade como un producto modular. Cada modulo debe cerrarse con evidencia verificable: pruebas ejecutadas, demo o captura, checklist de aceptacion y actualizacion de documentacion.",
            styles["body"],
        )
    )
    for item in [
        "App movil iOS y Android con React Native, preferentemente Expo para acelerar validacion inicial.",
        "Backend inicial con Firebase: Auth, Firestore, Storage y Firebase Cloud Messaging.",
        "Google Maps API para ubicacion y busqueda por cercania.",
        "CI/CD desde el inicio con GitHub Actions.",
        "Testing por niveles: unitario, integracion ligera, funcional, manual documentado y pruebas de usabilidad.",
        "Sistema visual TapFade desde el primer modulo: azul electrico, menta fresca, humo, gris frio y grafito.",
    ]:
        story.append(bullet(item, styles))

    story.append(p("2. Principios de trabajo modular", styles["h1"]))
    principles = [
        ["Principio", "Aplicacion practica"],
        ["Vertical slice", "Cada entrega debe probar un flujo util de extremo a extremo, no solo pantallas aisladas."],
        ["Validacion temprana", "Los modulos se revisan con criterios de aceptacion del FRU antes de avanzar."],
        ["Documentacion viva", "Arquitectura, decisiones, pruebas y cambios se actualizan durante el desarrollo."],
        ["Calidad visible", "La UI debe respetar identidad, accesibilidad, contraste y claridad desde el primer sprint."],
        ["DevOps incremental", "Pipeline, pruebas, versionamiento y monitoreo crecen junto con el producto."],
    ]
    story.append(table(principles, [1.4 * inch, 4.7 * inch]))
    story.append(PageBreak())

    story.append(p("3. Fases y modulos", styles["h1"]))
    phases = [
        ["Fase", "Objetivo", "Modulos principales", "Validacion"],
        ["0. Preparacion", "Dejar listo el entorno de trabajo.", "Repositorio, estructura modular, flujo Git, CI basico, tokens de marca.", "Checklist de entorno y pipeline ejecutado."],
        ["1. Base visual", "Construir la experiencia TapFade.", "Sistema de diseno, navegacion base, componentes compartidos.", "Comparacion contra manual de marca y prueba responsive."],
        ["2. Auth y roles", "Habilitar acceso seguro.", "Registro, login, perfiles, roles y permisos.", "Pruebas RF-001, RF-002 y RN-001."],
        ["3. Barberias", "Permitir que una barberia exista en la plataforma.", "Registro, aprobacion, servicios, precios y barberos.", "Pruebas RF-003, RF-004 y RN-006."],
        ["4. Agenda", "Resolver disponibilidad y control operativo.", "Horarios, bloqueos, agenda del barbero y confirmacion.", "Pruebas RF-005, RF-009, RN-003, RN-004 y RN-005."],
        ["5. Agendado", "Completar el flujo principal del cliente.", "Busqueda, seleccion de servicio, barbero, horario, cancelar y reagendar.", "Agendar en menos de 2 minutos y pruebas RF-006 a RF-008."],
        ["6. Notificaciones", "Cerrar confianza y recordatorio.", "Push de confirmacion, rechazo y recordatorios 24h/1h.", "Pruebas RF-010, RF-011, RN-007 y RN-008."],
        ["7. Reportes/Admin", "Dar control al dueno y a la plataforma.", "Reportes de ocupacion, aprobacion y soporte operativo.", "Reportes consistentes con datos reales y permisos correctos."],
        ["8. Liberacion", "Formalizar operacion, despliegue y monitoreo.", "CI/CD, metricas, evidencias, bitacora, aceptacion.", "Demo estable y paquete de documentacion."],
    ]
    story.append(table(phases, [0.75 * inch, 1.2 * inch, 2.5 * inch, 1.65 * inch]))
    story.append(Spacer(1, 8))
    story.append(
        p(
            "El primer hito recomendado es un vertical slice: un cliente inicia sesion, ve una barberia demo, selecciona servicio y horario, genera una cita y el barbero la visualiza en su agenda.",
            styles["body"],
        )
    )
    story.append(PageBreak())

    story.append(p("4. Backlog inicial por prioridad", styles["h1"]))
    backlog = [
        ["Prioridad", "Modulo", "Historias / capacidades"],
        ["Alta", "Base tecnica", "Crear proyecto, configurar Firebase, navegacion, tema visual, pipeline inicial."],
        ["Alta", "Autenticacion", "Registro e inicio con Google, Apple y correo; perfiles por rol."],
        ["Alta", "Barberias", "Alta de barberia, foto, direccion, descripcion y aprobacion por administrador."],
        ["Alta", "Servicios", "Crear, editar y eliminar servicios con precio y duracion estimada."],
        ["Alta", "Disponibilidad", "Configurar horarios por barbero y bloquear horarios no disponibles."],
        ["Alta", "Agendado", "Buscar barberia, elegir servicio, barbero, fecha y hora, confirmar cita."],
        ["Alta", "Confirmacion", "Barbero confirma o rechaza; cliente recibe notificacion inmediata."],
        ["Alta", "Recordatorios", "Push 24 horas y 1 hora antes de cada cita confirmada."],
        ["Media", "Historial", "Consultar citas pasadas y proximas por cliente y barbero."],
        ["Media", "Reportes", "Ocupacion por dia, barbero y servicio para el dueno."],
    ]
    story.append(table(backlog, [0.85 * inch, 1.25 * inch, 4.0 * inch]))

    story.append(p("5. Pruebas y criterios de cierre", styles["h1"]))
    for item in [
        "Cada modulo debe incluir casos de prueba vinculados a RF, RNF y reglas de negocio.",
        "Las operaciones criticas de busqueda y agenda deben responder en p95 <= 3 segundos.",
        "Un cliente nuevo debe poder completar su primera cita sin ayuda en pruebas de usabilidad.",
        "No debe existir traslape de citas para un mismo barbero, fecha y franja horaria.",
        "La app debe conservar evidencia de control de cambios, versionamiento y resultados de pruebas.",
        "La liberacion requiere demo, checklist de aceptacion y evidencia de cumplimiento de privacidad.",
    ]:
        story.append(bullet(item, styles))
    story.append(PageBreak())

    story.append(p("6. DevOps y documentacion requerida", styles["h1"]))
    devops = [
        ["Entregable", "Contenido esperado"],
        ["Parametros de configuracion", "Firebase, variables de entorno, Google Maps, Auth, FCM y ambientes."],
        ["Plan de pruebas", "Tecnicas, herramientas, alcance, responsables y criterios por modulo."],
        ["Casos de prueba", "CP-001 a CP-012 del FRU, ajustados conforme avance el producto."],
        ["Versionamiento", "Flujo de ramas, convencion de commits, pull requests y revisiones."],
        ["Pipeline CI/CD", "Lint, typecheck, pruebas, build de validacion y despliegue a pruebas."],
        ["Monitoreo", "Logs, errores, metricas de rendimiento, disponibilidad, RPO, RTO y alertas."],
        ["Bitacora", "Avances, decisiones, incidencias, cambios aprobados y evidencia por entrega."],
        ["Aceptacion", "Checklist, demo, evidencias y aprobacion del modulo antes de pasar al siguiente."],
    ]
    story.append(table(devops, [1.75 * inch, 4.35 * inch]))

    story.append(p("7. Ruta de arranque recomendada", styles["h1"]))
    start = [
        "Semana 1: crear base React Native/Firebase, estructura modular, tema visual y CI basico.",
        "Semana 2: login, roles y navegacion protegida.",
        "Semana 3: barberia demo, servicios y perfil de barbero.",
        "Semana 4: disponibilidad, seleccion de horario y creacion de cita.",
        "Semana 5: agenda del barbero, confirmacion/rechazo y notificacion inicial.",
        "Semana 6: validacion del vertical slice, pruebas, documentacion y ajustes.",
    ]
    for item in start:
        story.append(bullet(item, styles))

    story.append(Spacer(1, 12))
    story.append(
        p(
            "Resultado esperado del primer ciclo: TapFade debe demostrar el flujo esencial del negocio con datos reales de prueba, UI alineada a marca, reglas basicas de seguridad y evidencia de pruebas.",
            styles["subtitle"],
        )
    )

    return story


def main():
    doc = BaseDocTemplate(
        str(OUT_FILE),
        pagesize=letter,
        leftMargin=0.72 * inch,
        rightMargin=0.58 * inch,
        topMargin=0.62 * inch,
        bottomMargin=0.72 * inch,
        title="Plan modular de implementacion TapFade",
        author="TapFade",
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    doc.addPageTemplates([PageTemplate(id="TapFade", frames=[frame], onPage=draw_brand_frame)])
    doc.build(build_story())
    print(OUT_FILE)


if __name__ == "__main__":
    main()
