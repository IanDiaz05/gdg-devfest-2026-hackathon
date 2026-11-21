"""Junta todo lo descargado en data/cultivos_base.json, con la forma del contrato 2 (GET /api/cultivos/{id}).

Mezcla:
- data/curacion/cultivos_curados.json  (a mano: maceta, luz, tolerancia, etc.)
- data/ecocrop_cultivos.json           (temperaturas, altitud)
- data/wikipedia_resumenes.json        (referencia para escribir resumen y curiosidades)
- data/curacion/contenido_cultivos.json (a mano: resumen, riego, sustrato, tutorial, compañeros, curiosidades, ojo)

NO sobrescribe data/cultivos.json (el archivo que edita el equipo). Los campos de contenido
(resumen, riego, sustrato, tutorial, compañeros, curiosidades, ojo) quedan vacíos y se listan
en `_pendiente` para llenarlos a mano.

Uso: backend\\.venv\\Scripts\\python backend\\scripts\\descargas\\generar_cultivos_base.py
"""
from __future__ import annotations

from comun import CURACION, DATA, cultivos_curados, guardar_json, hoy, leer_json, preparar


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
    ruta_contenido = CURACION / "contenido_cultivos.json"
    contenido = leer_json(ruta_contenido).get("cultivos", {}) if ruta_contenido.exists() else {}
    nombres = {c["id"]: c["nombre"] for c in cultivos_curados()}

    salida = []
    for c in cultivos_curados():
        e, w, k = eco.get(c["id"], {}), wiki.get(c["id"], {}), contenido.get(c["id"], {})
        campos = {"resumen": k.get("resumen"), "ficha_tecnica.riego": k.get("riego"),
                  "ficha_tecnica.sustrato_recomendado": k.get("sustrato"), "tutorial": k.get("tutorial"),
                  "companeros_cultivo": k.get("companeros") if "companeros" in k else None,
                  "curiosidades": k.get("curiosidades") if "curiosidades" in k else None,
                  "ojo": k.get("ojo") if "ojo" in k else None}
        pendiente = [campo for campo, valor in campos.items() if valor is None or valor == ""]
        if k:
            pendiente.append("revisar el borrador de contenido_cultivos.json contra los manuales")
        companeros = [{"id": x["id"], "nombre": nombres.get(x["id"], x["id"]), "beneficio": x["beneficio"],
                       "evidencia": x.get("evidencia", "popular")} for x in k.get("companeros", [])]
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
            "resumen": k.get("resumen", ""),
            "es_nativa_region": c["es_nativa_region"],
            "ficha_tecnica": {
                "temp_ideal_c": e.get("temp_ideal_c"),
                "temp_limite_c": e.get("temp_limite_c"),
                "tolera_helada": c["tolera_helada"],
                "altitud_max_m": e.get("altitud_max_m"),
                "dias_a_cosecha": rango_cosecha(c["dias_cosecha_aprox"], e.get("dias_ciclo")),
                "maceta_min_litros": c["maceta_min_litros"],
                "profundidad_maceta_cm": c["profundidad_maceta_cm"],
                "luz_nivel": c["luz_nivel"],
                "riego_frecuencia_dias": c["riego_frecuencia_dias"],
                "riego": k.get("riego", ""),
                "sustrato_recomendado": k.get("sustrato", ""),
            },
            "restricciones": {
                "pet_safe": c["pet_safe"],
                "dificultad": c["dificultad"],
            },
            "impacto_ambiental": {
                "consumo_hidrico": c["consumo_hidrico"],
                "atrae_polinizadores": c["atrae_polinizadores"],
            },
            "guia_rapida": {
                "error_comun": c["guia_rapida"]["error_comun"],
            },
            "tutorial": k.get("tutorial", []),
            "companeros_cultivo": companeros,
            "curiosidades": k.get("curiosidades", []),
            "ojo": k.get("ojo", []),
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
