"""Suporte para tesouras + porta-objetos (inspirado na foto de referência).

Gera arquivos STL prontos para impressão 3D. Medidas em milímetros.
Uso:  pip install manifold3d trimesh numpy  &&  python gerar.py
Ajuste os parâmetros abaixo (principalmente DIAM_FURO) às suas tesouras.
"""
import math
import numpy as np
import trimesh
from manifold3d import CrossSection, Manifold, JoinType

# ---------------- Parâmetros ----------------
# Moldura (porta-tesouras)
LARG = 170.0        # largura total (X)
ALT = 160.0         # altura total (Z)
PROF = 50.0         # profundidade (Y)
R_EXT = 22.0        # raio dos cantos externos
PAREDE_LAT = 10.0   # espessura das laterais
BARRA_SUP = 22.0    # espessura da barra superior (onde ficam os furos)
BASE = 12.0         # espessura da base
R_INT = 14.0        # raio dos cantos internos
N_FUROS_RED = 3     # furos redondos
DIAM_FURO = 24.0    # diâmetro dos furos redondos (meça a lâmina da tesoura!)
TREVO = True        # 4º furo em formato de trevo (pente, navalha, etc.)
CHANFRO = 1.5       # chanfro na boca dos furos

# Organizador (dois compartimentos)
O_LARG = 75.0
O_PROF = 110.0
O_ALT_TRAS = 150.0
O_ALT_FRENTE = 95.0
O_PAREDE = 3.0
O_FUNDO = 3.0
O_R = 6.0
SEG = 96            # resolução dos círculos


def ret_arred(w, h, r):
    """Retângulo de cantos arredondados centrado na origem."""
    return CrossSection.square((w - 2 * r, h - 2 * r), center=True).offset(
        r, JoinType.Round, circular_segments=SEG)


def moldura():
    ext = ret_arred(LARG, ALT, R_EXT).translate((LARG / 2, ALT / 2))
    iw, ih = LARG - 2 * PAREDE_LAT, ALT - BASE - BARRA_SUP
    inn = ret_arred(iw, ih, R_INT).translate((LARG / 2, BASE + ih / 2))
    perfil = ext - inn
    # extruda em Z e gira para o perfil ficar no plano XZ, profundidade em Y
    corpo = perfil.extrude(PROF).rotate((90, 0, 0)).translate((0, PROF, 0))

    z0 = ALT - BARRA_SUP - 1
    h = BARRA_SUP + 2
    # furos apenas no trecho plano do topo (fora dos cantos arredondados)
    margem = R_EXT + 15.0
    xs = list(np.linspace(margem, LARG - margem, 4))
    furos = []
    for i, x in enumerate(xs):
        if i < N_FUROS_RED or not TREVO:
            sec = CrossSection.circle(DIAM_FURO / 2, SEG)
        else:
            sec = CrossSection.circle(8.5, SEG)
            for a in range(4):
                ang = math.radians(45 + 90 * a)
                sec = sec + CrossSection.circle(6.5, SEG).translate(
                    (7.5 * math.cos(ang), 7.5 * math.sin(ang)))
        f = sec.extrude(h).translate((x, PROF / 2, z0))
        furos.append(f)
        if i < N_FUROS_RED or not TREVO:  # chanfro cônico na boca do furo
            r = DIAM_FURO / 2
            furos.append(Manifold.cylinder(CHANFRO + 0.01, r, r + CHANFRO + 0.01, SEG)
                         .translate((x, PROF / 2, ALT - CHANFRO)))
    for f in furos:
        corpo = corpo - f
    return corpo


def organizador():
    pf = O_PROF / 2  # divisória no meio
    base = ret_arred(O_LARG, O_PROF, O_R).translate((O_LARG / 2, O_PROF / 2))
    d_t = O_PROF - pf + O_PAREDE / 2
    tras = ret_arred(O_LARG, d_t, O_R).translate(
        (O_LARG / 2, pf - O_PAREDE / 2 + d_t / 2))
    corpo = base.extrude(O_ALT_FRENTE) + tras.extrude(O_ALT_TRAS)
    # bolsos
    ri = max(O_R - O_PAREDE, 1.0)
    w_in = O_LARG - 2 * O_PAREDE
    d_fr = pf - O_PAREDE - O_PAREDE / 2
    d_tr = O_PROF - pf - O_PAREDE - O_PAREDE / 2
    b_fr = ret_arred(w_in, d_fr, ri).translate((O_LARG / 2, O_PAREDE + d_fr / 2))
    b_tr = ret_arred(w_in, d_tr, ri).translate(
        (O_LARG / 2, pf + O_PAREDE / 2 + d_tr / 2))
    corpo = corpo - b_fr.extrude(O_ALT_FRENTE).translate((0, 0, O_FUNDO))
    corpo = corpo - b_tr.extrude(O_ALT_TRAS).translate((0, 0, O_FUNDO))
    return corpo


def para_trimesh(m):
    mesh = m.to_mesh()
    return trimesh.Trimesh(vertices=np.asarray(mesh.vert_properties)[:, :3],
                           faces=np.asarray(mesh.tri_verts), process=True)


if __name__ == "__main__":
    mo, org = moldura(), organizador()
    t_mo, t_org = para_trimesh(mo), para_trimesh(org)
    t_mo.export("moldura_tesouras.stl")
    t_org.export("organizador.stl")
    # montagem (somente visualização): organizador ao lado direito, mais à frente
    t_org_m = t_org.copy()
    t_org_m.apply_translation((LARG + 2, -(O_PROF - PROF) + 10, 0))
    trimesh.util.concatenate([t_mo, t_org_m]).export("montagem_preview.stl")
    for n, t in [("moldura", t_mo), ("organizador", t_org)]:
        print(f"{n}: estanque={t.is_watertight} dims={np.round(t.extents,1)} "
              f"vol={t.volume/1000:.0f} cm3")
