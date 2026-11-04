from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import DataBarRule, FormulaRule
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.comments import Comment
import datetime

NAVY="0D2A57"; NAVY2="163A70"; BLUE="2A6FC0"; GREEN="1F8A55"; GOLD="C98A12"; RED="C0392B"
SOFT="E8EEF7"; LINE="DFE4EC"; MUTED="5D6878"; INK="0F2140"; YEL="FFF4C2"
F="Arial"
def fill(c): return PatternFill("solid", start_color=c, end_color=c)
def font(sz=10, b=False, c=INK, i=False): return Font(name=F, size=sz, bold=b, color=c, italic=i)
thin=Side(style="thin", color=LINE)
CENTER=Alignment(horizontal="center", vertical="center", wrap_text=True)
LEFT=Alignment(horizontal="left", vertical="center", wrap_text=True)
ZERO='0;-0;"–"'

wb=Workbook()
rep=wb.active; rep.title="Report"
inp=wb.create_sheet("Input Data")
lst=wb.create_sheet("Daftar")

# ---------------- Daftar ----------------
periods=["Nov-2023 s.d Des-2024","Jan-2025 s.d Des-2025","Jan-2026 s.d Des-2026"]
projects=["Naraya Serpong","Bio District","Mazenta Residence","Banara Serpong"]
lst.column_dimensions["A"].width=2; lst.column_dimensions["B"].width=28; lst.column_dimensions["C"].width=3; lst.column_dimensions["D"].width=28
lst["B2"]="DAFTAR PERIODE & PROYEK"; lst["B2"].font=font(14,True,NAVY)
lst["B3"]="Nama di sini dipakai untuk pilihan dropdown di sheet Input Data dan judul baris di sheet Report."; lst["B3"].font=font(9,c=MUTED,i=True)
for col,title,items in (("B","Periode PPN DTP",periods),("D","Proyek",projects)):
    c=lst[f"{col}5"]; c.value=title; c.font=font(10,True,"FFFFFF"); c.fill=fill(NAVY); c.alignment=LEFT
    for k,v in enumerate(items):
        cc=lst[f"{col}{6+k}"]; cc.value=v; cc.font=font(10,c="0000FF"); cc.fill=fill(YEL); cc.border=Border(bottom=thin)
PER=[f"Daftar!$B${6+k}" for k in range(3)]
PRJ=[f"Daftar!$D${6+k}" for k in range(4)]

# ---------------- Input Data ----------------
widths={"A":2,"B":6,"C":26,"D":24,"E":15,"F":15,"G":15,"H":15,"I":28,"J":20}
for k,v in widths.items(): inp.column_dimensions[k].width=v
inp["B2"]="INPUT DATA BAST PPN DTP"; inp["B2"].font=font(14,True,NAVY)
inp["B3"]="Tanggal laporan"; inp["B3"].font=font(10,True)
inp["D3"]=datetime.date(2026,11,3); inp["D3"].number_format="dd-mm-yyyy"; inp["D3"].font=font(10,True,"0000FF"); inp["D3"].fill=fill(YEL); inp["D3"].alignment=Alignment(horizontal="left")
inp["B4"]=("Cara isi: ubah hanya sel berwarna kuning. Pilih Periode & Proyek dari dropdown, isi jumlah unit. "
           "Kosongkan atau isi 0 untuk tanda “–”. Sheet Report terhitung otomatis.")
inp.merge_cells("B4:J4"); inp["B4"].font=font(9,c=MUTED,i=True); inp["B4"].alignment=LEFT; inp.row_dimensions[4].height=28
hdr=["No","Periode PPN DTP","Proyek","BAST PPN DTP\n(unit)","Total Unit\nPPN DTP","BAST Non PPN DTP\n(unit)","Total Unit\nNon PPN DTP","Keterangan","Cek"]
for j,h in enumerate(hdr):
    c=inp.cell(row=6,column=2+j,value=h); c.font=font(10,True,"FFFFFF"); c.fill=fill(NAVY); c.alignment=CENTER
