// =====================================================================
//  TIMBRE SECO (RELEVO) - PRENSA DE ALAVANCA IMPRESSA EM 3D
//  Projetado para ABS em Creality K2 Pro (bico 0.4)
//
//  Exportar uma peca:
//    openscad -D 'peca="moldura"' -o moldura.stl timbre_seco.scad
//  pecas: "montagem", "moldura", "alavanca", "embolo",
//         "matriz_macho", "matriz_femea", "teste_folga"
//
//  Unidades: mm.  Eixos (montado): X = profundidade (+X = frente,
//  onde entra o papel), Y = largura, Z = altura.  Centro da marca em (0,0).
// =====================================================================

peca = "montagem";

// ---------------- ARTE ----------------
arte         = "majoli";        // "majoli" | "celare" | "texto"
texto_anel   = "MAJOLI • TIMBRE ORIGINAL • ";
texto_centro = "M";             // usado se logo_svg = ""
logo_svg     = "";              // ex.: "logo.svg" (1 cor, vetor)
logo_largura = 20;              // largura do logo no centro (mm)
fonte        = "DejaVu Sans:style=Bold";
tam_anel     = 3.6;             // altura do texto do anel
tam_centro   = 14;
engorda      = 0.12;            // engrossa traços finos (FDM)

diam_arte    = 40;              // diâmetro útil da arte
altura_relevo = 0.8;            // altura do relevo no macho
folga_matriz = 0.15;            // folga lateral fêmea x macho (por lado)
prof_femea   = 1.2;             // profundidade da cavidade da fêmea

// ---------------- MECÂNICA ----------------
W        = 56;      // largura da moldura (Y)
garganta = 55;      // centro da marca até a coluna = alcance no papel
col_d    = 40;      // profundidade da coluna
base_h   = 30;      // espessura da base
braco_z0 = 17;      // face inferior do braço
braco_h  = 24;      // espessura do braço
frente_base  = 45;
frente_braco = 32;

haste    = 20;      // lado do quadrado da haste do êmbolo
folga_guia = 0.20;  // folga haste x furo-guia (por lado)
chave    = 4;       // chanfro de um canto (impede montar girado)

diam_matriz = 50;
esp_macho   = 5;
bolso_macho = 4;    // profundidade do encaixe do macho na base
esp_femea   = 9;
sock_prof   = 5;    // encaixe da haste na fêmea
folga_encaixe = 0.15;

mola_d    = 7;      // furo da mola (mola de caneta até ~6.5 mm)
mola_prof = 10;
mola_y    = 21;
mola_comp = 7;      // vão mínimo braço-tampa (mola comprimida)

tampa_x = 16; tampa_y = 54; tampa_h = 8;

piv_x = -32;        // eixo da alavanca (parafuso M8)
alav_w = 24;        // largura da alavanca
alav_h = 36;        // altura da alavanca junto ao pivô
alav_comp = 180;    // até a ponta do cabo (x)
m8 = 8.4;

$fn = 64;

// ---------- derivadas (posição FECHADA, matrizes encostadas) ----------
face   = 1;                               // face das matrizes
z_tampa0 = braco_z0 + braco_h + mola_comp; // base da tampa
z_tampa1 = z_tampa0 + tampa_h;
z_alav0  = z_tampa1 + 2;                  // fundo da alavanca
piv_z    = z_alav0 + alav_h/2;
z_haste0 = face + esp_femea - sock_prof;
col_x0 = -garganta - col_d;
col_x1 = -garganta;

// =====================================================================
//  ARTE 2D
// =====================================================================
module anel(r1, r2) { difference() { circle(r2, $fn=180); circle(r1, $fn=180); } }

module texto_circular(t, r, tam) {
    n = len(t);
    for (i = [0:n-1])
        rotate(-(i - 2.5) * 360 / n)
            translate([0, r]) text(t[i], size=tam, font=fonte,
                                   halign="center", valign="center");
}

