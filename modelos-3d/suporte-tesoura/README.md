# Suporte para tesouras + organizador (impressão 3D)

Baseado na foto de referência: moldura quadrada com 3 furos redondos + 1 furo em trevo
no topo, e organizador de 2 compartimentos (traseiro alto, frontal baixo).

| Arquivo | Peça | Medidas (L × P × A) |
|---|---|---|
| `moldura_tesouras.stl` | porta-tesouras | 170 × 50 × 160 mm |
| `organizador.stl` | porta-objetos | 75 × 110 × 150 mm |
| `montagem_preview.stl` | só para visualizar as duas juntas (não imprimir) | — |

As peças são separadas: juntas teriam 247 mm de largura, maior que a mesa da maioria das impressoras.
Cole com cola de contato/epóxi ou use fita dupla-face se quiser fixar.

## Antes de imprimir
- **Meça suas tesouras.** Os furos têm 24 mm. A tesoura precisa passar a lâmina e parar no anel/parafuso.
  Altere `DIAM_FURO` em `gerar.py` e rode `python gerar.py` (requer `pip install manifold3d trimesh numpy`).

## Dicas de impressão
- Moldura: imprima **deitada de costas** (furos na horizontal). Em pé, a barra superior vira uma ponte de
  150 mm e precisa de suporte.
- Organizador: em pé, sem suporte.
- PLA/PETG preto fosco, 0,2 mm, 3 perímetros, 15–20% infill.