inp.row_dimensions[6].height=32
data=[(0,0,[13,13,8,8]),(0,1,[17,17,0,0]),
      (1,2,[1,1,0,0]),(1,0,[0,0,2,2]),(1,1,[6,6,1,2]),
      (2,0,[1,2,0,0]),(2,3,[0,1,0,0]),(2,1,[2,7,0,3]),(2,2,[2,2,0,0])]
FIRST,LAST=7,56
for r in range(FIRST,LAST+1):
    i=r-FIRST
    inp.cell(row=r,column=2,value=f'=IF(C{r}="","",ROW()-{FIRST-1})').font=font(10,c=MUTED)
    inp.cell(row=r,column=2).alignment=CENTER
    for col in range(3,10):
        c=inp.cell(row=r,column=col); c.fill=fill(YEL); c.font=font(10,c="0000FF"); c.border=Border(bottom=thin)
        if 5<=col<=8: c.alignment=CENTER; c.number_format=ZERO
    if i<len(data):
        p,q,d=data[i]
        inp.cell(row=r,column=3,value=periods[p]); inp.cell(row=r,column=4,value=projects[q])
        for k,v in enumerate(d): inp.cell(row=r,column=5+k,value=v)
    c=inp.cell(row=r,column=10,value=f'=IF(C{r}="","",IF(OR(E{r}>F{r},G{r}>H{r}),"BAST melebihi total","OK"))')
    c.font=font(10,True,GREEN); c.alignment=CENTER
inp.conditional_formatting.add(f"J{FIRST}:J{LAST}", FormulaRule(formula=[f'J{FIRST}="BAST melebihi total"'], font=Font(name=F,bold=True,color=RED)))
dv1=DataValidation(type="list", formula1="=Daftar!$B$6:$B$15", allow_blank=True); dv1.add(f"C{FIRST}:C{LAST}")
dv2=DataValidation(type="list", formula1="=Daftar!$D$6:$D$15", allow_blank=True); dv2.add(f"D{FIRST}:D{LAST}")
dv3=DataValidation(type="whole", operator="greaterThanOrEqual", formula1="0", allow_blank=True,
                   error="Isi angka bulat 0 atau lebih.", showErrorMessage=True); dv3.add(f"E{FIRST}:H{LAST}")
for dv in (dv1,dv2,dv3): inp.add_data_validation(dv)
inp.freeze_panes="B7"
inp["C7"].comment=Comment("Data awal diisi dari laporan 03-11-2026 yang Anda berikan.","Claude")

R=lambda col: f"'Input Data'!${col}${FIRST}:${col}${LAST}"
def S(col, per=None, prj=None):
    args=[R(col)]
    if per: args+= [R("C"),per]
    if prj: args+= [R("D"),prj]
    return f"SUMIFS({','.join(args)})" if (per or prj) else f"SUM({R(col)})"

# ---------------- Report ----------------
rep.sheet_view.showGridLines=False
rep.column_dimensions["A"].width=2
rep.column_dimensions["B"].width=32
for col in "CDEFGH": rep.column_dimensions[col].width=14
rep.column_dimensions["I"].width=2

def band(row, color, h=None):
    for col in "BCDEFGH": rep[f"{col}{row}"].fill=fill(color)
    if h: rep.row_dimensions[row].height=h
