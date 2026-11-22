# Timbre seco (relevo): prensa de alavanca impressa em 3D

Projeto paramétrico em OpenSCAD (`timbre_seco.scad`). Os STLs já exportados estão em `stl/`, cada um na orientação certa de impressão.

## Peças

| Arquivo | Qtd | Como imprimir |
|---|---|---|
| `teste_folga.stl` | 1 | **Imprima primeiro.** São 3 pares macho/fêmea com folgas de 0,15, 0,25 e 0,35 mm. |
| `moldura.stl` | 1 | Deitada de lado, como no arquivo. **Suporte só na fenda da torre** (entre as orelhas do pivô). |
| `alavanca.stl` | 1 | Deitada de lado, sem suporte. |
| `embolo.stl` | 1 | Tampa na mesa, haste para cima, sem suporte. |
| `matriz_macho_majoli.stl` + `matriz_femea_majoli.stl` | 1 par | Relevo / cavidade para cima. Selo da Majoli. |
| `matriz_macho_celare.stl` + `matriz_femea_celare.stl` | 1 par | Relevo / cavidade para cima. Símbolo + nome Celare. |

A prensa é uma só. Para trocar de marca, troque o par de matrizes: tire o M3 da fêmea e levante o macho pelo furo de baixo.

A moldura e a alavanca são impressas deitadas por um motivo: assim a flexão da prensa corre **ao longo** do filamento, e não entre as camadas, que é onde o ABS quebra.

## Configuração (ABS, K2 Pro)

- **Câmara**: fechada e aquecida, ventilador de peça em 0–15%, brim de 5 mm. ABS empena se a câmara não estiver quente.
- **Moldura e alavanca**: camada 0,2, **6 paredes**, 5 camadas de topo e de fundo, gyroid a 40%.
- **Êmbolo**: camada 0,2 e 100% de preenchimento.
- **Matrizes e teste**: camada **0,08–0,12**, 100% de preenchimento, velocidade baixa nas paredes externas. É aqui que está a qualidade do relevo.

## Ferragens

- 1 parafuso M8 × 70 com porca autotravante e 2 arruelas (eixo da alavanca)
- 1 parafuso M3 × 10 autoatarraxante (prende a matriz fêmea na haste)
- 2 molas de compressão de no máximo 6,5 mm de diâmetro e 20–25 mm de comprimento (mola de caneta serve)
- 4 pés de borracha de 10 mm (opcional)
- Graxa ou vaselina na haste do êmbolo

## Montagem

1. Encaixe as molas nos furos do topo do braço.
2. Passe o êmbolo **de cima para baixo** pelo furo-guia. Ele só entra numa posição, porque o canto chanfrado funciona como chave.
3. Por baixo, encaixe a matriz fêmea na ponta da haste, com a seta do dorso apontando para a frente. Prenda com o M3 pelo furo lateral.
4. Coloque a matriz macho no rebaixo da base, com a parte reta virada para a frente. Para tirar, empurre pelo furo de baixo.
5. Coloque a alavanca na fenda da torre e passe o M8. Aperte só até a alavanca girar sem folga.

## Calibração (não pule)

1. Coloque um pedaço do papel que você vai usar entre cada par do `teste_folga`. Os pinos alinham as peças. Aperte numa morsa ou com um sargento.
2. Escolha a folga que dá relevo nítido **sem rasgar** o papel.
   - Se rasgou nas bordas, a folga está pequena.
   - Se o relevo saiu mole ou arredondado, a folga está grande.
3. Veja também qual dos traços de teste (0,6, 0,8, 1,0 e 1,2 mm) ainda marca bem. Traço mais fino que esse não vai aparecer na arte.
4. Coloque a folga escolhida em `folga_matriz` no `.scad` e exporte a fêmea de novo. Se a sua mola for diferente, ajuste também `mola_prof` e `mola_comp`.

## Trocar a arte

No topo do `.scad`:
- `arte = "majoli"`, `"celare"` ou `"texto"`. Os logos vetorizados estão em `logos/`, gerados a partir do PNG com potrace.
- `texto_anel`: o texto em volta (só no modo `"texto"`).
- `logo_svg = "logo.svg"`: o logo no centro. Precisa ser vetor de uma cor só e ficar na mesma pasta.
- `logo_largura`, `tam_anel`, `engorda`: tamanho do logo, tamanho do texto do anel e espessura mínima dos traços.

Exportar uma peça:

```bash
openscad -D 'arte="celare"' -D 'peca="matriz_macho"' -o stl/matriz_macho_celare.stl timbre_seco.scad
```

A troca de arte exige reimprimir **só as duas matrizes**. A prensa continua a mesma.

## Limites conhecidos

- **Alcance**: o centro da marca fica a até 55 mm da borda do papel (`garganta`). Aumentar esse valor deixa a moldura mais flexível.
- **Força**: com uns 30 kgf na ponta do cabo, a alavanca de ~6,6:1 entrega cerca de 150–200 kgf na matriz. Isso basta para papel de 75 a ~180 g/m². Cartão grosso pode exigir prender a prensa na mesa (há 2 furos de Ø5 na base) e apoiar o peso do corpo no cabo.
- **Desgaste**: a matriz de ABS vai arredondando com o uso. Conte com algumas centenas de marcações nítidas. Depois disso, reimprima as matrizes, que são baratas e rápidas.
- **Áreas cheias grandes**, como o "M" do centro, marcam menos que traços. Um logo em contorno costuma ficar melhor.
