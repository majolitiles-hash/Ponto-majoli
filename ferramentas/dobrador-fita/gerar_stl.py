# Gera o STL do dobrador de fita com manifold3d (malha sempre fechada).
# Mesmos parâmetros do .scad. Uso: python3 gerar_stl.py
import numpy as np, manifold3d as mf, trimesh

largura_fita, folga_fita, folga_lateral = 52.0, 2.0, 1.5
comprimento, parede, angulo_final = 100.0, 3.0, 90.0
boca_extra, z_boca, z_ini, z_fim, passos = 2.5, 8.0, 10.0, 82.0, 80

meia = largura_fita/2 + folga_lateral
tmax = np.radians((180 - angulo_final)/2)
suave = lambda t: 0 if t <= 0 else 1 if t >= 1 else t*t*(3-2*t)
theta = lambda z: tmax*suave((z-z_ini)/(z_fim-z_ini))
gap = lambda z: folga_fita + boca_extra*(1-suave(z/z_boca))

def fatia(z, lado, solido):
    g = gap(z)
    x0, x1 = (-parede, meia+parede) if solido else (-g/2 - 0.3, meia)
    h = (g/2 + parede) if solido else g/2
    pts = np.array([[x0,-h],[x1,-h],[x1,h],[x0,h]])
    c, s = np.cos(theta(z)), np.sin(theta(z))
    pts = pts @ np.array([[c,s],[-s,c]])
    if lado: pts[:,0] *= -1
    return np.c_[pts, np.full(4, z)]

def varredura(solido, z0, z1):
    zs = np.linspace(z0, z1, passos+1)
    partes = [mf.Manifold.hull_points(np.vstack([fatia(a,l,solido), fatia(b,l,solido)]))
              for l in (0,1) for a,b in zip(zs[:-1], zs[1:])]
    return mf.Manifold.batch_boolean(partes, mf.OpType.Add)

corpo = varredura(True, 0, comprimento)

# --- Alça embaixo da quina do V (o furo também serve para pendurar) ---
alca_esp, alca_prof, furo_larg, raio = 8.0, 42.0, 24.0, 4.0
def ret(y0,y1,z0,z1): return mf.CrossSection([[(y0,z0),(y1,z0),(y1,z1),(y0,z1)]])
contorno = ret(-alca_prof+raio, -2, 4+raio, comprimento-4-raio).offset(raio, mf.JoinType.Round)
yf0, yf1 = -alca_prof+7, -alca_prof+7+furo_larg; ym = (yf0+yf1)/2
# furo com pontas a 45° (imprime em pé sem suporte)
furo = mf.CrossSection([[(ym,14),(yf1,14+furo_larg/2),(yf1,comprimento-14-furo_larg/2),
                         (ym,comprimento-14),(yf0,comprimento-14-furo_larg/2),(yf0,14+furo_larg/2)]])
alca2d = contorno - furo
alca = alca2d.extrude(alca_esp).transform([[0,0,1,-alca_esp/2],[1,0,0,0],[0,1,0,0]])
corpo = corpo + alca
canal = varredura(False, -1, comprimento+1)
peca = corpo - canal
mesh = peca.to_mesh()
t = trimesh.Trimesh(mesh.vert_properties[:,:3], mesh.tri_verts)
t.export('dobrador_fita_drywall.stl')
print('fechada:', t.is_watertight, '| volume cm3:', round(t.volume/1000,1),
      '| medidas mm:', np.round(t.extents,1))