band(1,NAVY,24); band(2,NAVY,42); band(3,NAVY,22); band(4,NAVY2,24)
rep["B1"]="LAPORAN BAST"; rep["B1"].fill=fill(BLUE); rep["B1"].font=font(10,True,"FFFFFF"); rep["B1"].alignment=CENTER
rep.merge_cells("G1:H1"); rep["G1"]="='Input Data'!D3"; rep["G1"].number_format='[$-421]d mmmm yyyy'
rep["G1"].fill=fill(BLUE); rep["G1"].font=font(11,True,"FFFFFF"); rep["G1"].alignment=CENTER
rep.merge_cells("B2:H2"); rep["B2"]="REPORT BAST PROGRAM PPN DTP"; rep["B2"].font=font(22,True,"FFFFFF"); rep["B2"].alignment=Alignment(vertical="center",indent=1)
D="'Input Data'!$D$3"
rep.merge_cells("B3:H3")
rep["B3"]=(f'="Perubahan hari ini ("&RIGHT("0"&DAY({D}),2)&"-"&RIGHT("0"&MONTH({D}),2)&"-"&YEAR({D})&")   •   PPN DTP & Non PPN DTP   •   "'
           f'&COUNTA(Daftar!$B$6:$B$15)&" periode"')
rep["B3"].font=font(11,c="FFFFFF"); rep["B3"].alignment=Alignment(vertical="center",indent=1)
rep.merge_cells("B4:H4")
rep["B4"]=f'="Data BAST "&COUNTA(Daftar!$D$6:$D$15)&" proyek   •   "&COUNTA({R("C")})&" baris input"'
rep["B4"].font=font(10,c="FFFFFF"); rep["B4"].alignment=Alignment(vertical="center",indent=1)

# KPI tiles rows 6-9
TB=f"({S('E')}+{S('G')})"; TT=f"({S('F')}+{S('H')})"
tiles=[("B","B",GOLD,"TOTAL BAST",TB,TT,'"Seluruh periode & jenis"'),
       ("C","D",BLUE,"BAST PPN DTP",S('E'),S('F'),f'"Sisa "&({S("F")}-{S("E")})&" unit"'),
       ("E","F",GREEN,"BAST NON PPN DTP",S('G'),S('H'),f'"Sisa "&({S("H")}-{S("G")})&" unit"'),
       ("G","H",RED,"BELUM BAST",None,TT,f'"Dari "&{TT}&" unit total"')]
rep.row_dimensions[6].height=20; rep.row_dimensions[7].height=34; rep.row_dimensions[8].height=24; rep.row_dimensions[9].height=18
for a,b,col,lbl,bast,tot,note in tiles:
    for r in range(6,10):
        if a!=b: rep.merge_cells(f"{a}{r}:{b}{r}")
        rep[f"{a}{r}"].border=Border(left=Side(style="thick",color=col))
        rep[f"{a}{r}"].alignment=Alignment(vertical="center",indent=1)
    rep[f"{a}6"]=lbl; rep[f"{a}6"].font=font(9,True,MUTED)
    if bast:
        rep[f"{a}7"]=f'={bast}&" / "&{tot}&" unit"'
        rep[f"{a}8"]=f"=IFERROR({bast}/{tot},0)"
    else:
        rep[f"{a}7"]=f'=({TT}-{TB})&" unit"'
        rep[f"{a}8"]=f"=IFERROR(({TT}-{TB})/{TT},0)"
    rep[f"{a}7"].font=font(20,True,INK)
    rep[f"{a}8"].font=font(14,True,col); rep[f"{a}8"].number_format="0%"; rep[f"{a}8"].alignment=Alignment(horizontal="left",vertical="center",indent=1)
    rep[f"{a}9"]=f"={note}"; rep[f"{a}9"].font=font(9,c=MUTED)

def section(row,title,desc):
    rep[f"B{row}"]=title; rep[f"B{row}"].font=font(15,True,INK); rep.row_dimensions[row].height=26
    rep[f"B{row+1}"]=desc; rep[f"B{row+1}"].font=font(9,c=MUTED)