module centro2d() {
    if (logo_svg != "")
        resize([logo_largura, 0], auto=true) import(logo_svg, center=true);
    else
        text(texto_centro, size=tam_centro, font=fonte,
             halign="center", valign="center");
}

module logo(arquivo, largura=0, altura=0) {
    resize([largura, altura], auto=true) import(arquivo, center=true);
}

module arte2d() {
    R = diam_arte/2;
    offset(delta=engorda) union() {
        if (arte == "majoli") {
            // selo inteiro da Majoli (já tem moldura própria)
            logo("logos/majoli.svg", largura=36);
        } else if (arte == "celare") {
            anel(R - 1.0, R);
            translate([0, 5.5])  logo("logos/celare_simbolo.svg", altura=15);
            translate([0, -8.5]) logo("logos/celare_nome.svg", largura=27);
        } else {
            anel(R - 1.0, R);                       // borda externa 1.0
            anel(R - 7.0, R - 6.2);                 // borda interna 0.8
            texto_circular(texto_anel, R - 3.6, tam_anel);
            centro2d();
        }
    }
}

// =====================================================================
//  PERFIS
// =====================================================================
module perfil_haste() {   // quadrado a 45° (imprime sem ponte) com 1 canto chanfrado
    d = haste * sqrt(2) / 2;
    difference() {
        rotate(45) square(haste, center=true);
        translate([d - chave, -50]) square(100);
    }
}

module disco_matriz2d(chaveado) {
    difference() {
        circle(d=diam_matriz, $fn=128);
        if (chaveado) translate([diam_matriz/2 - 2, -50]) square(100);
    }
}

// =====================================================================
//  MATRIZES  (modeladas na posição montada)
// =====================================================================
module matriz_macho() {
    translate([0, 0, face - esp_macho]) linear_extrude(esp_macho) disco_matriz2d(true);
    // relevo com leve saída: base cheia + topo afinado
    translate([0, 0, face]) linear_extrude(altura_relevo * 0.6) arte2d();
    translate([0, 0, face + altura_relevo * 0.6])
        linear_extrude(altura_relevo * 0.4) offset(delta=-0.12) arte2d();
}

module matriz_femea() {
    difference() {
        translate([0, 0, face]) linear_extrude(esp_femea) disco_matriz2d(false);
        // cavidade (a boca é mais larga = saída)
        translate([0, 0, face - 0.01])
            linear_extrude(prof_femea * 0.5 + 0.01) offset(delta=folga_matriz) arte2d();
        translate([0, 0, face - 0.01])
            linear_extrude(prof_femea + 0.01) offset(delta=folga_matriz - 0.12) arte2d();
        // encaixe da haste
        translate([0, 0, face + esp_femea - sock_prof])
            linear_extrude(sock_prof + 1) offset(delta=folga_encaixe) perfil_haste();
        // furo para parafuso M3 auto-atarraxante de retenção (radial)
        translate([0, 0, face + esp_femea - sock_prof/2]) rotate([0, 0, 135])
            rotate([0, 90, 0]) cylinder(d=3.2, h=diam_matriz);
        // marca de orientação (seta para a frente) no dorso
        translate([diam_matriz/2 - 5, 0, face + esp_femea - 0.6])
            linear_extrude(1) polygon([[3, 0], [-1, 2.5], [-1, -2.5]]);
    }
}

// =====================================================================
//  ÊMBOLO (haste + tampa numa peça só)
// =====================================================================
module embolo() {
    difference() {
        union() {
            translate([0, 0, z_haste0]) linear_extrude(z_tampa0 - z_haste0) perfil_haste();
            translate([-tampa_x/2, -tampa_y/2, z_tampa0]) cube([tampa_x, tampa_y, tampa_h]);
        }
        // guias das molas na tampa
        for (s = [-1, 1]) translate([0, s * mola_y, z_tampa0 - 0.01])
            cylinder(d=mola_d, h=2);
        // furo piloto do parafuso de retenção
        translate([0, 0, face + esp_femea - sock_prof/2]) rotate([0, 0, 135])
            rotate([0, 90, 0]) cylinder(d=2.5, h=12);
    }
}

