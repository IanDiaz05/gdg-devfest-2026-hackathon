"""Junta todo lo descargado en data/cultivos_base.json, con la forma del contrato 2 (GET /api/cultivos/{id}).

Mezcla:
- data/curacion/cultivos_curados.json  (a mano: maceta, luz, tolerancia, etc.)
- data/ecocrop_cultivos.json           (temperaturas, altitud)
- data/wikipedia_resumenes.json        (referencia para escribir resumen y curiosidades)

NO sobrescribe data/cultivos.json (el archivo que edita el equipo). Los campos de contenido
(resumen, riego, sustrato, tutorial, compañeros, curiosidades, ojo) quedan vacíos y se listan
en `_pendiente` para llenarlos a mano.

Uso: backend\\.venv\\Scripts\\python backend\\scripts\\descargas\\generar_cultivos_base.py
"""
from __future__ import annotations

from comun import DATA, cultivos_curados, guardar_json, hoy, leer_json, preparar


def opcional(nombre: str) -> dict:
    ruta = DATA / nombre
    if not ruta.exists():
        print(f"  ⚠️ falta {nombre}: córrelo antes para completar esos campos")
        return {}
    return leer_json(ruta).get("cultivos", {})


def espacio_tipo(litros: int) -> str:
    if litros <= 8:
        return "maceta_chica"
    return "maceta_grande" if litros <= 25 else "patio"


def rango_cosecha(aprox: int, eco: list | None) -> list[int]:
    """Rango de días: parte de nuestro estimado y lo abre con ECOCROP sin pasar del doble."""
    if not eco:
        return [aprox, aprox]
    return [int(min(aprox, eco[0])), int(max(aprox, min(eco[1], 2 * aprox)))]


def main() -> None:
    preparar()
    print("Generando data/cultivos_base.json")
    eco, wiki = opcional("ecocrop_cultivos.json"), opcional("wikipedia_resumenes.json")

    salida = []
    for c in cultivos_curados():
        e, w = eco.get(c["id"], {}), wiki.get(c["id"], {})
        pendiente = ["resumen", "ficha_tecnica.riego", "ficha_tecnica.sustrato_recomendado", "tutorial",
                     "companeros_cultivo", "curiosidades", "ojo"]
        if not e:
            pendiente.append("ficha_tecnica.temp_* (no está en ECOCROP)")
        fuentes = []
        if e:
            fuentes.append(f"FAO ECOCROP: {e['ecocrop_nombre']}")
        if w.get("url"):
            fuentes.append(f"Wikipedia: {w['url']}")

        salida.append({
            "id": c["id"],
            "nombre": c["nombre"],
            "nombre_cientifico": c["nombre_cientifico"],
            "ecocrop_nombre": e.get("ecocrop_nombre", c["ecocrop_nombre"]),
            "categoria": c["categoria"],
            "icono": c["icono"],
            "resumen": "",
            "ficha_tecnica": {
                "temp_ideal_c": e.get("temp_ideal_c"),
                "temp_limite_c": e.get("temp_limite_c"),
                "tolera_helada": c["tolera_helada"],
                "altitud_max_m": e.get("altitud_max_m"),
                "dias_a_cosecha": rango_cosecha(c["dias_cosecha_aprox"], e.get("dias_ciclo")),
                "maceta_min_litros": c["maceta_min_litros"],
                "profundidad_min_cm": c["profundidad_min_cm"],
                "luz": c["luz"],
                "riego": "",
                "sustrato_recomendado": "",
            },
            "tutorial": [],
            "companeros_cultivo": [],
            "curiosidades": [],
            "ojo": [],
            "fuentes": fuentes,
            # --- Campos internos para el motor de reglas (no van tal cual al frontend) ---
            "reglas": {
                "perenne": c["perenne"],
                "dias_cosecha_aprox": c["dias_cosecha_aprox"],
                "dificultad": c["dificultad"],
                "espacio_tipo": espacio_tipo(c["maceta_min_litros"]),
                "necesita_tutor": c["necesita_tutor"],
                "sensible_a": c["sensible_a"],
                "siap_nombres": c["siap_nombres"],
            },
            "_referencia": {
                "wikipedia_extracto": w.get("extracto"),
                "wikipedia_imagen": w.get("imagen"),
                "notas": c.get("notas"),
            },
            "_pendiente": pendiente,
        })
        print(f"  {c['id']:<15} ECOCROP {'✓' if e else '✗'} | Wikipedia {'✓' if w else '✗'}")

    guardar_json({
        "generado": hoy(),
        "nota": "Generado automáticamente. Copiar a cultivos.json y completar los campos de _pendiente a mano.",
        "cultivos": salida,
    }, DATA / "cultivos_base.json")


if __name__ == "__main__":
    main()