COLORS=[BLUE,GREEN,GOLD,NAVY2]
def barrow(row,name_ref,bast,tot,color):
    rep.row_dimensions[row].height=24
    rep[f"B{row}"]=f"={name_ref}"; rep[f"B{row}"].font=font(10,True,INK); rep[f"B{row}"].alignment=Alignment(vertical="center",indent=1)
    rep.merge_cells(f"C{row}:F{row}")
    rep[f"C{row}"]=f"=IFERROR({bast}/{tot},0)"; rep[f"C{row}"].number_format=";;;"
    rep.conditional_formatting.add(f"C{row}:F{row}", DataBarRule(start_type="num",start_value=0,end_type="num",end_value=1,color=color,showValue=False))
    rep[f"G{row}"]=f'={bast}&" / "&{tot}&" unit"'; rep[f"G{row}"].font=font(10,True,INK); rep[f"G{row}"].alignment=Alignment(horizontal="right",vertical="center")
    rep[f"H{row}"]=f"=IFERROR({bast}/{tot},0)"; rep[f"H{row}"].number_format="0%"; rep[f"H{row}"].font=font(11,True,BLUE); rep[f"H{row}"].alignment=Alignment(horizontal="right",vertical="center")
    for col in "BCDEFGH": rep[f"{col}{row}"].border=Border(bottom=thin)

section(11,"PROGRES BAST PER PERIODE","Unit sudah BAST dibanding total unit (PPN DTP + Non PPN DTP) per periode.")
for k,p in enumerate(PER):
    barrow(13+k,p,f"({S('E',per=p)}+{S('G',per=p)})",f"({S('F',per=p)}+{S('H',per=p)})",COLORS[k])
section(17,"PROGRES BAST PER PROYEK","Gabungan seluruh periode, PPN DTP dan Non PPN DTP.")
for k,q in enumerate(PRJ):
    barrow(19+k,q,f"({S('E',prj=q)}+{S('G',prj=q)})",f"({S('F',prj=q)}+{S('H',prj=q)})",COLORS[k])

section(24,"RINCIAN PER PERIODE & PROYEK","Angka dibaca “BAST dari total unit”. Tanda “–” berarti 0 unit.")
h1,h2=26,27
for col,v in zip("BCEG",["PROYEK","BAST PPN DTP","BAST NON PPN DTP","TOTAL"]):
    rep[f"{col}{h1}"]=v
rep.merge_cells(f"B{h1}:B{h2}"); rep.merge_cells(f"C{h1}:D{h1}"); rep.merge_cells(f"E{h1}:F{h1}"); rep.merge_cells(f"G{h1}:H{h1}")
for col,v in zip("CDEFGH",["BAST","Unit","BAST","Unit","BAST","Status"]): rep[f"{col}{h2}"]=v
for r in (h1,h2):
    rep.row_dimensions[r].height=22
    for col in "BCDEFGH":
        c=rep[f"{col}{r}"]; c.fill=fill(NAVY); c.alignment=CENTER
        c.font=font(10 if r==h1 else 9, r==h1, "FFFFFF")

row=h2+1
for k,p in enumerate(PER):
    rep.merge_cells(f"B{row}:H{row}")
    rep[f"B{row}"]=f'="PERIODE PPN DTP ("&{p}&")"'; rep[f"B{row}"].font=font(9,True,INK)
    rep[f"B{row}"].alignment=Alignment(vertical="center",indent=1)
    for col in "BCDEFGH": rep[f"{col}{row}"].fill=fill(SOFT)
    rep[f"B{row}"].border=Border(left=Side(style="thick",color=COLORS[k]))
    rep.row_dimensions[row].height=20
    row+=1
    for q in PRJ:
        rep[f"B{row}"]=f"={q}"
        rep[f"C{row}"]=f"={S('E',p,q)}"; rep[f"D{row}"]=f"={S('F',p,q)}"
        rep[f"E{row}"]=f"={S('G',p,q)}"; rep[f"F{row}"]=f"={S('H',p,q)}"
        rep[f"G{row}"]=f"=C{row}+E{row}"
        rep[f"H{row}"]=(f'=IF(D{row}+F{row}=0,"Tidak ada unit",IF(G{row}>=D{row}+F{row},"Selesai",'
                        f'IF(G{row}=0,"Belum · sisa "&(D{row}+F{row}),"Sisa "&(D{row}+F{row}-G{row})&" unit")))')
        rep.row_dimensions[row].height=22
        for col in "BCDEFGH":
            c=rep[f"{col}{row}"]; c.border=Border(bottom=thin); c.font=font(10,col in "BG",INK)
            c.alignment=CENTER if col!="B" else Alignment(vertical="center",indent=1)
            if col in "CDEFG": c.number_format=ZERO
        for col in "GH": rep[f"{col}{row}"].fill=fill(SOFT)
        rep[f"H{row}"].font=font(9,True,MUTED)
        row+=1