// =====================================================================
//  MOLDURA EM "C"
// =====================================================================
module perfil_moldura() {       // plano XZ
    r = 8;                      // raio de concordância nos cantos internos
    offset(r=-3) offset(r=3)    // arredonda cantos externos
    offset(r=r) offset(delta=-r) union() {
        translate([col_x0, -base_h]) square([frente_base - col_x0, base_h]);
        translate([col_x0, -base_h]) square([col_d, braco_z0 + braco_h + base_h]);
        translate([col_x0, braco_z0]) square([frente_braco - col_x0, braco_h]);
    }
    // filetes na garganta (alívio de tensão)
    difference() {
        translate([col_x1 - 1, -1]) square([r + 1, r + 1]);
        translate([col_x1 + r, r]) circle(r);
    }
    difference() {
        translate([col_x1 - 1, braco_z0 - r]) square([r + 1, r + 1]);
        translate([col_x1 + r, braco_z0 - r]) circle(r);
    }
    // torre do pivô
    hull() {
        translate([piv_x - 14, braco_z0 + braco_h - 1]) square([28, 1]);
        translate([piv_x, piv_z]) circle(14);
    }
}

module moldura() {
    difference() {
        rotate([90, 0, 0]) translate([0, 0, -W/2]) linear_extrude(W) perfil_moldura();

        // fenda da alavanca na torre
        translate([piv_x - 30, -(alav_w/2 + 0.4), braco_z0 + braco_h])
            cube([60, alav_w + 0.8, 100]);
        // eixo M8
        translate([piv_x, 0, piv_z]) rotate([90, 0, 0]) cylinder(d=m8, h=W + 2, center=true);

        // furo-guia do êmbolo
        translate([0, 0, braco_z0 - 1]) linear_extrude(braco_h + 2)
            offset(delta=folga_guia) perfil_haste();
        // molas
        for (s = [-1, 1]) translate([0, s * mola_y, braco_z0 + braco_h - mola_prof])
            cylinder(d=mola_d, h=mola_prof + 1);

        // encaixe da matriz macho + furo de extração
        translate([0, 0, -bolso_macho]) linear_extrude(bolso_macho + 1)
            offset(delta=0.2) disco_matriz2d(true);
        translate([0, 0, -base_h - 1]) cylinder(d=8, h=base_h);

        // linha de centro na frente da base e do braço (mira)
        for (zz = [-0.6, braco_z0 + braco_h - 0.6])
            translate([diam_matriz/2 + 2, -0.5, zz]) cube([40, 1, 1]);
        translate([frente_braco - 0.6, -0.5, braco_z0 - 1]) cube([1, 1, braco_h + 2]);

        // pés de borracha (Ø10) e furos para fixar na mesa (Ø5)
        for (px = [col_x0 + 12, frente_base - 12], py = [-W/2 + 10, W/2 - 10])
            translate([px, py, -base_h - 0.01]) cylinder(d=10.5, h=2);
        for (px = [col_x0 + 20, frente_base - 22])
            translate([px, 0, -base_h - 1]) cylinder(d=5, h=base_h + 2);
    }
}

// =====================================================================
//  ALAVANCA
// =====================================================================
module perfil_alavanca() {      // plano XZ
    R = 40;
    difference() {
        union() {
            hull() {
                translate([piv_x, piv_z]) circle(alav_h/2);
                translate([12, z_alav0]) square([1, alav_h]);
            }
            hull() {
                translate([12, z_alav0]) square([1, alav_h]);
                translate([alav_comp - 11, z_alav0 + 4]) square([1, 22]);
            }
            hull() {   // empunhadura
                translate([alav_comp - 11, z_alav0 + 4]) square([1, 22]);
                translate([alav_comp - 11, z_alav0 + 15]) circle(11);
            }
            // nariz (arco grande = menos pressão de contato no ABS)
            intersection() {
                translate([0, z_tampa1 + R]) circle(R, $fn=256);
                translate([-20, z_tampa1 - 1]) square([40, z_alav0 - z_tampa1 + 2]);
            }
        }
        translate([piv_x, piv_z]) circle(d=8.3);
    }
}

module alavanca() {
    rotate([90, 0, 0]) translate([0, 0, -alav_w/2])
        linear_extrude(alav_w) perfil_alavanca();
}

// =====================================================================
//  TESTE DE FOLGA  (3 pares: 0.15 / 0.25 / 0.35)
// =====================================================================
folgas_teste = [0.08, 0.11, 0.15];

module padrao_teste() {
    // traços de 0.6 / 0.8 / 1.0 / 1.2 mm + letras
    for (i = [0:3]) translate([-14 + i * 3.2, -6]) square([0.6 + i * 0.2, 12]);
    translate([2, 0]) text("Ma", size=6, font=fonte, halign="left", valign="center");
}

module rotulo_fundo(f) {   // gravado por baixo, legível olhando a peça de baixo
    translate([-2, -9, -0.01]) linear_extrude(0.6) mirror([1, 0, 0])
        text(str(f), size=4, font=fonte);
}

module teste_par(f) {
    // macho
    difference() {
        translate([-17, -10, 0]) cube([44, 20, 4]);
        rotulo_fundo(f);
    }
    translate([0, 0, 4]) linear_extrude(altura_relevo) padrao_teste();
    for (py = [-6, 6]) translate([22, py, 4]) cylinder(d=3, h=4);   // pinos guia
    // fêmea (impressa ao lado, face para cima; vira por cima do macho)
    translate([0, 26, 0]) difference() {
        translate([-17, -10, 0]) cube([44, 20, 4]);
        translate([0, 0, 4 - prof_femea]) linear_extrude(prof_femea + 1)
            mirror([0, 1, 0]) offset(delta=f) padrao_teste();
        for (py = [-6, 6]) translate([22, py, -1]) cylinder(d=3.4, h=10);
        rotulo_fundo(f);
    }
}

module teste_folga() {
    for (i = [0:len(folgas_teste) - 1])
        translate([i * 50, 0, 0]) teste_par(folgas_teste[i]);
}

// =====================================================================
//  SAÍDA
// =====================================================================
abertura = 4;   // só para a visualização da montagem

if (peca == "montagem") {
    color("SteelBlue")  moldura();
    color("Gold")       matriz_macho();
    translate([0, 0, abertura]) {
        color("Orange")     matriz_femea();
        color("Tomato")     embolo();
    }
    translate([piv_x, 0, piv_z]) rotate([0, -abertura / 32 * 57.3, 0])
        translate([-piv_x, 0, -piv_z]) color("DimGray") alavanca();
}
// orientações de impressão
else if (peca == "moldura")      rotate([-90, 0, 0]) translate([0, -W/2, 0]) moldura();      // deitada de lado
else if (peca == "alavanca")     rotate([-90, 0, 0]) translate([0, -alav_w/2, 0]) alavanca(); // deitada de lado
else if (peca == "embolo")       rotate([180, 0, 0]) translate([0, 0, -z_tampa1]) embolo(); // tampa na mesa
else if (peca == "matriz_macho") translate([0, 0, esp_macho - face]) matriz_macho();       // relevo para cima
else if (peca == "matriz_femea") rotate([180, 0, 0]) translate([0, 0, -(face + esp_femea)]) matriz_femea(); // cavidade para cima
else if (peca == "teste_folga")  teste_folga();
else if (peca == "arte")         arte2d();