last_detail=row-1
rng=f"H{h2+1}:H{last_detail}"
for txt,colr in (("Selesai",GREEN),("Belum",RED),("Sisa",GOLD),("Tidak",MUTED)):
    rep.conditional_formatting.add(rng, FormulaRule(formula=[f'LEFT(H{h2+1},{len(txt)})="{txt}"'], font=Font(name=F,bold=True,color=colr)))
# grey-out project rows with no units
rep.conditional_formatting.add(f"B{h2+1}:G{last_detail}", FormulaRule(formula=[f'AND($D{h2+1}+$F{h2+1}=0,$B{h2+1}<>"",LEFT($B{h2+1},7)<>"PERIODE")'], font=Font(name=F,color="A7B0BD")))
# Total row
tr=row
rep[f"B{tr}"]="TOTAL"
for col,src in zip("CDEF","EFGH"): rep[f"{col}{tr}"]=f"={S(src)}"
rep[f"G{tr}"]=f"=C{tr}+E{tr}"
rep[f"H{tr}"]=f"=IFERROR(G{tr}/(D{tr}+F{tr}),0)"; rep[f"H{tr}"].number_format="0%"
rep.row_dimensions[tr].height=30
for col in "BCDEFGH":
    c=rep[f"{col}{tr}"]; c.fill=fill(SOFT); c.font=font(13,True,INK)
    c.border=Border(top=Side(style="medium",color=NAVY))
    c.alignment=CENTER if col!="B" else Alignment(vertical="center",indent=1)
    if col in "CDEFG": c.number_format=ZERO

# Catatan
nr=tr+2
rep.merge_cells(f"B{nr}:H{nr}"); rep[f"B{nr}"]="CATATAN PENTING"; rep[f"B{nr}"].font=font(11,True,INK)
notes=[f'="• BAST PPN DTP belum selesai: "&({S("F")}-{S("E")})&" unit dari "&{S("F")}&" unit."',
       f'="• BAST Non PPN DTP belum selesai: "&({S("H")}-{S("G")})&" unit dari "&{S("H")}&" unit."',
       '="• Lihat kolom Status pada tabel rincian untuk proyek yang masih ada sisa unit."',
       '="• Data diambil dari sheet Input Data. Untuk proyek atau periode baru, tambahkan namanya di sheet Daftar."']
for k,n in enumerate(notes):
    r=nr+1+k; rep.merge_cells(f"B{r}:H{r}"); rep[f"B{r}"]=n; rep[f"B{r}"].font=font(10,c=INK); rep.row_dimensions[r].height=18
for r in range(nr,nr+1+len(notes)):
    rep[f"B{r}"].fill=fill(SOFT); rep[f"B{r}"].border=Border(left=Side(style="thick",color=NAVY))
    rep[f"B{r}"].alignment=Alignment(vertical="center",indent=1)
    for col in "CDEFGH": rep[f"{col}{r}"].fill=fill(SOFT)

rep.page_setup.orientation="portrait"; rep.page_setup.fitToWidth=1; rep.page_setup.fitToHeight=0
rep.sheet_properties.pageSetUpPr.fitToPage=True
rep.print_area=f"A1:I{nr+len(notes)}"
import os; out=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","template","Report_BAST_PPN_DTP.xlsx")
wb.save(out); print(out, "detail rows end", last_detail, "total row", tr)
